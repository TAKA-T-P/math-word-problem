// 総復習モード（「4年のまとめ」「5年のまとめ」「6年のまとめ」「小学校のまとめ」の
// 4つのスコープから1つを選び、そのスコープに属するすべてのカテゴリから1問ずつ出題する
// モード）の状態管理・問題進行・正解/不正解処理・リタイア・結果画面遷移を担当するモジュール。
//
// 通常バトル（js/game.js の gameState）・トレーニング（js/training-mode.js の trainingState）
// とは完全に独立した reviewState を持ちます。このモードは「文章題バトルをベースとするが、
// スコア・ランク・時間制限（解答時間ゲージ）が無い」という設計のため、
//   - ハート・敵HP・クリア/ゲームオーバー/リタイアの判定・演出は js/game.js と同じ考え方
//   - 問題を事前にすべて生成しておく進行方式・タイマー概念が無い点は js/training-mode.js と同じ考え方
// を組み合わせていますが、js/game.js・js/training-mode.js のどちらのファイルも
// 深く参照しません（唯一の例外は、カウントダウン演出 runCountdown() を js/game.js から
// 再利用している点のみ。training-mode.js も同じものを再利用しています）。
// カード生成・正誤判定・2段階問題の進行・分数表示は、すべて既存の
// question-generator.js / answer-checker.js / multi-step-engine.js / ui.js をそのまま再利用します。
//
// モードの切り替え（バトル/トレーニング/総復習のどれか）は js/app.js の1箇所だけが判断し、
// このファイルの内部には「if (mode === ...)」のような分岐を持たせません。

import { generateQuestion, shuffleArray, shouldDisplayFractionsUnsimplified } from "./question-generator.js";
import { checkAnswer } from "./answer-checker.js";
import { filterValidTemplateSets } from "./question-validator.js";
import { formatValue, computeUnsimplifiedFractionResult } from "./value-utils.js";
import { renderValueHtml } from "./value-renderer.js";
import { getCategoriesForGrade, getEnabledTrainingCategories } from "../data/category-registry.js";
import { FORMULA_KAMEN, FORMULA_KAMEN_ACE } from "./enemy-list.js";
import { recordDefeatedEnemy } from "./storage.js";
import * as multiStepEngine from "./multi-step-engine.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";
import { runCountdown } from "./game.js";

// URL に ?debug=true を付けた場合だけ、総復習の進行状態もコンソールと
// 画面隅のデバッグパネルに表示する。通常アクセスでは一切表示しない。
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "true";

const DAMAGE_ANIMATION_MS = 480;
const CLEAR_MESSAGE_DELAY_MS = 1400;
const GAMEOVER_MESSAGE_DELAY_MS = 1400;
const INTERMEDIATE_STEP_DELAY_MS = 900;
const ELAPSED_TIMER_INTERVAL_MS = 1000;

// スコープキー（"4"|"5"|"6"|"all"）から、結果画面・ヘッダー表示に使う名前を求める。
const REVIEW_SCOPE_LABELS = { "4": "4年のまとめ", "5": "5年のまとめ", "6": "6年のまとめ", all: "小学校のまとめ" };

// スコープキーから、初期ハート数を求める。「小学校のまとめ」（3学年分・全カテゴリ）だけは
// 難易度が高いため1個、それ以外（学年単位のまとめ）は通常のバトルと同じ3個にする。
const REVIEW_SCOPE_HEARTS = { "4": 3, "5": 3, "6": 3, all: 1 };

// 総復習専用の状態。gameState（js/game.js）・trainingState（js/training-mode.js）とは
// 別のオブジェクトで、互いのフィールドを参照し合うことはない。
const reviewState = {
  scope: null,
  label: "",
  totalQuestions: 0,
  solvedQuestions: 0,
  maxHearts: 3,
  hearts: 3,
  enemyHp: 100,
  enemy: null,
  questions: [],
  currentProblem: null,
  currentQuestionRecord: null,
  historyPushed: false,
  history: [],
  isNoMiss: true,
  resultType: null,
  pendingOutcome: null, // 正解演出後の遷移先: "next" | "clear"
  startTimestamp: null // 1問目の開始時刻（elapsed-time表示の起点）
};

let templateSets = {};
let isBusy = false;
let elapsedTimerHandle = null;

// value-renderer.js の renderValueHtml() を使うことで、分数を含む式でも
// 縦型分数のHTMLとして「最後に試した式」を表示できるようにしている。
function formatFormula(answer) {
  if (!answer) return "（未回答）";
  return `${renderValueHtml(answer.left)}${answer.operator}${renderValueHtml(answer.right)}`;
}

function pickEnemyForScope(scope) {
  return scope === "all" ? FORMULA_KAMEN_ACE : FORMULA_KAMEN;
}

function categoriesForScope(scope) {
  return scope === "all" ? getEnabledTrainingCategories() : getCategoriesForGrade(scope);
}

/**
 * 指定したスコープで出題される問題数（＝そのスコープに属するカテゴリ数）を求めます。
 * data/category-registry.js から動的に導出するため、13/17/20/50をハードコードしません。
 */
export function getQuestionCountForScope(scope) {
  return categoriesForScope(scope).length;
}

// ============================================================
// 問題生成（各カテゴリから、ちょうど1問ずつ）
// ============================================================

function getAllValidatedTemplates() {
  return Object.values(templateSets).flat();
}

/**
 * 指定したスコープに属するすべてのカテゴリから、ちょうど1問ずつ生成し、
 * 出題順をシャッフルして返します。トレーニング（js/training-mode.js の
 * generateTrainingQuestions()）と異なり、同じカテゴリを複数回使うことは無いため、
 * カテゴリをまたいだ重複回避（同じ問題文が2回出るのを防ぐ処理）は不要です
 * （カテゴリが違えば、問題文もほぼ確実に異なるため）。
 */
function generateReviewQuestions(scope) {
  const categories = categoriesForScope(scope);
  const allTemplates = getAllValidatedTemplates();
  const questions = categories.map((category) => {
    const pool = allTemplates.filter((t) => t.categoryId === category.id);
    if (pool.length === 0) {
      throw new Error(`カテゴリ "${category.id}" に対応するテンプレートがありません。`);
    }
    return generateQuestion(pool);
  });
  return shuffleArray(questions);
}

// ============================================================
// 経過時間（ゲームスタート＝1問目開始からの経過時間を1秒おきに更新）
// ============================================================

function currentElapsedSeconds() {
  if (reviewState.startTimestamp === null) return 0;
  return Math.floor((Date.now() - reviewState.startTimestamp) / 1000);
}

function startElapsedTimer() {
  stopElapsedTimer();
  reviewState.startTimestamp = Date.now();
  ui.updateElapsedTime(0);
  elapsedTimerHandle = window.setInterval(() => {
    ui.updateElapsedTime(currentElapsedSeconds());
  }, ELAPSED_TIMER_INTERVAL_MS);
}

function stopElapsedTimer() {
  if (elapsedTimerHandle !== null) {
    window.clearInterval(elapsedTimerHandle);
    elapsedTimerHandle = null;
  }
}

// ============================================================
// 初期化
// ============================================================

export function initReview(sets) {
  templateSets = filterValidTemplateSets(sets);
}

// ============================================================
// 開始
// ============================================================

export function startReview(settings) {
  if (isBusy) return;

  audio.initAudio();

  const scope = settings.scope;

  reviewState.scope = scope;
  reviewState.label = REVIEW_SCOPE_LABELS[scope] || scope;
  reviewState.questions = generateReviewQuestions(scope);
  reviewState.totalQuestions = reviewState.questions.length;
  reviewState.solvedQuestions = 0;
  reviewState.maxHearts = REVIEW_SCOPE_HEARTS[scope] || 3;
  reviewState.hearts = reviewState.maxHearts;
  reviewState.enemyHp = 100;
  reviewState.enemy = pickEnemyForScope(scope);
  reviewState.currentProblem = null;
  reviewState.currentQuestionRecord = null;
  reviewState.historyPushed = false;
  reviewState.history = [];
  reviewState.isNoMiss = true;
  reviewState.resultType = null;
  reviewState.pendingOutcome = null;
  reviewState.startTimestamp = null;

  isBusy = false;

  ui.setEnemy(reviewState.enemy);
  ui.updateHearts(reviewState.hearts, reviewState.maxHearts);
  ui.updateEnemyHp(reviewState.enemyHp);

  ui.showScreen("countdown");
  runCountdown().then(() => {
    ui.showScreen("battle");
    startElapsedTimer();
    beginReviewQuestion();
  });
}

// ============================================================
// 問題進行
// ============================================================

function beginReviewQuestion() {
  const problem = reviewState.questions[reviewState.solvedQuestions];
  // 同分母分数のたし算・ひき算を、約分をまだ学習していない学期（4-3・5-1）の問題として
  // 出題している場合は、問題文・カード・答えを約分しない状態で表示する（詳しくは
  // question-generator.js の shouldDisplayFractionsUnsimplified() を参照）。総復習は
  // 単一の gradeTerm セッションという概念を持たず、カテゴリごとに全く異なる学期の問題を
  // 行き来するため、「今のセッション全体のgradeTerm」の代わりに、その問題自身の
  // テンプレートが本来属する学期（problem.template.gradeTerm）を判定基準に使う
  // （＝そのカテゴリを単独の学期モードで遊んだときと同じ表示になる）。
  problem.simplifyFractions = !shouldDisplayFractionsUnsimplified(problem.template, problem.template.gradeTerm);
  reviewState.currentProblem = problem;
  reviewState.historyPushed = false;

  if (problem.questionType === "multiStep") {
    // 2段階問題の進行状態は problem.multiStep（multi-step-engine.js が管理）に
    // 保持されているため、reviewState.currentQuestionRecord は使わない。
    reviewState.currentQuestionRecord = null;
  } else {
    reviewState.currentQuestionRecord = {
      category: problem.category,
      text: problem.text,
      textParts: problem.textParts || null,
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

  ui.updateReviewHeader(reviewState.label, reviewState.solvedQuestions + 1, reviewState.totalQuestions);
  ui.renderProblem(problem);
  ui.unlockInput();
  isBusy = false;
  logReviewDebugInfo();
}

// ============================================================
// 判定
// ============================================================

export function handleJudge(answer) {
  if (isBusy || !reviewState.currentProblem) return;
  isBusy = true;

  const problem = reviewState.currentProblem;

  if (problem.questionType === "multiStep") {
    handleMultiStepJudge(problem, answer);
    return;
  }

  reviewState.currentQuestionRecord.lastAttemptText = formatFormula(answer);
  const { correct, result } = checkAnswer(problem, answer.left, answer.operator, answer.right);

  if (correct) {
    handleCorrect(result);
  } else {
    reviewState.currentQuestionRecord.incorrectCount += 1;
    reviewState.isNoMiss = false;
    logReviewDebugInfo();
    handleIncorrect();
  }
}

/**
 * 2段階問題の「＝」判定。1つ目の式が正解なら途中経過として処理し、
 * 2つ目（最終）の式が正解なら既存の1問正解フロー（handleCorrect）に合流する。
 * 不正解の場合は、既存の不正解フロー（handleIncorrect）をそのまま使う
 * （ステップ番号・中間結果は multi-step-engine.js 側で維持されるため、
 *  ここで意識する必要はない）。
 */
function handleMultiStepJudge(problem, answer) {
  const outcome = multiStepEngine.submitStepAnswer(problem, answer.left, answer.operator, answer.right);

  if (!outcome.correct) {
    reviewState.isNoMiss = false;
    logReviewDebugInfo();
    handleIncorrect();
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
 * 敵HP・正解数・履歴は変更しない（最終式に正解したときだけ変更する）。
 * 総復習には時間制限（解答時間ゲージ）が無いため、js/game.js と異なりゲージ回復処理は行わない
 * （js/training-mode.js の handleTrainingIntermediateCorrect() と同じ考え方）。
 */
function handleIntermediateStepCorrect(problem, stepResult) {
  audio.playCorrect();
  ui.showIntermediateStepEffect(stepResult);
  logReviewDebugInfo();

  window.setTimeout(() => {
    ui.hideIntermediateStepEffect();
    ui.renderStepChoices(problem);
    ui.updateReviewHeader(reviewState.label, reviewState.solvedQuestions + 1, reviewState.totalQuestions);
    ui.unlockInput();
    isBusy = false;
  }, INTERMEDIATE_STEP_DELAY_MS);
}

function handleCorrect(resultValue) {
  const problem = reviewState.currentProblem;
  const isFinalQuestion = reviewState.solvedQuestions + 1 >= reviewState.totalQuestions;

  audio.playCorrect();
  ui.triggerEnemyShake();

  const damagePerQuestion = 100 / reviewState.totalQuestions;
  reviewState.enemyHp = Math.max(0, reviewState.enemyHp - damagePerQuestion);
  if (isFinalQuestion) {
    reviewState.enemyHp = 0;
  }
  ui.updateEnemyHp(reviewState.enemyHp);

  reviewState.solvedQuestions += 1;
  pushCurrentRecordToHistory();

  reviewState.pendingOutcome = reviewState.solvedQuestions >= reviewState.totalQuestions ? "clear" : "next";
  const simplify = problem.simplifyFractions !== false;
  const displayResultValue = simplify
    ? resultValue
    : computeUnsimplifiedFractionResult(problem.left, problem.operator, problem.right) ?? resultValue;
  ui.showCorrectEffect(displayResultValue, { simplify });
  // isBusy は「タップして次へ」が押されるまで true のまま維持し、連続タップを防ぐ
  logReviewDebugInfo();
}

export function handleNextTap() {
  ui.hideCorrectEffect();
  if (reviewState.pendingOutcome === "clear") {
    finishReview("clear");
  } else {
    beginReviewQuestion();
  }
}

function handleIncorrect() {
  audio.playDamage();
  ui.triggerDamageEffect();
  reviewState.hearts = Math.max(0, reviewState.hearts - 1);
  ui.updateHearts(reviewState.hearts, reviewState.maxHearts);
  ui.clearAnswerSlots();
  logReviewDebugInfo();

  window.setTimeout(() => {
    if (reviewState.hearts <= 0) {
      finishReview("gameover");
    } else {
      ui.unlockInput();
      isBusy = false;
    }
  }, DAMAGE_ANIMATION_MS);
}

function pushCurrentRecordToHistory() {
  if (reviewState.historyPushed) return;
  const problem = reviewState.currentProblem;

  if (problem && problem.questionType === "multiStep") {
    reviewState.history.push(multiStepEngine.buildHistoryEntry(problem));
    reviewState.historyPushed = true;
    return;
  }

  if (reviewState.currentQuestionRecord) {
    reviewState.history.push({ ...reviewState.currentQuestionRecord, questionType: "singleStep", isComplete: true });
    reviewState.currentQuestionRecord = null;
    reviewState.historyPushed = true;
  }
}

// ============================================================
// リタイア（総復習にはタイマーが無いため、一時停止/再開の処理は不要。経過時間の計測は継続する）
// ============================================================

export function pauseForRetireDialog() {
  // 総復習にはタイマーが無いため、何もしない。
}

export function cancelRetire() {
  // 同上。
}

export function confirmRetire() {
  finishReview("retire");
}

// ============================================================
// 終了処理
// ============================================================

function finishReview(type) {
  stopElapsedTimer();
  isBusy = true;
  pushCurrentRecordToHistory();
  reviewState.resultType = type;
  const elapsedSeconds = currentElapsedSeconds();

  const proceed = () => {
    let title;
    let variant;
    const isNoMissClear = type === "clear" && reviewState.isNoMiss;

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

    ui.showReviewResultScreen({
      title,
      variant,
      enemy: reviewState.enemy,
      scopeLabel: reviewState.label,
      correctCount: reviewState.solvedQuestions,
      totalQuestions: reviewState.totalQuestions,
      elapsedSeconds,
      history: reviewState.history
    });
    ui.showScreen("result");
    isBusy = false;
    logReviewDebugInfo();
  };

  if (type === "clear") {
    // エネミー図鑑の解放は、クリアが確定したこの瞬間だけ行う（運用開始後に追加。
    // js/game.js の finishGame() と同じ考え方）。ゲームオーバー・リタイアからは呼ばない。
    recordDefeatedEnemy(reviewState.enemy.id);
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

// ============================================================
// リトライ／タイトルへ戻る
// ============================================================

export function retryReview() {
  startReview({ mode: "review", scope: reviewState.scope });
}

export function returnToTitle() {
  stopElapsedTimer();
  isBusy = false;
  ui.showScreen("title");
}

// ============================================================
// デバッグ表示（?debug=true のときだけ）
// ============================================================

// js/game.js の formatSolutionRoutes() と同じ考え方で、正解式をデバッグ表示用に整形する。
function formatSolutionRoutesForDebug(problem) {
  if (!problem) return "(なし)";
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

function logReviewDebugInfo() {
  if (!DEBUG_MODE) return;

  const problem = reviewState.currentProblem;

  const lines = [
    "mode: review",
    `reviewScope: ${reviewState.scope}`,
    `reviewLabel: ${reviewState.label}`,
    `questionNumber: ${reviewState.solvedQuestions + 1}／${reviewState.totalQuestions}`,
    `hearts: ${reviewState.hearts}／${reviewState.maxHearts}`,
    `enemyHp: ${Math.round(reviewState.enemyHp)}`,
    `elapsedSeconds: ${currentElapsedSeconds()}`,
    `isNoMiss: ${reviewState.isNoMiss}`,
    `生成された${reviewState.totalQuestions}問のテンプレートID: ${reviewState.questions.map((q) => q.templateId).join(", ")}`,
    `各問題のcategoryId: ${reviewState.questions.map((q) => (q.template ? q.template.categoryId : "(なし)")).join(", ")}`,
    `現在の問題ID: ${problem ? problem.id : "(なし)"}`,
    `現在のテンプレートID: ${problem ? problem.templateId : "(なし)"}`,
    `questionType: ${problem ? problem.questionType : "(なし)"}`,
    `正解式: ${formatSolutionRoutesForDebug(problem)}`
  ];

  console.groupCollapsed("%c[DEBUG] 総復習情報", "color:#ff9dfa;font-weight:bold;");
  for (const line of lines) {
    console.log(line);
  }
  console.groupEnd();

  ui.updateDebugPanel(lines.join("\n"));
}
