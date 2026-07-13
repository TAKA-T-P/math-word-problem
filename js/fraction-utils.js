// 分数専用の共通処理を担当するモジュール。
// 分数は常に { type: "fraction", numerator, denominator } の形で扱い、
// 浮動小数点数（0.6 など）に変換してから計算することはありません
// （fractionToNumber は表示・数値比較の補助にのみ使用してください）。
//
// 今回のバージョンで実際に使用するのは「同分母分数のたし算・ひき算」のみですが、
// 将来の小学5・6年生対応（異分母分数・分数のかけ算/わり算）を見据えて、
// かけ算・わり算の基礎処理もここに用意しています。

/**
 * 2つの整数の最大公約数を求めます（ユークリッドの互除法）。
 * 符号は考慮せず、常に0以上の値を返します。
 */
export function gcd(a, b) {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x === 0 ? 1 : x;
}

/**
 * 値が正しい分数オブジェクトかどうかを判定します。
 * 分子・分母は整数、分母は0でないことを要求します。
 */
export function isValidFraction(value) {
  return (
    !!value &&
    typeof value === "object" &&
    value.type === "fraction" &&
    Number.isInteger(value.numerator) &&
    Number.isInteger(value.denominator) &&
    value.denominator !== 0
  );
}

/**
 * 分母を必ず正の数にした分数を返します（符号は分子側へ寄せます）。
 */
export function normalizeFraction(fraction) {
  let { numerator, denominator } = fraction;
  if (denominator < 0) {
    numerator = -numerator;
    denominator = -denominator;
  }
  return { type: "fraction", numerator, denominator };
}

/**
 * 分数を約分します。0/n は 0/1 に正規化します。
 * 例: 2/4 → 1/2、6/8 → 3/4
 */
export function simplifyFraction(fraction) {
  const normalized = normalizeFraction(fraction);
  if (normalized.numerator === 0) {
    return { type: "fraction", numerator: 0, denominator: 1 };
  }
  const divisor = gcd(normalized.numerator, normalized.denominator);
  return {
    type: "fraction",
    numerator: normalized.numerator / divisor,
    denominator: normalized.denominator / divisor
  };
}

export function addFractions(a, b) {
  return simplifyFraction({
    type: "fraction",
    numerator: a.numerator * b.denominator + b.numerator * a.denominator,
    denominator: a.denominator * b.denominator
  });
}

export function subtractFractions(a, b) {
  return simplifyFraction({
    type: "fraction",
    numerator: a.numerator * b.denominator - b.numerator * a.denominator,
    denominator: a.denominator * b.denominator
  });
}

/**
 * 分数のかけ算。今回のゲームデータでは使用しませんが、将来の拡張のために用意しています。
 */
export function multiplyFractions(a, b) {
  return simplifyFraction({
    type: "fraction",
    numerator: a.numerator * b.numerator,
    denominator: a.denominator * b.denominator
  });
}

/**
 * 分数のわり算。右辺が0の場合は null を返します。
 * 今回のゲームデータでは使用しませんが、将来の拡張のために用意しています。
 */
export function divideFractions(a, b) {
  if (b.numerator === 0) return null;
  return simplifyFraction({
    type: "fraction",
    numerator: a.numerator * b.denominator,
    denominator: a.denominator * b.numerator
  });
}

/**
 * 2つの分数が同じ値かどうかを、分子・分母だけで（浮動小数点数を経由せず）判定します。
 * 例: 1/2 と 2/4 は true。
 * 児童が作った式の正誤判定（式の構造の一致）には使用しないでください
 * （そちらは answer-checker.js の matchesStep が、登録された正解ルートの
 *  left/right とカードの値を直接比較します）。
 */
export function areFractionsEqual(a, b) {
  if (!isValidFraction(a) || !isValidFraction(b)) return false;
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

/**
 * 分数を浮動小数点数に変換します。表示・大小比較の補助にのみ使用してください
 * （分数どうしの計算にこの関数を経由してはいけません）。
 */
export function fractionToNumber(value) {
  return value.numerator / value.denominator;
}
