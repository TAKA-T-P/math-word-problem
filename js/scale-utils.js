// 縮尺（「1：25,000」のような、地図・図面の縮小比率）専用の共通処理を担当するモジュール。
// 小学6年生3学期（第12段階）で追加。
//
// 縮尺は { type: "scale", numerator, denominator } の形で扱います。
// 今回のバージョンでは分子は常に1に固定し（教科書の「1：n」表記のみを扱う）、
// 分母（n）だけが問題ごとに変わります。比（ratio-utils.js）と同じく、縮尺そのものは
// 計算式（カード・解答欄）には登場せず、次の用途にだけ使います。
//   - 問題文中の縮尺の表示（例:「縮尺1：25,000」）
//   - 「縮尺を求める」テンプレートの最終的な答え
//   - 問題履歴・問題検証ページ・デバッグ表示
// 縮尺の分母そのもの（例: 25000）は、実際の式・カードでは普通の整数として扱います
// （比のときと同じく、縮尺オブジェクトを演算記号カードに配置させることはありません）。

/**
 * 縮尺の値オブジェクトを作ります。分母は正の整数である必要があります（分子は常に1）。
 */
export function createScale(denominator) {
  return { type: "scale", numerator: 1, denominator };
}

/**
 * 値が正しい縮尺オブジェクトかどうかを判定します。
 * 分子は常に1、分母は正の整数である必要があります。
 */
export function isValidScale(value) {
  return (
    !!value &&
    typeof value === "object" &&
    value.type === "scale" &&
    value.numerator === 1 &&
    Number.isInteger(value.denominator) &&
    value.denominator > 0
  );
}

/**
 * 地図上（図面上）の長さと実際の長さ（同じ単位にそろえた数値）から、縮尺の値オブジェクトを
 * 作ります。実際の長さが地図上の長さで割り切れない場合は null を返します
 * （縮尺の分母は必ず整数であるため）。
 */
export function normalizeScale(mapLength, actualLength) {
  if (!Number.isFinite(mapLength) || mapLength <= 0 || !Number.isFinite(actualLength) || actualLength <= 0) {
    return null;
  }
  const denominator = actualLength / mapLength;
  return Number.isInteger(denominator) ? createScale(denominator) : null;
}

/**
 * 縮尺を「1/n」の分数として返します（他の値と型を揃えて比較したい場合などに使用。
 * 現在のバージョンでは縮尺どうしの四則演算は行わないため、主に将来の拡張用です）。
 */
export function scaleToFraction(value) {
  if (!isValidScale(value)) return null;
  return { type: "fraction", numerator: value.numerator, denominator: value.denominator };
}

/**
 * 縮尺を表示用の文字列に変換します（例: 分母25000 → "1：25,000"）。
 * 全角コロン「：」を使用し、分母は3桁区切りで表示します。
 */
export function formatScale(value) {
  const denominatorText = String(value.denominator).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value.numerator}：${denominatorText}`;
}

/**
 * 縮尺の分母を返します（式・カードで使う「普通の整数」としての縮尺の値）。
 */
export function getScaleDenominator(value) {
  return value.denominator;
}

/**
 * 縮尺と地図上（図面上）の長さ（同じ単位の数値）から、実際の長さを求めます。
 * 実際の長さ ＝ 地図上の長さ × 縮尺の分母
 */
export function calculateActualLength(mapLength, scale) {
  return mapLength * getScaleDenominator(scale);
}

/**
 * 縮尺と実際の長さ（同じ単位の数値）から、地図上（図面上）の長さを求めます。
 * 地図上の長さ ＝ 実際の長さ ÷ 縮尺の分母
 * 割り切れない場合は null を返します。
 */
export function calculateMapLength(actualLength, scale) {
  const denominator = getScaleDenominator(scale);
  if (denominator === 0) return null;
  const result = actualLength / denominator;
  return Number.isInteger(result) ? result : null;
}

/**
 * 2つの縮尺が、分母どうし完全に一致するかどうかを判定します
 * （分子は常に1で固定のため、分母の比較だけで十分です）。
 */
export function areScalesEqual(a, b) {
  if (!isValidScale(a) || !isValidScale(b)) return false;
  return a.denominator === b.denominator;
}
