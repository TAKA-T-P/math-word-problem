// 小学4年生・1学期 問題テンプレートデータ
//
// このファイルはデータのみを定義します。ゲーム処理は js/question-generator.js が行います。
//
// variables に定義した変数は、テンプレート内の {変数名} と対応します。
// generatorType が省略された場合は、各変数を min〜max の範囲（step刻み）で
// 独立にランダム生成します（question-generator.js の generateStandardValues が処理）。
//
// generatorType: "exactDivision" の場合は、divisor（わる数・1けた）と
// quotient（商）を別々に決めてから dividend（わられる数）= divisor × quotient
// を自動計算します（question-generator.js の generateExactDivisionValues が処理）。
// これにより、わり算が必ず割り切れることを保証します。

export const grade4Term1Templates = [
  // ============================================================
  // 整数のたし算（6種類）
  // ============================================================
  {
    id: "g4t1_add_001",
    gradeTerm: "4-1",
    category: "整数のたし算",
    template: "図書室に本が{a}冊ありました。新しく{b}冊入りました。本は全部で何冊になりましたか。",
    variables: {
      a: { min: 500, max: 3000, step: 10 },
      b: { min: 50, max: 500, step: 10 }
    },
    solution: { left: "a", operator: "+", right: "b" },
    commutative: true,
    answerUnit: "冊"
  },
  {
    id: "g4t1_add_002",
    gradeTerm: "4-1",
    category: "整数のたし算",
    template: "赤い色紙が{a}枚、青い色紙が{b}枚あります。色紙は合わせて何枚ですか。",
    variables: {
      a: { min: 20, max: 300, step: 5 },
      b: { min: 20, max: 300, step: 5 }
    },
    solution: { left: "a", operator: "+", right: "b" },
    commutative: true,
    answerUnit: "枚"
  },
  {
    id: "g4t1_add_003",
    gradeTerm: "4-1",
    category: "整数のたし算",
    template: "遠足に4年生が{a}人、5年生が{b}人参加します。参加する人数は合わせて何人ですか。",
    variables: {
      a: { min: 50, max: 200, step: 1 },
      b: { min: 50, max: 200, step: 1 }
    },
    solution: { left: "a", operator: "+", right: "b" },
    commutative: true,
    answerUnit: "人"
  },
  {
    id: "g4t1_add_004",
    gradeTerm: "4-1",
    category: "整数のたし算",
    template: "先週までに{a}円貯金していました。今週、新しく{b}円貯金しました。貯金は全部で何円になりましたか。",
    variables: {
      a: { min: 500, max: 5000, step: 10 },
      b: { min: 100, max: 2000, step: 10 }
    },
    solution: { left: "a", operator: "+", right: "b" },
    commutative: true,
    answerUnit: "円"
  },
  {
    id: "g4t1_add_005",
    gradeTerm: "4-1",
    category: "整数のたし算",
    template: "動物園に、午前中は{a}人、午後は{b}人来ました。今日1日で来た人は合わせて何人ですか。",
    variables: {
      a: { min: 100, max: 800, step: 10 },
      b: { min: 100, max: 800, step: 10 }
    },
    solution: { left: "a", operator: "+", right: "b" },
    commutative: true,
    answerUnit: "人"
  },
  {
    id: "g4t1_add_006",
    gradeTerm: "4-1",
    category: "整数のたし算",
    template: "はるかさんはシールを{a}枚持っていました。お姉さんから{b}枚もらいました。シールは全部で何枚になりましたか。",
    variables: {
      a: { min: 30, max: 400, step: 1 },
      b: { min: 10, max: 200, step: 1 }
    },
    solution: { left: "a", operator: "+", right: "b" },
    commutative: true,
    answerUnit: "枚"
  },

  // ============================================================
  // 整数のひき算（6種類）
  // a の範囲の下限が b の範囲の上限より大きくなるように設定し、
  // 常に a > b（答えが正の整数）になるようにしています。
  // ============================================================
  {
    id: "g4t1_sub_001",
    gradeTerm: "4-1",
    category: "整数のひき算",
    template: "お店にりんごが{a}個ありました。そのうち{b}個売れました。残りは何個ですか。",
    variables: {
      a: { min: 600, max: 999, step: 1 },
      b: { min: 100, max: 500, step: 1 }
    },
    solution: { left: "a", operator: "-", right: "b" },
    commutative: false,
    answerUnit: "個"
  },
  {
    id: "g4t1_sub_002",
    gradeTerm: "4-1",
    category: "整数のひき算",
    template: "バスに{a}人乗っていました。バス停で{b}人降りました。残りは何人ですか。",
    variables: {
      a: { min: 60, max: 99, step: 1 },
      b: { min: 10, max: 50, step: 1 }
    },
    solution: { left: "a", operator: "-", right: "b" },
    commutative: false,
    answerUnit: "人"
  },
  {
    id: "g4t1_sub_003",
    gradeTerm: "4-1",
    category: "整数のひき算",
    template: "お小遣いを{a}円持っていました。おかしを買って{b}円使いました。残りは何円ですか。",
    variables: {
      a: { min: 1000, max: 3000, step: 10 },
      b: { min: 100, max: 900, step: 10 }
    },
    solution: { left: "a", operator: "-", right: "b" },
    commutative: false,
    answerUnit: "円"
  },
  {
    id: "g4t1_sub_004",
    gradeTerm: "4-1",
    category: "整数のひき算",
    template: "ノートは全部で{a}ページあります。すでに{b}ページ使いました。残りは何ページですか。",
    variables: {
      a: { min: 150, max: 300, step: 1 },
      b: { min: 10, max: 140, step: 1 }
    },
    solution: { left: "a", operator: "-", right: "b" },
    commutative: false,
    answerUnit: "ページ"
  },
  {
    id: "g4t1_sub_005",
    gradeTerm: "4-1",
    category: "整数のひき算",
    template: "色紙が{a}枚ありました。工作で{b}枚使いました。残りは何枚ですか。",
    variables: {
      a: { min: 300, max: 600, step: 5 },
      b: { min: 50, max: 250, step: 5 }
    },
    solution: { left: "a", operator: "-", right: "b" },
    commutative: false,
    answerUnit: "枚"
  },
  {
    id: "g4t1_sub_006",
    gradeTerm: "4-1",
    category: "整数のひき算",
    template: "マラソン大会で{a}m走る予定です。すでに{b}m走りました。残りは何mですか。",
    variables: {
      a: { min: 2000, max: 5000, step: 10 },
      b: { min: 200, max: 1800, step: 10 }
    },
    solution: { left: "a", operator: "-", right: "b" },
    commutative: false,
    answerUnit: "m"
  },

  // ============================================================
  // 整数のかけ算（6種類）
  // ============================================================
  {
    id: "g4t1_mul_001",
    gradeTerm: "4-1",
    category: "整数のかけ算",
    template: "1箱に{a}本ずつ鉛筆が入っています。{b}箱では、鉛筆は全部で何本ありますか。",
    variables: {
      a: { min: 12, max: 30, step: 1 },
      b: { min: 2, max: 9, step: 1 }
    },
    solution: { left: "a", operator: "×", right: "b" },
    commutative: true,
    answerUnit: "本"
  },
  {
    id: "g4t1_mul_002",
    gradeTerm: "4-1",
    category: "整数のかけ算",
    template: "1袋に{a}個ずつあめが入っています。{b}袋では、あめは全部で何個ありますか。",
    variables: {
      a: { min: 8, max: 20, step: 1 },
      b: { min: 2, max: 9, step: 1 }
    },
    solution: { left: "a", operator: "×", right: "b" },
    commutative: true,
    answerUnit: "個"
  },
  {
    id: "g4t1_mul_003",
    gradeTerm: "4-1",
    category: "整数のかけ算",
    template: "体育館にいすが1列に{a}脚ずつ並んでいます。{b}列では、いすは全部で何脚ありますか。",
    variables: {
      a: { min: 10, max: 25, step: 1 },
      b: { min: 3, max: 9, step: 1 }
    },
    solution: { left: "a", operator: "×", right: "b" },
    commutative: true,
    answerUnit: "脚"
  },
  {
    id: "g4t1_mul_004",
    gradeTerm: "4-1",
    category: "整数のかけ算",
    template: "折り紙が1束に{a}枚ずつ入っています。{b}束では、折り紙は全部で何枚ありますか。",
    variables: {
      a: { min: 15, max: 40, step: 1 },
      b: { min: 2, max: 8, step: 1 }
    },
    solution: { left: "a", operator: "×", right: "b" },
    commutative: true,
    answerUnit: "枚"
  },
  {
    id: "g4t1_mul_005",
    gradeTerm: "4-1",
    category: "整数のかけ算",
    template: "1箱に{a}本ずつジュースが入っています。{b}箱では、ジュースは全部で何本ありますか。",
    variables: {
      a: { min: 6, max: 24, step: 1 },
      b: { min: 2, max: 9, step: 1 }
    },
    solution: { left: "a", operator: "×", right: "b" },
    commutative: true,
    answerUnit: "本"
  },
  {
    id: "g4t1_mul_006",
    gradeTerm: "4-1",
    category: "整数のかけ算",
    template: "花だんに1列に{a}本ずつ苗を植えます。{b}列植えると、苗は全部で何本になりますか。",
    variables: {
      a: { min: 8, max: 20, step: 1 },
      b: { min: 3, max: 9, step: 1 }
    },
    solution: { left: "a", operator: "×", right: "b" },
    commutative: true,
    answerUnit: "本"
  },

  // ============================================================
  // 整数のわり算（6種類）
  // わる数（divisor）は必ず1けた（2〜9）。
  // dividend = divisor × quotient として生成するため、必ず割り切れます。
  // ============================================================
  {
    id: "g4t1_div_001",
    gradeTerm: "4-1",
    category: "整数のわり算",
    template: "{dividend}枚のカードを、{divisor}人に同じ数ずつ配ります。1人分は何枚ですか。",
    generatorType: "exactDivision",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 5, max: 40, step: 1 }
    },
    solution: { left: "dividend", operator: "÷", right: "divisor" },
    commutative: false,
    answerUnit: "枚"
  },
  {
    id: "g4t1_div_002",
    gradeTerm: "4-1",
    category: "整数のわり算",
    template: "{dividend}個のあめを、{divisor}人で同じ数ずつ分けます。1人分は何個ですか。",
    generatorType: "exactDivision",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 4, max: 30, step: 1 }
    },
    solution: { left: "dividend", operator: "÷", right: "divisor" },
    commutative: false,
    answerUnit: "個"
  },
  {
    id: "g4t1_div_003",
    gradeTerm: "4-1",
    category: "整数のわり算",
    template: "{dividend}人が、{divisor}台のバスに同じ人数ずつ分かれて乗ります。1台に何人乗りますか。",
    generatorType: "exactDivision",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 5, max: 20, step: 1 }
    },
    solution: { left: "dividend", operator: "÷", right: "divisor" },
    commutative: false,
    answerUnit: "人"
  },
  {
    id: "g4t1_div_004",
    gradeTerm: "4-1",
    category: "整数のわり算",
    template: "{dividend}枚の色紙を、{divisor}枚ずつの束にします。束は何束できますか。",
    generatorType: "exactDivision",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 5, max: 20, step: 1 }
    },
    solution: { left: "dividend", operator: "÷", right: "divisor" },
    commutative: false,
    answerUnit: "束"
  },
  {
    id: "g4t1_div_005",
    gradeTerm: "4-1",
    category: "整数のわり算",
    template: "{dividend}円を、{divisor}人で同じ金額ずつ分けます。1人分は何円ですか。",
    generatorType: "exactDivision",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 20, max: 300, step: 10 }
    },
    solution: { left: "dividend", operator: "÷", right: "divisor" },
    commutative: false,
    answerUnit: "円"
  },
  {
    id: "g4t1_div_006",
    gradeTerm: "4-1",
    category: "整数のわり算",
    template: "{dividend}本の鉛筆を、{divisor}本ずつ箱に入れます。箱はいくつできますか。",
    generatorType: "exactDivision",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 4, max: 20, step: 1 }
    },
    solution: { left: "dividend", operator: "÷", right: "divisor" },
    commutative: false,
    answerUnit: "箱"
  }
];
