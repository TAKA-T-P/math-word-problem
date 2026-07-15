// 整数・小数・分数を「共通の値」として扱うための橋渡しモジュール。
//
// このアプリでは、値(Value)は次のどちらかの形を取ります。
//   - 整数・小数: 素のJavaScript数値（例: 3, 2.4）
//   - 分数      : { type: "fraction", numerator, denominator }（例: { type:"fraction", numerator:3, denominator:5 }）
//
// 整数・小数を素の数値のまま維持しているのは、既存のカード・解答欄・スコア計算・
// ハイスコア等、数値をそのまま扱ってきた既存コードを壊さずに分数を追加するためです
// （詳しくは README「値オブジェクトの形式」を参照）。
//
// 「整数・小数・分数ごとの分岐」は、ゲーム本体（game.js / ui.js / answer-checker.js /
// question-generator.js）には書かず、すべてこのファイルに集約します。
// 実際の計算・比較は number-utils.js（数値）と fraction-utils.js（分数）に委譲します。

import {
  addDecimal,
  subtractDecimal,
  multiplyDecimal,
  divideExactByInteger,
  divideExactByDecimal,
  normalizeNumber,
  areNumbersEqual,
  formatNumber,
  getDecimalPlaces
} from "./number-utils.js";
import {
  addFractions,
  subtractFractions,
  multiplyFractions,
  divideFractions,
  multiplyFractionByInteger,
  divideFractionByInteger,
  divideIntegerByFraction,
  areFractionsEqual,
  isValidFraction,
  simplifyFraction,
  fractionToNumber
} from "./fraction-utils.js";
import { normalizePercent, percentToRatio, formatPercent, arePercentValuesEqual } from "./percentage-utils.js";
import { formatRatio, isValidRatio } from "./ratio-utils.js";
import { formatScale, isValidScale, areScalesEqual } from "./scale-utils.js";

/**
 * 値が分数オブジェクトかどうかを判定します。
 */
export function isFractionValue(value) {
  return !!value && typeof value === "object" && value.type === "fraction";
}

/**
 * 値が百分率オブジェクトかどうかを判定します（第9段階で追加）。
 */
export function isPercentValue(value) {
  return !!value && typeof value === "object" && value.type === "percent";
}

/**
 * 値が数値（整数・小数）かどうかを判定します。
 */
export function isNumberValue(value) {
  return typeof value === "number";
}

/**
 * 値が比オブジェクトかどうかを判定します（小学6年生2学期、第11段階で追加）。
 * 比は計算式（カード・解答欄）には登場せず、問題文・メタデータ・履歴・デバッグ表示専用の値です。
 */
export function isRatioValue(value) {
  return !!value && typeof value === "object" && value.type === "ratio";
}

/**
 * 値が縮尺オブジェクトかどうかを判定します（小学6年生3学期、第12段階で追加）。
 * 縮尺は比と同じく、計算式（カード・解答欄）には登場せず、問題文・メタデータ・
 * 履歴・デバッグ表示専用の値です。
 */
export function isScaleValue(value) {
  return !!value && typeof value === "object" && value.type === "scale";
}

/**
 * 分数の計算結果が整数になった場合（例: 4/4, 6/3）、原則どおり
 * 分母1の分数ではなく、素の整数値として返します。
 * 整数にならない場合は、約分済みの分数オブジェクトを返します。
 */
function collapseFractionIfInteger(fraction) {
  const simplified = simplifyFraction(fraction);
  return simplified.denominator === 1 ? simplified.numerator : simplified;
}

/**
 * 値（数値・分数・百分率どちらでも）を正規化します。
 * 数値は浮動小数点の丸め誤差を除去し、分数は約分（整数になる場合は整数化）し、
 * 百分率は丸め誤差を除去します（第9段階で百分率に対応）。
 */
export function normalizeValue(value) {
  if (isFractionValue(value)) {
    return collapseFractionIfInteger(value);
  }
  if (isPercentValue(value)) {
    return normalizePercent(value);
  }
  if (typeof value === "number") {
    return normalizeNumber(value);
  }
  return value;
}

/**
 * 値の種類を文字列で返します（デバッグ表示・検証ページ用）。
 */
export function getValueType(value) {
  if (isFractionValue(value)) return "fraction";
  if (isPercentValue(value)) return "percent";
  if (isRatioValue(value)) return "ratio";
  if (isScaleValue(value)) return "scale";
  return "number";
}

/**
 * 値が負であるかどうかを、型を意識せず判定します。
 */
export function isValueNegative(value) {
  if (isFractionValue(value)) {
    return value.numerator < 0;
  }
  if (isPercentValue(value)) {
    return value.value < 0;
  }
  return typeof value === "number" && value < 0;
}

/**
 * 整数・小数どうしの安全なわり算（既存の divideExactByInteger / divideExactByDecimal の使い分け）。
 * 数値×百分率から得た比率で割る場合（数値÷百分率）にも共有するため、関数として切り出しています。
 */
function divideNumbers(left, right) {
  if (right === 0) return null;
  const normalizedLeft = normalizeNumber(left);
  const normalizedRight = normalizeNumber(right);
  return Number.isInteger(normalizedRight)
    ? divideExactByInteger(normalizedLeft, normalizedRight)
    : divideExactByDecimal(normalizedLeft, normalizedRight);
}

/**
 * left operator right を、値の型（整数・小数・分数・百分率）に応じて安全に計算します。
 * eval() は使用しません。計算できない場合（0で割る、割り切れない、
 * 型の組み合わせが今回未対応 など）は null を返します。
 *
 * 今回のバージョンで対応している組み合わせ:
 *   - 数値 + 数値 / 数値 - 数値 / 数値 × 数値
 *   - 数値 ÷ 数値（わる数が整数なら divideExactByInteger、小数なら divideExactByDecimal。
 *     どちらも割り切れる場合のみ）
 *   - 分数 + 分数 / 分数 - 分数（分子・分母を使った正確な計算。異分母も数式としては正しく計算する）
 *   - 分数 × 分数 / 分数 ÷ 分数（第10段階で追加。わり算は右辺の逆数をかける方式。右辺が0なら null）
 *   - 分数 × 整数 / 整数 × 分数（第10段階で追加。交換法則が成り立つためどちらの順序も対応）
 *   - 分数 ÷ 整数 / 整数 ÷ 分数（第10段階で追加。順序を区別する。0でわる場合は null）
 *   - 百分率 + 百分率 / 百分率 - 百分率（結果は百分率。例: 100%－20%＝80%）
 *   - 数値 × 百分率 / 百分率 × 数値（結果は数値。百分率を比率に変換してから掛ける。例: 3000×20%＝600）
 *   - 数値 ÷ 百分率（結果は数値。百分率を比率に変換してから、割り切れる場合だけ商を返す。例: 600÷20%＝3000）
 * 分数と小数・分数と百分率が混在する計算、百分率どうしのかけ算・わり算、
 * 数値と百分率のたし算・ひき算は今回のバージョンでは未対応で、呼び出された場合は null を返します
 * （「数値÷数値」の結果を百分率として扱いたい場合は、この関数ではなく、
 *  呼び出し側が solutionRoutes の resultType:"percent" を使って変換してください）。
 */
export function calculateValues(left, operator, right) {
  if (isFractionValue(left) && isFractionValue(right)) {
    switch (operator) {
      case "+":
        return normalizeValue(addFractions(left, right));
      case "-":
        return normalizeValue(subtractFractions(left, right));
      case "×":
        return normalizeValue(multiplyFractions(left, right));
      case "÷": {
        const divided = divideFractions(left, right);
        return divided === null ? null : normalizeValue(divided);
      }
      default:
        return null;
    }
  }

  if (isFractionValue(left) && typeof right === "number") {
    // 分数×整数・分数÷整数（第10段階で追加）。整数以外（小数）は今回未対応のため null。
    if (operator === "×") {
      const multiplied = multiplyFractionByInteger(left, right);
      return multiplied === null ? null : normalizeValue(multiplied);
    }
    if (operator === "÷") {
      const divided = divideFractionByInteger(left, right);
      return divided === null ? null : normalizeValue(divided);
    }
    return null;
  }

  if (typeof left === "number" && isFractionValue(right)) {
    // 整数×分数（かけ算の交換法則）・整数÷分数（第10段階で追加）。
    if (operator === "×") {
      const multiplied = multiplyFractionByInteger(right, left);
      return multiplied === null ? null : normalizeValue(multiplied);
    }
    if (operator === "÷") {
      const divided = divideIntegerByFraction(left, right);
      return divided === null ? null : normalizeValue(divided);
    }
    return null;
  }

  if (isFractionValue(left) || isFractionValue(right)) {
    // 分数と、小数・百分率が混在する計算は今回のバージョンでは未対応。
    return null;
  }

  if (isPercentValue(left) && isPercentValue(right)) {
    switch (operator) {
      case "+":
        return normalizeValue({ type: "percent", value: addDecimal(left.value, right.value) });
      case "-":
        return normalizeValue({ type: "percent", value: subtractDecimal(left.value, right.value) });
      default:
        // 百分率どうしのかけ算・わり算は今回のバージョンでは未対応。
        return null;
    }
  }

  if (isPercentValue(left) && typeof right === "number") {
    // 百分率×数値（例: 20%×3000＝600）。かけ算のみ対応。
    if (operator === "×") {
      return normalizeValue(multiplyDecimal(percentToRatio(left), right));
    }
    return null;
  }

  if (typeof left === "number" && isPercentValue(right)) {
    // 数値×百分率（例: 3000×20%＝600）、数値÷百分率（例: 600÷20%＝3000）。
    if (operator === "×") {
      return normalizeValue(multiplyDecimal(left, percentToRatio(right)));
    }
    if (operator === "÷") {
      return normalizeValue(divideNumbers(left, percentToRatio(right)));
    }
    return null;
  }

  if (isPercentValue(left) || isPercentValue(right)) {
    // 上記以外の百分率と数値の組み合わせ（百分率÷数値など）は今回のバージョンでは未対応。
    return null;
  }

  if (typeof left !== "number" || typeof right !== "number" || !Number.isFinite(left) || !Number.isFinite(right)) {
    return null;
  }

  switch (operator) {
    case "+":
      return addDecimal(left, right);
    case "-":
      return subtractDecimal(left, right);
    case "×":
      return multiplyDecimal(left, right);
    case "÷":
      // わる数が整数か小数かで、既存の divideExactByInteger（小学4年生・5年生の整数÷わり算）と
      // 小数対応の divideExactByDecimal（小学5年生1学期の小数÷小数、小数倍・もとの量の「÷」）を
      // 使い分ける。どちらも「割り切れる場合だけ商を返す」という安全性は共通。
      return divideNumbers(left, right);
    default:
      return null;
  }
}

/**
 * 2つの値が等しいかどうかを、型を意識せず判定します。
 * 分数どうしは分子・分母から正確に、数値どうしは誤差許容で比較します。
 * 分数と数値が混在する場合は、分数を数値に変換して誤差許容で比較します
 * （今回のテンプレートでは基本的に発生しませんが、安全のため対応しています）。
 * 百分率どうしは value を誤差許容で比較します（第9段階で追加）。
 * 百分率は分数・数値のどちらとも混在させない設計のため、型が食い違う場合は
 * （百分率とそれ以外の組み合わせも含めて）false を返します。
 */
export function areValuesEqual(a, b) {
  if (isPercentValue(a) || isPercentValue(b)) {
    return arePercentValuesEqual(a, b);
  }
  // 縮尺・比は式の計算には使わない表示専用の値だが、「縮尺を求める」（第12段階で追加）では
  // 縮尺そのものが最終的な答えになるため、areValuesEqual() でも正しく比較できる必要がある
  // （分子は常に1のため、分母どうしの比較で十分）。
  if (isScaleValue(a) || isScaleValue(b)) {
    return areScalesEqual(a, b);
  }
  if (isRatioValue(a) || isRatioValue(b)) {
    return isValidRatio(a) && isValidRatio(b) && a.antecedent === b.antecedent && a.consequent === b.consequent;
  }
  if (isFractionValue(a) && isFractionValue(b)) {
    return areFractionsEqual(a, b);
  }
  if (isFractionValue(a) || isFractionValue(b)) {
    const numA = isFractionValue(a) ? fractionToNumber(a) : a;
    const numB = isFractionValue(b) ? fractionToNumber(b) : b;
    return areNumbersEqual(numA, numB);
  }
  return areNumbersEqual(a, b);
}

/**
 * 値を表示用の文字列に変換します（縦型HTMLではなく、プレーンテキストの表現）。
 * 分数は "3/5" のような横並び表記になるため、実際の画面表示には
 * value-renderer.js の renderValueHtml() を使用してください
 * （formatValue はデバッグ用テキスト・検証ページのテキスト表示など、
 *  縦型HTMLを使わない場所専用です）。
 */
export function formatValue(value, { simplify = true } = {}) {
  if (isFractionValue(value)) {
    const s = simplify ? simplifyFraction(value) : value;
    // 約分の結果、分母が1になる場合（＝整数値の場合）は整数として表示する
    // （第10段階で追加。renderValueHtml() の同様の分岐と挙動を揃えている）。
    return s.denominator === 1 ? `${s.numerator}` : `${s.numerator}/${s.denominator}`;
  }
  if (isPercentValue(value)) {
    return formatPercent(value);
  }
  if (isRatioValue(value)) {
    return formatRatio(value);
  }
  if (isScaleValue(value)) {
    return formatScale(value);
  }
  return formatNumber(value);
}

/**
 * 同分母の分数どうしのたし算・ひき算の結果を、これ以上約分しない状態
 * （共通の分母のまま、分子だけをたし引きした状態）で返します（第9段階で追加）。
 * 「約分をまだ習っていない学年・学期」で同分母分数のたし算・ひき算を表示する際、
 * 通常の calculateValues/addFractions/subtractFractions が内部で行う約分を経ずに、
 * 表示用の値だけを求めるために使用します（正誤判定・保存されるデータそのものは
 * 引き続き約分済みの値を使うため、この関数は表示直前にのみ呼び出してください）。
 * 分母が異なる場合や、対応していない演算子の場合は null を返します。
 */
export function computeUnsimplifiedFractionResult(left, operator, right) {
  if (!isFractionValue(left) || !isFractionValue(right) || left.denominator !== right.denominator) {
    return null;
  }
  if (operator === "+") {
    return { type: "fraction", numerator: left.numerator + right.numerator, denominator: left.denominator };
  }
  if (operator === "-") {
    return { type: "fraction", numerator: left.numerator - right.numerator, denominator: left.denominator };
  }
  return null;
}

/**
 * 値をSet/Mapのキーとして使える一意な文字列に変換します
 * （選択肢カードの重複排除・ダミー値の除外判定などに使用）。
 * 分数は、生成された分子・分母をそのまま使います（約分後の値ではなく、
 * カードに実際に表示される構造そのものをキーにするため）。
 */
export function valueKey(value) {
  if (isFractionValue(value)) {
    return `fraction:${value.numerator}/${value.denominator}`;
  }
  if (isPercentValue(value)) {
    return `percent:${normalizeNumber(value.value)}`;
  }
  if (isRatioValue(value)) {
    return `ratio:${value.antecedent}:${value.consequent}`;
  }
  if (isScaleValue(value)) {
    return `scale:${value.numerator}:${value.denominator}`;
  }
  if (typeof value === "number") {
    return `number:${normalizeNumber(value)}`;
  }
  return `other:${String(value)}`;
}

/**
 * 値の配列の中に、指定した値と構造的に一致する要素が含まれているかを判定します
 * （オブジェクト参照の一致ではなく、valueKey() による値の一致で判定します）。
 */
export function valuesContainKey(values, target) {
  const targetKey = valueKey(target);
  return values.some((v) => valueKey(v) === targetKey);
}

/**
 * 値の小数点以下の桁数を返します。分数の場合は概念上存在しないため 0 を返します
 * （分数の「複雑さ」を確認したい場合は isFractionValue() と分子・分母を直接見てください）。
 */
export function getValueDecimalPlaces(value) {
  if (isFractionValue(value)) return 0;
  if (isPercentValue(value)) return getDecimalPlaces(value.value);
  return getDecimalPlaces(value);
}

/**
 * 値（分数オブジェクトまたは整数）を、必ず分数オブジェクトへ変換します（第10段階で追加）。
 * すでに分数の場合はそのまま返し、整数の場合は分母1の分数として返します。
 * 整数でない数値（小数）が渡された場合は null を返します
 * （今回のバージョンでは分数×小数・分数÷小数を想定していないため）。
 */
export function toFractionValue(value) {
  if (isFractionValue(value)) return value;
  if (typeof value === "number" && Number.isInteger(value)) {
    return { type: "fraction", numerator: value, denominator: 1 };
  }
  return null;
}

/**
 * 値（分数・百分率・整数・小数のいずれか）がゼロかどうかを、型を意識せず判定します
 * （第10段階で追加）。分数のわり算・整数のわり算・百分率のわり算で「0でわる」問題を
 * 生成・検証しないためのチェックに使います（question-validator.js の0でわるチェックを
 * このヘルパーに統一しています）。
 */
export function isZeroValue(value) {
  if (isFractionValue(value)) return value.numerator === 0;
  if (isPercentValue(value)) return value.value === 0;
  return value === 0;
}

/**
 * left ÷ right を、必ず正確な分数として計算します（小学6年生2学期、第11段階で追加）。
 * 通常の calculateValues() の整数・小数どうしのわり算（divideNumbers）は「割り切れる場合だけ
 * 商を返す」という安全設計のため、`20÷60` のような割り切れない組み合わせは null になり、
 * `30÷60` のような割り切れる組み合わせも小数（0.5）になってしまいます。分数の速さ
 * （時間の単位変換）・分数の割合（比べる量÷もとにする量）のように、**割り切れるかどうかに
 * 関わらず必ず分数として表示したい**場面のために、整数・分数のどちらでも受け付けて
 * 必ず分数を返す（0でわる場合だけ null を返す）この関数を用意しています。
 * `js/question-generator.js` の `resultType:"fraction"` 指定時に、通常の計算の代わりに使います。
 */
export function divideValuesAsFraction(left, right) {
  const leftFraction = toFractionValue(left);
  const rightFraction = toFractionValue(right);
  if (!leftFraction || !rightFraction) return null;
  const divided = divideFractions(leftFraction, rightFraction);
  return divided === null ? null : normalizeValue(divided);
}

export { isValidFraction };
export { isValidPercent } from "./percentage-utils.js";
export { isValidRatio, formatRatio } from "./ratio-utils.js";
export { isValidScale, formatScale, areScalesEqual } from "./scale-utils.js";
