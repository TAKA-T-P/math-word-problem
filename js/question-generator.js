// 問題テンプレートから、実際に出題する問題（数値を当てはめたもの）と
// 選択肢カードを生成するモジュール。
// 問題データ（data/*.js）はここには含めず、外部から渡してもらう設計にしています。
// そのため、新しいテンプレートをデータファイルに追加するだけで、
// このファイルを修正する必要はありません。
//
// questionType が "multiStep" の場合、途中式の進行管理・カード再生成・履歴整形は
// js/multi-step-engine.js に委譲します（このファイルは値の生成とルートの数値解決まで）。
// multi-step-engine.js からはこのファイルの汎用ユーティリティ（buildChoiceCards 等）を
// 再利用するため、2つのファイルは互いに import し合っています。
// どちらのファイルもモジュール読み込み時（トップレベル）には相手の関数を呼び出さず、
// 実行時（関数の中）でのみ使用するため、この相互参照は安全です。

import { safeCalculate } from "./answer-checker.js";
import { validateGeneratedQuestion } from "./question-validator.js";
import { initializeMultiStepQuestion } from "./multi-step-engine.js";
import { normalizeNumber, multiplyDecimal } from "./number-utils.js";
import { valueKey, isFractionValue, formatValue } from "./value-utils.js";
import { fractionToNumber } from "./fraction-utils.js";

export const OPERATORS = ["+", "-", "×", "÷"];

// 1テンプレートから有効な問題を生成できるまでの最大リトライ回数。
// 正しく作られたテンプレートであれば通常1回で成功する。安全弁として用意している。
const MAX_GENERATION_ATTEMPTS = 25;

let questionSequence = 0;

export function pickInt(min, max) {
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/**
 * min〜max の範囲を step 刻みで取りうる値の中からランダムに1つ選びます（整数用）。
 */
export function pickStepped(range) {
  const step = range.step && range.step > 0 ? range.step : 1;
  const stepsCount = Math.floor((range.max - range.min) / step);
  const chosenStep = pickInt(0, Math.max(stepsCount, 0));
  return range.min + chosenStep * step;
}

/**
 * min〜max の範囲から、指定した小数点以下の桁数（decimalPlaces）に沿って
 * ランダムな小数値を1つ選びます。誤差の出ないよう整数へスケーリングしてから選びます。
 * 「小数のたし算・ひき算」の問題が実際に小数らしくなるよう、ちょうど割り切れて
 * 整数になってしまった場合は1目盛りだけずらします。
 */
export function pickDecimalValue(range) {
  const decimalPlaces = range.decimalPlaces || 0;
  if (decimalPlaces <= 0) {
    return pickStepped(range);
  }
  const factor = Math.pow(10, decimalPlaces);
  const minScaled = Math.round(range.min * factor);
  const maxScaled = Math.round(range.max * factor);
  let scaled = pickInt(minScaled, maxScaled);
  if (scaled % factor === 0 && maxScaled - minScaled >= 1) {
    scaled = scaled >= maxScaled ? scaled - 1 : scaled + 1;
  }
  return normalizeNumber(scaled / factor);
}

/**
 * 分数の変数定義 { type:"fraction", denominator, numeratorMin, numeratorMax } から、
 * 分子だけをランダムに選び、分数の値を1つ作ります。
 * 分母はテンプレート側で固定値として指定するため（同分母分数のたし算・ひき算専用）、
 * ここでランダム化することはありません。
 */
function pickFractionValue(range) {
  const numerator = pickInt(range.numeratorMin, range.numeratorMax);
  return { type: "fraction", numerator, denominator: range.denominator };
}

/**
 * 1つの変数の範囲定義から、その種類（分数・小数・整数）に応じた値を1つ選びます。
 *   - type: "fraction"      → 分数（pickFractionValue）
 *   - decimalPlaces あり    → 小数（pickDecimalValue）
 *   - それ以外               → 整数（pickStepped）
 * generateStandardValues() と、小数倍・もとの量専用の生成関数の両方から使う共通処理です。
 */
function pickValueForRange(range) {
  if (range.type === "fraction") {
    return pickFractionValue(range);
  }
  if (range.decimalPlaces) {
    return pickDecimalValue(range);
  }
  return pickStepped(range);
}

/**
 * variables で定義された各変数の値を、独立にランダム生成します。
 * （たし算・ひき算・かけ算、小数のたし算・ひき算・かけ算、大きな数、
 *  同分母分数のたし算・ひき算、除算を含まない2段階問題で使用）
 */
export function generateStandardValues(variables) {
  const values = {};
  for (const key of Object.keys(variables)) {
    values[key] = pickValueForRange(variables[key]);
  }
  return values;
}

/**
 * わり算専用の生成ルール。
 * 先に divisor（わる数）と quotient（商）を決めてから、
 * dividend（わられる数）= divisor × quotient を計算します。
 * これにより、必ずあまりなく割り切れる問題になります。
 * わる数が1けた（generatorType: "exactDivision"）か2けた
 * （generatorType: "exactDivisionTwoDigit"）かは、テンプレート側の
 * variables.divisor の範囲（min/max）で決まります。生成アルゴリズム自体は同じです。
 */
function generateExactDivisionValues(variables) {
  const divisor = pickStepped(variables.divisor);
  const quotient = pickStepped(variables.quotient);
  return {
    divisor,
    quotient,
    dividend: divisor * quotient
  };
}

/**
 * 2段階問題「わり算 → 何か」用の生成ルール。
 * divisor・quotient から dividend を求める点は generateExactDivisionValues と同じ。
 * それ以外の変数（2つ目の式で使う独立した数など）は通常どおり生成します。
 */
function generateMultiStepDivideFirstValues(variables) {
  const { divisor, quotient, ...rest } = variables;
  const divisorValue = pickStepped(divisor);
  const quotientValue = pickStepped(quotient);
  const values = {
    divisor: divisorValue,
    quotient: quotientValue,
    dividend: divisorValue * quotientValue
  };
  for (const key of Object.keys(rest)) {
    values[key] = pickStepped(rest[key]);
  }
  return values;
}

/**
 * 2段階問題「たし算 → わり算」用の生成ルール。
 * 先に divisor・quotient を決めて sum(= divisor × quotient) を求め、
 * その sum を a + b の形に分割します（b = sum - a）。
 * これにより、1つ目の式の答え（a+b）が必ず divisor で割り切れることを保証します。
 * variables には divisor・quotient・a の3つを定義してください（b は自動計算されます）。
 */
function generateMultiStepSumToDivisibleValues(variables) {
  const divisorValue = pickStepped(variables.divisor);
  const quotientValue = pickStepped(variables.quotient);
  const aValue = pickStepped(variables.a);
  const sum = divisorValue * quotientValue;
  return {
    divisor: divisorValue,
    quotient: quotientValue,
    a: aValue,
    b: sum - aValue,
    sum
  };
}

/**
 * 小数÷整数専用の生成ルール。
 * 先に商(quotient・小数)とわる数(divisor・整数)を決めてから、
 * わられる数(dividend) = quotient × divisor を計算します（誤差の出ない multiplyDecimal を使用）。
 * これにより、必ず有限小数で割り切れる問題になります（循環小数・あまりのあるわり算を防止）。
 */
function generateExactDecimalDivisionValues(variables) {
  const divisor = pickStepped(variables.divisor);
  const quotient = pickDecimalValue(variables.quotient);
  const dividend = normalizeNumber(multiplyDecimal(quotient, divisor));
  return { divisor, quotient, dividend };
}

/**
 * 小数÷小数専用の生成ルール（小学5年生1学期）。
 * exactDecimalDivisionByInteger と同じ考え方で、わる数(divisor)・商(quotient)を
 * 両方とも小数として先に決めてから、わられる数(dividend) = divisor × quotient を
 * 計算します（誤差の出ない multiplyDecimal を使用）。これにより、必ず有限小数で
 * 割り切れる問題になります（循環小数・あまりのあるわり算を防止）。
 */
function generateExactDecimalDivisionByDecimalValues(variables) {
  const divisor = pickDecimalValue(variables.divisor);
  const quotient = pickDecimalValue(variables.quotient);
  const dividend = normalizeNumber(multiplyDecimal(divisor, quotient));
  return { divisor, quotient, dividend };
}

/**
 * 小数倍・もとの量専用の生成ルール（小学5年生1学期）。
 * テンプレートの quantityRelation（baseKey・comparedKey・multiplierKey）が指す
 * 変数名を使って、基準量(base)・何倍(multiplier)を独立に生成し、
 * 比較量(compared) = base × multiplier を誤差の出ない multiplyDecimal で計算します。
 * 「何が未知（答え）か」はテンプレートの solutionRoutes 側が決めるため、
 * この関数は常に3つの値をすべて生成するだけで、小数倍・もとの量の両カテゴリで共通に使えます。
 */
function generateDecimalMultiplicativeComparisonValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（小数倍・もとの量には必須です）。");
  }
  const { baseKey, comparedKey, multiplierKey } = quantityRelation;
  return generateProportionalValues(variables, baseKey, multiplierKey, comparedKey);
}

/**
 * 「aKey × bKey = productKey」という関係を持つ2つの値を独立に生成し、積を
 * 誤差の出ない multiplyDecimal で計算する、汎用の生成ロジックです（第8段階で追加）。
 * 小数倍・もとの量（base×multiplier=compared）、平均（count×average=total）、
 * 単位量あたり・混み具合（unitCount×perUnit=total）は、いずれも「2つの既知の値から
 * 積にあたる3つ目の値を求める」という同じ構造を持つため、この1つの関数を共有しています。
 * 「どれが未知（答え）か」は各テンプレートの solutionRoutes 側が決めるため、
 * この関数は常に3つの値をすべて生成するだけです。
 */
function generateProportionalValues(variables, aKey, bKey, productKey) {
  const aValue = pickValueForRange(variables[aKey]);
  const bValue = pickValueForRange(variables[bKey]);
  const productValue = normalizeNumber(multiplyDecimal(aValue, bValue));
  return { [aKey]: aValue, [bKey]: bValue, [productKey]: productValue };
}

/**
 * 平均専用の生成ルール（小学5年生2学期）。
 * quantityRelation（countKey・averageKey・totalKey）が指す変数名を使って、
 * generateProportionalValues() に委譲します（count×average=total）。
 * 平均を求める問題（合計÷個数）・合計を求める問題（平均×個数）のどちらも、
 * 生成ロジック自体は同じで、「何が未知か」は solutionRoutes 側が決めます。
 */
function generateAverageValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（平均には必須です）。");
  }
  const { countKey, averageKey, totalKey } = quantityRelation;
  return generateProportionalValues(variables, countKey, averageKey, totalKey);
}

/**
 * 単位量あたり・混み具合専用の生成ルール（小学5年生2学期）。
 * quantityRelation（unitCountKey・perUnitKey・totalKey）が指す変数名を使って、
 * generateProportionalValues() に委譲します（unitCount×perUnit=total）。
 * 混み具合（1㎡あたりの人数など）も、数量関係としては単位量あたりと全く同じ構造
 * （全体量＝単位数×1単位あたりの量）のため、同じ関数を共有しています
 * （カテゴリとしての区別は categoryId・問題文のテーマだけで行います）。
 */
function generateUnitRateValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（単位量あたり・混み具合には必須です）。");
  }
  const { unitCountKey, perUnitKey, totalKey } = quantityRelation;
  return generateProportionalValues(variables, unitCountKey, perUnitKey, totalKey);
}

const GENERATOR_TYPE_HANDLERS = {
  standard: (variables) => generateStandardValues(variables),
  // decimalAddition / decimalSubtraction / decimalTimesInteger / decimalTimesDecimal /
  // sameDenominatorFractionAddition / sameDenominatorFractionSubtraction は
  // すべて standard のエイリアス。生成の「戦略」（各変数を独立に生成する）は同じで、
  // 演算の種類は solutionRoutes 側が決めるため、別の生成関数を用意する必要が無いためです。
  decimalAddition: (variables) => generateStandardValues(variables),
  decimalSubtraction: (variables) => generateStandardValues(variables),
  decimalTimesInteger: (variables) => generateStandardValues(variables),
  // 小数×小数（小学5年生1学期）。left・rightどちらも decimalPlaces 付きの変数として
  // 定義するだけで、standardと全く同じ「各変数を独立に生成する」戦略で作れます。
  decimalTimesDecimal: (variables) => generateStandardValues(variables),
  sameDenominatorFractionAddition: (variables) => generateStandardValues(variables),
  sameDenominatorFractionSubtraction: (variables) => generateStandardValues(variables),
  exactDivision: (variables) => generateExactDivisionValues(variables),
  // わる数が2けたになる点だけが exactDivision と異なる（variables.divisor の範囲で決まる）。
  exactDivisionTwoDigit: (variables) => generateExactDivisionValues(variables),
  exactDecimalDivisionByInteger: (variables) => generateExactDecimalDivisionValues(variables),
  // 小数÷小数（小学5年生1学期）。
  exactDecimalDivisionByDecimal: (variables) => generateExactDecimalDivisionByDecimalValues(variables),
  // 小数倍・もとの量（小学5年生1学期）は、値の生成ロジック自体は同じ（基準量×何倍＝比較量）で、
  // どちらが「未知（答え）」かはテンプレートの solutionRoutes 側が決めるため、同じ関数を使う
  // エイリアスにしている（decimalTimesInteger と同じ考え方）。
  decimalMultiplicativeComparison: (variables, template) =>
    generateDecimalMultiplicativeComparisonValues(variables, template.quantityRelation),
  decimalOriginalQuantity: (variables, template) =>
    generateDecimalMultiplicativeComparisonValues(variables, template.quantityRelation),
  // 異分母分数のたし算・ひき算（小学5年生2学期）。standard と同じ独立生成戦略のエイリアス。
  // a・b の分母は、テンプレート側で異なる固定値として定義するため（例: a=denom5, b=denom4）、
  // ここで動的に「異分母になるよう調整する」処理は不要です。
  unlikeDenominatorFractionAddition: (variables) => generateStandardValues(variables),
  unlikeDenominatorFractionSubtraction: (variables) => generateStandardValues(variables),
  // 平均（小学5年生2学期）。count×average=total の関係を持つ2つのカテゴリ
  // （averageFromTotal: 平均を求める／totalFromAverage: 合計を求める）で共有します。
  averageFromTotal: (variables, template) => generateAverageValues(variables, template.quantityRelation),
  totalFromAverage: (variables, template) => generateAverageValues(variables, template.quantityRelation),
  // 2つの数の平均（小学5年生2学期、2段階問題）。既存の「たし算→わり算」の2段階生成ルールを
  // そのまま再利用します（divisorを常に2に固定したテンプレートにするだけで実現できます）。
  averageOfTwoValues: (variables) => generateMultiStepSumToDivisibleValues(variables),
  // 単位量あたり・混み具合（小学5年生2学期）。unitCount×perUnit=total の関係を持つ
  // 2つのカテゴリ（unitRate: 1単位あたりを求める／totalFromUnitRate: 全体量を求める）で共有します。
  unitRate: (variables, template) => generateUnitRateValues(variables, template.quantityRelation),
  totalFromUnitRate: (variables, template) => generateUnitRateValues(variables, template.quantityRelation),
  multiStepDivideFirst: (variables) => generateMultiStepDivideFirstValues(variables),
  multiStepSumToDivisible: (variables) => generateMultiStepSumToDivisibleValues(variables)
};

// getVisibleNumbers 等で「dividend/divisor を特別扱いする」対象の generatorType。
const DIVISION_GENERATOR_TYPES = new Set([
  "exactDivision",
  "exactDivisionTwoDigit",
  "exactDecimalDivisionByInteger",
  "exactDecimalDivisionByDecimal"
]);

// getVisibleNumbers で「quantityRelation の参照先から見えている数値を判定する」対象のgeneratorType。
// （小数倍・もとの量・平均・単位量あたり・混み具合。いずれも quantityRelation を持ち、
//  solutionRoutes[0].left/right が実際に参照している2つの変数だけを見せる、という
//  同じ汎用ロジックで正しく判定できます。）
const QUANTITY_RELATION_GENERATOR_TYPES = new Set([
  "decimalMultiplicativeComparison",
  "decimalOriginalQuantity",
  "averageFromTotal",
  "totalFromAverage",
  "unitRate",
  "totalFromUnitRate"
]);

function generateValuesForTemplate(template) {
  const handler = GENERATOR_TYPE_HANDLERS[template.generatorType] || GENERATOR_TYPE_HANDLERS.standard;
  return handler(template.variables, template);
}

export function renderTemplateText(template, values) {
  return template.template.replace(/\{(\w+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match;
  });
}

/**
 * テンプレートの textParts（{type:"text", value:string} と {type:"value", ref:変数名} の配列）を、
 * 実際に生成された値へ解決します。分数のような、横並びの文字列だけでは正しく表示できない値を
 * 問題文に含める場合に使用します（value-renderer.js の renderTextPartsHtml で縦型分数として描画されます）。
 */
function resolveTextParts(template, values) {
  return template.textParts.map((part) => {
    if (part.type === "value") {
      return { type: "value", value: values[part.ref] };
    }
    return part;
  });
}

/**
 * 解決済みの textParts を、HTML表示を経由しないプレーンテキストに変換します。
 * 問題履歴の検索・デバッグ表示・result.text（後方互換用の文字列表現）に使用します。
 */
function flattenTextPartsToPlainText(resolvedTextParts) {
  return resolvedTextParts.map((part) => (part.type === "value" ? formatValue(part.value) : part.value)).join("");
}

/**
 * 問題文に登場する数値（選択肢のもとになる）を、テンプレートの種類に応じて求めます。
 * 1段階問題でのみ使用します（2段階問題は multi-step-engine.js が
 * ステップごとに独自に「見えている数値」を判定します）。
 *
 * 小数倍・もとの量（QUANTITY_RELATION_GENERATOR_TYPES）は、generateDecimalMultiplicativeComparisonValues()
 * が基準量・何倍・比較量の3つすべてを生成しますが、そのうち「答え」にあたる1つは
 * 選択肢に含めてはいけません。どれが答えかはテンプレートごとに異なる（solutionRoutes[0]の
 * left/rightが指す2つの変数名）ため、Object.keys(template.variables) のような固定リストではなく、
 * 正解ルートが実際に参照している2つの変数だけを「見えている数値」として使います。
 */
function getVisibleNumbers(template, values) {
  if (DIVISION_GENERATOR_TYPES.has(template.generatorType)) {
    return [values.dividend, values.divisor];
  }
  if (QUANTITY_RELATION_GENERATOR_TYPES.has(template.generatorType)) {
    const route = template.solutionRoutes[0];
    return [values[route.left], values[route.right]];
  }
  return Object.keys(template.variables).map((key) => values[key]);
}

/**
 * テンプレートの solutionRoutes（変数名で書かれた正解ルート）を、
 * 実際の数値に解決します（1段階問題用）。
 */
function resolveSolutionRoutes(template, values) {
  return template.solutionRoutes.map((route) => {
    const left = values[route.left];
    const right = values[route.right];
    const operator = route.operator;
    const result = safeCalculate(left, operator, right);
    return { left, operator, right, result, commutative: Boolean(route.commutative) };
  });
}

/**
 * 2段階問題の solutionRoutes（各ステップが variable/result 参照で書かれたもの）を、
 * 実際の数値に解決します。ステップは配列の順番どおりに評価し、
 * 各ステップの resultKey は「そのルート内だけで有効な」中間結果名として扱います
 * （別のルートの中間結果は参照できません＝ルートごとに独立した名前空間）。
 */
function resolveMultiStepRoutes(template, values) {
  return template.solutionRoutes.map((route) => {
    const localResults = {};
    const steps = route.steps.map((stepDef) => {
      const left = resolveOperand(stepDef.left, values, localResults);
      const right = resolveOperand(stepDef.right, values, localResults);
      const operator = stepDef.operator;
      const result = safeCalculate(left, operator, right);
      if (stepDef.resultKey) {
        localResults[stepDef.resultKey] = result;
      }
      return {
        left,
        operator,
        right,
        result,
        resultKey: stepDef.resultKey,
        commutative: stepDef.commutative
      };
    });
    return { id: route.id, steps };
  });
}

function resolveOperand(operand, baseValues, localResults) {
  if (!operand) return undefined;
  if (operand.source === "result") {
    return localResults[operand.key];
  }
  return baseValues[operand.key];
}

export function generateDummyOperators(correctOperator, count) {
  const others = OPERATORS.filter((op) => op !== correctOperator);
  const shuffled = shuffleArray(others);
  return shuffled.slice(0, count);
}

/**
 * 既存の数値と重複せず、答えとも一致しないダミー数値を生成します。
 * 桁数の近い、もっともらしい数値になるようにしています。
 * @param {number} referenceValue
 * @param {Set<string>} excludedKeys - valueKey() で表した除外対象の集合
 */
function generateDummyNumber(referenceValue, excludedKeys) {
  const magnitude = Math.max(1, Math.abs(referenceValue));
  const spread = Math.max(2, Math.round(magnitude * 0.4));

  for (let attempt = 0; attempt < 30; attempt++) {
    const offset = pickInt(-spread, spread);
    let candidate = referenceValue + offset;
    if (candidate < 0) {
      candidate = Math.abs(candidate) + 1;
    }
    if (candidate === 0) {
      candidate = 1;
    }
    if (!excludedKeys.has(valueKey(candidate))) {
      return candidate;
    }
  }
  // フォールバック：それでも重複する場合は、十分離れた値を返す
  let fallback = referenceValue + spread + 1;
  while (excludedKeys.has(valueKey(fallback))) {
    fallback += 1;
  }
  return fallback;
}

/**
 * 既存の分数と重複しない、同じ分母のダミー分数を生成します
 * （分数カードが正解の分数と紛らわしくなりすぎないよう、同じ分母を使います）。
 * @param {{type:"fraction", numerator:number, denominator:number}} referenceFraction
 * @param {Set<string>} excludedKeys - valueKey() で表した除外対象の集合
 */
function generateDummyFraction(referenceFraction, excludedKeys) {
  const denominator = referenceFraction.denominator;
  const maxNumerator = Math.max(denominator * 2, referenceFraction.numerator + 5);

  for (let attempt = 0; attempt < 30; attempt++) {
    const numerator = pickInt(1, maxNumerator);
    const candidate = { type: "fraction", numerator, denominator };
    if (!excludedKeys.has(valueKey(candidate))) {
      return candidate;
    }
  }
  // フォールバック：それでも重複する場合は、十分離れた分子を返す
  let numerator = referenceFraction.numerator + 1;
  let candidate = { type: "fraction", numerator, denominator };
  while (excludedKeys.has(valueKey(candidate))) {
    numerator += 1;
    candidate = { type: "fraction", numerator, denominator };
  }
  return candidate;
}

/**
 * 値の型（数値・分数）を意識せず、既存の値と重複しないダミー値を生成します。
 */
export function generateDummyValue(referenceValue, excludedKeys) {
  return isFractionValue(referenceValue)
    ? generateDummyFraction(referenceValue, excludedKeys)
    : generateDummyNumber(referenceValue, excludedKeys);
}

export function shuffleArray(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let cardSequence = 0;
/**
 * 選択肢カード（または解答欄に置かれるカード）を1枚作ります。
 * @param {"number"|"operator"} type
 * @param {number|string} value
 * @param {"variable"|"intermediate"|"operator"|"dummy"|"dummyOperator"} source - カードの由来。
 *   ui.js が中間結果カードなどを見た目で区別するために使います。
 */
export function makeCard(type, value, source = "variable") {
  cardSequence += 1;
  return {
    cardId: `card_${Date.now()}_${cardSequence}`,
    type, // "number" | "operator"
    value,
    source
  };
}

// 数値カードの表示枠数（上段）。演算記号カードは常に4枚（下段）なので、
// 4×2＝8枚のグリッドがちょうど埋まる。
const NUMBER_ROW_SLOTS = 4;

/**
 * 選択肢カード（8枚固定：上段が数値カード4枚、下段が演算記号カード4枚）を生成する汎用関数。
 * 1段階問題・2段階問題の両方から使われます（2段階問題は multi-step-engine.js 経由）。
 *
 * 演算記号カードは、常に4枚すべて（+ - × ÷）を、この順番の固定位置で表示します
 * （正解として認める記号は本物のカード、それ以外はダミーカードになりますが、
 * 見た目の並び順・位置は常に同じです）。数値カードは上段に配置し、
 * 実際の数値の後にダミー数値を追加して4枚に揃えたうえで、数字の小さい順に左から並べます
 * （分数は数値換算した上で比較します）。
 *
 * @param {Array<{value:number, source:string}>} realNumbers - 実際に見えている数値（重複は事前に排除しておくこと）
 * @param {string|string[]} correctOperators - 今回正解として認める演算記号（複数解法で1つ目の式の演算子が
 *   ルートによって異なる場合は配列で複数渡せる。例: ["+","-"]）
 * @param {number|number[]} resultsToExclude - ダミー数値として出現させてはいけない値（その式の答え・最終的な答えなど）
 * @returns {Array} 上段（数値・小さい順）→下段（演算記号・固定順）の順のカード配列
 */
export function buildChoiceCards(realNumbers, correctOperators, resultsToExclude) {
  const uniqueCorrectOps = [...new Set(Array.isArray(correctOperators) ? correctOperators : [correctOperators])];
  const excludedResults = Array.isArray(resultsToExclude) ? resultsToExclude : [resultsToExclude];
  const excludedKeys = new Set([
    ...realNumbers.map((n) => valueKey(n.value)),
    ...excludedResults.filter((v) => v !== undefined && v !== null).map((v) => valueKey(v))
  ]);

  // 下段：演算記号は常に4枚、"+" "-" "×" "÷" の順で固定位置。
  const operatorCards = OPERATORS.map((op) =>
    uniqueCorrectOps.includes(op) ? makeCard("operator", op, "operator") : makeCard("operator", op, "dummyOperator")
  );

  // 上段：実際の数値カードの後に、4枚になるまでダミー数値を追加する。
  const numberCards = realNumbers.map((entry) => makeCard("number", entry.value, entry.source));
  const referenceValues = realNumbers.map((n) => n.value);
  while (numberCards.length < NUMBER_ROW_SLOTS) {
    const reference = referenceValues.length > 0 ? referenceValues[numberCards.length % referenceValues.length] : 10;
    const dummy = generateDummyValue(reference, excludedKeys);
    excludedKeys.add(valueKey(dummy));
    numberCards.push(makeCard("number", dummy, "dummy"));
  }

  // 上段の数値カードは、数字の小さい順に左から並べる（分数は数値換算して比較する）。
  const sortedNumberCards = numberCards
    .slice()
    .sort((a, b) => numericValueForSort(a.value) - numericValueForSort(b.value));

  return [...sortedNumberCards, ...operatorCards];
}

function numericValueForSort(value) {
  return isFractionValue(value) ? fractionToNumber(value) : value;
}

/**
 * 1段階問題用の選択肢カードを生成します（内部専用）。
 *
 * 見えている数値（変数の値）は、値が偶然同じでも重複排除しません。
 * 例えば同分母分数のたし算で a と b がどちらも 3/10 になった場合
 * （「朝に3/10、昼に3/10歩いた」のような問題）、正解の式 3/10+3/10 を作るには
 * 3/10 のカードが2枚必要です。ここで値の一致だけを見て1枚に減らしてしまうと、
 * 正解不可能な問題になってしまいます。各変数は必ず1枚ずつ独立したカードにします
 * （ダミーカードの重複回避は buildChoiceCards() 側の valueKey() が担当します）。
 */
function buildSingleStepChoices(problem) {
  const numbers = getVisibleNumbers(problem.template, problem.values);
  const realNumbers = numbers.map((value) => ({ value, source: "variable" }));
  return buildChoiceCards(realNumbers, problem.operator, problem.result);
}

/**
 * 単一のテンプレートから、数値を確定させた問題を1問生成します。
 * 検証は行いません（呼び出し側の責務です）。
 * ランダムな数値生成を伴うため、同じテンプレートから呼び出しても毎回結果は変わります。
 * 開発者用の検証ページ（tools/question-validator.html）からも直接使用します。
 *
 * @param {object} template - data/*.js で定義された問題テンプレート
 * @returns {object} 生成された問題
 */
export function generateQuestionFromTemplate(template) {
  if (template.questionType === "multiStep") {
    return generateMultiStepQuestionFromTemplate(template);
  }

  const values = generateValuesForTemplate(template);
  const resolvedRoutes = resolveSolutionRoutes(template, values);
  const canonical = resolvedRoutes[0];

  questionSequence += 1;

  // textParts を持つテンプレート（分数を含む問題文など）は、それを実際の値に解決して
  // problem.textParts に保存する（ui.js が縦型分数として描画する）。
  // problem.text には、HTML描画を経由しない場所（履歴の検索・デバッグ表示など）で使う
  // プレーンテキスト表現を、どちらの形式のテンプレートでも必ず用意する。
  const resolvedTextParts = template.textParts ? resolveTextParts(template, values) : null;
  const text = resolvedTextParts ? flattenTextPartsToPlainText(resolvedTextParts) : renderTemplateText(template, values);

  const problem = {
    id: `q_${Date.now()}_${questionSequence}`,
    templateId: template.id,
    gradeTerm: template.gradeTerm,
    category: template.category,
    questionType: template.questionType,
    text,
    textParts: resolvedTextParts,
    // canonical（1番目の正解ルート）を、表示・選択肢生成・スコア計算用に
    // トップレベルにも複製している。既存の game.js / ui.js はこちらを参照する。
    // 値は数値または分数オブジェクトのいずれか（value-utils.js が共通して扱う）。
    left: canonical.left,
    operator: canonical.operator,
    right: canonical.right,
    result: canonical.result,
    answerUnit: template.answerUnit,
    commutative: canonical.commutative,
    // 複数の正解ルート（複数解法に対応するため配列）。
    // 正誤判定は answer-checker.js がこの配列を見て行う。
    solutionRoutes: resolvedRoutes,
    template,
    values,
    choices: []
  };

  problem.choices = buildSingleStepChoices(problem);

  return problem;
}

/**
 * 2段階問題を1問生成します。値の生成・ルートの数値解決までをここで行い、
 * 進行状態の初期化と最初のステップ用カード生成は multi-step-engine.js に委譲します。
 */
function generateMultiStepQuestionFromTemplate(template) {
  const values = generateValuesForTemplate(template);
  const resolvedRoutes = resolveMultiStepRoutes(template, values);
  const totalSteps = resolvedRoutes[0].steps.length;
  const finalAnswer = resolvedRoutes[0].steps[totalSteps - 1].result;

  questionSequence += 1;

  const problem = {
    id: `q_${Date.now()}_${questionSequence}`,
    templateId: template.id,
    gradeTerm: template.gradeTerm,
    category: template.category,
    questionType: "multiStep",
    text: renderTemplateText(template, values),
    values,
    solutionRoutes: resolvedRoutes,
    answerUnit: template.answerUnit,
    totalSteps,
    answer: finalAnswer,
    // result にも同じ値を複製する。既存の history/score 表示コードが
    // 1段階問題と同じフィールド名（result）を参照できるようにするため。
    result: finalAnswer,
    template,
    choices: []
  };

  return initializeMultiStepQuestion(problem);
}

/**
 * 出題範囲のテンプレート一覧から、問題を1問生成します。
 * 生成後に question-validator.js で検証し、不正な場合はコンソールにエラーを出力した上で
 * 別のテンプレートで再生成します（プレイヤーに不正な問題を出題しないための安全策）。
 *
 * @param {Array} templates - テンプレートの配列（データファイルから渡す）
 * @param {{excludeTemplateId?: string}} options
 */
export function generateQuestion(templates, options = {}) {
  if (!Array.isArray(templates) || templates.length === 0) {
    throw new Error("問題テンプレートが指定されていません。");
  }

  let candidates = templates;
  if (options.excludeTemplateId && templates.length > 1) {
    const filtered = templates.filter((t) => t.id !== options.excludeTemplateId);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  let lastTemplateId = null;
  let lastErrors = [];

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const template = candidates[pickInt(0, candidates.length - 1)];
    const problem = generateQuestionFromTemplate(template);
    const { valid, errors } = validateGeneratedQuestion(problem);

    if (valid) {
      return problem;
    }

    lastTemplateId = template.id;
    lastErrors = errors;
    console.error(`[question-generator] 問題テンプレート "${template.id}" の生成結果が不正なため、再生成します:`, errors);
  }

  throw new Error(
    `有効な問題を生成できませんでした（テンプレート: ${lastTemplateId}, エラー: ${lastErrors.join(" / ")})`
  );
}

// ============================================================
// 小学4年生2学期・3学期モード：新内容／復習内容の出題プラン
// ============================================================
//
// 出題モード（gradeTerm: "4-2" または "4-3"）ごとに「どのgradeTermキーを新内容として
// 扱うか」「どのgradeTermキーを復習内容として扱うか」を GRADE_TERM_PLAN_CONFIG で定義し、
// それに基づいて、新内容・復習内容がおよそ半分ずつ・カテゴリに偏りなく・3問以上連続しない
// ように並べた「出題プラン」を作ります。実際の問題生成（数値のランダム化）は行わず、
// 各問題スロットが「新内容か復習内容か」「どのカテゴリか（復習の場合はどの学期のどのカテゴリか）」を
// 決めるだけです（実際の生成は、既存の generateQuestion() がそのカテゴリの
// テンプレート集合から行います）。
//
// 「4-multi-step」（整数のみの2段階文章題）は、モードによって役割が変わります。
//   - 4-2モードでは「新内容」の1カテゴリ（2段階文章題）として扱う
//   - 4-3モードでは「復習内容」の一部として扱う（今回、分数・小数の2段階問題は追加しないため）
// このため、テンプレート1つだけを見て「新内容か復習内容か」を判定する関数は用意せず、
// 常に「今どのモードで遊んでいるか」を踏まえて判定します。
//
// カテゴリは各データファイルの category フィールドから自動的に集計するため、
// 新しいカテゴリのテンプレートを追加しても、このファイルの修正は不要です
// （唯一の例外は「2段階文章題」で、data/multi-step-integer.js 側の複数のカテゴリ名を
// 1つの疑似カテゴリとしてまとめて扱います）。

const MULTI_STEP_PSEUDO_CATEGORY = "2段階文章題";

const GRADE_TERM_PLAN_CONFIG = {
  "4-2": {
    newContentGradeTerms: ["4-2", "4-multi-step"],
    reviewGradeTerms: ["4-1"]
  },
  "4-3": {
    newContentGradeTerms: ["4-3"],
    reviewGradeTerms: ["4-1", "4-2", "4-multi-step"]
  },
  // 小学5年生1学期（第7段階）：新内容は5-1の4カテゴリ、復習内容は4年生1〜3学期
  // （整数の2段階文章題を含む）から偏りなく選ぶ。
  "5-1": {
    newContentGradeTerms: ["5-1"],
    reviewGradeTerms: ["4-1", "4-2", "4-3", "4-multi-step"]
  },
  // 小学5年生2学期（第8段階）：新内容は5-2の5カテゴリ、復習内容は4年生1〜3学期
  // （整数の2段階文章題を含む）・5年生1学期から偏りなく選ぶ。
  "5-2": {
    newContentGradeTerms: ["5-2"],
    reviewGradeTerms: ["4-1", "4-2", "4-3", "4-multi-step", "5-1"]
  }
};

/**
 * テンプレートが「新内容」か「復習内容」かを、テンプレート単体から大まかに判定します。
 * template.contentGroup が明示されていればそれに従い、無ければ gradeTerm から推測します
 * （"4-1" は復習、それ以外は新内容）。
 *
 * 注意: この関数は「今どのモードで遊んでいるか」を考慮しない、簡易的な判定です
 * （例えば "4-multi-step" は、4-2モードでは新内容ですが4-3モードでは復習内容として
 *  扱われるため、本当に正しい分類はモードごとに異なります）。実際の出題プラン
 * （planQuestionSequence）はこの関数を使わず、GRADE_TERM_PLAN_CONFIG に基づいて
 * モードを踏まえた判定を行います。この関数は、開発者用検証ページでテンプレート単体に
 * 大まかなバッジを表示する用途にのみ使用してください。
 */
export function getContentGroup(template) {
  if (template.contentGroup === "new" || template.contentGroup === "review") {
    return template.contentGroup;
  }
  return template.gradeTerm === "4-1" ? "review" : "new";
}

// 「約分をまだ学習していない学年・学期」で同分母分数のたし算・ひき算を出題する場合、
// 問題文・選択肢カード・答えを約分しない状態で表示するためのカテゴリ・学期の組み合わせ
// （第9段階で追加）。対象は同分母分数のたし算・ひき算の2カテゴリのみで、判定に使うのは
// テンプレート自身の gradeTerm（常に "4-3"）ではなく、"今その問題が出題されている
// バトル/トレーニングセッション全体の gradeTerm" です。これにより、4-3モードで新内容として
// 出題される場合だけでなく、5-1モードの復習内容として同じテンプレートが出題される場合も
// 同様に約分なしで表示されます。5-2モード（異分母分数を学習し、約分の意味を理解した段階）
// では、同じ4-3のテンプレートが復習内容として出てきても、通常どおり約分して表示します。
const UNSIMPLIFIED_FRACTION_DISPLAY_CATEGORY_IDS = new Set([
  "same-denominator-fraction-addition",
  "same-denominator-fraction-subtraction"
]);
const UNSIMPLIFIED_FRACTION_DISPLAY_GRADE_TERMS = new Set(["4-3", "5-1"]);

/**
 * 問題文・選択肢カード・答えを約分しない状態で表示すべきかどうかを判定します。
 * @param {object} template - 出題された問題のテンプレート（problem.template）
 * @param {string} currentGradeTerm - 今そのバトル/トレーニングセッション全体で選ばれている
 *   gradeTerm（gameState.gradeTerm または trainingState.gradeTerm。テンプレート自身の
 *   gradeTermとは異なる場合がある＝復習内容として出題されている場合）
 */
export function shouldDisplayFractionsUnsimplified(template, currentGradeTerm) {
  return (
    !!template &&
    UNSIMPLIFIED_FRACTION_DISPLAY_CATEGORY_IDS.has(template.categoryId) &&
    UNSIMPLIFIED_FRACTION_DISPLAY_GRADE_TERMS.has(currentGradeTerm)
  );
}

/**
 * gradeTermキーの配列（例: ["4-2", "4-multi-step"]）から、カテゴリ名ごとにテンプレートを
 * グループ化します。"4-multi-step" だけは、カテゴリ名がテンプレートごとに異なる
 * （例: "2段階・かけ算とたし算" 等）ため、1つの疑似カテゴリ「2段階文章題」にまとめます。
 *
 * @param {string[]} sourceGradeTerms
 * @param {Record<string, Array>} templateSets
 * @returns {Map<string, Array>} カテゴリ名 → テンプレート配列
 */
function groupTemplatesByCategory(sourceGradeTerms, templateSets) {
  const groups = new Map();
  for (const sourceGradeTerm of sourceGradeTerms) {
    const list = templateSets[sourceGradeTerm] || [];
    if (list.length === 0) continue;
    if (sourceGradeTerm === "4-multi-step") {
      const existing = groups.get(MULTI_STEP_PSEUDO_CATEGORY) || [];
      groups.set(MULTI_STEP_PSEUDO_CATEGORY, [...existing, ...list]);
      continue;
    }
    for (const template of list) {
      const arr = groups.get(template.category) || [];
      arr.push(template);
      groups.set(template.category, arr);
    }
  }
  return groups;
}

/**
 * 現在の出題モード（gradeTerm）における「新内容」テンプレートを、カテゴリ名ごとにグループ化します。
 * @param {Record<string, Array>} templateSets - data/index.js の TEMPLATE_SETS_BY_GRADE_TERM 相当
 * @param {string} currentGradeTerm - "4-2" または "4-3"
 * @returns {Map<string, Array>} カテゴリ名 → テンプレート配列
 */
export function buildNewContentCategoryGroups(templateSets, currentGradeTerm) {
  const config = GRADE_TERM_PLAN_CONFIG[currentGradeTerm];
  if (!config) return new Map();
  return groupTemplatesByCategory(config.newContentGradeTerms, templateSets);
}

/**
 * 現在の出題モードにおける「復習内容」テンプレートを、学期ごと・カテゴリごとに
 * 2段構えでグループ化します（例: Map{"4-1" => Map{"整数のたし算" => [...]}, "4-2" => Map{...}}）。
 * 特定の学期・カテゴリだけに偏らないよう、出題プランはこの2段構えの構造を使って
 * 「学期を選ぶ→その学期のカテゴリを選ぶ→テンプレートを選ぶ」の順で選択します。
 */
function buildReviewGroupsByTerm(templateSets, currentGradeTerm) {
  const config = GRADE_TERM_PLAN_CONFIG[currentGradeTerm];
  const byTerm = new Map();
  if (!config) return byTerm;
  for (const sourceGradeTerm of config.reviewGradeTerms) {
    const categoryMap = groupTemplatesByCategory([sourceGradeTerm], templateSets);
    if (categoryMap.size > 0) {
      byTerm.set(sourceGradeTerm, categoryMap);
    }
  }
  return byTerm;
}

// 「3問以上連続しない並び」を再抽選（シャッフルし直し）で探すときの最大試行回数。
// 無限ループを避けるための上限であり、これだけ試しても見つからない場合
// （＝特定のキーが全体の大半を占めるなど、そもそも解が無い場合）は諦めて
// 最後に試した並びをそのまま返します。
const MAX_SHUFFLE_ATTEMPTS_FOR_RUN_LIMIT = 200;

/**
 * 並び items の中で、同じ key（keyFn で求める）が maxRun 回を超えて
 * 連続していないかを判定します。
 */
function satisfiesRunLimit(items, keyFn, maxRun) {
  let run = 1;
  for (let i = 1; i < items.length; i++) {
    if (keyFn(items[i]) === keyFn(items[i - 1])) {
      run += 1;
      if (run > maxRun) return false;
    } else {
      run = 1;
    }
  }
  return true;
}

/**
 * 同じ key が3つ以上連続しない並びになるまで、シャッフルを繰り返します
 * （再抽選方式）。1つの位置だけを入れ替える修復方式は、入れ替えた値が
 * 別の場所で新たな連続を生んでしまう場合があり不確実なため、
 * 「条件を満たすまで引き直す」というシンプルで確実な方法を採用しています。
 * 試行回数には上限を設け、無限ループを防いでいます
 * （同じキーが全体の大半を占める場合など、解が存在しないケースへの対策）。
 */
function limitConsecutiveRuns(items, keyFn, maxRun = 2) {
  let candidate = items;
  for (let attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS_FOR_RUN_LIMIT; attempt++) {
    if (satisfiesRunLimit(candidate, keyFn, maxRun)) {
      return candidate;
    }
    candidate = shuffleArray(items);
  }
  return candidate;
}

/**
 * groupsByKey（Map<キー, 配列>）のキーをシャッフルし、count個ぶんラウンドロビンで
 * 割り当てたラベルの配列を返します。キーが1つも無い場合は null の配列を返します。
 * 「全テンプレートから単純にランダム選択する」のではなく、この関数でキー（カテゴリや学期）を
 * 先に均等に割り振ってからテンプレートを選ぶことで、テンプレート数が多いキーに
 * 出題が偏らないようにしています。
 */
function buildRoundRobinLabels(groupsByKey, count) {
  const keys = shuffleArray([...groupsByKey.keys()]);
  const labels = [];
  for (let i = 0; i < count; i++) {
    labels.push(keys.length > 0 ? keys[i % keys.length] : null);
  }
  return labels;
}

/**
 * 復習内容のスロットを reviewCount 個作ります。
 * 「学期を選ぶ→その学期の中でカテゴリを選ぶ」の2段階を、それぞれラウンドロビンで行うことで、
 * 特定の学期・特定のカテゴリだけに偏らないようにします。
 */
function planReviewSlots(reviewCount, templateSets, currentGradeTerm) {
  const byTerm = buildReviewGroupsByTerm(templateSets, currentGradeTerm);
  if (byTerm.size === 0) {
    return Array.from({ length: reviewCount }, () => ({ contentGroup: "review", reviewGradeTerm: null, category: null }));
  }

  const termLabels = buildRoundRobinLabels(byTerm, reviewCount);
  const countsByTerm = new Map();
  for (const term of termLabels) {
    countsByTerm.set(term, (countsByTerm.get(term) || 0) + 1);
  }

  const categoryQueueByTerm = new Map();
  for (const [term, count] of countsByTerm) {
    categoryQueueByTerm.set(term, buildRoundRobinLabels(byTerm.get(term), count));
  }

  const cursorByTerm = new Map();
  return termLabels.map((term) => {
    const cursor = cursorByTerm.get(term) || 0;
    const category = categoryQueueByTerm.get(term)[cursor];
    cursorByTerm.set(term, cursor + 1);
    return { contentGroup: "review", reviewGradeTerm: term, category };
  });
}

/**
 * 小学4年生2学期・3学期モード用の出題プランを作成します。
 * 新内容が約半分・復習内容が約半分（問題数が奇数の場合は新内容を1問多く）になり、
 * 新内容の中のカテゴリ・復習内容の中の学期とカテゴリは、それぞれできるだけ均等になります。
 * 全体としては、同じキー（新内容は各カテゴリ、復習内容は「復習内容」全体を1つのまとまりとして
 * 扱う）が3問以上連続しないようにします。
 *
 * @param {number} totalQuestions
 * @param {Record<string, Array>} templateSets
 * @param {string} currentGradeTerm - "4-2" または "4-3"
 * @returns {Array<{contentGroup:"new", category:string}|{contentGroup:"review", reviewGradeTerm:string, category:string}>}
 */
export function planQuestionSequence(totalQuestions, templateSets, currentGradeTerm) {
  const newCount = Math.ceil(totalQuestions / 2);
  const reviewCount = totalQuestions - newCount;

  const categoryGroups = buildNewContentCategoryGroups(templateSets, currentGradeTerm);
  const newLabels = buildRoundRobinLabels(categoryGroups, newCount);
  const newSlots = newLabels.map((label) => ({ contentGroup: "new", category: label }));

  const reviewSlots = planReviewSlots(reviewCount, templateSets, currentGradeTerm);

  const shuffled = shuffleArray([...newSlots, ...reviewSlots]);
  return limitConsecutiveRuns(
    shuffled,
    (slot) => (slot.contentGroup === "review" ? "review" : slot.category),
    2
  );
}

/**
 * 出題プランの1スロット分から、実際に問題を生成する際の候補テンプレート一覧を求めます。
 * @param {object|null} slot
 * @param {Record<string, Array>} templateSets
 * @param {string} currentGradeTerm - "4-2" または "4-3"
 */
export function getCandidateTemplatesForSlot(slot, templateSets, currentGradeTerm) {
  if (!slot) {
    return templateSets[currentGradeTerm] || [];
  }
  if (slot.contentGroup === "review") {
    const byTerm = buildReviewGroupsByTerm(templateSets, currentGradeTerm);
    const categoryMap = byTerm.get(slot.reviewGradeTerm);
    if (categoryMap && categoryMap.has(slot.category)) {
      return categoryMap.get(slot.category);
    }
    return templateSets[slot.reviewGradeTerm] || [];
  }
  const groups = buildNewContentCategoryGroups(templateSets, currentGradeTerm);
  return groups.get(slot.category) || templateSets[currentGradeTerm] || [];
}
