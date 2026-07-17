// 小学5年生・2学期 問題テンプレートデータ（新内容）。
//
// このファイルはデータのみを定義します。ゲーム処理は含みません。
// ゲーム本体は data/index.js 経由でのみこのファイルを読み込みます。
//
// 小学5年生・2学期モードで出題する「新内容」は、次の5カテゴリ×6種類＝30テンプレートです。
//   - 異分母分数のたし算 / 異分母分数のひき算 / 平均 / 単位量あたり / 混み具合
// （復習内容は data/index.js が別途、4年生1〜3学期・5年生1学期のテンプレートから選びます。
//  出題比率・カテゴリバランスは js/question-generator.js の GRADE_TERM_PLAN_CONFIG["5-2"] が
//  自動的に処理するため、このファイルには新内容のテンプレートのみを定義します。）
//
// ---- 異分母分数のたし算・ひき算 ----
// js/fraction-utils.js の addFractions/subtractFractions は、最初からクロス乗算
// （a.numerator×b.denominator±b.numerator×a.denominator）で計算しており、分母が異なっていても
// 正しく計算できます。そのため、通分専用の特別な生成関数は不要で、a・bの分母をテンプレートごとに
// 異なる固定値として定義するだけで異分母分数の問題になります（通分の途中式を児童が入力する必要は
// ありません。■欄には自動計算された約分後の答えを表示します）。
// たし算は commutative:true、ひき算は commutative:false（順序を区別）です。
// ひき算は、a の取りうる最小値が b の取りうる最大値を常に上回るように範囲を設計し、
// 答えが負にならないようにしています（js/question-validator.js の
// validateNonNegativeUnlikeDenominatorSubtraction がクロス乗算で検証します）。
//
// ---- 平均 ----
// quantityRelation: { type:"average", totalKey, countKey, averageKey, unknown } で
// 「合計＝個数×平均」の関係を表します。unknown:"average"（合計・個数→平均を求める）と
// unknown:"total"（個数・平均→合計を求める）の2種類を用意しています。
// 「2つの数の平均」は、既存の2段階問題エンジン（generatorType: "averageOfTwoValues"、
// multiStepSumToDivisibleと同じ生成ロジック）を再利用し、divisorを常に2に固定しています。
//
// ---- 単位量あたり・混み具合 ----
// quantityRelation: { type:"unit-rate", totalKey, unitCountKey, perUnitKey, unknown } で
// 「全体量＝単位数×1単位あたりの量」の関係を表します。混み具合（crowdedness）は、
// 単位量あたり（unit-rate）と数量関係としては全く同じ構造のため、同じ generatorType
// （unitRate / totalFromUnitRate）を使い、categoryId・問題文のテーマだけで区別しています。
// 「AとBのどちらが混んでいるか」を文字で答える問題は、今回の解答形式（数式を作る形式）に
// 対応していないため、混み具合は必ず「1単位あたりの数値」または「全体量」を数値で求める
// 問題に限定しています。

export const grade5Term2Templates = [
  // ============================================================
  // 分数のたし算（異分母、6種類） generatorType: "unlikeDenominatorFractionAddition"
  // ============================================================
  {
    id: "g5t2_ufa_001",
    gradeTerm: "5-2",
    category: "分数のたし算",
    categoryId: "unlike-fraction-addition",
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
      a: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 3 },
      b: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 2 }
    },
    generatorType: "unlikeDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: ""
  },
  {
    id: "g5t2_ufa_002",
    gradeTerm: "5-2",
    category: "分数のたし算",
    categoryId: "unlike-fraction-addition",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "水そうに水が" },
      { type: "value", ref: "a" },
      { type: "text", value: "Lありました。そこへ" },
      { type: "value", ref: "b" },
      { type: "text", value: "Lの水を足しました。全部で何Lになりましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 4 },
      b: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "unlikeDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g5t2_ufa_003",
    gradeTerm: "5-2",
    category: "分数のたし算",
    categoryId: "unlike-fraction-addition",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "ある作業の、全体の" },
      { type: "value", ref: "a" },
      { type: "text", value: "を午前に終わらせ、続けて全体の" },
      { type: "value", ref: "b" },
      { type: "text", value: "を午後に終わらせました。全体の何分のいくつが終わりましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 5 },
      b: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "unlikeDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: ""
  },
  {
    id: "g5t2_ufa_004",
    gradeTerm: "5-2",
    category: "分数のたし算",
    categoryId: "unlike-fraction-addition",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "朝に" },
      { type: "value", ref: "a" },
      { type: "text", value: "km歩き、昼に" },
      { type: "value", ref: "b" },
      { type: "text", value: "km歩きました。合わせて何km歩きましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 9, numeratorMin: 1, numeratorMax: 5 },
      b: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "unlikeDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "km"
  },
  {
    id: "g5t2_ufa_005",
    gradeTerm: "5-2",
    category: "分数のたし算",
    categoryId: "unlike-fraction-addition",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "布が" },
      { type: "value", ref: "a" },
      { type: "text", value: "mありました。そこへ" },
      { type: "value", ref: "b" },
      { type: "text", value: "mの布を足しました。全部で何mになりましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 10, numeratorMin: 1, numeratorMax: 6 },
      b: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "unlikeDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g5t2_ufa_006",
    gradeTerm: "5-2",
    category: "分数のたし算",
    categoryId: "unlike-fraction-addition",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "米が" },
      { type: "value", ref: "a" },
      { type: "text", value: "kgありました。そこへ" },
      { type: "value", ref: "b" },
      { type: "text", value: "kgの米を足しました。全部で何kgになりましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 12, numeratorMin: 1, numeratorMax: 7 },
      b: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "unlikeDenominatorFractionAddition",
    solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
    answerUnit: "kg"
  },

  // ============================================================
  // 分数のひき算（異分母、6種類） generatorType: "unlikeDenominatorFractionSubtraction"
  // a の最小値が b の最大値を常に上回るように範囲を設計し、答えが負にならないようにしています。
  // ============================================================
  {
    id: "g5t2_ufs_001",
    gradeTerm: "5-2",
    category: "分数のひき算",
    categoryId: "unlike-fraction-subtraction",
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
      a: { type: "fraction", denominator: 6, numeratorMin: 4, numeratorMax: 5 },
      b: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 2 }
    },
    generatorType: "unlikeDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "L"
  },
  {
    id: "g5t2_ufs_002",
    gradeTerm: "5-2",
    category: "分数のひき算",
    categoryId: "unlike-fraction-subtraction",
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
      a: { type: "fraction", denominator: 8, numeratorMin: 6, numeratorMax: 7 },
      b: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "unlikeDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "kg"
  },
  {
    id: "g5t2_ufs_003",
    gradeTerm: "5-2",
    category: "分数のひき算",
    categoryId: "unlike-fraction-subtraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "布が" },
      { type: "value", ref: "a" },
      { type: "text", value: "mあり、そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "mを使いました。残りは何mですか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 9, numeratorMin: 6, numeratorMax: 8 },
      b: { type: "fraction", denominator: 12, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "unlikeDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g5t2_ufs_004",
    gradeTerm: "5-2",
    category: "分数のひき算",
    categoryId: "unlike-fraction-subtraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "遠足で" },
      { type: "value", ref: "a" },
      { type: "text", value: "km歩きました。そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "kmは下り坂でした。下り坂ではない道は何kmありましたか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 10, numeratorMin: 7, numeratorMax: 9 },
      b: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 2 }
    },
    generatorType: "unlikeDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "km"
  },
  {
    id: "g5t2_ufs_005",
    gradeTerm: "5-2",
    category: "分数のひき算",
    categoryId: "unlike-fraction-subtraction",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "ある作業のうち、全体の" },
      { type: "value", ref: "a" },
      { type: "text", value: "が終わっていましたが、そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "は昨日の分でした。今日終わらせたのは全体の何分のいくつですか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 5, numeratorMin: 3, numeratorMax: 4 },
      b: { type: "fraction", denominator: 10, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "unlikeDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: ""
  },
  {
    id: "g5t2_ufs_006",
    gradeTerm: "5-2",
    category: "分数のひき算",
    categoryId: "unlike-fraction-subtraction",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "画用紙が" },
      { type: "value", ref: "a" },
      { type: "text", value: "枚分あり、そのうち" },
      { type: "value", ref: "b" },
      { type: "text", value: "枚分を工作で使いました。残りは何枚分ですか。" }
    ],
    variables: {
      a: { type: "fraction", denominator: 12, numeratorMin: 9, numeratorMax: 11 },
      b: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "unlikeDenominatorFractionSubtraction",
    solutionRoutes: [{ left: "a", operator: "-", right: "b", commutative: false }],
    answerUnit: "枚分"
  },

  // ============================================================
  // 平均（6種類）
  // unknown:"average"（合計・個数→平均。generatorType: "averageFromTotal"）×2
  // unknown:"total"（個数・平均→合計。generatorType: "totalFromAverage"）×2
  // 2つの数の平均（2段階問題。generatorType: "averageOfTwoValues"）×2
  // ============================================================
  {
    id: "g5t2_avg_001",
    gradeTerm: "5-2",
    category: "平均",
    categoryId: "average",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{count}人の読んだ本の冊数の合計は{total}冊でした。1人あたりの平均は何冊ですか。",
    variables: {
      count: { min: 3, max: 9, step: 1 },
      average: { min: 2, max: 9, step: 1 }
    },
    generatorType: "averageFromTotal",
    quantityRelation: { type: "average", totalKey: "total", countKey: "count", averageKey: "average", unknown: "average" },
    solutionRoutes: [{ left: "total", operator: "÷", right: "count", commutative: false }],
    answerUnit: "冊"
  },
  {
    id: "g5t2_avg_002",
    gradeTerm: "5-2",
    category: "平均",
    categoryId: "average",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{count}人のテストの得点の合計は{total}点でした。1人あたりの平均点は何点ですか。",
    variables: {
      count: { min: 3, max: 8, step: 1 },
      average: { min: 60.5, max: 89.5, decimalPlaces: 1 }
    },
    generatorType: "averageFromTotal",
    quantityRelation: { type: "average", totalKey: "total", countKey: "count", averageKey: "average", unknown: "average" },
    solutionRoutes: [{ left: "total", operator: "÷", right: "count", commutative: false }],
    answerUnit: "点"
  },
  {
    id: "g5t2_avg_003",
    gradeTerm: "5-2",
    category: "平均",
    categoryId: "average",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{count}人が読んだ本の冊数の平均は{average}冊でした。{count}人が読んだ本は全部で何冊ですか。",
    variables: {
      count: { min: 3, max: 9, step: 1 },
      average: { min: 2, max: 9, step: 1 }
    },
    generatorType: "totalFromAverage",
    quantityRelation: { type: "average", totalKey: "total", countKey: "count", averageKey: "average", unknown: "total" },
    solutionRoutes: [{ left: "average", operator: "×", right: "count", commutative: true }],
    answerUnit: "冊"
  },
  {
    id: "g5t2_avg_004",
    gradeTerm: "5-2",
    category: "平均",
    categoryId: "average",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{count}日間の読書時間の平均は{average}分でした。{count}日間の読書時間は合計何分ですか。",
    variables: {
      count: { min: 2, max: 7, step: 1 },
      average: { min: 15.5, max: 45.5, decimalPlaces: 1 }
    },
    generatorType: "totalFromAverage",
    quantityRelation: { type: "average", totalKey: "total", countKey: "count", averageKey: "average", unknown: "total" },
    solutionRoutes: [{ left: "average", operator: "×", right: "count", commutative: true }],
    answerUnit: "分"
  },
  {
    id: "g5t2_avg_005",
    gradeTerm: "5-2",
    category: "平均",
    categoryId: "average",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "ある2日間の読書時間は{a}分と{b}分でした。1日あたりの平均は何分ですか。",
    variables: {
      divisor: { min: 2, max: 2, step: 1 },
      quotient: { min: 20, max: 80, step: 1 },
      a: { min: 10, max: 35, step: 1 }
    },
    generatorType: "averageOfTwoValues",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          { left: { source: "variable", key: "a" }, operator: "+", right: { source: "variable", key: "b" }, resultKey: "sum" },
          { left: { source: "result", key: "sum" }, operator: "÷", right: { source: "variable", key: "divisor" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "分"
  },
  {
    id: "g5t2_avg_006",
    gradeTerm: "5-2",
    category: "平均",
    categoryId: "average",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "ある2週間で読んだページ数は{a}ページと{b}ページでした。1週間あたりの平均は何ページですか。",
    variables: {
      divisor: { min: 2, max: 2, step: 1 },
      quotient: { min: 20, max: 70, step: 1 },
      a: { min: 5, max: 35, step: 1 }
    },
    generatorType: "averageOfTwoValues",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          { left: { source: "variable", key: "a" }, operator: "+", right: { source: "variable", key: "b" }, resultKey: "sum" },
          { left: { source: "result", key: "sum" }, operator: "÷", right: { source: "variable", key: "divisor" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "ページ"
  },

  // ============================================================
  // 単位量あたり（6種類）
  // unknown:"perUnit"（全体量・単位数→1単位あたり。generatorType: "unitRate"）×3
  // unknown:"total"（単位数・1単位あたり→全体量。generatorType: "totalFromUnitRate"）×3
  // ============================================================
  {
    id: "g5t2_ur_001",
    gradeTerm: "5-2",
    category: "単位量あたり",
    categoryId: "unit-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{unitCount}㎡の花だんに{total}本の花が植えられています。1㎡あたり何本植えられていますか。",
    variables: {
      unitCount: { min: 1.5, max: 4.5, decimalPlaces: 1 },
      perUnit: { min: 2.4, max: 9.6, decimalPlaces: 1 }
    },
    generatorType: "unitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "perUnit" },
    solutionRoutes: [{ left: "total", operator: "÷", right: "unitCount", commutative: false }],
    answerUnit: "本/㎡"
  },
  {
    id: "g5t2_ur_002",
    gradeTerm: "5-2",
    category: "単位量あたり",
    categoryId: "unit-rate",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{unitCount}mのリボンの代金は{total}円です。1mあたりの代金は何円ですか。",
    variables: {
      unitCount: { min: 2, max: 8, step: 1 },
      perUnit: { min: 80, max: 250, step: 10 }
    },
    generatorType: "unitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "perUnit" },
    solutionRoutes: [{ left: "total", operator: "÷", right: "unitCount", commutative: false }],
    answerUnit: "円/m"
  },
  {
    id: "g5t2_ur_003",
    gradeTerm: "5-2",
    category: "単位量あたり",
    categoryId: "unit-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "かべ{unitCount}m²をぬるのに、ペンキを{total}L使いました。1m²あたり何Lのペンキを使いましたか。",
    variables: {
      unitCount: { min: 2.5, max: 8.5, decimalPlaces: 1 },
      perUnit: { min: 0.2, max: 0.9, decimalPlaces: 1 }
    },
    generatorType: "unitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "perUnit" },
    solutionRoutes: [{ left: "total", operator: "÷", right: "unitCount", commutative: false }],
    answerUnit: "L/m²"
  },
  {
    id: "g5t2_ur_004",
    gradeTerm: "5-2",
    category: "単位量あたり",
    categoryId: "unit-rate",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1mあたり{perUnit}円のリボンを{unitCount}m買います。代金は何円ですか。",
    variables: {
      perUnit: { min: 80, max: 250, step: 10 },
      unitCount: { min: 2, max: 8, step: 1 }
    },
    generatorType: "totalFromUnitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "total" },
    solutionRoutes: [{ left: "perUnit", operator: "×", right: "unitCount", commutative: true }],
    answerUnit: "円"
  },
  {
    id: "g5t2_ur_005",
    gradeTerm: "5-2",
    category: "単位量あたり",
    categoryId: "unit-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "1時間あたり{perUnit}Lの水をくみ上げるポンプが{unitCount}時間動きました。くみ上げた水は何Lですか。",
    variables: {
      perUnit: { min: 12.5, max: 38.5, decimalPlaces: 1 },
      unitCount: { min: 1.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "totalFromUnitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "total" },
    solutionRoutes: [{ left: "perUnit", operator: "×", right: "unitCount", commutative: true }],
    answerUnit: "L"
  },
  {
    id: "g5t2_ur_006",
    gradeTerm: "5-2",
    category: "単位量あたり",
    categoryId: "unit-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "1m²あたりの重さが{perUnit}gの布が{unitCount}m²あります。この布の重さは何gですか。",
    variables: {
      perUnit: { min: 120, max: 480, step: 10 },
      unitCount: { min: 1.5, max: 6.5, decimalPlaces: 1 }
    },
    generatorType: "totalFromUnitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "total" },
    solutionRoutes: [{ left: "perUnit", operator: "×", right: "unitCount", commutative: true }],
    answerUnit: "g"
  },

  // ============================================================
  // 混み具合（6種類） 単位量あたりと数量関係は同じ（generatorType: "unitRate" / "totalFromUnitRate"）
  // カテゴリID・問題文のテーマだけを区別しています。
  // 「AとBのどちらが混んでいるか」を文字で答える問題は出題しません（数値を求める問題のみ）。
  // ============================================================
  {
    id: "g5t2_crowd_001",
    gradeTerm: "5-2",
    category: "混み具合",
    categoryId: "crowdedness",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{unitCount}㎡の部屋に{total}人います。1㎡あたりの人数は何人ですか。",
    variables: {
      unitCount: { min: 15, max: 45, step: 5 },
      perUnit: { min: 0.3, max: 0.9, decimalPlaces: 1 }
    },
    generatorType: "unitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "perUnit" },
    solutionRoutes: [{ left: "total", operator: "÷", right: "unitCount", commutative: false }],
    answerUnit: "人/㎡"
  },
  {
    id: "g5t2_crowd_002",
    gradeTerm: "5-2",
    category: "混み具合",
    categoryId: "crowdedness",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{unitCount}m²の会場に{total}人が集まりました。1m²あたり何人になりますか。",
    variables: {
      unitCount: { min: 20, max: 80, step: 10 },
      perUnit: { min: 0.4, max: 1.8, decimalPlaces: 1 }
    },
    generatorType: "unitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "perUnit" },
    solutionRoutes: [{ left: "total", operator: "÷", right: "unitCount", commutative: false }],
    answerUnit: "人/m²"
  },
  {
    id: "g5t2_crowd_003",
    gradeTerm: "5-2",
    category: "混み具合",
    categoryId: "crowdedness",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{unitCount}haの牧場に{total}頭の牛がいます。1haあたり何頭の牛がいますか。",
    variables: {
      unitCount: { min: 2, max: 8, step: 1 },
      perUnit: { min: 1.5, max: 5.5, decimalPlaces: 1 }
    },
    generatorType: "unitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "perUnit" },
    solutionRoutes: [{ left: "total", operator: "÷", right: "unitCount", commutative: false }],
    answerUnit: "頭/ha"
  },
  {
    id: "g5t2_crowd_004",
    gradeTerm: "5-2",
    category: "混み具合",
    categoryId: "crowdedness",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1㎡あたり{perUnit}人いる会場の広さは{unitCount}㎡です。会場には何人いますか。",
    variables: {
      perUnit: { min: 0.3, max: 0.9, decimalPlaces: 1 },
      unitCount: { min: 20, max: 80, step: 10 }
    },
    generatorType: "totalFromUnitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "total" },
    solutionRoutes: [{ left: "perUnit", operator: "×", right: "unitCount", commutative: true }],
    answerUnit: "人"
  },
  {
    id: "g5t2_crowd_005",
    gradeTerm: "5-2",
    category: "混み具合",
    categoryId: "crowdedness",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "1㎡あたり{perUnit}人がいる部屋の広さは{unitCount}㎡です。この部屋には何人いますか。",
    variables: {
      perUnit: { min: 0.4, max: 1.6, decimalPlaces: 1 },
      unitCount: { min: 15, max: 45, step: 5 }
    },
    generatorType: "totalFromUnitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "total" },
    solutionRoutes: [{ left: "perUnit", operator: "×", right: "unitCount", commutative: true }],
    answerUnit: "人"
  },
  {
    id: "g5t2_crowd_006",
    gradeTerm: "5-2",
    category: "混み具合",
    categoryId: "crowdedness",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "1haあたり{perUnit}頭の牛がいる牧場の広さは{unitCount}haです。牧場には何頭の牛がいますか。",
    variables: {
      perUnit: { min: 1.5, max: 5.5, decimalPlaces: 1 },
      unitCount: { min: 2, max: 8, step: 1 }
    },
    generatorType: "totalFromUnitRate",
    quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "total" },
    solutionRoutes: [{ left: "perUnit", operator: "×", right: "unitCount", commutative: true }],
    answerUnit: "頭"
  }
];
