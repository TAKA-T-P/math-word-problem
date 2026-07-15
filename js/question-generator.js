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
import {
  valueKey,
  isFractionValue,
  isPercentValue,
  isRatioValue,
  isScaleValue,
  formatValue,
  calculateValues,
  divideValuesAsFraction,
  areValuesEqual
} from "./value-utils.js";
import { fractionToNumber, gcd } from "./fraction-utils.js";
import { percentToRatio, ratioToPercent, formatPercent } from "./percentage-utils.js";
import { formatRatio, createRatio } from "./ratio-utils.js";
import { formatScale, createScale } from "./scale-utils.js";
import { convertLength } from "./unit-utils.js";

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
 * 百分率の変数定義 { type:"percent", values:[10,20,25,...] } から、
 * 一覧の中からランダムに1つ選び、百分率の値を1つ作ります（第9段階で追加）。
 * 「10%、20%、25%、30%…」のような、小学5年生として自然な値の一覧から選ぶ設計のため、
 * 分数の分子のような連続範囲（min〜max）ではなく、離散的な values 配列を使用します。
 */
function pickPercentValue(range) {
  const values = range.values;
  const chosen = values[pickInt(0, values.length - 1)];
  return { type: "percent", value: chosen };
}

/**
 * 1つの変数の範囲定義から、その種類（分数・百分率・小数・整数）に応じた値を1つ選びます。
 *   - type: "fraction"      → 分数（pickFractionValue）
 *   - type: "percent"       → 百分率（pickPercentValue。第9段階で追加）
 *   - decimalPlaces あり    → 小数（pickDecimalValue）
 *   - それ以外               → 整数（pickStepped）
 * generateStandardValues() と、小数倍・もとの量・速さ・割合専用の生成関数の
 * すべてから使う共通処理です。
 */
function pickValueForRange(range) {
  if (range.type === "fraction") {
    return pickFractionValue(range);
  }
  if (range.type === "percent") {
    return pickPercentValue(range);
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
 * 「倍」を表す値（小数倍・分数倍の multiplier）を、範囲からちょうど1にならないよう選び直します
 * （運用開始後に追加）。「○の1倍」は「○と同じ」を回りくどく言っているだけで文章題として
 * 不自然なため、1倍は出題しません。pickDistinctValuePair() と同じ「条件を満たすまで選び直す」
 * 設計です。小数・分数どちらの値でも、1と等しいかどうかは areValuesEqual() で型を意識せず
 * 判定できます。「1あたり」が正当な値になりうる単位量あたり（unitRate）や、「1」が正当な
 * 値になりうる平均（average）では使わず、あくまで「倍」の意味を持つ multiplier 専用です。
 */
function pickMultiplierValueExcludingOne(range) {
  const MAX_ATTEMPTS = 200;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const value = pickValueForRange(range);
    if (!areValuesEqual(value, 1)) {
      return value;
    }
  }
  throw new Error("1にならない「倍」の値が見つかりませんでした（variables の範囲を見直してください）。");
}

/**
 * 小数倍・もとの量専用の生成ルール（小学5年生1学期）。
 * テンプレートの quantityRelation（baseKey・comparedKey・multiplierKey）が指す
 * 変数名を使って、基準量(base)・何倍(multiplier、1にはならない)を独立に生成し、
 * 比較量(compared) = base × multiplier を誤差の出ない multiplyDecimal で計算します。
 * 「何が未知（答え）か」はテンプレートの solutionRoutes 側が決めるため、
 * この関数は常に3つの値をすべて生成するだけで、小数倍・もとの量の両カテゴリで共通に使えます。
 */
function generateDecimalMultiplicativeComparisonValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（小数倍・もとの量には必須です）。");
  }
  const { baseKey, comparedKey, multiplierKey } = quantityRelation;
  const baseValue = pickValueForRange(variables[baseKey]);
  const multiplierValue = pickMultiplierValueExcludingOne(variables[multiplierKey]);
  const comparedValue = normalizeNumber(multiplyDecimal(baseValue, multiplierValue));
  return { [baseKey]: baseValue, [multiplierKey]: multiplierValue, [comparedKey]: comparedValue };
}

/**
 * 「aKey × bKey = productKey」という関係を持つ2つの値を独立に生成し、積を
 * 誤差の出ない multiplyDecimal で計算する、汎用の生成ロジックです（第8段階で追加）。
 * 平均（count×average=total）、単位量あたり・混み具合（unitCount×perUnit=total）は、
 * いずれも「2つの既知の値から積にあたる3つ目の値を求める」という同じ構造を持つため、
 * この1つの関数を共有しています。「どれが未知（答え）か」は各テンプレートの
 * solutionRoutes 側が決めるため、この関数は常に3つの値をすべて生成するだけです。
 * 小数倍・もとの量（base×multiplier=compared）は、multiplier がちょうど1にならないように
 * する必要があるため（運用開始後に追加）、この関数は共有せず、
 * generateDecimalMultiplicativeComparisonValues() が独自に実装しています。
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

/**
 * 速さ・道のり・時間専用の生成ルール（小学5年生3学期）。
 * quantityRelation（speedKey・timeKey・distanceKey）が指す変数名を使って、
 * generateProportionalValues() に委譲します（速さ×時間＝道のり）。
 * 速さを求める・道のりを求める・時間を求めるのどの問題でも、生成ロジックは同じで、
 * 「何が未知か」は solutionRoutes 側が決めます。
 */
function generateSpeedValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（速さには必須です）。");
  }
  const { speedKey, timeKey, distanceKey } = quantityRelation;
  return generateProportionalValues(variables, speedKey, timeKey, distanceKey);
}

/**
 * 割合（比べる量・割合・もとにする量）専用の生成ルール（小学5年生3学期）。
 * quantityRelation（baseKey・rateKey・comparedKey）が指す変数名を使って、
 * もとにする量(base)・割合(rate、百分率)を独立に生成し、
 * 比べる量(compared) = base × (rateを比率に変換した値) を誤差の出ない multiplyDecimal で
 * 計算します。rate は百分率型のため、generateProportionalValues() は使わず（乗算の前に
 * percentToRatio() での変換が必要なため）、専用の生成関数として用意しています。
 * 「何が未知か」は solutionRoutes 側が決めるため、比べる量・割合・もとにする量の
 * 3カテゴリすべてで、この1つの関数を共有できます。
 */
function generatePercentageValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（割合には必須です）。");
  }
  const { baseKey, comparedKey, rateKey } = quantityRelation;
  const baseValue = pickValueForRange(variables[baseKey]);
  const rateValue = pickValueForRange(variables[rateKey]);
  const comparedValue = normalizeNumber(multiplyDecimal(baseValue, percentToRatio(rateValue)));
  return { [baseKey]: baseValue, [rateKey]: rateValue, [comparedKey]: comparedValue };
}

/**
 * 「aKey × bKey = productKey」という関係を持つ2つの値（分数どうし、または整数×分数）を
 * 独立に生成し、積を value-utils.js の calculateValues() で計算する、分数版の汎用生成ロジックです
 * （小学6年生1学期、第10段階で追加。単位量あたり・分数版で使用）。
 * 小数版の generateProportionalValues() と同じ考え方ですが、掛け算に multiplyDecimal ではなく
 * calculateValues() を使う点だけが異なります（整数×分数・分数×分数のどちらも正しく計算できるため、
 * 分数専用の掛け算処理をここに個別に書く必要はありません）。答えが整数になる場合（例: 6×2/3＝4）は
 * calculateValues 自身が自動的に整数へ約分・変換します。分数倍（base×multiplier=compared）は、
 * multiplier がちょうど1にならないようにする必要があるため（運用開始後に追加）、
 * この関数は共有せず、generateFractionMultiplicativeComparisonValues() が独自に実装しています。
 */
function generateFractionProportionalValues(variables, aKey, bKey, productKey) {
  const aValue = pickValueForRange(variables[aKey]);
  const bValue = pickValueForRange(variables[bKey]);
  const productValue = calculateValues(aValue, "×", bValue);
  return { [aKey]: aValue, [bKey]: bValue, [productKey]: productValue };
}

/**
 * 分数倍（比べる量・もとの量）専用の生成ルール（小学6年生1学期、第10段階で追加）。
 * quantityRelation（baseKey・comparedKey・multiplierKey）が指す変数名を使って、
 * 基準量(base)・何倍(multiplier、1にはならない。pickMultiplierValueExcludingOne()参照。
 * 運用開始後に追加)を独立に生成し、比較量(compared) = base × multiplier を
 * calculateValues() で計算します。「何が未知か」は solutionRoutes 側が決めるため、
 * この関数は常に3つの値をすべて生成するだけで、比べる量・もとの量のどちらのカテゴリでも
 * 共有できます（単位量あたり・分数版と共有していた generateFractionProportionalValues() は
 * 「1あたり」が正当な値のため、multiplier専用のこの関数からは呼びません）。
 */
function generateFractionMultiplicativeComparisonValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（分数倍には必須です）。");
  }
  const { baseKey, comparedKey, multiplierKey } = quantityRelation;
  const baseValue = pickValueForRange(variables[baseKey]);
  const multiplierValue = pickMultiplierValueExcludingOne(variables[multiplierKey]);
  const comparedValue = calculateValues(baseValue, "×", multiplierValue);
  return { [baseKey]: baseValue, [multiplierKey]: multiplierValue, [comparedKey]: comparedValue };
}

/**
 * 単位量あたり・分数版専用の生成ルール（小学6年生1学期へ後日追加）。
 * quantityRelation（unitCountKey・perUnitKey・totalKey）が指す変数名を使って、
 * generateFractionProportionalValues() に委譲します（unitCount×perUnit=total）。
 * 小数版の単位量あたり（5年生2学期）と数量関係としては同じ構造ですが、
 * 単位数・1単位あたりの量のどちらも分数になりうる点が異なるため、専用の generatorType・
 * quantityRelation.type（"fraction-unit-rate"）を用意しています。
 */
function generateFractionUnitRateValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（単位量あたり・分数版には必須です）。");
  }
  const { unitCountKey, perUnitKey, totalKey } = quantityRelation;
  return generateFractionProportionalValues(variables, unitCountKey, perUnitKey, totalKey);
}

/**
 * 分数割合（比べる量・割合・もとにする量）専用の生成ルール（小学6年生2学期、第11段階で追加）。
 * quantityRelation（baseKey・comparedKey・rateKey）が指す変数名を使って、
 * generateFractionProportionalValues() に委譲します（base×rate=compared）。
 * 小学5年生3学期の割合（百分率）と数量関係としては同じ構造ですが、割合を百分率ではなく
 * 分数として扱う点が異なります（rate は `{type:"fraction",...}` の変数）。
 * 「割合を求める」問題（unknown:"rate"）は、solutionRoutes 側に resultType:"fraction" を
 * 指定することで、12÷20のような「小数としては割り切れる」組み合わせも必ず分数（3/5）として
 * 表示されます（詳しくは computeStepResult() を参照）。
 */
function generateFractionRateValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（分数割合には必須です）。");
  }
  const { baseKey, comparedKey, rateKey } = quantityRelation;
  return generateFractionProportionalValues(variables, baseKey, rateKey, comparedKey);
}

/**
 * 比を使った数量・比例配分専用の、比の前項・後項を選ぶ共通ヘルパー（第11段階で追加）。
 * 比の左右の数字が「互いに素」（最大公約数が1）で、かつどちらも1ではない整数になるよう、
 * 条件を満たすまで variables の範囲から選び直します（わる数・商を先に決めてから逆算する
 * exactDivision と同じ「条件を満たすまでランダムに選び直す」設計です）。
 * 1を除外するのは、比の一方が1だと「比を使う」問題としての手応えが薄れてしまうため。
 * 互いに素であることを求めるのは、6：4のような約分できる比を避け、教科書どおりの
 * 「これ以上簡単にできない比」だけを出題するためです。
 */
function pickCoprimeRatioTerms(firstRange, secondRange) {
  const MAX_ATTEMPTS = 500;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const first = pickValueForRange(firstRange);
    const second = pickValueForRange(secondRange);
    if (first !== 1 && second !== 1 && gcd(first, second) === 1) {
      return [first, second];
    }
  }
  throw new Error("互いに素な比の組み合わせが見つかりませんでした（variables の範囲を見直してください）。");
}

/**
 * 比を使った数量専用の生成ルール（小学6年生2学期、第11段階で追加）。
 * quantityRelation（firstRatioKey・secondRatioKey・firstAmountKey・secondAmountKey）が指す
 * 変数名を使って、比の前項・後項（firstRatio・secondRatio）と、内部でだけ使う
 * 「1あたりの量」（variables.unitAmount。問題文にもカードにも出てこない生成専用の値）を
 * 独立に生成し、firstAmount＝unitAmount×firstRatio、secondAmount＝unitAmount×secondRatio を
 * 計算します。こうして両方の数量を「割り切れる」形で生成するのは、既存の exactDivision
 * （わる数・商を先に決めてからわられる数を逆算する）と同じ考え方です。
 * どちらが「既知」でどちらが「未知」かは、テンプレートごとの textParts・solutionRoutes 側が
 * 決めるため、この関数は常に両方の数量を生成するだけで、正・逆どちらの向きのテンプレートでも
 * 使えます。ratioValue（問題文に表示する比そのもの）もここで一緒に作ります。
 */
function generateRatioApplicationValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（比を使った数量には必須です）。");
  }
  const { firstRatioKey, secondRatioKey, firstAmountKey, secondAmountKey } = quantityRelation;
  const [firstRatioValue, secondRatioValue] = pickCoprimeRatioTerms(variables[firstRatioKey], variables[secondRatioKey]);
  const unitAmount = pickValueForRange(variables.unitAmount);
  const firstAmountValue = normalizeNumber(multiplyDecimal(unitAmount, firstRatioValue));
  const secondAmountValue = normalizeNumber(multiplyDecimal(unitAmount, secondRatioValue));
  return {
    [firstRatioKey]: firstRatioValue,
    [secondRatioKey]: secondRatioValue,
    [firstAmountKey]: firstAmountValue,
    [secondAmountKey]: secondAmountValue,
    ratioValue: createRatio(firstRatioValue, secondRatioValue)
  };
}

/**
 * 比例配分専用の生成ルール（小学6年生2学期、第11段階で追加）。
 * quantityRelation（firstRatioKey・secondRatioKey・totalKey）が指す変数名を使って、
 * 比の前項・後項（firstRatio・secondRatio）と、内部でだけ使う「1あたりの量」
 * （variables.unitAmount）を独立に生成し、全体量（totalKey）＝1あたりの量×比の和 を
 * 計算します。「全体量÷比の和」が必ず割り切れる（＝式2の答えが整数になる）よう、
 * ratioApplication と同じ「1あたりの量を先に決めてから全体量を逆算する」設計にしています。
 */
function generateProportionalAllocationValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（比例配分には必須です）。");
  }
  const { firstRatioKey, secondRatioKey, totalKey } = quantityRelation;
  const [firstRatioValue, secondRatioValue] = pickCoprimeRatioTerms(variables[firstRatioKey], variables[secondRatioKey]);
  const unitAmount = pickValueForRange(variables.unitAmount);
  const ratioSum = firstRatioValue + secondRatioValue;
  const totalValue = normalizeNumber(multiplyDecimal(unitAmount, ratioSum));
  return {
    [firstRatioKey]: firstRatioValue,
    [secondRatioKey]: secondRatioValue,
    [totalKey]: totalValue,
    ratioValue: createRatio(firstRatioValue, secondRatioValue)
  };
}

/**
 * 分数の時間専用の生成ルール（小学6年生2学期、第11段階で追加）。
 * 「分数の速さ」「分数の道のり」は distance・speed を独立に生成する standard のままで
 * よいが、「分数の時間」だけは答え（分）が必ず整数になってほしいという要望があったため、
 * 専用の生成ルールに切り替えている。
 * 道のり（distance）は既存どおり独立に生成し、答えになる「分」（variables.answerMinutes、
 * きりのよい分の一覧から選ぶ）を先に決めてから、速さ（speed）を
 * 「道のり ÷（分÷60）」として逆算する（わり算専用の生成ルールと同じ、
 * 先に商にあたる値を決めてから残りを逆算する考え方）。分数のわり算は必ず正確に計算できる
 * ため（割り切れることの事前保証が不要。第10段階の設計と同じ）、この逆算で得られる速さが
 * どんな分子・分母になっても、2つの解法ルートのどちらで計算しても最終的な答え（分）は
 * 常に variables.answerMinutes で選んだ整数と厳密に一致する。
 */
function generateFractionTimeWithMinuteConversionValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（分数の時間には必須です）。");
  }
  const { distanceKey, speedKey } = quantityRelation;
  const distanceValue = pickValueForRange(variables[distanceKey]);
  const minutesCandidates = variables.answerMinutes.values;
  const minutesValue = minutesCandidates[pickInt(0, minutesCandidates.length - 1)];
  const hoursAsFraction = { type: "fraction", numerator: minutesValue, denominator: 60 };
  const speedValue = calculateValues(distanceValue, "÷", hoursAsFraction);
  return { [distanceKey]: distanceValue, [speedKey]: speedValue };
}

/**
 * 2つの範囲から、互いに異なる値の組を選ぶ共通ヘルパー（小学6年生3学期、第12段階で追加）。
 * 比例・対応する量の knownX/targetX、反比例・対応する量の knownX/targetX が、
 * たまたま同じ値になってしまう（＝「変化しない対応」になり問題として不自然）ことを防ぎます。
 * pickCoprimeRatioTerms() と同じ「条件を満たすまで選び直す」設計です。
 */
function pickDistinctValuePair(rangeA, rangeB) {
  const MAX_ATTEMPTS = 200;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const a = pickValueForRange(rangeA);
    const b = pickValueForRange(rangeB);
    if (a !== b) {
      return [a, b];
    }
  }
  throw new Error("異なる値の組み合わせが見つかりませんでした（variables の範囲を見直してください）。");
}

/**
 * 比例・対応する量専用の生成ルール（小学6年生3学期、第12段階で追加）。
 * quantityRelation（knownXKey・knownYKey・targetXKey・targetYKey・constantKey）が指す
 * 変数名を使って、比例定数（constantKey。問題文にもカードにも出てこない生成専用の値）を
 * 先に決め、knownX・targetX から knownY＝定数×knownX、targetY＝定数×targetX を計算します
 * （「わる数・商を先に決めてからわられる数を逆算する」exactDivision と同じ考え方で、
 * 比例定数×knownX＝knownY の除算（式1の正解ルートA）が必ず割り切れることを保証します）。
 * 比例定数そのものは、式1で児童が求める中間結果であり、最終的な答えとしては出題しません。
 */
function generateDirectProportionValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（比例・対応する量には必須です）。");
  }
  const { knownXKey, knownYKey, targetXKey, targetYKey, constantKey } = quantityRelation;
  const constant = pickValueForRange(variables[constantKey]);
  const [knownX, targetX] = pickDistinctValuePair(variables[knownXKey], variables[targetXKey]);
  const knownY = normalizeNumber(multiplyDecimal(constant, knownX));
  const targetY = normalizeNumber(multiplyDecimal(constant, targetX));
  return {
    [knownXKey]: knownX,
    [knownYKey]: knownY,
    [targetXKey]: targetX,
    [targetYKey]: targetY,
    [constantKey]: constant
  };
}

/**
 * 反比例・対応する量専用の生成ルール（小学6年生3学期、第12段階で追加）。
 * quantityRelation（knownXKey・knownYKey・targetXKey・targetYKey・productKey）が指す
 * 変数名を使って、knownX・targetX（異なる値）と、内部でだけ使う倍率
 * （variables.scaleFactor。問題文には出てこない生成専用の値）を選び、
 * knownY＝targetX×倍率、targetY＝knownX×倍率 を計算します。この作り方だと、
 * knownX×knownY と targetX×targetY は常に等しくなり（どちらも knownX×targetX×倍率）、
 * 一定の積（productKey）を必ず整数のまま管理できます（反比例の関係
 * 「一方が増えるともう一方が減る」も、この構成なら自動的に成り立ちます）。
 */
function generateInverseProportionValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（反比例・対応する量には必須です）。");
  }
  const { knownXKey, knownYKey, targetXKey, targetYKey, productKey } = quantityRelation;
  const [knownX, targetX] = pickDistinctValuePair(variables[knownXKey], variables[targetXKey]);
  const scaleFactor = pickValueForRange(variables.scaleFactor);
  const knownY = normalizeNumber(multiplyDecimal(targetX, scaleFactor));
  const targetY = normalizeNumber(multiplyDecimal(knownX, scaleFactor));
  const product = normalizeNumber(multiplyDecimal(knownX, knownY));
  return {
    [knownXKey]: knownX,
    [knownYKey]: knownY,
    [targetXKey]: targetX,
    [targetYKey]: targetY,
    [productKey]: product
  };
}

/**
 * 縮尺・実際の長さ／縮尺・地図上の長さ、の2カテゴリで共有する生成ルール
 * （小学6年生3学期、第12段階で追加。「縮尺を求める」カテゴリは運用開始後に削除しました）。
 * quantityRelation（scaleKey・mapLengthKey・actualLengthKey・actualLengthUnit）が指す
 * 変数名を使って、縮尺の分母（scaleKey。普通の整数として式に使う）と地図上の長さ
 * （mapLengthKey、cm）を独立に生成し、実際の長さ（cm）＝地図上の長さ×縮尺の分母 を
 * 計算してから、テンプレートごとに指定された単位（km または m）に変換します
 * （js/unit-utils.js の convertLength()。常に10の累乗での割り算のため、変換後の値は
 * 必ず有限小数になります）。
 * どの量が「未知（答え）」かは、テンプレートごとの textParts・solutionRoutes 側が決めるため、
 * この関数は常に3つの量すべてを生成するだけで、2カテゴリのどのテンプレートでも使えます
 * （比を使った数量が firstAmount/secondAmount のどちらが既知でも同じ生成関数を使うのと同じ設計）。
 * scaleValue（問題文に表示する縮尺そのもの、{type:"scale",...}）もここで一緒に作ります
 * （ratioValue と同じ、固定名の表示専用メタデータ）。
 */
function generateScaleLengthValues(variables, quantityRelation) {
  if (!quantityRelation) {
    throw new Error("quantityRelation が指定されていないテンプレートです（縮尺の問題には必須です）。");
  }
  const { scaleKey, mapLengthKey, actualLengthKey, actualLengthUnit } = quantityRelation;
  // 縮尺の分母は、地図として自然な「きりのよい」値の一覧（variables[scaleKey].values）から選ぶ
  // （分数の時間の answerMinutes と同じ、値の一覧から選ぶ設計。min/max/step の連続範囲ではない）。
  const scaleDenominatorCandidates = variables[scaleKey].values;
  const scaleDenominatorValue = scaleDenominatorCandidates[pickInt(0, scaleDenominatorCandidates.length - 1)];
  const mapLengthValue = pickValueForRange(variables[mapLengthKey]);
  const actualLengthInCm = normalizeNumber(multiplyDecimal(mapLengthValue, scaleDenominatorValue));
  const actualLengthValue = convertLength(actualLengthInCm, "cm", actualLengthUnit);
  return {
    [scaleKey]: scaleDenominatorValue,
    scaleValue: createScale(scaleDenominatorValue),
    [mapLengthKey]: mapLengthValue,
    [actualLengthKey]: actualLengthValue
  };
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
  // 速さ・道のり・時間（小学5年生3学期）。速さ×時間＝道のりの関係を持つ3つのカテゴリ
  // （findSpeed: 速さを求める／findDistance: 道のりを求める／findTime: 時間を求める）で共有します。
  findSpeed: (variables, template) => generateSpeedValues(variables, template.quantityRelation),
  findDistance: (variables, template) => generateSpeedValues(variables, template.quantityRelation),
  findTime: (variables, template) => generateSpeedValues(variables, template.quantityRelation),
  // 割合（小学5年生3学期）。もとにする量×割合＝比べる量の関係を持つ3つのカテゴリ
  // （percentageFindCompared: 比べる量を求める／percentageFindRate: 割合を求める／
  //  percentageFindBase: もとにする量を求める）で共有します。
  percentageFindCompared: (variables, template) => generatePercentageValues(variables, template.quantityRelation),
  percentageFindRate: (variables, template) => generatePercentageValues(variables, template.quantityRelation),
  percentageFindBase: (variables, template) => generatePercentageValues(variables, template.quantityRelation),
  // 割引・増量（小学5年生3学期、2段階問題）。standard のエイリアス。originalPrice（もとの値段/量）・
  // discountRate/increaseRate（百分率）を独立に生成するだけで、支払う割合・値引き額・増えた量・
  // 最終的な答えは、resolveMultiStepRoutes() が各ルートのステップを計算する際に自動的に求まります
  // （専用の生成関数は不要）。
  discountTwoStep: (variables) => generateStandardValues(variables),
  increaseTwoStep: (variables) => generateStandardValues(variables),
  // 分数×整数・分数×分数・分数÷整数・整数÷分数・分数÷分数（小学6年生1学期、第10段階で追加）。
  // すべて standard のエイリアス。分数のかけ算・わり算は必ず正確な分子・分母の計算になり
  // （小数のように「割り切れるかどうか」を事前に保証する必要が無い）、あまりが出ることも
  // ないため、専用の生成関数は不要で、各変数を独立に生成するだけで作れます。
  fractionTimesInteger: (variables) => generateStandardValues(variables),
  fractionTimesFraction: (variables) => generateStandardValues(variables),
  fractionDividedByInteger: (variables) => generateStandardValues(variables),
  integerDividedByFraction: (variables) => generateStandardValues(variables),
  fractionDividedByFraction: (variables) => generateStandardValues(variables),
  // 分数倍・比べる量／分数倍・もとの量（小学6年生1学期、第10段階で追加）。
  // もとにする量×分数倍＝比べる量の関係を持つ2つのカテゴリで共有します。
  fractionMultiplierFindCompared: (variables, template) =>
    generateFractionMultiplicativeComparisonValues(variables, template.quantityRelation),
  fractionMultiplierFindBase: (variables, template) =>
    generateFractionMultiplicativeComparisonValues(variables, template.quantityRelation),
  // 単位量あたり・分数版（小学6年生1学期へ後日追加）。
  fractionUnitRate: (variables, template) => generateFractionUnitRateValues(variables, template.quantityRelation),
  // 分数の速さ・道のり（小学6年生2学期、第11段階で追加、2段階問題）。standard のエイリアス。
  // distance/speed を独立に生成するだけでよく、専用の生成関数は不要です（分から時間への変換・
  // km/時↔km/分の変換は、値の生成ではなく resolveMultiStepRoutes() が各ルートのステップ
  // （{source:"literal", value:60} を使った÷60など）を計算する際に自動的に求まります）。
  fractionSpeedWithMinuteConversion: (variables) => generateStandardValues(variables),
  fractionDistanceWithMinuteConversion: (variables) => generateStandardValues(variables),
  // 分数の時間（小学6年生2学期、第11段階で追加、2段階問題）。答え（分）が必ず整数になるよう、
  // distance・answerMinutesを先に決めてから speed を逆算する専用の生成関数を使う
  // （generateFractionTimeWithMinuteConversionValues() 参照。standard のエイリアスではない）。
  fractionTimeWithMinuteConversion: (variables, template) =>
    generateFractionTimeWithMinuteConversionValues(variables, template.quantityRelation),
  // 分数割合（比べる量・割合・もとにする量。小学6年生2学期、第11段階で追加）。
  // もとにする量×分数割合＝比べる量の関係を持つ3つのカテゴリで共有します。
  fractionRateFindCompared: (variables, template) => generateFractionRateValues(variables, template.quantityRelation),
  fractionRateFindRate: (variables, template) => generateFractionRateValues(variables, template.quantityRelation),
  fractionRateFindBase: (variables, template) => generateFractionRateValues(variables, template.quantityRelation),
  // 比を使った数量（小学6年生2学期、第11段階で追加、2段階問題）。
  ratioApplication: (variables, template) => generateRatioApplicationValues(variables, template.quantityRelation),
  // 比例配分（小学6年生2学期、第11段階で追加、3段階問題）。
  proportionalAllocation: (variables, template) => generateProportionalAllocationValues(variables, template.quantityRelation),
  // 比例・対応する量／反比例・対応する量（小学6年生3学期、第12段階で追加、2段階問題）。
  findDirectProportionValue: (variables, template) => generateDirectProportionValues(variables, template.quantityRelation),
  findInverseProportionValue: (variables, template) => generateInverseProportionValues(variables, template.quantityRelation),
  // 縮尺・実際の長さ／縮尺・地図上の長さ（小学6年生3学期、第12段階で追加、2段階問題）。
  // もとにする量が異なるだけで同じ「地図上の長さ×縮尺の分母＝実際の長さ（cm）」の関係を持つ
  // 2つのカテゴリで共有します（「縮尺を求める」カテゴリは運用開始後に削除しました）。
  findActualLengthFromScale: (variables, template) => generateScaleLengthValues(variables, template.quantityRelation),
  findMapLengthFromScale: (variables, template) => generateScaleLengthValues(variables, template.quantityRelation),
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
  "totalFromUnitRate",
  "findSpeed",
  "findDistance",
  "findTime",
  "percentageFindCompared",
  "percentageFindRate",
  "percentageFindBase",
  "fractionMultiplierFindCompared",
  "fractionMultiplierFindBase",
  "fractionUnitRate",
  "fractionRateFindCompared",
  "fractionRateFindRate",
  "fractionRateFindBase"
]);

function generateValuesForTemplate(template) {
  const handler = GENERATOR_TYPE_HANDLERS[template.generatorType] || GENERATOR_TYPE_HANDLERS.standard;
  return handler(template.variables, template);
}

export function renderTemplateText(template, values) {
  return template.template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(values, key)) return match;
    const value = values[key];
    // 百分率・比は "[object Object]" にならないよう "20%"／"5：3" の形式に変換する
    // （百分率は第9段階、比は第11段階で追加）。数値はこれまでどおり String(value) のまま
    // （桁区切りカンマを付けない。カンマ付き表示が必要な場面＝カード・結果・履歴は、
    // すべて renderValueHtml() 経由で別途行っている）。分数の値を問題文に含める場合は、
    // このtemplate文字列ではなく縦型表示に対応した textParts を使ってください。
    if (isPercentValue(value)) return formatPercent(value);
    if (isRatioValue(value)) return formatRatio(value);
    if (isScaleValue(value)) return formatScale(value);
    return String(value);
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
 * left operator right の計算結果に、solutionRoutes（またはステップ）が指定する
 * resultType を適用して求めます（第9段階で百分率、第11段階で分数を追加）。
 * - resultType:"percent" ... 数値÷数値の計算結果（例: 0.3）を百分率表示（30%）に変換する
 *   （15÷50＝30%のような「割合を求める」問題）。
 * - resultType:"fraction" ... わり算を、割り切れるかどうかに関わらず必ず正確な分数として
 *   計算し直す（例: 20÷60＝1/3、12÷20＝3/5）。通常の safeCalculate() の整数・小数どうしの
 *   わり算は「割り切れる場合だけ商を返す」（かつ割り切れても小数のまま返す）という安全設計のため、
 *   分数の速さの単位変換・分数の割合のように「必ず分数として表示したい」場面では、
 *   value-utils.js の divideValuesAsFraction() で計算し直す（0でわる場合は null のまま）。
 * - resultType が指定されていない場合（"number"／"numberOrFraction" を含む）は、
 *   通常どおり safeCalculate() の結果をそのまま返す（型は左右の値から自動的に決まる）。
 */
function computeStepResult(left, operator, right, resultType) {
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

/**
 * テンプレートの solutionRoutes（変数名で書かれた正解ルート）を、
 * 実際の数値に解決します（1段階問題用）。
 */
function resolveSolutionRoutes(template, values) {
  return template.solutionRoutes.map((route) => {
    const left = values[route.left];
    const right = values[route.right];
    const operator = route.operator;
    const result = computeStepResult(left, operator, right, route.resultType);
    // resultType もそのまま複製する。question-validator.js が生成結果を独自に再計算して
    // 照合する際、resultType を知らないと「0.3」と「30%」を一致しないと誤判定してしまうため
    // （resultType の変換は、この関数の中だけでなく、検証側でも同じロジックを再現する必要がある）。
    return { left, operator, right, result, commutative: Boolean(route.commutative), resultType: route.resultType };
  });
}

/**
 * 2段階問題の solutionRoutes（各ステップが variable/result/literal 参照で書かれたもの）を、
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
      const result = computeStepResult(left, operator, right, stepDef.resultType);
      if (stepDef.resultKey) {
        localResults[stepDef.resultKey] = result;
      }
      return {
        left,
        operator,
        right,
        result,
        resultKey: stepDef.resultKey,
        commutative: stepDef.commutative,
        resultType: stepDef.resultType
      };
    });
    return { id: route.id, steps };
  });
}

/**
 * 2段階問題のステップの left/right（{source, key} または {source:"literal", value}）を、
 * 実際の値に解決します。
 *   - source: "variable" → variables（または generatorType が計算する変数）から参照
 *   - source: "result"   → 同じルート内の、より前のステップの中間結果から参照
 *   - source: "literal"  → 固定値そのもの（第9段階で追加。割引・増量の「100%」のような、
 *     どの変数にも対応しない定数を式に含めるために使う。依頼文の元の書式
 *     （{type:"percent", value:100} を left/right に直接書く形）は、既存の
 *     {source, key} という構造に合わせて {source:"literal", value:{...}} と読み替えている）
 */
function resolveOperand(operand, baseValues, localResults) {
  if (!operand) return undefined;
  if (operand.source === "result") {
    return localResults[operand.key];
  }
  if (operand.source === "literal") {
    return operand.value;
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
 * 既存の値と重複しない、近い値のダミー百分率を生成します（第9段階で追加）。
 * generateDummyNumber() と同じ「参照値の近くをランダムにずらす」考え方を、
 * 百分率の value（例: 20）に対して適用します。0%以下にはしません。
 * @param {{type:"percent", value:number}} referencePercent
 * @param {Set<string>} excludedKeys - valueKey() で表した除外対象の集合
 */
function generateDummyPercent(referencePercent, excludedKeys) {
  const magnitude = Math.max(1, Math.abs(referencePercent.value));
  const spread = Math.max(2, Math.round(magnitude * 0.4));

  for (let attempt = 0; attempt < 30; attempt++) {
    const offset = pickInt(-spread, spread);
    let candidateValue = referencePercent.value + offset;
    if (candidateValue <= 0) {
      candidateValue = Math.abs(candidateValue) + 1;
    }
    const candidate = { type: "percent", value: candidateValue };
    if (!excludedKeys.has(valueKey(candidate))) {
      return candidate;
    }
  }
  // フォールバック：それでも重複する場合は、十分離れた値を返す
  let fallbackValue = referencePercent.value + spread + 1;
  let candidate = { type: "percent", value: fallbackValue };
  while (excludedKeys.has(valueKey(candidate))) {
    fallbackValue += 1;
    candidate = { type: "percent", value: fallbackValue };
  }
  return candidate;
}

/**
 * 値の型（数値・分数・百分率）を意識せず、既存の値と重複しないダミー値を生成します。
 */
export function generateDummyValue(referenceValue, excludedKeys) {
  if (isFractionValue(referenceValue)) {
    return generateDummyFraction(referenceValue, excludedKeys);
  }
  if (isPercentValue(referenceValue)) {
    return generateDummyPercent(referenceValue, excludedKeys);
  }
  return generateDummyNumber(referenceValue, excludedKeys);
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
  if (isFractionValue(value)) return fractionToNumber(value);
  if (isPercentValue(value)) return value.value;
  return value;
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

  // 分数・比の値が問題文に直接登場するテンプレート（小学6年生2学期、第11段階で追加）は、
  // 1段階問題と同じく textParts を使う。1段階問題の generateQuestionFromTemplate() と
  // 全く同じ分岐・関数（resolveTextParts / flattenTextPartsToPlainText）を再利用している。
  const resolvedTextParts = template.textParts ? resolveTextParts(template, values) : null;
  const text = resolvedTextParts ? flattenTextPartsToPlainText(resolvedTextParts) : renderTemplateText(template, values);
  // 比例・反比例の関係表（小学6年生3学期、第12段階で追加）。表を持たないテンプレートでは null。
  const relationTable = template.relationTable ? resolveRelationTable(template, values) : null;

  const problem = {
    id: `q_${Date.now()}_${questionSequence}`,
    templateId: template.id,
    gradeTerm: template.gradeTerm,
    category: template.category,
    questionType: "multiStep",
    text,
    textParts: resolvedTextParts,
    relationTable,
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
 * テンプレートの relationTable（{type:"value",ref:変数名} または {type:"unknown"} が並ぶ
 * 宣言的な定義）を、実際に生成された値へ解決します（小学6年生3学期、第12段階で追加）。
 * 児童が求める値のセルは {type:"unknown"} のまま残し、value-renderer.js の
 * renderRelationTableHtml() が「？」として表示します（答えを関係表に漏らさないため）。
 */
function resolveRelationTable(template, values) {
  return {
    rowHeaders: template.relationTable.rowHeaders,
    columns: template.relationTable.columns.map((column) =>
      column.map((cell) => (cell.type === "unknown" ? cell : values[cell.ref]))
    )
  };
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
  },
  // 小学5年生3学期（第9段階）：新内容は5-3の8カテゴリ、復習内容は4年生1〜3学期
  // （整数の2段階文章題を含む）・5年生1〜2学期から偏りなく選ぶ。
  "5-3": {
    newContentGradeTerms: ["5-3"],
    reviewGradeTerms: ["4-1", "4-2", "4-3", "4-multi-step", "5-1", "5-2"]
  },
  // 小学6年生1学期（第10段階）：新内容は6-1の7カテゴリ、復習内容は5年生1〜3学期から
  // 偏りなく選ぶ（運用開始後に変更。以前は4年生1〜3学期の内容も復習に含めていたが、
  // 4年生の内容は出題しないよう変更した）。
  "6-1": {
    newContentGradeTerms: ["6-1"],
    reviewGradeTerms: ["5-1", "5-2", "5-3"]
  },
  // 小学6年生2学期（第11段階）：新内容は6-2の8カテゴリ、復習内容は5年生1〜3学期・
  // 6年生1学期から偏りなく選ぶ（運用開始後に変更。以前は4年生1〜3学期の内容も復習に
  // 含めていたが、4年生の内容は出題しないよう変更した）。
  "6-2": {
    newContentGradeTerms: ["6-2"],
    reviewGradeTerms: ["5-1", "5-2", "5-3", "6-1"]
  },
  // 小学6年生3学期（第12段階）：新内容は6-3の5カテゴリ、復習内容は5年生1〜3学期・
  // 6年生1〜2学期（小学4年生の内容は含めない）。この一覧は getCandidateTemplatesForSlot()
  // がスロットからテンプレート集合を引くために使うだけで、実際の出題比率（グループA/B/Cを
  // 長期的に1:1:1にする）は既存の新内容50%/復習50%方式を使わず、
  // planQuestionSequenceThreeGroup() が別途管理します（後述）。
  "6-3": {
    newContentGradeTerms: ["6-3"],
    reviewGradeTerms: ["5-1", "5-2", "5-3", "6-1", "6-2"]
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
/**
 * gradeTermキーの配列から、学期ごと・カテゴリごとに2段構えでグループ化します
 * （第12段階で buildReviewGroupsByTerm() から切り出し、6年3学期のグループA/Bのように
 * 「GRADE_TERM_PLAN_CONFIG に登録された学期の一覧」以外の任意の学期リストからも
 * 同じ2段構えの構造を作れるようにしました）。
 */
function buildGroupsByTermList(templateSets, sourceGradeTerms) {
  const byTerm = new Map();
  for (const sourceGradeTerm of sourceGradeTerms) {
    const categoryMap = groupTemplatesByCategory([sourceGradeTerm], templateSets);
    if (categoryMap.size > 0) {
      byTerm.set(sourceGradeTerm, categoryMap);
    }
  }
  return byTerm;
}

function buildReviewGroupsByTerm(templateSets, currentGradeTerm) {
  const config = GRADE_TERM_PLAN_CONFIG[currentGradeTerm];
  if (!config) return new Map();
  return buildGroupsByTermList(templateSets, config.reviewGradeTerms);
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
 * 学期リスト（sourceGradeTerms）から、questionGroup ラベル付きのスロットを count 個作ります。
 * 「学期を選ぶ→その学期の中でカテゴリを選ぶ」の2段階を、それぞれラウンドロビンで行うことで、
 * 特定の学期・特定のカテゴリだけに偏らないようにします（第12段階で planReviewSlots() から
 * 切り出し、6年3学期のグループA/Bのように「復習内容だが対象学期がGRADE_TERM_PLAN_CONFIGの
 * 一覧全体ではなく一部だけ」のケースにも使えるようにしました）。
 * questionGroup は、6年3学期のグループA/B/Cを区別するための追加ラベルで、
 * 既存の4-2/4-3などの2グループ方式では null のまま使われません（後方互換）。
 */
function planSlotsForTermList(count, templateSets, sourceGradeTerms, questionGroup) {
  const byTerm = buildGroupsByTermList(templateSets, sourceGradeTerms);
  if (byTerm.size === 0) {
    return Array.from({ length: count }, () => ({ contentGroup: "review", questionGroup, reviewGradeTerm: null, category: null }));
  }

  const termLabels = buildRoundRobinLabels(byTerm, count);
  const countsByTerm = new Map();
  for (const term of termLabels) {
    countsByTerm.set(term, (countsByTerm.get(term) || 0) + 1);
  }

  const categoryQueueByTerm = new Map();
  for (const [term, termCount] of countsByTerm) {
    categoryQueueByTerm.set(term, buildRoundRobinLabels(byTerm.get(term), termCount));
  }

  const cursorByTerm = new Map();
  return termLabels.map((term) => {
    const cursor = cursorByTerm.get(term) || 0;
    const category = categoryQueueByTerm.get(term)[cursor];
    cursorByTerm.set(term, cursor + 1);
    return { contentGroup: "review", questionGroup, reviewGradeTerm: term, category };
  });
}

/**
 * 復習内容のスロットを reviewCount 個作ります（4-2/4-3などの既存の2グループ方式専用）。
 */
function planReviewSlots(reviewCount, templateSets, currentGradeTerm) {
  const config = GRADE_TERM_PLAN_CONFIG[currentGradeTerm];
  const sourceGradeTerms = config ? config.reviewGradeTerms : [];
  return planSlotsForTermList(reviewCount, templateSets, sourceGradeTerms, null);
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

// 小学6年生3学期（第12段階）の出題グループ定義。
//   グループA(grade5)       : 小学5年生1〜3学期の復習
//   グループB(grade6Review) : 小学6年生1〜2学期の復習
//   グループC(grade6Term3)  : 小学6年生3学期の新内容（比例・反比例・縮尺の4カテゴリ）
// 小学4年生の内容は意図的に含めません（依頼文の指示どおり）。
const GRADE6_TERM3_GROUP_SOURCE_TERMS = {
  grade5: ["5-1", "5-2", "5-3"],
  grade6Review: ["6-1", "6-2"]
};
const GRADE6_TERM3_QUESTION_GROUPS = ["grade5", "grade6Review", "grade6Term3"];

/**
 * totalQuestions を3グループにできるだけ均等に配分します。
 * 3で割り切れない余り（0〜2問）は、rotationIndex を起点にグループの順番をずらしながら
 * 配ることで、複数回プレイしたときに毎回同じグループばかりが多く（または少なく）
 * ならないようにします（依頼文の「余りを受け取るグループをローテーションする」設計）。
 * rotationIndex は呼び出し側（js/game.js）が js/storage.js 経由で永続化し、
 * ゲームを1回開始するたびに進めます。このファイル自体は localStorage に触れない
 * 「副作用のない純粋関数」のままにするため、rotationIndex は必ず引数で受け取ります。
 */
function buildGrade6Term3GroupCounts(totalQuestions, rotationIndex) {
  const base = Math.floor(totalQuestions / 3);
  const remainder = totalQuestions - base * 3; // 0, 1, または 2
  const counts = { grade5: base, grade6Review: base, grade6Term3: base };
  for (let i = 0; i < remainder; i++) {
    const group = GRADE6_TERM3_QUESTION_GROUPS[(rotationIndex + i) % GRADE6_TERM3_QUESTION_GROUPS.length];
    counts[group] += 1;
  }
  return counts;
}

/**
 * 小学6年生3学期モード用の出題プランを作成します（第12段階で追加）。
 * 4-2/4-3などの既存モードが使う「新内容50%・復習50%」の2グループ方式ではなく、
 * グループA（5年生1〜3学期の復習）・グループB（6年生1〜2学期の復習）・
 * グループC（6年生3学期の新内容）の3グループを、長期的におよそ1:1:1にします。
 * グループA・Bの内部は、既存の planReviewSlots() と同じ「学期→カテゴリ」の
 * 2段階ラウンドロビンで均等に配分します（planSlotsForTermList() を対象学期を
 * 絞って再利用）。グループCの内部は、既存の新内容カテゴリと同じラウンドロビンで
 * 4カテゴリに配分します（buildRoundRobinLabels()）。
 * @param {number} totalQuestions
 * @param {Record<string, Array>} templateSets
 * @param {number} rotationIndex - 余りを受け取るグループのローテーション位置（0始まり）
 * @returns {Array<{contentGroup:string, questionGroup:string, reviewGradeTerm?:string, category:string}>}
 */
export function planQuestionSequenceThreeGroup(totalQuestions, templateSets, rotationIndex = 0) {
  const counts = buildGrade6Term3GroupCounts(totalQuestions, rotationIndex);

  const grade5Slots = planSlotsForTermList(counts.grade5, templateSets, GRADE6_TERM3_GROUP_SOURCE_TERMS.grade5, "grade5");
  const grade6ReviewSlots = planSlotsForTermList(
    counts.grade6Review,
    templateSets,
    GRADE6_TERM3_GROUP_SOURCE_TERMS.grade6Review,
    "grade6Review"
  );

  const grade6Term3CategoryGroups = groupTemplatesByCategory(["6-3"], templateSets);
  const grade6Term3Labels = buildRoundRobinLabels(grade6Term3CategoryGroups, counts.grade6Term3);
  const grade6Term3Slots = grade6Term3Labels.map((label) => ({
    contentGroup: "new",
    questionGroup: "grade6Term3",
    category: label
  }));

  const shuffled = shuffleArray([...grade5Slots, ...grade6ReviewSlots, ...grade6Term3Slots]);
  return limitConsecutiveRuns(shuffled, (slot) => slot.questionGroup, 2);
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
