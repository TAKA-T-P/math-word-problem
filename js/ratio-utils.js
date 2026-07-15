// 比（比の値ではなく「5：3」のような比そのもの）専用の共通処理を担当するモジュール。
// 小学6年生2学期（第11段階）で追加。
//
// 比は { type: "ratio", antecedent, consequent } の形で扱います（前項・後項とも正の整数）。
// 今回のバージョンでは、比を最も簡単な整数比にする処理・比の値（分数）を求める処理・
// 解答欄で「数値：数値」の式を作らせる処理は実装しません。比は次の用途にだけ使います。
//   - 問題文中の比の表示（例: 「2：3」）
//   - 比を使った数量・比例配分のテンプレートのメタデータ（ratioValue）
//   - 問題履歴・問題検証ページ・デバッグ表示
// 比の前項・後項そのもの（例: 2, 3）は、実際の式・カードでは普通の整数として扱います
// （比オブジェクトを演算記号カードに配置させることはありません）。

/**
 * 比の値オブジェクトを作ります。前項・後項は正の整数である必要があります。
 */
export function createRatio(antecedent, consequent) {
  return { type: "ratio", antecedent, consequent };
}

/**
 * 値が正しい比オブジェクトかどうかを判定します。
 * 前項・後項は整数かつ正（0・負数は不可）である必要があります。
 */
export function isValidRatio(value) {
  return (
    !!value &&
    typeof value === "object" &&
    value.type === "ratio" &&
    Number.isInteger(value.antecedent) &&
    Number.isInteger(value.consequent) &&
    value.antecedent > 0 &&
    value.consequent > 0
  );
}

/**
 * 比を正規化します。今回は「最も簡単な整数比にする」処理を行わないため、
 * 前項・後項をそのまま返すだけです（将来、約分機能を追加する場合の差し込み口として用意）。
 */
export function normalizeRatio(value) {
  return createRatio(value.antecedent, value.consequent);
}

/**
 * 比を表示用の文字列に変換します（例: 前項5・後項3 → "5：3"）。
 * 全角コロン「：」を使用します（半角コロンの解答欄カードは今回追加しません）。
 */
export function formatRatio(value) {
  return `${value.antecedent}：${value.consequent}`;
}

/**
 * 比の前項・後項の和を返します（比例配分で「比の和」を求める際に使用）。
 */
export function sumRatioTerms(value) {
  return value.antecedent + value.consequent;
}

/**
 * 比の前項・後項のうち、target（"first"/"antecedent" または "second"/"consequent"）に
 * 対応する項の値を返します。
 */
export function getRatioTerm(value, target) {
  if (target === "first" || target === "antecedent") {
    return value.antecedent;
  }
  if (target === "second" || target === "consequent") {
    return value.consequent;
  }
  return undefined;
}

/**
 * 2つの比が、前項・後項ともに完全に一致するかどうかを判定します
 * （比を簡単にする処理を行わないため、同値判定は約分後の一致ではなく厳密な一致です）。
 */
export function areRatiosEqual(a, b) {
  if (!isValidRatio(a) || !isValidRatio(b)) return false;
  return a.antecedent === b.antecedent && a.consequent === b.consequent;
}
