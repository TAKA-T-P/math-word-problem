// 整数のみを使った「2つの式で解く」文章題（2段階問題）のテンプレートデータ。
// 開発版モード（?debug=true でタイトル画面に表示される「2段階問題・整数（開発版）」）でのみ
// 出題されます。通常の小学4年生・1学期モードには影響しません。
//
// このファイルはデータのみを定義します。ゲーム処理は含みません。
// ゲーム本体は data/index.js 経由でのみこのファイルを読み込みます。
//
// ---- multiStep 用スキーマの補足（共通スキーマに加えて） ----
//   solutionRoutes[].id     : ルートの一意なID（テンプレート内で重複不可）
//   solutionRoutes[].steps  : 2要素固定の配列。各要素:
//     left / right : { source: "variable", key: "<variables のキー名 または generatorType が計算する値の名前>" }
//                    または { source: "result", key: "<同じルート内の、より前のステップの resultKey>" }
//     operator     : "+" "-" "×" "÷" のいずれか
//     resultKey    : このステップの結果に付ける名前（同じルート内で重複不可、次のステップから参照できる）
//
// generatorType の補足:
//   "standard"                 : 除算を含まない2段階問題。全変数を独立にランダム生成する
//                                 （値の範囲設計だけで、負の数にならないよう保証している）
//   "multiStepSumToDivisible"  : 「たし算 → わり算」用。variables に divisor・quotient・a を定義すると、
//                                 sum(=divisor×quotient) と b(=sum-a) が自動計算される
//   "multiStepDivideFirst"     : 「わり算 → 何か」用。variables に divisor・quotient を定義すると、
//                                 dividend(=divisor×quotient) が自動計算される。他の変数は独立に生成される

export const multiStepIntegerTemplates = [
  // ============================================================
  // かけ算 → たし算（3種類）
  // ============================================================
  {
    id: "multi_mul_add_001",
    gradeTerm: "4-multi-step",
    category: "2段階・かけ算とたし算",
    categoryId: "multi-step-integer",
    difficulty: 2,
    questionType: "multiStep",
    template: "1箱に{perBox}本ずつ鉛筆が入っています。{boxCount}箱と、ばらの鉛筆が{extra}本あります。全部で何本ですか。",
    variables: {
      perBox: { min: 12, max: 40, step: 1 },
      boxCount: { min: 2, max: 8, step: 1 },
      extra: { min: 5, max: 30, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "perBox" },
            operator: "×",
            right: { source: "variable", key: "boxCount" },
            resultKey: "total"
          },
          {
            left: { source: "result", key: "total" },
            operator: "+",
            right: { source: "variable", key: "extra" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "本"
  },
  {
    id: "multi_mul_add_002",
    gradeTerm: "4-multi-step",
    category: "2段階・かけ算とたし算",
    categoryId: "multi-step-integer",
    difficulty: 2,
    questionType: "multiStep",
    template: "1袋に{perBag}個ずつあめが入っています。{bagCount}袋と、ばらのあめが{extra}個あります。全部で何個ですか。",
    variables: {
      perBag: { min: 8, max: 20, step: 1 },
      bagCount: { min: 2, max: 9, step: 1 },
      extra: { min: 5, max: 25, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "perBag" },
            operator: "×",
            right: { source: "variable", key: "bagCount" },
            resultKey: "total"
          },
          {
            left: { source: "result", key: "total" },
            operator: "+",
            right: { source: "variable", key: "extra" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "個"
  },
  {
    id: "multi_mul_add_003",
    gradeTerm: "4-multi-step",
    category: "2段階・かけ算とたし算",
    categoryId: "multi-step-integer",
    difficulty: 2,
    questionType: "multiStep",
    template: "1列に{perRow}人ずつ並んでいます。{rowCount}列と、列に並んでいない人が{extra}人います。全部で何人ですか。",
    variables: {
      perRow: { min: 10, max: 25, step: 1 },
      rowCount: { min: 3, max: 9, step: 1 },
      extra: { min: 3, max: 15, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "perRow" },
            operator: "×",
            right: { source: "variable", key: "rowCount" },
            resultKey: "total"
          },
          {
            left: { source: "result", key: "total" },
            operator: "+",
            right: { source: "variable", key: "extra" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "人"
  },

  // ============================================================
  // かけ算 → ひき算（3種類）
  // used の最大値が「perX × count」の最小値を超えないよう範囲設計し、
  // 残りが必ず正の整数になるようにしています。
  // ============================================================
  {
    id: "multi_mul_sub_001",
    gradeTerm: "4-multi-step",
    category: "2段階・かけ算とひき算",
    categoryId: "multi-step-integer",
    difficulty: 2,
    questionType: "multiStep",
    template: "1箱に{perBox}個のお菓子が入っています。{boxCount}箱あり、そのうち{used}個食べました。残りは何個ですか。",
    variables: {
      perBox: { min: 12, max: 40, step: 1 },
      boxCount: { min: 2, max: 8, step: 1 },
      used: { min: 5, max: 20, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "perBox" },
            operator: "×",
            right: { source: "variable", key: "boxCount" },
            resultKey: "total"
          },
          {
            left: { source: "result", key: "total" },
            operator: "-",
            right: { source: "variable", key: "used" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "個"
  },
  {
    id: "multi_mul_sub_002",
    gradeTerm: "4-multi-step",
    category: "2段階・かけ算とひき算",
    categoryId: "multi-step-integer",
    difficulty: 2,
    questionType: "multiStep",
    template: "1袋に{perBag}枚ずつ折り紙が入っています。{bagCount}袋あり、そのうち{used}枚使いました。残りは何枚ですか。",
    variables: {
      perBag: { min: 15, max: 30, step: 1 },
      bagCount: { min: 2, max: 8, step: 1 },
      used: { min: 5, max: 25, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "perBag" },
            operator: "×",
            right: { source: "variable", key: "bagCount" },
            resultKey: "total"
          },
          {
            left: { source: "result", key: "total" },
            operator: "-",
            right: { source: "variable", key: "used" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "枚"
  },
  {
    id: "multi_mul_sub_003",
    gradeTerm: "4-multi-step",
    category: "2段階・かけ算とひき算",
    categoryId: "multi-step-integer",
    difficulty: 2,
    questionType: "multiStep",
    template: "1列に{perRow}本ずつ木を植えます。{rowCount}列植えたあと、そのうち{used}本を別の場所に植えかえました。残りは何本ですか。",
    variables: {
      perRow: { min: 10, max: 20, step: 1 },
      rowCount: { min: 3, max: 8, step: 1 },
      used: { min: 5, max: 25, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "perRow" },
            operator: "×",
            right: { source: "variable", key: "rowCount" },
            resultKey: "total"
          },
          {
            left: { source: "result", key: "total" },
            operator: "-",
            right: { source: "variable", key: "used" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "本"
  },

  // ============================================================
  // たし算 → わり算（3種類）
  // ============================================================
  {
    id: "multi_add_div_001",
    gradeTerm: "4-multi-step",
    category: "2段階・たし算とわり算",
    categoryId: "multi-step-integer",
    difficulty: 3,
    questionType: "multiStep",
    template: "赤いカードが{a}枚、青いカードが{b}枚あります。合わせたカードを{divisor}人で同じ数ずつ分けます。1人分は何枚ですか。",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 30, max: 60, step: 1 },
      a: { min: 15, max: 50, step: 1 }
    },
    generatorType: "multiStepSumToDivisible",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "a" },
            operator: "+",
            right: { source: "variable", key: "b" },
            resultKey: "sum"
          },
          {
            left: { source: "result", key: "sum" },
            operator: "÷",
            right: { source: "variable", key: "divisor" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "枚"
  },
  {
    id: "multi_add_div_002",
    gradeTerm: "4-multi-step",
    category: "2段階・たし算とわり算",
    categoryId: "multi-step-integer",
    difficulty: 3,
    questionType: "multiStep",
    template: "りんごが{a}個、みかんが{b}個あります。合わせた果物を{divisor}人で同じ数ずつ分けます。1人分は何個ですか。",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 30, max: 60, step: 1 },
      a: { min: 15, max: 50, step: 1 }
    },
    generatorType: "multiStepSumToDivisible",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "a" },
            operator: "+",
            right: { source: "variable", key: "b" },
            resultKey: "sum"
          },
          {
            left: { source: "result", key: "sum" },
            operator: "÷",
            right: { source: "variable", key: "divisor" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "個"
  },
  {
    id: "multi_add_div_003",
    gradeTerm: "4-multi-step",
    category: "2段階・たし算とわり算",
    categoryId: "multi-step-integer",
    difficulty: 3,
    questionType: "multiStep",
    template: "1組に{a}人、2組に{b}人います。合わせた人数を{divisor}人ずつのチームに分けます。チームはいくつできますか。",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 30, max: 60, step: 1 },
      a: { min: 15, max: 50, step: 1 }
    },
    generatorType: "multiStepSumToDivisible",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "a" },
            operator: "+",
            right: { source: "variable", key: "b" },
            resultKey: "sum"
          },
          {
            left: { source: "result", key: "sum" },
            operator: "÷",
            right: { source: "variable", key: "divisor" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "チーム"
  },

  // ============================================================
  // その他の整数2段階問題（3種類）
  // このうち2種類（multi_addsub_route_001, multi_addsub_route_002）は、
  // 「先に配ってから届く」「先に届いてから配る」のどちらの順で計算しても同じ答えになる、
  // 複数の正解ルートを持つ問題です。
  // ============================================================
  {
    id: "multi_addsub_route_001",
    gradeTerm: "4-multi-step",
    category: "2段階・たし算とひき算（複数解法）",
    categoryId: "multi-step-integer",
    difficulty: 3,
    questionType: "multiStep",
    template: "倉庫に鉛筆が{a}本ありました。{b}本配ったあと、新しく{c}本届きました。現在、鉛筆は何本ありますか。",
    variables: {
      a: { min: 80, max: 300, step: 1 },
      b: { min: 10, max: 70, step: 1 },
      c: { min: 10, max: 100, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "a" },
            operator: "-",
            right: { source: "variable", key: "b" },
            resultKey: "remaining"
          },
          {
            left: { source: "result", key: "remaining" },
            operator: "+",
            right: { source: "variable", key: "c" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "routeB",
        steps: [
          {
            left: { source: "variable", key: "a" },
            operator: "+",
            right: { source: "variable", key: "c" },
            resultKey: "beforeDistribution"
          },
          {
            left: { source: "result", key: "beforeDistribution" },
            operator: "-",
            right: { source: "variable", key: "b" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "本"
  },
  {
    id: "multi_addsub_route_002",
    gradeTerm: "4-multi-step",
    category: "2段階・たし算とひき算（複数解法）",
    categoryId: "multi-step-integer",
    difficulty: 3,
    questionType: "multiStep",
    template: "文房具店に消しゴムが{a}個ありました。{b}個売れたあと、新しく{c}個仕入れました。現在、消しゴムは何個ありますか。",
    variables: {
      a: { min: 80, max: 300, step: 1 },
      b: { min: 10, max: 70, step: 1 },
      c: { min: 10, max: 100, step: 1 }
    },
    generatorType: "standard",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "a" },
            operator: "-",
            right: { source: "variable", key: "b" },
            resultKey: "remaining"
          },
          {
            left: { source: "result", key: "remaining" },
            operator: "+",
            right: { source: "variable", key: "c" },
            resultKey: "answer"
          }
        ]
      },
      {
        id: "routeB",
        steps: [
          {
            left: { source: "variable", key: "a" },
            operator: "+",
            right: { source: "variable", key: "c" },
            resultKey: "beforeRestock"
          },
          {
            left: { source: "result", key: "beforeRestock" },
            operator: "-",
            right: { source: "variable", key: "b" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "個"
  },
  {
    id: "multi_div_add_001",
    gradeTerm: "4-multi-step",
    category: "2段階・わり算とたし算",
    categoryId: "multi-step-integer",
    difficulty: 3,
    questionType: "multiStep",
    template: "{dividend}個のクッキーを{divisor}人で同じ数ずつ配りました。そのあと1人{extra}個ずつ追加で配りました。1人分は全部で何個になりましたか。",
    variables: {
      divisor: { min: 2, max: 9, step: 1 },
      quotient: { min: 30, max: 80, step: 1 },
      extra: { min: 5, max: 25, step: 1 }
    },
    generatorType: "multiStepDivideFirst",
    solutionRoutes: [
      {
        id: "routeA",
        steps: [
          {
            left: { source: "variable", key: "dividend" },
            operator: "÷",
            right: { source: "variable", key: "divisor" },
            resultKey: "perPerson"
          },
          {
            left: { source: "result", key: "perPerson" },
            operator: "+",
            right: { source: "variable", key: "extra" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "個"
  }
];
