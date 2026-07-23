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
//     incorrectCount:        この問題全体を通した不正解回数
//     timeoutCount:          この問題全体を通した時間切れ回数
//     currentQuestionPenalized: この問題で一度でもミス（不正解/時間切れ）があったか
//     firstWrongFormulaText: この問題を通して最初に誤答した式（結果画面の「まちがえた式」表示用。
//                            運用開始後に追加）
//   }
//
// question-generator.js の buildChoiceCards / makeCard を再利用するため、
// このファイルは question-generator.js を import します。
// question-generator.js も（2段階問題の初期化のために）このファイルを import しますが、
// お互いの関数はすべて「呼び出し時」にしか使わないため、この相互参照は安全です。

import { matchesStep } from "./answer-checker.js";
import { buildChoiceCards } from "./question-generator.js";
import { renderValueHtml } from "./value-renderer.js";
import { areValuesEqual, valueKey } from "./value-utils.js";

const DEFAULT_TOTAL_STEPS = 2;

function createMultiStepState(problem) {
  return {
    currentStepIndex: 0,
    totalSteps: problem.totalSteps || DEFAULT_TOTAL_STEPS,
    candidateRouteIds: problem.solutionRoutes.map((route) => route.id),
    intermediateResults: {},
    completedSteps: [],
    incorrectCount: 0,
    timeoutCount: 0,
    currentQuestionPenalized: false,
    // 結果画面の履歴に「まちがえた式」として表示する、この問題を通して最初に誤答した式
    // （どのステップで誤答したかは問わない。運用開始後に追加）。
    firstWrongFormulaText: null
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
 *
 * 1つのステップの left と right がたまたま同じ値になる場合（例:
 * 「比を使った数量」で単位量と比の項がどちらも6になり、正解式が6×6になる場合）は、
 * カードが2枚必要です。以前はここを値そのものをキーにした Map で1枚に集約してしまい、
 * 「6のカードが1枚しか出現せず解答不可能」というバグがありました（第11段階で発見・修正）。
 * そのため、各ルートのステップごとに「値ごとに何回登場するか」を数え、
 * 複数ルートが候補に残っている場合は、その最大値（＝どのルートを選んでも組み立てられる枚数）
 * を採用します。値の同一判定は分数・百分率・比でも正しく行えるよう valueKey() を使います。
 */
function buildChoicesForActiveStep(problem, state) {
  const activeStepDefs = getActiveStepDefs(problem, state);
  const intermediateKeys = new Set(Object.values(state.intermediateResults).map((v) => valueKey(v)));

  const operators = [];
  const stepResults = [];
  const maxCountsByKey = new Map();

  for (const { step } of activeStepDefs) {
    if (!operators.includes(step.operator)) {
      operators.push(step.operator);
    }
    stepResults.push(step.result);

    const routeCounts = new Map();
    for (const value of [step.left, step.right]) {
      const key = valueKey(value);
      const isIntermediate = intermediateKeys.has(key);
      const entry = routeCounts.get(key) || { value, source: isIntermediate ? "intermediate" : "variable", count: 0 };
      entry.count += 1;
      routeCounts.set(key, entry);
    }

    for (const [key, entry] of routeCounts) {
      const existing = maxCountsByKey.get(key);
      if (!existing || entry.count > existing.count) {
        maxCountsByKey.set(key, entry);
      }
    }
  }

  const realNumbers = [];
  for (const { value, source, count } of maxCountsByKey.values()) {
    for (let i = 0; i < count; i++) {
      realNumbers.push({ value, source });
    }
  }

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

// 数値・分数どちらの値でも共通して扱えるよう、value-renderer.js の renderValueHtml() を使う
// （今回のバージョンの2段階問題はすべて整数のみのため、返る文字列の見た目は
//  従来のformatNumber()と変わらない。将来、分数の2段階問題を追加した場合に
//  自動的に縦型分数のHTMLになるようにするための下地）。
function formatFormula(left, operator, right, { useSeparator = true } = {}) {
  return `${renderValueHtml(left, { useSeparator })}${operator}${renderValueHtml(right, { useSeparator })}`;
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
    // 履歴内の他の数値表示（正解式・カード等）と同じく、桁区切りカンマは付けない
    // （useSeparator: false。以前は既定のtrueのままだったため、未完了ステップの
    // 「（解答途中）」表示だけ桁区切りカンマが付く不整合があった）。
    const attemptFormula = formatFormula(submittedLeft, submittedOperator, submittedRight, { useSeparator: false });
    if (state.firstWrongFormulaText === null) {
      state.firstWrongFormulaText = attemptFormula;
    }
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

  const isFinal = state.currentStepIndex >= state.totalSteps - 1;

  if (!isFinal) {
    state.currentStepIndex += 1;
    problem.choices = buildChoicesForActiveStep(problem, state);
  }

  return { correct: true, isFinal, stepResult: step.result };
}

/**
 * 時間切れを記録します（不正解と同様、ステップ番号・中間結果は維持します）。
 */
export function recordTimeout(problem) {
  const state = problem.multiStep;
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

  // 完了しなかったステップでも正解の式を確認できるよう、まだ候補として残っている解法
  // ルートのうち1つ（先頭）を「参照ルート」として使う（運用開始後に追加。ゲームオーバー・
  // リタイアで最後まで解けなかった問題は、以前は「未回答」としか表示しておらず正解を
  // 確認できなかった。1段階問題の履歴（buildSingleStepHistoryHtml()）が常に正解式を
  // 表示するのと同じ考え方に揃えた）。各解法ルートのステップは生成時にすでに確定した値
  // （question-generator.js の resolveMultiStepRoutes() 参照）のため、プレイヤーが
  // どこまで解いたかに関わらずそのまま「正解の式」として使える。
  const referenceRoute =
    problem.solutionRoutes.find((route) => route.id === state.candidateRouteIds[0]) || problem.solutionRoutes[0];

  for (let i = 0; i < state.totalSteps; i++) {
    const completed = state.completedSteps.find((s) => s.stepIndex === i);
    if (completed) {
      steps.push({
        stepNumber: i + 1,
        // 結果画面の履歴では桁区切りカンマを付けない（例: "3,900" ではなく "3900"）。
        formula: formatFormula(completed.left, completed.operator, completed.right, { useSeparator: false }),
        result: completed.result,
        completed: true
      });
    } else {
      const refStep = referenceRoute ? referenceRoute.steps[i] : null;
      steps.push({
        stepNumber: i + 1,
        completed: false,
        correctFormula: refStep ? formatFormula(refStep.left, refStep.operator, refStep.right, { useSeparator: false }) : null,
        correctResult: refStep ? refStep.result : null
      });
    }
  }

  const isComplete = state.completedSteps.length >= state.totalSteps;
  const usedRouteIds = state.completedSteps.map((s) => s.routeIds).flat();

  return {
    questionType: "multiStep",
    category: problem.category,
    text: problem.text,
    // 分数・比の値が問題文に直接登場するテンプレート（小学6年生2学期、第11段階で追加）は
    // textParts を持つ。1段階問題の履歴と同じく、ui.js が縦型分数・比として描画する。
    textParts: problem.textParts || null,
    // 比例・反比例の関係表（小学6年生3学期、第12段階で追加）。表を持たない問題では null。
    relationTable: problem.relationTable || null,
    answerUnit: problem.answerUnit,
    finalAnswer: problem.answer !== undefined ? problem.answer : problem.result,
    steps,
    incorrectCount: state.incorrectCount,
    timeoutCount: state.timeoutCount,
    firstWrongFormulaText: state.firstWrongFormulaText,
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
      // 分数の値は、複数ルートが共有する同じ値でも、ルートごとに別々のオブジェクトとして
      // 計算されるため、参照が一致するとは限らない（Array.includes() は参照比較のため、
      // 値としては等しいカードがあるのに「無い」と誤判定してしまう）。実際のゲーム進行での
      // 正誤判定（answer-checker.js の matchesStep）はもともと値ベースの比較のため、この問題は
      // このシミュレーション関数だけの誤判定だった（第11段階で発見・修正。「比を使った数量」の
      // カード不足バグの調査中に見つかった）。
      if (!numberValues.some((value) => areValuesEqual(value, step.left))) {
        errors.push(`[${routeId}] ステップ${stepIndex + 1}: 必要な数値カードがありません: ${JSON.stringify(step.left)}`);
      }
      if (!numberValues.some((value) => areValuesEqual(value, step.right))) {
        errors.push(`[${routeId}] ステップ${stepIndex + 1}: 必要な数値カードがありません: ${JSON.stringify(step.right)}`);
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
      // 分数・百分率の値はステップごとに新しいオブジェクトとして計算されるため、
      // 参照が一致するとは限らない（値として等しくても !== は true になる）。
      // 型を意識せず正しく比較できる areValuesEqual() を使う（第11段階で修正。
      // 分数の速さのように、複数ルートの最終結果が分数になるケースで、
      // 以前は誤って「一致しない」と判定されるバグがあった）。
      if (outcome.isFinal && !areValuesEqual(outcome.stepResult, finalAnswer)) {
        errors.push(`[${routeId}] 最終結果が答えと一致しません: ${JSON.stringify(outcome.stepResult)} !== ${JSON.stringify(finalAnswer)}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
