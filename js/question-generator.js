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
import { normalizeNumber } from "./number-utils.js";

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
 * variables で定義された各変数の値を、独立にランダム生成します。
 * 変数の定義に decimalPlaces があれば小数として、無ければ従来どおり
 * min〜max（step刻み）の整数として生成します（たし算・ひき算・かけ算、
 * 小数のたし算・ひき算、大きな数、除算を含まない2段階問題で使用）。
 */
export function generateStandardValues(variables) {
  const values = {};
  for (const key of Object.keys(variables)) {
    const range = variables[key];
    values[key] = range.decimalPlaces ? pickDecimalValue(range) : pickStepped(range);
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

const GENERATOR_TYPE_HANDLERS = {
  standard: (variables) => generateStandardValues(variables),
  // decimalAddition / decimalSubtraction は standard のエイリアス。
  // 生成の「戦略」（各変数を独立に生成する）は同じで、演算の種類は
  // solutionRoutes 側が決めるため、別の生成関数を用意する必要が無いためです。
  decimalAddition: (variables) => generateStandardValues(variables),
  decimalSubtraction: (variables) => generateStandardValues(variables),
  exactDivision: (variables) => generateExactDivisionValues(variables),
  // わる数が2けたになる点だけが exactDivision と異なる（variables.divisor の範囲で決まる）。
  exactDivisionTwoDigit: (variables) => generateExactDivisionValues(variables),
  multiStepDivideFirst: (variables) => generateMultiStepDivideFirstValues(variables),
  multiStepSumToDivisible: (variables) => generateMultiStepSumToDivisibleValues(variables)
};

// getVisibleNumbers 等で「dividend/divisor を特別扱いする」対象の generatorType。
const DIVISION_GENERATOR_TYPES = new Set(["exactDivision", "exactDivisionTwoDigit"]);

function generateValuesForTemplate(template) {
  const handler = GENERATOR_TYPE_HANDLERS[template.generatorType] || GENERATOR_TYPE_HANDLERS.standard;
  return handler(template.variables);
}

export function renderTemplateText(template, values) {
  return template.template.replace(/\{(\w+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match;
  });
}

/**
 * 問題文に登場する数値（選択肢のもとになる）を、テンプレートの種類に応じて求めます。
 * 1段階問題でのみ使用します（2段階問題は multi-step-engine.js が
 * ステップごとに独自に「見えている数値」を判定します）。
 */
function getVisibleNumbers(template, values) {
  if (DIVISION_GENERATOR_TYPES.has(template.generatorType)) {
    return [values.dividend, values.divisor];
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
 */
export function generateDummyNumber(referenceValue, excludedValues) {
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

/**
 * 選択肢カード（最大8枚）を生成する汎用関数。
 * 1段階問題・2段階問題の両方から使われます（2段階問題は multi-step-engine.js 経由）。
 *
 * @param {Array<{value:number, source:string}>} realNumbers - 実際に見えている数値（重複は事前に排除しておくこと）
 * @param {string|string[]} correctOperators - 今回正解として認める演算記号（複数解法で1つ目の式の演算子が
 *   ルートによって異なる場合は配列で複数渡せる。例: ["+","-"]）
 * @param {number|number[]} resultsToExclude - ダミー数値として出現させてはいけない値（その式の答え・最終的な答えなど）
 * @returns {Array} シャッフル済みのカード配列
 */
export function buildChoiceCards(realNumbers, correctOperators, resultsToExclude) {
  const uniqueCorrectOps = [...new Set(Array.isArray(correctOperators) ? correctOperators : [correctOperators])];
  const excludedResults = Array.isArray(resultsToExclude) ? resultsToExclude : [resultsToExclude];
  const excluded = new Set([...realNumbers.map((n) => n.value), ...excludedResults.filter((v) => v !== undefined)]);

  const cards = [];

  for (const entry of realNumbers) {
    cards.push(makeCard("number", entry.value, entry.source));
  }

  for (const op of uniqueCorrectOps) {
    cards.push(makeCard("operator", op, "operator"));
  }

  const remainingOperatorCandidates = OPERATORS.filter((op) => !uniqueCorrectOps.includes(op));
  const dummyOperatorCount = Math.max(0, Math.min(remainingOperatorCandidates.length, 8 - cards.length - 1));
  for (const op of shuffleArray(remainingOperatorCandidates).slice(0, dummyOperatorCount)) {
    cards.push(makeCard("operator", op, "dummyOperator"));
  }

  const remainingSlots = Math.max(0, 8 - cards.length);
  const referenceValues = realNumbers.map((n) => n.value);
  for (let i = 0; i < remainingSlots; i++) {
    const reference = referenceValues.length > 0 ? referenceValues[i % referenceValues.length] : 10;
    const dummy = generateDummyNumber(reference, excluded);
    excluded.add(dummy);
    cards.push(makeCard("number", dummy, "dummy"));
  }

  return shuffleArray(cards);
}

/**
 * 1段階問題用の選択肢カードを生成します（内部専用）。
 */
function buildSingleStepChoices(problem) {
  const numberValues = new Set(getVisibleNumbers(problem.template, problem.values));
  const realNumbers = Array.from(numberValues, (value) => ({ value, source: "variable" }));
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

  const problem = {
    id: `q_${Date.now()}_${questionSequence}`,
    templateId: template.id,
    gradeTerm: template.gradeTerm,
    category: template.category,
    questionType: template.questionType,
    text: renderTemplateText(template, values),
    // canonical（1番目の正解ルート）を、表示・選択肢生成・スコア計算用に
    // トップレベルにも複製している。既存の game.js / ui.js はこちらを参照する。
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
// 小学4年生2学期モード：新内容／復習内容の出題プラン
// ============================================================
//
// 「4-2」の問題テンプレート（新内容）と「4-1」の問題テンプレート（復習内容）を、
// およそ半分ずつ・カテゴリに偏りなく・3問以上連続しないように並べた
// 「出題プラン」を作ります。実際の問題生成（数値のランダム化）は行わず、
// 各問題スロットが「新内容か復習内容か」「新内容ならどのカテゴリか」を
// 決めるだけです（実際の生成は、既存の generateQuestion() がそのカテゴリの
// テンプレート集合から行います）。
//
// カテゴリは data/grade4-term2.js の category フィールドから自動的に集計するため、
// 新しいカテゴリのテンプレートを追加しても、このファイルの修正は不要です
// （唯一の例外は「2段階文章題」で、data/multi-step-integer.js 側の複数のカテゴリ名を
// 1つの疑似カテゴリとしてまとめて扱います）。

const MULTI_STEP_PSEUDO_CATEGORY = "2段階文章題";

/**
 * テンプレートが「新内容」か「復習内容」かを判定します。
 * template.contentGroup が明示されていればそれに従い、
 * 無ければ gradeTerm から推測します（"4-1" は復習、それ以外は新内容）。
 * これにより、data/grade4-term1.js や data/multi-step-integer.js に
 * contentGroup フィールドを追加しなくても正しく分類できます。
 */
export function getContentGroup(template) {
  if (template.contentGroup === "new" || template.contentGroup === "review") {
    return template.contentGroup;
  }
  return template.gradeTerm === "4-1" ? "review" : "new";
}

/**
 * 小学4年生2学期モードの「新内容」テンプレートを、カテゴリ名ごとにグループ化します。
 * data/multi-step-integer.js（2段階文章題）は、カテゴリ名がテンプレートごとに
 * 異なる（例: "2段階・かけ算とたし算" 等）ため、1つの疑似カテゴリ「2段階文章題」に
 * まとめます。
 *
 * @param {Record<string, Array>} templateSets - data/index.js の TEMPLATE_SETS_BY_GRADE_TERM 相当
 * @returns {Map<string, Array>} カテゴリ名 → テンプレート配列
 */
export function buildNewContentCategoryGroups(templateSets) {
  const groups = new Map();

  for (const template of templateSets["4-2"] || []) {
    const list = groups.get(template.category) || [];
    list.push(template);
    groups.set(template.category, list);
  }

  const multiStepTemplates = templateSets["4-multi-step"] || [];
  if (multiStepTemplates.length > 0) {
    groups.set(MULTI_STEP_PSEUDO_CATEGORY, multiStepTemplates);
  }

  return groups;
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
 * 小学4年生2学期モード用の出題プランを作成します。
 * 新内容が約半分・復習内容が約半分（問題数が奇数の場合は新内容を1問多く）になり、
 * 新内容の中のカテゴリはできるだけ均等に、全体としては同じカテゴリ（復習は
 * "review" というひとまとまりとして扱う）が3問以上連続しないようにします。
 *
 * @param {number} totalQuestions
 * @param {Record<string, Array>} templateSets
 * @returns {Array<{contentGroup: "new"|"review", category: string|null}>}
 */
export function planQuestionSequence(totalQuestions, templateSets) {
  const newCount = Math.ceil(totalQuestions / 2);
  const reviewCount = totalQuestions - newCount;

  const categoryGroups = buildNewContentCategoryGroups(templateSets);
  const categoryLabels = shuffleArray([...categoryGroups.keys()]);

  const slots = [];
  for (let i = 0; i < newCount; i++) {
    const label = categoryLabels.length > 0 ? categoryLabels[i % categoryLabels.length] : null;
    slots.push({ contentGroup: "new", category: label });
  }
  for (let i = 0; i < reviewCount; i++) {
    slots.push({ contentGroup: "review", category: null });
  }

  const shuffled = shuffleArray(slots);
  return limitConsecutiveRuns(shuffled, (slot) => (slot.contentGroup === "review" ? "review" : slot.category), 2);
}

/**
 * 出題プランの1スロット分から、実際に問題を生成する際の候補テンプレート一覧を求めます。
 */
export function getCandidateTemplatesForSlot(slot, templateSets) {
  if (!slot || slot.contentGroup === "review") {
    return templateSets["4-1"] || [];
  }
  const groups = buildNewContentCategoryGroups(templateSets);
  return groups.get(slot.category) || templateSets["4-2"] || [];
}
