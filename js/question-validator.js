// 問題テンプレート・生成済み問題を検証するモジュール。
// ゲーム本体（question-generator.js / game.js）と、開発者用の検証ページ
// （tools/question-validator.html）の両方から使われる、副作用のない純粋関数群です。

import { safeCalculate } from "./answer-checker.js";
import { areNumbersEqual, getDecimalPlaces, formatNumber, parseFormattedNumber } from "./number-utils.js";

// このアプリで扱う小数点以下の最大桁数（4.15 のような2桁まで）。
// これを超える場合は「小学4年生として不自然」と判断してエラーにします。
const MAX_REASONABLE_DECIMAL_PLACES = 2;

// 現在 data/index.js に登録されている出題範囲キー。新しい学期を追加したら、
// ここにも追加してください（data/index.js から自動取得すると循環参照になりやすいため、
// 検証専用の一覧として独立させています）。
const VALID_GRADE_TERMS = ["4-1", "4-2", "4-multi-step"];

export const VALID_OPERATORS = ["+", "-", "×", "÷"];
export const VALID_QUESTION_TYPES = ["singleStep", "multiStep"];

export const REQUIRED_TEMPLATE_FIELDS = [
  "id",
  "gradeTerm",
  "category",
  "difficulty",
  "questionType",
  "template",
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
  // decimalAddition / decimalSubtraction は standard のエイリアス（生成戦略は同じ）。
  decimalAddition: {
    requiredVariableKeys: [],
    computedVariables: []
  },
  decimalSubtraction: {
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
  multiStepDivideFirst: {
    requiredVariableKeys: ["divisor", "quotient"],
    computedVariables: ["dividend"]
  },
  multiStepSumToDivisible: {
    requiredVariableKeys: ["divisor", "quotient", "a"],
    computedVariables: ["b", "sum"]
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

  if (typeof template.template === "string" && hasVariables && rule) {
    const knownVariableKeys = new Set([...Object.keys(template.variables), ...rule.computedVariables]);
    for (const key of extractPlaceholders(template.template)) {
      if (!knownVariableKeys.has(key)) {
        errors.push(`未定義の変数が問題文で使われています: {${key}}`);
      }
    }
    for (const requiredKey of rule.requiredVariableKeys) {
      if (!(requiredKey in template.variables)) {
        errors.push(`generatorType="${template.generatorType}" に必要な変数がありません: ${requiredKey}`);
      }
    }
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

  // 小数を扱う変数（decimalPlaces 指定あり）が、不自然に細かすぎないかを確認する。
  if (hasVariables) {
    for (const [key, range] of Object.entries(template.variables)) {
      if (range && range.decimalPlaces > MAX_REASONABLE_DECIMAL_PLACES) {
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
      const knownVariableKeys = new Set([...Object.keys(template.variables), ...rule.computedVariables]);
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
 * - left/right の source/key が正しいか（未定義の変数を参照していないか、
 *   source:"result" が「同じルート内の、より前のステップの resultKey」だけを
 *   参照しているか＝これにより自己参照・前方参照・循環参照を機械的に防止する）
 */
function validateMultiStepSolutionRoutes(template, rule, errors) {
  const routeIds = template.solutionRoutes.map((r) => r && r.id).filter(Boolean);
  const duplicateRouteIds = routeIds.filter((id, i) => routeIds.indexOf(id) !== i);
  if (duplicateRouteIds.length > 0) {
    errors.push(`solutionRoutes内でルートIDが重複しています: ${[...new Set(duplicateRouteIds)].join(", ")}`);
  }

  const knownVariableKeys = rule ? new Set([...Object.keys(template.variables || {}), ...rule.computedVariables]) : null;

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
      if (route.left % route.right !== 0) {
        errors.push(`あまりのあるわり算です: ${route.left}÷${route.right}`);
        continue;
      }
      if (
        problem.template &&
        problem.template.generatorType === "exactDivisionTwoDigit" &&
        (route.right < 10 || route.right > 99)
      ) {
        errors.push(`2けたでわるわり算のはずが、わる数が2けたではありません: ${route.right}`);
      }
    }
    const computed = safeCalculate(route.left, route.operator, route.right);
    if (computed === null) {
      errors.push(`式が計算できません: ${route.left}${route.operator}${route.right}`);
      continue;
    }
    // 小数の内部誤差の影響を受けないよう、厳密な !== ではなく誤差許容の比較を使う。
    if (route.result !== undefined && !areNumbersEqual(computed, route.result)) {
      errors.push(
        `正解式と計算結果が一致しません: ${route.left}${route.operator}${route.right} => 期待値${route.result}, 計算値${computed}`
      );
      continue;
    }
    if (computed < 0) {
      errors.push(`答えが負の数です: ${route.left}${route.operator}${route.right} = ${computed}`);
      continue;
    }
    for (const value of [route.left, route.right, computed]) {
      if (getDecimalPlaces(value) > MAX_REASONABLE_DECIMAL_PLACES) {
        errors.push(`小数点以下の桁数が不自然です: ${value}`);
      }
      const roundTrip = parseFormattedNumber(formatNumber(value));
      if (!areNumbersEqual(roundTrip, value)) {
        errors.push(`表示用の数値表現が内部値と一致しません: ${value} → "${formatNumber(value)}" → ${roundTrip}`);
      }
    }
    validResults.push(computed);
  }

  if (validResults.length === 0) {
    errors.push("正解ルートが存在しません(すべてのルートが不正です)");
  } else if (new Set(validResults).size > 1) {
    errors.push(`solutionRoutes間で答えが一致しません: ${[...new Set(validResults)].join(", ")}`);
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
      if (!numberValues.includes(canonical.left)) {
        errors.push(`必要な数値カードがありません: ${canonical.left}`);
      }
      if (!numberValues.includes(canonical.right)) {
        errors.push(`必要な数値カードがありません: ${canonical.right}`);
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
        if (step.left % step.right !== 0) {
          errors.push(`[${route.id}] あまりのあるわり算です: ${step.left}÷${step.right}`);
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
      if (step.result !== undefined && !areNumbersEqual(computed, step.result)) {
        errors.push(
          `[${route.id}] 正解式と計算結果が一致しません: ${step.left}${step.operator}${step.right} => 期待値${step.result}, 計算値${computed}`
        );
        routeValid = false;
        break;
      }
      if (computed < 0) {
        errors.push(`[${route.id}] 途中結果が負の数です: ${step.left}${step.operator}${step.right} = ${computed}`);
        routeValid = false;
        break;
      }
    }

    if (routeValid) {
      const lastStep = route.steps[route.steps.length - 1];
      finalResultsByRoute.push(lastStep.result);
      if (finalAnswer !== undefined && lastStep.result !== finalAnswer) {
        errors.push(`[${route.id}] 最終結果が answer/result と一致しません: ${lastStep.result} !== ${finalAnswer}`);
      }
    }
  }

  if (finalResultsByRoute.length === 0) {
    errors.push("正解ルートが存在しません(すべてのルートが不正です)");
  } else if (new Set(finalResultsByRoute).size > 1) {
    errors.push(`solutionRoutes間で最終的な答えが一致しません: ${[...new Set(finalResultsByRoute)].join(", ")}`);
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
    if (finalAnswer !== undefined && dummyNumberValues.includes(finalAnswer)) {
      errors.push(`最終的な答え(${finalAnswer})がダミーカードとして選択肢に含まれています`);
    }

    // 1つ目の式で必要になりうる数値・演算記号(候補ルートすべて)が揃っているか
    const firstStepDefs = routes.filter((r) => Array.isArray(r.steps) && r.steps[0]).map((r) => r.steps[0]);
    const numberValues = problem.choices.filter((c) => c.type === "number").map((c) => c.value);
    const operatorValues = problem.choices.filter((c) => c.type === "operator").map((c) => c.value);
    for (const step of firstStepDefs) {
      if (!operatorValues.includes(step.operator)) {
        errors.push(`必要な演算記号カードがありません: ${step.operator}`);
      }
      if (!numberValues.includes(step.left)) {
        errors.push(`必要な数値カードがありません: ${step.left}`);
      }
      if (!numberValues.includes(step.right)) {
        errors.push(`必要な数値カードがありません: ${step.right}`);
      }
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
