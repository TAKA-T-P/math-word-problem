// 問題テンプレート・生成済み問題を検証するモジュール。
// ゲーム本体（question-generator.js / game.js）と、開発者用の検証ページ
// （tools/question-validator.html）の両方から使われる、副作用のない純粋関数群です。

import { safeCalculate } from "./answer-checker.js";
import { areValuesEqual, isValueNegative, isFractionValue, isValidFraction } from "./value-utils.js";
import { areNumbersEqual, getDecimalPlaces, formatNumber, parseFormattedNumber } from "./number-utils.js";
import { renderValueHtml, buildFractionAriaLabel } from "./value-renderer.js";

// このアプリで扱う小数点以下の最大桁数（4.15 のような2桁まで）。
// これを超える場合は「小学4年生として不自然」と判断してエラーにします。
const MAX_REASONABLE_DECIMAL_PLACES = 2;

// 分数の分母として許容する範囲（小学4年生として不自然に大きな分母を避けるため）。
const MIN_REASONABLE_FRACTION_DENOMINATOR = 2;
const MAX_REASONABLE_FRACTION_DENOMINATOR = 12;

// 現在 data/index.js に登録されている出題範囲キー。新しい学期を追加したら、
// ここにも追加してください（data/index.js から自動取得すると循環参照になりやすいため、
// 検証専用の一覧として独立させています）。
const VALID_GRADE_TERMS = ["4-1", "4-2", "4-3", "4-multi-step", "5-1", "5-2"];

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
  }
};

// 2段階問題は、今回のバージョンではすべてちょうど2つの式で解く問題に限定する。
const REQUIRED_MULTI_STEP_COUNT = 2;

export const VALID_GENERATOR_TYPES = Object.keys(GENERATOR_TYPE_RULES);

function extractPlaceholders(templateText) {
  const matches = templateText.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

function getGeneratorRule(generatorType) {
  return GENERATOR_TYPE_RULES[generatorType] || { requiredVariableKeys: [], computedVariables: [] };
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
    const computedKeyField = config ? config.computedKeyField : "comparedKey";
    if (typeof qr[computedKeyField] === "string") {
      keys.add(qr[computedKeyField]);
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
      `quantityRelation.type が不正です: ${qr.type}（"multiplicative-comparison"／"average"／"unit-rate" のいずれか）`
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
 * 同分母分数のたし算・ひき算のテンプレートについて、a・bの分母が一致しているか、
 * ひき算の場合に答えが負にならない範囲設計になっているかを検証します
 * （実際の生成値ではなく、テンプレートの範囲定義そのものを静的にチェックします）。
 */
function validateSameDenominatorFractionRanges(template, errors) {
  const variables = template.variables || {};
  const a = variables.a;
  const b = variables.b;
  if (!a || !b || a.type !== "fraction" || b.type !== "fraction") {
    errors.push(`generatorType="${template.generatorType}" には、a と b が分数型の変数として必要です`);
    return;
  }
  if (a.denominator !== b.denominator) {
    errors.push(`同分母分数の問題なのに、a と b の分母が異なります: ${a.denominator} / ${b.denominator}`);
  }
  if (
    template.generatorType === "sameDenominatorFractionSubtraction" &&
    typeof a.numeratorMin === "number" &&
    typeof b.numeratorMax === "number" &&
    a.numeratorMin < b.numeratorMax
  ) {
    errors.push(
      `ひき算の答えが負になる可能性があります: a.numeratorMin(${a.numeratorMin}) が` +
        ` b.numeratorMax(${b.numeratorMax}) より小さいです`
    );
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

  // 小数（decimalPlaces指定）・分数（type:"fraction"）の変数定義を検証する。
  if (hasVariables) {
    for (const [key, range] of Object.entries(template.variables)) {
      if (!range || typeof range !== "object") continue;
      if (range.type === "fraction") {
        validateFractionVariable(key, range, errors);
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
    if (route.steps.length !== REQUIRED_MULTI_STEP_COUNT) {
      errors.push(
        `solutionRoutes[${routeIndex}(${route.id})].steps は${REQUIRED_MULTI_STEP_COUNT}つである必要があります（実際: ${route.steps.length}）`
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
          errors.push(`${label}.${side} はオブジェクト({source, key})で指定してください`);
          continue;
        }
        if (operand.source !== "variable" && operand.source !== "result") {
          errors.push(`${label}.${side}.source が不正です: ${operand.source}（"variable" か "result" のみ）`);
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
    try {
      const html = renderValueHtml(value);
      if (!html || typeof html !== "string" || html.length === 0) {
        errors.push(`${label} の分数表示用HTMLが生成できません`);
      }
    } catch (error) {
      errors.push(`${label} の分数表示用HTML生成中にエラーが発生しました: ${error.message}`);
    }
    const ariaLabel = buildFractionAriaLabel(value);
    if (!/^\d+分の\d+$/.test(ariaLabel)) {
      errors.push(`${label} のaria-labelの形式が不正です: ${ariaLabel}`);
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
      if (route.right === 0) {
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

    const computed = safeCalculate(route.left, route.operator, route.right);
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
    const uniqueResultKeys = new Set(validResults.map((v) => (isFractionValue(v) ? `${v.numerator}/${v.denominator}` : v)));
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
        if (step.right === 0) {
          errors.push(`[${route.id}] わる数が0です: ${step.left}÷${step.right}`);
          routeValid = false;
          break;
        }
      }
      const computed = safeCalculate(step.left, step.operator, step.right);
      if (computed === null) {
        errors.push(`[${route.id}] 式が計算できません: ${step.left}${step.operator}${step.right}`);
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
