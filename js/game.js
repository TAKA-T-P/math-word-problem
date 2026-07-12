// ゲーム状態の管理・問題進行・ハート管理・敵HP管理・タイマー管理・
// 正解/不正解後の処理・クリア/ゲームオーバー判定を担当するモジュール。

import { generateQuestion } from "./question-generator.js";
import { checkAnswer } from "./answer-checker.js";
import { calculateQuestionScore, calculateRank, toTimeRatioPercent, formatFinalRank } from "./score.js";
import { loadHighScore, saveHighScoreIfBetter, loadSoundSetting, saveSoundSetting } from "./storage.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";

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
  currentQuestionDurationSec: 0,
  lastTemplateId: null,
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
  return `${answer.left}${answer.operator}${answer.right}`;
}

function pushCurrentRecordToHistory() {
  if (gameState.currentQuestionRecord) {
    gameState.history.push(gameState.currentQuestionRecord);
    gameState.currentQuestionRecord = null;
  }
}

// ---------- 初期化 ----------

export function initGame(sets) {
  templateSets = sets;
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
  isBusy = false;

  ui.setEnemy(gameState.enemy);
  ui.updateHearts(gameState.hearts, gameState.maxHearts);
  ui.updateEnemyHp(gameState.enemyHp);
  ui.updateScoreboard(gameState.score, gameState.rank);

  ui.showScreen("countdown");
  runCountdown().then(() => {
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

function beginQuestion() {
  const questionNumber = gameState.solvedQuestions + 1;
  const templates = templateSets[gameState.gradeTerm] || [];
  const problem = generateQuestion(templates, { excludeTemplateId: gameState.lastTemplateId });

  gameState.currentProblem = problem;
  gameState.lastTemplateId = problem.templateId;
  gameState.currentQuestionPenalized = false;
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

  const initialTimeLimitSec = 120 / gameState.level;
  const multiplier = speedMultiplier(questionNumber, gameState.totalQuestions);
  gameState.currentQuestionDurationSec = initialTimeLimitSec / multiplier;

  ui.renderProblem(problem);
  ui.unlockInput();
  isBusy = false;
  startTimer(gameState.currentQuestionDurationSec);
}

// ---------- 判定 ----------

export function handleJudge(answer) {
  if (isBusy || !gameState.currentProblem) return;
  isBusy = true;
  stopTimer();

  gameState.currentQuestionRecord.lastAttemptText = formatFormula(answer);

  const { correct, result } = checkAnswer(
    gameState.currentProblem,
    answer.left,
    answer.operator,
    answer.right
  );

  if (correct) {
    handleCorrect(result);
  } else {
    gameState.currentQuestionRecord.incorrectCount += 1;
    gameState.currentQuestionPenalized = true;
    gameState.isNoMiss = false;
    handleIncorrectOrTimeout();
  }
}

function onTimerExpired() {
  if (isBusy || !gameState.currentProblem) return;
  isBusy = true;

  const placed = ui.getPlacedAnswer();
  if (placed) {
    gameState.currentQuestionRecord.lastAttemptText = formatFormula(placed);
  }
  gameState.currentQuestionRecord.timeoutCount += 1;
  gameState.currentQuestionPenalized = true;
  gameState.isNoMiss = false;
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
    ui.showScreen("result");
    isBusy = false;
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
  ui.showScreen("title");
}
