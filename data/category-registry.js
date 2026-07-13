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
