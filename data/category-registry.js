// トレーニングモードで選択できる「もんだいの種類」の単一の情報源（レジストリ）。
//
// 通常バトルの出題範囲（gradeTerm: "4-1" など）は複数カテゴリをまとめて出題しますが、
// トレーニングモードは「1つのカテゴリだけを5問」出題するため、カテゴリ単位で
// 安定したID（id）・表示名（label）・学年学期・トレーニングで選べるかどうかを
// ここで一元管理します。
//
// 新しいカテゴリ（将来の学年・学期）を追加する場合は、
//   1. データファイル（data/*.js）の該当テンプレートに categoryId を追加する
//   2. このファイルに1件追加する
// の2箇所だけで済むようにしてください（js/ui.js・index.html・js/training-mode.js は
// このレジストリから動的に読み込むため、個別の追加修正は不要です）。
//
// 各項目:
//   id               : テンプレートの categoryId と一致させる、安定した内部ID（表示名は変更してもよい）
//   label            : トレーニング画面のカテゴリ選択ボタンに表示する名前
//   gradeTerm        : このカテゴリが属する学年・学期キー（通常バトルの出題範囲と同じ値）
//   gradeLabel       : 学年・学期の表示名（グループ見出しに使用）
//   enabledInTraining: トレーニングモードの選択肢として表示するかどうか
//   order            : 表示順（学年学期内・レジストリ全体の並び替えの基準）

export const categoryRegistry = [
  // ---- 小学4年生・1学期 ----
  {
    id: "integer-addition",
    label: "整数のたし算",
    gradeTerm: "4-1",
    gradeLabel: "小学4年生・1学期",
    enabledInTraining: true,
    order: 1
  },
  {
    id: "integer-subtraction",
    label: "整数のひき算",
    gradeTerm: "4-1",
    gradeLabel: "小学4年生・1学期",
    enabledInTraining: true,
    order: 2
  },
  {
    id: "integer-multiplication",
    label: "整数のかけ算",
    gradeTerm: "4-1",
    gradeLabel: "小学4年生・1学期",
    enabledInTraining: true,
    order: 3
  },
  {
    id: "integer-division-one-digit",
    label: "整数のわり算（1けた）",
    gradeTerm: "4-1",
    gradeLabel: "小学4年生・1学期",
    enabledInTraining: true,
    order: 4
  },

  // ---- 小学4年生・2学期 ----
  {
    id: "decimal-addition",
    label: "小数のたし算",
    gradeTerm: "4-2",
    gradeLabel: "小学4年生・2学期",
    enabledInTraining: true,
    order: 5
  },
  {
    id: "decimal-subtraction",
    label: "小数のひき算",
    gradeTerm: "4-2",
    gradeLabel: "小学4年生・2学期",
    enabledInTraining: true,
    order: 6
  },
  {
    id: "large-numbers",
    label: "大きな数",
    gradeTerm: "4-2",
    gradeLabel: "小学4年生・2学期",
    enabledInTraining: true,
    order: 7
  },
  {
    id: "integer-division-two-digit",
    label: "整数のわり算（2けた）",
    gradeTerm: "4-2",
    gradeLabel: "小学4年生・2学期",
    enabledInTraining: true,
    order: 8
  },
  {
    id: "multi-step-integer",
    label: "整数の2段階文章題",
    gradeTerm: "4-2",
    gradeLabel: "小学4年生・2学期",
    enabledInTraining: true,
    order: 9
  },

  // ---- 小学4年生・3学期 ----
  {
    id: "decimal-times-integer",
    label: "小数×整数",
    gradeTerm: "4-3",
    gradeLabel: "小学4年生・3学期",
    enabledInTraining: true,
    order: 10
  },
  {
    id: "decimal-division-by-integer",
    label: "小数÷整数",
    gradeTerm: "4-3",
    gradeLabel: "小学4年生・3学期",
    enabledInTraining: true,
    order: 11
  },
  {
    id: "same-denominator-fraction-addition",
    label: "同分母分数のたし算",
    gradeTerm: "4-3",
    gradeLabel: "小学4年生・3学期",
    enabledInTraining: true,
    order: 12
  },
  {
    id: "same-denominator-fraction-subtraction",
    label: "同分母分数のひき算",
    gradeTerm: "4-3",
    gradeLabel: "小学4年生・3学期",
    enabledInTraining: true,
    order: 13
  },

  // ---- 小学5年生・1学期 ----
  {
    id: "decimal-times-decimal",
    label: "小数×小数",
    gradeTerm: "5-1",
    gradeLabel: "小学5年生・1学期",
    enabledInTraining: true,
    order: 14
  },
  {
    id: "decimal-divided-by-decimal",
    label: "小数÷小数",
    gradeTerm: "5-1",
    gradeLabel: "小学5年生・1学期",
    enabledInTraining: true,
    order: 15
  },
  {
    id: "decimal-multiplicative-comparison",
    label: "小数倍",
    gradeTerm: "5-1",
    gradeLabel: "小学5年生・1学期",
    enabledInTraining: true,
    order: 16
  },
  {
    id: "decimal-original-quantity",
    label: "もとの量",
    gradeTerm: "5-1",
    gradeLabel: "小学5年生・1学期",
    enabledInTraining: true,
    order: 17
  },

  // ---- 小学5年生・2学期 ----
  {
    id: "unlike-fraction-addition",
    label: "異分母分数のたし算",
    gradeTerm: "5-2",
    gradeLabel: "小学5年生・2学期",
    enabledInTraining: true,
    order: 18
  },
  {
    id: "unlike-fraction-subtraction",
    label: "異分母分数のひき算",
    gradeTerm: "5-2",
    gradeLabel: "小学5年生・2学期",
    enabledInTraining: true,
    order: 19
  },
  {
    id: "average",
    label: "平均",
    gradeTerm: "5-2",
    gradeLabel: "小学5年生・2学期",
    enabledInTraining: true,
    order: 20
  },
  {
    id: "unit-rate",
    label: "単位量あたり",
    gradeTerm: "5-2",
    gradeLabel: "小学5年生・2学期",
    enabledInTraining: true,
    order: 21
  },
  {
    id: "crowdedness",
    label: "混み具合",
    gradeTerm: "5-2",
    gradeLabel: "小学5年生・2学期",
    enabledInTraining: true,
    order: 22
  },

  // ---- 小学5年生・3学期 ----
  {
    id: "speed-find-speed",
    label: "速さ",
    gradeTerm: "5-3",
    gradeLabel: "小学5年生・3学期",
    enabledInTraining: true,
    order: 23
  },
  {
    id: "speed-find-distance",
    label: "道のり",
    gradeTerm: "5-3",
    gradeLabel: "小学5年生・3学期",
    enabledInTraining: true,
    order: 24
  },
  {
    id: "speed-find-time",
    label: "時間",
    gradeTerm: "5-3",
    gradeLabel: "小学5年生・3学期",
    enabledInTraining: true,
    order: 25
  },
  {
    id: "percentage-compared-amount",
    label: "割合・比べる量",
    gradeTerm: "5-3",
    gradeLabel: "小学5年生・3学期",
    enabledInTraining: true,
    order: 26
  },
  {
    id: "percentage-rate",
    label: "割合・百分率",
    gradeTerm: "5-3",
    gradeLabel: "小学5年生・3学期",
    enabledInTraining: true,
    order: 27
  },
  {
    id: "percentage-base-amount",
    label: "割合・もとにする量",
    gradeTerm: "5-3",
    gradeLabel: "小学5年生・3学期",
    enabledInTraining: true,
    order: 28
  },
  {
    id: "percentage-discount",
    label: "割引",
    gradeTerm: "5-3",
    gradeLabel: "小学5年生・3学期",
    enabledInTraining: true,
    order: 29
  },
  {
    id: "percentage-increase",
    label: "増量",
    gradeTerm: "5-3",
    gradeLabel: "小学5年生・3学期",
    enabledInTraining: true,
    order: 30
  },

  // ---- 小学6年生・1学期 ----
  {
    id: "fraction-times-integer",
    label: "分数×整数",
    gradeTerm: "6-1",
    gradeLabel: "小学6年生・1学期",
    enabledInTraining: true,
    order: 31
  },
  {
    id: "fraction-times-fraction",
    label: "分数×分数",
    gradeTerm: "6-1",
    gradeLabel: "小学6年生・1学期",
    enabledInTraining: true,
    order: 32
  },
  {
    id: "fraction-divided-by-integer",
    label: "分数÷整数",
    gradeTerm: "6-1",
    gradeLabel: "小学6年生・1学期",
    enabledInTraining: true,
    order: 33
  },
  {
    id: "integer-divided-by-fraction",
    label: "整数÷分数",
    gradeTerm: "6-1",
    gradeLabel: "小学6年生・1学期",
    enabledInTraining: true,
    order: 34
  },
  {
    id: "fraction-divided-by-fraction",
    label: "分数÷分数",
    gradeTerm: "6-1",
    gradeLabel: "小学6年生・1学期",
    enabledInTraining: true,
    order: 35
  },
  {
    id: "fraction-multiplier-compared-amount",
    label: "分数倍・比べる量",
    gradeTerm: "6-1",
    gradeLabel: "小学6年生・1学期",
    enabledInTraining: true,
    order: 36
  },
  {
    id: "fraction-multiplier-base-amount",
    label: "分数倍・もとの量",
    gradeTerm: "6-1",
    gradeLabel: "小学6年生・1学期",
    enabledInTraining: true,
    order: 37
  },
  {
    id: "fraction-unit-rate",
    label: "単位量あたり(分数)",
    gradeTerm: "6-1",
    gradeLabel: "小学6年生・1学期",
    enabledInTraining: true,
    order: 38
  },

  // ---- 小学6年生・2学期 ----
  {
    id: "fraction-speed-find-speed",
    label: "分数の速さ",
    gradeTerm: "6-2",
    gradeLabel: "小学6年生・2学期",
    enabledInTraining: true,
    order: 39
  },
  {
    id: "fraction-speed-find-distance",
    label: "分数の道のり",
    gradeTerm: "6-2",
    gradeLabel: "小学6年生・2学期",
    enabledInTraining: true,
    order: 40
  },
  {
    id: "fraction-speed-find-time",
    label: "分数の時間",
    gradeTerm: "6-2",
    gradeLabel: "小学6年生・2学期",
    enabledInTraining: true,
    order: 41
  },
  {
    id: "fraction-rate-compared-amount",
    label: "分数割合・比べる量",
    gradeTerm: "6-2",
    gradeLabel: "小学6年生・2学期",
    enabledInTraining: true,
    order: 42
  },
  {
    id: "fraction-rate-rate",
    label: "分数割合・割合",
    gradeTerm: "6-2",
    gradeLabel: "小学6年生・2学期",
    enabledInTraining: true,
    order: 43
  },
  {
    id: "fraction-rate-base-amount",
    label: "分数割合・もとにする量",
    gradeTerm: "6-2",
    gradeLabel: "小学6年生・2学期",
    enabledInTraining: true,
    order: 44
  },
  {
    id: "ratio-application",
    label: "比を使った数量",
    gradeTerm: "6-2",
    gradeLabel: "小学6年生・2学期",
    enabledInTraining: true,
    order: 45
  },
  {
    id: "proportional-allocation",
    label: "比例配分",
    gradeTerm: "6-2",
    gradeLabel: "小学6年生・2学期",
    enabledInTraining: true,
    order: 46
  },

  // ---- 小学6年生・3学期 ----
  {
    id: "proportion-corresponding-value",
    label: "比例・対応する量",
    gradeTerm: "6-3",
    gradeLabel: "小学6年生・3学期",
    enabledInTraining: true,
    order: 47
  },
  {
    id: "inverse-proportion-corresponding-value",
    label: "反比例・対応する量",
    gradeTerm: "6-3",
    gradeLabel: "小学6年生・3学期",
    enabledInTraining: true,
    order: 48
  },
  {
    id: "scale-find-actual-length",
    label: "縮尺・実際の長さ",
    gradeTerm: "6-3",
    gradeLabel: "小学6年生・3学期",
    enabledInTraining: true,
    order: 49
  },
  {
    id: "scale-find-map-length",
    label: "縮尺・地図上の長さ",
    gradeTerm: "6-3",
    gradeLabel: "小学6年生・3学期",
    enabledInTraining: true,
    order: 50
  },
  {
    id: "scale-find-scale",
    label: "縮尺を求める",
    gradeTerm: "6-3",
    gradeLabel: "小学6年生・3学期",
    enabledInTraining: true,
    order: 51
  }
];

/**
 * トレーニングで選択可能な（enabledInTraining が true の）カテゴリだけを、
 * order 順に並べて返します。
 */
export function getEnabledTrainingCategories() {
  return categoryRegistry
    .filter((c) => c.enabledInTraining)
    .slice()
    .sort((a, b) => a.order - b.order);
}

/**
 * 指定した学年・学期（gradeTerm）に属する、トレーニングで選択可能なカテゴリを
 * order 順に並べて返します。
 */
export function getCategoriesForGradeTerm(gradeTerm) {
  return getEnabledTrainingCategories().filter((c) => c.gradeTerm === gradeTerm);
}

/**
 * トレーニングで選択可能なカテゴリが1件以上ある学年・学期を、
 * 登場順（各グループの最小 order 順）に { gradeTerm, gradeLabel } の配列として返します。
 * タイトル画面の「学年・学期」ボタンは、この関数の戻り値から動的に生成してください。
 */
export function getGradeTermGroups() {
  const enabled = getEnabledTrainingCategories();
  const groups = new Map();
  for (const category of enabled) {
    if (!groups.has(category.gradeTerm)) {
      groups.set(category.gradeTerm, { gradeTerm: category.gradeTerm, gradeLabel: category.gradeLabel, minOrder: category.order });
    }
  }
  return [...groups.values()].sort((a, b) => a.minOrder - b.minOrder).map(({ gradeTerm, gradeLabel }) => ({ gradeTerm, gradeLabel }));
}

/**
 * categoryId から、レジストリの該当エントリを取得します。見つからない場合は null。
 */
export function getCategoryById(categoryId) {
  return categoryRegistry.find((c) => c.id === categoryId) || null;
}
