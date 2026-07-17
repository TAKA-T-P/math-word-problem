// 小学6年生・3学期の新規テンプレート（第12段階で追加）。
//
// 4カテゴリ、各6種類、計24種類のテンプレートを収録します
// （「縮尺を求める」カテゴリは運用開始後に削除しました）。
//   - 比例・対応する量（findDirectProportionValue）      : 6種類
//   - 反比例・対応する量（findInverseProportionValue）    : 6種類
//   - 縮尺・実際の長さ（findActualLengthFromScale）        : 6種類
//   - 縮尺・地図上の長さ（findMapLengthFromScale）          : 6種類
//
// すべて2段階問題（questionType: "multiStep", totalSteps: 2）です。
// 比例定数・反比例の一定の積は、式1で児童が求める中間結果として扱い、
// 問題文（template文字列）には一切登場させません（hiddenIntermediateKeys で
// 検証ページ・question-validator.js が自動チェックします）。
//
// 縮尺・分数を含まないため、すべて textParts ではなく通常の template 文字列を使っています
// （縮尺の値オブジェクトも renderTemplateText() が "1：25,000" の形式に変換します）。

export const grade6Term3Templates = [
  // ============================================================
  // 比例・対応する量（6種類） generatorType: "findDirectProportionValue"
  // ============================================================
  {
    id: "g6t3_proportion_001",
    gradeTerm: "6-3",
    category: "比例・対応する量",
    categoryId: "proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "ノート{knownX}冊の代金は{knownY}円です。同じノートを{targetX}冊買うと、代金は何円ですか。",
    variables: {
      proportionConstant: { min: 50, max: 300, step: 10 },
      knownX: { min: 2, max: 8, step: 1 },
      targetX: { min: 2, max: 12, step: 1 }
    },
    generatorType: "findDirectProportionValue",
    quantityRelation: {
      type: "direct-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      constantKey: "proportionConstant",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["proportionConstant"],
    solutionRoutes: [
      {
        id: "unit-value-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "proportionConstant" },
          { left: { source: "result", key: "proportionConstant" }, operator: "×", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "cross-multiplication-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "variable", key: "targetX" }, commutative: true, resultKey: "crossProduct" },
          { left: { source: "result", key: "crossProduct" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "answer" }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "multiplier" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "multiplier" }, resultKey: "answer" }
        ]
      },
      {
        id: "divisor-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "ratioFactor" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "ratioFactor" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "円"
  },
  {
    id: "g6t3_proportion_002",
    gradeTerm: "6-3",
    category: "比例・対応する量",
    categoryId: "proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "長さ{knownX}mの重さが{knownY}gの針金があります。同じ針金{targetX}mの重さは何gですか。",
    variables: {
      proportionConstant: { min: 20, max: 150, step: 5 },
      knownX: { min: 2, max: 10, step: 1 },
      targetX: { min: 2, max: 15, step: 1 }
    },
    generatorType: "findDirectProportionValue",
    quantityRelation: {
      type: "direct-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      constantKey: "proportionConstant",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["proportionConstant"],
    solutionRoutes: [
      {
        id: "unit-value-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "proportionConstant" },
          { left: { source: "result", key: "proportionConstant" }, operator: "×", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "cross-multiplication-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "variable", key: "targetX" }, commutative: true, resultKey: "crossProduct" },
          { left: { source: "result", key: "crossProduct" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "answer" }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "multiplier" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "multiplier" }, resultKey: "answer" }
        ]
      },
      {
        id: "divisor-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "ratioFactor" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "ratioFactor" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "g"
  },
  {
    id: "g6t3_proportion_003",
    gradeTerm: "6-3",
    category: "比例・対応する量",
    categoryId: "proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "コピー機で{knownX}枚印刷するのに{knownY}秒かかります。同じ速さで{targetX}枚印刷すると、何秒かかりますか。",
    variables: {
      proportionConstant: { min: 2, max: 8, step: 1 },
      knownX: { min: 5, max: 20, step: 1 },
      targetX: { min: 5, max: 30, step: 1 }
    },
    generatorType: "findDirectProportionValue",
    quantityRelation: {
      type: "direct-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      constantKey: "proportionConstant",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["proportionConstant"],
    solutionRoutes: [
      {
        id: "unit-value-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "proportionConstant" },
          { left: { source: "result", key: "proportionConstant" }, operator: "×", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "cross-multiplication-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "variable", key: "targetX" }, commutative: true, resultKey: "crossProduct" },
          { left: { source: "result", key: "crossProduct" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "answer" }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "multiplier" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "multiplier" }, resultKey: "answer" }
        ]
      },
      {
        id: "divisor-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "ratioFactor" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "ratioFactor" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "秒"
  },
  {
    id: "g6t3_proportion_004",
    gradeTerm: "6-3",
    category: "比例・対応する量",
    categoryId: "proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "自動車が{knownX}Lのガソリンで{knownY}km走ります。同じ割合で走るとき、{targetX}Lのガソリンで何km走れますか。",
    variables: {
      proportionConstant: { min: 8, max: 20, step: 1 },
      knownX: { min: 2, max: 10, step: 1 },
      targetX: { min: 2, max: 15, step: 1 }
    },
    generatorType: "findDirectProportionValue",
    quantityRelation: {
      type: "direct-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      constantKey: "proportionConstant",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["proportionConstant"],
    solutionRoutes: [
      {
        id: "unit-value-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "proportionConstant" },
          { left: { source: "result", key: "proportionConstant" }, operator: "×", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "cross-multiplication-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "variable", key: "targetX" }, commutative: true, resultKey: "crossProduct" },
          { left: { source: "result", key: "crossProduct" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "answer" }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "multiplier" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "multiplier" }, resultKey: "answer" }
        ]
      },
      {
        id: "divisor-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "ratioFactor" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "ratioFactor" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "km"
  },
  {
    id: "g6t3_proportion_005",
    gradeTerm: "6-3",
    category: "比例・対応する量",
    categoryId: "proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "工場で{knownX}時間に製品を{knownY}個作ります。同じ割合で作るとき、{targetX}時間では製品を何個作れますか。",
    variables: {
      proportionConstant: { min: 20, max: 100, step: 5 },
      knownX: { min: 2, max: 8, step: 1 },
      targetX: { min: 2, max: 12, step: 1 }
    },
    generatorType: "findDirectProportionValue",
    quantityRelation: {
      type: "direct-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      constantKey: "proportionConstant",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["proportionConstant"],
    solutionRoutes: [
      {
        id: "unit-value-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "proportionConstant" },
          { left: { source: "result", key: "proportionConstant" }, operator: "×", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "cross-multiplication-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "variable", key: "targetX" }, commutative: true, resultKey: "crossProduct" },
          { left: { source: "result", key: "crossProduct" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "answer" }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "multiplier" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "multiplier" }, resultKey: "answer" }
        ]
      },
      {
        id: "divisor-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "ratioFactor" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "ratioFactor" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "個"
  },
  {
    id: "g6t3_proportion_006",
    gradeTerm: "6-3",
    category: "比例・対応する量",
    categoryId: "proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "同じ種類の鉄の棒があります。{knownX}mの重さが{knownY}kgのとき、{targetX}mの重さは何kgですか。",
    variables: {
      proportionConstant: { min: 3, max: 15, step: 1 },
      knownX: { min: 2, max: 9, step: 1 },
      targetX: { min: 2, max: 14, step: 1 }
    },
    generatorType: "findDirectProportionValue",
    quantityRelation: {
      type: "direct-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      constantKey: "proportionConstant",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["proportionConstant"],
    solutionRoutes: [
      {
        id: "unit-value-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "proportionConstant" },
          { left: { source: "result", key: "proportionConstant" }, operator: "×", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "cross-multiplication-route",
        steps: [
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "variable", key: "targetX" }, commutative: true, resultKey: "crossProduct" },
          { left: { source: "result", key: "crossProduct" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultKey: "answer" }
        ]
      },
      {
        id: "multiplier-first-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "multiplier" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "multiplier" }, resultKey: "answer" }
        ]
      },
      {
        id: "divisor-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "ratioFactor" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "ratioFactor" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "kg"
  },

  // ============================================================
  // 反比例・対応する量（6種類） generatorType: "findInverseProportionValue"
  // ============================================================
  {
    id: "g6t3_inverse_001",
    gradeTerm: "6-3",
    category: "反比例・対応する量",
    categoryId: "inverse-proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "面積が一定の長方形があります。縦が{knownX}cmのとき、横は{knownY}cmです。縦を{targetX}cmにすると、横は何cmになりますか。",
    variables: {
      knownX: { min: 2, max: 10, step: 1 },
      targetX: { min: 2, max: 12, step: 1 },
      scaleFactor: { min: 2, max: 10, step: 1 }
    },
    generatorType: "findInverseProportionValue",
    quantityRelation: {
      type: "inverse-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      productKey: "constantProduct",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["constantProduct"],
    solutionRoutes: [
      {
        id: "product-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "×", right: { source: "variable", key: "knownY" }, commutative: true, resultKey: "constantProduct" },
          { left: { source: "result", key: "constantProduct" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "target-over-known-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "growthRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "growthRatio" }, resultKey: "answer" }
        ]
      },
      {
        id: "known-over-target-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "shrinkRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "shrinkRatio" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "cm"
  },
  {
    id: "g6t3_inverse_002",
    gradeTerm: "6-3",
    category: "反比例・対応する量",
    categoryId: "inverse-proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "ある仕事を{knownX}人で行うと{knownY}日かかります。同じ仕事を{targetX}人で行うと、何日かかりますか。",
    variables: {
      knownX: { min: 2, max: 12, step: 1 },
      targetX: { min: 2, max: 12, step: 1 },
      scaleFactor: { min: 2, max: 10, step: 1 }
    },
    generatorType: "findInverseProportionValue",
    quantityRelation: {
      type: "inverse-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      productKey: "constantProduct",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["constantProduct"],
    solutionRoutes: [
      {
        id: "product-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "×", right: { source: "variable", key: "knownY" }, commutative: true, resultKey: "constantProduct" },
          { left: { source: "result", key: "constantProduct" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "target-over-known-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "growthRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "growthRatio" }, resultKey: "answer" }
        ]
      },
      {
        id: "known-over-target-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "shrinkRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "shrinkRatio" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "日"
  },
  {
    id: "g6t3_inverse_003",
    gradeTerm: "6-3",
    category: "反比例・対応する量",
    categoryId: "inverse-proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "ある道のりを、分速{knownX}mで歩くと{knownY}分かかります。分速を{targetX}mにすると、何分かかりますか。",
    variables: {
      knownX: { min: 40, max: 120, step: 10 },
      targetX: { min: 40, max: 120, step: 10 },
      scaleFactor: { min: 2, max: 15, step: 1 }
    },
    generatorType: "findInverseProportionValue",
    quantityRelation: {
      type: "inverse-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      productKey: "constantProduct",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["constantProduct"],
    solutionRoutes: [
      {
        id: "product-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "×", right: { source: "variable", key: "knownY" }, commutative: true, resultKey: "constantProduct" },
          { left: { source: "result", key: "constantProduct" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "target-over-known-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "growthRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "growthRatio" }, resultKey: "answer" }
        ]
      },
      {
        id: "known-over-target-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "shrinkRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "shrinkRatio" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "分"
  },
  {
    id: "g6t3_inverse_004",
    gradeTerm: "6-3",
    category: "反比例・対応する量",
    categoryId: "inverse-proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "ある作業を、機械{knownX}台で行うと{knownY}時間かかります。機械を{targetX}台にすると、何時間かかりますか。",
    variables: {
      knownX: { min: 2, max: 10, step: 1 },
      targetX: { min: 2, max: 10, step: 1 },
      scaleFactor: { min: 2, max: 12, step: 1 }
    },
    generatorType: "findInverseProportionValue",
    quantityRelation: {
      type: "inverse-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      productKey: "constantProduct",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["constantProduct"],
    solutionRoutes: [
      {
        id: "product-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "×", right: { source: "variable", key: "knownY" }, commutative: true, resultKey: "constantProduct" },
          { left: { source: "result", key: "constantProduct" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "target-over-known-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "growthRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "growthRatio" }, resultKey: "answer" }
        ]
      },
      {
        id: "known-over-target-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "shrinkRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "shrinkRatio" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "時間"
  },
  {
    id: "g6t3_inverse_005",
    gradeTerm: "6-3",
    category: "反比例・対応する量",
    categoryId: "inverse-proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "お菓子を{knownX}人で同じ数ずつ分けると、1人分は{knownY}個になります。{targetX}人で分けると、1人分は何個になりますか。",
    variables: {
      knownX: { min: 2, max: 12, step: 1 },
      targetX: { min: 2, max: 12, step: 1 },
      scaleFactor: { min: 2, max: 10, step: 1 }
    },
    generatorType: "findInverseProportionValue",
    quantityRelation: {
      type: "inverse-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      productKey: "constantProduct",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["constantProduct"],
    solutionRoutes: [
      {
        id: "product-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "×", right: { source: "variable", key: "knownY" }, commutative: true, resultKey: "constantProduct" },
          { left: { source: "result", key: "constantProduct" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "target-over-known-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "growthRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "growthRatio" }, resultKey: "answer" }
        ]
      },
      {
        id: "known-over-target-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "shrinkRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "shrinkRatio" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "個"
  },
  {
    id: "g6t3_inverse_006",
    gradeTerm: "6-3",
    category: "反比例・対応する量",
    categoryId: "inverse-proportion-corresponding-value",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "ある道のりを、時速{knownX}kmの自転車で走ると{knownY}時間かかります。時速を{targetX}kmにすると、何時間かかりますか。",
    variables: {
      knownX: { min: 4, max: 20, step: 2 },
      targetX: { min: 4, max: 20, step: 2 },
      scaleFactor: { min: 2, max: 8, step: 1 }
    },
    generatorType: "findInverseProportionValue",
    quantityRelation: {
      type: "inverse-proportion",
      knownXKey: "knownX",
      knownYKey: "knownY",
      targetXKey: "targetX",
      targetYKey: "targetY",
      productKey: "constantProduct",
      unknown: "targetY"
    },
    hiddenIntermediateKeys: ["constantProduct"],
    solutionRoutes: [
      {
        id: "product-first-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "×", right: { source: "variable", key: "knownY" }, commutative: true, resultKey: "constantProduct" },
          { left: { source: "result", key: "constantProduct" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultKey: "answer" }
        ]
      },
      {
        id: "target-over-known-route",
        steps: [
          { left: { source: "variable", key: "targetX" }, operator: "÷", right: { source: "variable", key: "knownX" }, resultType: "fraction", resultKey: "growthRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "÷", right: { source: "result", key: "growthRatio" }, resultKey: "answer" }
        ]
      },
      {
        id: "known-over-target-route",
        steps: [
          { left: { source: "variable", key: "knownX" }, operator: "÷", right: { source: "variable", key: "targetX" }, resultType: "fraction", resultKey: "shrinkRatio" },
          { left: { source: "variable", key: "knownY" }, operator: "×", right: { source: "result", key: "shrinkRatio" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "時間"
  },

  // ============================================================
  // 縮尺・実際の長さ（6種類） generatorType: "findActualLengthFromScale"
  // ============================================================
  {
    id: "g6t3_scale_actual_001",
    gradeTerm: "6-3",
    category: "縮尺・実際の長さ",
    categoryId: "scale-find-actual-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の地図で、2地点の間の長さは{mapLength}cmです。実際の長さは何kmですか。",
    variables: {
      scaleDenominator: { values: [10000, 20000, 25000, 50000, 100000] },
      mapLength: { min: 2, max: 15, step: 1 }
    },
    generatorType: "findActualLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "km",
      unknown: "actualLength"
    },
    solutionRoutes: [
      {
        id: "map-times-scale-route",
        steps: [
          { left: { source: "variable", key: "mapLength" }, operator: "×", right: { source: "variable", key: "scaleDenominator" }, commutative: true, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "literal", value: 100000 }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "km"
  },
  {
    id: "g6t3_scale_actual_002",
    gradeTerm: "6-3",
    category: "縮尺・実際の長さ",
    categoryId: "scale-find-actual-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の校舎の図面で、長さが{mapLength}cmの場所があります。実際の長さは何mですか。",
    variables: {
      scaleDenominator: { values: [200, 250, 300, 400, 500] },
      mapLength: { min: 2, max: 15, step: 1 }
    },
    generatorType: "findActualLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "m",
      unknown: "actualLength"
    },
    solutionRoutes: [
      {
        id: "map-times-scale-route",
        steps: [
          { left: { source: "variable", key: "mapLength" }, operator: "×", right: { source: "variable", key: "scaleDenominator" }, commutative: true, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "literal", value: 100 }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "m"
  },
  {
    id: "g6t3_scale_actual_003",
    gradeTerm: "6-3",
    category: "縮尺・実際の長さ",
    categoryId: "scale-find-actual-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の部屋の間取り図で、部屋の長さが{mapLength}cmでした。実際の長さは何mですか。",
    variables: {
      scaleDenominator: { values: [50, 80, 100, 120, 150] },
      mapLength: { min: 3, max: 12, step: 1 }
    },
    generatorType: "findActualLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "m",
      unknown: "actualLength"
    },
    solutionRoutes: [
      {
        id: "map-times-scale-route",
        steps: [
          { left: { source: "variable", key: "mapLength" }, operator: "×", right: { source: "variable", key: "scaleDenominator" }, commutative: true, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "literal", value: 100 }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "m"
  },
  {
    id: "g6t3_scale_actual_004",
    gradeTerm: "6-3",
    category: "縮尺・実際の長さ",
    categoryId: "scale-find-actual-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の公園の案内図で、道の長さが{mapLength}cmでした。実際の長さは何mですか。",
    variables: {
      scaleDenominator: { values: [500, 800, 1000, 1500, 2000] },
      mapLength: { min: 2, max: 10, step: 1 }
    },
    generatorType: "findActualLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "m",
      unknown: "actualLength"
    },
    solutionRoutes: [
      {
        id: "map-times-scale-route",
        steps: [
          { left: { source: "variable", key: "mapLength" }, operator: "×", right: { source: "variable", key: "scaleDenominator" }, commutative: true, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "literal", value: 100 }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "m"
  },
  {
    id: "g6t3_scale_actual_005",
    gradeTerm: "6-3",
    category: "縮尺・実際の長さ",
    categoryId: "scale-find-actual-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の建物の設計図で、かべの長さが{mapLength}cmでした。実際の長さは何mですか。",
    variables: {
      scaleDenominator: { values: [100, 150, 200, 250] },
      mapLength: { min: 3, max: 15, step: 1 }
    },
    generatorType: "findActualLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "m",
      unknown: "actualLength"
    },
    solutionRoutes: [
      {
        id: "map-times-scale-route",
        steps: [
          { left: { source: "variable", key: "mapLength" }, operator: "×", right: { source: "variable", key: "scaleDenominator" }, commutative: true, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "literal", value: 100 }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "m"
  },
  {
    id: "g6t3_scale_actual_006",
    gradeTerm: "6-3",
    category: "縮尺・実際の長さ",
    categoryId: "scale-find-actual-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の道路地図で、2つの町の間の長さは{mapLength}cmです。実際の長さは何kmですか。",
    variables: {
      scaleDenominator: { values: [25000, 50000, 75000, 100000, 150000] },
      mapLength: { min: 2, max: 20, step: 1 }
    },
    generatorType: "findActualLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "km",
      unknown: "actualLength"
    },
    solutionRoutes: [
      {
        id: "map-times-scale-route",
        steps: [
          { left: { source: "variable", key: "mapLength" }, operator: "×", right: { source: "variable", key: "scaleDenominator" }, commutative: true, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "literal", value: 100000 }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "km"
  },

  // ============================================================
  // 縮尺・地図上の長さ（6種類） generatorType: "findMapLengthFromScale"
  // ============================================================
  {
    id: "g6t3_scale_map_001",
    gradeTerm: "6-3",
    category: "縮尺・地図上の長さ",
    categoryId: "scale-find-map-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の地図があります。実際の長さが{actualLength}kmの道のりは、地図上では何cmですか。",
    variables: {
      scaleDenominator: { values: [10000, 20000, 25000, 50000, 100000] },
      mapLength: { min: 2, max: 15, step: 1 }
    },
    generatorType: "findMapLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "km",
      unknown: "mapLength"
    },
    solutionRoutes: [
      {
        id: "convert-then-divide-route",
        steps: [
          { left: { source: "variable", key: "actualLength" }, operator: "×", right: { source: "literal", value: 100000 }, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "answer" }
        ]
      },
      {
        // 先に「変換係数(100000)÷縮尺の分母」で比を求めてから、実際の長さにかけるルート
        // （運用開始後に追加。1つ目の式の選択肢カードに縮尺の分母・実際の長さ・変換係数(100000)の
        // 3枚が必ずそろうようにするため）。km単位は「実際の長さ÷縮尺の分母」を先にすると
        // 小数点以下の桁数が多くなりすぎて計算不能になるため、m単位のテンプレートとは逆の順序にしている。
        // 例: 縮尺1：10000なら 100000÷10000=10（比）→ 実際の長さ0.5kmなら 10×0.5=5(cm)。
        id: "ratio-then-multiply-route",
        steps: [
          { left: { source: "literal", value: 100000 }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "ratio" },
          { left: { source: "result", key: "ratio" }, operator: "×", right: { source: "variable", key: "actualLength" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "cm"
  },
  {
    id: "g6t3_scale_map_002",
    gradeTerm: "6-3",
    category: "縮尺・地図上の長さ",
    categoryId: "scale-find-map-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の公園の案内図があります。実際の長さが{actualLength}mの道は、案内図では何cmですか。",
    variables: {
      scaleDenominator: { values: [500, 800, 1000, 1500, 2000] },
      mapLength: { min: 2, max: 12, step: 1 }
    },
    generatorType: "findMapLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "m",
      unknown: "mapLength"
    },
    solutionRoutes: [
      {
        id: "convert-then-divide-route",
        steps: [
          { left: { source: "variable", key: "actualLength" }, operator: "×", right: { source: "literal", value: 100 }, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "answer" }
        ]
      },
      {
        // 先に「実際の長さ÷縮尺の分母」で地図上の長さをm単位のまま求めてから、最後に
        // ×100でcmへ変換するルート（運用開始後に追加。g6t3_scale_map_003と同じ考え方）。
        // 例: 縮尺1：800、実際の長さ48mなら 48÷800=0.06(m) → 0.06×100=6(cm)。
        id: "divide-then-convert-route",
        steps: [
          { left: { source: "variable", key: "actualLength" }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "mapLengthInActualUnit" },
          { left: { source: "result", key: "mapLengthInActualUnit" }, operator: "×", right: { source: "literal", value: 100 }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "cm"
  },
  {
    id: "g6t3_scale_map_003",
    gradeTerm: "6-3",
    category: "縮尺・地図上の長さ",
    categoryId: "scale-find-map-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の学校の敷地の案内図があります。実際の長さが{actualLength}mの通路は、案内図では何cmですか。",
    variables: {
      scaleDenominator: { values: [200, 300, 400, 500] },
      mapLength: { min: 3, max: 15, step: 1 }
    },
    generatorType: "findMapLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "m",
      unknown: "mapLength"
    },
    solutionRoutes: [
      {
        id: "convert-then-divide-route",
        steps: [
          { left: { source: "variable", key: "actualLength" }, operator: "×", right: { source: "literal", value: 100 }, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "answer" }
        ]
      },
      {
        // 先に「実際の長さ÷縮尺の分母」で地図上の長さをm単位のまま求めてから、最後に
        // ×100でcmへ変換するルート（運用開始後に追加）。例: 55÷500=0.11(m) → 0.11×100=11(cm)。
        id: "divide-then-convert-route",
        steps: [
          { left: { source: "variable", key: "actualLength" }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "mapLengthInActualUnit" },
          { left: { source: "result", key: "mapLengthInActualUnit" }, operator: "×", right: { source: "literal", value: 100 }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "cm"
  },
  {
    id: "g6t3_scale_map_004",
    gradeTerm: "6-3",
    category: "縮尺・地図上の長さ",
    categoryId: "scale-find-map-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の街の地図があります。実際の長さが{actualLength}kmの道のりは、地図上では何cmですか。",
    variables: {
      // 75000は「変換係数(100000)÷縮尺の分母」が割り切れない（100000÷75000=1.333…）ため、
      // 割り切れる40000に変更しています（運用開始後に変更。ratio-then-multiply-routeのため）。
      scaleDenominator: { values: [25000, 40000, 50000, 100000] },
      mapLength: { min: 2, max: 18, step: 1 }
    },
    generatorType: "findMapLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "km",
      unknown: "mapLength"
    },
    solutionRoutes: [
      {
        id: "convert-then-divide-route",
        steps: [
          { left: { source: "variable", key: "actualLength" }, operator: "×", right: { source: "literal", value: 100000 }, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "answer" }
        ]
      },
      {
        // 先に「変換係数(100000)÷縮尺の分母」で比を求めてから、実際の長さにかけるルート
        // （運用開始後に追加。1つ目の式の選択肢カードに縮尺の分母・実際の長さ・変換係数(100000)の
        // 3枚が必ずそろうようにするため）。
        id: "ratio-then-multiply-route",
        steps: [
          { left: { source: "literal", value: 100000 }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "ratio" },
          { left: { source: "result", key: "ratio" }, operator: "×", right: { source: "variable", key: "actualLength" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "cm"
  },
  {
    id: "g6t3_scale_map_005",
    gradeTerm: "6-3",
    category: "縮尺・地図上の長さ",
    categoryId: "scale-find-map-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の体育館の設計図があります。実際の長さが{actualLength}mのかべは、設計図では何cmですか。",
    variables: {
      scaleDenominator: { values: [100, 150, 200, 250] },
      mapLength: { min: 2, max: 14, step: 1 }
    },
    generatorType: "findMapLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "m",
      unknown: "mapLength"
    },
    solutionRoutes: [
      {
        id: "convert-then-divide-route",
        steps: [
          { left: { source: "variable", key: "actualLength" }, operator: "×", right: { source: "literal", value: 100 }, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "answer" }
        ]
      },
      {
        // 先に「実際の長さ÷縮尺の分母」で地図上の長さをm単位のまま求めてから、最後に
        // ×100でcmへ変換するルート（運用開始後に追加。1つ目の式の選択肢カードに
        // 縮尺の分母・実際の長さ・変換係数(100)の3枚が必ずそろうようにするため）。
        id: "divide-then-convert-route",
        steps: [
          { left: { source: "variable", key: "actualLength" }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "mapLengthInActualUnit" },
          { left: { source: "result", key: "mapLengthInActualUnit" }, operator: "×", right: { source: "literal", value: 100 }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "cm"
  },
  {
    id: "g6t3_scale_map_006",
    gradeTerm: "6-3",
    category: "縮尺・地図上の長さ",
    categoryId: "scale-find-map-length",
    contentGroup: "new",
    difficulty: 3,
    questionType: "multiStep",
    totalSteps: 2,
    template: "縮尺{scaleValue}の山道の地図があります。実際の長さが{actualLength}kmの登山道は、地図上では何cmですか。",
    variables: {
      scaleDenominator: { values: [20000, 25000, 40000, 50000] },
      mapLength: { min: 2, max: 16, step: 1 }
    },
    generatorType: "findMapLengthFromScale",
    quantityRelation: {
      type: "scale-length",
      scaleKey: "scaleDenominator",
      mapLengthKey: "mapLength",
      actualLengthKey: "actualLength",
      actualLengthUnit: "km",
      unknown: "mapLength"
    },
    solutionRoutes: [
      {
        id: "convert-then-divide-route",
        steps: [
          { left: { source: "variable", key: "actualLength" }, operator: "×", right: { source: "literal", value: 100000 }, resultKey: "actualLengthInCm" },
          { left: { source: "result", key: "actualLengthInCm" }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "answer" }
        ]
      },
      {
        // 先に「変換係数(100000)÷縮尺の分母」で比を求めてから、実際の長さにかけるルート
        // （運用開始後に追加。1つ目の式の選択肢カードに縮尺の分母・実際の長さ・変換係数(100000)の
        // 3枚が必ずそろうようにするため）。
        id: "ratio-then-multiply-route",
        steps: [
          { left: { source: "literal", value: 100000 }, operator: "÷", right: { source: "variable", key: "scaleDenominator" }, resultKey: "ratio" },
          { left: { source: "result", key: "ratio" }, operator: "×", right: { source: "variable", key: "actualLength" }, resultKey: "answer" }
        ]
      }
    ],
    answerUnit: "cm"
  }
];
