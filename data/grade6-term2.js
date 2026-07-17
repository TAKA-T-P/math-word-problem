// 小学6年生・2学期 問題テンプレートデータ（新内容）。
//
// このファイルはデータのみを定義します。ゲーム処理は含みません。
// ゲーム本体は data/index.js 経由でのみこのファイルを読み込みます。
//
// 小学6年生・2学期モードで出題する「新内容」は、次の8カテゴリ×5種類＝40テンプレートです。
//   - 分数の速さ / 分数の道のり / 分数の時間 /
//     分数割合・比べる量 / 分数割合・割合 / 分数割合・もとにする量 /
//     比を使った数量 / 比例配分
// （復習内容は data/index.js が別途、4年生1〜3学期・5年生1〜3学期・6年生1学期の
//  テンプレートから選びます。出題比率・カテゴリバランスは js/question-generator.js の
//  GRADE_TERM_PLAN_CONFIG["6-2"] が自動的に処理するため、このファイルには新内容の
//  テンプレートのみを定義します。）
//
// ---- 分数の速さ・道のり・時間（すべて2段階問題）----
// 既存の小学5年生3学期の速さ（単位換算なし、km/時・m/分・m/秒のみ）とは区別し、
// 必ず「時間（分）↔時間（時間）」の単位変換を伴う問題にします。1時間＝60分の関係を
// {source:"literal", value:60} という固定値としてステップに埋め込み、原則として
// 2つの解法ルート（先に時間を時間単位に変換する方法／先に分速を求める方法）を登録します。
// 60分の割り算は、割り切れるかどうかに関わらず必ず分数として表示したいため、
// 該当ステップに resultType:"fraction" を指定します（value-utils.js の
// divideValuesAsFraction() が実際の計算を担当。詳しくは js/question-generator.js の
// computeStepResult() を参照）。
// quantityRelation.type は "speed-with-unit-conversion" です。distance/minutes/speed の
// うち、どの2つが variables に定義されるか（＝問題文に出てくるか）はカテゴリごとに異なります。
//
// ---- 分数割合・比べる量、分数割合・割合、分数割合・もとにする量（すべて1段階問題）----
// quantityRelation: { type:"fraction-rate", baseKey, comparedKey, rateKey, unknown } で
// 「もとにする量×分数割合＝比べる量」の関係を表します。小学5年生3学期の割合（百分率）と
// 数量関係としては同じ構造ですが、割合を百分率ではなく分数として扱う点が異なります。
// 「割合を求める」問題（unknown:"rate"）は、答えが百分率ではなく分数になるよう
// resultType:"fraction" を指定しています。
//
// ---- 比を使った数量（2段階問題）、比例配分（3段階問題）----
// 比は { type:"ratio", antecedent, consequent } の値オブジェクトとして、問題文の表示
// （textParts の ref:"ratioValue"）にだけ使用します。実際の式・カードでは、比の前項・後項を
// 普通の整数（firstRatio・secondRatio）として扱います（解答欄で「数値：数値」を作らせる
// 処理は今回追加していません）。
// quantityRelation.type は、比を使った数量が "ratio-application"、比例配分が
// "proportional-allocation" です。どちらも、内部でだけ使う「1あたりの量」
// （variables.unitAmount。問題文にもカードにも出てこない生成専用の変数）を使って、
// 既知の数量・全体量が必ず割り切れる形で生成します。

export const grade6Term2Templates = [
  // ============================================================
  // 分数の速さ（5種類、unknown:"speed"） generatorType: "fractionSpeedWithMinuteConversion"
  // ============================================================
  {
    id: "g6t2_speed_find_speed_001",
    gradeTerm: "6-2",
    category: "分数の速さ",
    categoryId: "fraction-speed-find-speed",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "{distance}km走るのに{minutes}分かかる自転車の時速は何kmですか。",
    variables: {
      distance: { min: 2, max: 15, step: 1 },
      minutes: { min: 10, max: 50, step: 5 }
    },
    generatorType: "fractionSpeedWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speedPerHour",
      unknown: "speed",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "minutes" },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "km/時"
  },
  {
    id: "g6t2_speed_find_speed_002",
    gradeTerm: "6-2",
    category: "分数の速さ",
    categoryId: "fraction-speed-find-speed",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "{distance}km進むのに{minutes}分かかる電車の時速は何kmですか。",
    variables: {
      distance: { min: 10, max: 60, step: 2 },
      minutes: { min: 10, max: 50, step: 10 }
    },
    generatorType: "fractionSpeedWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speedPerHour",
      unknown: "speed",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "minutes" },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "km/時"
  },
  {
    id: "g6t2_speed_find_speed_003",
    gradeTerm: "6-2",
    category: "分数の速さ",
    categoryId: "fraction-speed-find-speed",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "{distance}km歩くのに{minutes}分かかる人の時速は何kmですか。",
    variables: {
      distance: { min: 1, max: 6, step: 1 },
      minutes: { min: 15, max: 45, step: 15 }
    },
    generatorType: "fractionSpeedWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speedPerHour",
      unknown: "speed",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "minutes" },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "km/時"
  },
  {
    id: "g6t2_speed_find_speed_004",
    gradeTerm: "6-2",
    category: "分数の速さ",
    categoryId: "fraction-speed-find-speed",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "{distance}km走るのに{minutes}分かかるランナーの時速は何kmですか。",
    variables: {
      distance: { min: 3, max: 12, step: 1 },
      minutes: { min: 10, max: 40, step: 10 }
    },
    generatorType: "fractionSpeedWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speedPerHour",
      unknown: "speed",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "minutes" },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "km/時"
  },
  {
    id: "g6t2_speed_find_speed_005",
    gradeTerm: "6-2",
    category: "分数の速さ",
    categoryId: "fraction-speed-find-speed",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "{distance}km進むのに{minutes}分かかるバスの時速は何kmですか。",
    variables: {
      distance: { min: 5, max: 40, step: 5 },
      minutes: { min: 12, max: 48, step: 12 }
    },
    generatorType: "fractionSpeedWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speedPerHour",
      unknown: "speed",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "minutes" },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "km/時"
  },

  // ============================================================
  // 分数の道のり（5種類、unknown:"distance"） generatorType: "fractionDistanceWithMinuteConversion"
  // ============================================================
  {
    id: "g6t2_speed_find_distance_001",
    gradeTerm: "6-2",
    category: "分数の道のり",
    categoryId: "fraction-speed-find-distance",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "時速{speed}kmで走る電車が、{minutes}分間に進む道のりは何kmですか。",
    variables: {
      speed: { min: 30, max: 90, step: 6 },
      minutes: { min: 10, max: 50, step: 10 }
    },
    generatorType: "fractionDistanceWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "speed" },
            operator: "×",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "variable", key: "minutes" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      }
    ],
    answerUnit: "km"
  },
  {
    id: "g6t2_speed_find_distance_002",
    gradeTerm: "6-2",
    category: "分数の道のり",
    categoryId: "fraction-speed-find-distance",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "時速{speed}kmで走る自動車が、{minutes}分間に進む道のりは何kmですか。",
    variables: {
      speed: { min: 24, max: 72, step: 4 },
      minutes: { min: 15, max: 45, step: 15 }
    },
    generatorType: "fractionDistanceWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "speed" },
            operator: "×",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "variable", key: "minutes" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      }
    ],
    answerUnit: "km"
  },
  {
    id: "g6t2_speed_find_distance_003",
    gradeTerm: "6-2",
    category: "分数の道のり",
    categoryId: "fraction-speed-find-distance",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "時速{speed}kmで走る自転車が、{minutes}分間に進む道のりは何kmですか。",
    variables: {
      speed: { min: 6, max: 18, step: 2 },
      minutes: { min: 10, max: 50, step: 5 }
    },
    generatorType: "fractionDistanceWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "speed" },
            operator: "×",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "variable", key: "minutes" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      }
    ],
    answerUnit: "km"
  },
  {
    id: "g6t2_speed_find_distance_004",
    gradeTerm: "6-2",
    category: "分数の道のり",
    categoryId: "fraction-speed-find-distance",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "時速{speed}kmで歩く人が、{minutes}分間に進む道のりは何kmですか。",
    variables: {
      speed: { min: 3, max: 9, step: 1 },
      minutes: { min: 12, max: 48, step: 12 }
    },
    generatorType: "fractionDistanceWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "speed" },
            operator: "×",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "variable", key: "minutes" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      }
    ],
    answerUnit: "km"
  },
  {
    id: "g6t2_speed_find_distance_005",
    gradeTerm: "6-2",
    category: "分数の道のり",
    categoryId: "fraction-speed-find-distance",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "時速{speed}kmで走るバスが、{minutes}分間に進む道のりは何kmですか。",
    variables: {
      speed: { min: 20, max: 60, step: 5 },
      minutes: { min: 15, max: 45, step: 15 }
    },
    generatorType: "fractionDistanceWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "distance",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "convert-time-route",
        steps: [
          {
            left: { source: "variable", key: "minutes" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "variable", key: "speed" },
            operator: "×",
            right: { source: "result", key: "hours" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "result", key: "speedPerMinute" },
            operator: "×",
            right: { source: "variable", key: "minutes" },
            resultType: "numberOrFraction",
            resultKey: "answer",
            commutative: true
          }
        ]
      }
    ],
    answerUnit: "km"
  },

  // ============================================================
  // 分数の時間（5種類、unknown:"minuteTime"） generatorType: "fractionTimeWithMinuteConversion"
  // 速さ（speed）が分数のため textParts を使用する。
  // ============================================================
  {
    id: "g6t2_speed_find_time_001",
    gradeTerm: "6-2",
    category: "分数の時間",
    categoryId: "fraction-speed-find-time",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "時速" },
      { type: "value", ref: "speed" },
      { type: "text", value: "kmで歩く人が、" },
      { type: "value", ref: "distance" },
      { type: "text", value: "kmの道のりを進むのにかかる時間は何分ですか。" }
    ],
    variables: {
      distance: { min: 1, max: 8, step: 1 },
      // 答え（分）が必ず整数になるよう、先にこの一覧から答えを選び、速さはそこから逆算する
      // （generateFractionTimeWithMinuteConversionValues() 参照。第11段階で追加）。
      answerMinutes: { values: [15, 20, 24, 30, 36, 40, 45, 48, 60, 72, 75, 90] }
    },
    generatorType: "fractionTimeWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "minuteTime",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "hours-first-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "speed" },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "result", key: "hours" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "speedPerMinute" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "分"
  },
  {
    id: "g6t2_speed_find_time_002",
    gradeTerm: "6-2",
    category: "分数の時間",
    categoryId: "fraction-speed-find-time",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "時速" },
      { type: "value", ref: "speed" },
      { type: "text", value: "kmで走る自転車が、" },
      { type: "value", ref: "distance" },
      { type: "text", value: "kmの道のりを進むのにかかる時間は何分ですか。" }
    ],
    variables: {
      distance: { min: 2, max: 10, step: 1 },
      answerMinutes: { values: [10, 12, 15, 20, 24, 30, 36, 40, 45, 48, 60] }
    },
    generatorType: "fractionTimeWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "minuteTime",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "hours-first-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "speed" },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "result", key: "hours" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "speedPerMinute" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "分"
  },
  {
    id: "g6t2_speed_find_time_003",
    gradeTerm: "6-2",
    category: "分数の時間",
    categoryId: "fraction-speed-find-time",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "時速" },
      { type: "value", ref: "speed" },
      { type: "text", value: "kmで走るランナーが、" },
      { type: "value", ref: "distance" },
      { type: "text", value: "kmの道のりを進むのにかかる時間は何分ですか。" }
    ],
    variables: {
      distance: { min: 2, max: 9, step: 1 },
      answerMinutes: { values: [12, 15, 20, 24, 30, 36, 40, 45, 48, 60] }
    },
    generatorType: "fractionTimeWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "minuteTime",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "hours-first-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "speed" },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "result", key: "hours" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "speedPerMinute" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "分"
  },
  {
    id: "g6t2_speed_find_time_004",
    gradeTerm: "6-2",
    category: "分数の時間",
    categoryId: "fraction-speed-find-time",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "時速" },
      { type: "value", ref: "speed" },
      { type: "text", value: "kmで走る自動車が、" },
      { type: "value", ref: "distance" },
      { type: "text", value: "kmの道のりを進むのにかかる時間は何分ですか。" }
    ],
    variables: {
      distance: { min: 4, max: 20, step: 2 },
      answerMinutes: { values: [10, 12, 15, 20, 24, 30, 36, 40, 45, 48] }
    },
    generatorType: "fractionTimeWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "minuteTime",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "hours-first-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "speed" },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "result", key: "hours" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "speedPerMinute" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "分"
  },
  {
    id: "g6t2_speed_find_time_005",
    gradeTerm: "6-2",
    category: "分数の時間",
    categoryId: "fraction-speed-find-time",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "時速" },
      { type: "value", ref: "speed" },
      { type: "text", value: "kmで走るバスが、" },
      { type: "value", ref: "distance" },
      { type: "text", value: "kmの道のりを進むのにかかる時間は何分ですか。" }
    ],
    variables: {
      distance: { min: 3, max: 12, step: 1 },
      answerMinutes: { values: [15, 20, 24, 30, 36, 40, 45, 48, 60, 72] }
    },
    generatorType: "fractionTimeWithMinuteConversion",
    quantityRelation: {
      type: "speed-with-unit-conversion",
      distanceKey: "distance",
      minuteTimeKey: "minutes",
      speedKey: "speed",
      unknown: "minuteTime",
      distanceUnit: "km",
      inputTimeUnit: "分",
      outputSpeedUnit: "km/時"
    },
    solutionRoutes: [
      {
        id: "hours-first-route",
        steps: [
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "variable", key: "speed" },
            resultType: "fraction",
            resultKey: "hours"
          },
          {
            left: { source: "result", key: "hours" },
            operator: "×",
            right: { source: "literal", value: 60 },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "per-minute-route",
        steps: [
          {
            left: { source: "variable", key: "speed" },
            operator: "÷",
            right: { source: "literal", value: 60 },
            resultType: "fraction",
            resultKey: "speedPerMinute"
          },
          {
            left: { source: "variable", key: "distance" },
            operator: "÷",
            right: { source: "result", key: "speedPerMinute" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "分"
  },

  // ============================================================
  // 分数割合・比べる量（5種類、unknown:"compared"） generatorType: "fractionRateFindCompared"
  // ============================================================
  {
    id: "g6t2_rate_compared_001",
    gradeTerm: "6-2",
    category: "分数割合・比べる量",
    categoryId: "fraction-rate-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "人のうち、" },
      { type: "value", ref: "rate" },
      { type: "text", value: "が参加しました。参加した人は何人ですか。" }
    ],
    variables: {
      baseAmount: { min: 8, max: 48, step: 4 },
      rate: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "fractionRateFindCompared",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "rate", commutative: true }],
    answerUnit: "人"
  },
  {
    id: "g6t2_rate_compared_002",
    gradeTerm: "6-2",
    category: "分数割合・比べる量",
    categoryId: "fraction-rate-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "個の商品のうち、" },
      { type: "value", ref: "rate" },
      { type: "text", value: "が売れました。売れた商品は何個ですか。" }
    ],
    variables: {
      baseAmount: { min: 10, max: 60, step: 5 },
      rate: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "fractionRateFindCompared",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "rate", commutative: true }],
    answerUnit: "個"
  },
  {
    id: "g6t2_rate_compared_003",
    gradeTerm: "6-2",
    category: "分数割合・比べる量",
    categoryId: "fraction-rate-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "本の花のうち、" },
      { type: "value", ref: "rate" },
      { type: "text", value: "が赤い花です。赤い花は何本ですか。" }
    ],
    variables: {
      baseAmount: { min: 9, max: 36, step: 3 },
      rate: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 }
    },
    generatorType: "fractionRateFindCompared",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "rate", commutative: true }],
    answerUnit: "本"
  },
  {
    id: "g6t2_rate_compared_004",
    gradeTerm: "6-2",
    category: "分数割合・比べる量",
    categoryId: "fraction-rate-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "mLのジュースのうち、" },
      { type: "value", ref: "rate" },
      { type: "text", value: "を飲みました。飲んだ量は何mLですか。" }
    ],
    variables: {
      baseAmount: { min: 12, max: 60, step: 6 },
      rate: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "fractionRateFindCompared",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "rate", commutative: true }],
    answerUnit: "mL"
  },
  {
    id: "g6t2_rate_compared_005",
    gradeTerm: "6-2",
    category: "分数割合・比べる量",
    categoryId: "fraction-rate-compared-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "value", ref: "baseAmount" },
      { type: "text", value: "この材料のうち、" },
      { type: "value", ref: "rate" },
      { type: "text", value: "を使いました。使った材料は何こですか。" }
    ],
    variables: {
      baseAmount: { min: 8, max: 40, step: 8 },
      rate: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 7 }
    },
    generatorType: "fractionRateFindCompared",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "compared"
    },
    solutionRoutes: [{ left: "baseAmount", operator: "×", right: "rate", commutative: true }],
    answerUnit: "こ"
  },

  // ============================================================
  // 分数割合・割合（5種類、unknown:"rate"） generatorType: "fractionRateFindRate"
  // 問題文には整数しか登場しないため template（文字列）を使用する。
  // ============================================================
  {
    id: "g6t2_rate_rate_001",
    gradeTerm: "6-2",
    category: "分数割合・割合",
    categoryId: "fraction-rate-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{baseAmount}人のうち{comparedAmount}人が参加しました。参加した人数は全体の何分のいくつですか。",
    variables: {
      // baseAmountはrateの分母(5)の倍数にする（comparedAmount=baseAmount×rateが必ず整数になるように）。
      baseAmount: { min: 10, max: 30, step: 5 },
      rate: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "fractionRateFindRate",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "rate"
    },
    solutionRoutes: [
      { left: "comparedAmount", operator: "÷", right: "baseAmount", commutative: false, resultType: "fraction" }
    ],
    answerUnit: ""
  },
  {
    id: "g6t2_rate_rate_002",
    gradeTerm: "6-2",
    category: "分数割合・割合",
    categoryId: "fraction-rate-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{baseAmount}個の商品のうち{comparedAmount}個が売れました。売れた商品は全体の何分のいくつですか。",
    variables: {
      baseAmount: { min: 12, max: 40, step: 4 },
      rate: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "fractionRateFindRate",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "rate"
    },
    solutionRoutes: [
      { left: "comparedAmount", operator: "÷", right: "baseAmount", commutative: false, resultType: "fraction" }
    ],
    answerUnit: ""
  },
  {
    id: "g6t2_rate_rate_003",
    gradeTerm: "6-2",
    category: "分数割合・割合",
    categoryId: "fraction-rate-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "本を{baseAmount}ページ読む予定のうち、{comparedAmount}ページ読みました。読んだ量は全体の何分のいくつですか。",
    variables: {
      baseAmount: { min: 12, max: 36, step: 6 },
      rate: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "fractionRateFindRate",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "rate"
    },
    solutionRoutes: [
      { left: "comparedAmount", operator: "÷", right: "baseAmount", commutative: false, resultType: "fraction" }
    ],
    answerUnit: ""
  },
  {
    id: "g6t2_rate_rate_004",
    gradeTerm: "6-2",
    category: "分数割合・割合",
    categoryId: "fraction-rate-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "花だんの花{baseAmount}本のうち{comparedAmount}本が赤い花です。赤い花は全体の何分のいくつですか。",
    variables: {
      baseAmount: { min: 9, max: 27, step: 3 },
      rate: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 }
    },
    generatorType: "fractionRateFindRate",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "rate"
    },
    solutionRoutes: [
      { left: "comparedAmount", operator: "÷", right: "baseAmount", commutative: false, resultType: "fraction" }
    ],
    answerUnit: ""
  },
  {
    id: "g6t2_rate_rate_005",
    gradeTerm: "6-2",
    category: "分数割合・割合",
    categoryId: "fraction-rate-rate",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    template: "{baseAmount}この容器のうち{comparedAmount}こに水を入れました。水を入れた容器は全体の何分のいくつですか。",
    variables: {
      baseAmount: { min: 8, max: 32, step: 8 },
      rate: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 7 }
    },
    generatorType: "fractionRateFindRate",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "rate"
    },
    solutionRoutes: [
      { left: "comparedAmount", operator: "÷", right: "baseAmount", commutative: false, resultType: "fraction" }
    ],
    answerUnit: ""
  },

  // ============================================================
  // 分数割合・もとにする量（5種類、unknown:"base"） generatorType: "fractionRateFindBase"
  // ============================================================
  {
    id: "g6t2_rate_base_001",
    gradeTerm: "6-2",
    category: "分数割合・もとにする量",
    categoryId: "fraction-rate-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "全体の" },
      { type: "value", ref: "rate" },
      { type: "text", value: "にあたる人数が" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "人です。全体は何人ですか。" }
    ],
    variables: {
      // baseAmount（全体、答え）はrateの分母(5)の倍数にする
      // （comparedAmount=baseAmount×rateが必ず整数になるように。generateFractionRateValues()は
      //  常にbaseAmount×rateを計算するため、unknown:"base"でもbaseAmountをvariablesに定義する）。
      baseAmount: { min: 10, max: 50, step: 5 },
      rate: { type: "fraction", denominator: 5, numeratorMin: 1, numeratorMax: 4 }
    },
    generatorType: "fractionRateFindBase",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "人"
  },
  {
    id: "g6t2_rate_base_002",
    gradeTerm: "6-2",
    category: "分数割合・もとにする量",
    categoryId: "fraction-rate-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "全体の" },
      { type: "value", ref: "rate" },
      { type: "text", value: "にあたる商品数が" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "個です。全体は何個ですか。" }
    ],
    variables: {
      baseAmount: { min: 8, max: 40, step: 4 },
      rate: { type: "fraction", denominator: 4, numeratorMin: 1, numeratorMax: 3 }
    },
    generatorType: "fractionRateFindBase",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "個"
  },
  {
    id: "g6t2_rate_base_003",
    gradeTerm: "6-2",
    category: "分数割合・もとにする量",
    categoryId: "fraction-rate-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "本のページ数全体の" },
      { type: "value", ref: "rate" },
      { type: "text", value: "にあたるのが" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "ページです。本は全部で何ページですか。" }
    ],
    variables: {
      baseAmount: { min: 12, max: 36, step: 6 },
      rate: { type: "fraction", denominator: 6, numeratorMin: 1, numeratorMax: 5 }
    },
    generatorType: "fractionRateFindBase",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "ページ"
  },
  {
    id: "g6t2_rate_base_004",
    gradeTerm: "6-2",
    category: "分数割合・もとにする量",
    categoryId: "fraction-rate-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "花だんの花全体の" },
      { type: "value", ref: "rate" },
      { type: "text", value: "にあたるのが赤い花" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "本です。花だんの花は全部で何本ですか。" }
    ],
    variables: {
      baseAmount: { min: 6, max: 24, step: 3 },
      rate: { type: "fraction", denominator: 3, numeratorMin: 1, numeratorMax: 2 }
    },
    generatorType: "fractionRateFindBase",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "本"
  },
  {
    id: "g6t2_rate_base_005",
    gradeTerm: "6-2",
    category: "分数割合・もとにする量",
    categoryId: "fraction-rate-base-amount",
    contentGroup: "new",
    difficulty: 3,
    questionType: "singleStep",
    textParts: [
      { type: "text", value: "ジュース全体の" },
      { type: "value", ref: "rate" },
      { type: "text", value: "にあたる量が" },
      { type: "value", ref: "comparedAmount" },
      { type: "text", value: "mLです。ジュースは全部で何mLですか。" }
    ],
    variables: {
      baseAmount: { min: 8, max: 48, step: 8 },
      rate: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 7 }
    },
    generatorType: "fractionRateFindBase",
    quantityRelation: {
      type: "fraction-rate",
      baseKey: "baseAmount",
      comparedKey: "comparedAmount",
      rateKey: "rate",
      unknown: "base"
    },
    solutionRoutes: [{ left: "comparedAmount", operator: "÷", right: "rate", commutative: false }],
    answerUnit: "mL"
  },

  // ============================================================
  // 比を使った数量（5種類） generatorType: "ratioApplication"（2段階問題）
  // ============================================================
  {
    id: "g6t2_ratio_application_001",
    gradeTerm: "6-2",
    category: "比を使った数量",
    categoryId: "ratio-application",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "赤い玉と青い玉の個数の比は" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "です。赤い玉が" },
      { type: "value", ref: "firstAmount" },
      { type: "text", value: "個のとき、青い玉は何個ですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 6, step: 1 },
      secondRatio: { min: 2, max: 7, step: 1 },
      unitAmount: { min: 2, max: 9, step: 1 }
    },
    generatorType: "ratioApplication",
    quantityRelation: {
      type: "ratio-application",
      firstAmountKey: "firstAmount",
      secondAmountKey: "secondAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      known: "firstAmount",
      unknown: "secondAmount"
    },
    solutionRoutes: [
      {
        id: "standard-two-step-route",
        steps: [
          {
            left: { source: "variable", key: "firstAmount" },
            operator: "÷",
            right: { source: "variable", key: "firstRatio" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "secondRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          {
            left: { source: "variable", key: "secondRatio" },
            operator: "÷",
            right: { source: "variable", key: "firstRatio" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "firstAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "個"
  },
  {
    id: "g6t2_ratio_application_002",
    gradeTerm: "6-2",
    category: "比を使った数量",
    categoryId: "ratio-application",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "男子と女子の人数の比は" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "です。男子が" },
      { type: "value", ref: "firstAmount" },
      { type: "text", value: "人のとき、女子は何人ですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 6, step: 1 },
      secondRatio: { min: 2, max: 7, step: 1 },
      unitAmount: { min: 2, max: 8, step: 1 }
    },
    generatorType: "ratioApplication",
    quantityRelation: {
      type: "ratio-application",
      firstAmountKey: "firstAmount",
      secondAmountKey: "secondAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      known: "firstAmount",
      unknown: "secondAmount"
    },
    solutionRoutes: [
      {
        id: "standard-two-step-route",
        steps: [
          {
            left: { source: "variable", key: "firstAmount" },
            operator: "÷",
            right: { source: "variable", key: "firstRatio" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "secondRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          {
            left: { source: "variable", key: "secondRatio" },
            operator: "÷",
            right: { source: "variable", key: "firstRatio" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "firstAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "人"
  },
  {
    id: "g6t2_ratio_application_003",
    gradeTerm: "6-2",
    category: "比を使った数量",
    categoryId: "ratio-application",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "りんごとみかんの個数の比は" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "です。みかんが" },
      { type: "value", ref: "secondAmount" },
      { type: "text", value: "個のとき、りんごは何個ですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 7, step: 1 },
      secondRatio: { min: 2, max: 6, step: 1 },
      unitAmount: { min: 2, max: 9, step: 1 }
    },
    generatorType: "ratioApplication",
    quantityRelation: {
      type: "ratio-application",
      firstAmountKey: "firstAmount",
      secondAmountKey: "secondAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      known: "secondAmount",
      unknown: "firstAmount"
    },
    solutionRoutes: [
      {
        id: "standard-two-step-route",
        steps: [
          {
            left: { source: "variable", key: "secondAmount" },
            operator: "÷",
            right: { source: "variable", key: "secondRatio" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "firstRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "÷",
            right: { source: "variable", key: "secondRatio" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "secondAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "個"
  },
  {
    id: "g6t2_ratio_application_004",
    gradeTerm: "6-2",
    category: "比を使った数量",
    categoryId: "ratio-application",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "赤いリボンと青いリボンの長さの比は" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "です。赤いリボンが" },
      { type: "value", ref: "firstAmount" },
      { type: "text", value: "cmのとき、青いリボンは何cmですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 5, step: 1 },
      secondRatio: { min: 2, max: 6, step: 1 },
      unitAmount: { min: 3, max: 10, step: 1 }
    },
    generatorType: "ratioApplication",
    quantityRelation: {
      type: "ratio-application",
      firstAmountKey: "firstAmount",
      secondAmountKey: "secondAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      known: "firstAmount",
      unknown: "secondAmount"
    },
    solutionRoutes: [
      {
        id: "standard-two-step-route",
        steps: [
          {
            left: { source: "variable", key: "firstAmount" },
            operator: "÷",
            right: { source: "variable", key: "firstRatio" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "secondRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          {
            left: { source: "variable", key: "secondRatio" },
            operator: "÷",
            right: { source: "variable", key: "firstRatio" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "firstAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "cm"
  },
  {
    id: "g6t2_ratio_application_005",
    gradeTerm: "6-2",
    category: "比を使った数量",
    categoryId: "ratio-application",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    textParts: [
      { type: "text", value: "犬とねこの頭数の比は" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "です。ねこが" },
      { type: "value", ref: "secondAmount" },
      { type: "text", value: "頭のとき、犬は何頭ですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 6, step: 1 },
      secondRatio: { min: 2, max: 5, step: 1 },
      unitAmount: { min: 2, max: 8, step: 1 }
    },
    generatorType: "ratioApplication",
    quantityRelation: {
      type: "ratio-application",
      firstAmountKey: "firstAmount",
      secondAmountKey: "secondAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      known: "secondAmount",
      unknown: "firstAmount"
    },
    solutionRoutes: [
      {
        id: "standard-two-step-route",
        steps: [
          {
            left: { source: "variable", key: "secondAmount" },
            operator: "÷",
            right: { source: "variable", key: "secondRatio" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "firstRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "÷",
            right: { source: "variable", key: "secondRatio" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "secondAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "頭"
  },

  // ============================================================
  // 比例配分（5種類） generatorType: "proportionalAllocation"（3段階問題）
  // ============================================================
  {
    id: "g6t2_proportional_allocation_001",
    gradeTerm: "6-2",
    category: "比例配分",
    categoryId: "proportional-allocation",
    contentGroup: "new",
    difficulty: 4,
    questionType: "multiStep",
    totalSteps: 3,
    textParts: [
      { type: "text", value: "長さ" },
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "cmのリボンを、姉と妹で長さの比が" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "になるように分けます。姉の分のリボンの長さは何cmですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 6, step: 1 },
      secondRatio: { min: 2, max: 6, step: 1 },
      unitAmount: { min: 3, max: 15, step: 1 }
    },
    generatorType: "proportionalAllocation",
    quantityRelation: {
      type: "proportional-allocation",
      totalKey: "totalAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      target: "first"
    },
    solutionRoutes: [
      {
        id: "standard-three-step-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "firstRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "ratio-fraction-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "cm"
  },
  {
    id: "g6t2_proportional_allocation_002",
    gradeTerm: "6-2",
    category: "比例配分",
    categoryId: "proportional-allocation",
    contentGroup: "new",
    difficulty: 4,
    questionType: "multiStep",
    totalSteps: 3,
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "円のお金を、兄と弟でお金の比が" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "になるように分けます。弟の分のお金は何円ですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 6, step: 1 },
      secondRatio: { min: 2, max: 6, step: 1 },
      unitAmount: { min: 10, max: 100, step: 10 }
    },
    generatorType: "proportionalAllocation",
    quantityRelation: {
      type: "proportional-allocation",
      totalKey: "totalAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      target: "second"
    },
    solutionRoutes: [
      {
        id: "standard-three-step-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "secondRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "ratio-fraction-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "secondRatio" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "円"
  },
  {
    id: "g6t2_proportional_allocation_003",
    gradeTerm: "6-2",
    category: "比例配分",
    categoryId: "proportional-allocation",
    contentGroup: "new",
    difficulty: 4,
    questionType: "multiStep",
    totalSteps: 3,
    textParts: [
      { type: "text", value: "面積" },
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "㎡の土地を、A地区とB地区で面積の比が" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "になるように分けます。A地区の面積は何㎡ですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 7, step: 1 },
      secondRatio: { min: 2, max: 6, step: 1 },
      unitAmount: { min: 4, max: 20, step: 2 }
    },
    generatorType: "proportionalAllocation",
    quantityRelation: {
      type: "proportional-allocation",
      totalKey: "totalAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      target: "first"
    },
    solutionRoutes: [
      {
        id: "standard-three-step-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "firstRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "ratio-fraction-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "㎡"
  },
  {
    id: "g6t2_proportional_allocation_004",
    gradeTerm: "6-2",
    category: "比例配分",
    categoryId: "proportional-allocation",
    contentGroup: "new",
    difficulty: 4,
    questionType: "multiStep",
    totalSteps: 3,
    // 「1つのジュースを2種類のジュースに分ける」という不自然な文章だったため、
    // 「1つのジュースを2つのコップに分ける」という文章に変更している（運用開始後に修正）。
    textParts: [
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "mLのジュースを、AのコップとBのコップに、量の比が" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "になるように分けます。Bのコップに入れるジュースの量は何mLですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 6, step: 1 },
      secondRatio: { min: 2, max: 6, step: 1 },
      unitAmount: { min: 20, max: 100, step: 10 }
    },
    generatorType: "proportionalAllocation",
    quantityRelation: {
      type: "proportional-allocation",
      totalKey: "totalAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      target: "second"
    },
    solutionRoutes: [
      {
        id: "standard-three-step-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "secondRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "ratio-fraction-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "secondRatio" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "mL"
  },
  {
    id: "g6t2_proportional_allocation_005",
    gradeTerm: "6-2",
    category: "比例配分",
    categoryId: "proportional-allocation",
    contentGroup: "new",
    difficulty: 4,
    questionType: "multiStep",
    totalSteps: 3,
    textParts: [
      { type: "text", value: "長さ" },
      { type: "value", ref: "totalAmount" },
      { type: "text", value: "mの布を、白い布と黒い布で長さの比が" },
      { type: "value", ref: "ratioValue" },
      { type: "text", value: "になるように分けます。白い布の長さは何mですか。" }
    ],
    variables: {
      firstRatio: { min: 2, max: 5, step: 1 },
      secondRatio: { min: 2, max: 6, step: 1 },
      unitAmount: { min: 2, max: 12, step: 1 }
    },
    generatorType: "proportionalAllocation",
    quantityRelation: {
      type: "proportional-allocation",
      totalKey: "totalAmount",
      firstRatioKey: "firstRatio",
      secondRatioKey: "secondRatio",
      target: "first"
    },
    solutionRoutes: [
      {
        id: "standard-three-step-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "numberOrFraction",
            resultKey: "unitAmount"
          },
          {
            left: { source: "result", key: "unitAmount" },
            operator: "×",
            right: { source: "variable", key: "firstRatio" },
            resultType: "numberOrFraction",
            resultKey: "answer"
          }
        ]
      },
      {
        id: "ratio-fraction-route",
        steps: [
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "+",
            right: { source: "variable", key: "secondRatio" },
            resultType: "number",
            resultKey: "ratioSum"
          },
          {
            left: { source: "variable", key: "firstRatio" },
            operator: "÷",
            right: { source: "result", key: "ratioSum" },
            resultType: "fraction",
            resultKey: "multiplier"
          },
          {
            left: { source: "variable", key: "totalAmount" },
            operator: "×",
            right: { source: "result", key: "multiplier" },
            resultKey: "answer"
          }
        ]
      }
    ],
    answerUnit: "m"
  }
];
