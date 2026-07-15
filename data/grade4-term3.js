// 小学4年生・3学期 問題テンプレートデータ（新内容）。
//
// このファイルはデータのみを定義します。ゲーム処理は含みません。
// ゲーム本体は data/index.js 経由でのみこのファイルを読み込みます。
//
// 小学4年生・3学期モードで出題する「新内容」は、次の4カテゴリ×6種類＝24テンプレートです。
//   - 小数×整数 / 小数÷整数 / 同分母分数のたし算 / 同分母分数のひき算
//
// ---- 小数×整数・小数÷整数 ----
// これらは整数・小数のみを扱うため、既存の grade4-term1.js / grade4-term2.js と同じ
// 文字列形式の template フィールドを使用します。
//
// ---- 同分母分数のたし算・ひき算 ----
// 分数は横並びの文字列（"3/5" など）だけでは正しく縦型表示できないため、
// template の代わりに textParts（文字列パーツと値パーツが交互に並ぶ配列）を使用します。
// textParts の値パーツは { type:"value", ref:"変数名" } の形式で、variables のキー名を
// 参照します（実際の値は questionType-generator.js が生成時に解決します）。
//
// 分数の variables は { type:"fraction", denominator, numeratorMin, numeratorMax } の形式です。
// 分母(denominator)はテンプレートごとに固定値として指定してください
// （a・bの分母を同じ値にすることで、常に同分母の問題になります）。
// ひき算では、a.numeratorMin が b.numeratorMax 以上になるように設計し、
// 答えが必ず0以上になるようにしています。
//
// contentGroup は明示的に "new" を指定しています
// （js/question-generator.js の getContentGroup() は本来 gradeTerm から自動判定できますが、
//  他の学期データと同じ書き方に揃えるため、ここでも明示しています）。

export const grade4Term3Templates = [
  // ============================================================
  // 小数×整数（6種類） generatorType: "decimalTimesInteger"
  // ============================================================
  {
    id: "g4t3_dec_mul_001",
    gradeTerm: "4-3",
    category: "小数×整数",
    categoryId: "decimal-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1本{a}mのリボンが{b}本あります。全部の長さは何mですか。",
    variables: {
      a: { min: 1.1, max: 8.9, decimalPlaces: 1 },
      b: { min: 2, max: 9, step: 1 }
    },
    generatorType: "decimalTimesInteger",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g4t3_dec_mul_002",
    gradeTerm: "4-3",
    category: "小数×整数",
    categoryId: "decimal-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1本{a}Lのジュースが{b}本あります。全部で何Lですか。",
    variables: {
      a: { min: 0.15, max: 0.95, decimalPlaces: 2 },
      b: { min: 2, max: 8, step: 1 }
    },
    generatorType: "decimalTimesInteger",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g4t3_dec_mul_003",
    gradeTerm: "4-3",
    category: "小数×整数",
    categoryId: "decimal-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1個{a}kgの荷物が{b}個あります。全部の重さは何kgですか。",
    variables: {
      a: { min: 1.1, max: 6.9, decimalPlaces: 1 },
      b: { min: 2, max: 9, step: 1 }
    },
    generatorType: "decimalTimesInteger",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g4t3_dec_mul_004",
    gradeTerm: "4-3",
    category: "小数×整数",
    categoryId: "decimal-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1冊の厚さが{a}cmのノートが{b}冊あります。積み重ねると何cmになりますか。",
    variables: {
      a: { min: 0.3, max: 1.2, decimalPlaces: 1 },
      b: { min: 3, max: 9, step: 1 }
    },
    generatorType: "decimalTimesInteger",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "cm"
  },
  {
    id: "g4t3_dec_mul_005",
    gradeTerm: "4-3",
    category: "小数×整数",
    categoryId: "decimal-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1周{a}kmのコースを{b}周走ります。全部で何km走りますか。",
    variables: {
      a: { min: 0.25, max: 1.75, decimalPlaces: 2 },
      b: { min: 2, max: 8, step: 1 }
    },
    generatorType: "decimalTimesInteger",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "km"
  },
  {
    id: "g4t3_dec_mul_006",
    gradeTerm: "4-3",
    category: "小数×整数",
    categoryId: "decimal-times-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "機械が1時間に{a}Lの水をくみ上げます。{b}時間では何Lくみ上げますか。",
    variables: {
      a: { min: 1.2, max: 7.8, decimalPlaces: 1 },
      b: { min: 2, max: 9, step: 1 }
    },
    generatorType: "decimalTimesInteger",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "L"
  },

  // ============================================================
  // 小数÷整数（6種類） generatorType: "exactDecimalDivisionByInteger"
  // 先に商(quotient)とわる数(divisor)を決め、わられる数(dividend)＝quotient×divisor を
  // 自動計算するため、必ず有限小数で割り切れます。
  // ============================================================
  {
    id: "g4t3_dec_div_001",
    gradeTerm: "4-3",
    category: "小数÷整数",
    categoryId: "decimal-division-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}Lのジュースを{divisor}つの容器に同じ量ずつ分けます。1つの容器には何L入りますか。",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 1.1, max: 8.9, decimalPlaces: 1 }
    },
    generatorType: "exactDecimalDivisionByInteger",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "L"
  },
  {
    id: "g4t3_dec_div_002",
    gradeTerm: "4-3",
    category: "小数÷整数",
    categoryId: "decimal-division-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}mのリボンを{divisor}人で同じ長さずつ分けます。1人分は何mですか。",
    variables: {
      divisor: { min: 2, max: 8, step: 1 },
      quotient: { min: 0.6, max: 5.4, decimalPlaces: 1 }
    },
    generatorType: "exactDecimalDivisionByInteger",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g4t3_dec_div_003",
    gradeTerm: "4-3",
    category: "小数÷整数",
    categoryId: "decimal-division-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}kgの米を{divisor}この袋に同じ重さずつ分けます。1つの袋は何kgですか。",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 0.7, max: 6.3, decimalPlaces: 1 }
    },
    generatorType: "exactDecimalDivisionByInteger",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "kg"
  },
  {
    id: "g4t3_dec_div_004",
    gradeTerm: "4-3",
    category: "小数÷整数",
    categoryId: "decimal-division-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}kmの道のりを{divisor}回に分けて走ります。1回に何km走りますか。",
    variables: {
      divisor: { min: 2, max: 8, step: 1 },
      quotient: { min: 0.4, max: 3.6, decimalPlaces: 1 }
    },
    generatorType: "exactDecimalDivisionByInteger",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "km"
  },
  {
    id: "g4t3_dec_div_005",
    gradeTerm: "4-3",
    category: "小数÷整数",
    categoryId: "decimal-division-by-integer",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{dividend}Lの水を{divisor}本の容器に同じ量ずつ分けます。1本には何L入りますか。",
    variables: {
      divisor: { min: 2, max: 6, step: 1 },
      quotient: { min: 0.25, max: 3.75, decimalPlaces: 2 }
    },
    generatorType: "exactDecimalDivisionByInteger",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "L"
  },
  {
    id: "g4t3_dec_div_006",
    gradeTerm: "4-3",
    category: "小数÷整数",
    categoryId: "decimal-division-by-integer",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}時間の作業を{divisor}日に分けて同じ時間ずつ行います。1日に何時間作業しますか。",
    variables: {
      divisor: { min: 2, max: 8, step: 1 },
      quotient: { min: 0.3, max: 2.7, decimalPlaces: 1 }
    },
    generatorType: "exactDecimalDivisionByInteger",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "時間"
  },

  // ============================================================
  // 同分母分数のたし算（6種類） generatorType: "sameDenominatorFractionAddition"
  // a・bの分母は同じ固定値を使用し、常に同分母のたし算になります。
  // ============================================================
  {
    id: "g4t3_frac_add_001",
    gradeTerm: "4-3",
    category: "同分母分数のたし算",
    categoryId: "same-denominator-fraction-addition",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "本を読みます。午前に本全体の" },
      { type: "value", ref: "a" },
      { type: "text", value: "を読み、午後に" },
      { type: "value", ref: "b" },
      { type: "text", value: "を読みました。合わせて本全体の何分のいくつを読みましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 7, numeratorMin: 1, numeratorMax: 3 },
      b: { type: "fraction", denominator: 7, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "sameDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: ""
  },
  {
    id: "g4t3_frac_add_002",
    gradeTerm: "4-3",
    category: "同分母分数のたし算",
    categoryId: "same-denominator-fraction-addition",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "水そうに水が" },
      { type: "value", ref: "a" },
      { type: "text", value: "Lありました。そこへ" },
      { type: "value", ref: "b" },
      { type: "text", value: "Lの水を足しました。全部で何Lになりましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 3 },
      b: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "sameDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g4t3_frac_add_003",
    gradeTerm: "4-3",
    category: "同分母分数のたし算",
    categoryId: "same-denominator-fraction-addition",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "ある作業の、全体の" },
      { type: "value", ref: "a" },
      { type: "text", value: "を午前に終わらせ、続けて全体の" },
      { type: "value", ref: "b" },
      { type: "text", value: "を午後に終わらせました。全体の何分のいくつが終わりましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 2 },
      b: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 2 }
    },
    generatorType: "sameDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: ""
  },
  {
    id: "g4t3_frac_add_004",
    gradeTerm: "4-3",
    category: "同分母分数のたし算",
    categoryId: "same-denominator-fraction-addition",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "赤いリボンが" },
      { type: "value", ref: "a" },
      { type: "text", value: "m、青いリボンが" },
      { type: "value", ref: "b" },
      { type: "text", value: "mあります。合わせて何mですか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 9, numeratorMin: 1, numeratorMax: 4 },
      b: { type: "fraction", denominator: 9, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "sameDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g4t3_frac_add_005",
    gradeTerm: "4-3",
    category: "同分母分数のたし算",
    categoryId: "same-denominator-fraction-addition",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "朝に" },
      { type: "value", ref: "a" },
      { type: "text", value: "km歩き、昼に" },
      { type: "value", ref: "b" },
      { type: "text", value: "km歩きました。合わせて何km歩きましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 10, numeratorMin: 2, numeratorMax: 4 },
      b: { type: "fraction", denominator: 10, numeratorMin: 2, numeratorMax: 4 }
    },
    generatorType: "sameDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "km"
  },
  {
    id: "g4t3_frac_add_006",
    gradeTerm: "4-3",
    category: "同分母分数のたし算",
    categoryId: "same-denominator-fraction-addition",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "米が" },
      { type: "value", ref: "a" },
      { type: "text", value: "kgありました。そこへ" },
      { type: "value", ref: "b" },
      { type: "text", value: "kgの米を足しました。全部で何kgになりましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 3 },
      b: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "sameDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "kg"
  },

  // ============================================================
  // 同分母分数のひき算（6種類） generatorType: "sameDenominatorFractionSubtraction"
  // a.numeratorMin が b.numeratorMax 以上になるように設計し、答えが常に0以上になるようにしています。
  // ============================================================
  {
    id: "g4t3_frac_sub_001",
    gradeTerm: "4-3",
    category: "同分母分数のひき算",
    categoryId: "same-denominator-fraction-subtraction",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "水が" },
      { type: "value", ref: "a" },
      { type: "text", value: "Lあり、そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "L使いました。残りは何Lですか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 8, numeratorMin: 5, numeratorMax: 7 },
      b: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "sameDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "L"
  },
  {
    id: "g4t3_frac_sub_002",
    gradeTerm: "4-3",
    category: "同分母分数のひき算",
    categoryId: "same-denominator-fraction-subtraction",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "リボンが" },
      { type: "value", ref: "a" },
      { type: "text", value: "mあり、そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "mを使いました。残りは何mですか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 9, numeratorMin: 5, numeratorMax: 8 },
      b: { type: "fraction", denominator: 9, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "sameDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g4t3_frac_sub_003",
    gradeTerm: "4-3",
    category: "同分母分数のひき算",
    categoryId: "same-denominator-fraction-subtraction",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "米が" },
      { type: "value", ref: "a" },
      { type: "text", value: "kgあり、そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "kgを使いました。残りは何kgですか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 10, numeratorMin: 6, numeratorMax: 9 },
      b: { type: "fraction", denominator: 10, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "sameDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "kg"
  },
  {
    id: "g4t3_frac_sub_004",
    gradeTerm: "4-3",
    category: "同分母分数のひき算",
    categoryId: "same-denominator-fraction-subtraction",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "遠足で" },
      { type: "value", ref: "a" },
      { type: "text", value: "km歩きました。そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "kmは下り坂でした。上り坂や平らな道は何kmありましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 12, numeratorMin: 7, numeratorMax: 10 },
      b: { type: "fraction", denominator: 12, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "sameDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "km"
  },
  {
    id: "g4t3_frac_sub_005",
    gradeTerm: "4-3",
    category: "同分母分数のひき算",
    categoryId: "same-denominator-fraction-subtraction",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "ある作業のうち、全体の" },
      { type: "value", ref: "a" },
      { type: "text", value: "が終わっていましたが、そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "は昨日の分でした。今日終わらせたのは全体の何分のいくつですか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 9, numeratorMin: 6, numeratorMax: 8 },
      b: { type: "fraction", denominator: 9, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "sameDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: ""
  },
  {
    id: "g4t3_frac_sub_006",
    gradeTerm: "4-3",
    category: "同分母分数のひき算",
    categoryId: "same-denominator-fraction-subtraction",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "画用紙が" },
      { type: "value", ref: "a" },
      { type: "text", value: "枚分あり、そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "枚分を工作で使いました。残りは何枚分ですか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 6, numeratorMin: 4, numeratorMax: 5 },
      b: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "sameDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "枚分"
  }
];
