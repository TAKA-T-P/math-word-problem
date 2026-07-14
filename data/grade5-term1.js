// 小学5年生・1学期 問題テンプレートデータ（新内容）。
//
// このファイルはデータのみを定義します。ゲーム処理は含みません。
// ゲーム本体は data/index.js 経由でのみこのファイルを読み込みます。
//
// 小学5年生・1学期モードで出題する「新内容」は、次の4カテゴリ×8種類＝32テンプレートです。
//   - 小数×小数 / 小数÷小数 / 小数倍 / もとの量
// （復習内容は data/index.js が別途、4年生1〜3学期・2段階整数のテンプレートから選びます。
//  出題比率・カテゴリバランスは js/question-generator.js の GRADE_TERM_PLAN_CONFIG["5-1"] が
//  自動的に処理するため、このファイルには新内容のテンプレートのみを定義します。）
//
// このステージの新内容（小数×小数・小数÷小数・小数倍・もとの量）は、すべて1段階問題
// （questionType: "singleStep"）です。2段階問題との組み合わせは今回は追加していません
// （復習として既存の整数2段階文章題がそのまま出題されることはあります）。
//
// ---- 小数×小数・小数÷小数 ----
// 整数・小数のみを扱うため、既存の grade4-term*.js と同じ文字列形式の template フィールドを
// 使用します。
//   - 小数×小数（generatorType: "decimalTimesDecimal"）は、a・bをそれぞれ独立に生成する
//     standardのエイリアスです（js/question-generator.js 参照）。
//   - 小数÷小数（generatorType: "exactDecimalDivisionByDecimal"）は、divisor・quotientを
//     先に決めてから dividend = divisor × quotient を自動計算します（必ず割り切れる）。
//
// ---- 小数倍・もとの量 ----
// 「基準量(base)の何倍(multiplier)が比較量(compared)である」という関係を、
// quantityRelation メタデータ { type, baseKey, comparedKey, multiplierKey, unknown } で表します。
//   - comparedKey（このファイルでは常に "compared"）は生成時に base × multiplier として
//     自動計算される値のため、variables には含めません（baseKey・multiplierKeyだけを含めます）。
//   - unknown: "compared" → 基準量・何倍が分かっていて比較量を求める（小数倍カテゴリ）。
//     解法は base × multiplier = compared（かけ算はどちらの順でも正しいので commutative: true）。
//   - unknown: "multiplier" → 基準量・比較量が分かっていて何倍かを求める（小数倍カテゴリ）。
//     解法は compared ÷ base = multiplier（わり算は順序が逆だと誤りなので commutative: false）。
//   - unknown: "base" → 何倍・比較量が分かっていて、もとの量（基準量）を求める（もとの量カテゴリ）。
//     解法は compared ÷ multiplier = base（同じくcommutative: false）。
// base・multiplier は decimalPlaces を最大2桁までに抑えているため、compared ÷ base や
// compared ÷ multiplier の逆算も、必ず有限小数（最大2桁）で割り切れます
// （number-utils.js の divideExactByDecimal を参照）。

export const grade5Term1Templates = [
  // ============================================================
  // 小数×小数（8種類） generatorType: "decimalTimesDecimal"
  // ============================================================
  {
    id: "g5t1_dtd_001",
    gradeTerm: "5-1",
    category: "小数×小数",
    categoryId: "decimal-times-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1mの重さが{a}kgの鉄の棒があります。この鉄の棒{b}m分の重さは何kgですか。",
    variables: {
      a: { min: 1.2, max: 4.8, decimalPlaces: 1 },
      b: { min: 1.5, max: 6.5, decimalPlaces: 1 }
    },
    generatorType: "decimalTimesDecimal",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g5t1_dtd_002",
    gradeTerm: "5-1",
    category: "小数×小数",
    categoryId: "decimal-times-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "たて{a}m、よこ{b}mの長方形の花だんがあります。この花だんの面積は何m²ですか。",
    variables: {
      a: { min: 2.1, max: 8.4, decimalPlaces: 1 },
      b: { min: 1.5, max: 6.5, decimalPlaces: 1 }
    },
    generatorType: "decimalTimesDecimal",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "m²"
  },
  {
    id: "g5t1_dtd_003",
    gradeTerm: "5-1",
    category: "小数×小数",
    categoryId: "decimal-times-decimal",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "1m²をぬるのに{a}Lのペンキを使います。{b}m²のかべをぬるには、何Lのペンキが必要ですか。",
    variables: {
      a: { min: 0.2, max: 0.9, decimalPlaces: 1 },
      b: { min: 2.5, max: 8.5, decimalPlaces: 1 }
    },
    generatorType: "decimalTimesDecimal",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g5t1_dtd_004",
    gradeTerm: "5-1",
    category: "小数×小数",
    categoryId: "decimal-times-decimal",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "1Lの重さが{a}kgの油があります。この油{b}L分の重さは何kgですか。",
    variables: {
      a: { min: 0.6, max: 0.9, decimalPlaces: 1 },
      b: { min: 1.5, max: 7.5, decimalPlaces: 1 }
    },
    generatorType: "decimalTimesDecimal",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g5t1_dtd_005",
    gradeTerm: "5-1",
    category: "小数×小数",
    categoryId: "decimal-times-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "ガソリン1Lの値段は{a}円です。{b}L入れると代金は何円ですか。",
    variables: {
      a: { min: 152.5, max: 178.5, decimalPlaces: 1 },
      b: { min: 2.5, max: 9.5, decimalPlaces: 1 }
    },
    generatorType: "decimalTimesDecimal",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "円"
  },
  {
    id: "g5t1_dtd_006",
    gradeTerm: "5-1",
    category: "小数×小数",
    categoryId: "decimal-times-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "たて{a}m、よこ{b}mの長方形のテーブルクロスがあります。この布の面積は何m²ですか。",
    variables: {
      a: { min: 1.3, max: 3.9, decimalPlaces: 1 },
      b: { min: 1.1, max: 2.7, decimalPlaces: 1 }
    },
    generatorType: "decimalTimesDecimal",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "m²"
  },
  {
    id: "g5t1_dtd_007",
    gradeTerm: "5-1",
    category: "小数×小数",
    categoryId: "decimal-times-decimal",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "ポンプは1時間に{a}Lの水をくみ上げます。このポンプを{b}時間動かすと、何Lくみ上げますか。",
    variables: {
      a: { min: 12.5, max: 38.5, decimalPlaces: 1 },
      b: { min: 1.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "decimalTimesDecimal",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g5t1_dtd_008",
    gradeTerm: "5-1",
    category: "小数×小数",
    categoryId: "decimal-times-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1mの重さが{a}gのリボンがあります。このリボン{b}m分の重さは何gですか。",
    variables: {
      a: { min: 3.2, max: 9.6, decimalPlaces: 1 },
      b: { min: 1.5, max: 5.5, decimalPlaces: 1 }
    },
    generatorType: "decimalTimesDecimal",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "g"
  },

  // ============================================================
  // 小数÷小数（8種類） generatorType: "exactDecimalDivisionByDecimal"
  // 先に divisor（小数）・quotient（整数または小数）を決め、
  // dividend = divisor × quotient を自動計算するため、必ず有限小数で割り切れます。
  // ============================================================
  {
    id: "g5t1_ddd_001",
    gradeTerm: "5-1",
    category: "小数÷小数",
    categoryId: "decimal-divided-by-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}mの布を、{divisor}mずつに切り分けます。何枚とれますか。",
    variables: {
      divisor: { min: 0.6, max: 1.8, decimalPlaces: 1 },
      quotient: { min: 2, max: 8, step: 1 }
    },
    generatorType: "exactDecimalDivisionByDecimal",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "枚"
  },
  {
    id: "g5t1_ddd_002",
    gradeTerm: "5-1",
    category: "小数÷小数",
    categoryId: "decimal-divided-by-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}Lの油を、{divisor}Lずつ容器に入れます。容器は何個いりますか。",
    variables: {
      divisor: { min: 0.3, max: 0.9, decimalPlaces: 1 },
      quotient: { min: 4, max: 12, step: 1 }
    },
    generatorType: "exactDecimalDivisionByDecimal",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "個"
  },
  {
    id: "g5t1_ddd_003",
    gradeTerm: "5-1",
    category: "小数÷小数",
    categoryId: "decimal-divided-by-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}mのロープを、{divisor}mずつに切ります。何本とれますか。",
    variables: {
      divisor: { min: 1.2, max: 2.9, decimalPlaces: 1 },
      quotient: { min: 2, max: 8, step: 1 }
    },
    generatorType: "exactDecimalDivisionByDecimal",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "本"
  },
  {
    id: "g5t1_ddd_004",
    gradeTerm: "5-1",
    category: "小数÷小数",
    categoryId: "decimal-divided-by-decimal",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{dividend}kgの米を、{divisor}kgずつふくろに分けます。ふくろは何ふくろいりますか。",
    variables: {
      divisor: { min: 1.5, max: 3.5, decimalPlaces: 1 },
      quotient: { min: 3, max: 9, step: 1 }
    },
    generatorType: "exactDecimalDivisionByDecimal",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "ふくろ"
  },
  {
    id: "g5t1_ddd_005",
    gradeTerm: "5-1",
    category: "小数÷小数",
    categoryId: "decimal-divided-by-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}Lの水を、{divisor}Lずつペットボトルに入れます。ペットボトルは何本いりますか。",
    variables: {
      divisor: { min: 0.4, max: 0.8, decimalPlaces: 1 },
      quotient: { min: 5, max: 15, step: 1 }
    },
    generatorType: "exactDecimalDivisionByDecimal",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "本"
  },
  {
    id: "g5t1_ddd_006",
    gradeTerm: "5-1",
    category: "小数÷小数",
    categoryId: "decimal-divided-by-decimal",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{dividend}kmの道のりを、{divisor}kmずつに区切って走ります。何回で走り終えますか。",
    variables: {
      divisor: { min: 1.5, max: 2.5, decimalPlaces: 1 },
      quotient: { min: 3, max: 7, step: 1 }
    },
    generatorType: "exactDecimalDivisionByDecimal",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "回"
  },
  {
    id: "g5t1_ddd_007",
    gradeTerm: "5-1",
    category: "小数÷小数",
    categoryId: "decimal-divided-by-decimal",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}mの板を、{divisor}mずつに切ります。何枚とれますか。",
    variables: {
      divisor: { min: 0.8, max: 1.6, decimalPlaces: 1 },
      quotient: { min: 3, max: 9, step: 1 }
    },
    generatorType: "exactDecimalDivisionByDecimal",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "枚"
  },
  {
    id: "g5t1_ddd_008",
    gradeTerm: "5-1",
    category: "小数÷小数",
    categoryId: "decimal-divided-by-decimal",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{dividend}mの針金を、{divisor}mずつに切り分けます。何本作れますか。",
    variables: {
      divisor: { min: 0.4, max: 1.2, decimalPlaces: 1 },
      quotient: { min: 4, max: 11, step: 1 }
    },
    generatorType: "exactDecimalDivisionByDecimal",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "本"
  },

  // ============================================================
  // 小数倍（8種類） generatorType: "decimalMultiplicativeComparison"
  // 基準量(base)・何倍(multiplier)から、比較量(compared) = base × multiplier を自動計算します。
  // unknown: "compared"（比較量を求める。base × multiplier、commutative: true）と
  // unknown: "multiplier"（何倍かを求める。compared ÷ base、commutative: false）を
  // それぞれ4種類ずつ用意しています。
  // ============================================================
  {
    id: "g5t1_mc_001",
    gradeTerm: "5-1",
    category: "小数倍",
    categoryId: "decimal-multiplicative-comparison",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "赤いテープの長さは{base}mです。青いテープの長さは、赤いテープの長さの{multiplier}倍です。青いテープの長さは何mですか。",
    variables: {
      base: { min: 1.5, max: 6.5, decimalPlaces: 1 },
      multiplier: { min: 1.2, max: 3.6, decimalPlaces: 1 }
    },
    generatorType: "decimalMultiplicativeComparison",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "compared" },
    solutionRoutes: [{ left: "base", operator: "×", right: "multiplier", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g5t1_mc_002",
    gradeTerm: "5-1",
    category: "小数倍",
    categoryId: "decimal-multiplicative-comparison",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "荷物Aの重さは{base}kgです。荷物Bの重さは、荷物Aの重さの{multiplier}倍です。荷物Bの重さは何kgですか。",
    variables: {
      base: { min: 2.5, max: 8.5, decimalPlaces: 1 },
      multiplier: { min: 1.1, max: 2.9, decimalPlaces: 1 }
    },
    generatorType: "decimalMultiplicativeComparison",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "compared" },
    solutionRoutes: [{ left: "base", operator: "×", right: "multiplier", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g5t1_mc_003",
    gradeTerm: "5-1",
    category: "小数倍",
    categoryId: "decimal-multiplicative-comparison",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "バケツに入っている水は{base}Lです。タンクに入っている水は、バケツの水の{multiplier}倍です。タンクの水は何Lですか。",
    variables: {
      base: { min: 3.5, max: 9.5, decimalPlaces: 1 },
      multiplier: { min: 0.6, max: 0.9, decimalPlaces: 1 }
    },
    generatorType: "decimalMultiplicativeComparison",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "compared" },
    solutionRoutes: [{ left: "base", operator: "×", right: "multiplier", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g5t1_mc_004",
    gradeTerm: "5-1",
    category: "小数倍",
    categoryId: "decimal-multiplicative-comparison",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "辞書の厚さは{base}cmです。図鑑の厚さは、辞書の厚さの{multiplier}倍です。図鑑の厚さは何cmですか。",
    variables: {
      base: { min: 2.5, max: 5.5, decimalPlaces: 1 },
      multiplier: { min: 1.2, max: 2.8, decimalPlaces: 1 }
    },
    generatorType: "decimalMultiplicativeComparison",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "compared" },
    solutionRoutes: [{ left: "base", operator: "×", right: "multiplier", commutative: true }],
    answerUnit: "cm"
  },
  {
    id: "g5t1_mc_005",
    gradeTerm: "5-1",
    category: "小数倍",
    categoryId: "decimal-multiplicative-comparison",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "ノートの値段は{base}円です。図鑑の値段は{compared}円です。図鑑の値段は、ノートの値段の何倍ですか。",
    variables: {
      base: { min: 120, max: 250, step: 10 },
      multiplier: { min: 1.2, max: 3.6, decimalPlaces: 1 }
    },
    generatorType: "decimalMultiplicativeComparison",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "multiplier" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "base", commutative: false }],
    answerUnit: "倍"
  },
  {
    id: "g5t1_mc_006",
    gradeTerm: "5-1",
    category: "小数倍",
    categoryId: "decimal-multiplicative-comparison",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "カバンの重さは{base}kgです。スーツケースの重さは{compared}kgです。スーツケースの重さは、カバンの重さの何倍ですか。",
    variables: {
      base: { min: 1.5, max: 3.5, decimalPlaces: 1 },
      multiplier: { min: 1.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "decimalMultiplicativeComparison",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "multiplier" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "base", commutative: false }],
    answerUnit: "倍"
  },
  {
    id: "g5t1_mc_007",
    gradeTerm: "5-1",
    category: "小数倍",
    categoryId: "decimal-multiplicative-comparison",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "学校から駅までの道のりは{base}kmです。学校から図書館までの道のりは{compared}kmです。学校から図書館までの道のりは、学校から駅までの道のりの何倍ですか。",
    variables: {
      base: { min: 0.6, max: 1.8, decimalPlaces: 1 },
      multiplier: { min: 1.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "decimalMultiplicativeComparison",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "multiplier" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "base", commutative: false }],
    answerUnit: "倍"
  },
  {
    id: "g5t1_mc_008",
    gradeTerm: "5-1",
    category: "小数倍",
    categoryId: "decimal-multiplicative-comparison",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "コップに入っている水は{base}dLです。水とうに入っている水は{compared}dLです。水とうの水は、コップの水の何倍ですか。",
    variables: {
      base: { min: 1.5, max: 3.5, decimalPlaces: 1 },
      multiplier: { min: 2, max: 6, step: 1 }
    },
    generatorType: "decimalMultiplicativeComparison",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "multiplier" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "base", commutative: false }],
    answerUnit: "倍"
  },

  // ============================================================
  // もとの量（8種類） generatorType: "decimalOriginalQuantity"
  // 「基準量(base)の何倍(multiplier)が、比較量(compared)である」という関係から、
  // 比較量・何倍が分かっているときにもとの量(base)を求めます。
  // 解法は compared ÷ multiplier = base（commutative: false）です。
  // ============================================================
  {
    id: "g5t1_oq_001",
    gradeTerm: "5-1",
    category: "もとの量",
    categoryId: "decimal-original-quantity",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "赤いテープの長さの{multiplier}倍が、青いテープの長さ{compared}mです。赤いテープの長さは何mですか。",
    variables: {
      base: { min: 1.5, max: 6.5, decimalPlaces: 1 },
      multiplier: { min: 1.2, max: 3.6, decimalPlaces: 1 }
    },
    generatorType: "decimalOriginalQuantity",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g5t1_oq_002",
    gradeTerm: "5-1",
    category: "もとの量",
    categoryId: "decimal-original-quantity",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "ある米の重さの{multiplier}倍が、{compared}kgです。もとの米の重さは何kgですか。",
    variables: {
      base: { min: 2.5, max: 8.5, decimalPlaces: 1 },
      multiplier: { min: 1.1, max: 2.9, decimalPlaces: 1 }
    },
    generatorType: "decimalOriginalQuantity",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "kg"
  },
  {
    id: "g5t1_oq_003",
    gradeTerm: "5-1",
    category: "もとの量",
    categoryId: "decimal-original-quantity",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "ある本の値段の{multiplier}倍が、図鑑の値段{compared}円です。本の値段は何円ですか。",
    variables: {
      base: { min: 120, max: 250, step: 10 },
      multiplier: { min: 1.2, max: 3.6, decimalPlaces: 1 }
    },
    generatorType: "decimalOriginalQuantity",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "円"
  },
  {
    id: "g5t1_oq_004",
    gradeTerm: "5-1",
    category: "もとの量",
    categoryId: "decimal-original-quantity",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "ある畑の面積の{multiplier}倍が、新しく借りた畑の面積{compared}m²です。もとの畑の面積は何m²ですか。",
    variables: {
      base: { min: 3.5, max: 9.5, decimalPlaces: 1 },
      multiplier: { min: 1.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "decimalOriginalQuantity",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "m²"
  },
  {
    id: "g5t1_oq_005",
    gradeTerm: "5-1",
    category: "もとの量",
    categoryId: "decimal-original-quantity",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "水そうに入っていた水の量の{multiplier}倍が、今の水の量{compared}Lです。もとの水の量は何Lですか。",
    variables: {
      base: { min: 4.5, max: 9.5, decimalPlaces: 1 },
      multiplier: { min: 1.2, max: 2.8, decimalPlaces: 1 }
    },
    generatorType: "decimalOriginalQuantity",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "L"
  },
  {
    id: "g5t1_oq_006",
    gradeTerm: "5-1",
    category: "もとの量",
    categoryId: "decimal-original-quantity",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "木の高さの{multiplier}倍が、電柱の高さ{compared}mです。木の高さは何mですか。",
    variables: {
      base: { min: 1.5, max: 3.5, decimalPlaces: 1 },
      multiplier: { min: 1.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "decimalOriginalQuantity",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g5t1_oq_007",
    gradeTerm: "5-1",
    category: "もとの量",
    categoryId: "decimal-original-quantity",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "布の長さの{multiplier}倍が、新しく買った布の長さ{compared}mです。もとの布の長さは何mですか。",
    variables: {
      base: { min: 1.2, max: 3.6, decimalPlaces: 1 },
      multiplier: { min: 1.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "decimalOriginalQuantity",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g5t1_oq_008",
    gradeTerm: "5-1",
    category: "もとの量",
    categoryId: "decimal-original-quantity",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "荷物Aの重さの{multiplier}倍が、荷物Bの重さ{compared}kgです。荷物Aの重さは何kgですか。",
    variables: {
      base: { min: 2.5, max: 8.5, decimalPlaces: 1 },
      multiplier: { min: 0.6, max: 0.9, decimalPlaces: 1 }
    },
    generatorType: "decimalOriginalQuantity",
    quantityRelation: { type: "multiplicative-comparison", baseKey: "base", comparedKey: "compared", multiplierKey: "multiplier", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "kg"
  }
];
