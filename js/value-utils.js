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
  areFractionsEqual,
  isValidFraction,
  simplifyFraction,
  fractionToNumber
} from "./fraction-utils.js";

/**
 * 値が分数オブジェクトかどうかを判定します。
 */
export function isFractionValue(value) {
  return !!value && typeof value === "object" && value.type === "fraction";
}

/**
 * 値が数値（整数・小数）かどうかを判定します。
 */
export function isNumberValue(value) {
  return typeof value === "number";
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
 * 値（数値・分数どちらでも）を正規化します。
 * 数値は浮動小数点の丸め誤差を除去し、分数は約分（整数になる場合は整数化）します。
 */
export function normalizeValue(value) {
  if (isFractionValue(value)) {
    return collapseFractionIfInteger(value);
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
  return isFractionValue(value) ? "fraction" : "number";
}

/**
 * 値が負であるかどうかを、型を意識せず判定します。
 */
export function isValueNegative(value) {
  if (isFractionValue(value)) {
    return value.numerator < 0;
  }
  return typeof value === "number" && value < 0;
}

/**
 * left operator right を、値の型（整数・小数・分数）に応じて安全に計算します。
 * eval() は使用しません。計算できない場合（0で割る、割り切れない、
 * 型の組み合わせが今回未対応 など）は null を返します。
 *
 * 今回のバージョンで対応している組み合わせ:
 *   - 数値 + 数値 / 数値 - 数値 / 数値 × 数値
 *   - 数値 ÷ 数値（わる数が整数なら divideExactByInteger、小数なら divideExactByDecimal。
 *     どちらも割り切れる場合のみ）
 *   - 分数 + 分数 / 分数 - 分数（分子・分母を使った正確な計算。異分母も数式としては正しく計算する）
 * 分数と数値が混在する計算（分数×整数 など）は今回のデータには存在しませんが、
 * 呼び出された場合は null を返します（今回未対応のため）。
 */
export function calculateValues(left, operator, right) {
  if (isFractionValue(left) && isFractionValue(right)) {
    switch (operator) {
      case "+":
        return normalizeValue(addFractions(left, right));
      case "-":
        return normalizeValue(subtractFractions(left, right));
      default:
        // 分数どうしのかけ算・わり算は今回のバージョンでは未対応。
        return null;
    }
  }

  if (isFractionValue(left) || isFractionValue(right)) {
    // 分数と整数・小数が混在する計算は今回のバージョンでは未対応。
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
    case "÷": {
      if (right === 0) return null;
      const normalizedLeft = normalizeNumber(left);
      const normalizedRight = normalizeNumber(right);
      // わる数が整数か小数かで、既存の divideExactByInteger（小学4年生・5年生の整数÷わり算）と
      // 小数対応の divideExactByDecimal（小学5年生1学期の小数÷小数、小数倍・もとの量の「÷」）を
      // 使い分ける。どちらも「割り切れる場合だけ商を返す」という安全性は共通。
      return Number.isInteger(normalizedRight)
        ? divideExactByInteger(normalizedLeft, normalizedRight)
        : divideExactByDecimal(normalizedLeft, normalizedRight);
    }
    default:
      return null;
  }
}

/**
 * 2つの値が等しいかどうかを、型を意識せず判定します。
 * 分数どうしは分子・分母から正確に、数値どうしは誤差許容で比較します。
 * 分数と数値が混在する場合は、分数を数値に変換して誤差許容で比較します
 * （今回のテンプレートでは基本的に発生しませんが、安全のため対応しています）。
 */
export function areValuesEqual(a, b) {
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
export function formatValue(value) {
  if (isFractionValue(value)) {
    const s = simplifyFraction(value);
    return `${s.numerator}/${s.denominator}`;
  }
  return formatNumber(value);
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
  return getDecimalPlaces(value);
}

export { isValidFraction };
