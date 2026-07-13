// 式の正誤判定を行うモジュール。
// eval() は使用せず、数値・演算記号を個別に受け取って安全に計算します。
// たし算・ひき算・かけ算は number-utils.js の誤差の出ない計算関数を使うため、
// 0.1 + 0.2 のような浮動小数点の誤差の影響を受けません。

import { addDecimal, subtractDecimal, multiplyDecimal, normalizeNumber, areNumbersEqual } from "./number-utils.js";

const OPERATORS = ["+", "-", "×", "÷"];

/**
 * 2つの数値と演算記号から、安全に計算結果を求めます。
 * 割り算で割り切れない場合や 0 で割る場合は null を返します。
 * 小数のたし算・ひき算・かけ算は number-utils.js のスケーリング計算を使うため、
 * 浮動小数点の誤差が出ません。
 * @param {number} left
 * @param {"+"|"-"|"×"|"÷"} operator
 * @param {number} right
 * @returns {number|null}
 */
export function safeCalculate(left, operator, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return null;
  }
  switch (operator) {
    case "+":
      return addDecimal(left, right);
    case "-":
      return subtractDecimal(left, right);
    case "×":
      return multiplyDecimal(left, right);
    case "÷": {
      if (right === 0) {
        return null;
      }
      const normalizedLeft = normalizeNumber(left);
      const normalizedRight = normalizeNumber(right);
      if (normalizedLeft % normalizedRight !== 0) {
        return null;
      }
      return normalizeNumber(normalizedLeft / normalizedRight);
    }
    default:
      return null;
  }
}

/**
 * ある1つの式（left operator right = result）が、正解ステップの定義
 * （1段階問題の solutionRoutes の要素、または2段階問題の steps の要素）と一致するかどうかを
 * 判定する共通ロジックです。1段階問題（answer-checker.js の checkAnswer）と
 * 2段階問題（multi-step-engine.js の途中式判定）の両方から使われます。
 *
 * step.commutative が明示されていればそれに従い、無い場合は演算子から自動判定します
 * （"+" "×" は交換法則あり、"-" "÷" は順序を区別する、という既存仕様どおりの既定値）。
 *
 * @param {{left:number, operator:string, right:number, commutative?:boolean}} step
 * @param {number} submittedLeft
 * @param {string} submittedOperator
 * @param {number} submittedRight
 * @returns {boolean}
 */
export function matchesStep(step, submittedLeft, submittedOperator, submittedRight) {
  if (!step || submittedOperator !== step.operator) {
    return false;
  }
  const isCommutative =
    step.commutative !== undefined ? Boolean(step.commutative) : step.operator === "+" || step.operator === "×";

  // 小数の内部誤差の影響を受けないよう、厳密な === ではなく誤差許容の比較を使う。
  const sameOrder = areNumbersEqual(submittedLeft, step.left) && areNumbersEqual(submittedRight, step.right);
  const reversedOrder =
    isCommutative && areNumbersEqual(submittedLeft, step.right) && areNumbersEqual(submittedRight, step.left);
  return sameOrder || reversedOrder;
}

/**
 * 児童が組み立てた式が、問題の正解ルート（solutionRoutes）のいずれかと
 * 一致するかどうかを判定します（1段階問題用）。
 * たし算・かけ算のように commutative なルートは、数値の順番が逆でも正解とします。
 * ひき算・わり算のように commutative でないルートは、数値の順番を区別します。
 *
 * 1つの問題が複数の正解ルートを持つ場合（solutionRoutes に複数要素がある場合）、
 * いずれか1つのルートに一致すれば正解として扱います。
 * solutionRoutes を持たない古い形式の problem を渡した場合は、
 * left/operator/right/commutative から単一ルートとして扱う後方互換の動作をします。
 *
 * 2段階問題（questionType: "multiStep"）の途中式判定には使いません。
 * そちらは multi-step-engine.js が matchesStep() を直接使って判定します。
 *
 * @param {{solutionRoutes?: Array<{left:number, operator:string, right:number, result:number, commutative:boolean}>, left?:number, operator?:string, right?:number, result?:number, commutative?:boolean}} problem
 * @param {number} submittedLeft
 * @param {string} submittedOperator
 * @param {number} submittedRight
 * @returns {{correct: boolean, result: number|null}}
 */
export function checkAnswer(problem, submittedLeft, submittedOperator, submittedRight) {
  const computedResult = safeCalculate(submittedLeft, submittedOperator, submittedRight);

  if (!OPERATORS.includes(submittedOperator)) {
    return { correct: false, result: computedResult };
  }

  const routes =
    problem.solutionRoutes && problem.solutionRoutes.length > 0
      ? problem.solutionRoutes
      : [
          {
            left: problem.left,
            operator: problem.operator,
            right: problem.right,
            result: problem.result,
            commutative: problem.commutative
          }
        ];

  for (const route of routes) {
    if (matchesStep(route, submittedLeft, submittedOperator, submittedRight)) {
      return { correct: true, result: route.result };
    }
  }

  return { correct: false, result: computedResult };
}
