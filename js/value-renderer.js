// 値（整数・小数・分数）とtextParts形式の問題文を、画面表示用のHTML文字列に変換するモジュール。
//
// 分数は、教科書と同じ「横線の上に分子・下に分母」の縦型表示にする必要があるため、
// アプリ内のすべての表示箇所（問題文・選択肢カード・解答欄・■欄・正解演出・問題履歴・
// 問題検証ページ・デバッグ表示）が、必ずこのファイルの関数を経由してください。
// 各画面で個別にHTMLを組み立てないことで、表示方法の変更を1箇所に閉じ込められます。

import { formatNumber } from "./number-utils.js";
import { simplifyFraction } from "./fraction-utils.js";
import { isFractionValue } from "./value-utils.js";

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/**
 * 分数の読み上げ用ラベルを「分母分の分子」の形式で返します。
 * 例: 分子3, 分母5 → "5分の3"
 * 表示は約分後の分子・分母を使います（読み上げと見た目を一致させるため）。
 */
export function buildFractionAriaLabel(fraction) {
  const s = simplifyFraction(fraction);
  return `${s.denominator}分の${s.numerator}`;
}

/**
 * 値1つを、画面表示用のHTML文字列に変換します。
 * - 分数: 縦型分数のHTML（aria-label付き、読み上げにも対応）
 * - 整数・小数: number-utils.js の formatNumber() で末尾0除去（既定では桁区切りカンマも付与）した上でエスケープ
 * @param {number|{type:"fraction",numerator:number,denominator:number}} value
 * @param {{useSeparator?: boolean}} options - useSeparator: false で桁区切りカンマを付けずに表示する
 *   （選択肢カード・解答欄・ドラッグ中のカードは「3900」のようにカンマ無しで表示するために使う）。
 */
export function renderValueHtml(value, { useSeparator = true } = {}) {
  if (isFractionValue(value)) {
    const s = simplifyFraction(value);
    const label = buildFractionAriaLabel(value);
    return (
      `<span class="fraction" aria-label="${escapeHtml(label)}">` +
      `<span class="fraction-numerator">${s.numerator}</span>` +
      `<span class="fraction-denominator">${s.denominator}</span>` +
      `</span>`
    );
  }
  return escapeHtml(formatNumber(value, { useSeparator }));
}

/**
 * textParts形式（{type:"text", value:string} と {type:"value", value:Value} が交互に並ぶ配列）を
 * HTML文字列に変換します。分数を含む問題文は、このtextPartsを使って組み立ててください。
 */
export function renderTextPartsHtml(textParts) {
  return textParts
    .map((part) => {
      if (part && part.type === "value") {
        return renderValueHtml(part.value);
      }
      return escapeHtml(part ? part.value : "");
    })
    .join("");
}
