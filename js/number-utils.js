// 数値の安全な計算・表示を担当するモジュール。
// JavaScript の浮動小数点数は 0.1 + 0.2 === 0.30000000000000004 のような誤差を持つため、
// 小数点以下の桁数に応じて整数へスケーリングしてから計算し、最後に元へ戻す方式を使います。
// 整数・小数・大きな数（3桁区切りカンマ表示）の表示も、すべてこのファイルの formatNumber() に
// 一本化しています（問題文・選択肢カード・解答欄・履歴・デバッグ表示・検証ページのすべてで共通）。

// 浮動小数点の丸め誤差を吸収するための基準桁数。
// このアプリで扱う数値は最大でも小数第2位程度のため、8桁あれば十分安全です。
const SAFE_ROUNDING_FACTOR = 1e8;

/**
 * 浮動小数点演算のわずかな誤差（例: 4.1499999999999995）を取り除きます。
 */
export function normalizeNumber(value) {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * SAFE_ROUNDING_FACTOR) / SAFE_ROUNDING_FACTOR;
}

/**
 * 値の小数点以下の桁数を求めます（例: 4.15 → 2、3 → 0）。
 */
export function getDecimalPlaces(value) {
  if (!Number.isFinite(value)) return 0;
  const normalized = normalizeNumber(value);
  const str = normalized.toString();
  if (str.includes("e-")) {
    const match = str.match(/e-(\d+)/);
    return match ? Number(match[1]) : 0;
  }
  const parts = str.split(".");
  return parts.length > 1 ? parts[1].length : 0;
}

function scaleFactorForPair(a, b) {
  const places = Math.max(getDecimalPlaces(a), getDecimalPlaces(b));
  return Math.pow(10, places);
}

/**
 * 誤差の出ない小数のたし算。
 */
export function addDecimal(a, b) {
  const factor = scaleFactorForPair(a, b);
  return normalizeNumber((Math.round(a * factor) + Math.round(b * factor)) / factor);
}

/**
 * 誤差の出ない小数のひき算。
 */
export function subtractDecimal(a, b) {
  const factor = scaleFactorForPair(a, b);
  return normalizeNumber((Math.round(a * factor) - Math.round(b * factor)) / factor);
}

/**
 * 誤差の出ない小数のかけ算。
 * （今回のバージョンでは「小数×整数」は出題しませんが、検証・将来の拡張のために用意しています。）
 */
export function multiplyDecimal(a, b) {
  const factorA = Math.pow(10, getDecimalPlaces(a));
  const factorB = Math.pow(10, getDecimalPlaces(b));
  return normalizeNumber((Math.round(a * factorA) * Math.round(b * factorB)) / (factorA * factorB));
}

/**
 * 誤差の出ない小数のわり算。0で割る場合は null を返します。
 * （今回のバージョンでは「小数÷整数」は出題しませんが、検証・将来の拡張のために用意しています。）
 */
export function divideDecimal(a, b) {
  if (b === 0) return null;
  const factor = scaleFactorForPair(a, b);
  const intA = Math.round(a * factor);
  const intB = Math.round(b * factor);
  if (intB === 0) return null;
  return normalizeNumber(intA / intB);
}

/**
 * 浮動小数点の誤差を許容して2つの数値を比較します。
 * 例: areNumbersEqual(0.1 + 0.2, 0.3) は true。
 */
export function areNumbersEqual(a, b, epsilon = 1e-9) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) < epsilon;
}

function addThousandsSeparator(integerDigitsString) {
  return integerDigitsString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 整数・小数・大きな数の表示を統一する関数。
 * - 整数（大きな数を含む）は3桁区切りのカンマを付けます（例: 125000 → "125,000"）。
 * - 小数は不要な末尾の0を表示しません（例: 4.150 ではなく "4.15"）。
 * 問題文・選択肢カード・解答欄・■欄・正解演出・問題履歴・デバッグ表示・検証ページのすべてで、
 * この関数だけを数値の表示に使用してください。
 */
export function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return String(value);
  }
  const normalized = normalizeNumber(value);
  const sign = normalized < 0 ? "-" : "";
  const abs = Math.abs(normalized);

  if (Number.isInteger(abs)) {
    return sign + addThousandsSeparator(String(abs));
  }

  const [intPart, fracPartRaw] = abs.toString().split(".");
  const fracPart = (fracPartRaw || "").replace(/0+$/, "");
  const intWithComma = addThousandsSeparator(intPart);
  return fracPart ? `${sign}${intWithComma}.${fracPart}` : `${sign}${intWithComma}`;
}

/**
 * formatNumber() で作った表示文字列（カンマ区切り）を、元の数値に戻します。
 * 内部の比較・判定には使わず、表示の往復確認（検証ページなど）にだけ使用してください。
 */
export function parseFormattedNumber(displayString) {
  return Number(String(displayString).replace(/,/g, ""));
}
