// 小学5年生・3学期 問題テンプレートデータ（新内容）。
//
// このファイルはデータのみを定義します。ゲーム処理は含みません。
// ゲーム本体は data/index.js 経由でのみこのファイルを読み込みます。
//
// 小学5年生・3学期モードで出題する「新内容」は、次の8カテゴリ×5種類＝40テンプレートです。
//   - 速さ / 道のり / 時間 / 割合・比べる量 / 割合・百分率 / 割合・もとにする量 / 割引 / 増量
// （復習内容は data/index.js が別途、4年生1〜3学期・5年生1〜2学期のテンプレートから選びます。
//  出題比率・カテゴリバランスは js/question-generator.js の GRADE_TERM_PLAN_CONFIG["5-3"] が
//  自動的に処理するため、このファイルには新内容のテンプレートのみを定義します。）
//
// ---- 速さ・道のり・時間 ----
// quantityRelation: { type:"speed", distanceKey, timeKey, speedKey, unknown, distanceUnit, timeUnit, speedUnit }
// で「速さ×時間＝道のり」の関係を表します。今回使用する単位の組み合わせは
// km/時・m/分・m/秒の3種類だけに限定し、単位換算（時間⇔分、km⇔mなど）を含む問題は
// 追加していません（1つの問題内では、必ず対応する単位を使います）。
//
// ---- 割合（比べる量・百分率・もとにする量） ----
// quantityRelation: { type:"percentage", baseKey, comparedKey, rateKey, unknown } で
// 「もとにする量×割合＝比べる量」の関係を表します。割合は { type:"percent", value } の
// 百分率専用の値オブジェクトで管理し、"20%" のような文字列や 0.2 のような比率をそのまま
// カードの値として使うことはありません（js/percentage-utils.js 参照）。
// 「割合・百分率」（比べる量÷もとにする量＝割合）だけは、通常の数値÷数値の計算結果
// （例: 0.3）を百分率（30%）として表示させるため、solutionRoutes に resultType:"percent" を
// 指定しています。
//
// ---- 割引・増量 ----
// どちらも2段階問題（questionType:"multiStep"）で、2つの解法ルート
// （①支払う割合/増量後の割合を先に求める、②値引き額/増えた量を先に求める）を登録しています。
// 割引・増量の「100%」は、どの変数にも対応しない固定値のため、依頼文の元の書式
// （left/rightに値オブジェクトを直接書く形）を、既存の {source, key} という構造に合わせて
// {source:"literal", value:{type:"percent", value:100}} と読み替えています
// （詳しくは README を参照）。generatorType は "standard" のエイリアス（discountTwoStep /
// increaseTwoStep）で、originalPrice・discountRate（またはoriginalAmount・increaseRate）を
// 独立に生成するだけで、支払う割合・値引き額・増えた量・最終的な答えは、
// 2つのルートそれぞれが計算時に自動的に求めます。
//
// 割合の値は、原則として分母が2・4・5・10のいずれかになる「きりのよい」割合
// （10%・20%・25%・30%・40%・50%・60%・75%・80%）だけを使い、もとにする量の範囲を
// その最小公倍数（20）の倍数にすることで、比べる量が必ず整数になるようにしています。

export const grade5Term3Templates = [
  // ============================================================
  // 速さ（5種類） generatorType: "findSpeed"
  // ============================================================
  {
    id: "g5t3_speed_001",
    gradeTerm: "5-3",
    category: "速さ",
    categoryId: "speed-find-speed",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{distance}kmの道のりを{time}時間で進みました。速さは時速何kmですか。",
    variables: {
      speed: { min: 10, max: 60, step: 5 },
      time: { min: 1, max: 6, step: 1 }
    },
    generatorType: "findSpeed",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "speed",
      distanceUnit: "km",
      timeUnit: "時間",
      speedUnit: "km/時"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "time", commutative: false }],
    answerUnit: "km/時"
  },
  {
    id: "g5t3_speed_002",
    gradeTerm: "5-3",
    category: "速さ",
    categoryId: "speed-find-speed",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{distance}mの道のりを{time}分で走りました。速さは分速何mですか。",
    variables: {
      speed: { min: 100, max: 300, step: 10 },
      time: { min: 2, max: 8, step: 1 }
    },
    generatorType: "findSpeed",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "speed",
      distanceUnit: "m",
      timeUnit: "分",
      speedUnit: "m/分"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "time", commutative: false }],
    answerUnit: "m/分"
  },
  {
    id: "g5t3_speed_003",
    gradeTerm: "5-3",
    category: "速さ",
    categoryId: "speed-find-speed",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{distance}mの道のりを{time}秒で進みました。速さは秒速何mですか。",
    variables: {
      speed: { min: 3, max: 10, step: 1 },
      time: { min: 5, max: 20, step: 1 }
    },
    generatorType: "findSpeed",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "speed",
      distanceUnit: "m",
      timeUnit: "秒",
      speedUnit: "m/秒"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "time", commutative: false }],
    answerUnit: "m/秒"
  },
  {
    id: "g5t3_speed_004",
    gradeTerm: "5-3",
    category: "速さ",
    categoryId: "speed-find-speed",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "電車が{distance}kmの道のりを{time}時間で走りました。速さは時速何kmですか。",
    variables: {
      speed: { min: 40, max: 120, step: 10 },
      time: { min: 1, max: 5, step: 1 }
    },
    generatorType: "findSpeed",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "speed",
      distanceUnit: "km",
      timeUnit: "時間",
      speedUnit: "km/時"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "time", commutative: false }],
    answerUnit: "km/時"
  },
  {
    id: "g5t3_speed_005",
    gradeTerm: "5-3",
    category: "速さ",
    categoryId: "speed-find-speed",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "自転車で{distance}mの道のりを{time}分で走りました。速さは分速何mですか。",
    variables: {
      speed: { min: 150, max: 350, step: 25 },
      time: { min: 2, max: 6, step: 1 }
    },
    generatorType: "findSpeed",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "speed",
      distanceUnit: "m",
      timeUnit: "分",
      speedUnit: "m/分"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "time", commutative: false }],
    answerUnit: "m/分"
  },

  // ============================================================
  // 道のり（5種類） generatorType: "findDistance"
  // ============================================================
  {
    id: "g5t3_distance_001",
    gradeTerm: "5-3",
    category: "道のり",
    categoryId: "speed-find-distance",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "時速{speed}kmで{time}時間走りました。道のりは何kmですか。",
    variables: {
      speed: { min: 20, max: 80, step: 5 },
      time: { min: 1.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "findDistance",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "km",
      timeUnit: "時間",
      speedUnit: "km/時"
    },
    solutionRoutes: [{ left: "speed", operator: "×", right: "time", commutative: true }],
    answerUnit: "km"
  },
  {
    id: "g5t3_distance_002",
    gradeTerm: "5-3",
    category: "道のり",
    categoryId: "speed-find-distance",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "分速{speed}mで{time}分走りました。道のりは何mですか。",
    variables: {
      speed: { min: 80, max: 250, step: 10 },
      time: { min: 2, max: 9, step: 1 }
    },
    generatorType: "findDistance",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "m",
      timeUnit: "分",
      speedUnit: "m/分"
    },
    solutionRoutes: [{ left: "speed", operator: "×", right: "time", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g5t3_distance_003",
    gradeTerm: "5-3",
    category: "道のり",
    categoryId: "speed-find-distance",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "秒速{speed}mで{time}秒進みました。道のりは何mですか。",
    variables: {
      speed: { min: 3, max: 12, step: 1 },
      time: { min: 5, max: 15, step: 1 }
    },
    generatorType: "findDistance",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "m",
      timeUnit: "秒",
      speedUnit: "m/秒"
    },
    solutionRoutes: [{ left: "speed", operator: "×", right: "time", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g5t3_distance_004",
    gradeTerm: "5-3",
    category: "道のり",
    categoryId: "speed-find-distance",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "電車が時速{speed}kmで{time}時間走りました。道のりは何kmですか。",
    variables: {
      speed: { min: 50, max: 100, step: 10 },
      time: { min: 1, max: 5, step: 1 }
    },
    generatorType: "findDistance",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "km",
      timeUnit: "時間",
      speedUnit: "km/時"
    },
    solutionRoutes: [{ left: "speed", operator: "×", right: "time", commutative: true }],
    answerUnit: "km"
  },
  {
    id: "g5t3_distance_005",
    gradeTerm: "5-3",
    category: "道のり",
    categoryId: "speed-find-distance",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "時速{speed}kmで{time}時間歩きました。道のりは何kmですか。",
    variables: {
      speed: { min: 3, max: 6, step: 1 },
      time: { min: 0.5, max: 3.5, decimalPlaces: 1 }
    },
    generatorType: "findDistance",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "km",
      timeUnit: "時間",
      speedUnit: "km/時"
    },
    solutionRoutes: [{ left: "speed", operator: "×", right: "time", commutative: true }],
    answerUnit: "km"
  },

  // ============================================================
  // 時間（5種類） generatorType: "findTime"
  // ============================================================
  {
    id: "g5t3_time_001",
    gradeTerm: "5-3",
    category: "時間",
    categoryId: "speed-find-time",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{distance}kmの道のりを時速{speed}kmで進みました。何時間かかりましたか。",
    variables: {
      speed: { min: 20, max: 80, step: 5 },
      time: { min: 1, max: 8, step: 1 }
    },
    generatorType: "findTime",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "time",
      distanceUnit: "km",
      timeUnit: "時間",
      speedUnit: "km/時"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "speed", commutative: false }],
    answerUnit: "時間"
  },
  {
    id: "g5t3_time_002",
    gradeTerm: "5-3",
    category: "時間",
    categoryId: "speed-find-time",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{distance}mの道のりを分速{speed}mで走りました。何分かかりましたか。",
    variables: {
      speed: { min: 100, max: 300, step: 20 },
      time: { min: 2, max: 10, step: 1 }
    },
    generatorType: "findTime",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "time",
      distanceUnit: "m",
      timeUnit: "分",
      speedUnit: "m/分"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "speed", commutative: false }],
    answerUnit: "分"
  },
  {
    id: "g5t3_time_003",
    gradeTerm: "5-3",
    category: "時間",
    categoryId: "speed-find-time",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{distance}mの道のりを秒速{speed}mで走りました。何秒かかりましたか。",
    variables: {
      speed: { min: 4, max: 12, step: 1 },
      time: { min: 5, max: 20, step: 1 }
    },
    generatorType: "findTime",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "time",
      distanceUnit: "m",
      timeUnit: "秒",
      speedUnit: "m/秒"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "speed", commutative: false }],
    answerUnit: "秒"
  },
  {
    id: "g5t3_time_004",
    gradeTerm: "5-3",
    category: "時間",
    categoryId: "speed-find-time",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{distance}kmの道のりを時速{speed}kmで走りました。何時間かかりましたか。",
    variables: {
      speed: { min: 20, max: 60, step: 5 },
      time: { min: 1.5, max: 4.5, decimalPlaces: 1 }
    },
    generatorType: "findTime",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "time",
      distanceUnit: "km",
      timeUnit: "時間",
      speedUnit: "km/時"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "speed", commutative: false }],
    answerUnit: "時間"
  },
  {
    id: "g5t3_time_005",
    gradeTerm: "5-3",
    category: "時間",
    categoryId: "speed-find-time",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{distance}mの道のりを分速{speed}mで歩きました。何分かかりましたか。",
    variables: {
      speed: { min: 50, max: 150, step: 10 },
      time: { min: 2, max: 8, step: 1 }
    },
    generatorType: "findTime",
    quantityRelation: {
      type: "speed",
      distanceKey: "distance",
      timeKey: "time",
      speedKey: "speed",
      unknown: "time",
      distanceUnit: "m",
      timeUnit: "分",
      speedUnit: "m/分"
    },
    solutionRoutes: [{ left: "distance", operator: "÷", right: "speed", commutative: false }],
    answerUnit: "分"
  },

  // ============================================================
  // 割合・比べる量（5種類） generatorType: "percentageFindCompared"
  // ============================================================
  {
    id: "g5t3_compared_001",
    gradeTerm: "5-3",
    category: "割合・比べる量",
    categoryId: "percentage-compared-amount",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{base}人のうち{rate}が小学生です。小学生は何人ですか。",
    variables: {
      base: { min: 20, max: 200, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "percentageFindCompared",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "compared" },
    solutionRoutes: [{ left: "base", operator: "×", right: "rate", commutative: true }],
    answerUnit: "人"
  },
  {
    id: "g5t3_compared_002",
    gradeTerm: "5-3",
    category: "割合・比べる量",
    categoryId: "percentage-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{base}円の商品の{rate}が消費税です。消費税は何円ですか。",
    variables: {
      base: { min: 1000, max: 5000, step: 100 },
      rate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "percentageFindCompared",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "compared" },
    solutionRoutes: [{ left: "base", operator: "×", right: "rate", commutative: true }],
    answerUnit: "円"
  },
  {
    id: "g5t3_compared_003",
    gradeTerm: "5-3",
    category: "割合・比べる量",
    categoryId: "percentage-compared-amount",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{base}mのロープの{rate}を使いました。使った長さは何mですか。",
    variables: {
      base: { min: 40, max: 200, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "percentageFindCompared",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "compared" },
    solutionRoutes: [{ left: "base", operator: "×", right: "rate", commutative: true }],
    answerUnit: "m"
  },
  {
    id: "g5t3_compared_004",
    gradeTerm: "5-3",
    category: "割合・比べる量",
    categoryId: "percentage-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{base}gの砂糖の{rate}を使いました。使った砂糖は何gですか。",
    variables: {
      base: { min: 200, max: 1000, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 40, 50] }
    },
    generatorType: "percentageFindCompared",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "compared" },
    solutionRoutes: [{ left: "base", operator: "×", right: "rate", commutative: true }],
    answerUnit: "g"
  },
  {
    id: "g5t3_compared_005",
    gradeTerm: "5-3",
    category: "割合・比べる量",
    categoryId: "percentage-compared-amount",
    contentGroup: "new",
    difficulty: 2,
    questionType: "singleStep",
    template: "{base}Lの水そうの水の{rate}を使いました。使った水は何Lですか。",
    variables: {
      base: { min: 20, max: 100, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "percentageFindCompared",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "compared" },
    solutionRoutes: [{ left: "base", operator: "×", right: "rate", commutative: true }],
    answerUnit: "L"
  },

  // ============================================================
  // 割合・百分率（5種類） generatorType: "percentageFindRate"
  // ============================================================
  {
    id: "g5t3_rate_001",
    gradeTerm: "5-3",
    category: "割合・百分率",
    categoryId: "percentage-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{base}人のうち{compared}人が小学生です。小学生の割合は何%ですか。",
    variables: {
      base: { min: 20, max: 100, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 30, 40, 50, 60, 75, 80] }
    },
    generatorType: "percentageFindRate",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "rate" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "base", commutative: false, resultType: "percent" }],
    answerUnit: "%"
  },
  {
    id: "g5t3_rate_002",
    gradeTerm: "5-3",
    category: "割合・百分率",
    categoryId: "percentage-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{base}このクッキーのうち{compared}こがチョコ味です。チョコ味の割合は何%ですか。",
    variables: {
      base: { min: 20, max: 100, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 30, 40, 50, 60, 75, 80] }
    },
    generatorType: "percentageFindRate",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "rate" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "base", commutative: false, resultType: "percent" }],
    answerUnit: "%"
  },
  {
    id: "g5t3_rate_003",
    gradeTerm: "5-3",
    category: "割合・百分率",
    categoryId: "percentage-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{base}ページの本のうち{compared}ページを読みました。読んだ割合は何%ですか。",
    variables: {
      base: { min: 40, max: 200, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 30, 40, 50, 60, 75, 80] }
    },
    generatorType: "percentageFindRate",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "rate" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "base", commutative: false, resultType: "percent" }],
    answerUnit: "%"
  },
  {
    id: "g5t3_rate_004",
    gradeTerm: "5-3",
    category: "割合・百分率",
    categoryId: "percentage-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{base}この荷物のうち{compared}こが割れ物です。割れ物の割合は何%ですか。",
    variables: {
      base: { min: 20, max: 100, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "percentageFindRate",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "rate" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "base", commutative: false, resultType: "percent" }],
    answerUnit: "%"
  },
  {
    id: "g5t3_rate_005",
    gradeTerm: "5-3",
    category: "割合・百分率",
    categoryId: "percentage-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{base}人の参加者のうち{compared}人が女性です。女性の割合は何%ですか。",
    variables: {
      base: { min: 20, max: 100, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 30, 40, 50, 60, 75, 80] }
    },
    generatorType: "percentageFindRate",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "rate" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "base", commutative: false, resultType: "percent" }],
    answerUnit: "%"
  },

  // ============================================================
  // 割合・もとにする量（5種類） generatorType: "percentageFindBase"
  // ============================================================
  {
    id: "g5t3_base_001",
    gradeTerm: "5-3",
    category: "割合・もとにする量",
    categoryId: "percentage-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "全体の{rate}にあたる人数が{compared}人です。全体は何人ですか。",
    variables: {
      base: { min: 20, max: 200, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 30, 40, 50, 60, 75, 80] }
    },
    generatorType: "percentageFindBase",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "人"
  },
  {
    id: "g5t3_base_002",
    gradeTerm: "5-3",
    category: "割合・もとにする量",
    categoryId: "percentage-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "ある本の値段の{rate}が{compared}円です。本の値段は何円ですか。",
    variables: {
      base: { min: 1000, max: 5000, step: 100 },
      rate: { type: "percent", values: [10, 20, 25, 30, 40, 50, 60, 75, 80] }
    },
    generatorType: "percentageFindBase",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "円"
  },
  {
    id: "g5t3_base_003",
    gradeTerm: "5-3",
    category: "割合・もとにする量",
    categoryId: "percentage-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "ロープの長さの{rate}が{compared}mです。ロープの長さは何mですか。",
    variables: {
      base: { min: 40, max: 200, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "percentageFindBase",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "m"
  },
  {
    id: "g5t3_base_004",
    gradeTerm: "5-3",
    category: "割合・もとにする量",
    categoryId: "percentage-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "米の重さの{rate}が{compared}kgです。米の重さは何kgですか。",
    variables: {
      base: { min: 20, max: 100, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "percentageFindBase",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "kg"
  },
  {
    id: "g5t3_base_005",
    gradeTerm: "5-3",
    category: "割合・もとにする量",
    categoryId: "percentage-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "水そうの水の{rate}が{compared}Lです。水そうの水は何Lですか。",
    variables: {
      base: { min: 40, max: 200, step: 20 },
      rate: { type: "percent", values: [10, 20, 25, 30, 40, 50, 60, 75, 80] }
    },
    generatorType: "percentageFindBase",
    quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "base" },
    solutionRoutes: [{ left: "compared", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "L"
  },

  // ============================================================
  // 割引（5種類、2段階問題） generatorType: "discountTwoStep"
  // 解法A（支払う割合を先に求める）・解法B（値引き額を先に求める）の両方を正解とする。
  // ============================================================
  {
    id: "g5t3_discount_001",
    gradeTerm: "5-3",
    category: "割引",
    categoryId: "percentage-discount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalPrice}円の商品が{discountRate}引きで売られています。代金は何円ですか。",
    variables: {
      originalPrice: { min: 1000, max: 5000, step: 100 },
      // 50%は「50%引き」の支払う割合(100%-50%=50%)が割引率自身と同じ数字になってしまう
      // ため、値の一覧から除外している（運用開始後に修正）。
      discountRate: { type: "percent", values: [10, 20, 25, 30, 40] }
    },
    generatorType: "discountTwoStep",
    solutionRoutes: [
      {
        id: "remainingRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "-",
            right: { source: "variable", key: "discountRate" },
            resultKey: "paymentRate"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "result", key: "paymentRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "discountAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "variable", key: "discountRate" },
            resultKey: "discountAmount"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "-",
            right: { source: "result", key: "discountAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "円"
  },
  {
    id: "g5t3_discount_002",
    gradeTerm: "5-3",
    category: "割引",
    categoryId: "percentage-discount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalPrice}円のかばんが{discountRate}引きのセールになっています。代金は何円ですか。",
    variables: {
      originalPrice: { min: 1000, max: 5000, step: 100 },
      // 50%は「50%引き」の支払う割合(100%-50%=50%)が割引率自身と同じ数字になってしまう
      // ため、値の一覧から除外している（運用開始後に修正）。
      discountRate: { type: "percent", values: [10, 20, 25, 30, 40] }
    },
    generatorType: "discountTwoStep",
    solutionRoutes: [
      {
        id: "remainingRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "-",
            right: { source: "variable", key: "discountRate" },
            resultKey: "paymentRate"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "result", key: "paymentRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "discountAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "variable", key: "discountRate" },
            resultKey: "discountAmount"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "-",
            right: { source: "result", key: "discountAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "円"
  },
  {
    id: "g5t3_discount_003",
    gradeTerm: "5-3",
    category: "割引",
    categoryId: "percentage-discount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalPrice}円の本が{discountRate}引きで販売されています。代金は何円ですか。",
    variables: {
      originalPrice: { min: 1000, max: 4000, step: 100 },
      // 50%は「50%引き」の支払う割合(100%-50%=50%)が割引率自身と同じ数字になってしまう
      // ため、値の一覧から除外している（運用開始後に修正）。
      discountRate: { type: "percent", values: [10, 20, 25, 30, 40] }
    },
    generatorType: "discountTwoStep",
    solutionRoutes: [
      {
        id: "remainingRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "-",
            right: { source: "variable", key: "discountRate" },
            resultKey: "paymentRate"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "result", key: "paymentRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "discountAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "variable", key: "discountRate" },
            resultKey: "discountAmount"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "-",
            right: { source: "result", key: "discountAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "円"
  },
  {
    id: "g5t3_discount_004",
    gradeTerm: "5-3",
    category: "割引",
    categoryId: "percentage-discount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalPrice}円の洋服が{discountRate}引きになっています。代金は何円ですか。",
    variables: {
      originalPrice: { min: 2000, max: 6000, step: 200 },
      // 50%は「50%引き」の支払う割合(100%-50%=50%)が割引率自身と同じ数字になってしまう
      // ため、値の一覧から除外している（運用開始後に修正）。
      discountRate: { type: "percent", values: [10, 20, 25, 30, 40] }
    },
    generatorType: "discountTwoStep",
    solutionRoutes: [
      {
        id: "remainingRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "-",
            right: { source: "variable", key: "discountRate" },
            resultKey: "paymentRate"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "result", key: "paymentRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "discountAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "variable", key: "discountRate" },
            resultKey: "discountAmount"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "-",
            right: { source: "result", key: "discountAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "円"
  },
  {
    id: "g5t3_discount_005",
    gradeTerm: "5-3",
    category: "割引",
    categoryId: "percentage-discount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalPrice}円のおもちゃが{discountRate}引きで売られています。代金は何円ですか。",
    variables: {
      originalPrice: { min: 1000, max: 5000, step: 100 },
      // 50%は「50%引き」の支払う割合(100%-50%=50%)が割引率自身と同じ数字になってしまう
      // ため、値の一覧から除外している（運用開始後に修正）。
      discountRate: { type: "percent", values: [10, 20, 25, 30, 40] }
    },
    generatorType: "discountTwoStep",
    solutionRoutes: [
      {
        id: "remainingRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "-",
            right: { source: "variable", key: "discountRate" },
            resultKey: "paymentRate"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "result", key: "paymentRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "discountAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "×",
            right: { source: "variable", key: "discountRate" },
            resultKey: "discountAmount"
          },
          {
            left: { source: "variable", key: "originalPrice" },
            operator: "-",
            right: { source: "result", key: "discountAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "円"
  },

  // ============================================================
  // 増量（5種類、2段階問題） generatorType: "increaseTwoStep"
  // 解法A（増量後の割合を先に求める）・解法B（増えた量を先に求める）の両方を正解とする。
  // ============================================================
  {
    id: "g5t3_increase_001",
    gradeTerm: "5-3",
    category: "増量",
    categoryId: "percentage-increase",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalAmount}gの商品が{increaseRate}増量されています。増量後は何gですか。",
    variables: {
      originalAmount: { min: 200, max: 1000, step: 100 },
      increaseRate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "increaseTwoStep",
    solutionRoutes: [
      {
        id: "afterRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "+",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "afterRate"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "result", key: "afterRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "increaseAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "increaseAmount"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "+",
            right: { source: "result", key: "increaseAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "g"
  },
  {
    id: "g5t3_increase_002",
    gradeTerm: "5-3",
    category: "増量",
    categoryId: "percentage-increase",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalAmount}mLの飲み物が{increaseRate}増量されています。増量後は何mLですか。",
    variables: {
      originalAmount: { min: 200, max: 1000, step: 100 },
      increaseRate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "increaseTwoStep",
    solutionRoutes: [
      {
        id: "afterRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "+",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "afterRate"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "result", key: "afterRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "increaseAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "increaseAmount"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "+",
            right: { source: "result", key: "increaseAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "mL"
  },
  {
    id: "g5t3_increase_003",
    gradeTerm: "5-3",
    category: "増量",
    categoryId: "percentage-increase",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalAmount}gのお菓子が{increaseRate}増量されています。増量後は何gですか。",
    variables: {
      originalAmount: { min: 200, max: 800, step: 100 },
      increaseRate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "increaseTwoStep",
    solutionRoutes: [
      {
        id: "afterRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "+",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "afterRate"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "result", key: "afterRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "increaseAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "increaseAmount"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "+",
            right: { source: "result", key: "increaseAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "g"
  },
  {
    id: "g5t3_increase_004",
    gradeTerm: "5-3",
    category: "増量",
    categoryId: "percentage-increase",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalAmount}枚の紙が{increaseRate}増量されています。増量後は何枚ですか。",
    variables: {
      originalAmount: { min: 20, max: 100, step: 20 },
      increaseRate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "increaseTwoStep",
    solutionRoutes: [
      {
        id: "afterRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "+",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "afterRate"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "result", key: "afterRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "increaseAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "increaseAmount"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "+",
            right: { source: "result", key: "increaseAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "枚"
  },
  {
    id: "g5t3_increase_005",
    gradeTerm: "5-3",
    category: "増量",
    categoryId: "percentage-increase",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    template: "{originalAmount}mLの洗剤が{increaseRate}増量されています。増量後は何mLですか。",
    variables: {
      originalAmount: { min: 200, max: 1000, step: 100 },
      increaseRate: { type: "percent", values: [10, 20, 25, 50] }
    },
    generatorType: "increaseTwoStep",
    solutionRoutes: [
      {
        id: "afterRateRoute",
        steps: [
          {
            left: { source: "literal", value: { type: "percent", value: 100 } },
            operator: "+",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "afterRate"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "result", key: "afterRate" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "increaseAmountRoute",
        steps: [
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "×",
            right: { source: "variable", key: "increaseRate" },
            resultKey: "increaseAmount"
          },
          {
            left: { source: "variable", key: "originalAmount" },
            operator: "+",
            right: { source: "result", key: "increaseAmount" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "mL"
  }
];
