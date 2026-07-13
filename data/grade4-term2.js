// 小学4年生・2学期 問題テンプレートデータ（新内容）。
//
// このファイルはデータのみを定義します。ゲーム処理は含みません。
// ゲーム本体は data/index.js 経由でのみこのファイルを読み込みます。
//
// 小学4年生・2学期モードで出題する「新内容」は、次の4カテゴリ×6種類＝24テンプレートを
// このファイルに用意しています。
//   - 小数のたし算 / 小数のひき算 / 大きな数 / 2けたでわるわり算
//
// 5つ目のカテゴリ「2段階文章題」は、第3段階で実装した data/multi-step-integer.js の
// 12テンプレートをそのまま再利用します（同じデータを複製しないため、このファイルには
// 2段階問題を含めていません）。js/question-generator.js の
// buildNewContentCategoryGroups() が、gradeTerm: "4-2" のテンプレート（このファイル）と
// gradeTerm: "4-multi-step" のテンプレート（multi-step-integer.js）を、
// 出題時にまとめて「新内容」として扱います。
// 24（このファイル）＋12（再利用）＝36テンプレートが、小学4年生2学期モードの
// 「新内容」プールとなり、仕様の「最低30種類」を満たします。
//
// contentGroup は明示的に "new" を指定しています
// （小学4年生2学期モードでの新内容／復習内容の分類に使用。
//  data/grade4-term1.js 側には contentGroup フィールドを追加していませんが、
//  js/question-generator.js の getContentGroup() が gradeTerm: "4-1" を
//  自動的に「復習内容」とみなすため、既存ファイルの修正は不要です）。
//
// ---- solutionRoutes の形式について ----
// このファイルはすべて questionType: "singleStep"（1つの式で解く問題）なので、
// data/grade4-term1.js と同じ「フラットな」形式を使います。
//   solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }]
// （2段階問題 data/multi-step-integer.js の { id, steps: [...] } 形式とは異なります。
//  questionType ごとに形式が変わるため、混同しないよう注意してください。）
//
// 小数は js/number-utils.js の誤差の出ない計算・表示関数を使って扱われます。
// variables に decimalPlaces を指定すると、js/question-generator.js が
// 自動的に小数として生成します（例: { min: 1.1, max: 9.9, decimalPlaces: 1 }）。

export const grade4Term2Templates = [
  // ============================================================
  // 小数のたし算（6種類） generatorType: "decimalAddition"
  // ============================================================
  {
    id: "g4t2_decimal_add_001",
    gradeTerm: "4-2",
    category: "小数のたし算",
    categoryId: "decimal-addition",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    template: "{a}Lのジュースと{b}Lのジュースを合わせました。全部で何Lですか。",
    variables: {
      a: { min: 1.1, max: 9.9, decimalPlaces: 1 },
      b: { min: 0.1, max: 5.9, decimalPlaces: 1 }
    },
    generatorType: "decimalAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g4t2_decimal_add_002",
    gradeTerm: "4-2",
    category: "小数のたし算",
    categoryId: "decimal-addition",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    template: "赤いテープが{a}m、青いテープが{b}mあります。合わせて何mですか。",
    variables: {
      a: { min: 1.0, max: 8.5, decimalPlaces: 1 },
      b: { min: 0.5, max: 6.5, decimalPlaces: 1 }
    },
    generatorType: "decimalAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g4t2_decimal_add_003",
    gradeTerm: "4-2",
    category: "小数のたし算",
    categoryId: "decimal-addition",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    template: "みかんの重さが{a}kg、りんごの重さが{b}kgあります。合わせて何kgですか。",
    variables: {
      a: { min: 0.5, max: 4.5, decimalPlaces: 1 },
      b: { min: 0.3, max: 3.7, decimalPlaces: 1 }
    },
    generatorType: "decimalAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g4t2_decimal_add_004",
    gradeTerm: "4-2",
    category: "小数のたし算",
    categoryId: "decimal-addition",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1時間目に{a}km、2時間目に{b}km歩きました。合わせて何km歩きましたか。",
    variables: {
      a: { min: 1.2, max: 6.8, decimalPlaces: 1 },
      b: { min: 0.4, max: 5.2, decimalPlaces: 1 }
    },
    generatorType: "decimalAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "km"
  },
  {
    id: "g4t2_decimal_add_005",
    gradeTerm: "4-2",
    category: "小数のたし算",
    categoryId: "decimal-addition",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    template: "牛乳が{a}L、お茶が{b}Lあります。合わせて何Lですか。",
    variables: {
      a: { min: 0.6, max: 3.4, decimalPlaces: 1 },
      b: { min: 0.2, max: 2.8, decimalPlaces: 1 }
    },
    generatorType: "decimalAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g4t2_decimal_add_006",
    gradeTerm: "4-2",
    category: "小数のたし算",
    categoryId: "decimal-addition",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "米が{a}kg、小麦粉が{b}kgあります。合わせて何kgですか。",
    variables: {
      a: { min: 1.5, max: 9.5, decimalPlaces: 1 },
      b: { min: 0.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "decimalAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "kg"
  },

  // ============================================================
  // 小数のひき算（6種類） generatorType: "decimalSubtraction"
  // a の範囲の下限が b の範囲の上限より大きくなるよう設定し、
  // 常に a > b（答えが正の小数）になるようにしています。
  // ============================================================
  {
    id: "g4t2_decimal_sub_001",
    gradeTerm: "4-2",
    category: "小数のひき算",
    categoryId: "decimal-subtraction",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{a}mのリボンから{b}m使いました。残りは何mですか。",
    variables: {
      a: { min: 3.0, max: 9.8, decimalPlaces: 1 },
      b: { min: 0.05, max: 2.95, decimalPlaces: 2 }
    },
    generatorType: "decimalSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g4t2_decimal_sub_002",
    gradeTerm: "4-2",
    category: "小数のひき算",
    categoryId: "decimal-subtraction",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    template: "{a}Lの水そうに水が入っています。{b}L使いました。残りは何Lですか。",
    variables: {
      a: { min: 5.0, max: 9.9, decimalPlaces: 1 },
      b: { min: 0.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "decimalSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "L"
  },
  {
    id: "g4t2_decimal_sub_003",
    gradeTerm: "4-2",
    category: "小数のひき算",
    categoryId: "decimal-subtraction",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    template: "{a}kgの砂糖から{b}kg使いました。残りは何kgですか。",
    variables: {
      a: { min: 4.0, max: 8.9, decimalPlaces: 1 },
      b: { min: 0.2, max: 3.8, decimalPlaces: 1 }
    },
    generatorType: "decimalSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "kg"
  },
  {
    id: "g4t2_decimal_sub_004",
    gradeTerm: "4-2",
    category: "小数のひき算",
    categoryId: "decimal-subtraction",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    template: "{a}mのロープから{b}m切り取りました。残りは何mですか。",
    variables: {
      a: { min: 6.0, max: 9.9, decimalPlaces: 1 },
      b: { min: 0.5, max: 5.5, decimalPlaces: 1 }
    },
    generatorType: "decimalSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g4t2_decimal_sub_005",
    gradeTerm: "4-2",
    category: "小数のひき算",
    categoryId: "decimal-subtraction",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{a}kmのコースのうち{b}km走りました。残りは何kmですか。",
    variables: {
      a: { min: 5.5, max: 9.9, decimalPlaces: 1 },
      b: { min: 0.3, max: 5.0, decimalPlaces: 1 }
    },
    generatorType: "decimalSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "km"
  },
  {
    id: "g4t2_decimal_sub_006",
    gradeTerm: "4-2",
    category: "小数のひき算",
    categoryId: "decimal-subtraction",
    contentGroup: "new",
    difficulty: 1,
    questionType: "singleStep",
    template: "{a}Lの牛乳から{b}L飲みました。残りは何Lですか。",
    variables: {
      a: { min: 3.5, max: 8.5, decimalPlaces: 1 },
      b: { min: 0.2, max: 3.2, decimalPlaces: 1 }
    },
    generatorType: "decimalSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "L"
  },

  // ============================================================
  // 大きな数（6種類） generatorType: "standard"
  // 万〜数十万の整数を使ったたし算・ひき算・かけ算。
  // ============================================================
  {
    id: "g4t2_big_add_001",
    gradeTerm: "4-2",
    category: "大きな数",
    categoryId: "large-numbers",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "ある会場には{a}人が来場しました。次の日には{b}人が来場しました。2日間では何人来場しましたか。",
    variables: {
      a: { min: 80000, max: 300000, step: 1000 },
      b: { min: 50000, max: 200000, step: 1000 }
    },
    generatorType: "standard",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "人"
  },
  {
    id: "g4t2_big_add_002",
    gradeTerm: "4-2",
    category: "大きな数",
    categoryId: "large-numbers",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "工場である製品を{a}個、次の月に{b}個作りました。合わせて何個作りましたか。",
    variables: {
      a: { min: 150000, max: 500000, step: 1000 },
      b: { min: 80000, max: 300000, step: 1000 }
    },
    generatorType: "standard",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "個"
  },
  {
    id: "g4t2_big_sub_001",
    gradeTerm: "4-2",
    category: "大きな数",
    categoryId: "large-numbers",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "ある町の人口は{a}人でした。{b}人が引っ越しました。残りは何人ですか。",
    variables: {
      a: { min: 400000, max: 900000, step: 1000 },
      b: { min: 20000, max: 150000, step: 1000 }
    },
    generatorType: "standard",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "人"
  },
  {
    id: "g4t2_big_sub_002",
    gradeTerm: "4-2",
    category: "大きな数",
    categoryId: "large-numbers",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "工場に部品が{a}個ありました。{b}個使いました。残りは何個ですか。",
    variables: {
      a: { min: 300000, max: 800000, step: 1000 },
      b: { min: 10000, max: 120000, step: 1000 }
    },
    generatorType: "standard",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "個"
  },
  {
    id: "g4t2_big_mul_001",
    gradeTerm: "4-2",
    category: "大きな数",
    categoryId: "large-numbers",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "1台のトラックで{a}kgの荷物を運べます。{b}台では何kgの荷物を運べますか。",
    variables: {
      a: { min: 1200, max: 8000, step: 100 },
      b: { min: 15, max: 60, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "kg"
  },
  {
    id: "g4t2_big_mul_002",
    gradeTerm: "4-2",
    category: "大きな数",
    categoryId: "large-numbers",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "1箱に{a}枚の紙が入っています。{b}箱では紙は何枚になりますか。",
    variables: {
      a: { min: 1000, max: 5000, step: 100 },
      b: { min: 20, max: 90, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [{ left: "a", operator: "×", right: "b", commutative: true }],
    answerUnit: "枚"
  },

  // ============================================================
  // 2けたでわるわり算（6種類） generatorType: "exactDivisionTwoDigit"
  // わる数（divisor）は必ず2けた（10〜99）。
  // dividend = divisor × quotient として生成するため、必ず割り切れます。
  // ============================================================
  {
    id: "g4t2_div2_001",
    gradeTerm: "4-2",
    category: "2けたでわるわり算",
    categoryId: "integer-division-two-digit",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}枚の紙を{divisor}人に同じ数ずつ配ります。1人分は何枚ですか。",
    variables: {
      divisor: { min: 10, max: 99, step: 1 },
      quotient: { min: 10, max: 60, step: 1 }
    },
    generatorType: "exactDivisionTwoDigit",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "枚"
  },
  {
    id: "g4t2_div2_002",
    gradeTerm: "4-2",
    category: "2けたでわるわり算",
    categoryId: "integer-division-two-digit",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}個のクッキーを{divisor}箱に同じ数ずつ入れます。1箱分は何個ですか。",
    variables: {
      divisor: { min: 10, max: 80, step: 1 },
      quotient: { min: 5, max: 50, step: 1 }
    },
    generatorType: "exactDivisionTwoDigit",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "個"
  },
  {
    id: "g4t2_div2_003",
    gradeTerm: "4-2",
    category: "2けたでわるわり算",
    categoryId: "integer-division-two-digit",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}円を{divisor}人で同じ金額ずつ分けます。1人分は何円ですか。",
    variables: {
      divisor: { min: 10, max: 60, step: 1 },
      quotient: { min: 10, max: 90, step: 10 }
    },
    generatorType: "exactDivisionTwoDigit",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "円"
  },
  {
    id: "g4t2_div2_004",
    gradeTerm: "4-2",
    category: "2けたでわるわり算",
    categoryId: "integer-division-two-digit",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}mのロープを{divisor}本に同じ長さで切り分けます。1本分は何mですか。",
    variables: {
      divisor: { min: 10, max: 50, step: 1 },
      quotient: { min: 2, max: 20, step: 1 }
    },
    generatorType: "exactDivisionTwoDigit",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g4t2_div2_005",
    gradeTerm: "4-2",
    category: "2けたでわるわり算",
    categoryId: "integer-division-two-digit",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}個のボールを{divisor}個のかごに同じ数ずつ入れます。1かご分は何個ですか。",
    variables: {
      divisor: { min: 12, max: 99, step: 1 },
      quotient: { min: 5, max: 40, step: 1 }
    },
    generatorType: "exactDivisionTwoDigit",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "個"
  },
  {
    id: "g4t2_div2_006",
    gradeTerm: "4-2",
    category: "2けたでわるわり算",
    categoryId: "integer-division-two-digit",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{dividend}人を{divisor}台のバスに同じ人数ずつ乗せます。1台分は何人ですか。",
    variables: {
      divisor: { min: 10, max: 40, step: 1 },
      quotient: { min: 5, max: 30, step: 1 }
    },
    generatorType: "exactDivisionTwoDigit",
    solutionRoutes: [{ left: "dividend", operator: "÷", right: "divisor", commutative: false }],
    answerUnit: "人"
  }
];
