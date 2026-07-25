// 「ヒント」ボタンと「例題確認」機能が共有する学習支援データ（運用開始後に追加）。
// カテゴリ（data/category-registry.js の categoryId）ごとに、以下を一元管理する。
//   hints             : ヒント文の配列。1件だけなら全ステップ共通、複数件なら
//                        hints[0]=式1用、hints[1]=式2用 ... のように段階別ヒントとして使う
//                        （1段階問題は常に hints[0] を使う）。
//   exampleTemplateId : 例題確認で表示する、そのカテゴリの代表テンプレートID
//   exampleSeed       : 例題確認で使う固定シード（毎回同じ問題を表示するため）
//   exampleRouteId    : （複数解法ルートを持つテンプレートのみ）例題として表示する代表ルートID。
//                        省略時は生成された problem.solutionRoutes の先頭ルートを使う。
//
// カテゴリ名・学年名はこのファイルに重複して書かない（data/category-registry.js から取得する）。
//
// ヒントの目的（運用開始後に方針変更）: このアプリは「計算を実行すること」ではなく
// 「文章題を読んで正しい式をカードで作ること」が目的のため、ヒントは
// 「通分する」「約分する」「逆数にする」「筆算する」「位をそろえる」といった**計算方法**
// ではなく、「何を求める問題か」「どの2つの量を使うか」「どの演算を使うか（と、わり算なら
// どちらでどちらをわるか）」という**立式のための数量関係**だけを伝える（1〜2文、
// 具体的な数値・完成式・答えは書かない）。単位をそろえる必要がある問題（速さ・縮尺等）で
// 「単位をそろえよう」と伝えるのは、立式の前提条件を示すものとして許容する
// （通分・約分・逆数のような「式を作った後の計算テクニック」とは区別する）。

export const LEARNING_SUPPORT_BY_CATEGORY = {
  // ---- 小学4年生・1学期 ----
  "integer-addition": {
    hints: ["2つの量を合わせた全部を求めるので、たし算の式にしよう。"],
    exampleTemplateId: "g4t1_add_001",
    exampleSeed: 1001
  },
  "integer-subtraction": {
    hints: ["はじめの量から、使った量や減った量を取りのぞくので、ひき算の式にしよう。"],
    exampleTemplateId: "g4t1_sub_001",
    exampleSeed: 2001
  },
  "integer-multiplication": {
    hints: ["「1つ分の数」と「いくつ分」を見つけて、かけ算の式にしよう。"],
    exampleTemplateId: "g4t1_mul_001",
    exampleSeed: 3001
  },
  "integer-division-one-digit": {
    hints: ["全部を同じように分けた1つ分を求めるので、「全部の数÷分ける数」の式にしよう。"],
    exampleTemplateId: "g4t1_div_001",
    exampleSeed: 4001
  },

  // ---- 小学4年生・2学期 ----
  "decimal-addition": {
    hints: ["2つの量を合わせた全部を求めるので、たし算の式にしよう。"],
    exampleTemplateId: "g4t2_decimal_add_001",
    exampleSeed: 5001
  },
  "decimal-subtraction": {
    hints: ["はじめの量から使った量を取りのぞいた残りを、ひき算の式で表そう。"],
    exampleTemplateId: "g4t2_decimal_sub_001",
    exampleSeed: 6001
  },
  "large-numbers": {
    hints: ["数の大きさではなく、「全部」「残り」「ちがい」のどれを求める問題かを考えよう。"],
    exampleTemplateId: "g4t2_big_add_001",
    exampleSeed: 7001
  },
  "integer-division-two-digit": {
    hints: ["全部を同じように分けた1つ分を求めるので、「全部の数÷分ける数」の式にしよう。"],
    exampleTemplateId: "g4t2_div2_001",
    exampleSeed: 8001
  },
  "multi-step-integer": {
    // 12種類のテンプレートで演算の組み合わせが大きく異なるため、実際のヒントはほぼ全て
    // テンプレート側の hintSteps（data/multi-step-integer.js）を使う。ここは、万一
    // テンプレート側の登録が無い場合の安全な共通文。
    hints: [
      "何を求める問題かを確認して、先に計算できる量から求めよう。",
      "式1で求めた量を使って、式2の式を立てよう。"
    ],
    exampleTemplateId: "multi_add_div_001",
    exampleSeed: 9001
  },

  // ---- 小学4年生・3学期 ----
  "decimal-times-integer": {
    hints: ["「1つ分の量」と「いくつ分」を見つけて、かけ算の式にしよう。"],
    exampleTemplateId: "g4t3_dec_mul_001",
    exampleSeed: 10001
  },
  "decimal-division-by-integer": {
    hints: ["全部の量を同じように分けた1つ分を求めるので、「全部の量÷分ける数」の式にしよう。"],
    exampleTemplateId: "g4t3_dec_div_001",
    exampleSeed: 11001
  },
  "same-denominator-fraction-addition": {
    hints: ["2つの分数の量を合わせた全部を求めるので、たし算の式にしよう。"],
    exampleTemplateId: "g4t3_frac_add_001",
    exampleSeed: 12001
  },
  "same-denominator-fraction-subtraction": {
    hints: ["はじめにあった分数の量から、使った量を取りのぞくので、ひき算の式にしよう。"],
    exampleTemplateId: "g4t3_frac_sub_001",
    exampleSeed: 13001
  },

  // ---- 小学5年生・1学期 ----
  "decimal-times-decimal": {
    // 「いくつ分」「個数」は整数個を扱う印象が強く、長さ・重さ等の連続量である
    // かけられる数（1.5m分、等）には不自然なため、単位あたりの量と求めたい大きさを
    // 使う表現にする（運用開始後に修正）。
    hints: ["1つ分あたりの量と、求めたい大きさを使って、かけ算の式にしよう。"],
    exampleTemplateId: "g5t1_dtd_001",
    exampleSeed: 14001
  },
  "decimal-divided-by-decimal": {
    hints: ["全部の量の中に1つ分がいくつ入るかを求めるので、「全部の量÷1つ分」の式にしよう。"],
    exampleTemplateId: "g5t1_ddd_001",
    exampleSeed: 15001
  },
  "decimal-multiplicative-comparison": {
    // g5t1_mc_001〜004（比べる量を求める）が既定。005〜008（何倍かを求める）は
    // data/grade5-term1.js 側で hintSteps を個別に登録している（同じカテゴリ内で
    // 求める量が逆になるため。運用開始後に追加）。
    hints: ["もとにする量の何倍にあたる量を求めるので、「もとにする量×何倍」の式にしよう。"],
    exampleTemplateId: "g5t1_mc_001",
    exampleSeed: 16001
  },
  "decimal-original-quantity": {
    hints: ["比べる量と何倍かが分かっているので、「比べる量÷何倍」の式にしよう。"],
    exampleTemplateId: "g5t1_oq_001",
    exampleSeed: 17001
  },

  // ---- 小学5年生・2学期 ----
  "unlike-fraction-addition": {
    hints: ["2つの分数の量を合わせた全部を求めるので、たし算の式にしよう。"],
    exampleTemplateId: "g5t2_ufa_001",
    exampleSeed: 18001
  },
  "unlike-fraction-subtraction": {
    hints: ["はじめにあった分数の量から、使った量を取りのぞくので、ひき算の式にしよう。"],
    exampleTemplateId: "g5t2_ufs_001",
    exampleSeed: 19001
  },
  average: {
    // g5t2_avg_001〜002（平均を求める）が既定。003〜006（合計を求める・2数の平均）は
    // data/grade5-term2.js 側で hintSteps を個別に登録している（運用開始後に追加）。
    hints: ["いくつかの量を同じ大きさにならした1つ分を求めるので、全部の合計を個数でわる式にしよう。"],
    exampleTemplateId: "g5t2_avg_001",
    exampleSeed: 20001
  },
  "unit-rate": {
    // g5t2_ur_001〜003（1つ分を求める）が既定。004〜006（全部の量を求める）は
    // data/grade5-term2.js 側で hintSteps を個別に登録している（運用開始後に追加）。
    // 「個数」は整数個の印象が強く、単位量あたりを求める際にわる数（面積・長さ等の
    // 連続量）を指すには不自然なため、「広さや長さなどの大きさ」という表現にする
    // （運用開始後に修正）。
    hints: ["1つ分あたりの量を求めるので、全部の量を、広さや長さなどの大きさでわる式にしよう。"],
    exampleTemplateId: "g5t2_ur_001",
    exampleSeed: 21001
  },
  crowdedness: {
    // g5t2_crowd_001〜003（1つ分を求める）が既定。004〜006（全部の数を求める）は
    // data/grade5-term2.js 側で hintSteps を個別に登録している（運用開始後に追加）。
    hints: ["同じ基準で比べられるように、「全部の数÷広さ」で1つ分の数を求めよう。"],
    exampleTemplateId: "g5t2_crowd_001",
    exampleSeed: 22001
  },

  // ---- 小学5年生・3学期 ----
  "speed-find-speed": {
    hints: ["道のりと時間が分かっているので、「道のり÷時間」の式にしよう。"],
    exampleTemplateId: "g5t3_speed_001",
    exampleSeed: 23001
  },
  "speed-find-distance": {
    hints: ["速さと進んだ時間が分かっているので、「速さ×時間」の式にしよう。"],
    exampleTemplateId: "g5t3_distance_001",
    exampleSeed: 24001
  },
  "speed-find-time": {
    hints: ["道のりと速さが分かっているので、「道のり÷速さ」の式にしよう。"],
    exampleTemplateId: "g5t3_time_001",
    exampleSeed: 25001
  },
  "percentage-compared-amount": {
    hints: ["もとにする量のうち、割合にあたる量を求めるので、「もとにする量×割合」の式にしよう。"],
    exampleTemplateId: "g5t3_compared_001",
    exampleSeed: 26001
  },
  "percentage-rate": {
    hints: ["比べる量が、もとにする量のどれくらいかを求めるので、「比べる量÷もとにする量」の式にしよう。"],
    exampleTemplateId: "g5t3_rate_001",
    exampleSeed: 27001
  },
  "percentage-base-amount": {
    hints: ["比べる量と割合が分かっているので、「比べる量÷割合」の式にしよう。"],
    exampleTemplateId: "g5t3_base_001",
    exampleSeed: 28001
  },
  "percentage-discount": {
    hints: [
      "もとのねだんのうち、割引される割合にあたる金額を求めよう。",
      "もとのねだんから、式1で求めた値引き額をひこう。"
    ],
    exampleTemplateId: "g5t3_discount_001",
    exampleSeed: 29001,
    exampleRouteId: "discountAmountRoute"
  },
  "percentage-increase": {
    hints: [
      "もとの量のうち、増える割合にあたる量を求めよう。",
      "もとの量に、式1で求めた増えた量をたそう。"
    ],
    exampleTemplateId: "g5t3_increase_001",
    exampleSeed: 30001,
    exampleRouteId: "increaseAmountRoute"
  },

  // ---- 小学6年生・1学期 ----
  "fraction-times-integer": {
    hints: ["「1つ分の分数の量」と「いくつ分」を見つけて、かけ算の式にしよう。"],
    exampleTemplateId: "g6t1_frac_mul_int_001",
    exampleSeed: 31001
  },
  "fraction-times-fraction": {
    // 「いくつ分の量」は整数個の印象が強く、面積等の連続量には不自然なため、
    // 単位あたりの量と求めたい大きさを使う表現にする（運用開始後に修正）。
    hints: ["1つ分あたりの量と、求めたい大きさを使って、かけ算の式にしよう。"],
    exampleTemplateId: "g6t1_frac_mul_frac_001",
    exampleSeed: 32001
  },
  "fraction-divided-by-integer": {
    hints: ["分数で表された全部の量を同じように分けるので、「全部の量÷分ける数」の式にしよう。"],
    exampleTemplateId: "g6t1_frac_div_int_001",
    exampleSeed: 33001
  },
  "integer-divided-by-fraction": {
    hints: ["全部の量の中に、分数で表された1つ分がいくつ入るかを求めるので、「全部の量÷1つ分」の式にしよう。"],
    exampleTemplateId: "g6t1_int_div_frac_001",
    exampleSeed: 34001
  },
  "fraction-divided-by-fraction": {
    hints: ["全部の量の中に、分数で表された1つ分がいくつ入るかを求めるので、「全部の量÷1つ分」の式にしよう。"],
    exampleTemplateId: "g6t1_frac_div_frac_001",
    exampleSeed: 35001
  },
  "fraction-multiplier-compared-amount": {
    hints: ["もとにする量の何倍にあたる量を求めるので、「もとにする量×何倍」の式にしよう。"],
    exampleTemplateId: "g6t1_frac_multiplier_compared_001",
    exampleSeed: 36001
  },
  "fraction-multiplier-base-amount": {
    hints: ["比べる量と何倍かが分かっているので、「比べる量÷何倍」の式にしよう。"],
    exampleTemplateId: "g6t1_frac_multiplier_base_001",
    exampleSeed: 37001
  },
  "fraction-unit-rate": {
    // unit-rateと同じ理由（「個数」は面積等の連続量には不自然）で、単位量あたりを
    // 求める表現に修正（運用開始後に修正）。
    hints: ["1つ分あたりの量を求めるので、全部の量を、広さなどの大きさでわる式にしよう。"],
    exampleTemplateId: "g6t1_frac_unit_rate_001",
    exampleSeed: 38001
  },

  // ---- 小学6年生・2学期 ----
  "fraction-speed-find-speed": {
    hints: [
      "式を作る前に、分などの時間の単位をそろえておこう。",
      "道のりと時間が分かっているので、「道のり÷時間」の式にしよう。"
    ],
    exampleTemplateId: "g6t2_speed_find_speed_001",
    exampleSeed: 39001,
    exampleRouteId: "convert-time-route"
  },
  "fraction-speed-find-distance": {
    hints: [
      "式を作る前に、分などの時間の単位をそろえておこう。",
      "速さと時間が分かっているので、「速さ×時間」の式にしよう。"
    ],
    exampleTemplateId: "g6t2_speed_find_distance_001",
    exampleSeed: 40001,
    exampleRouteId: "convert-time-route"
  },
  "fraction-speed-find-time": {
    hints: [
      "道のりと速さが分かっているので、「道のり÷速さ」の式にしよう。",
      "式1で求めた時間を、問題で聞かれている単位に直そう。"
    ],
    exampleTemplateId: "g6t2_speed_find_time_001",
    exampleSeed: 41001,
    exampleRouteId: "hours-first-route"
  },
  "fraction-rate-compared-amount": {
    hints: ["もとにする量のうち、割合にあたる量を求めるので、「もとにする量×割合」の式にしよう。"],
    exampleTemplateId: "g6t2_rate_compared_001",
    exampleSeed: 42001
  },
  "fraction-rate-rate": {
    hints: ["比べる量が、もとにする量のどれくらいかを求めるので、「比べる量÷もとにする量」の式にしよう。"],
    exampleTemplateId: "g6t2_rate_rate_001",
    exampleSeed: 43001
  },
  "fraction-rate-base-amount": {
    hints: ["比べる量と割合が分かっているので、「比べる量÷割合」の式にしよう。"],
    exampleTemplateId: "g6t2_rate_base_001",
    exampleSeed: 44001
  },
  "ratio-application": {
    hints: [
      "比の一方の数量と、対応する比の数を使って、比の1にあたる量を求めよう。",
      "式1で求めた1にあたる量に、求めたいほうの比の数をかけよう。"
    ],
    exampleTemplateId: "g6t2_ratio_application_001",
    exampleSeed: 45001,
    exampleRouteId: "standard-two-step-route"
  },
  "proportional-allocation": {
    hints: [
      "比の2つの数をたして、全体が比の何こ分にあたるかを求めよう。",
      "全部の量を、式1で求めた比の合計でわって、比の1にあたる量を求めよう。",
      "式2で求めた1にあたる量に、求めたい側の比の数をかけよう。"
    ],
    exampleTemplateId: "g6t2_proportional_allocation_001",
    exampleSeed: 46001,
    exampleRouteId: "standard-three-step-route"
  },

  // ---- 小学6年生・3学期 ----
  "proportion-corresponding-value": {
    hints: [
      "分かっている対応する2つの量を使って、1つ分にあたる量を求めよう。",
      "式1で求めた1つ分の量に、求めたい側の数をかけよう。"
    ],
    exampleTemplateId: "g6t3_proportion_001",
    exampleSeed: 47001,
    exampleRouteId: "unit-value-route"
  },
  "inverse-proportion-corresponding-value": {
    hints: [
      "分かっている対応する2つの量をかけて、どの組でも変わらない数を求めよう。",
      "式1で求めた変わらない数を、新しく分かっている一方の量でわろう。"
    ],
    exampleTemplateId: "g6t3_inverse_001",
    exampleSeed: 48001,
    exampleRouteId: "product-first-route"
  },
  "scale-find-actual-length": {
    hints: [
      "地図上の長さが、実際の長さの何分の1かに注目して、「地図上の長さ×倍率」の式にしよう。",
      "式1で求めた長さの単位を、答えに合う単位に直そう。"
    ],
    exampleTemplateId: "g6t3_scale_actual_001",
    exampleSeed: 49001
  },
  "scale-find-map-length": {
    hints: [
      "式を作る前に、実際の長さの単位を、地図上の長さと同じ単位（cm）にそろえよう。",
      "実際の長さを縮尺に合わせて小さくするので、「実際の長さ÷倍率」の式にしよう。"
    ],
    exampleTemplateId: "g6t3_scale_map_001",
    exampleSeed: 50001,
    exampleRouteId: "convert-then-divide-route"
  }
};

/**
 * categoryId から、そのカテゴリの学習支援データを取得します。見つからない場合は null。
 */
export function getLearningSupportForCategory(categoryId) {
  return LEARNING_SUPPORT_BY_CATEGORY[categoryId] || null;
}

// 学習支援データが一切見つからない場合の、最後のフォールバック文（依頼文13章）。
const SAFE_FALLBACK_HINT = "何を求める問題かを確認して、使う2つの量と演算を考えよう。";

/**
 * 現在の問題・段階に対応するヒント文を1件求めます。優先順位:
 *   1. テンプレート側の段階別ヒント（templateHintSteps[currentStepIndex]）
 *   2. カテゴリの段階別ヒント（LEARNING_SUPPORT_BY_CATEGORY[categoryId].hints[currentStepIndex]）
 *      （そのカテゴリに複数件のヒントが登録されている場合だけステップ番号で引く）
 *   3. カテゴリの共通ヒント（hints[0]。1件しか登録されていないカテゴリは常にこれを使う）
 *   4. 安全な共通ヒント
 *
 * @param {{categoryId: string|null|undefined, templateHintSteps?: string[]|null, currentStepIndex: number}} params
 */
export function resolveHintText({ categoryId, templateHintSteps, currentStepIndex }) {
  if (Array.isArray(templateHintSteps) && typeof templateHintSteps[currentStepIndex] === "string" && templateHintSteps[currentStepIndex]) {
    return templateHintSteps[currentStepIndex];
  }

  const support = categoryId ? LEARNING_SUPPORT_BY_CATEGORY[categoryId] : null;
  const categoryHints = support && Array.isArray(support.hints) ? support.hints : null;
  if (categoryHints && categoryHints.length > 1 && typeof categoryHints[currentStepIndex] === "string" && categoryHints[currentStepIndex]) {
    return categoryHints[currentStepIndex];
  }
  if (categoryHints && categoryHints.length > 0) {
    return categoryHints[0];
  }

  return SAFE_FALLBACK_HINT;
}
