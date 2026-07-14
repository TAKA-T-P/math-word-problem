// スコア計算・ランク計算を行うモジュール。

const RANK_TABLE = ["H", "G", "F", "E", "D", "C", "B", "A", "S"];
const TOP_RANK = "SS";

/**
 * 時間ゲージの残量比率（0〜1）を、パーセント（切り捨て）に変換します。
 */
export function toTimeRatioPercent(timerRemainingRatio) {
  const ratio = Math.max(0, Math.min(1, timerRemainingRatio));
  return Math.floor(ratio * 100);
}

/**
 * n問目正解時の加算スコアを計算します（最終問題のハート数ボーナスは含まない。
 * それは呼び出し側=js/game.jsのhandleCorrect()が別途加算します）。
 * ペナルティ（不正解・時間切れ）を受けていた場合、timeRatioPercent は 0 として渡してください。
 * 加算スコア = (10 + n) × (50 + 解答時間ゲージ残量%) × 4
 */
export function calculateQuestionScore(questionNumber, timeRatioPercent) {
  return (10 + questionNumber) * (50 + timeRatioPercent) * 4;
}

/**
 * 現在のスコアとレベルから、ランク（+ なし）を求めます。
 * ランク値 = floor(スコア ÷ (1600 × レベル))
 */
export function calculateRank(score, level) {
  const divisor = 1600 * Math.max(1, level);
  const rankValue = Math.floor(Math.max(0, score) / divisor);
  if (rankValue >= RANK_TABLE.length) {
    return TOP_RANK;
  }
  return RANK_TABLE[rankValue];
}

/**
 * ノーミス（ハートを1つも減らしていない）でクリアした場合、ランクに「+」を付けます。
 * プレイ中（クリア前）には付けないでください。
 */
export function formatFinalRank(rank, isNoMiss) {
  return isNoMiss ? `${rank}+` : rank;
}
