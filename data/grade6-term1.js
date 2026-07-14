// 小学6年生・1学期 問題テンプレートデータ（新内容）。
//
// このファイルはデータのみを定義します。ゲーム処理は含みません。
// ゲーム本体は data/index.js 経由でのみこのファイルを読み込みます。
//
// 小学6年生・1学期モードで出題する「新内容」は、次の7カテゴリ×5種類＝35テンプレートです。
//   - 分数×整数 / 分数×分数 / 分数÷整数 / 整数÷分数 / 分数÷分数 /
//     分数倍・比べる量 / 分数倍・もとの量
// （復習内容は data/index.js が別途、4年生1〜3学期・5年生1〜3学期のテンプレートから選びます。
//  出題比率・カテゴリバランスは js/question-generator.js の GRADE_TERM_PLAN_CONFIG["6-1"] が
//  自動的に処理するため、このファイルには新内容のテンプレートのみを定義します。）
//
// すべてのテンプレートで、分数の値が問題文中に直接登場するため textParts を使用します
// （template という単純な文字列を使うと、分数オブジェクトが "[object Object]" のように
//  展開されてしまうため。分数を含む問題文は必ず textParts を使ってください）。
//
// ---- 分数×整数・分数×分数・分数÷整数・整数÷分数・分数÷分数 ----
// これらはすべて generatorType:"standard" のエイリアス（各変数を独立に生成するだけ）です。
// 分数のかけ算・わり算は js/value-utils.js の calculateValues() が必ず正確な分子・分母の
// 計算として行うため（あまりが出ることも、循環小数になることもない）、小数のわり算のように
// 「割り切れることを事前に保証する」専用の生成関数は不要です。
// わる数（分数÷整数の整数側、整数÷分数・分数÷分数の右側の分数）の分子・分母には
// 0を含めていません（0でわる問題を生成しないため）。
//
// ---- 分数倍・比べる量、分数倍・もとの量 ----
// quantityRelation: { type:"fraction-multiplicative-comparison", baseKey, comparedKey,
// multiplierKey, unknown } で「もとにする量×分数倍＝比べる量」の関係を表します。
// もとにする量（baseKey）は整数、分数倍（multiplierKey）は分数として生成し、
// 比べる量（comparedKey）＝もとにする量×分数倍を calculateValues() で計算します
// （整数×分数の交換法則もそのまま利用できるため、専用の乗算処理は不要です）。

export const grade6Term1Templates = [
  // ============================================================
  // 分数×整数（5種類） generatorType: "fractionTimesInteger"
  // ============================================================
  {
    id: "g6t1_frac_mul_int_001",
    gradeTerm: "6-1",
    category: "分数×整数",
    categoryId: "fraction-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "1本のリボンの長さは" },
      { type: "value", ref: "unitAmount" },
      { type: "text", value: "mです。同じリボンが" },
      { type: "value", ref: "count" },
      { type: "text", value: "本あります。全部の長さは何mですか。" }
    ],
    variables: {
      unitAmount: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 },
      count: { min: 2, max: 12, step: 1 }
    },
    generatorType: "fractionTimesInteger",
    solutionRoutes: [{ left: "unitAmount", operator: "×", right: "count", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g6t1_frac_mul_int_002",
    gradeTerm: "6-1",
    category: "分数×整数",
    categoryId: "fraction-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "1ふくろに" },
      { type: "value", ref: "unitAmount" },
      { type: "text", value: "kgのお米が入っています。" },
      { type: "value", ref: "count" },
      { type: "text", value: "ふくろ分では、お米は何kgになりますか。" }
    ],
    variables: {
      unitAmount: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 },
      count: { min: 2, max: 10, step: 1 }
    },
    generatorType: "fractionTimesInteger",
    solutionRoutes: [{ left: "unitAmount", operator: "×", right: "count", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g6t1_frac_mul_int_003",
    gradeTerm: "6-1",
    category: "分数×整数",
    categoryId: "fraction-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "1まいの布の面積は" },
      { type: "value", ref: "unitAmount" },
      { type: "text", value: "㎡です。同じ布が" },
      { type: "value", ref: "count" },
      { type: "text", value: "まいあります。全部の面積は何㎡ですか。" }
    ],
    variables: {
      unitAmount: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 },
      count: { min: 2, max: 9, step: 1 }
    },
    generatorType: "fractionTimesInteger",
    solutionRoutes: [{ left: "unitAmount", operator: "×", right: "count", commutative: true }],
    answerUnit: "㎡"
  },
  {
    id: "g6t1_frac_mul_int_004",
    gradeTerm: "6-1",
    category: "分数×整数",
    categoryId: "fraction-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "1人分のジュースの量は" },
      { type: "value", ref: "unitAmount" },
      { type: "text", value: "Lです。" },
      { type: "value", ref: "count" },
      { type: "text", value: "人分では、ジュースは何Lになりますか。" }
    ],
    variables: {
      unitAmount: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 5 },
      count: { min: 2, max: 11, step: 1 }
    },
    generatorType: "fractionTimesInteger",
    solutionRoutes: [{ left: "unitAmount", operator: "×", right: "count", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g6t1_frac_mul_int_005",
    gradeTerm: "6-1",
    category: "分数×整数",
    categoryId: "fraction-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "1本の棒の長さは" },
      { type: "value", ref: "unitAmount" },
      { type: "text", value: "mです。同じ棒が" },
      { type: "value", ref: "count" },
      { type: "text", value: "本あります。全部の長さは何mですか。" }
    ],
    variables: {
      unitAmount: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 6 },
      count: { min: 2, max: 12, step: 1 }
    },
    generatorType: "fractionTimesInteger",
    solutionRoutes: [{ left: "unitAmount", operator: "×", right: "count", commutative: true }],
    answerUnit: "m"
  },

  // ============================================================
  // 分数×分数（5種類） generatorType: "fractionTimesFraction"
  // ============================================================
  {
    id: "g6t1_frac_mul_frac_001",
    gradeTerm: "6-1",
    category: "分数×分数",
    categoryId: "fraction-times-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "1㎡あたり" },
      { type: "value", ref: "perArea" },
      { type: "text", value: "Lのペンキを使います。" },
      { type: "value", ref: "area" },
      { type: "text", value: "㎡をぬるには、何Lのペンキが必要ですか。" }
    ],
    variables: {
      perArea: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 },
      area: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "fractionTimesFraction",
    solutionRoutes: [{ left: "perArea", operator: "×", right: "area", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g6t1_frac_mul_frac_002",
    gradeTerm: "6-1",
    category: "分数×分数",
    categoryId: "fraction-times-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "1mの重さが" },
      { type: "value", ref: "weightPerM" },
      { type: "text", value: "kgの棒があります。" },
      { type: "value", ref: "length" },
      { type: "text", value: "mの棒の重さは何kgですか。" }
    ],
    variables: {
      weightPerM: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 },
      length: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "fractionTimesFraction",
    solutionRoutes: [{ left: "weightPerM", operator: "×", right: "length", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g6t1_frac_mul_frac_003",
    gradeTerm: "6-1",
    category: "分数×分数",
    categoryId: "fraction-times-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "1Lの牛乳の重さは" },
      { type: "value", ref: "weightPerL" },
      { type: "text", value: "kgです。" },
      { type: "value", ref: "amount" },
      { type: "text", value: "Lの牛乳の重さは何kgですか。" }
    ],
    variables: {
      weightPerL: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 },
      amount: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 }
    },
    generatorType: "fractionTimesFraction",
    solutionRoutes: [{ left: "weightPerL", operator: "×", right: "amount", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g6t1_frac_mul_frac_004",
    gradeTerm: "6-1",
    category: "分数×分数",
    categoryId: "fraction-times-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "たて" },
      { type: "value", ref: "width" },
      { type: "text", value: "m、横" },
      { type: "value", ref: "height" },
      { type: "text", value: "mの長方形の花だんがあります。この花だんの面積は何㎡ですか。" }
    ],
    variables: {
      width: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 },
      height: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "fractionTimesFraction",
    solutionRoutes: [{ left: "width", operator: "×", right: "height", commutative: true }],
    answerUnit: "㎡"
  },
  {
    id: "g6t1_frac_mul_frac_005",
    gradeTerm: "6-1",
    category: "分数×分数",
    categoryId: "fraction-times-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "1分間に水そう全体の" },
      { type: "value", ref: "fillRatePerMinute" },
      { type: "text", value: "に水を入れることができます。" },
      { type: "value", ref: "minutes" },
      { type: "text", value: "分間では、水そう全体のどれだけに水が入りますか。" }
    ],
    variables: {
      fillRatePerMinute: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 3 },
      minutes: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "fractionTimesFraction",
    solutionRoutes: [{ left: "fillRatePerMinute", operator: "×", right: "minutes", commutative: true }],
    answerUnit: ""
  },

  // ============================================================
  // 分数÷整数（5種類） generatorType: "fractionDividedByInteger"
  // ============================================================
  {
    id: "g6t1_frac_div_int_001",
    gradeTerm: "6-1",
    category: "分数÷整数",
    categoryId: "fraction-divided-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "Lのジュースを" },
      { type: "value", ref: "people" },
      { type: "text", value: "人で同じ量ずつ分けます。1人分は何Lですか。" }
    ],
    variables: {
      totalAmount: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 },
      people: { min: 2, max: 9, step: 1 }
    },
    generatorType: "fractionDividedByInteger",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "people", commutative: false }],
    answerUnit: "L"
  },
  {
    id: "g6t1_frac_div_int_002",
    gradeTerm: "6-1",
    category: "分数÷整数",
    categoryId: "fraction-divided-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "mのリボンを" },
      { type: "value", ref: "people" },
      { type: "text", value: "人で同じ長さずつ分けます。1人分は何mですか。" }
    ],
    variables: {
      totalAmount: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 },
      people: { min: 2, max: 8, step: 1 }
    },
    generatorType: "fractionDividedByInteger",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "people", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g6t1_frac_div_int_003",
    gradeTerm: "6-1",
    category: "分数÷整数",
    categoryId: "fraction-divided-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "kgのお米を" },
      { type: "value", ref: "bags" },
      { type: "text", value: "この容器に同じ量ずつ入れます。1つ分は何kgですか。" }
    ],
    variables: {
      totalAmount: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 5 },
      bags: { min: 2, max: 10, step: 1 }
    },
    generatorType: "fractionDividedByInteger",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "bags", commutative: false }],
    answerUnit: "kg"
  },
  {
    id: "g6t1_frac_div_int_004",
    gradeTerm: "6-1",
    category: "分数÷整数",
    categoryId: "fraction-divided-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "㎡の布を" },
      { type: "value", ref: "people" },
      { type: "text", value: "人で同じ面積ずつ分けます。1人分は何㎡ですか。" }
    ],
    variables: {
      totalAmount: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 },
      people: { min: 2, max: 6, step: 1 }
    },
    generatorType: "fractionDividedByInteger",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "people", commutative: false }],
    answerUnit: "㎡"
  },
  {
    id: "g6t1_frac_div_int_005",
    gradeTerm: "6-1",
    category: "分数÷整数",
    categoryId: "fraction-divided-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "Lのペンキを" },
      { type: "value", ref: "walls" },
      { type: "text", value: "この壁に同じ量ずつ使います。1つの壁分は何Lですか。" }
    ],
    variables: {
      totalAmount: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 6 },
      walls: { min: 2, max: 11, step: 1 }
    },
    generatorType: "fractionDividedByInteger",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "walls", commutative: false }],
    answerUnit: "L"
  },

  // ============================================================
  // 整数÷分数（5種類） generatorType: "integerDividedByFraction"
  // ============================================================
  {
    id: "g6t1_int_div_frac_001",
    gradeTerm: "6-1",
    category: "整数÷分数",
    categoryId: "integer-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "Lのジュースを、1杯" },
      { type: "value", ref: "perCup" },
      { type: "text", value: "Lずつ入れます。何杯分になりますか。" }
    ],
    variables: {
      totalAmount: { min: 2, max: 10, step: 1 },
      perCup: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "integerDividedByFraction",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "perCup", commutative: false }],
    answerUnit: "杯"
  },
  {
    id: "g6t1_int_div_frac_002",
    gradeTerm: "6-1",
    category: "整数÷分数",
    categoryId: "integer-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalLength" },
      { type: "text", value: "mのロープを、1本" },
      { type: "value", ref: "perPiece" },
      { type: "text", value: "mずつに切ります。何本できますか。" }
    ],
    variables: {
      totalLength: { min: 2, max: 12, step: 1 },
      perPiece: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 }
    },
    generatorType: "integerDividedByFraction",
    solutionRoutes: [{ left: "totalLength", operator: "÷", right: "perPiece", commutative: false }],
    answerUnit: "本"
  },
  {
    id: "g6t1_int_div_frac_003",
    gradeTerm: "6-1",
    category: "整数÷分数",
    categoryId: "integer-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "kgのお米を、1ふくろ" },
      { type: "value", ref: "perBag" },
      { type: "text", value: "kgずつ入れます。何ふくろできますか。" }
    ],
    variables: {
      totalAmount: { min: 2, max: 10, step: 1 },
      perBag: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "integerDividedByFraction",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "perBag", commutative: false }],
    answerUnit: "ふくろ"
  },
  {
    id: "g6t1_int_div_frac_004",
    gradeTerm: "6-1",
    category: "整数÷分数",
    categoryId: "integer-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalArea" },
      { type: "text", value: "㎡の布から、1まい" },
      { type: "value", ref: "perPiece" },
      { type: "text", value: "㎡ずつ切り取ります。何まいとれますか。" }
    ],
    variables: {
      totalArea: { min: 2, max: 9, step: 1 },
      perPiece: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "integerDividedByFraction",
    solutionRoutes: [{ left: "totalArea", operator: "÷", right: "perPiece", commutative: false }],
    answerUnit: "まい"
  },
  {
    id: "g6t1_int_div_frac_005",
    gradeTerm: "6-1",
    category: "整数÷分数",
    categoryId: "integer-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "Lの水を、1つの水そうに" },
      { type: "value", ref: "perTank" },
      { type: "text", value: "Lずつ入れます。いくつの水そうに入れられますか。" }
    ],
    variables: {
      totalAmount: { min: 2, max: 12, step: 1 },
      perTank: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "integerDividedByFraction",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "perTank", commutative: false }],
    answerUnit: "つ"
  },

  // ============================================================
  // 分数÷分数（5種類） generatorType: "fractionDividedByFraction"
  // ============================================================
  {
    id: "g6t1_frac_div_frac_001",
    gradeTerm: "6-1",
    category: "分数÷分数",
    categoryId: "fraction-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "Lのジュースを、1杯" },
      { type: "value", ref: "perCup" },
      { type: "text", value: "Lずつ入れます。何杯分になりますか。" }
    ],
    variables: {
      totalAmount: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 },
      perCup: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "fractionDividedByFraction",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "perCup", commutative: false }],
    answerUnit: "杯"
  },
  {
    id: "g6t1_frac_div_frac_002",
    gradeTerm: "6-1",
    category: "分数÷分数",
    categoryId: "fraction-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalLength" },
      { type: "text", value: "mのリボンを、1本" },
      { type: "value", ref: "perPiece" },
      { type: "text", value: "mずつに切ります。何本分になりますか。" }
    ],
    variables: {
      totalLength: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 5 },
      perPiece: { type: "fraction", denominator: 9, numeratorMin: 1, numeratorMax: 7 }
    },
    generatorType: "fractionDividedByFraction",
    solutionRoutes: [{ left: "totalLength", operator: "÷", right: "perPiece", commutative: false }],
    answerUnit: "本"
  },
  {
    id: "g6t1_frac_div_frac_003",
    gradeTerm: "6-1",
    category: "分数÷分数",
    categoryId: "fraction-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalArea" },
      { type: "text", value: "㎡の布から、1まい" },
      { type: "value", ref: "perPiece" },
      { type: "text", value: "㎡ずつ切り取ります。何まい分になりますか。" }
    ],
    variables: {
      totalArea: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 },
      perPiece: { type: "fraction", denominator: 10, numeratorMin: 1, numeratorMax: 8 }
    },
    generatorType: "fractionDividedByFraction",
    solutionRoutes: [{ left: "totalArea", operator: "÷", right: "perPiece", commutative: false }],
    answerUnit: "まい"
  },
  {
    id: "g6t1_frac_div_frac_004",
    gradeTerm: "6-1",
    category: "分数÷分数",
    categoryId: "fraction-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "kgのお米を、1ふくろ" },
      { type: "value", ref: "perBag" },
      { type: "text", value: "kgずつ分けます。何ふくろ分になりますか。" }
    ],
    variables: {
      totalAmount: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 },
      perBag: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "fractionDividedByFraction",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "perBag", commutative: false }],
    answerUnit: "ふくろ"
  },
  {
    id: "g6t1_frac_div_frac_005",
    gradeTerm: "6-1",
    category: "分数÷分数",
    categoryId: "fraction-divided-by-fraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "Lのペンキを、1回に" },
      { type: "value", ref: "perUse" },
      { type: "text", value: "Lずつ使います。何回分になりますか。" }
    ],
    variables: {
      totalAmount: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 },
      perUse: { type: "fraction", denominator: 12, numeratorMin: 1, numeratorMax: 9 }
    },
    generatorType: "fractionDividedByFraction",
    solutionRoutes: [{ left: "totalAmount", operator: "÷", right: "perUse", commutative: false }],
    answerUnit: "回"
  },

  // ============================================================
  // 分数倍・比べる量（5種類、unknown:"compared"） generatorType: "fractionMultiplierFindCompared"
  // ============================================================
  {
    id: "g6t1_frac_multiplier_compared_001",
    gradeTerm: "6-1",
    category: "分数倍・比べる量",
    categoryId: "fraction-multiplier-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "赤いリボンの長さは" },
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "mです。青いリボンは赤いリボンの" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍です。青いリボンは何mですか。" }
    ],
    variables: {
      baseAmount: { min: 2, max: 12, step: 1 },
      multiplier: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "fractionMultiplierFindCompared",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "multiplier", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g6t1_frac_multiplier_compared_002",
    gradeTerm: "6-1",
    category: "分数倍・比べる量",
    categoryId: "fraction-multiplier-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "青いテープの長さは" },
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "mです。黄色いテープは青いテープの" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍です。黄色いテープは何mですか。" }
    ],
    variables: {
      baseAmount: { min: 2, max: 12, step: 1 },
      multiplier: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 6 }
    },
    generatorType: "fractionMultiplierFindCompared",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "multiplier", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g6t1_frac_multiplier_compared_003",
    gradeTerm: "6-1",
    category: "分数倍・比べる量",
    categoryId: "fraction-multiplier-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "兄の体重は" },
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "kgです。弟の体重は兄の体重の" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍です。弟の体重は何kgですか。" }
    ],
    variables: {
      baseAmount: { min: 20, max: 60, step: 1 },
      multiplier: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "fractionMultiplierFindCompared",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "multiplier", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g6t1_frac_multiplier_compared_004",
    gradeTerm: "6-1",
    category: "分数倍・比べる量",
    categoryId: "fraction-multiplier-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "花だんの面積は" },
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "㎡です。菜園の面積は花だんの" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍です。菜園の面積は何㎡ですか。" }
    ],
    variables: {
      baseAmount: { min: 2, max: 12, step: 1 },
      multiplier: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 8 }
    },
    generatorType: "fractionMultiplierFindCompared",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "multiplier", commutative: true }],
    answerUnit: "㎡"
  },
  {
    id: "g6t1_frac_multiplier_compared_005",
    gradeTerm: "6-1",
    category: "分数倍・比べる量",
    categoryId: "fraction-multiplier-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "赤色の絵の具の量は" },
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "dLです。青色の絵の具の量は赤色の絵の具の" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍です。青色の絵の具の量は何dLですか。" }
    ],
    variables: {
      baseAmount: { min: 2, max: 10, step: 1 },
      multiplier: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 10 }
    },
    generatorType: "fractionMultiplierFindCompared",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "multiplier", commutative: true }],
    answerUnit: "dL"
  },

  // ============================================================
  // 分数倍・もとの量（5種類、unknown:"base"） generatorType: "fractionMultiplierFindBase"
  // ============================================================
  {
    id: "g6t1_frac_multiplier_base_001",
    gradeTerm: "6-1",
    category: "分数倍・もとの量",
    categoryId: "fraction-multiplier-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "青いリボンは赤いリボンの" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍で、長さは" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "mです。赤いリボンは何mですか。" }
    ],
    variables: {
      baseAmount: { min: 2, max: 12, step: 1 },
      multiplier: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "fractionMultiplierFindBase",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g6t1_frac_multiplier_base_002",
    gradeTerm: "6-1",
    category: "分数倍・もとの量",
    categoryId: "fraction-multiplier-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "黄色いテープは青いテープの" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍で、長さは" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "mです。青いテープは何mですか。" }
    ],
    variables: {
      baseAmount: { min: 2, max: 12, step: 1 },
      multiplier: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 6 }
    },
    generatorType: "fractionMultiplierFindBase",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g6t1_frac_multiplier_base_003",
    gradeTerm: "6-1",
    category: "分数倍・もとの量",
    categoryId: "fraction-multiplier-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "弟の体重は兄の体重の" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍で、" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "kgです。兄の体重は何kgですか。" }
    ],
    variables: {
      baseAmount: { min: 20, max: 60, step: 1 },
      multiplier: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "fractionMultiplierFindBase",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "kg"
  },
  {
    id: "g6t1_frac_multiplier_base_004",
    gradeTerm: "6-1",
    category: "分数倍・もとの量",
    categoryId: "fraction-multiplier-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "菜園の面積は花だんの" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍で、" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "㎡です。花だんの面積は何㎡ですか。" }
    ],
    variables: {
      baseAmount: { min: 2, max: 12, step: 1 },
      multiplier: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 8 }
    },
    generatorType: "fractionMultiplierFindBase",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "㎡"
  },
  {
    id: "g6t1_frac_multiplier_base_005",
    gradeTerm: "6-1",
    category: "分数倍・もとの量",
    categoryId: "fraction-multiplier-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "青色の絵の具の量は赤色の絵の具の" },
      { type: "value", ref: "multiplier" },
      { type: "text", value: "倍で、" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "dLです。赤色の絵の具の量は何dLですか。" }
    ],
    variables: {
      baseAmount: { min: 2, max: 10, step: 1 },
      multiplier: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 10 }
    },
    generatorType: "fractionMultiplierFindBase",
    quantityRelation: {
      type: "fraction-multiplicative-comparison",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      multiplierKey: "multiplier",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "multiplier", commutative: false }],
    answerUnit: "dL"
  }
];
