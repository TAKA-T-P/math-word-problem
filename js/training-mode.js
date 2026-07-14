// トレーニングモード（1つのカテゴリだけを5問、タイマー・ハート・敵HP・スコアなしで
// くり返し練習するモード）の状態管理・問題進行・正解/不正解処理・リタイア・
// 結果画面遷移を担当するモジュール。
//
// 通常バトル（js/game.js の gameState）とは完全に独立した trainingState を持ち、
// タイマー・ハート・敵HP・スコア・ランク・ハイスコアの概念を一切参照しません。
// js/game.js からも、このファイルからも、お互いを深く参照しません
// （唯一の例外は、カウントダウン演出 runCountdown() を game.js から再利用している点のみ）。
// カード生成・正誤判定・2段階問題の進行・分数表示は、すべて既存の
// question-generator.js / answer-checker.js / multi-step-engine.js / ui.js をそのまま再利用します。
//
// モードの切り替え（バトルかトレーニングか）は js/app.js の1箇所だけが判断し、
// このファイルの内部には「if (mode === ...)」のような分岐を持たせません。

import { generateQuestion, shouldDisplayFractionsUnsimplified } from "./question-generator.js";
import { checkAnswer } from "./answer-checker.js";
import { filterValidTemplateSets } from "./question-validator.js";
import { valueKey, formatValue, computeUnsimplifiedFractionResult } from "./value-utils.js";
import { renderValueHtml } from "./value-renderer.js";
import * as multiStepEngine from "./multi-step-engine.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";
import { runCountdown } from "./game.js";
import { getCategoryById } from "../data/category-registry.js";

// URL に ?debug=true を付けた場合だけ、トレーニングの進行状態もコンソールと
// 画面隅のデバッグパネルに表示する。通常アクセスでは一切表示しない。
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "true";

const TOTAL_TRAINING_QUESTIONS = 5;
// 不正解時の演出（軽いシェイク）の長さ。バトルのダメージ演出より短く控えめにしている。
const INCORRECT_ANIMATION_MS = 360;
const INTERMEDIATE_STEP_DELAY_MS = 900;

// トレーニング専用の状態。gameState（js/game.js）とは別のオブジェクトで、
// 互いのフィールドを参照し合うことはない。
const trainingState = {
  gradeTerm: null,
  categoryId: null,
  categoryLabel: "",
  totalQuestions: TOTAL_TRAINING_QUESTIONS,
  currentQuestionNumber: 1,
  currentIndex: 0,
  completedQuestions: 0,
  firstTryCorrectCount: 0,
  totalWrongCount: 0,
  currentQuestionWrongCount: 0,
  currentQuestionHadMistake: false,
  questions: [],
  currentProblem: null,
  currentQuestionRecord: null,
  historyPushed: false,
  history: [],
  resultType: null,
  pendingOutcome: null // 正解演出後の遷移先: "next" | "complete"
};

let templateSets = {};
let isBusy = false;

// value-renderer.js の renderValueHtml() を使うことで、分数を含む式でも
// 縦型分数のHTMLとして「最後に試した式」を表示できるようにしている。
function formatFormula(answer) {
  if (!answer) return "（未回答）";
  return `${renderValueHtml(answer.left)}${answer.operator}${renderValueHtml(answer.right)}`;
}

// ============================================================
// 問題生成（カテゴリ指定・新/復習比率処理は使用しない）
// ============================================================

function buildFormulaDupKey(problem) {
  if (problem.questionType !== "singleStep") return null;
  // 分数・小数でも正しく重複判定できるよう、value-utils.js の valueKey() を使う
  // （単純な文字列連結だと、分数オブジェクトが "[object Object]" になってしまうため）。
  return `${valueKey(problem.left)}${problem.operator}${valueKey(problem.right)}`;
}

// 5問セットの中で問題文・式ができるだけ重複しないよう、再抽選する回数の上限。
// これだけ試しても新しい組み合わせが見つからない場合は、諦めてそのまま採用する
// （テンプレートが少ないカテゴリで無限ループにならないようにするための安全弁）。
const MAX_TRAINING_DUPLICATE_AVOIDANCE_ATTEMPTS = 20;

/**
 * 指定したカテゴリ（categoryId）だけから、ちょうど count 問（既定5問）を生成します。
 * 新内容/復習内容の比率処理（question-generator.js の planQuestionSequence）は使用しません。
 * テンプレートが count 種類に満たないカテゴリでは、同じテンプレートを複数回使いますが、
 * できるだけ数値・問題文が重ならないよう再抽選します。
 * 1段階・2段階のどちらのテンプレートも、既存の generateQuestion() をそのまま使うため
 * 特別扱いは不要です（2段階問題は自動的に multiStep として初期化されて返ります）。
 *
 * @param {string} categoryId
 * @param {Array} templates - filterValidTemplateSets() 済みのテンプレート一覧全体（全gradeTerm分をまとめたもの）
 * @param {number} count
 * @returns {Array} 生成された問題（question-generator.js の generateQuestionFromTemplate と同じ形）の配列
 */
export function generateTrainingQuestions(categoryId, templates, count = TOTAL_TRAINING_QUESTIONS) {
  const pool = templates.filter((t) => t.categoryId === categoryId);
  if (pool.length === 0) {
    throw new Error(`カテゴリ "${categoryId}" に対応するテンプレートがありません。`);
  }

  const questions = [];
  const usedTexts = new Set();
  const usedFormulaKeys = new Set();
  let lastTemplateId = null;

  for (let i = 0; i < count; i++) {
    let problem = null;
    for (let attempt = 0; attempt < MAX_TRAINING_DUPLICATE_AVOIDANCE_ATTEMPTS; attempt++) {
      problem = generateQuestion(pool, { excludeTemplateId: lastTemplateId });
      const formulaKey = buildFormulaDupKey(problem);
      const isDuplicate = usedTexts.has(problem.text) || (formulaKey !== null && usedFormulaKeys.has(formulaKey));
      if (!isDuplicate) {
        break;
      }
    }
    usedTexts.add(problem.text);
    const formulaKey = buildFormulaDupKey(problem);
    if (formulaKey !== null) {
      usedFormulaKeys.add(formulaKey);
    }
    lastTemplateId = problem.templateId;
    questions.push(problem);
  }

  return questions;
}

/**
 * 開発者用の検証ページ（tools/question-validator.html）専用。
 * 指定したカテゴリで generateTrainingQuestions() を繰り返し実行し、
 * 「必ずcount問生成されるか」「他のカテゴリが混ざらないか」「例外が発生しないか」
 * 「問題文が完全に重複していないか」「選択肢が8枚を超えていないか」を検証します。
 * game.js からの通常プレイでは呼び出しません。
 * @returns {{valid: boolean, errors: string[], attempts: number, successfulRuns: number}}
 */
export function validateTrainingSetGeneration(categoryId, templates, attempts = 20, count = TOTAL_TRAINING_QUESTIONS) {
  const errors = [];
  let successfulRuns = 0;

  for (let run = 0; run < attempts; run++) {
    try {
      const questions = generateTrainingQuestions(categoryId, templates, count);
      let runOk = true;

      if (questions.length !== count) {
        errors.push(`run${run}: 生成された問題数が${count}問ではありません（${questions.length}問）`);
        runOk = false;
      }

      const wrongCategory = questions.filter((q) => !q.template || q.template.categoryId !== categoryId);
      if (wrongCategory.length > 0) {
        errors.push(`run${run}: 他のカテゴリの問題が混ざっています: ${wrongCategory.map((q) => q.templateId).join(", ")}`);
        runOk = false;
      }

      const texts = questions.map((q) => q.text);
      const duplicateTextCount = texts.length - new Set(texts).size;
      if (duplicateTextCount > 0) {
        errors.push(`run${run}: 問題文が完全に重複しています（${duplicateTextCount}件）`);
      }

      for (const q of questions) {
        if (!Array.isArray(q.choices) || q.choices.length > 8) {
          errors.push(`run${run}: 選択肢カードが不正です（${q.templateId}）`);
          runOk = false;
        }
      }

      if (runOk) {
        successfulRuns += 1;
      }
    } catch (error) {
      errors.push(`run${run}: 生成中に例外が発生しました: ${error.message}`);
    }
  }

  return { valid: errors.length === 0, errors, attempts, successfulRuns };
}

// ============================================================
// 初期化
// ============================================================

export function initTraining(sets) {
  templateSets = filterValidTemplateSets(sets);
}

function getAllValidatedTemplates() {
  return Object.values(templateSets).flat();
}

// ============================================================
// 開始
// ============================================================

export function startTraining(settings) {
  if (isBusy) return;

  audio.initAudio();

  const category = getCategoryById(settings.categoryId);

  trainingState.gradeTerm = settings.gradeTerm;
  trainingState.categoryId = settings.categoryId;
  trainingState.categoryLabel = category ? category.label : settings.categoryLabel || "";
  trainingState.totalQuestions = TOTAL_TRAINING_QUESTIONS;
  trainingState.currentQuestionNumber = 1;
  trainingState.currentIndex = 0;
  trainingState.completedQuestions = 0;
  trainingState.firstTryCorrectCount = 0;
  trainingState.totalWrongCount = 0;
  trainingState.currentQuestionWrongCount = 0;
  trainingState.currentQuestionHadMistake = false;
  trainingState.currentProblem = null;
  trainingState.currentQuestionRecord = null;
  trainingState.historyPushed = false;
  trainingState.history = [];
  trainingState.resultType = null;
  trainingState.pendingOutcome = null;

  trainingState.questions = generateTrainingQuestions(
    trainingState.categoryId,
    getAllValidatedTemplates(),
    TOTAL_TRAINING_QUESTIONS
  );

  isBusy = false;

  ui.showScreen("countdown");
  runCountdown().then(() => {
    ui.showScreen("battle");
    beginTrainingQuestion();
  });
}

// ============================================================
// 問題進行
// ============================================================

function beginTrainingQuestion() {
  const problem = trainingState.questions[trainingState.currentIndex];
  // 同分母分数のたし算・ひき算を、約分をまだ学習していない学期（4-3・5-1）で練習している場合は、
  // 問題文・カード・答えを約分しない状態で表示する（詳しくは question-generator.js の
  // shouldDisplayFractionsUnsimplified() を参照。トレーニングはカテゴリ単体でしか出題しないため、
  // trainingState.gradeTerm は常にそのカテゴリ本来の学期＝"4-3" になる）。
  problem.simplifyFractions = !shouldDisplayFractionsUnsimplified(problem.template, trainingState.gradeTerm);
  trainingState.currentProblem = problem;
  trainingState.currentQuestionWrongCount = 0;
  trainingState.currentQuestionHadMistake = false;
  trainingState.historyPushed = false;

  if (problem.questionType === "multiStep") {
    // 2段階問題の進行状態は problem.multiStep（multi-step-engine.js が管理）に
    // 保持されているため、trainingState.currentQuestionRecord は使わない。
    trainingState.currentQuestionRecord = null;
  } else {
    trainingState.currentQuestionRecord = {
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

  ui.updateTrainingHeader(trainingState.categoryLabel, trainingState.currentQuestionNumber, trainingState.totalQuestions);
  ui.renderProblem(problem);
  ui.unlockInput();
  isBusy = false;
  logTrainingDebugInfo();
}

// ============================================================
// 判定
// ============================================================

function registerWrongAttempt() {
  trainingState.currentQuestionWrongCount += 1;
  trainingState.totalWrongCount += 1;
  trainingState.currentQuestionHadMistake = true;
}

/**
 * 不正解時の共通処理。ハートは減らさず、ゲームオーバーにもならず、
 * 同じ問題（2段階問題なら同じステップ）を解答欄をクリアしたまま再挑戦させる。
 * バトルのダメージ演出より控えめな、軽いシェイク演出のみを行う。
 */
function retryAfterIncorrect() {
  audio.playDamage();
  ui.triggerTrainingIncorrectEffect();
  ui.clearAnswerSlots();

  window.setTimeout(() => {
    ui.unlockInput();
    isBusy = false;
  }, INCORRECT_ANIMATION_MS);
}

export function handleJudge(answer) {
  if (isBusy || !trainingState.currentProblem) return;
  isBusy = true;

  const problem = trainingState.currentProblem;

  if (problem.questionType === "multiStep") {
    handleMultiStepJudge(problem, answer);
    return;
  }

  trainingState.currentQuestionRecord.lastAttemptText = formatFormula(answer);
  const { correct, result } = checkAnswer(problem, answer.left, answer.operator, answer.right);

  if (correct) {
    handleTrainingCorrect(result);
  } else {
    trainingState.currentQuestionRecord.incorrectCount += 1;
    registerWrongAttempt();
    logTrainingDebugInfo();
    retryAfterIncorrect();
  }
}

/**
 * 2段階問題の「＝」判定。1つ目の式が正解なら途中経過として処理し、
 * 2つ目（最終）の式が正解なら handleTrainingCorrect に合流する。
 * 不正解の場合は、ステップ番号・中間結果を維持したまま同じステップを再挑戦させる
 * （multi-step-engine.js 側が候補ルート・中間結果を保持しているため、
 *  ここではカードの再構築を行わない＝1つ目の式に戻ることはない）。
 */
function handleMultiStepJudge(problem, answer) {
  const outcome = multiStepEngine.submitStepAnswer(problem, answer.left, answer.operator, answer.right);

  if (!outcome.correct) {
    registerWrongAttempt();
    logTrainingDebugInfo();
    retryAfterIncorrect();
    return;
  }

  if (outcome.isFinal) {
    handleTrainingCorrect(outcome.stepResult);
    return;
  }

  handleTrainingIntermediateCorrect(problem, outcome.stepResult);
}

/**
 * 2段階問題で、1つ目の式に正解したときの処理。
 * 完了数・正解数は変更しない（最終式に正解したときだけ変更する）。
 * バトルと異なり、タイマーの回復処理は行わない（トレーニングにタイマーは無いため）。
 */
function handleTrainingIntermediateCorrect(problem, stepResult) {
  audio.playCorrect();
  ui.showIntermediateStepEffect(stepResult);
  logTrainingDebugInfo();

  window.setTimeout(() => {
    ui.hideIntermediateStepEffect();
    ui.renderStepChoices(problem);
    ui.updateTrainingHeader(trainingState.categoryLabel, trainingState.currentQuestionNumber, trainingState.totalQuestions);
    ui.unlockInput();
    isBusy = false;
  }, INTERMEDIATE_STEP_DELAY_MS);
}

function pushCurrentRecordToHistory() {
  if (trainingState.historyPushed) return;
  const problem = trainingState.currentProblem;

  if (problem && problem.questionType === "multiStep") {
    trainingState.history.push(multiStepEngine.buildHistoryEntry(problem));
    trainingState.historyPushed = true;
    return;
  }

  if (trainingState.currentQuestionRecord) {
    trainingState.history.push({ ...trainingState.currentQuestionRecord, questionType: "singleStep", isComplete: true });
    trainingState.currentQuestionRecord = null;
    trainingState.historyPushed = true;
  }
}

/**
 * 1問正解（1段階問題、または2段階問題の最終ステップ）の処理。
 * その問題を一度もミスせずに解けていた場合だけ firstTryCorrectCount を増やす。
 * 敵HP・スコア・ランクは一切変更しない。
 */
function handleTrainingCorrect(resultValue) {
  audio.playCorrect();

  if (!trainingState.currentQuestionHadMistake) {
    trainingState.firstTryCorrectCount += 1;
  }

  trainingState.completedQuestions += 1;
  pushCurrentRecordToHistory();

  trainingState.pendingOutcome =
    trainingState.completedQuestions >= trainingState.totalQuestions ? "complete" : "next";
  const problem = trainingState.currentProblem;
  const simplify = !problem || problem.simplifyFractions !== false;
  const displayResultValue =
    simplify || !problem
      ? resultValue
      : computeUnsimplifiedFractionResult(problem.left, problem.operator, problem.right) ?? resultValue;
  ui.showCorrectEffect(displayResultValue, { simplify });
  // isBusy は「タップして次へ」が押されるまで true のまま維持し、連続タップを防ぐ
  logTrainingDebugInfo();
}

export function handleNextTap() {
  ui.hideCorrectEffect();
  if (trainingState.pendingOutcome === "complete") {
    finishTraining("complete");
  } else {
    trainingState.currentIndex += 1;
    trainingState.currentQuestionNumber += 1;
    beginTrainingQuestion();
  }
}

// ============================================================
// リタイア（トレーニングにはタイマーが無いため、一時停止/再開の処理は不要）
// ============================================================

export function pauseForRetireDialog() {
  // トレーニングにはタイマーが無いため、何もしない。
}

export function cancelRetire() {
  // 同上。
}

export function confirmRetire() {
  finishTraining("retire");
}

// ============================================================
// 終了処理
// ============================================================

function finishTraining(type) {
  isBusy = true;
  pushCurrentRecordToHistory();
  trainingState.resultType = type;

  ui.showTrainingResultScreen({
    title: type === "complete" ? "トレーニング完了！" : "トレーニング終了",
    variant: type === "complete" ? "clear" : "retire",
    categoryLabel: trainingState.categoryLabel,
    completedQuestions: trainingState.completedQuestions,
    totalQuestions: trainingState.totalQuestions,
    firstTryCorrectCount: trainingState.firstTryCorrectCount,
    totalWrongCount: trainingState.totalWrongCount,
    history: trainingState.history
  });
  ui.showScreen("result");
  isBusy = false;
  logTrainingDebugInfo();
}

// ============================================================
// リトライ／タイトルへ戻る
// ============================================================

export function retryTraining() {
  startTraining({
    gradeTerm: trainingState.gradeTerm,
    categoryId: trainingState.categoryId,
    categoryLabel: trainingState.categoryLabel
  });
}

export function returnToTitle() {
  isBusy = false;
  ui.showScreen("title");
}

// ============================================================
// デバッグ表示（?debug=true のときだけ）
// ============================================================

// バトルの js/game.js の formatSolutionRoutes() と同じ考え方で、正解式をデバッグ表示用に整形する。
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

function logTrainingDebugInfo() {
  if (!DEBUG_MODE) return;

  const problem = trainingState.currentProblem;
  const categoryTemplateCount = getAllValidatedTemplates().filter(
    (t) => t.categoryId === trainingState.categoryId
  ).length;

  const lines = [
    "mode: training",
    `trainingCategoryId: ${trainingState.categoryId}`,
    `trainingCategoryLabel: ${trainingState.categoryLabel}`,
    `trainingQuestionNumber: ${trainingState.currentQuestionNumber}／${trainingState.totalQuestions}`,
    `trainingCompletedQuestions: ${trainingState.completedQuestions}`,
    `firstTryCorrectCount: ${trainingState.firstTryCorrectCount}`,
    `totalWrongCount: ${trainingState.totalWrongCount}`,
    `currentQuestionWrongCount: ${trainingState.currentQuestionWrongCount}`,
    `currentQuestionHadMistake: ${trainingState.currentQuestionHadMistake}`,
    `カテゴリ内のテンプレート総数: ${categoryTemplateCount}`,
    `生成された${trainingState.totalQuestions}問のテンプレートID: ${trainingState.questions.map((q) => q.templateId).join(", ")}`,
    `各問題のcategoryId: ${trainingState.questions.map((q) => (q.template ? q.template.categoryId : "(なし)")).join(", ")}`,
    `現在の問題ID: ${problem ? problem.id : "(なし)"}`,
    `現在のテンプレートID: ${problem ? problem.templateId : "(なし)"}`,
    `questionType: ${problem ? problem.questionType : "(なし)"}`,
    `正解式: ${formatSolutionRoutesForDebug(problem)}`
  ];

  console.groupCollapsed("%c[DEBUG] トレーニング情報", "color:#9dafff;font-weight:bold;");
  for (const line of lines) {
    console.log(line);
  }
  console.groupEnd();

  ui.updateDebugPanel(lines.join("\n"));
}
