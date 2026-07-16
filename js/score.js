// スコア計算・ランク計算を行うモジュール。

const RANK_TABLE = ["H", "G", "F", "E", "D", "C", "B", "A", "S"];
const TOP_RANK = "SS";

const TIME_BONUS_BASE_SECONDS = 24;
// 文章題バトルの特別ランク「MAX」（js/game.js）が、「全問このタイムボーナス上限で
// 正解できたか」の判定に使うため、export している。
export const TIME_BONUS_MAX = 20;
const TIME_BONUS_MIN = 0;

// 多段階問題は、式の数が多いほど正解までに時間がかかるのが自然なため、経過秒数を
// 段階数に応じた係数で割ってからタイムボーナスを計算します（1段階問題は割らない＝従来どおり）。
const TIME_BONUS_DIVISOR_BY_STEP_COUNT = { 1: 1, 2: 1.75, 3: 2.5 };

/**
 * 正解までにかかった秒数から、タイムボーナスを求めます。
 * タイムボーナス = 24 − 正解までにかかった秒数÷段階数ごとの係数
 * （1段階問題は係数1＝24−正解までにかかった秒数、2段階問題は係数1.75、3段階問題は係数2.5）。
 * 最大20・最小0にクランプしたうえで、小数点以下を切り捨てて必ず整数にします
 * （経過秒数は小数になりうるが、スコアには小数を出さないため）。
 * @param {number} elapsedSeconds
 * @param {number} stepCount - 問題の段階数（1〜3。省略時は1段階問題として扱う）
 */
export function calculateTimeBonus(elapsedSeconds, stepCount = 1) {
  const divisor = TIME_BONUS_DIVISOR_BY_STEP_COUNT[stepCount] || 1;
  const bonus = Math.floor(TIME_BONUS_BASE_SECONDS - elapsedSeconds / divisor);
  return Math.max(TIME_BONUS_MIN, Math.min(TIME_BONUS_MAX, bonus));
}

/**
 * n問目正解時の加算スコアを計算します（最終問題のハート数ボーナスは含まない。
 * それは呼び出し側=js/game.jsのhandleCorrect()が別途加算します）。
 * ペナルティ（不正解・時間切れ）を受けていた場合、timeBonus は 0 として渡してください。
 * 加算スコア = (10 + n) × (10 + タイムボーナス) × 20
 */
export function calculateQuestionScore(questionNumber, timeBonus) {
  return (10 + questionNumber) * (10 + timeBonus) * 20;
}

/**
 * 現在のスコアとレベルから、ランク（+ なし）を求めます。
 * ランク値 = floor(スコア ÷ レベル ÷ (レベル×60+1640))
 */
export function calculateRank(score, level) {
  const safeLevel = Math.max(1, level);
  const divisor = safeLevel * (safeLevel * 60 + 1640);
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
