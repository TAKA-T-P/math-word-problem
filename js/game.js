// ゲーム状態の管理・問題進行・ハート管理・敵HP管理・タイマー管理・
// 正解/不正解後の処理・クリア/ゲームオーバー判定を担当するモジュール。

import { generateQuestion, planQuestionSequence, getCandidateTemplatesForSlot, getContentGroup } from "./question-generator.js";
import { checkAnswer } from "./answer-checker.js";
import { calculateQuestionScore, calculateRank, toTimeRatioPercent, formatFinalRank } from "./score.js";
import { loadHighScore, saveHighScoreIfBetter, loadSoundSetting, saveSoundSetting } from "./storage.js";
import { validateTemplateSet } from "./question-validator.js";
import { formatNumber, getDecimalPlaces } from "./number-utils.js";
import * as multiStepEngine from "./multi-step-engine.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";

// URL に ?debug=true を付けた場合だけ、問題ID・テンプレートID・単元・正解式・
// 生成された変数・現在のゲーム状態をコンソールと画面隅のデバッグパネルに表示する。
// 通常アクセス（パラメータなし）では一切表示しない。
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "true";

const ENEMY_LIST = [
  { emoji: "👹", name: "あかおに" },
  { emoji: "👺", name: "てんぐ" },
  { emoji: "👻", name: "おばけ" },
  { emoji: "🤖", name: "ロボット" },
  { emoji: "🐙", name: "タコンスター" },
  { emoji: "👽", name: "エイリアン" },
  { emoji: "🐲", name: "ドラゴン" }
];

const DAMAGE_ANIMATION_MS = 480;
const CLEAR_MESSAGE_DELAY_MS = 1400;
const GAMEOVER_MESSAGE_DELAY_MS = 1400;
const INTERMEDIATE_STEP_DELAY_MS = 900;

// ゲーム状態を1つのオブジェクトで一元管理する
const gameState = {
  screen: "title",
  gradeTerm: "4-1",
  level: 1,
  maxHearts: 3,
  hearts: 3,
  totalQuestions: 2,
  solvedQuestions: 0,
  score: 0,
  rank: "H",
  enemyHp: 100,
  enemy: null,
  currentProblem: null,
  currentQuestionRecord: null,
  currentQuestionPenalized: false,
  // その問題の履歴が history へ push 済みかどうか。handleCorrect（1問正解時）と
  // finishGame（リタイア/ゲームオーバー時）の両方から pushCurrentRecordToHistory が
  // 呼ばれうるため、二重登録を防ぐためのフラグ。
  historyPushed: false,
  currentQuestionDurationSec: 0,
  lastTemplateId: null,
  // 小学4年生2学期モード（gradeTerm: "4-2"）のときだけ使う、事前に決めた出題プラン
  // （新内容/復習内容・カテゴリの並び）。それ以外のモードでは null のまま。
  questionPlan: null,
  // 現在の問題が出題プランのどのスロットから生成されたか（デバッグ表示用）。
  currentSlot: null,
  // 同じゲーム内での重複出題（問題文の完全一致・同じ式）を避けるための記録。
  usedQuestionTexts: new Set(),
  usedFormulas: new Set(),
  history: [],
  timerRemainingRatio: 1,
  isInputLocked: false,
  isNoMiss: true,
  resultType: null,
  pendingOutcome: null // 正解演出後の遷移先: "next" | "clear"
};

let templateSets = {};
let isBusy = false;

// ---------- タイマー ----------
let timerHandle = null;
let timerActive = false;
let timerDurationMs = 0;
let timerRemainingMs = 0;
let timerLastTs = null;
let lastTimerRatio = 1;

function cancelTimerLoop() {
  if (timerHandle !== null) {
    cancelAnimationFrame(timerHandle);
    timerHandle = null;
  }
}

function timerLoop(ts) {
  if (!timerActive) return;
  if (timerLastTs === null) {
    timerLastTs = ts;
  }
  const delta = ts - timerLastTs;
  timerLastTs = ts;
  timerRemainingMs = Math.max(0, timerRemainingMs - delta);
  const ratio = timerDurationMs > 0 ? timerRemainingMs / timerDurationMs : 0;
  lastTimerRatio = ratio;
  gameState.timerRemainingRatio = ratio;
  ui.updateTimer(ratio * 100);

  if (timerRemainingMs <= 0) {
    timerActive = false;
    cancelTimerLoop();
    onTimerExpired();
    return;
  }
  timerHandle = requestAnimationFrame(timerLoop);
}

function startTimer(durationSec) {
  cancelTimerLoop();
  timerDurationMs = durationSec * 1000;
  timerRemainingMs = timerDurationMs;
  timerLastTs = null;
  lastTimerRatio = 1;
  timerActive = true;
  ui.updateTimer(100);
  timerHandle = requestAnimationFrame(timerLoop);
}

function resumeTimer() {
  if (timerRemainingMs <= 0 || timerActive) return;
  timerLastTs = null;
  timerActive = true;
  timerHandle = requestAnimationFrame(timerLoop);
}

function stopTimer() {
  timerActive = false;
  cancelTimerLoop();
}

// ---------- ユーティリティ ----------

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function pickRandomEnemy() {
  return ENEMY_LIST[Math.floor(Math.random() * ENEMY_LIST.length)];
}

function speedMultiplier(questionNumber, totalQuestions) {
  if (totalQuestions <= 1) return 1;
  return 1 + (0.5 * (questionNumber - 1)) / (totalQuestions - 1);
}

function formatFormula(answer) {
  if (!answer) return "（未回答）";
  return `${formatNumber(answer.left)}${answer.operator}${formatNumber(answer.right)}`;
}

function pushCurrentRecordToHistory() {
  if (gameState.historyPushed) return;
  const problem = gameState.currentProblem;

  if (problem && problem.questionType === "multiStep") {
    gameState.history.push(multiStepEngine.buildHistoryEntry(problem));
    gameState.historyPushed = true;
    return;
  }

  if (gameState.currentQuestionRecord) {
    gameState.history.push({ ...gameState.currentQuestionRecord, questionType: "singleStep", isComplete: true });
    gameState.currentQuestionRecord = null;
    gameState.historyPushed = true;
  }
}

/**
 * 出題範囲ごとのテンプレート集合を検証し、不正なテンプレートを出題プールから除外する。
 * questionType が multiStep のテンプレートも（"4-multi-step" のような専用の
 * gradeTerm に登録されていれば）通常どおり出題対象になる。
 * 除外したものはコンソールに理由を出力する。
 */
function filterValidTemplateSets(sets) {
  const filtered = {};
  for (const [gradeTerm, templates] of Object.entries(sets || {})) {
    const { results } = validateTemplateSet(templates);
    const byId = new Map(templates.map((t) => [t.id, t]));
    const validTemplates = [];

    for (const result of results) {
      if (!result.valid) {
        console.error(`[question-validator] テンプレート "${result.id}" (${gradeTerm}) は無効なため出題プールから除外します:`, result.errors);
        continue;
      }
      validTemplates.push(byId.get(result.id));
    }

    filtered[gradeTerm] = validTemplates;
  }
  return filtered;
}

function formatSolutionRoutes(problem) {
  const routes = problem.solutionRoutes && problem.solutionRoutes.length > 0 ? problem.solutionRoutes : [problem];
  return routes.map((r) => `${r.left}${r.operator}${r.right} = ${r.result}`).join(" / ");
}

/**
 * デバッグモード（?debug=true）のときだけ、問題の詳細と現在のゲーム状態を
 * コンソールと画面隅のデバッグパネルに出力する。
 * 2段階問題の場合は、進行状態（ステップ番号・候補ルート・中間結果など）も追加で出す。
 */
/**
 * 出題プラン（gameState.questionPlan）全体から、新内容/復習内容の数と
 * カテゴリ構成を集計する（ゲーム開始時に決めたプラン全体の構成を見るためのもの）。
 */
function summarizePlanComposition() {
  const byContentGroup = { new: 0, review: 0 };
  const byCategory = {};
  for (const slot of gameState.questionPlan || []) {
    byContentGroup[slot.contentGroup] = (byContentGroup[slot.contentGroup] || 0) + 1;
    const category = slot.contentGroup === "review" ? "復習内容(4-1全体)" : slot.category;
    byCategory[category] = (byCategory[category] || 0) + 1;
  }
  return { byContentGroup, byCategory };
}

function logDebugInfo() {
  if (!DEBUG_MODE) return;

  const problem = gameState.currentProblem;
  const isMultiStep = Boolean(problem && problem.questionType === "multiStep");
  const displayValues = {};
  const decimalPlacesByKey = {};
  if (problem && problem.values) {
    for (const [key, value] of Object.entries(problem.values)) {
      displayValues[key] = formatNumber(value);
      decimalPlacesByKey[key] = getDecimalPlaces(value);
    }
  }
  const composition = gameState.questionPlan ? summarizePlanComposition() : null;

  const lines = [
    `選択した出題範囲: ${gameState.gradeTerm}`,
    `questionType: ${problem ? problem.questionType : "(なし)"}`,
    `問題ID: ${problem ? problem.id : "(なし)"}`,
    `テンプレートID: ${problem ? problem.templateId : "(なし)"}`,
    `単元: ${problem ? problem.category : "(なし)"}`,
    `新内容／復習内容: ${problem && problem.template ? getContentGroup(problem.template) : "(なし)"}`,
    `生成に使用したgeneratorType: ${problem && problem.template ? problem.template.generatorType : "(なし)"}`,
    `正解式: ${problem ? formatSolutionRoutes(problem) : "(なし)"}`,
    `元の数値データ: ${problem ? JSON.stringify(problem.values || {}) : "(なし)"}`,
    `表示用数値: ${JSON.stringify(displayValues)}`,
    `小数点以下の桁数: ${JSON.stringify(decimalPlacesByKey)}`,
    composition ? `問題一覧の新内容/復習内容の数: ${JSON.stringify(composition.byContentGroup)}` : null,
    composition ? `問題一覧のカテゴリ構成: ${JSON.stringify(composition.byCategory)}` : null,
    `ゲーム状態: ${JSON.stringify({
      screen: gameState.screen,
      gradeTerm: gameState.gradeTerm,
      level: gameState.level,
      hearts: gameState.hearts,
      solvedQuestions: gameState.solvedQuestions,
      totalQuestions: gameState.totalQuestions,
      score: gameState.score,
      rank: gameState.rank,
      enemyHp: Math.round(gameState.enemyHp)
    })}`
  ].filter((line) => line !== null);

  if (isMultiStep) {
    const snapshot = multiStepEngine.getDebugSnapshot(problem);
    lines.push(
      `currentStepIndex: ${snapshot.currentStepIndex}`,
      `totalSteps: ${snapshot.totalSteps}`,
      `candidateRouteIds: ${JSON.stringify(snapshot.candidateRouteIds)}`,
      `intermediateResults: ${JSON.stringify(snapshot.intermediateResults)}`,
      `completedSteps: ${JSON.stringify(snapshot.completedSteps)}`,
      `currentQuestionPenalized(multiStep内部): ${snapshot.currentQuestionPenalized}`,
      `現在の段階で正解となる式: ${snapshot.currentCorrectFormulas.join(" , ")}`,
      `各解法ルートの状態: ${JSON.stringify(snapshot.routes)}`
    );
  }

  console.groupCollapsed("%c[DEBUG] 問題情報", "color:#3ddc84;font-weight:bold;");
  for (const line of lines) {
    console.log(line);
  }
  console.groupEnd();

  ui.updateDebugPanel(lines.join("\n"));
}

// ---------- 初期化 ----------

export function initGame(sets) {
  templateSets = filterValidTemplateSets(sets);
  audio.setSoundEnabled(loadSoundSetting());
  ui.setSoundIcon(audio.isSoundEnabled());
}

export function toggleSound() {
  audio.setSoundEnabled(!audio.isSoundEnabled());
  saveSoundSetting(audio.isSoundEnabled());
  ui.setSoundIcon(audio.isSoundEnabled());
}

// ---------- ゲーム開始 ----------

export function startNewGame(settings) {
  if (isBusy) return;

  audio.initAudio();

  gameState.gradeTerm = settings.gradeTerm;
  gameState.level = settings.level;
  gameState.maxHearts = 3;
  gameState.hearts = 3;
  gameState.totalQuestions = 2 * settings.level;
  gameState.solvedQuestions = 0;
  gameState.score = 0;
  gameState.rank = "H";
  gameState.enemyHp = 100;
  gameState.enemy = pickRandomEnemy();
  gameState.currentProblem = null;
  gameState.currentQuestionRecord = null;
  gameState.currentQuestionPenalized = false;
  gameState.lastTemplateId = null;
  gameState.history = [];
  gameState.isNoMiss = true;
  gameState.resultType = null;
  gameState.pendingOutcome = null;
  gameState.screen = "countdown";
  gameState.currentSlot = null;
  gameState.usedQuestionTexts = new Set();
  gameState.usedFormulas = new Set();
  // 小学4年生2学期モードだけ、新内容/復習内容がおよそ半分ずつになる出題プランを事前に決める。
  gameState.questionPlan =
    gameState.gradeTerm === "4-2" ? planQuestionSequence(gameState.totalQuestions, templateSets) : null;
  isBusy = false;

  ui.setEnemy(gameState.enemy);
  ui.updateHearts(gameState.hearts, gameState.maxHearts);
  ui.updateEnemyHp(gameState.enemyHp);
  ui.updateScoreboard(gameState.score, gameState.rank);

  ui.showScreen("countdown");
  runCountdown().then(() => {
    gameState.screen = "battle";
    ui.showScreen("battle");
    beginQuestion();
  });
}

async function runCountdown() {
  const steps = ["3", "2", "1", "START!"];
  for (let i = 0; i < steps.length; i++) {
    ui.setCountdownText(steps[i]);
    audio.playCountdown(i === steps.length - 1);
    await wait(700);
  }
}

// ---------- 問題進行 ----------

// 同じゲーム内で問題文・式が完全に重複するのを避けるための再抽選回数の上限。
// これだけ試しても新しい組み合わせが見つからない場合は、諦めてそのまま出題する
// （無限ループを避けるため）。
const MAX_DUPLICATE_AVOIDANCE_ATTEMPTS = 15;

function isDuplicateInThisGame(problem) {
  if (gameState.usedQuestionTexts.has(problem.text)) {
    return true;
  }
  if (problem.questionType === "singleStep") {
    const formulaKey = `${problem.left}${problem.operator}${problem.right}`;
    if (gameState.usedFormulas.has(formulaKey)) {
      return true;
    }
  }
  return false;
}

function generateNonDuplicateQuestion(candidateTemplates) {
  let problem = null;
  for (let attempt = 0; attempt < MAX_DUPLICATE_AVOIDANCE_ATTEMPTS; attempt++) {
    problem = generateQuestion(candidateTemplates, { excludeTemplateId: gameState.lastTemplateId });
    if (!isDuplicateInThisGame(problem)) {
      break;
    }
  }
  gameState.usedQuestionTexts.add(problem.text);
  if (problem.questionType === "singleStep") {
    gameState.usedFormulas.add(`${problem.left}${problem.operator}${problem.right}`);
  }
  return problem;
}

function beginQuestion() {
  const questionNumber = gameState.solvedQuestions + 1;

  let candidateTemplates;
  if (gameState.questionPlan) {
    const slot = gameState.questionPlan[gameState.solvedQuestions] || null;
    gameState.currentSlot = slot;
    candidateTemplates = getCandidateTemplatesForSlot(slot, templateSets);
  } else {
    gameState.currentSlot = null;
    candidateTemplates = templateSets[gameState.gradeTerm] || [];
  }

  const problem = generateNonDuplicateQuestion(candidateTemplates);

  gameState.currentProblem = problem;
  gameState.lastTemplateId = problem.templateId;
  gameState.currentQuestionPenalized = false;
  gameState.historyPushed = false;

  if (problem.questionType === "multiStep") {
    // 2段階問題の進行状態は problem.multiStep（multi-step-engine.js が管理）に
    // 保持されているため、gameState.currentQuestionRecord は使わない。
    gameState.currentQuestionRecord = null;
  } else {
    gameState.currentQuestionRecord = {
      category: problem.category,
      text: problem.text,
      left: problem.left,
      operator: problem.operator,
      right: problem.right,
      result: problem.result,
      answerUnit: problem.answerUnit,
      incorrectCount: 0,
      timeoutCount: 0,
      lastAttemptText: "（未回答）"
    };
  }

  const initialTimeLimitSec = 120 / gameState.level;
  const multiplier = speedMultiplier(questionNumber, gameState.totalQuestions);
  gameState.currentQuestionDurationSec = initialTimeLimitSec / multiplier;

  ui.renderProblem(problem);
  ui.unlockInput();
  isBusy = false;
  startTimer(gameState.currentQuestionDurationSec);
  logDebugInfo();
}

// ---------- 判定 ----------

export function handleJudge(answer) {
  if (isBusy || !gameState.currentProblem) return;
  isBusy = true;
  stopTimer();

  const problem = gameState.currentProblem;

  if (problem.questionType === "multiStep") {
    handleMultiStepJudge(problem, answer);
    return;
  }

  gameState.currentQuestionRecord.lastAttemptText = formatFormula(answer);

  const { correct, result } = checkAnswer(problem, answer.left, answer.operator, answer.right);

  if (correct) {
    handleCorrect(result);
  } else {
    gameState.currentQuestionRecord.incorrectCount += 1;
    gameState.currentQuestionPenalized = true;
    gameState.isNoMiss = false;
    handleIncorrectOrTimeout();
  }
}

/**
 * 2段階問題の「＝」判定。1つ目の式が正解なら途中経過として処理し、
 * 2つ目（最終）の式が正解なら既存の1問正解フロー（handleCorrect）に合流する。
 * 不正解の場合は、既存の不正解フロー（handleIncorrectOrTimeout）をそのまま使う
 * （ステップ番号・中間結果は multi-step-engine.js 側で維持されるため、
 * ここで意識する必要はない）。
 */
function handleMultiStepJudge(problem, answer) {
  const outcome = multiStepEngine.submitStepAnswer(problem, answer.left, answer.operator, answer.right);

  if (!outcome.correct) {
    gameState.currentQuestionPenalized = true;
    gameState.isNoMiss = false;
    logDebugInfo();
    handleIncorrectOrTimeout();
    return;
  }

  if (outcome.isFinal) {
    handleCorrect(outcome.stepResult);
    return;
  }

  handleIntermediateStepCorrect(problem, outcome.stepResult);
}

/**
 * 2段階問題で、1つ目の式に正解したときの処理。
 * 敵HP・スコア・正解数・履歴は変更しない（最終式に正解したときだけ変更する）。
 * 短い演出の間はタイマーを止めたままにし、演出後に残り時間から再開する
 * （＝タイマーは全回復しない）。演出中は「＝」連打で2問目まで自動的に
 * 進んでしまわないよう、入力ロックを維持したままにする。
 */
function handleIntermediateStepCorrect(problem, stepResult) {
  audio.playCorrect();
  ui.showIntermediateStepEffect(stepResult);
  logDebugInfo();

  window.setTimeout(() => {
    ui.hideIntermediateStepEffect();
    ui.renderStepChoices(problem);
    resumeTimer();
    ui.unlockInput();
    isBusy = false;
  }, INTERMEDIATE_STEP_DELAY_MS);
}

function onTimerExpired() {
  if (isBusy || !gameState.currentProblem) return;
  isBusy = true;

  const problem = gameState.currentProblem;
  const placed = ui.getPlacedAnswer();

  if (problem.questionType === "multiStep") {
    multiStepEngine.recordTimeout(problem, placed);
  } else {
    if (placed) {
      gameState.currentQuestionRecord.lastAttemptText = formatFormula(placed);
    }
    gameState.currentQuestionRecord.timeoutCount += 1;
  }

  gameState.currentQuestionPenalized = true;
  gameState.isNoMiss = false;
  logDebugInfo();
  handleIncorrectOrTimeout();
}

function handleCorrect(resultValue) {
  const questionNumber = gameState.solvedQuestions + 1;

  audio.playCorrect();
  ui.triggerEnemyShake();

  const damagePerQuestion = 100 / gameState.totalQuestions;
  gameState.enemyHp = Math.max(0, gameState.enemyHp - damagePerQuestion);
  if (questionNumber >= gameState.totalQuestions) {
    gameState.enemyHp = 0;
  }
  ui.updateEnemyHp(gameState.enemyHp);

  const timeRatioPercent = gameState.currentQuestionPenalized ? 0 : toTimeRatioPercent(lastTimerRatio);
  const addedScore = calculateQuestionScore(questionNumber, timeRatioPercent);
  gameState.score += addedScore;
  gameState.rank = calculateRank(gameState.score, gameState.level);
  ui.updateScoreboard(gameState.score, gameState.rank);

  gameState.solvedQuestions += 1;
  pushCurrentRecordToHistory();

  gameState.pendingOutcome = gameState.solvedQuestions >= gameState.totalQuestions ? "clear" : "next";
  ui.showCorrectEffect(resultValue);
  // isBusy は「タップして次へ」が押されるまで true のまま維持し、連続タップを防ぐ
  logDebugInfo();
}

export function handleNextTap() {
  ui.hideCorrectEffect();
  if (gameState.pendingOutcome === "clear") {
    finishGame("clear");
  } else {
    beginQuestion();
  }
}

function handleIncorrectOrTimeout() {
  audio.playDamage();
  ui.triggerDamageEffect();
  gameState.hearts = Math.max(0, gameState.hearts - 1);
  ui.updateHearts(gameState.hearts, gameState.maxHearts);
  ui.clearAnswerSlots();
  logDebugInfo();

  window.setTimeout(() => {
    if (gameState.hearts <= 0) {
      finishGame("gameover");
    } else {
      startTimer(gameState.currentQuestionDurationSec);
      ui.unlockInput();
      isBusy = false;
    }
  }, DAMAGE_ANIMATION_MS);
}

// ---------- リタイア ----------

export function pauseForRetireDialog() {
  stopTimer();
}

export function cancelRetire() {
  resumeTimer();
}

export function confirmRetire() {
  finishGame("retire");
}

// ---------- 終了処理 ----------

function finishGame(type) {
  stopTimer();
  isBusy = true;
  pushCurrentRecordToHistory();
  gameState.resultType = type;

  const proceed = () => {
    const isNewRecord = saveHighScoreIfBetter(gameState.gradeTerm, gameState.level, gameState.score);
    const highScore = loadHighScore(gameState.gradeTerm, gameState.level);

    let title;
    let variant;
    const isNoMissClear = type === "clear" && gameState.isNoMiss;

    if (type === "clear") {
      title = isNoMissClear ? "ノーミスクリア！" : "クリア！";
      variant = "clear";
    } else if (type === "gameover") {
      title = "ゲームオーバー！";
      variant = "gameover";
    } else {
      title = "リタイア";
      variant = "retire";
    }

    const finalRank = formatFinalRank(gameState.rank, isNoMissClear);

    ui.showResultScreen({
      title,
      variant,
      gradeTerm: gameState.gradeTerm,
      level: gameState.level,
      correctCount: gameState.solvedQuestions,
      heartsRemaining: gameState.hearts,
      maxHearts: gameState.maxHearts,
      score: gameState.score,
      rank: finalRank,
      highScore,
      isNewRecord,
      history: gameState.history
    });
    gameState.screen = "result";
    ui.showScreen("result");
    isBusy = false;
    logDebugInfo();
  };

  if (type === "clear") {
    audio.playEnemyDefeated();
    ui.triggerEnemyDefeatEffect();
    ui.showBattleMessage("エネミーを倒した！", "clear");
    window.setTimeout(proceed, CLEAR_MESSAGE_DELAY_MS);
  } else if (type === "gameover") {
    audio.playGameOver();
    ui.showBattleMessage("ゲームオーバー！", "gameover");
    window.setTimeout(proceed, GAMEOVER_MESSAGE_DELAY_MS);
  } else {
    proceed();
  }
}

// ---------- リトライ／タイトルへ戻る ----------

export function retryGame() {
  startNewGame({ gradeTerm: gameState.gradeTerm, level: gameState.level });
}

export function returnToTitle() {
  stopTimer();
  isBusy = false;
  gameState.screen = "title";
  ui.showScreen("title");
}
