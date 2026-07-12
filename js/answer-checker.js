// 式の正誤判定を行うモジュール。
// eval() は使用せず、数値・演算記号を個別に受け取って安全に計算します。

const OPERATORS = ["+", "-", "×", "÷"];

/**
 * 2つの数値と演算記号から、安全に計算結果を求めます。
 * 割り算で割り切れない場合や 0 で割る場合は null を返します。
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
      return left + right;
    case "-":
      return left - right;
    case "×":
      return left * right;
    case "÷":
      if (right === 0) {
        return null;
      }
      if (left % right !== 0) {
        return null;
      }
      return left / right;
    default:
      return null;
  }
}

/**
 * 児童が組み立てた式が、問題の正解式と一致するかどうかを判定します。
 * たし算・かけ算は交換法則を認め、数値の順番が逆でも正解とします。
 * ひき算・わり算は数値の順番を区別します。
 *
 * @param {{left:number, operator:string, right:number, commutative:boolean}} problem
 * @param {number} submittedLeft
 * @param {string} submittedOperator
 * @param {number} submittedRight
 * @returns {{correct: boolean, result: number|null}}
 */
export function checkAnswer(problem, submittedLeft, submittedOperator, submittedRight) {
  const result = safeCalculate(submittedLeft, submittedOperator, submittedRight);

  if (!OPERATORS.includes(submittedOperator)) {
    return { correct: false, result };
  }
  if (submittedOperator !== problem.operator) {
    return { correct: false, result };
  }

  const sameOrder = submittedLeft === problem.left && submittedRight === problem.right;
  const reversedOrder =
    problem.commutative && submittedLeft === problem.right && submittedRight === problem.left;

  const correct = sameOrder || reversedOrder;
  return { correct, result: correct ? problem.result : result };
}
