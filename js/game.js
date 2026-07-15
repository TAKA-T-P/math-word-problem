// ゲーム状態の管理・問題進行・ハート管理・敵HP管理・タイマー管理・
// 正解/不正解後の処理・クリア/ゲームオーバー判定を担当するモジュール。

import {
  generateQuestion,
  planQuestionSequence,
  planQuestionSequenceThreeGroup,
  getCandidateTemplatesForSlot,
  getContentGroup,
  shouldDisplayFractionsUnsimplified
} from "./question-generator.js";
import { checkAnswer } from "./answer-checker.js";
import { calculateQuestionScore, calculateRank, toTimeRatioPercent, formatFinalRank } from "./score.js";
import {
  loadHighScore,
  saveHighScoreIfBetter,
  loadSoundSetting,
  saveSoundSetting,
  loadGrade6Term3RotationIndex,
  saveGrade6Term3RotationIndex
} from "./storage.js";
import { filterValidTemplateSets } from "./question-validator.js";
import { getDecimalPlaces } from "./number-utils.js";
import { formatValue, isFractionValue, computeUnsimplifiedFractionResult } from "./value-utils.js";
import { renderValueHtml } from "./value-renderer.js";
import { gcd, simplifyFraction } from "./fraction-utils.js";
import { ENEMY_LIST } from "./enemy-list.js";
import * as multiStepEngine from "./multi-step-engine.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";

// URL に ?debug=true を付けた場合だけ、問題ID・テンプレートID・単元・正解式・
// 生成された変数・現在のゲーム状態をコンソールと画面隅のデバッグパネルに表示する。
// 通常アクセス（パラメータなし）では一切表示しない。
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "true";

// 出題プラン（新内容/復習内容がおよそ半分ずつになる仕組み）を使うモード。
// 4-2（小学4年生2学期）・4-3（小学4年生3学期）・5-1（小学5年生1学期）・5-2（小学5年生2学期）・
// 5-3（小学5年生3学期）・6-1（小学6年生1学期）・6-2（小学6年生2学期）が対象。
const PLANNED_GRADE_TERMS = new Set(["4-2", "4-3", "5-1", "5-2", "5-3", "6-1", "6-2"]);

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
  pendingOutcome: null, // 正解演出後の遷移先: "next" | "clear"
  // 正解した瞬間に回復させた解答時間ゲージの割合（0〜1）。次の問題の開始時にこの割合から
  // タイマーを始める（以前は毎回100%から始めていたが、正解のタイミングで回復する方式に変更）。
  // 不正解・時間切れで同じ問題を再挑戦する場合はこの値を使わず、常に100%に戻す。
  nextQuestionStartRatio: 1
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

// 解答時間ゲージが減っている間、「カチカチ」と時計の秒針のような音を鳴らす。
// ゲージ残量が50%以上のときは1秒おき、50%未満のときは0.5秒おきに鳴らす
// （残り時間が少なくなるほど鳴る間隔が短くなり、焦りを演出する）。
// 正解・不正解・時間切れ・リタイアなど、タイマーが止まるタイミングと連動して必ず止める。
const TICK_INTERVAL_FAST_MS = 500;
const TICK_INTERVAL_SLOW_MS = 1000;
const TICK_INTERVAL_RATIO_THRESHOLD = 0.5;
let tickIntervalHandle = null;
let currentTickIntervalMs = null;

function tickIntervalMsForRatio(ratio) {
  return ratio >= TICK_INTERVAL_RATIO_THRESHOLD ? TICK_INTERVAL_SLOW_MS : TICK_INTERVAL_FAST_MS;
}

function startTickSound(ratio = lastTimerRatio) {
  stopTickSound();
  currentTickIntervalMs = tickIntervalMsForRatio(ratio);
  tickIntervalHandle = window.setInterval(() => {
    audio.playTick();
  }, currentTickIntervalMs);
}

function stopTickSound() {
  if (tickIntervalHandle !== null) {
    window.clearInterval(tickIntervalHandle);
    tickIntervalHandle = null;
  }
  currentTickIntervalMs = null;
}

/**
 * タイマーが動いている間、毎フレーム呼び出して、ゲージ残量が50%のしきい値をまたいだら
 * カチカチ音の間隔（0.5秒⇔1秒）を切り替えます。タイマーが止まっている間は何もしません。
 */
function updateTickSoundIntervalForRatio(ratio) {
  if (tickIntervalHandle === null) return;
  const desiredIntervalMs = tickIntervalMsForRatio(ratio);
  if (desiredIntervalMs !== currentTickIntervalMs) {
    startTickSound(ratio);
  }
}

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
  ui.updateEnemyDangerGlow(ratio);
  updateTickSoundIntervalForRatio(ratio);

  if (timerRemainingMs <= 0) {
    timerActive = false;
    cancelTimerLoop();
    stopTickSound();
    onTimerExpired();
    return;
  }
  timerHandle = requestAnimationFrame(timerLoop);
}

/**
 * 解答時間タイマーを開始します。startRatio（既定1=100%）を指定すると、
 * その割合からタイマーを始めます。正解のタイミングで回復させた割合を引き継いで
 * 次の問題を始めるときに使います（不正解・時間切れ後に同じ問題を再挑戦する場合は、
 * 呼び出し側が startRatio を指定せず常に100%から始めます）。
 */
function startTimer(durationSec, startRatio = 1) {
  cancelTimerLoop();
  timerDurationMs = durationSec * 1000;
  const clampedRatio = Math.max(0, Math.min(1, startRatio));
  timerRemainingMs = timerDurationMs * clampedRatio;
  timerLastTs = null;
  lastTimerRatio = clampedRatio;
  timerActive = true;
  ui.updateTimer(clampedRatio * 100);
  ui.updateEnemyDangerGlow(clampedRatio);
  timerHandle = requestAnimationFrame(timerLoop);
  startTickSound();
}

function resumeTimer() {
  if (timerRemainingMs <= 0 || timerActive) return;
  timerLastTs = null;
  timerActive = true;
  timerHandle = requestAnimationFrame(timerLoop);
  startTickSound();
}

/**
 * 解答時間ゲージを、指定した割合（0〜1）分だけ上乗せして回復させてから再開します
 * （現在の残量に加算するため、すでに残量が多い場合はその分さらに多く回復し、100%を超える分は切り捨てます）。
 * 2段階問題の途中式（第1段階）に正解したときに、レベルに応じた割合だけゲージを回復させる
 * ために使います（recoveryAmountForLevel()参照）。
 */
function resumeTimerWithPartialRecovery(recoveryRatio) {
  if (timerDurationMs > 0) {
    const currentRatio = Math.min(1, timerRemainingMs / timerDurationMs);
    const recoveredRatio = Math.min(1, currentRatio + recoveryRatio);
    timerRemainingMs = timerDurationMs * recoveredRatio;
    lastTimerRatio = recoveredRatio;
    gameState.timerRemainingRatio = recoveredRatio;
    ui.updateTimer(recoveredRatio * 100);
    ui.updateEnemyDangerGlow(recoveredRatio);
  }
  resumeTimer();
}

function stopTimer() {
  timerActive = false;
  cancelTimerLoop();
  stopTickSound();
}

// ---------- ユーティリティ ----------

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * 選んだレベル（内部レベル。レベルMAXは6）以下の minLevel を持つエネミーの中から
 * ランダムに1体選ぶ（js/enemy-list.js の ENEMY_LIST が単一の情報源）。
 * 該当するエネミーが1体も無い場合（データ不整合時の安全策）は、全エネミーから選ぶ。
 */
function pickRandomEnemy(level) {
  const pool = ENEMY_LIST.filter((enemy) => enemy.minLevel <= level);
  const candidates = pool.length > 0 ? pool : ENEMY_LIST;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// 最終問題の解答時間は、1問目のちょうど2倍の速さ（＝時間は半分）になるよう線形に加速する。
function speedMultiplier(questionNumber, totalQuestions) {
  if (totalQuestions <= 1) return 1;
  return 1 + (questionNumber - 1) / (totalQuestions - 1);
}

/**
 * 正解時に解答時間ゲージへ上乗せする回復量（0〜1の割合）を、内部レベル（レベルMAXは6）から求めます。
 * 回復量(%) = 90 − 10×レベル（レベルMAXは 90−10×6=30%）。
 * 2段階問題の途中式（第1段階）正解時は、この半分の量を使います（handleIntermediateStepCorrect参照）。
 */
function recoveryAmountForLevel(level) {
  return Math.max(0, 90 - 10 * level) / 100;
}

/**
 * 内部レベル（レベルMAXは6として扱う）から、初期ハート数を求めます。
 * レベル1〜4は3個、レベル5・レベルMAX（=6）は2個。
 */
/**
 * 内部レベル（1〜6）を、デバッグ表示用の表示レベル文字列に変換する（6だけ"MAX"）。
 * ui.js の formatLevelLabel() と同じ考え方だが、こちらはデバッグパネル専用の軽量な複製。
 */
function formatDisplayLevelForDebug(level) {
  return level === 6 ? "MAX" : String(level);
}

function heartsForLevel(level) {
  if (level <= 4) return 3;
  return 2;
}

// value-renderer.js の renderValueHtml() を使うことで、分数を含む式でも
// 縦型分数のHTMLとして履歴（さいごに作った式）に表示できるようにしている。
// 整数・小数の場合は従来と同じ見た目の文字列になる。
function formatFormula(answer) {
  if (!answer) return "（未回答）";
  return `${renderValueHtml(answer.left)}${answer.operator}${renderValueHtml(answer.right)}`;
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

function formatSolutionRoutes(problem) {
  // 2段階問題のルートは {id, steps:[...]} という形で、1段階問題の {left,operator,right,result} とは
  // 構造が異なるため、questionType に応じてフォーマット方法を分ける
  // （分けないと "undefinedundefinedundefined = undefined" のような表示になってしまう）。
  const simplify = problem.simplifyFractions !== false;
  if (problem.questionType === "multiStep") {
    return (problem.solutionRoutes || [])
      .map(
        (route) =>
          `[${route.id}] ` +
          route.steps
            .map((s) => `${formatValue(s.left, { simplify })}${s.operator}${formatValue(s.right, { simplify })}=${formatValue(s.result, { simplify })}`)
            .join(" → ")
      )
      .join(" / ");
  }
  const routes = problem.solutionRoutes && problem.solutionRoutes.length > 0 ? problem.solutionRoutes : [problem];
  return routes
    .map((r) => {
      const displayResult = simplify ? r.result : computeUnsimplifiedFractionResult(r.left, r.operator, r.right) ?? r.result;
      return `${formatValue(r.left, { simplify })}${r.operator}${formatValue(r.right, { simplify })} = ${formatValue(displayResult, { simplify })}`;
    })
    .join(" / ");
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
  // 小学6年生3学期（第12段階）のグループA/B/C集計。他のモードでは全て0のまま。
  const questionGroupCounts = { grade5: 0, grade6Review: 0, grade6Term3: 0 };
  for (const slot of gameState.questionPlan || []) {
    byContentGroup[slot.contentGroup] = (byContentGroup[slot.contentGroup] || 0) + 1;
    const category =
      slot.contentGroup === "review" ? `復習内容(${slot.reviewGradeTerm || "-"}:${slot.category || "-"})` : slot.category;
    byCategory[category] = (byCategory[category] || 0) + 1;
    if (slot.questionGroup && Object.prototype.hasOwnProperty.call(questionGroupCounts, slot.questionGroup)) {
      questionGroupCounts[slot.questionGroup] += 1;
    }
  }
  return { byContentGroup, byCategory, questionGroupCounts };
}

/**
 * problem.values の各値（数値・分数）を、デバッグ表示用に詳しく説明するオブジェクトへ変換する。
 * 分数は、分子・分母・最大公約数・約分後の値まで表示する（?debug=true 専用）。
 */
function describeValuesForDebug(values) {
  const result = {};
  for (const [key, value] of Object.entries(values || {})) {
    if (isFractionValue(value)) {
      const simplified = simplifyFraction(value);
      result[key] = {
        type: "fraction",
        numerator: value.numerator,
        denominator: value.denominator,
        gcd: gcd(value.numerator, value.denominator),
        simplifiedNumerator: simplified.numerator,
        simplifiedDenominator: simplified.denominator,
        display: formatValue(value)
      };
    } else {
      result[key] = {
        type: "number",
        value,
        decimalPlaces: getDecimalPlaces(value),
        display: formatValue(value)
      };
    }
  }
  return result;
}

/**
 * 現在の問題の出題プラン上の区分（新内容/復習内容。復習内容ならどの学期のどのカテゴリか）を
 * デバッグ表示用の文字列にする。出題プランを使わないモード（4-1・開発版）では、
 * テンプレート単体から大まかに判定した区分（getContentGroup）にフォールバックする。
 */
function describeContentGroupForDebug(problem) {
  if (gameState.currentSlot) {
    const slot = gameState.currentSlot;
    return slot.contentGroup === "review"
      ? `review（復習内容／${slot.reviewGradeTerm || "-"}／${slot.category || "-"}）`
      : `new（新内容／${slot.category || "-"}）`;
  }
  return problem && problem.template ? getContentGroup(problem.template) : "(なし)";
}

function logDebugInfo() {
  if (!DEBUG_MODE) return;

  const problem = gameState.currentProblem;
  const isMultiStep = Boolean(problem && problem.questionType === "multiStep");
  const valueDetails = problem ? describeValuesForDebug(problem.values) : {};
  const composition = gameState.questionPlan ? summarizePlanComposition() : null;
  const fractionCardIds = problem
    ? problem.choices.filter((c) => isFractionValue(c.value)).map((c) => c.cardId)
    : [];
  const displayHtmlByKey = {};
  if (problem && problem.values) {
    for (const [key, value] of Object.entries(problem.values)) {
      displayHtmlByKey[key] = renderValueHtml(value);
    }
  }

  const lines = [
    `選択した出題範囲: ${gameState.gradeTerm}`,
    `questionType: ${problem ? problem.questionType : "(なし)"}`,
    `問題ID: ${problem ? problem.id : "(なし)"}`,
    `テンプレートID: ${problem ? problem.templateId : "(なし)"}`,
    `単元: ${problem ? problem.category : "(なし)"}`,
    `新内容／復習内容: ${describeContentGroupForDebug(problem)}`,
    `生成に使用したgeneratorType: ${problem && problem.template ? problem.template.generatorType : "(なし)"}`,
    `正解式: ${problem ? formatSolutionRoutes(problem) : "(なし)"}`,
    `元の数値データ: ${problem ? JSON.stringify(problem.values || {}) : "(なし)"}`,
    `値の詳細(型・分数の分子分母・最大公約数・約分後・表示用): ${JSON.stringify(valueDetails)}`,
    `表示用HTML: ${JSON.stringify(displayHtmlByKey)}`,
    fractionCardIds.length > 0 ? `分数カードの一意ID: ${fractionCardIds.join(", ")}` : null,
    composition ? `問題一覧の新内容/復習内容の数: ${JSON.stringify(composition.byContentGroup)}` : null,
    composition ? `問題一覧のカテゴリ構成: ${JSON.stringify(composition.byCategory)}` : null,
    // 小学6年生3学期（第12段階）のグループA/B/C集計。他のモードでは表示しない。
    gameState.gradeTerm === "6-3" && composition
      ? `questionGroupCounts: ${JSON.stringify(composition.questionGroupCounts)}`
      : null,
    gameState.gradeTerm === "6-3" && gameState.currentSlot
      ? `questionGroup(現在の問題): ${gameState.currentSlot.questionGroup || "-"}`
      : null,
    `表示レベル: ${formatDisplayLevelForDebug(gameState.level)} / 内部レベル: ${gameState.level}`,
    `必要正解数: ${gameState.totalQuestions} / ハート数: ${gameState.maxHearts} / 初期制限時間: ${Math.round(120 / gameState.level)}秒`,
    `現在のタイマー加速倍率: ${speedMultiplier(gameState.solvedQuestions + 1, gameState.totalQuestions).toFixed(3)}倍 / 最大タイマー加速倍率: 2.0倍`,
    `スコア倍率: 4 / ランク係数: 1600${gameState.level === 6 ? "（MAXのランク分母: 9600）" : ""}`,
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
  gameState.maxHearts = heartsForLevel(settings.level);
  gameState.hearts = gameState.maxHearts;
  gameState.totalQuestions = 2 * settings.level;
  gameState.solvedQuestions = 0;
  gameState.score = 0;
  gameState.rank = "H";
  gameState.enemyHp = 100;
  gameState.enemy = pickRandomEnemy(settings.level);
  gameState.currentProblem = null;
  gameState.currentQuestionRecord = null;
  gameState.currentQuestionPenalized = false;
  gameState.lastTemplateId = null;
  gameState.history = [];
  gameState.isNoMiss = true;
  gameState.resultType = null;
  gameState.pendingOutcome = null;
  gameState.nextQuestionStartRatio = 1;
  gameState.screen = "countdown";
  gameState.currentSlot = null;
  gameState.usedQuestionTexts = new Set();
  gameState.usedFormulas = new Set();
  // 4-2（2学期）・4-3（3学期）モードだけ、新内容/復習内容がおよそ半分ずつになる
  // 出題プランを事前に決める（詳しくは question-generator.js の planQuestionSequence）。
  // 6-3（小学6年生3学期、第12段階）だけは、新内容/復習内容の2グループ方式ではなく、
  // グループA（5年生1〜3学期の復習）/グループB（6年生1〜2学期の復習）/
  // グループC（6年生3学期の新内容）の3グループを長期的に1:1:1にする専用のプランを使う。
  // 端数（余り）を受け取るグループのローテーション位置は localStorage に永続化し、
  // 1ゲーム開始するたびに進める（次の3回のプレイでちょうど1周する）。
  if (gameState.gradeTerm === "6-3") {
    const rotationIndex = loadGrade6Term3RotationIndex();
    gameState.questionPlan = planQuestionSequenceThreeGroup(gameState.totalQuestions, templateSets, rotationIndex);
    saveGrade6Term3RotationIndex((rotationIndex + 1) % 3);
  } else {
    gameState.questionPlan = PLANNED_GRADE_TERMS.has(gameState.gradeTerm)
      ? planQuestionSequence(gameState.totalQuestions, templateSets, gameState.gradeTerm)
      : null;
  }
  isBusy = false;

  ui.setEnemy(gameState.enemy);
  ui.updateHearts(gameState.hearts, gameState.maxHearts);
  ui.updateEnemyHp(gameState.enemyHp);
  ui.updateScoreboard(gameState.score, gameState.rank);
  // 前のゲーム最後の「+スコア」ポップアップが、画面の表示/非表示切り替えで
  // 再生され直してしまうことがあるため（バトル画面が display:none から再表示される際に
  // CSSアニメーションが最初から再生し直される）、新しいゲームの開始時に明示的に隠す。
  ui.hideScoreDelta();

  ui.showScreen("countdown");
  runCountdown().then(() => {
    gameState.screen = "battle";
    ui.showScreen("battle");
    beginQuestion();
  });
}

// トレーニングモード（js/training-mode.js）もこのカウントダウン演出をそのまま再利用する。
export async function runCountdown() {
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
    candidateTemplates = getCandidateTemplatesForSlot(slot, templateSets, gameState.gradeTerm);
  } else {
    gameState.currentSlot = null;
    candidateTemplates = templateSets[gameState.gradeTerm] || [];
  }

  const problem = generateNonDuplicateQuestion(candidateTemplates);

  // 同分母分数のたし算・ひき算を、約分をまだ学習していない学期（4-3・5-1）で出題している場合は、
  // 問題文・カード・答えを約分しない状態で表示する（テンプレート自身の gradeTerm ではなく、
  // 今のバトル全体の gradeTerm＝gameState.gradeTerm で判定するため、5-1で復習として
  // 出題される場合も対象になる。詳しくは question-generator.js の
  // shouldDisplayFractionsUnsimplified() を参照）。
  problem.simplifyFractions = !shouldDisplayFractionsUnsimplified(problem.template, gameState.gradeTerm);

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
      // 分数を含む問題文は textParts（縦型分数を描画するための構造化データ）を持つ。
      // 整数・小数のみの問題は null のままで、ui.js は text をそのまま表示する。
      textParts: problem.textParts || null,
      // left/right/result は数値または分数オブジェクト（value-utils.js が共通して扱う）。
      left: problem.left,
      operator: problem.operator,
      right: problem.right,
      result: problem.result,
      answerUnit: problem.answerUnit,
      simplifyFractions: problem.simplifyFractions,
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
  // 1問目は100%（gameState.nextQuestionStartRatioの初期値）から、2問目以降は
  // 直前の正解で回復させた割合から始める（handleCorrect()参照）。
  startTimer(gameState.currentQuestionDurationSec, gameState.nextQuestionStartRatio);
  gameState.nextQuestionStartRatio = 1;
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

// 2段階問題の途中式（第1段階）正解時の回復量は、正解時の回復量のこの割合とする。
const INTERMEDIATE_STEP_RECOVERY_RATIO_OF_FULL = 0.75;

/**
 * 2段階問題で、1つ目の式に正解したときの処理。
 * 敵HP・スコア・正解数・履歴は変更しない（最終式に正解したときだけ変更する）。
 * 短い演出の間はタイマーを止めたままにし、演出後に解答時間ゲージへ、正解時の回復量の
 * 75%（recoveryAmountForLevel(level)×0.75。レベルMAXなら22.5%）を上乗せして回復してから
 * 再開する（現在の残量に加算するため、多く残っていればさらに多く回復する。100%は超えない）。
 * 演出中は「＝」連打で2問目まで自動的に進んでしまわないよう、入力ロックを維持したままにする。
 */
function handleIntermediateStepCorrect(problem, stepResult) {
  audio.playCorrect();
  // 途中式に正解した時点で、危険演出（エネミーの赤いグロー・画面の点滅）を即座に止める。
  // タイマー自体は演出後に再開する（resumeTimerWithPartialRecovery）が、演出中に危険演出だけ
  // 残り続けないようにするため、ここで先に止めておく。
  ui.updateEnemyDangerGlow(1);
  ui.showIntermediateStepEffect(stepResult);
  logDebugInfo();

  window.setTimeout(() => {
    ui.hideIntermediateStepEffect();
    ui.renderStepChoices(problem);
    resumeTimerWithPartialRecovery(recoveryAmountForLevel(gameState.level) * INTERMEDIATE_STEP_RECOVERY_RATIO_OF_FULL);
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
  const problem = gameState.currentProblem;
  const questionNumber = gameState.solvedQuestions + 1;
  const isFinalQuestion = questionNumber >= gameState.totalQuestions;

  audio.playCorrect();
  ui.triggerEnemyShake();

  const damagePerQuestion = 100 / gameState.totalQuestions;
  gameState.enemyHp = Math.max(0, gameState.enemyHp - damagePerQuestion);
  if (isFinalQuestion) {
    gameState.enemyHp = 0;
  }
  ui.updateEnemyHp(gameState.enemyHp);

  // スコアは、ゲージを回復させる前（正解した瞬間）の残量を必ず参照する
  // （lastTimerRatio は handleJudge() の stopTimer() 時点で固定されており、
  //  この後で行うゲージ回復の影響を受けない）。
  const timeRatioPercent = gameState.currentQuestionPenalized ? 0 : toTimeRatioPercent(lastTimerRatio);
  let addedScore = calculateQuestionScore(questionNumber, timeRatioPercent);
  if (isFinalQuestion) {
    // 最終問題に正解したときだけ、レベル・残りハート数に応じたボーナスを加算する
    // （ボーナス＝80×レベル×レベル×残りハート数。レベルMAXは内部レベル6として計算する）。
    addedScore += 80 * gameState.level * gameState.level * gameState.hearts;
  }
  gameState.score += addedScore;
  gameState.rank = calculateRank(gameState.score, gameState.level);
  ui.updateScoreboard(gameState.score, gameState.rank);
  ui.showScoreDelta(addedScore);

  // 解答時間ゲージは、以前は次の問題の開始時に毎回全回復させていたが、
  // 正解してスコアが加算されるこのタイミングでレベルに応じた割合だけ回復させる方式に変更した。
  // 次の問題は、この回復後の割合から始まる（beginQuestion() 参照）。
  gameState.nextQuestionStartRatio = Math.min(1, lastTimerRatio + recoveryAmountForLevel(gameState.level));
  ui.updateTimer(gameState.nextQuestionStartRatio * 100);
  ui.updateEnemyDangerGlow(gameState.nextQuestionStartRatio);

  gameState.solvedQuestions += 1;
  pushCurrentRecordToHistory();

  gameState.pendingOutcome = gameState.solvedQuestions >= gameState.totalQuestions ? "clear" : "next";
  const simplify = problem.simplifyFractions !== false;
  const displayResultValue = simplify
    ? resultValue
    : computeUnsimplifiedFractionResult(problem.left, problem.operator, problem.right) ?? resultValue;
  ui.showCorrectEffect(displayResultValue, { simplify });
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
      enemy: gameState.enemy,
      gradeTerm: gameState.gradeTerm,
      level: gameState.level,
      correctCount: gameState.solvedQuestions,
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
