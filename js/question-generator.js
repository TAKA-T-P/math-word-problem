// 問題テンプレートから、実際に出題する問題（数値を当てはめたもの）と
// 選択肢カードを生成するモジュール。
// 問題データ（data/*.js）はここには含めず、外部から渡してもらう設計にしています。
// そのため、新しいテンプレートをデータファイルに追加するだけで、
// このファイルを修正する必要はありません。

import { safeCalculate } from "./answer-checker.js";

const OPERATORS = ["+", "-", "×", "÷"];

let questionSequence = 0;

function pickInt(min, max) {
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/**
 * min〜max の範囲を step 刻みで取りうる値の中からランダムに1つ選びます。
 */
function pickStepped(range) {
  const step = range.step && range.step > 0 ? range.step : 1;
  const stepsCount = Math.floor((range.max - range.min) / step);
  const chosenStep = pickInt(0, Math.max(stepsCount, 0));
  return range.min + chosenStep * step;
}

/**
 * 通常のテンプレート（たし算・ひき算・かけ算）用に、
 * variables で定義された各変数の値をランダム生成します。
 */
function generateStandardValues(variables) {
  const values = {};
  for (const key of Object.keys(variables)) {
    values[key] = pickStepped(variables[key]);
  }
  return values;
}

/**
 * わり算専用の生成ルール。
 * 先に divisor（わる数・1けた）と quotient（商）を決めてから、
 * dividend（わられる数）= divisor × quotient を計算します。
 * これにより、必ずあまりなく割り切れる問題になります。
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

function renderTemplateText(template, values) {
  return template.template.replace(/\{(\w+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match;
  });
}

/**
 * 問題文に登場する数値（選択肢のもとになる）を、テンプレートの種類に応じて求めます。
 */
function getVisibleNumbers(template, values) {
  if (template.generatorType === "exactDivision") {
    return [values.dividend, values.divisor];
  }
  return Object.keys(template.variables).map((key) => values[key]);
}

function generateDummyOperators(correctOperator, count) {
  const others = OPERATORS.filter((op) => op !== correctOperator);
  const shuffled = shuffleArray(others);
  return shuffled.slice(0, count);
}

/**
 * 既存の数値と重複せず、答えとも一致しないダミー数値を生成します。
 * 桁数の近い、もっともらしい数値になるようにしています。
 */
function generateDummyNumber(referenceValue, excludedValues) {
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
    if (!excludedValues.has(candidate)) {
      return candidate;
    }
  }
  // フォールバック：それでも重複する場合は、十分離れた値を返す
  let fallback = referenceValue + spread + 1;
  while (excludedValues.has(fallback)) {
    fallback += 1;
  }
  return fallback;
}

function shuffleArray(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let cardSequence = 0;
function makeCard(type, value) {
  cardSequence += 1;
  return {
    cardId: `card_${Date.now()}_${cardSequence}`,
    type, // "number" | "operator"
    value
  };
}

/**
 * 問題1問分に対応する選択肢カード（最大8枚）を生成します。
 * - 正解に必要な数値・演算記号
 * - 問題文に登場する数値
 * - ダミーの演算記号
 * - 必要に応じてダミーの数値
 * 答えそのもの（result）はカードに含めません。
 */
function buildChoices(problem) {
  const numberValues = new Set(getVisibleNumbers(problem.template, problem.values));
  const excluded = new Set([...numberValues, problem.result]);

  const cards = [];

  // 正解・問題文に登場する数値カード
  for (const value of numberValues) {
    cards.push(makeCard("number", value));
  }

  // 演算記号カード（正解 + ダミー最大3種）
  cards.push(makeCard("operator", problem.operator));
  const dummyOperatorCount = Math.min(3, 8 - cards.length - 1);
  for (const op of generateDummyOperators(problem.operator, Math.max(dummyOperatorCount, 0))) {
    cards.push(makeCard("operator", op));
  }

  // 残り枠をダミー数値で埋める（最大8枚まで）
  const remainingSlots = 8 - cards.length;
  const referenceValues = Array.from(numberValues);
  for (let i = 0; i < remainingSlots; i++) {
    const reference = referenceValues[i % referenceValues.length];
    const dummy = generateDummyNumber(reference, excluded);
    excluded.add(dummy);
    cards.push(makeCard("number", dummy));
  }

  return shuffleArray(cards);
}

/**
 * 出題範囲のテンプレート一覧から、問題を1問生成します。
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

  const template = candidates[pickInt(0, candidates.length - 1)];

  const values =
    template.generatorType === "exactDivision"
      ? generateExactDivisionValues(template.variables)
      : generateStandardValues(template.variables);

  const left = values[template.solution.left];
  const right = values[template.solution.right];
  const operator = template.solution.operator;
  const result = safeCalculate(left, operator, right);

  questionSequence += 1;

  const problem = {
    id: `q_${Date.now()}_${questionSequence}`,
    templateId: template.id,
    category: template.category,
    text: renderTemplateText(template, values),
    left,
    operator,
    right,
    result,
    answerUnit: template.answerUnit,
    commutative: Boolean(template.commutative),
    template,
    values,
    choices: []
  };

  problem.choices = buildChoices(problem);

  return problem;
}
