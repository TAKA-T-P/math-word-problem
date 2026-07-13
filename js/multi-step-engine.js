// 2段階（2つの式で解く）文章題に関する処理を専門に担当するモジュール。
// game.js / ui.js には2段階問題の判定・進行ロジックを持たせず、
// すべてここに集約します。
//
// 1問の進行状態は problem.multiStep というオブジェクトに保持します
// （gameState 側にフラットなフィールドを追加するのではなく、問題オブジェクトに
// 紐づけています。新しい問題を生成するたびに自動的に初期状態へリセットされるため、
// gameState 側でリセット漏れを気にする必要がなくなります）。
//
//   problem.multiStep = {
//     currentStepIndex:      0始まりの現在のステップ番号（0 = 式1, 1 = 式2）
//     totalSteps:            2（今回はすべて2段階固定）
//     candidateRouteIds:     現在も正解になりうる解法ルートIDの一覧
//     intermediateResults:   完了したステップの resultKey -> 数値
//     completedSteps:        完了したステップの記録（履歴表示用）
//     currentStepAttempts:   現在のステップで児童が試した式の文字列（未完了ステップの履歴用）
//     incorrectCount:        この問題全体を通した不正解回数
//     timeoutCount:          この問題全体を通した時間切れ回数
//     currentQuestionPenalized: この問題で一度でもミス（不正解/時間切れ）があったか
//   }
//
// question-generator.js の buildChoiceCards / makeCard を再利用するため、
// このファイルは question-generator.js を import します。
// question-generator.js も（2段階問題の初期化のために）このファイルを import しますが、
// お互いの関数はすべて「呼び出し時」にしか使わないため、この相互参照は安全です。

import { matchesStep } from "./answer-checker.js";
import { buildChoiceCards } from "./question-generator.js";
import { formatNumber } from "./number-utils.js";

const DEFAULT_TOTAL_STEPS = 2;

function createMultiStepState(problem) {
  return {
    currentStepIndex: 0,
    totalSteps: problem.totalSteps || DEFAULT_TOTAL_STEPS,
    candidateRouteIds: problem.solutionRoutes.map((route) => route.id),
    intermediateResults: {},
    completedSteps: [],
    currentStepAttempts: [],
    incorrectCount: 0,
    timeoutCount: 0,
    currentQuestionPenalized: false
  };
}

/**
 * 現在、正解として有効な解法ルートの「今のステップ」の定義一覧を返します。
 * @returns {Array<{routeId: string, step: object}>}
 */
function getActiveStepDefs(problem, state) {
  return problem.solutionRoutes
    .filter((route) => state.candidateRouteIds.includes(route.id))
    .map((route) => ({ routeId: route.id, step: route.steps[state.currentStepIndex] }));
}

/**
 * 現在のステップで使用可能な選択肢カードを構築します。
 * 複数の解法ルートが候補として残っている場合、それぞれのルートが必要とする
 * 数値・演算記号をすべて選択肢に含めます（どちらの式で答えても正解にできるように）。
 * 中間結果（前のステップまでに確定した値）は "intermediate" として区別します。
 */
function buildChoicesForActiveStep(problem, state) {
  const activeStepDefs = getActiveStepDefs(problem, state);
  const intermediateValues = new Set(Object.values(state.intermediateResults));

  const numberMap = new Map();
  const operators = [];
  const stepResults = [];

  for (const { step } of activeStepDefs) {
    if (!operators.includes(step.operator)) {
      operators.push(step.operator);
    }
    stepResults.push(step.result);
    for (const value of [step.left, step.right]) {
      const isIntermediate = intermediateValues.has(value);
      const existing = numberMap.get(value);
      if (!existing || (isIntermediate && existing.source !== "intermediate")) {
        numberMap.set(value, { value, source: isIntermediate ? "intermediate" : "variable" });
      }
    }
  }

  const realNumbers = Array.from(numberMap.values());
  const finalAnswer = problem.answer !== undefined ? problem.answer : problem.result;
  return buildChoiceCards(realNumbers, operators, [...stepResults, finalAnswer]);
}

/**
 * 2段階問題を初期化します。question-generator.js が問題を生成した直後に呼び出します。
 * problem.multiStep（進行状態）と problem.choices（1つ目の式用カード）をセットして返します。
 */
export function initializeMultiStepQuestion(problem) {
  problem.multiStep = createMultiStepState(problem);
  problem.choices = buildChoicesForActiveStep(problem, problem.multiStep);
  return problem;
}

/**
 * 現在のステップの進行ラベル（例: "式 1／2"）を返します。
 */
export function getStepProgressLabel(problem) {
  const state = problem.multiStep;
  return `式 ${state.currentStepIndex + 1}／${state.totalSteps}`;
}

function formatFormula(left, operator, right) {
  return `${formatNumber(left)}${operator}${formatNumber(right)}`;
}

/**
 * 児童が組み立てた式を、現在のステップの正解候補と照合します。
 * 正解の場合は状態を進め（中間結果の保存・候補ルートの絞り込み・次のステップ用カード生成）、
 * 不正解の場合は試行履歴とペナルティフラグだけを更新します（ステップ番号は変えません）。
 *
 * @returns {{correct: boolean, isFinal: boolean, stepResult: number|null}}
 */
export function submitStepAnswer(problem, submittedLeft, submittedOperator, submittedRight) {
  const state = problem.multiStep;
  const activeStepDefs = getActiveStepDefs(problem, state);

  const matchedRouteIds = activeStepDefs
    .filter(({ step }) => matchesStep(step, submittedLeft, submittedOperator, submittedRight))
    .map(({ routeId }) => routeId);

  if (matchedRouteIds.length === 0) {
    state.currentStepAttempts.push(formatFormula(submittedLeft, submittedOperator, submittedRight));
    state.incorrectCount += 1;
    state.currentQuestionPenalized = true;
    return { correct: false, isFinal: false, stepResult: null };
  }

  const matchedDef = activeStepDefs.find(({ routeId }) => routeId === matchedRouteIds[0]);
  const { step } = matchedDef;

  state.completedSteps.push({
    stepIndex: state.currentStepIndex,
    left: submittedLeft,
    operator: submittedOperator,
    right: submittedRight,
    result: step.result,
    resultKey: step.resultKey,
    routeIds: matchedRouteIds
  });
  state.candidateRouteIds = matchedRouteIds;
  if (step.resultKey) {
    state.intermediateResults[step.resultKey] = step.result;
  }
  state.currentStepAttempts = [];

  const isFinal = state.currentStepIndex >= state.totalSteps - 1;

  if (!isFinal) {
    state.currentStepIndex += 1;
    problem.choices = buildChoicesForActiveStep(problem, state);
  }

  return { correct: true, isFinal, stepResult: step.result };
}

/**
 * 時間切れを記録します（不正解と同様、ステップ番号・中間結果は維持します）。
 * @param {object|null} lastPlacedAnswer - 時間切れ時点で解答欄に置かれていた式（未完成なら null）
 */
export function recordTimeout(problem, lastPlacedAnswer) {
  const state = problem.multiStep;
  if (lastPlacedAnswer) {
    state.currentStepAttempts.push(
      formatFormula(lastPlacedAnswer.left, lastPlacedAnswer.operator, lastPlacedAnswer.right)
    );
  }
  state.timeoutCount += 1;
  state.currentQuestionPenalized = true;
}

/**
 * 結果画面の問題履歴に載せるデータを組み立てます。
 * リタイア・ゲームオーバーで途中の問題も、そのまま履歴に残せる形式にしています。
 */
export function buildHistoryEntry(problem) {
  const state = problem.multiStep;
  const steps = [];

  for (let i = 0; i < state.totalSteps; i++) {
    const completed = state.completedSteps.find((s) => s.stepIndex === i);
    if (completed) {
      steps.push({
        stepNumber: i + 1,
        formula: formatFormula(completed.left, completed.operator, completed.right),
        result: completed.result,
        completed: true
      });
    } else if (i === state.currentStepIndex) {
      const lastAttempt = state.currentStepAttempts[state.currentStepAttempts.length - 1] || null;
      steps.push({
        stepNumber: i + 1,
        formula: null,
        result: null,
        completed: false,
        lastAttemptFormula: lastAttempt
      });
    } else {
      steps.push({ stepNumber: i + 1, formula: null, result: null, completed: false, lastAttemptFormula: null });
    }
  }

  const isComplete = state.completedSteps.length >= state.totalSteps;
  const usedRouteIds = state.completedSteps.map((s) => s.routeIds).flat();

  return {
    questionType: "multiStep",
    category: problem.category,
    text: problem.text,
    answerUnit: problem.answerUnit,
    finalAnswer: problem.answer !== undefined ? problem.answer : problem.result,
    steps,
    incorrectCount: state.incorrectCount,
    timeoutCount: state.timeoutCount,
    isComplete,
    usedRouteIds: [...new Set(usedRouteIds)]
  };
}

/**
 * ?debug=true のときにデバッグパネル／コンソールへ出す2段階問題専用の情報を組み立てます。
 */
export function getDebugSnapshot(problem) {
  const state = problem.multiStep;
  if (!state) return null;
  const activeStepDefs = getActiveStepDefs(problem, state);
  return {
    questionType: "multiStep",
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.totalSteps,
    candidateRouteIds: state.candidateRouteIds,
    intermediateResults: state.intermediateResults,
    completedSteps: state.completedSteps,
    currentQuestionPenalized: state.currentQuestionPenalized,
    currentCorrectFormulas: activeStepDefs.map(
      ({ routeId, step }) => `[${routeId}] ${formatFormula(step.left, step.operator, step.right)}=${step.result}`
    ),
    routes: problem.solutionRoutes.map((route) => ({
      id: route.id,
      isCandidate: state.candidateRouteIds.includes(route.id),
      steps: route.steps.map((s) => `${formatFormula(s.left, s.operator, s.right)}=${s.result}`)
    }))
  };
}

/**
 * 開発者用の検証ページ（tools/question-validator.html）専用の重い検証ヘルパー。
 * 生成済みの問題を実際に「すべてのルートで最後まで正しく解けるか」シミュレーションします。
 * game.js からの通常プレイでは呼び出しません（毎回のカード生成をやり直すため負荷が大きい）。
 *
 * @returns {{valid: boolean, errors: string[]}}
 */
export function simulateAllRoutesToCompletion(problem) {
  const errors = [];
  const routeIds = problem.solutionRoutes.map((r) => r.id);

  for (const routeId of routeIds) {
    const simulated = {
      ...problem,
      multiStep: createMultiStepState(problem)
    };
    const route = problem.solutionRoutes.find((r) => r.id === routeId);

    for (let stepIndex = 0; stepIndex < route.steps.length; stepIndex++) {
      const step = route.steps[stepIndex];

      // このステップの時点でのカードを検証する
      const currentChoices = simulated.choices || [];
      if (currentChoices.length > 8) {
        errors.push(`[${routeId}] ステップ${stepIndex + 1}: 選択肢が8枚を超えています(${currentChoices.length}枚)`);
      }
      const numberValues = currentChoices.filter((c) => c.type === "number").map((c) => c.value);
      const operatorValues = currentChoices.filter((c) => c.type === "operator").map((c) => c.value);
      if (!numberValues.includes(step.left)) {
        errors.push(`[${routeId}] ステップ${stepIndex + 1}: 必要な数値カードがありません: ${step.left}`);
      }
      if (!numberValues.includes(step.right)) {
        errors.push(`[${routeId}] ステップ${stepIndex + 1}: 必要な数値カードがありません: ${step.right}`);
      }
      if (!operatorValues.includes(step.operator)) {
        errors.push(`[${routeId}] ステップ${stepIndex + 1}: 必要な演算記号カードがありません: ${step.operator}`);
      }
      const finalAnswer = problem.answer !== undefined ? problem.answer : problem.result;
      const dummyNumberCards = currentChoices.filter((c) => c.type === "number" && c.source === "dummy");
      if (dummyNumberCards.some((c) => c.value === finalAnswer)) {
        errors.push(`[${routeId}] ステップ${stepIndex + 1}: 最終的な答え(${finalAnswer})がダミーカードとして含まれています`);
      }
      if (stepIndex === 0 && currentChoices.some((c) => c.source === "intermediate")) {
        errors.push(`[${routeId}] ステップ1で中間結果カードが最初から表示されています`);
      }

      const outcome = submitStepAnswer(simulated, step.left, step.operator, step.right);
      if (!outcome.correct) {
        errors.push(`[${routeId}] ステップ${stepIndex + 1}: 正解式(${formatFormula(step.left, step.operator, step.right)})が正解と判定されませんでした`);
        break;
      }
      if (stepIndex === route.steps.length - 1 && !outcome.isFinal) {
        errors.push(`[${routeId}] 最終ステップのはずが isFinal になりませんでした`);
      }
      if (outcome.isFinal && outcome.stepResult !== (problem.answer !== undefined ? problem.answer : problem.result)) {
        errors.push(`[${routeId}] 最終結果が答えと一致しません: ${outcome.stepResult}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
