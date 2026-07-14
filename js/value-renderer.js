// 値（整数・小数・分数）とtextParts形式の問題文を、画面表示用のHTML文字列に変換するモジュール。
//
// 分数は、教科書と同じ「横線の上に分子・下に分母」の縦型表示にする必要があるため、
// アプリ内のすべての表示箇所（問題文・選択肢カード・解答欄・■欄・正解演出・問題履歴・
// 問題検証ページ・デバッグ表示）が、必ずこのファイルの関数を経由してください。
// 各画面で個別にHTMLを組み立てないことで、表示方法の変更を1箇所に閉じ込められます。

import { formatNumber } from "./number-utils.js";
import { simplifyFraction } from "./fraction-utils.js";
import { formatPercent, percentToRatio } from "./percentage-utils.js";
import { isFractionValue, isPercentValue } from "./value-utils.js";

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/**
 * 分数の読み上げ用ラベルを「分母分の分子」の形式で返します。
 * 例: 分子3, 分母5 → "5分の3"
 * 既定では約分後の分子・分母を使います（読み上げと見た目を一致させるため）。
 * @param {{simplify?: boolean}} options - simplify: false で約分せずそのまま読み上げる
 *   （第9段階で追加。約分を学習していない学年・学期の同分母分数のたし算・ひき算専用）。
 */
export function buildFractionAriaLabel(fraction, { simplify = true } = {}) {
  const s = simplify ? simplifyFraction(fraction) : fraction;
  return `${s.denominator}分の${s.numerator}`;
}

/**
 * 値1つを、画面表示用のHTML文字列に変換します。
 * - 分数: 縦型分数のHTML（aria-label付き、読み上げにも対応）
 * - 百分率: 比率（小数）に変換してから表示します（例: 20% → "0.2"）。
 *   割合の計算は小数で行うという教科書の指導に合わせ、選択肢カード・解答欄・正解演出・
 *   問題履歴など、値として扱う場面ではすべて小数表記に統一します。
 *   問題文中の「20%」のような自然な言い回しは、この関数を経由せず
 *   `js/question-generator.js` の `renderTemplateText()`/`formatPercent()` が
 *   別途扱うため、この変更の影響を受けません。
 * - 整数・小数: number-utils.js の formatNumber() で末尾0除去（既定では桁区切りカンマも付与）した上でエスケープ
 * @param {number|{type:"fraction",numerator:number,denominator:number}|{type:"percent",value:number}} value
 * @param {{useSeparator?: boolean, simplify?: boolean}} options - useSeparator: false で桁区切りカンマを付けずに表示する
 *   （選択肢カード・解答欄・ドラッグ中のカードは「3900」のようにカンマ無しで表示するために使う）。
 *   simplify: false で分数を約分せずそのまま表示する（第9段階で追加。既定は true=約分して表示、
 *   これまでと同じ挙動。百分率には影響しません）。
 */
export function renderValueHtml(value, { useSeparator = true, simplify = true } = {}) {
  if (isFractionValue(value)) {
    const s = simplify ? simplifyFraction(value) : value;
    // 約分した結果、分母が1になる場合（＝整数値の場合）は、縦型分数ではなく
    // 通常の整数として表示する（第10段階で追加。小学6年生1学期の分数×分数・分数倍などで、
    // 生成された分数がたまたま整数に約分できる操作前の値そのものだったケースに対応するため。
    // 計算「結果」の整数化は既存の normalizeValue が別途行っており、この分岐は
    // カードに直接載る「操作前の値」の表示だけを対象にしている）。
    if (s.denominator === 1) {
      return escapeHtml(formatNumber(s.numerator, { useSeparator }));
    }
    const label = buildFractionAriaLabel(value, { simplify });
    return (
      `<span class="fraction" aria-label="${escapeHtml(label)}">` +
      `<span class="fraction-numerator">${s.numerator}</span>` +
      `<span class="fraction-denominator">${s.denominator}</span>` +
      `</span>`
    );
  }
  if (isPercentValue(value)) {
    return escapeHtml(formatNumber(percentToRatio(value), { useSeparator }));
  }
  return escapeHtml(formatNumber(value, { useSeparator }));
}

/**
 * 百分率の値を「小数→百分率」の形式（例: "0.5→50%"）でHTMLに変換します。
 * 「割合・百分率」（比べる量÷もとにする量＝割合）は、計算自体は小数のまま行いますが、
 * 問題文が「何%ですか」と百分率での回答を求めているため、正解時・問題履歴の答え表示だけは、
 * 計算結果の小数に加えて百分率への変換も示します。2段階問題の途中結果（割引・増量の
 * 「支払う割合」など）は、あくまで計算の中間値であり「%で答える」ものではないため、
 * この関数は使わず、通常の `renderValueHtml()`（小数表示）を使ってください。
 */
export function renderPercentConversionHtml(value, { useSeparator = true } = {}) {
  const ratioHtml = escapeHtml(formatNumber(percentToRatio(value), { useSeparator }));
  const percentHtml = escapeHtml(formatPercent(value));
  return `${ratioHtml}→${percentHtml}`;
}

/**
 * textParts形式（{type:"text", value:string} と {type:"value", value:Value} が交互に並ぶ配列）を
 * HTML文字列に変換します。分数を含む問題文は、このtextPartsを使って組み立ててください。
 * @param {{simplify?: boolean}} options - renderValueHtml() にそのまま引き継がれる（第9段階で追加）。
 */
export function renderTextPartsHtml(textParts, { simplify = true } = {}) {
  return textParts
    .map((part) => {
      if (part && part.type === "value") {
        return renderValueHtml(part.value, { simplify });
      }
      return escapeHtml(part ? part.value : "");
    })
    .join("");
}
