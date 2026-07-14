// 百分率（パーセント）専用の共通処理を担当するモジュール（第9段階で新規追加）。
//
// 百分率は常に { type: "percent", value } の形で扱います（例: { type:"percent", value:20 } は「20%」）。
// "20%" のような文字列や、0.2 のような比率（内部計算用の小数）を、そのまま画面表示や
// カードの値として使うことはありません（文字列は表示直前にだけ formatPercent() で作ります。
// 比率が必要な計算だけ percentToRatio() を経由します）。
//
// このファイルは分数専用の fraction-utils.js と同じ位置づけの「型ごとの計算処理」です。
// 「百分率かどうか」「他の型と混在した場合にどう計算するか」の判断は value-utils.js
// （calculateValues など）に集約し、このファイルは百分率どうしの純粋な変換・整形だけを担当します。

import { normalizeNumber, multiplyDecimal, divideDecimal, formatNumber } from "./number-utils.js";

/**
 * 値が正しい百分率オブジェクトかどうかを判定します。
 * value は有限の数値である必要があります（NaN・Infinity・文字列などは不正）。
 */
export function isValidPercent(value) {
  return (
    !!value &&
    typeof value === "object" &&
    value.type === "percent" &&
    typeof value.value === "number" &&
    Number.isFinite(value.value)
  );
}

/**
 * 百分率の浮動小数点の丸め誤差を取り除きます（分数の simplifyFraction に相当する正規化）。
 */
export function normalizePercent(value) {
  return { type: "percent", value: normalizeNumber(value.value) };
}

/**
 * 百分率を計算用の比率（0〜1の小数）に変換します。例: 20% → 0.2、12.5% → 0.125。
 * 100で割るだけの単純な変換ですが、誤差の出ない number-utils.js の divideDecimal() を経由します。
 */
export function percentToRatio(value) {
  return normalizeNumber(divideDecimal(value.value, 100));
}

/**
 * 比率（0〜1の小数）を百分率オブジェクトに変換します。例: 0.3 → { type:"percent", value:30 }。
 * 100を掛けるだけの単純な変換ですが、誤差の出ない number-utils.js の multiplyDecimal() を経由します。
 */
export function ratioToPercent(ratio) {
  return { type: "percent", value: normalizeNumber(multiplyDecimal(ratio, 100)) };
}

/**
 * 百分率を表示用の文字列に変換します（例: 20% → "20%"、12.5% → "12.5%"）。
 * number-utils.js の formatNumber() が末尾の0除去・桁区切り無し表示を行うため、
 * "20.0%" のような不要な表示や、誤差による端数は出ません。
 */
export function formatPercent(value) {
  return `${formatNumber(value.value, { useSeparator: false })}%`;
}

/**
 * 2つの百分率が同じ値かどうかを判定します（誤差許容）。
 */
export function arePercentValuesEqual(a, b) {
  if (!isValidPercent(a) || !isValidPercent(b)) return false;
  return Math.abs(a.value - b.value) < 1e-9;
}
