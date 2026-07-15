// 長さの単位変換（mm・cm・m・km）専用の共通処理を担当するモジュール。
// 小学6年生3学期（第12段階、縮尺の問題）で追加。
//
// 内部では、すべての単位を「mmへの倍率」で管理します（依頼文の設計どおり）。
// 倍率がすべて10の累乗の整数のため、掛け算・割り算は常に厳密な整数演算になり、
// 浮動小数点の丸め誤差は発生しません（JavaScriptの通常の数値同士の掛け算・割り算は、
// 10の累乗どうしの範囲では誤差が出ないため、number-utils.js の安全策を経由する必要は
// ありません。念のため normalizeNumber() で末尾の誤差だけ除去しています）。

import { normalizeNumber } from "./number-utils.js";

const MM_PER_UNIT = {
  mm: 1,
  cm: 10,
  m: 1000,
  km: 1000000
};

/**
 * 指定した単位が、このアプリで対応している長さの単位（mm/cm/m/km）かどうかを判定します。
 */
export function isSupportedLengthUnit(unit) {
  return Object.prototype.hasOwnProperty.call(MM_PER_UNIT, unit);
}

/**
 * fromUnit → toUnit への変換倍率を返します（value に掛けると toUnit の値になる）。
 * 未対応の単位が指定された場合は null を返します。
 */
export function getLengthConversionFactor(fromUnit, toUnit) {
  if (!isSupportedLengthUnit(fromUnit) || !isSupportedLengthUnit(toUnit)) {
    return null;
  }
  return MM_PER_UNIT[fromUnit] / MM_PER_UNIT[toUnit];
}

/**
 * 長さの値を、fromUnit から toUnit へ変換します。
 * 未対応の単位、または value が有限数でない場合は null を返します。
 */
export function convertLength(value, fromUnit, toUnit) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const factor = getLengthConversionFactor(fromUnit, toUnit);
  if (factor === null) return null;
  return normalizeNumber(value * factor);
}

/**
 * 長さの値を、指定した単位付きの表示用文字列に変換します（末尾の不要な0は表示しません。
 * 桁区切りカンマの有無は number-utils.js の formatNumber() 相当の挙動に委ねたい場合、
 * 呼び出し側で formatNumber(value) の結果に単位を付け足してください。この関数は
 * デバッグ表示・簡易表示専用の最小限の実装です）。
 */
export function formatLength(value, unit) {
  return `${normalizeNumber(value)}${unit}`;
}
