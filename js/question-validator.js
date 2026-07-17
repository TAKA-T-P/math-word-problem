// 問題テンプレート・生成済み問題を検証するモジュール。
// ゲーム本体（question-generator.js / game.js）と、開発者用の検証ページ
// （tools/question-validator.html）の両方から使われる、副作用のない純粋関数群です。

import { safeCalculate } from "./answer-checker.js";
import {
  areValuesEqual,
  isValueNegative,
  isFractionValue,
  isValidFraction,
  isPercentValue,
  isValidPercent,
  isRatioValue,
  isZeroValue,
  divideValuesAsFraction
} from "./value-utils.js";
import { areNumbersEqual, getDecimalPlaces, formatNumber, parseFormattedNumber } from "./number-utils.js";
import { renderValueHtml, buildFractionAriaLabel, buildRatioAriaLabel } from "./value-renderer.js";
import { ratioToPercent } from "./percentage-utils.js";
import { isValidRatio } from "./ratio-utils.js";
import { gcd } from "./fraction-utils.js";

// このアプリで扱う小数点以下の最大桁数（4.15 のような2桁まで）。
// これを超える場合は「小学4年生として不自然」と判断してエラーにします。
const MAX_REASONABLE_DECIMAL_PLACES = 2;

// 分数の分母として許容する範囲（小学4年生として不自然に大きな分母を避けるため）。
const MIN_REASONABLE_FRACTION_DENOMINATOR = 2;
const MAX_REASONABLE_FRACTION_DENOMINATOR = 12;

// 帯分数機能（fractionDisplayMode="mixed" / variables内のtype:"mixedFraction"）の使用を許可する
// カテゴリID（第11段階：同分母分数のたし算・ひき算への帯分数追加で追加）。
// この2カテゴリ以外に帯分数機能が漏れて登録されていないかを検証するために使用します。
const MIXED_NUMBER_ALLOWED_CATEGORY_IDS = new Set([
  "same-denominator-fraction-addition",
  "same-denominator-fraction-subtraction"
]);

// mixedNumberPattern（デバッグ表示・品質確認ツール専用のメタ情報）として許容する値。
const VALID_MIXED_NUMBER_PATTERNS = new Set([
  "addition-no-carry",
  "addition-with-carry",
  "subtraction-no-borrow",
  "subtraction-with-borrow"
]);

/**
 * テンプレートが帯分数機能を使用しているかどうかを判定します
 * （fractionDisplayMode="mixed"、または variables のいずれかが type:"mixedFraction"）。
 */
function usesMixedNumberFeature(template) {
  if (template.fractionDisplayMode === "mixed") return true;
  const variables = template.variables;
  if (variables && typeof variables === "object") {
    for (const range of Object.values(variables)) {
      if (range && typeof range === "object" && range.type === "mixedFraction") return true;
    }
  }
  return false;
}

// 現在 data/index.js に登録されている出題範囲キー。新しい学期を追加したら、
// ここにも追加してください（data/index.js から自動取得すると循環参照になりやすいため、
// 検証専用の一覧として独立させています）。
const VALID_GRADE_TERMS = ["4-1", "4-2", "4-3", "4-multi-step", "5-1", "5-2", "5-3", "6-1", "6-2", "6-3"];

// generatorType がこの集合に含まれるときだけ、生成された分数の分母が一致しているかを確認する
// （異分母分数のたし算・ひき算には適用しない。第8段階で追加）。
const SAME_DENOMINATOR_GENERATOR_TYPES = new Set([
  "sameDenominatorFractionAddition",
  "sameDenominatorFractionSubtraction"
]);

export const VALID_OPERATORS = ["+", "-", "×", "÷"];
export const VALID_QUESTION_TYPES = ["singleStep", "multiStep"];

// template（{変数名}を埋め込んだ文字列）と textParts（文字列/値パーツの配列）は、
// どちらか一方があればよい（両方必須ではない）ため、REQUIRED_TEMPLATE_FIELDS には含めず、
// validateTemplate() 内で個別にチェックします。
export const REQUIRED_TEMPLATE_FIELDS = [
  "id",
  "gradeTerm",
  "category",
  "difficulty",
  "questionType",
  "variables",
  "generatorType",
  "solutionRoutes",
  "answerUnit"
];

// generatorType ごとに、追加で必要な変数キーと「自動計算される変数名」を定義する。
// 自動計算される変数（例: exactDivision の dividend）は、variables には存在しないが
// テンプレート文や solutionRoutes から参照してよい。
const GENERATOR_TYPE_RULES = {
  standard: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  // decimalAddition / decimalSubtraction / decimalTimesInteger は standard のエイリアス（生成戦略は同じ）。
  decimalAddition: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  decimalSubtraction: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  decimalTimesInteger: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  exactDivision: {
    requiredVariableKeys: ["divisor", "quotient"],
    computedVariables: ["dividend"],
    divisorRange: { min: 2, max: 9 } // わる数は1けた
  },
  exactDivisionTwoDigit: {
    requiredVariableKeys: ["divisor", "quotient"],
    computedVariables: ["dividend"],
    divisorRange: { min: 10, max: 99 } // わる数は2けた
  },
  exactDecimalDivisionByInteger: {
    requiredVariableKeys: ["divisor", "quotient"],
    computedVariables: ["dividend"],
    divisorRange: { min: 2, max: 9 } // わる数は整数(1けた)
  },
  multiStepDivideFirst: {
    requiredVariableKeys: ["divisor", "quotient"],
    computedVariables: ["dividend"]
  },
  multiStepSumToDivisible: {
    requiredVariableKeys: ["divisor", "quotient", "a"],
    computedVariables: ["b", "sum"]
  },
  // 分数どうしのたし算・ひき算は、a・bという名前の分数型変数を直接使う（自動計算される変数は無い）。
  sameDenominatorFractionAddition: {
    requiredVariableKeys: ["a", "b"],
    computedVariables: [],
    isFractionGenerator: true
  },
  sameDenominatorFractionSubtraction: {
    requiredVariableKeys: ["a", "b"],
    computedVariables: [],
    isFractionGenerator: true
  },
  // 小数×小数（小学5年生1学期）。standard と同じ独立生成戦略のエイリアス。
  decimalTimesDecimal: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  // 小数÷小数（小学5年生1学期）。わる数(divisor)・商(quotient)から、わられる数(dividend)を
  // 自動計算する点は exactDecimalDivisionByInteger と同じ（わる数も小数になる点だけが異なる）。
  exactDecimalDivisionByDecimal: {
    requiredVariableKeys: ["divisor", "quotient"],
    computedVariables: ["dividend"]
  },
  // 小数倍・もとの量（小学5年生1学期）は、必要な変数キーがテンプレートごとに異なる
  // （quantityRelation.baseKey / multiplierKey で指定される）ため、GENERATOR_TYPE_RULES の
  // 固定リストでは表現できない。requiresQuantityRelation フラグを立て、
  // validateQuantityRelation() で個別に検証する。
  decimalMultiplicativeComparison: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  decimalOriginalQuantity: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  // 異分母分数のたし算・ひき算（小学5年生2学期）は、a・bという名前の分数型変数を直接使う点は
  // 同分母分数と同じですが、分母が異なる必要があるため requiresUnlikeDenominators で
  // 個別に検証します（同分母のときのような isFractionGenerator フラグは使いません。
  // これは validateSameDenominatorFractionRanges が「分母が同じであること」を要求するため、
  // 異分母のテンプレートに適用すると誤ってエラーになってしまうからです）。
  unlikeDenominatorFractionAddition: {
    requiredVariableKeys: ["a", "b"],
    computedVariables: [],
    requiresUnlikeDenominators: true
  },
  unlikeDenominatorFractionSubtraction: {
    requiredVariableKeys: ["a", "b"],
    computedVariables: [],
    requiresUnlikeDenominators: true,
    requiresNonNegativeUnlikeDenominatorSubtraction: true
  },
  // 平均（小学5年生2学期）は、小数倍・もとの量と同じ理由（キー名がテンプレートごとに
  // quantityRelation で指定される）で requiresQuantityRelation を使います。
  averageFromTotal: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  totalFromAverage: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  // 2つの数の平均（小学5年生2学期、2段階問題）。multiStepSumToDivisible と全く同じ形の
  // ルール（divisor・quotient・a を必須とし、b・sum が自動計算される）です。
  averageOfTwoValues: {
    requiredVariableKeys: ["divisor", "quotient", "a"],
    computedVariables: ["b", "sum"]
  },
  // 単位量あたり・混み具合（小学5年生2学期）。
  unitRate: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  totalFromUnitRate: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  // 速さ・道のり・時間（小学5年生3学期）は、キー名がテンプレートごとに quantityRelation で
  // 指定されるため、平均・単位量あたりと同じ理由で requiresQuantityRelation を使います。
  findSpeed: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  findDistance: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  findTime: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  // 割合（比べる量・割合・もとにする量。小学5年生3学期）も同様です。
  percentageFindCompared: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  percentageFindRate: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  percentageFindBase: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  // 割引・増量（小学5年生3学期、2段階問題）は standard のエイリアス（originalPrice・
  // discountRate/increaseRate という名前もテンプレートごとに変わりうるため、
  // 固定の必須キーは指定しません。quantityRelation も使いません＝2つのルートの最終結果が
  // 一致するかどうかは、既存の「solutionRoutes間で最終的な答えが一致するか」検証がそのまま使えます）。
  discountTwoStep: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  increaseTwoStep: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  // 分数×整数・分数×分数・分数÷整数・整数÷分数・分数÷分数（小学6年生1学期、第10段階で追加）は
  // standard のエイリアスのため、固定の必須キーは無い（variables のキー名はテンプレートごとに変わる）。
  fractionTimesInteger: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  fractionTimesFraction: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  fractionDividedByInteger: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  integerDividedByFraction: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  fractionDividedByFraction: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  // 分数倍・比べる量／分数倍・もとの量（小学6年生1学期、第10段階で追加）は、
  // 速さ・割合と同じ理由（キー名がquantityRelationで動的に決まる）で requiresQuantityRelation を使う。
  fractionMultiplierFindCompared: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  fractionMultiplierFindBase: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  // 単位量あたり・分数版（小学6年生1学期へ後日追加）。
  fractionUnitRate: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  // 分数の速さ・道のり・時間（小学6年生2学期、第11段階で追加、2段階問題）。
  // distance/minutes/speed のうちどの2つが variables に定義されるかはテンプレートごとに
  // 異なる（速さを求める→distance・minutes、道のりを求める→speed・minutes、
  // 時間を求める→distance・speed）ため、既存の「常に同じ2キーを既知として扱う」
  // QUANTITY_RELATION_TYPE_CONFIG の型には当てはまらない。そのため
  // requiresQuantityRelation ではなく、専用の requiresSpeedUnitConversionShape で
  // validateSpeedWithUnitConversion() による個別の構造検証を行う。
  fractionSpeedWithMinuteConversion: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresSpeedUnitConversionShape: true
  },
  fractionDistanceWithMinuteConversion: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresSpeedUnitConversionShape: true
  },
  // 「分数の時間」だけは、答え（分）を必ず整数にするため専用の生成ルールを使い、
  // variables.answerMinutes（きりのよい分の一覧）から答えを選んでから速さを逆算する
  // （generateFractionTimeWithMinuteConversionValues() 参照。第11段階で追加）。
  fractionTimeWithMinuteConversion: {
    requiredVariableKeys: ["answerMinutes"],
    computedVariables: [],
    requiresSpeedUnitConversionShape: true
  },
  // 分数割合（比べる量・割合・もとにする量。小学6年生2学期、第11段階で追加）は、
  // 速さ・割合と同じ理由（キー名がquantityRelationで動的に決まる）で requiresQuantityRelation を使う。
  fractionRateFindCompared: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  fractionRateFindRate: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  fractionRateFindBase: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresQuantityRelation: true
  },
  // 比を使った数量（小学6年生2学期、第11段階で追加、2段階問題）。
  // variables には firstRatio・secondRatio・unitAmount（1あたりの量。問題文には出てこない
  // 生成専用の変数）に加えて firstAmount・secondAmount のどちらか一方（既知の側）が定義される
  // ため、こちらも固定の2キー構成に当てはまらない。専用の requiresRatioApplicationShape で
  // validateRatioApplication() による個別の構造検証を行う。
  ratioApplication: {
    requiredVariableKeys: ["unitAmount"],
    // ratioValue（問題文に表示する比そのもの）は variables には定義されない、
    // 生成関数が常に追加する固定名の計算値のため、computedVariables に登録しておく。
    computedVariables: ["ratioValue"],
    requiresRatioApplicationShape: true
  },
  // 比例配分（小学6年生2学期、第11段階で追加、3段階問題）。
  proportionalAllocation: {
    requiredVariableKeys: ["unitAmount"],
    computedVariables: ["ratioValue"],
    requiresProportionalAllocationShape: true
  },
  // 比例・対応する量／反比例・対応する量（小学6年生3学期、第12段階で追加、2段階問題）。
  // knownX・targetX（＋反比例は一定の積を作るための隠し変数 scaleFactor）が variables に
  // 定義される一方、knownY・targetY・比例定数／一定の積は生成時に自動計算される値のため、
  // 固定の2キー構成に当てはまらない。専用の requiresDirectProportionShape /
  // requiresInverseProportionShape で個別の構造検証を行う。
  findDirectProportionValue: {
    requiredVariableKeys: [],
    computedVariables: [],
    requiresDirectProportionShape: true
  },
  findInverseProportionValue: {
    requiredVariableKeys: ["scaleFactor"],
    computedVariables: [],
    requiresInverseProportionShape: true
  },
  // 縮尺・実際の長さ／縮尺・地図上の長さ（小学6年生3学期、第12段階で追加、2段階問題。
  // 「縮尺を求める」カテゴリは運用開始後に削除しました）。速さ・道のり・時間
  // （fractionSpeedWithMinuteConversion等）と同じ理由で、どの量が「未知」かによって
  // variables に定義されるキーの組み合わせが変わるため、requiresScaleLengthShape で
  // validateScaleLength() による個別の構造検証を行う。
  findActualLengthFromScale: {
    requiredVariableKeys: [],
    computedVariables: ["scaleValue"],
    requiresScaleLengthShape: true
  },
  findMapLengthFromScale: {
    requiredVariableKeys: [],
    computedVariables: ["scaleValue"],
    requiresScaleLengthShape: true
  }
};

// 多段階問題（questionType:"multiStep"）の式の数は、1〜3個の範囲に限定する
// （小学6年生2学期・第11段階で、2段階固定から1〜3段階へ拡張。4段階以上の問題は今回出題しない）。
const MIN_MULTI_STEP_COUNT = 1;
const MAX_MULTI_STEP_COUNT = 3;

export const VALID_GENERATOR_TYPES = Object.keys(GENERATOR_TYPE_RULES);

function extractPlaceholders(templateText) {
  const matches = templateText.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

function getGeneratorRule(generatorType) {
  return GENERATOR_TYPE_RULES[generatorType] || { requiredVariableKeys: [], computedVariables: [] };
}

/**
 * 2段階問題の {source:"literal", value} が持つ固定値として妥当かどうかを判定します
 * （第9段階で追加。割引・増量の「100%」のような、どの変数にも対応しない定数の検証用）。
 * 数値・分数・百分率のいずれかであれば妥当とみなします。
 */
function isValidLiteralOperandValue(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (isValidFraction(value)) return true;
  if (isValidPercent(value)) return true;
  return false;
}

/**
 * question-generator.js の computeStepResult() と同じ変換を、検証側でも独立に再現します
 * （第9段階で百分率、第11段階で分数を追加）。question-generator.js から直接 import すると
 * 循環参照になるため、この小さな純粋関数だけを重複して持たせています。
 * resultType:"percent" が指定されている場合、safeCalculate() の生の計算結果（例: 0.3）を
 * 百分率（30%）に変換してから期待値と比較しないと、「0.3 と 30% は一致しない」という
 * 誤判定になってしまいます。resultType:"fraction" が指定されている場合も同様に、
 * 「割り切れる場合だけ商を返す」通常のわり算ではなく、divideValuesAsFraction() で
 * 独立に再計算しないと、20÷60 のような組み合わせを「計算不能」と誤判定してしまいます。
 */
function computeStepResultForValidation(left, operator, right, resultType) {
  if (resultType === "fraction" && operator === "÷") {
    const forced = divideValuesAsFraction(left, right);
    if (forced !== null) return forced;
  }
  const result = safeCalculate(left, operator, right);
  if (resultType === "percent" && typeof result === "number") {
    return ratioToPercent(result);
  }
  return result;
}

// quantityRelation.type ごとに、「既知（生成元）の値を指すフィールド名」2つと
// 「自動計算される値を指すフィールド名」1つ、そして unknown に許される値を定義します
// （第8段階で average・unit-rate を追加し、汎用化しました）。
//   - "multiplicative-comparison"（小数倍・もとの量）: base×multiplier=compared
//   - "average"（平均）                              : count×average=total
//   - "unit-rate"（単位量あたり・混み具合）            : unitCount×perUnit=total
const QUANTITY_RELATION_TYPE_CONFIG = {
  "multiplicative-comparison": {
    knownKeyFields: ["baseKey", "multiplierKey"],
    computedKeyField: "comparedKey",
    unknownValues: ["base", "compared", "multiplier"]
  },
  average: {
    knownKeyFields: ["countKey", "averageKey"],
    computedKeyField: "totalKey",
    unknownValues: ["total", "count", "average"]
  },
  "unit-rate": {
    knownKeyFields: ["unitCountKey", "perUnitKey"],
    computedKeyField: "totalKey",
    unknownValues: ["total", "unitCount", "perUnit"]
  },
  // 速さ（小学5年生3学期）: 速さ×時間＝道のり
  speed: {
    knownKeyFields: ["speedKey", "timeKey"],
    computedKeyField: "distanceKey",
    unknownValues: ["distance", "speed", "time"]
  },
  // 割合（小学5年生3学期）: もとにする量×割合＝比べる量
  percentage: {
    knownKeyFields: ["baseKey", "rateKey"],
    computedKeyField: "comparedKey",
    unknownValues: ["compared", "rate", "base"]
  },
  // 分数倍（小学6年生1学期、第10段階で追加）: もとにする量×分数倍＝比べる量
  "fraction-multiplicative-comparison": {
    knownKeyFields: ["baseKey", "multiplierKey"],
    computedKeyField: "comparedKey",
    unknownValues: ["base", "compared", "multiplier"]
  },
  // 単位量あたり・分数版（小学6年生1学期へ後日追加）: 単位数×1単位あたりの量＝全体量
  "fraction-unit-rate": {
    knownKeyFields: ["unitCountKey", "perUnitKey"],
    computedKeyField: "totalKey",
    unknownValues: ["total", "unitCount", "perUnit"]
  },
  // 分数割合（小学6年生2学期、第11段階で追加）: もとにする量×分数割合＝比べる量
  "fraction-rate": {
    knownKeyFields: ["baseKey", "rateKey"],
    computedKeyField: "comparedKey",
    unknownValues: ["compared", "rate", "base"]
  }
};

/**
 * テンプレート文・textParts・solutionRoutes から参照してよい「既知の変数名」の集合を求めます。
 * variables のキー・generatorType が自動計算する変数（rule.computedVariables）に加えて、
 * quantityRelation を持つテンプレート（小数倍・もとの量・平均・単位量あたり・混み具合）では、
 * その「自動計算される値」を指すフィールド（例: comparedKey、totalKey）が指す変数名も
 * 「既知」として扱います。このフィールドが指す実際のキー名（例: "blueLength"）は
 * テンプレートごとに異なるため、GENERATOR_TYPE_RULES の computedVariables のような
 * 固定リストでは表現できません。
 */
function getKnownVariableKeys(template, rule) {
  const keys = new Set([
    ...(template.variables && typeof template.variables === "object" ? Object.keys(template.variables) : []),
    ...(rule ? rule.computedVariables : [])
  ]);
  const qr = template.quantityRelation;
  if (qr && typeof qr === "object") {
    const config = QUANTITY_RELATION_TYPE_CONFIG[qr.type];
    if (config) {
      keys.add(qr[config.computedKeyField]);
    } else {
      // QUANTITY_RELATION_TYPE_CONFIG に登録されていない type（比を使った数量・比例配分など、
      // 「既知の2キー＋自動計算の1キー」という固定パターンに当てはまらない専用の型。第11段階で追加）は、
      // quantityRelation オブジェクトの "○○Key" という名前のフィールドすべてを既知の変数名として
      // 扱う（firstRatioKey・secondRatioKey のように variables に実在するキーを指すものは
      // 重複登録になるだけで無害、firstAmountKey・secondAmountKey・totalKey のように
      // 生成時に自動計算されるキーを指すものはここで初めて「既知」として認識される）。
      for (const [field, value] of Object.entries(qr)) {
        if (field.endsWith("Key") && typeof value === "string") {
          keys.add(value);
        }
      }
    }
  }
  return keys;
}

/**
 * quantityRelation を持つテンプレート（小数倍・もとの量・平均・単位量あたり・混み具合）の
 * quantityRelation を検証します。「既知（生成元）」の2つのキーは variables に存在する必要があり、
 * 「自動計算される」1つのキーは（動的に計算される値のため）逆に variables に含めてはいけません。
 */
function validateQuantityRelation(template, errors) {
  const qr = template.quantityRelation;
  if (!qr || typeof qr !== "object") {
    errors.push(`generatorType="${template.generatorType}" には quantityRelation が必要です`);
    return;
  }
  const config = QUANTITY_RELATION_TYPE_CONFIG[qr.type];
  if (!config) {
    errors.push(
      `quantityRelation.type が不正です: ${qr.type}` +
        `（"multiplicative-comparison"／"average"／"unit-rate"／"speed"／"percentage"／` +
        `"fraction-multiplicative-comparison"／"fraction-unit-rate"／"fraction-rate" のいずれか）`
    );
    return;
  }

  const allKeyFields = [...config.knownKeyFields, config.computedKeyField];
  for (const field of allKeyFields) {
    if (typeof qr[field] !== "string" || qr[field].length === 0) {
      errors.push(`quantityRelation.${field} が文字列で指定されていません`);
    }
  }
  if (!config.unknownValues.includes(qr.unknown)) {
    errors.push(
      `quantityRelation.unknown が不正です: ${qr.unknown}（${config.unknownValues.map((v) => `"${v}"`).join("／")} のいずれか）`
    );
  }

  const hasVariables = template.variables && typeof template.variables === "object";
  for (const field of config.knownKeyFields) {
    const key = qr[field];
    if (hasVariables && typeof key === "string" && !(key in template.variables)) {
      errors.push(`quantityRelation.${field} が variables に存在しません: ${key}`);
    }
  }
  const computedKey = qr[config.computedKeyField];
  if (hasVariables && typeof computedKey === "string" && computedKey in template.variables) {
    errors.push(
      `quantityRelation.${config.computedKeyField} は生成時に自動計算される値です。variables に含めないでください: ${computedKey}`
    );
  }

  const allKeyValues = allKeyFields.map((field) => qr[field]).filter((v) => typeof v === "string");
  if (allKeyValues.length === allKeyFields.length && new Set(allKeyValues).size !== allKeyFields.length) {
    errors.push(`quantityRelation の${allKeyFields.map((f) => `${f}`).join("・")}が重複しています`);
  }

  // 平均の「個数」は、必ず正の整数である必要があります（0.5人のような値は不自然なため）。
  if (qr.type === "average" && hasVariables && typeof qr.countKey === "string") {
    const countRange = template.variables[qr.countKey];
    if (countRange && (countRange.type === "fraction" || countRange.decimalPlaces > 0)) {
      errors.push(`quantityRelation.countKey（個数）は整数である必要があります: ${qr.countKey}`);
    }
  }
}

/**
 * 分数の速さ・道のり・時間（quantityRelation.type:"speed-with-unit-conversion"）専用の構造検証です
 * （小学6年生2学期、第11段階で追加）。distance/minuteTime/speedのうち「既知」の2つは
 * テンプレートごとに異なる（速さを求める問題ではdistance・minutes、道のりを求める問題では
 * speed・minutes、時間を求める問題ではdistance・speed）ため、既存の
 * QUANTITY_RELATION_TYPE_CONFIG（常に同じ2キーを既知として扱う）には当てはまらず、
 * 個別にこの関数で検証します。
 * - 必ず2段階問題（multiStep、steps.length===2）であること
 * - 必ず2つの解法ルートを持つこと（依頼文の「原則として2つの正解ルートを登録する」）
 * - 少なくとも1つのステップが「60」を使った単位変換（source:"literal", value:60）であること
 */
function validateSpeedWithUnitConversion(template, errors) {
  const qr = template.quantityRelation;
  if (!qr || typeof qr !== "object" || qr.type !== "speed-with-unit-conversion") {
    errors.push(`generatorType="${template.generatorType}" には quantityRelation.type:"speed-with-unit-conversion" が必要です`);
    return;
  }
  for (const field of ["distanceKey", "minuteTimeKey", "speedKey"]) {
    if (typeof qr[field] !== "string" || qr[field].length === 0) {
      errors.push(`quantityRelation.${field} が文字列で指定されていません`);
    }
  }
  if (!["distance", "minuteTime", "speed"].includes(qr.unknown)) {
    errors.push(`quantityRelation.unknown が不正です: ${qr.unknown}（"distance"／"minuteTime"／"speed" のいずれか）`);
  }

  if (template.questionType !== "multiStep") {
    errors.push(`generatorType="${template.generatorType}" は questionType:"multiStep" である必要があります`);
    return;
  }
  if (!Array.isArray(template.solutionRoutes) || template.solutionRoutes.length !== 2) {
    errors.push(
      `generatorType="${template.generatorType}" には2つの解法ルートが必要です（実際: ${Array.isArray(template.solutionRoutes) ? template.solutionRoutes.length : 0}）`
    );
  }
  if (!Array.isArray(template.solutionRoutes)) return;

  for (const route of template.solutionRoutes) {
    if (!route || !Array.isArray(route.steps)) continue;
    if (route.steps.length !== 2) {
      errors.push(`[${route.id}] 分数の速さ・道のり・時間は必ず2段階である必要があります（実際: ${route.steps.length}）`);
    }
    const hasMinuteConversion = route.steps.some(
      (step) =>
        step &&
        (isLiteralOperand(step.left, 60) || isLiteralOperand(step.right, 60))
    );
    if (!hasMinuteConversion) {
      errors.push(`[${route.id}] 時間と分の単位変換（60を使ったステップ）が見つかりません`);
    }
  }
}

/**
 * 比を使った数量（quantityRelation.type:"ratio-application"）専用の構造検証です
 * （小学6年生2学期、第11段階で追加）。
 * - firstRatioKey・secondRatioKey は variables に存在すること
 * - firstAmountKey・secondAmountKey は（生成時に自動計算される値のため）variables に
 *   含めないこと
 * - known/unknown が firstAmount/secondAmount の組み合わせであること
 * - 必ず2段階問題（steps.length===2）であること
 */
function validateRatioApplication(template, errors) {
  const qr = template.quantityRelation;
  if (!qr || typeof qr !== "object" || qr.type !== "ratio-application") {
    errors.push(`generatorType="${template.generatorType}" には quantityRelation.type:"ratio-application" が必要です`);
    return;
  }
  const hasVariables = template.variables && typeof template.variables === "object";
  for (const field of ["firstRatioKey", "secondRatioKey", "firstAmountKey", "secondAmountKey"]) {
    if (typeof qr[field] !== "string" || qr[field].length === 0) {
      errors.push(`quantityRelation.${field} が文字列で指定されていません`);
    }
  }
  if (hasVariables) {
    for (const field of ["firstRatioKey", "secondRatioKey"]) {
      const key = qr[field];
      if (typeof key === "string" && !(key in template.variables)) {
        errors.push(`quantityRelation.${field} が variables に存在しません: ${key}`);
      }
    }
    for (const field of ["firstAmountKey", "secondAmountKey"]) {
      const key = qr[field];
      if (typeof key === "string" && key in template.variables) {
        errors.push(`quantityRelation.${field} は生成時に自動計算される値です。variables に含めないでください: ${key}`);
      }
    }
  }
  const validSides = ["firstAmount", "secondAmount"];
  if (!validSides.includes(qr.known) || !validSides.includes(qr.unknown) || qr.known === qr.unknown) {
    errors.push(
      `quantityRelation.known/unknown が不正です: known=${qr.known}, unknown=${qr.unknown}（"firstAmount"／"secondAmount" の異なる組み合わせである必要があります）`
    );
  }

  if (template.questionType !== "multiStep") {
    errors.push(`generatorType="${template.generatorType}" は questionType:"multiStep" である必要があります`);
    return;
  }
  if (!Array.isArray(template.solutionRoutes)) return;

  // 標準ルート（standard-two-step-route）に加えて、「未知の比の項÷既知の比の項＝何倍か」→
  // 「既知の量×何倍か＝答え」という別解ルート（multiplier-first-route）を任意で登録できます
  // （運用開始後に追加。比例・対応する量の multiplier-first-route と同じ考え方。
  // 例:「犬とねこの比は4：3、ねこ15頭のとき犬は？」で `4÷3=4/3→15×4/3=20`）。
  const REQUIRED_ROUTE_IDS = ["standard-two-step-route"];
  const OPTIONAL_ROUTE_IDS = ["multiplier-first-route"];
  const ALLOWED_ROUTE_IDS = [...REQUIRED_ROUTE_IDS, ...OPTIONAL_ROUTE_IDS];
  const routeIds = template.solutionRoutes.map((route) => route && route.id);
  for (const requiredId of REQUIRED_ROUTE_IDS) {
    if (!routeIds.includes(requiredId)) {
      errors.push(`比を使った数量には正解ルート "${requiredId}" が必要です`);
    }
  }
  for (const id of routeIds) {
    if (!ALLOWED_ROUTE_IDS.includes(id)) {
      errors.push(
        `比を使った数量の正解ルートIDが不正です: ${id}（"standard-two-step-route"／"multiplier-first-route" のいずれかである必要があります）`
      );
    }
  }

  const knownAmountKey = typeof qr.known === "string" ? qr[`${qr.known}Key`] : undefined;
  const knownRatioKey = qr.known === "firstAmount" ? qr.firstRatioKey : qr.secondRatioKey;
  const unknownRatioKey = qr.known === "firstAmount" ? qr.secondRatioKey : qr.firstRatioKey;

  for (const route of template.solutionRoutes) {
    if (!route || !Array.isArray(route.steps)) continue;
    if (route.steps.length !== 2) {
      errors.push(`[${route.id}] 比を使った数量は必ず2段階である必要があります（実際: ${route.steps.length}）`);
      continue;
    }
    if (route.id === "multiplier-first-route") {
      const [step1, step2] = route.steps;
      const operators = route.steps.map((s) => s && s.operator).join(",");
      if (operators !== "÷,×") {
        errors.push(
          `[multiplier-first-route] 演算記号の順序が想定と異なります: ${operators}（"÷,×"＝何倍かを先に求める、である必要があります）`
        );
      }
      if (!step1 || step1.resultType !== "fraction") {
        errors.push(
          `[multiplier-first-route] 1つ目の式には resultType:"fraction" が必要です（割り切れない場合でも何倍かを分数のまま扱うため）`
        );
      }
      if (
        knownRatioKey &&
        unknownRatioKey &&
        !(step1 && step1.left && step1.left.key === unknownRatioKey && step1.right && step1.right.key === knownRatioKey)
      ) {
        errors.push(
          `[multiplier-first-route] 1つ目の式は「未知の比の項(${unknownRatioKey})÷既知の比の項(${knownRatioKey})」である必要があります`
        );
      }
      if (knownAmountKey && !(step2 && step2.left && step2.left.key === knownAmountKey)) {
        errors.push(`[multiplier-first-route] 2つ目の式の左辺は既知の量(${knownAmountKey})である必要があります`);
      }
    }
  }
}

/**
 * 比例配分（quantityRelation.type:"proportional-allocation"）専用の構造検証です
 * （小学6年生2学期、第11段階で追加）。
 * - firstRatioKey・secondRatioKey は variables に存在すること
 * - totalKey は（生成時に自動計算される値のため）variables に含めないこと
 * - target が "first"／"second" のいずれかであること
 * - 必ず3段階問題（steps.length===3）で、式1が「＋」、式2が「÷」、式3が「×」であること
 *   （依頼文の「比の和→1あたりの量→対象の比の項」という順序どおりであることを確認する）
 */
function validateProportionalAllocation(template, errors) {
  const qr = template.quantityRelation;
  if (!qr || typeof qr !== "object" || qr.type !== "proportional-allocation") {
    errors.push(`generatorType="${template.generatorType}" には quantityRelation.type:"proportional-allocation" が必要です`);
    return;
  }
  const hasVariables = template.variables && typeof template.variables === "object";
  for (const field of ["firstRatioKey", "secondRatioKey", "totalKey"]) {
    if (typeof qr[field] !== "string" || qr[field].length === 0) {
      errors.push(`quantityRelation.${field} が文字列で指定されていません`);
    }
  }
  if (hasVariables) {
    for (const field of ["firstRatioKey", "secondRatioKey"]) {
      const key = qr[field];
      if (typeof key === "string" && !(key in template.variables)) {
        errors.push(`quantityRelation.${field} が variables に存在しません: ${key}`);
      }
    }
    if (typeof qr.totalKey === "string" && qr.totalKey in template.variables) {
      errors.push(`quantityRelation.totalKey は生成時に自動計算される値です。variables に含めないでください: ${qr.totalKey}`);
    }
  }
  if (!["first", "second"].includes(qr.target)) {
    errors.push(`quantityRelation.target が不正です: ${qr.target}（"first"／"second" のいずれか）`);
  }

  if (template.questionType !== "multiStep") {
    errors.push(`generatorType="${template.generatorType}" は questionType:"multiStep" である必要があります`);
    return;
  }
  if (!Array.isArray(template.solutionRoutes)) return;

  // 標準ルート（standard-three-step-route。比の和→1あたりの量→対象の比の項）に加えて、
  // 「対象の比の項÷比の和＝何倍か」→「合計×何倍か＝答え」という別解ルート
  // （ratio-fraction-route）を任意で登録できます（運用開始後に追加。例:
  // 「布28mを4：3に分ける、白い布は？」で `4+3=7→4÷7=4/7→28×4/7=16`）。どちらのルートも
  // 演算記号の並びが「+,÷,×」で同じになるため、並びだけでルートの種類を判定せず、
  // ルートIDごとに参照している変数・resultTypeまで個別に検証します。依頼文で明示的に
  // 禁止されている「合計÷片方の比の項×もう片方の比の項」という2段階のショートカット計算は、
  // そもそも3段階（steps.length===3）の要件を満たさないため、このチェックだけで
  // 自動的に排除されます。
  const REQUIRED_ROUTE_IDS = ["standard-three-step-route"];
  const OPTIONAL_ROUTE_IDS = ["ratio-fraction-route"];
  const ALLOWED_ROUTE_IDS = [...REQUIRED_ROUTE_IDS, ...OPTIONAL_ROUTE_IDS];
  const routeIds = template.solutionRoutes.map((route) => route && route.id);
  for (const requiredId of REQUIRED_ROUTE_IDS) {
    if (!routeIds.includes(requiredId)) {
      errors.push(`比例配分には正解ルート "${requiredId}" が必要です`);
    }
  }
  for (const id of routeIds) {
    if (!ALLOWED_ROUTE_IDS.includes(id)) {
      errors.push(
        `比例配分の正解ルートIDが不正です: ${id}（"standard-three-step-route"／"ratio-fraction-route" のいずれかである必要があります）`
      );
    }
  }

  const targetRatioKey = qr.target === "first" ? qr.firstRatioKey : qr.secondRatioKey;

  for (const route of template.solutionRoutes) {
    if (!route || !Array.isArray(route.steps)) continue;
    if (route.steps.length !== 3) {
      errors.push(`[${route.id}] 比例配分は必ず3段階である必要があります（実際: ${route.steps.length}）`);
      continue;
    }
    const operators = route.steps.map((s) => s && s.operator);
    if (operators[0] !== "+" || operators[1] !== "÷" || operators[2] !== "×") {
      errors.push(
        `[${route.id}] 比例配分の演算記号の順序が想定と異なります: ${operators.join(",")}（"+","÷","×" の順である必要があります）`
      );
    }
    if (route.id === "ratio-fraction-route") {
      const [, step2, step3] = route.steps;
      if (!step2 || step2.resultType !== "fraction") {
        errors.push(
          `[ratio-fraction-route] 2つ目の式には resultType:"fraction" が必要です（割り切れない場合でも何倍かを分数のまま扱うため）`
        );
      }
      if (targetRatioKey && !(step2 && step2.left && step2.left.key === targetRatioKey)) {
        errors.push(`[ratio-fraction-route] 2つ目の式の左辺は対象の比の項(${targetRatioKey})である必要があります`);
      }
      if (!(step3 && step3.left && step3.left.key === qr.totalKey)) {
        errors.push(`[ratio-fraction-route] 3つ目の式の左辺は合計(${qr.totalKey})である必要があります`);
      }
    }
  }
}

/**
 * multiStepのステップのオペランド（{source, key} または {source:"literal", value}）が、
 * 指定した値のリテラルかどうかを判定します（時間と分の単位変換「60」の検出に使用）。
 */
function isLiteralOperand(operand, expectedValue) {
  return !!operand && operand.source === "literal" && operand.value === expectedValue;
}

/**
 * 比例・対応する量（quantityRelation.type:"direct-proportion"）専用の構造検証です
 * （小学6年生3学期、第12段階で追加）。
 * - knownXKey・targetXKey は variables に存在すること
 * - knownYKey・targetYKey・constantKey は（生成時に自動計算される値のため）variables に
 *   含めないこと
 * - unknown が "targetY" であること（比例定数そのものを最終的な答えにする問題は出題しない）
 * - 必ず2つの正解ルートを持ち、それぞれ2段階（「÷→×」＝1つ分の量を求める、
 *   「×→÷」＝比例式に相当する計算）で、2つのルートが異なる手順になっていること
 */
function validateDirectProportion(template, errors) {
  const qr = template.quantityRelation;
  if (!qr || typeof qr !== "object" || qr.type !== "direct-proportion") {
    errors.push(`generatorType="${template.generatorType}" には quantityRelation.type:"direct-proportion" が必要です`);
    return;
  }
  for (const field of ["knownXKey", "knownYKey", "targetXKey", "targetYKey", "constantKey"]) {
    if (typeof qr[field] !== "string" || qr[field].length === 0) {
      errors.push(`quantityRelation.${field} が文字列で指定されていません`);
    }
  }
  const hasVariables = template.variables && typeof template.variables === "object";
  if (hasVariables) {
    // knownX・targetX・比例定数（constantKey）は、いずれも generateDirectProportionValues() が
    // 独立に生成する値のため variables に必要（比例定数は先に決め、そこから knownY・targetY を
    // 逆算する設計）。knownY・targetY だけが、生成時に自動計算される値のため variables に
    // 含めてはいけない。
    for (const field of ["knownXKey", "targetXKey", "constantKey"]) {
      const key = qr[field];
      if (typeof key === "string" && !(key in template.variables)) {
        errors.push(`quantityRelation.${field} が variables に存在しません: ${key}`);
      }
    }
    for (const field of ["knownYKey", "targetYKey"]) {
      const key = qr[field];
      if (typeof key === "string" && key in template.variables) {
        errors.push(`quantityRelation.${field} は生成時に自動計算される値です。variables に含めないでください: ${key}`);
      }
    }
  }
  if (qr.unknown !== "targetY") {
    errors.push(
      `quantityRelation.unknown が不正です: ${qr.unknown}（比例・対応する量は常に"targetY"である必要があります。比例定数そのものを答えさせる問題は出題しません）`
    );
  }

  if (template.questionType !== "multiStep") {
    errors.push(`generatorType="${template.generatorType}" は questionType:"multiStep" である必要があります`);
    return;
  }

  // 比例・対応する量には、必ず2つの正解ルート（1つ分の量を求める／比例式に相当する計算）を
  // 登録し、さらに次の2つを任意で追加登録できます（どちらも運用開始後に追加。ユーザー報告の
  // とおり、後項÷前項・前項÷後項のどちらから「何倍か」を求める解き方も教科書的に正しい別解の
  // ため）。
  //   - multiplier-first-route: targetX÷knownX＝何倍、knownY×何倍＝答え（例: 5÷4=5/4→300×5/4=375）
  //   - divisor-first-route   : knownX÷targetX＝倍率、knownY÷倍率＝答え（例: 8÷2=4→160÷4=40）
  // unit-value-route と multiplier-first-route は演算記号の並びがどちらも「÷,×」で同じになる
  // ため、演算記号の並びだけでルートの種類を判定せず、ルートIDごとに参照している変数・
  // resultTypeまで個別に検証します。
  const REQUIRED_ROUTE_IDS = ["unit-value-route", "cross-multiplication-route"];
  const OPTIONAL_ROUTE_IDS = ["multiplier-first-route", "divisor-first-route"];
  const ALLOWED_ROUTE_IDS = [...REQUIRED_ROUTE_IDS, ...OPTIONAL_ROUTE_IDS];

  if (
    !Array.isArray(template.solutionRoutes) ||
    template.solutionRoutes.length < REQUIRED_ROUTE_IDS.length ||
    template.solutionRoutes.length > ALLOWED_ROUTE_IDS.length
  ) {
    errors.push(
      `generatorType="${template.generatorType}" には2〜4個の解法ルートが必要です（実際: ${Array.isArray(template.solutionRoutes) ? template.solutionRoutes.length : 0}）`
    );
  }
  if (!Array.isArray(template.solutionRoutes)) return;

  const routeIds = template.solutionRoutes.map((route) => route && route.id);
  for (const requiredId of REQUIRED_ROUTE_IDS) {
    if (!routeIds.includes(requiredId)) {
      errors.push(`比例・対応する量には正解ルート "${requiredId}" が必要です`);
    }
  }
  for (const id of routeIds) {
    if (!ALLOWED_ROUTE_IDS.includes(id)) {
      errors.push(
        `比例・対応する量の正解ルートIDが不正です: ${id}（"unit-value-route"／"cross-multiplication-route"／"multiplier-first-route"／"divisor-first-route" のいずれかである必要があります）`
      );
    }
  }

  for (const route of template.solutionRoutes) {
    if (!route || !Array.isArray(route.steps)) continue;
    if (route.steps.length !== 2) {
      errors.push(`[${route.id}] 比例・対応する量は必ず2段階である必要があります（実際: ${route.steps.length}）`);
      continue;
    }
    const operators = route.steps.map((s) => s && s.operator).join(",");
    if (route.id === "unit-value-route") {
      if (operators !== "÷,×") {
        errors.push(`[unit-value-route] 演算記号の順序が想定と異なります: ${operators}（"÷,×"＝1つ分の量を求める、である必要があります）`);
      }
    } else if (route.id === "cross-multiplication-route") {
      if (operators !== "×,÷") {
        errors.push(`[cross-multiplication-route] 演算記号の順序が想定と異なります: ${operators}（"×,÷"＝比例式に相当する計算、である必要があります）`);
      }
    } else if (route.id === "multiplier-first-route") {
      if (operators !== "÷,×") {
        errors.push(`[multiplier-first-route] 演算記号の順序が想定と異なります: ${operators}（"÷,×"＝何倍かを先に求める、である必要があります）`);
      }
      if (!route.steps[0] || route.steps[0].resultType !== "fraction") {
        errors.push(
          `[multiplier-first-route] 1つ目の式（targetX÷knownX）には resultType:"fraction" が必要です（割り切れる場合でも「何倍か」を分数のまま扱うため）`
        );
      }
    } else if (route.id === "divisor-first-route") {
      if (operators !== "÷,÷") {
        errors.push(`[divisor-first-route] 演算記号の順序が想定と異なります: ${operators}（"÷,÷"＝knownX÷targetXの倍率で答えを求める、である必要があります）`);
      }
      if (!route.steps[0] || route.steps[0].resultType !== "fraction") {
        errors.push(
          `[divisor-first-route] 1つ目の式（knownX÷targetX）には resultType:"fraction" が必要です（割り切れない場合でも倍率を分数のまま扱うため）`
        );
      }
    }
  }
}

/**
 * 反比例・対応する量（quantityRelation.type:"inverse-proportion"）専用の構造検証です
 * （小学6年生3学期、第12段階で追加）。
 * - knownXKey・targetXKey は variables に存在すること
 * - knownYKey・targetYKey・productKey は（生成時に自動計算される値のため）variables に
 *   含めないこと
 * - unknown が "targetY" であること（一定の積そのものを最終的な答えにする問題は出題しない）
 * - 必ず1つの正解ルート・2段階（×→÷）で、式1（knownX×knownY）に commutative:true が
 *   指定されていること（依頼文の「式1のかけ算では交換法則を認めてください」）
 */
function validateInverseProportion(template, errors) {
  const qr = template.quantityRelation;
  if (!qr || typeof qr !== "object" || qr.type !== "inverse-proportion") {
    errors.push(`generatorType="${template.generatorType}" には quantityRelation.type:"inverse-proportion" が必要です`);
    return;
  }
  for (const field of ["knownXKey", "knownYKey", "targetXKey", "targetYKey", "productKey"]) {
    if (typeof qr[field] !== "string" || qr[field].length === 0) {
      errors.push(`quantityRelation.${field} が文字列で指定されていません`);
    }
  }
  const hasVariables = template.variables && typeof template.variables === "object";
  if (hasVariables) {
    for (const field of ["knownXKey", "targetXKey"]) {
      const key = qr[field];
      if (typeof key === "string" && !(key in template.variables)) {
        errors.push(`quantityRelation.${field} が variables に存在しません: ${key}`);
      }
    }
    for (const field of ["knownYKey", "targetYKey", "productKey"]) {
      const key = qr[field];
      if (typeof key === "string" && key in template.variables) {
        errors.push(`quantityRelation.${field} は生成時に自動計算される値です。variables に含めないでください: ${key}`);
      }
    }
  }
  if (qr.unknown !== "targetY") {
    errors.push(
      `quantityRelation.unknown が不正です: ${qr.unknown}（反比例・対応する量は常に"targetY"である必要があります。一定の積そのものを答えさせる問題は出題しません）`
    );
  }

  if (template.questionType !== "multiStep") {
    errors.push(`generatorType="${template.generatorType}" は questionType:"multiStep" である必要があります`);
    return;
  }

  // 標準ルート（product-first-route。一定の積を求めてから÷targetX）に加えて、次の2つを
  // 任意で追加登録できます（どちらも運用開始後に追加。ユーザー報告のとおり、反比例でも
  // 「何倍になったか」から直接答えを求める別解が考えられるため）。
  //   - target-over-known-route: targetX÷knownX＝増えた倍率、knownY÷増えた倍率＝答え
  //     （例: 6人→9日、9÷6=3/2→72÷3/2=48。Xが増えた分だけYを割って減らす）
  //   - known-over-target-route: knownX÷targetX＝減る倍率、knownY×減る倍率＝答え
  //     （例: 6÷9=2/3→72×2/3=48。増えた倍率の逆数を先に求め、それをYに掛ける）
  // target-over-known-route と known-over-target-route は演算子の並びがそれぞれ「÷,÷」
  // 「÷,×」で、product-first-route（「×,÷」）とは異なるため区別できますが、
  // どちらも1つ目の式でどちらの変数を分子・分母にするかを取り違えやすいため、
  // ルートIDごとに参照している変数・resultTypeまで個別に検証します。
  const REQUIRED_ROUTE_IDS = ["product-first-route"];
  const OPTIONAL_ROUTE_IDS = ["target-over-known-route", "known-over-target-route"];
  const ALLOWED_ROUTE_IDS = [...REQUIRED_ROUTE_IDS, ...OPTIONAL_ROUTE_IDS];

  if (
    !Array.isArray(template.solutionRoutes) ||
    template.solutionRoutes.length < REQUIRED_ROUTE_IDS.length ||
    template.solutionRoutes.length > ALLOWED_ROUTE_IDS.length
  ) {
    errors.push(
      `generatorType="${template.generatorType}" には1〜3個の解法ルートが必要です（実際: ${Array.isArray(template.solutionRoutes) ? template.solutionRoutes.length : 0}）`
    );
  }
  if (!Array.isArray(template.solutionRoutes)) return;

  const routeIds = template.solutionRoutes.map((route) => route && route.id);
  for (const requiredId of REQUIRED_ROUTE_IDS) {
    if (!routeIds.includes(requiredId)) {
      errors.push(`反比例・対応する量には正解ルート "${requiredId}" が必要です`);
    }
  }
  for (const id of routeIds) {
    if (!ALLOWED_ROUTE_IDS.includes(id)) {
      errors.push(
        `反比例・対応する量の正解ルートIDが不正です: ${id}（"product-first-route"／"target-over-known-route"／"known-over-target-route" のいずれかである必要があります）`
      );
    }
  }

  for (const route of template.solutionRoutes) {
    if (!route || !Array.isArray(route.steps)) continue;
    if (route.steps.length !== 2) {
      errors.push(`[${route.id}] 反比例・対応する量は必ず2段階である必要があります（実際: ${route.steps.length}）`);
      continue;
    }
    const [step1, step2] = route.steps;
    const operators = route.steps.map((s) => s && s.operator);
    if (route.id === "product-first-route") {
      if (operators[0] !== "×" || operators[1] !== "÷") {
        errors.push(
          `[product-first-route] 演算記号の順序が想定と異なります: ${operators.join(",")}（"×","÷" の順である必要があります）`
        );
      }
      if (!step1 || step1.commutative !== true) {
        errors.push(`[product-first-route] 式1（knownX×knownY）には commutative:true が必要です`);
      }
    } else if (route.id === "target-over-known-route") {
      if (operators[0] !== "÷" || operators[1] !== "÷") {
        errors.push(
          `[target-over-known-route] 演算記号の順序が想定と異なります: ${operators.join(",")}（"÷,÷" の順である必要があります）`
        );
      }
      if (!step1 || step1.resultType !== "fraction") {
        errors.push(`[target-over-known-route] 1つ目の式（targetX÷knownX）には resultType:"fraction" が必要です`);
      }
      if (!(step1 && step1.left && step1.left.key === qr.targetXKey && step1.right && step1.right.key === qr.knownXKey)) {
        errors.push(`[target-over-known-route] 1つ目の式は「targetX÷knownX」である必要があります`);
      }
      if (!(step2 && step2.left && step2.left.key === qr.knownYKey)) {
        errors.push(`[target-over-known-route] 2つ目の式の左辺は knownY である必要があります`);
      }
    } else if (route.id === "known-over-target-route") {
      if (operators[0] !== "÷" || operators[1] !== "×") {
        errors.push(
          `[known-over-target-route] 演算記号の順序が想定と異なります: ${operators.join(",")}（"÷,×" の順である必要があります）`
        );
      }
      if (!step1 || step1.resultType !== "fraction") {
        errors.push(`[known-over-target-route] 1つ目の式（knownX÷targetX）には resultType:"fraction" が必要です`);
      }
      if (!(step1 && step1.left && step1.left.key === qr.knownXKey && step1.right && step1.right.key === qr.targetXKey)) {
        errors.push(`[known-over-target-route] 1つ目の式は「knownX÷targetX」である必要があります`);
      }
      if (!(step2 && step2.left && step2.left.key === qr.knownYKey)) {
        errors.push(`[known-over-target-route] 2つ目の式の左辺は knownY である必要があります`);
      }
    }
  }
}

/**
 * 縮尺・実際の長さ／縮尺・地図上の長さ（quantityRelation.type:"scale-length"）
 * 専用の構造検証です（小学6年生3学期、第12段階で追加。「縮尺を求める」カテゴリは
 * 運用開始後に削除しました）。
 * - scaleKey・mapLengthKey は variables に存在すること（どちらが「未知」でも、この2つは
 *   常に generateScaleLengthValues() が独立に生成する。詳しくはREADME参照）
 * - actualLengthKey は（生成時に自動計算される値のため）variables に含めないこと
 * - actualLengthUnit が "km"／"m" のいずれかであること
 * - unknown が "actualLength"／"mapLength" のいずれかであること
 * - 必ず1つの正解ルート・2段階で、長さの単位変換（km なら100000、m なら100を使った
 *   ステップ）が含まれていること
 */
function validateScaleLength(template, errors) {
  const qr = template.quantityRelation;
  if (!qr || typeof qr !== "object" || qr.type !== "scale-length") {
    errors.push(`generatorType="${template.generatorType}" には quantityRelation.type:"scale-length" が必要です`);
    return;
  }
  for (const field of ["scaleKey", "mapLengthKey", "actualLengthKey"]) {
    if (typeof qr[field] !== "string" || qr[field].length === 0) {
      errors.push(`quantityRelation.${field} が文字列で指定されていません`);
    }
  }
  if (!["km", "m"].includes(qr.actualLengthUnit)) {
    errors.push(`quantityRelation.actualLengthUnit が不正です: ${qr.actualLengthUnit}（"km"／"m" のいずれか）`);
  }
  if (!["actualLength", "mapLength"].includes(qr.unknown)) {
    errors.push(`quantityRelation.unknown が不正です: ${qr.unknown}（"actualLength"／"mapLength" のいずれか）`);
  }
  const hasVariables = template.variables && typeof template.variables === "object";
  if (hasVariables) {
    for (const field of ["scaleKey", "mapLengthKey"]) {
      const key = qr[field];
      if (typeof key === "string" && !(key in template.variables)) {
        errors.push(`quantityRelation.${field} が variables に存在しません: ${key}`);
      }
    }
    if (typeof qr.actualLengthKey === "string" && qr.actualLengthKey in template.variables) {
      errors.push(
        `quantityRelation.actualLengthKey は生成時に自動計算される値です。variables に含めないでください: ${qr.actualLengthKey}`
      );
    }
  }

  if (template.questionType !== "multiStep") {
    errors.push(`generatorType="${template.generatorType}" は questionType:"multiStep" である必要があります`);
    return;
  }
  // 通常は1つの正解ルートですが、「縮尺・地図上の長さ」の一部テンプレートのように、
  // 先に単位変換してから縮尺の分母で割る／先に縮尺の分母で割ってから単位変換する、の
  // どちらの順序でも正しく解けるテンプレートでは、2つ目の正解ルートを追加登録できます
  // （運用開始後に追加。g6t3_scale_map_003が最初の例）。findActualLengthFromScale・
  // findMapLengthFromScale の両方でこの検証関数を共有しており、使用するルートidが
  // 異なるため、特定のidを必須とはせず、idの重複が無いことだけをチェックします。
  const MAX_ROUTES = 2;
  if (
    !Array.isArray(template.solutionRoutes) ||
    template.solutionRoutes.length < 1 ||
    template.solutionRoutes.length > MAX_ROUTES
  ) {
    errors.push(
      `generatorType="${template.generatorType}" には1〜${MAX_ROUTES}個の解法ルートが必要です（実際: ${Array.isArray(template.solutionRoutes) ? template.solutionRoutes.length : 0}）`
    );
  }
  if (!Array.isArray(template.solutionRoutes)) return;

  const routeIds = template.solutionRoutes.map((route) => route && route.id);
  if (new Set(routeIds).size !== routeIds.length) {
    errors.push(`正解ルートのidが重複しています: ${routeIds.join(", ")}`);
  }

  const expectedFactor = qr.actualLengthUnit === "km" ? 100000 : 100;
  for (const route of template.solutionRoutes) {
    if (!route || !Array.isArray(route.steps)) continue;
    if (route.steps.length !== 2) {
      errors.push(`[${route.id}] 縮尺の問題は必ず2段階である必要があります（実際: ${route.steps.length}）`);
      continue;
    }
    const hasUnitConversion = route.steps.some(
      (step) => step && (isLiteralOperand(step.left, expectedFactor) || isLiteralOperand(step.right, expectedFactor))
    );
    if (!hasUnitConversion) {
      errors.push(`[${route.id}] 長さの単位変換（${expectedFactor}を使ったステップ）が見つかりません`);
    }
  }
}

/**
 * textParts（{type:"text", value:string} と {type:"value", ref:変数名} の配列）の
 * 構造を検証します。ref は variables（または generatorType が計算する変数）の
 * キー名と一致している必要があります。
 */
function validateTextParts(template, rule, errors) {
  if (!Array.isArray(template.textParts)) {
    errors.push("textPartsは配列である必要があります");
    return;
  }
  if (template.textParts.length === 0) {
    errors.push("textPartsが空です");
  }
  const hasVariables = template.variables && typeof template.variables === "object";
  const knownVariableKeys = rule && hasVariables ? getKnownVariableKeys(template, rule) : null;

  template.textParts.forEach((part, i) => {
    if (!part || typeof part !== "object") {
      errors.push(`textParts[${i}] がオブジェクトではありません`);
      return;
    }
    if (part.type === "text") {
      if (typeof part.value !== "string") {
        errors.push(`textParts[${i}]（text）のvalueは文字列である必要があります`);
      }
    } else if (part.type === "value") {
      if (typeof part.ref !== "string" || part.ref.length === 0) {
        errors.push(`textParts[${i}]（value）のrefは変数名（文字列）で指定してください`);
      } else if (knownVariableKeys && !knownVariableKeys.has(part.ref)) {
        errors.push(`textParts[${i}].ref が未定義の変数です: ${part.ref}`);
      }
    } else {
      errors.push(`textParts[${i}] のtypeが不正です: ${part.type}（"text" か "value" のみ）`);
    }
  });
}

/**
 * template.hiddenIntermediateKeys（比例定数・反比例の一定の積など、児童が式1で
 * 求める必要がある中間結果の変数名の一覧）が、問題文（textParts）に直接参照されていないかを
 * 検証します（小学6年生3学期、第12段階で追加）。
 * 依頼文の指示どおり、単純な文字列一致（生成後の数値がたまたま問題文の別の数値と一致するかどうか）
 * ではなく、textParts の ref（どの変数を参照しているか）を見て判定します。これにより、
 * 「別の意味で同じ数値が偶然登場した」だけの誤検出を避けられます。
 */
function validateHiddenIntermediateKeys(template, errors) {
  const hiddenKeys = template.hiddenIntermediateKeys;
  if (!Array.isArray(hiddenKeys) || hiddenKeys.length === 0) return;
  if (!Array.isArray(template.textParts)) return;
  const referencedRefs = new Set(
    template.textParts.filter((part) => part && part.type === "value" && typeof part.ref === "string").map((part) => part.ref)
  );
  for (const key of hiddenKeys) {
    if (referencedRefs.has(key)) {
      errors.push(
        `hiddenIntermediateKeys に含まれる変数 "${key}" が問題文（textParts）で直接参照されています（式1で児童が求める中間結果を問題文に記載してはいけません）`
      );
    }
  }
}

/**
 * template.relationTable（比例・反比例の関係表の宣言的な定義）の構造を検証します
 * （小学6年生3学期、第12段階で追加）。表を持たないテンプレートでは何もしません。
 * - rowHeaders は文字列の配列であること
 * - columns の各列が rowHeaders と同じ長さの配列であること
 * - 各セルが {type:"value", ref:変数名}（variables または生成時の計算値を参照）
 *   または {type:"unknown"}（児童が求める値。「？」として表示される）のいずれかであること
 */
function validateRelationTable(template, rule, errors) {
  const table = template.relationTable;
  if (!table) return;
  if (!Array.isArray(table.rowHeaders) || table.rowHeaders.some((h) => typeof h !== "string")) {
    errors.push("relationTable.rowHeaders は文字列の配列である必要があります");
    return;
  }
  if (!Array.isArray(table.columns) || table.columns.length === 0) {
    errors.push("relationTable.columns は空でない配列である必要があります");
    return;
  }
  const hasVariables = template.variables && typeof template.variables === "object";
  const knownVariableKeys = rule && hasVariables ? getKnownVariableKeys(template, rule) : null;
  table.columns.forEach((column, columnIndex) => {
    if (!Array.isArray(column) || column.length !== table.rowHeaders.length) {
      errors.push(`relationTable.columns[${columnIndex}] は rowHeaders と同じ長さの配列である必要があります`);
      return;
    }
    column.forEach((cell, rowIndex) => {
      if (!cell || typeof cell !== "object") {
        errors.push(`relationTable.columns[${columnIndex}][${rowIndex}] がオブジェクトではありません`);
      } else if (cell.type === "value") {
        if (typeof cell.ref !== "string" || cell.ref.length === 0) {
          errors.push(`relationTable.columns[${columnIndex}][${rowIndex}] のrefは変数名（文字列）で指定してください`);
        } else if (knownVariableKeys && !knownVariableKeys.has(cell.ref)) {
          errors.push(`relationTable.columns[${columnIndex}][${rowIndex}].ref が未定義の変数です: ${cell.ref}`);
        }
      } else if (cell.type !== "unknown") {
        errors.push(`relationTable.columns[${columnIndex}][${rowIndex}] のtypeが不正です: ${cell.type}（"value" か "unknown" のみ）`);
      }
    });
  });
}

/**
 * 分数型の変数定義 { type:"fraction", denominator, numeratorMin, numeratorMax } を検証します。
 */
function validateFractionVariable(key, range, errors) {
  if (!Number.isInteger(range.denominator) || range.denominator === 0) {
    errors.push(`variables.${key}.denominator は0以外の整数である必要があります: ${range.denominator}`);
  } else if (
    range.denominator < MIN_REASONABLE_FRACTION_DENOMINATOR ||
    range.denominator > MAX_REASONABLE_FRACTION_DENOMINATOR
  ) {
    errors.push(
      `variables.${key}.denominator が範囲外です: ${range.denominator}` +
        `（${MIN_REASONABLE_FRACTION_DENOMINATOR}〜${MAX_REASONABLE_FRACTION_DENOMINATOR}である必要があります）`
    );
  }
  if (!Number.isInteger(range.numeratorMin) || !Number.isInteger(range.numeratorMax)) {
    errors.push(`variables.${key} の numeratorMin/numeratorMax は整数である必要があります`);
  } else if (range.numeratorMin > range.numeratorMax) {
    errors.push(`variables.${key}.numeratorMin が numeratorMax を超えています`);
  }
  if (typeof range.numeratorMin === "number" && range.numeratorMin < 0) {
    errors.push(`variables.${key}.numeratorMin が負の数です: ${range.numeratorMin}`);
  }
}

/**
 * 帯分数型の変数定義 { type:"mixedFraction", denominator, wholeMin, wholeMax, numeratorMin, numeratorMax }
 * を検証します（第11段階：同分母分数のたし算・ひき算への帯分数追加で追加）。
 * 分母の妥当性チェックは validateFractionVariable と同じ基準を使い、整数部（whole）は1以上、
 * 分子（numerator）は1以上かつ分母未満（＝真分数の分子として成立する範囲）であることを要求します
 * （whole=0 や numerator=0 の帯分数は、このゲームでは仕様上作らないため）。
 */
function validateMixedFractionVariable(key, range, errors) {
  if (!Number.isInteger(range.denominator) || range.denominator === 0) {
    errors.push(`variables.${key}.denominator は0以外の整数である必要があります: ${range.denominator}`);
  } else if (
    range.denominator < MIN_REASONABLE_FRACTION_DENOMINATOR ||
    range.denominator > MAX_REASONABLE_FRACTION_DENOMINATOR
  ) {
    errors.push(
      `variables.${key}.denominator が範囲外です: ${range.denominator}` +
        `（${MIN_REASONABLE_FRACTION_DENOMINATOR}〜${MAX_REASONABLE_FRACTION_DENOMINATOR}である必要があります）`
    );
  }
  if (!Number.isInteger(range.wholeMin) || !Number.isInteger(range.wholeMax)) {
    errors.push(`variables.${key} の wholeMin/wholeMax は整数である必要があります`);
  } else {
    if (range.wholeMin < 1) {
      errors.push(`variables.${key}.wholeMin は1以上である必要があります（帯分数の整数部は0にできません）: ${range.wholeMin}`);
    }
    if (range.wholeMin > range.wholeMax) {
      errors.push(`variables.${key}.wholeMin が wholeMax を超えています`);
    }
  }
  if (!Number.isInteger(range.numeratorMin) || !Number.isInteger(range.numeratorMax)) {
    errors.push(`variables.${key} の numeratorMin/numeratorMax は整数である必要があります`);
  } else {
    if (range.numeratorMin < 1) {
      errors.push(`variables.${key}.numeratorMin は1以上である必要があります（帯分数の分子部分は0にできません）: ${range.numeratorMin}`);
    }
    if (range.numeratorMin > range.numeratorMax) {
      errors.push(`variables.${key}.numeratorMin が numeratorMax を超えています`);
    }
    if (Number.isInteger(range.denominator) && range.numeratorMax >= range.denominator) {
      errors.push(
        `variables.${key}.numeratorMax は denominator 未満である必要があります（帯分数の分子部分は真分数）: ` +
          `numeratorMax=${range.numeratorMax}, denominator=${range.denominator}`
      );
    }
  }
}

/**
 * 百分率型の変数定義 { type:"percent", values:[10,20,25,...] } を検証します（第9段階で追加）。
 * 「10%、20%、25%…」のような、値の一覧（values）から選ぶ離散的な形式のため、
 * 分数の min/max ではなく配列そのものを検証します。0%以下の値は許可しません
 * （「0%引き」「0%増量」のような問題は意味をなさないため）。
 */
function validatePercentVariable(key, range, errors) {
  if (!Array.isArray(range.values) || range.values.length === 0) {
    errors.push(`variables.${key}.values は空でない配列である必要があります`);
    return;
  }
  for (const v of range.values) {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      errors.push(`variables.${key}.values に不正な値が含まれています: ${JSON.stringify(v)}`);
    } else if (v <= 0) {
      errors.push(`variables.${key}.values は0より大きい値である必要があります: ${v}`);
    } else if (getDecimalPlaces(v) > MAX_REASONABLE_DECIMAL_PLACES) {
      errors.push(`variables.${key}.values の小数点以下の桁数が大きすぎます: ${v}`);
    }
  }
}

/**
 * 分数型（type:"fraction"）・帯分数型（type:"mixedFraction"）の変数範囲を、
 * どちらも「分子の実効範囲（分母を1とした通分不要の比較用の値）」に変換します
 * （第11段階で追加）。真分数はそのまま numeratorMin/numeratorMax を、帯分数は
 * 整数部を含めた仮分数としての分子（whole×denominator+numerator）の範囲を返すため、
 * 型を問わず同じ基準で「答えが負にならないか」を比較できます。
 */
function effectiveFractionNumeratorRange(range) {
  if (range.type === "mixedFraction") {
    return {
      min: range.wholeMin * range.denominator + range.numeratorMin,
      max: range.wholeMax * range.denominator + range.numeratorMax
    };
  }
  return { min: range.numeratorMin, max: range.numeratorMax };
}

/**
 * 同分母分数のたし算・ひき算のテンプレートについて、a・bの分母が一致しているか、
 * ひき算の場合に答えが負にならない範囲設計になっているかを検証します
 * （実際の生成値ではなく、テンプレートの範囲定義そのものを静的にチェックします）。
 * a・bは、真分数（type:"fraction"）・帯分数（type:"mixedFraction"）のどちらでも構いません
 * （第11段階：帯分数追加時に、mixedFractionも受け付けるよう一般化）。
 */
function validateSameDenominatorFractionRanges(template, errors) {
  const variables = template.variables || {};
  const a = variables.a;
  const b = variables.b;
  const isFractionLike = (range) => range && (range.type === "fraction" || range.type === "mixedFraction");
  if (!isFractionLike(a) || !isFractionLike(b)) {
    errors.push(`generatorType="${template.generatorType}" には、a と b が分数型または帯分数型の変数として必要です`);
    return;
  }
  if (a.denominator !== b.denominator) {
    errors.push(`同分母分数の問題なのに、a と b の分母が異なります: ${a.denominator} / ${b.denominator}`);
  }
  if (template.generatorType === "sameDenominatorFractionSubtraction") {
    const effectiveA = effectiveFractionNumeratorRange(a);
    const effectiveB = effectiveFractionNumeratorRange(b);
    if (
      typeof effectiveA.min === "number" &&
      typeof effectiveB.max === "number" &&
      effectiveA.min < effectiveB.max
    ) {
      errors.push(
        `ひき算の答えが負になる可能性があります: a の実効最小値(${effectiveA.min})が` +
          ` b の実効最大値(${effectiveB.max})より小さいです`
      );
    }
  }
}

/**
 * 異分母分数のたし算・ひき算のテンプレートについて、a・bが分母の異なる分数型変数として
 * 定義されているかを検証します（第8段階で追加。同分母分数の validateSameDenominatorFractionRanges
 * とは逆に、分母が「異なる」ことを要求します）。
 */
function validateUnlikeDenominators(template, errors) {
  const variables = template.variables || {};
  const a = variables.a;
  const b = variables.b;
  if (!a || !b || a.type !== "fraction" || b.type !== "fraction") {
    errors.push(`generatorType="${template.generatorType}" には、a と b が分数型の変数として必要です`);
    return;
  }
  if (a.denominator === b.denominator) {
    errors.push(`異分母分数の問題なのに、a と b の分母が同じです: ${a.denominator}`);
  }
}

/**
 * 異分母分数のひき算のテンプレートについて、a の取りうる最小値が b の取りうる最大値を
 * 常に上回っているか（答えが負にならないか）を、クロス乗算（浮動小数点を経由しない整数比較）で
 * 検証します（第8段階で追加）。分母が異なるため、同分母のときのような numerator の
 * 直接比較（validateSameDenominatorFractionRanges）は使えません。
 * a.numeratorMin/a.denominator ≥ b.numeratorMax/b.denominator
 * ⇔ a.numeratorMin×b.denominator ≥ b.numeratorMax×a.denominator
 */
function validateNonNegativeUnlikeDenominatorSubtraction(template, errors) {
  const variables = template.variables || {};
  const a = variables.a;
  const b = variables.b;
  if (!a || !b || a.type !== "fraction" || b.type !== "fraction") return;
  if (
    typeof a.numeratorMin !== "number" ||
    typeof b.numeratorMax !== "number" ||
    !Number.isInteger(a.denominator) ||
    !Number.isInteger(b.denominator)
  ) {
    return;
  }
  const minA = a.numeratorMin * b.denominator;
  const maxB = b.numeratorMax * a.denominator;
  if (minA < maxB) {
    errors.push(
      `異分母のひき算の答えが負になる可能性があります: a の最小値(${a.numeratorMin}/${a.denominator})が` +
        ` b の最大値(${b.numeratorMax}/${b.denominator})を下回っています`
    );
  }
}

/**
 * 問題テンプレート1件の構造を検証します（数値は生成しません）。
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateTemplate(template) {
  const errors = [];

  if (!template || typeof template !== "object") {
    return { valid: false, errors: ["テンプレートがオブジェクトではありません"] };
  }

  for (const field of REQUIRED_TEMPLATE_FIELDS) {
    if (template[field] === undefined || template[field] === null) {
      errors.push(`必須項目が不足しています: ${field}`);
    }
  }

  // template（文字列）と textParts（配列）は、どちらか一方が必要（両方必須ではない）。
  const hasStringTemplate = typeof template.template === "string" && template.template.length > 0;
  const hasTextParts = Array.isArray(template.textParts);
  if (!hasStringTemplate && !hasTextParts) {
    errors.push("templateまたはtextPartsのいずれかが必要です");
  }

  if (template.questionType !== undefined && !VALID_QUESTION_TYPES.includes(template.questionType)) {
    errors.push(`questionTypeが不正です: ${template.questionType}`);
  }

  if (template.gradeTerm !== undefined && !VALID_GRADE_TERMS.includes(template.gradeTerm)) {
    errors.push(`gradeTermが未登録です: ${template.gradeTerm}（data/index.js に登録されているか確認してください）`);
  }

  if (
    template.contentGroup !== undefined &&
    template.contentGroup !== "new" &&
    template.contentGroup !== "review"
  ) {
    errors.push(`contentGroupが不正です: ${template.contentGroup}（"new" か "review" のみ）`);
  }

  if (template.fractionDisplayMode !== undefined && template.fractionDisplayMode !== "mixed") {
    errors.push(`fractionDisplayModeが不正です: ${template.fractionDisplayMode}（"mixed" のみ対応）`);
  }
  if (template.mixedNumberPattern !== undefined && !VALID_MIXED_NUMBER_PATTERNS.has(template.mixedNumberPattern)) {
    errors.push(
      `mixedNumberPatternが不正です: ${template.mixedNumberPattern}（${[...VALID_MIXED_NUMBER_PATTERNS].join(" / ")} のいずれかである必要があります）`
    );
  }
  if (usesMixedNumberFeature(template) && !MIXED_NUMBER_ALLOWED_CATEGORY_IDS.has(template.categoryId)) {
    errors.push(
      `帯分数機能（fractionDisplayMode="mixed" または variables内のtype:"mixedFraction"）は、` +
        `同分母分数のたし算・ひき算（${[...MIXED_NUMBER_ALLOWED_CATEGORY_IDS].join(" / ")}）以外のカテゴリでは使用できません: ` +
        `categoryId="${template.categoryId}"`
    );
  }

  const generatorTypeKnown = VALID_GENERATOR_TYPES.includes(template.generatorType);
  if (template.generatorType !== undefined && !generatorTypeKnown) {
    errors.push(`generatorTypeが不正です: ${template.generatorType}`);
  }

  const rule = generatorTypeKnown ? getGeneratorRule(template.generatorType) : null;
  const hasVariables = template.variables && typeof template.variables === "object";

  if (hasStringTemplate && hasVariables && rule) {
    const knownVariableKeys = getKnownVariableKeys(template, rule);
    for (const key of extractPlaceholders(template.template)) {
      if (!knownVariableKeys.has(key)) {
        errors.push(`未定義の変数が問題文で使われています: {${key}}`);
      }
    }
  }
  if (hasTextParts && rule) {
    validateTextParts(template, rule, errors);
  }
  if (hasTextParts) {
    validateHiddenIntermediateKeys(template, errors);
  }
  if (template.relationTable) {
    validateRelationTable(template, rule, errors);
  }
  if (hasVariables && rule) {
    for (const requiredKey of rule.requiredVariableKeys) {
      if (!(requiredKey in template.variables)) {
        errors.push(`generatorType="${template.generatorType}" に必要な変数がありません: ${requiredKey}`);
      }
    }
  }

  if (rule && rule.requiresQuantityRelation) {
    validateQuantityRelation(template, errors);
  }

  if (rule && rule.requiresSpeedUnitConversionShape) {
    validateSpeedWithUnitConversion(template, errors);
  }
  if (rule && rule.requiresRatioApplicationShape) {
    validateRatioApplication(template, errors);
  }
  if (rule && rule.requiresProportionalAllocationShape) {
    validateProportionalAllocation(template, errors);
  }
  if (rule && rule.requiresDirectProportionShape) {
    validateDirectProportion(template, errors);
  }
  if (rule && rule.requiresInverseProportionShape) {
    validateInverseProportion(template, errors);
  }
  if (rule && rule.requiresScaleLengthShape) {
    validateScaleLength(template, errors);
  }

  if (rule && rule.divisorRange && hasVariables && template.variables.divisor) {
    const { min: divisorMin, max: divisorMax } = template.variables.divisor;
    const { min: expectedMin, max: expectedMax } = rule.divisorRange;
    if (typeof divisorMin === "number" && divisorMin < expectedMin) {
      errors.push(
        `generatorType="${template.generatorType}" のわる数(divisor)の最小値が範囲外です: ${divisorMin}（${expectedMin}〜${expectedMax} である必要があります）`
      );
    }
    if (typeof divisorMax === "number" && divisorMax > expectedMax) {
      errors.push(
        `generatorType="${template.generatorType}" のわる数(divisor)の最大値が範囲外です: ${divisorMax}（${expectedMin}〜${expectedMax} である必要があります）`
      );
    }
  }

  if (rule && rule.isFractionGenerator && hasVariables) {
    validateSameDenominatorFractionRanges(template, errors);
  }

  if (rule && rule.requiresUnlikeDenominators && hasVariables) {
    validateUnlikeDenominators(template, errors);
  }
  if (rule && rule.requiresNonNegativeUnlikeDenominatorSubtraction && hasVariables) {
    validateNonNegativeUnlikeDenominatorSubtraction(template, errors);
  }

  // 小数（decimalPlaces指定）・分数（type:"fraction"）・百分率（type:"percent"）の変数定義を検証する。
  if (hasVariables) {
    for (const [key, range] of Object.entries(template.variables)) {
      if (!range || typeof range !== "object") continue;
      if (range.type === "fraction") {
        validateFractionVariable(key, range, errors);
      } else if (range.type === "mixedFraction") {
        validateMixedFractionVariable(key, range, errors);
      } else if (range.type === "percent") {
        validatePercentVariable(key, range, errors);
      } else if (range.decimalPlaces > MAX_REASONABLE_DECIMAL_PLACES) {
        errors.push(
          `variables.${key} の decimalPlaces が大きすぎます: ${range.decimalPlaces}（最大 ${MAX_REASONABLE_DECIMAL_PLACES} 桁）`
        );
      }
    }
  }

  if (Array.isArray(template.solutionRoutes)) {
    if (template.solutionRoutes.length === 0) {
      errors.push("solutionRoutesが空です(正解ルートが存在しません)");
    }
    if (template.questionType === "multiStep") {
      validateMultiStepSolutionRoutes(template, hasVariables && rule ? rule : null, errors);
    } else {
      validateSingleStepSolutionRoutes(template, hasVariables && rule ? rule : null, errors);
    }
  } else if (template.solutionRoutes !== undefined) {
    errors.push("solutionRoutesは配列である必要があります");
  }

  return { valid: errors.length === 0, errors };
}

function validateSingleStepSolutionRoutes(template, rule, errors) {
  template.solutionRoutes.forEach((route, i) => {
    if (!route || typeof route !== "object") {
      errors.push(`solutionRoutes[${i}] がオブジェクトではありません`);
      return;
    }
    if (!VALID_OPERATORS.includes(route.operator)) {
      errors.push(`solutionRoutes[${i}] の演算記号が不正です: ${route.operator}`);
    }
    if (typeof route.left !== "string" || typeof route.right !== "string") {
      errors.push(`solutionRoutes[${i}] のleft/rightは変数名(文字列)で指定してください`);
    } else if (rule) {
      const knownVariableKeys = getKnownVariableKeys(template, rule);
      if (!knownVariableKeys.has(route.left)) {
        errors.push(`solutionRoutes[${i}].left が未定義の変数です: ${route.left}`);
      }
      if (!knownVariableKeys.has(route.right)) {
        errors.push(`solutionRoutes[${i}].right が未定義の変数です: ${route.right}`);
      }
    }
  });
}

/**
 * 2段階問題（questionType: "multiStep"）の solutionRoutes を検証します。
 * - ルートIDの重複
 * - ステップ数が2であること（このバージョンは2段階固定）
 * - 各ステップの演算記号の妥当性
 * - resultKey の重複（同じルート内）
 * - left/right の source/key が正しいか（未定義の変数/中間結果の参照や循環参照が無いか、
 *   source:"result" が「同じルート内の、より前のステップの resultKey」だけを
 *   参照しているか＝これにより自己参照・前方参照・循環参照を機械的に防止する）
 */
function validateMultiStepSolutionRoutes(template, rule, errors) {
  const routeIds = template.solutionRoutes.map((r) => r && r.id).filter(Boolean);
  const duplicateRouteIds = routeIds.filter((id, i) => routeIds.indexOf(id) !== i);
  if (duplicateRouteIds.length > 0) {
    errors.push(`solutionRoutes内でルートIDが重複しています: ${[...new Set(duplicateRouteIds)].join(", ")}`);
  }

  // 同じ問題内の複数の解法ルートは、原則として同じ段階数にする（第11段階で追加）。
  // 分数の速さ・道のり・時間の2つのルートは、どちらも必ず2段階で解ける設計のため、
  // 片方だけが1段階・3段階になっている場合は、テンプレートの定義ミスとして検出する。
  const stepCounts = template.solutionRoutes
    .map((r) => (r && Array.isArray(r.steps) ? r.steps.length : null))
    .filter((n) => n !== null);
  if (stepCounts.length > 1 && new Set(stepCounts).size > 1) {
    errors.push(`solutionRoutes間で段階数が揃っていません: ${stepCounts.join(", ")}`);
  }

  const knownVariableKeys = rule ? getKnownVariableKeys(template, rule) : null;

  template.solutionRoutes.forEach((route, routeIndex) => {
    if (!route || typeof route !== "object") {
      errors.push(`solutionRoutes[${routeIndex}] がオブジェクトではありません`);
      return;
    }
    if (typeof route.id !== "string" || route.id.length === 0) {
      errors.push(`solutionRoutes[${routeIndex}].id が文字列で指定されていません`);
    }
    if (!Array.isArray(route.steps)) {
      errors.push(`solutionRoutes[${routeIndex}(${route.id})].steps が配列ではありません`);
      return;
    }
    if (route.steps.length < MIN_MULTI_STEP_COUNT || route.steps.length > MAX_MULTI_STEP_COUNT) {
      errors.push(
        `solutionRoutes[${routeIndex}(${route.id})].steps は${MIN_MULTI_STEP_COUNT}〜${MAX_MULTI_STEP_COUNT}個である必要があります（実際: ${route.steps.length}）`
      );
    }

    const seenResultKeys = new Set();
    route.steps.forEach((step, stepIndex) => {
      const label = `solutionRoutes[${routeIndex}(${route.id})].steps[${stepIndex}]`;
      if (!step || typeof step !== "object") {
        errors.push(`${label} がオブジェクトではありません`);
        return;
      }
      if (!VALID_OPERATORS.includes(step.operator)) {
        errors.push(`${label} の演算記号が不正です: ${step.operator}`);
      }

      for (const side of ["left", "right"]) {
        const operand = step[side];
        if (!operand || typeof operand !== "object") {
          errors.push(`${label}.${side} はオブジェクト({source, key} または {source:"literal", value})で指定してください`);
          continue;
        }
        if (operand.source !== "variable" && operand.source !== "result" && operand.source !== "literal") {
          errors.push(`${label}.${side}.source が不正です: ${operand.source}（"variable"／"result"／"literal" のいずれか）`);
          continue;
        }
        if (operand.source === "variable") {
          if (knownVariableKeys && !knownVariableKeys.has(operand.key)) {
            errors.push(`${label}.${side} が未定義の変数を参照しています: ${operand.key}`);
          }
        } else if (operand.source === "result") {
          if (!seenResultKeys.has(operand.key)) {
            errors.push(
              `${label}.${side} が、より前のステップで確定していない中間結果を参照しています: ${operand.key}（存在しないか、循環・前方参照の可能性があります）`
            );
          }
        } else if (operand.source === "literal") {
          // 割引・増量の「100%」のような、どの変数にも対応しない固定値（第9段階で追加）。
          // 依頼文の元の書式（left/rightに値オブジェクトを直接書く形）は、既存の
          // {source, key} という構造に合わせて {source:"literal", value:{...}} と読み替えている。
          if (!isValidLiteralOperandValue(operand.value)) {
            errors.push(`${label}.${side} のliteral値が不正です: ${JSON.stringify(operand.value)}`);
          }
        }
      }

      if (step.resultKey !== undefined) {
        if (seenResultKeys.has(step.resultKey)) {
          errors.push(`${label}.resultKey がルート内で重複しています: ${step.resultKey}`);
        }
        seenResultKeys.add(step.resultKey);
      } else {
        errors.push(`${label}.resultKey が指定されていません`);
      }
    });
  });
}

/**
 * テンプレート一覧全体を検証します（ID重複チェックを含む）。
 * @returns {{valid: boolean, errors: string[], duplicateIds: string[], results: Array<{id, category, valid, errors}>}}
 */
export function validateTemplateSet(templates) {
  if (!Array.isArray(templates)) {
    return { valid: false, errors: ["テンプレート一覧が配列ではありません"], duplicateIds: [], results: [] };
  }

  const idCounts = new Map();
  for (const template of templates) {
    const id = template && template.id;
    if (id) {
      idCounts.set(id, (idCounts.get(id) || 0) + 1);
    }
  }
  const duplicateIds = [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id);

  const results = templates.map((template) => {
    const { errors } = validateTemplate(template);
    const allErrors = [...errors];
    if (template && duplicateIds.includes(template.id)) {
      allErrors.push(`問題IDが重複しています: ${template.id}`);
    }
    return {
      id: template ? template.id : "(不明)",
      category: template ? template.category : "(不明)",
      valid: allErrors.length === 0,
      errors: allErrors
    };
  });

  const setLevelErrors = [];
  if (duplicateIds.length > 0) {
    setLevelErrors.push(`問題IDが重複しています: ${duplicateIds.join(", ")}`);
  }

  return {
    valid: setLevelErrors.length === 0 && results.every((r) => r.valid),
    errors: setLevelErrors,
    duplicateIds,
    results
  };
}

/**
 * 値（数値または分数）1つが、表示・検証の観点から正常かどうかを確認します。
 * - 数値: 小数点以下の桁数が多すぎないか、formatNumber/parseFormattedNumberの往復変換が一致するか
 * - 分数: 分子・分母が整数かつ分母が0でないか、表示用HTML・aria-labelが正しく生成できるか
 */
function validateValueRepresentation(value, label, errors) {
  if (isFractionValue(value)) {
    if (!isValidFraction(value)) {
      errors.push(`${label} が正しい分数の形ではありません: ${JSON.stringify(value)}`);
      return;
    }
    let html = "";
    try {
      html = renderValueHtml(value);
      if (!html || typeof html !== "string" || html.length === 0) {
        errors.push(`${label} の分数表示用HTMLが生成できません`);
      }
    } catch (error) {
      errors.push(`${label} の分数表示用HTML生成中にエラーが発生しました: ${error.message}`);
    }
    // 約分した結果、分母が1になる場合（＝整数として表示される場合）は縦型分数のHTMLを
    // 生成しないため（第10段階で追加。renderValueHtml() 参照）、分数用のaria-labelチェックは
    // 実際に縦型分数として表示される場合だけ行う。
    if (html.includes('class="fraction"')) {
      const ariaLabel = buildFractionAriaLabel(value);
      if (!/^\d+分の\d+$/.test(ariaLabel)) {
        errors.push(`${label} のaria-labelの形式が不正です: ${ariaLabel}`);
      }
    }
    return;
  }

  if (isPercentValue(value)) {
    if (!isValidPercent(value)) {
      errors.push(`${label} が正しい百分率の形ではありません: ${JSON.stringify(value)}`);
      return;
    }
    if (getDecimalPlaces(value.value) > MAX_REASONABLE_DECIMAL_PLACES) {
      errors.push(`${label} の百分率の小数点以下の桁数が不自然です: ${value.value}%`);
    }
    try {
      const html = renderValueHtml(value);
      if (!html || typeof html !== "string" || html.length === 0) {
        errors.push(`${label} の百分率表示用HTMLが生成できません`);
      }
      // カード・解答欄・履歴などの値表示は、百分率を比率（小数）に変換して表示する
      // （例: 20% → "0.2"。問題文中の「20%」という自然な言い回しは、
      // この renderValueHtml() を経由しない別経路のため、ここでは検証しない）。
      // "0.20" のような不要な末尾の0が無いかを表示テキストで確認する。
      if (!/^\d+(\.\d+)?$/.test(html.replace(/<[^>]+>/g, ""))) {
        errors.push(`${label} の百分率の表示テキスト（小数表記）が不正です: ${html}`);
      }
    } catch (error) {
      errors.push(`${label} の百分率表示用HTML生成中にエラーが発生しました: ${error.message}`);
    }
    return;
  }

  if (typeof value !== "number") return;
  if (getDecimalPlaces(value) > MAX_REASONABLE_DECIMAL_PLACES) {
    errors.push(`${label} の小数点以下の桁数が不自然です: ${value}`);
  }
  const roundTrip = parseFormattedNumber(formatNumber(value));
  if (!areNumbersEqual(roundTrip, value)) {
    errors.push(`${label} の表示用の数値表現が内部値と一致しません: ${value} → "${formatNumber(value)}" → ${roundTrip}`);
  }
}

/**
 * 値の配列に、指定した値と構造的に一致する要素が含まれているかを判定します
 * （分数はオブジェクト参照ではなく、分子・分母の値で判定します）。
 */
function containsValue(values, target) {
  if (target === undefined) return true;
  if (isFractionValue(target)) {
    return values.some(
      (v) => isFractionValue(v) && v.numerator === target.numerator && v.denominator === target.denominator
    );
  }
  if (isPercentValue(target)) {
    return values.some((v) => isPercentValue(v) && v.value === target.value);
  }
  return values.includes(target);
}

/**
 * question-generator.js が生成した問題（数値確定後）を検証します。
 * 2段階問題（questionType: "multiStep"）は validateGeneratedMultiStepQuestion に委譲します。
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateGeneratedQuestion(problem) {
  if (!problem) {
    return { valid: false, errors: ["問題オブジェクトがありません"] };
  }

  if (problem.questionType === "multiStep") {
    return validateGeneratedMultiStepQuestion(problem);
  }

  const errors = [];

  const routes =
    Array.isArray(problem.solutionRoutes) && problem.solutionRoutes.length > 0
      ? problem.solutionRoutes
      : [{ left: problem.left, operator: problem.operator, right: problem.right, result: problem.result }];

  if (routes.length === 0) {
    errors.push("正解ルートが存在しません");
  }

  const validResults = [];

  for (const route of routes) {
    if (!route || !VALID_OPERATORS.includes(route.operator)) {
      errors.push(`不正な演算記号です: ${route && route.operator}`);
      continue;
    }

    if (route.operator === "÷") {
      if (isZeroValue(route.right)) {
        errors.push("わる数が0です");
        continue;
      }
      const generatorType = problem.template && problem.template.generatorType;
      const rule = getGeneratorRule(generatorType);
      if (rule.divisorRange) {
        const { min, max } = rule.divisorRange;
        if (route.right < min || route.right > max) {
          errors.push(`わる数が想定範囲外です: ${route.right}（${min}〜${max}である必要があります）`);
        }
      }
    }

    const computed = computeStepResultForValidation(route.left, route.operator, route.right, route.resultType);
    if (computed === null) {
      errors.push(`式が計算できません（わり切れない場合も含む）: ${route.left}${route.operator}${route.right}`);
      continue;
    }
    if (route.result !== undefined && !areValuesEqual(computed, route.result)) {
      errors.push(
        `正解式と計算結果が一致しません: ${route.left}${route.operator}${route.right} => 期待値${JSON.stringify(route.result)}, 計算値${JSON.stringify(computed)}`
      );
      continue;
    }
    if (isValueNegative(computed)) {
      errors.push(`答えが負の数です: ${route.left}${route.operator}${route.right} = ${JSON.stringify(computed)}`);
      continue;
    }
    validateValueRepresentation(route.left, "left", errors);
    validateValueRepresentation(route.right, "right", errors);
    validateValueRepresentation(computed, "計算結果", errors);

    // 同分母分数のたし算・ひき算では、実際に生成された left/right の分母が一致しているかも確認する
    // （generatorTypeで同分母専用のものに限定する。異分母分数のたし算・ひき算では、
    //  分母が異なることこそが正しい状態なので、この確認は行わない）。
    const generatorType = problem.template && problem.template.generatorType;
    if (
      SAME_DENOMINATOR_GENERATOR_TYPES.has(generatorType) &&
      isFractionValue(route.left) &&
      isFractionValue(route.right) &&
      (route.operator === "+" || route.operator === "-")
    ) {
      if (route.left.denominator !== route.right.denominator) {
        errors.push(`同分母分数の問題なのに、生成されたleft/rightの分母が異なります: ${route.left.denominator} / ${route.right.denominator}`);
      }
    }

    validResults.push(computed);
  }

  if (validResults.length === 0) {
    errors.push("正解ルートが存在しません(すべてのルートが不正です)");
  } else {
    const uniqueResultKeys = new Set(
      validResults.map((v) => {
        if (isFractionValue(v)) return `fraction:${v.numerator}/${v.denominator}`;
        if (isPercentValue(v)) return `percent:${v.value}`;
        return v;
      })
    );
    if (uniqueResultKeys.size > 1) {
      const anyMismatch = validResults.some((v, i) => i > 0 && !areValuesEqual(v, validResults[0]));
      if (anyMismatch) {
        errors.push(`solutionRoutes間で答えが一致しません: ${JSON.stringify(validResults)}`);
      }
    }
  }

  if (!Array.isArray(problem.choices)) {
    errors.push("選択肢カード(choices)が配列ではありません");
  } else {
    if (problem.choices.length > 8) {
      errors.push(`選択肢が8枚を超えています: ${problem.choices.length}枚`);
    }
    const canonical = routes[0];
    if (canonical) {
      const numberValues = problem.choices.filter((c) => c.type === "number").map((c) => c.value);
      const operatorValues = problem.choices.filter((c) => c.type === "operator").map((c) => c.value);
      if (!operatorValues.includes(canonical.operator)) {
        errors.push(`必要な演算記号カードがありません: ${canonical.operator}`);
      }
      if (!containsValue(numberValues, canonical.left)) {
        errors.push(`必要な数値カードがありません: ${JSON.stringify(canonical.left)}`);
      }
      if (!containsValue(numberValues, canonical.right)) {
        errors.push(`必要な数値カードがありません: ${JSON.stringify(canonical.right)}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 2段階問題（questionType: "multiStep"）の生成結果を検証します。
 * ここでは「生成直後（=1つ目の式に取り組む前）の状態」が正しいかだけを検証します
 * （毎回の問題生成で走る、負荷の軽いチェックです）。
 * 「すべての解法ルートを実際に最後まで進められるか」「2つ目以降のステップのカードが
 * 正しいか」といった重い検証は、開発者用の検証ページから
 * multi-step-engine.js の simulateAllRoutesToCompletion() を使って行います。
 * 今回のバージョンでは2段階問題に小数・分数は存在しませんが、areValuesEqual /
 * isValueNegative など値の型を意識しない共通関数を使っているため、将来
 * 小数・分数の2段階問題を追加した場合もこの関数はそのまま使えます。
 */
function validateGeneratedMultiStepQuestion(problem) {
  const errors = [];

  const routes = Array.isArray(problem.solutionRoutes) ? problem.solutionRoutes : [];
  if (routes.length === 0) {
    errors.push("正解ルートが存在しません");
    return { valid: false, errors };
  }

  const finalAnswer = problem.answer !== undefined ? problem.answer : problem.result;
  const finalResultsByRoute = [];

  for (const route of routes) {
    if (!Array.isArray(route.steps) || route.steps.length === 0) {
      errors.push(`[${route.id}] steps が空です`);
      continue;
    }

    let routeValid = true;
    for (const step of route.steps) {
      if (!VALID_OPERATORS.includes(step.operator)) {
        errors.push(`[${route.id}] 不正な演算記号です: ${step.operator}`);
        routeValid = false;
        break;
      }
      if (step.operator === "÷") {
        if (isZeroValue(step.right)) {
          errors.push(`[${route.id}] わる数が0です: ${JSON.stringify(step.left)}÷${JSON.stringify(step.right)}`);
          routeValid = false;
          break;
        }
      }
      const computed = computeStepResultForValidation(step.left, step.operator, step.right, step.resultType);
      if (computed === null) {
        errors.push(`[${route.id}] 式が計算できません: ${JSON.stringify(step.left)}${step.operator}${JSON.stringify(step.right)}`);
        routeValid = false;
        break;
      }
      if (step.result !== undefined && !areValuesEqual(computed, step.result)) {
        errors.push(
          `[${route.id}] 正解式と計算結果が一致しません: ${step.left}${step.operator}${step.right} => 期待値${JSON.stringify(step.result)}, 計算値${JSON.stringify(computed)}`
        );
        routeValid = false;
        break;
      }
      if (isValueNegative(computed)) {
        errors.push(`[${route.id}] 途中結果が負の数です: ${step.left}${step.operator}${step.right} = ${JSON.stringify(computed)}`);
        routeValid = false;
        break;
      }
    }

    if (routeValid) {
      const lastStep = route.steps[route.steps.length - 1];
      finalResultsByRoute.push(lastStep.result);
      if (finalAnswer !== undefined && !areValuesEqual(lastStep.result, finalAnswer)) {
        errors.push(`[${route.id}] 最終結果が answer/result と一致しません: ${JSON.stringify(lastStep.result)} !== ${JSON.stringify(finalAnswer)}`);
      }
    }
  }

  if (finalResultsByRoute.length === 0) {
    errors.push("正解ルートが存在しません(すべてのルートが不正です)");
  } else {
    const anyMismatch = finalResultsByRoute.some((v, i) => i > 0 && !areValuesEqual(v, finalResultsByRoute[0]));
    if (anyMismatch) {
      errors.push(`solutionRoutes間で最終的な答えが一致しません: ${JSON.stringify(finalResultsByRoute)}`);
    }
  }

  // 比を使った数量・比例配分（quantityRelation.type が "ratio-application"／
  // "proportional-allocation" のテンプレート）は、出題される比の前項・後項が
  // 「互いに素」（最大公約数が1）で、かつどちらも1ではない整数になっている必要があります
  // （第11段階で追加。generateRatioApplicationValues()/generateProportionalAllocationValues()
  //  の pickCoprimeRatioTerms() が生成時に保証していますが、将来テンプレートの範囲が
  //  変わっても壊れないよう、生成済み問題の側でも検証しておきます）。
  if (isValidRatio(problem.values && problem.values.ratioValue)) {
    const { antecedent, consequent } = problem.values.ratioValue;
    if (antecedent === 1 || consequent === 1) {
      errors.push(`比の前項・後項に1が含まれています: ${antecedent}：${consequent}`);
    } else if (gcd(antecedent, consequent) !== 1) {
      errors.push(`比の前項・後項が互いに素ではありません: ${antecedent}：${consequent}`);
    }
  }

  if (!Array.isArray(problem.choices)) {
    errors.push("選択肢カード(choices)が配列ではありません");
  } else {
    if (problem.choices.length > 8) {
      errors.push(`選択肢が8枚を超えています: ${problem.choices.length}枚`);
    }
    if (problem.choices.some((c) => c.source === "intermediate")) {
      errors.push("1つ目の式の時点で、中間結果カードが選択肢に含まれています");
    }
    const dummyNumberValues = problem.choices.filter((c) => c.type === "number" && c.source === "dummy").map((c) => c.value);
    if (finalAnswer !== undefined && containsValue(dummyNumberValues, finalAnswer)) {
      errors.push(`最終的な答え(${JSON.stringify(finalAnswer)})がダミーカードとして選択肢に含まれています`);
    }

    // 1つ目の式で必要になりうる数値・演算記号(候補ルートすべて)が揃っているか
    const firstStepDefs = routes.filter((r) => Array.isArray(r.steps) && r.steps[0]).map((r) => r.steps[0]);
    const numberValues = problem.choices.filter((c) => c.type === "number").map((c) => c.value);
    const operatorValues = problem.choices.filter((c) => c.type === "operator").map((c) => c.value);
    for (const step of firstStepDefs) {
      if (!operatorValues.includes(step.operator)) {
        errors.push(`必要な演算記号カードがありません: ${step.operator}`);
      }
      if (!containsValue(numberValues, step.left)) {
        errors.push(`必要な数値カードがありません: ${JSON.stringify(step.left)}`);
      }
      if (!containsValue(numberValues, step.right)) {
        errors.push(`必要な数値カードがありません: ${JSON.stringify(step.right)}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 出題範囲ごとのテンプレート集合を検証し、不正なテンプレートを出題プールから除外します。
 * questionType が multiStep のテンプレートも（専用の gradeTerm に登録されていれば）
 * 通常どおり対象になります。除外したものはコンソールに理由を出力します。
 * js/game.js（通常バトル）・js/training-mode.js（トレーニング）の両方が、
 * 起動時にこの関数を通してから出題プールとして使用します。
 */
export function filterValidTemplateSets(sets) {
  const filtered = {};
  for (const [gradeTerm, templates] of Object.entries(sets || {})) {
    const { results } = validateTemplateSet(templates);
    const byId = new Map(templates.map((t) => [t.id, t]));
    const validTemplates = [];

    for (const result of results) {
      if (!result.valid) {
        console.error(`[question-validator] テンプレート "${result.id}" (${gradeTerm}) は無効なため出題プールから除外します:`, result.errors);
        continue;
      }
      validTemplates.push(byId.get(result.id));
    }

    filtered[gradeTerm] = validTemplates;
  }
  return filtered;
}

/**
 * カテゴリレジストリ（data/category-registry.js の categoryRegistry）自体の構造を検証します。
 * - id が空でない文字列で、重複していないか
 * - label / gradeLabel が空でないか
 * - gradeTerm が実在の出題範囲キーか
 * - order が数値か
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateCategoryRegistry(registry) {
  const errors = [];
  if (!Array.isArray(registry)) {
    return { valid: false, errors: ["カテゴリレジストリが配列ではありません"] };
  }

  const idCounts = new Map();
  for (const category of registry) {
    if (!category || typeof category.id !== "string" || category.id.length === 0) {
      errors.push("idが空、または文字列ではないカテゴリがあります");
      continue;
    }
    idCounts.set(category.id, (idCounts.get(category.id) || 0) + 1);

    if (typeof category.label !== "string" || category.label.length === 0) {
      errors.push(`カテゴリ "${category.id}" のlabelが空です`);
    }
    if (typeof category.gradeLabel !== "string" || category.gradeLabel.length === 0) {
      errors.push(`カテゴリ "${category.id}" のgradeLabelが空です`);
    }
    if (!VALID_GRADE_TERMS.includes(category.gradeTerm)) {
      errors.push(`カテゴリ "${category.id}" のgradeTermが不正です: ${category.gradeTerm}`);
    }
    if (typeof category.order !== "number" || !Number.isFinite(category.order)) {
      errors.push(`カテゴリ "${category.id}" のorderが数値ではありません`);
    }
    if (typeof category.enabledInTraining !== "boolean") {
      errors.push(`カテゴリ "${category.id}" のenabledInTrainingがtrue/falseではありません`);
    }
  }

  const duplicateIds = [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
  if (duplicateIds.length > 0) {
    errors.push(`カテゴリIDが重複しています: ${duplicateIds.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * カテゴリレジストリと、実際のテンプレート一覧（data/index.js の getAllTemplates() 相当）との
 * 対応関係を検証します。
 * - トレーニング選択可能な（enabledInTraining）カテゴリに、対応するテンプレートが1件以上あるか
 * - そのカテゴリのテンプレートが、レジストリに登録した学期（gradeTerm）と矛盾していないか
 *   （"multi-step-integer" は gradeTerm: "4-multi-step" のテンプレートを
 *    4-2学期グループの1カテゴリとして扱う特別枠のため、この学期一致チェックの対象外とします）
 * - どのカテゴリにも属さない（レジストリに存在しない categoryId を持つ）孤立したテンプレートがないか
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateCategoryRegistryAgainstTemplates(registry, allTemplates) {
  const errors = [];
  const templatesByCategoryId = new Map();

  for (const template of allTemplates || []) {
    const categoryId = template && template.categoryId;
    if (typeof categoryId !== "string" || categoryId.length === 0) {
      errors.push(`テンプレート "${template && template.id}" に categoryId がありません`);
      continue;
    }
    const arr = templatesByCategoryId.get(categoryId) || [];
    arr.push(template);
    templatesByCategoryId.set(categoryId, arr);
  }

  const registryIds = new Set((registry || []).map((c) => c.id));

  for (const category of (registry || []).filter((c) => c.enabledInTraining)) {
    const templates = templatesByCategoryId.get(category.id) || [];
    if (templates.length === 0) {
      errors.push(`カテゴリ "${category.id}"（${category.label}）に対応するテンプレートが1件もありません`);
      continue;
    }
    if (category.id !== "multi-step-integer") {
      const wrongTermTemplates = templates.filter((t) => t.gradeTerm !== category.gradeTerm);
      if (wrongTermTemplates.length > 0) {
        errors.push(
          `カテゴリ "${category.id}"（学期: ${category.gradeTerm}）に、異なる学期のテンプレートが含まれています: ${wrongTermTemplates.map((t) => t.id).join(", ")}`
        );
      }
    }
  }

  for (const [categoryId, templates] of templatesByCategoryId) {
    if (!registryIds.has(categoryId)) {
      errors.push(`レジストリに存在しない categoryId を持つテンプレートがあります: ${categoryId}（${templates.map((t) => t.id).join(", ")}）`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 検証エラーをコンソールに分かりやすく出力します。
 */
export function logValidationErrors(id, errors) {
  if (!errors || errors.length === 0) return;
  console.error(`[question-validator] "${id}" の検証に失敗しました:`);
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
}
