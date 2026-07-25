// ヘルプメニューの「例題確認」機能を専門に担当するモジュール（運用開始後に追加）。
// カテゴリ一覧の取得・固定シードでの例題生成・代表解法ルートの選択・模範式の組み立て・
// ヒントの取得・例題データの検証を担当する。DOM描画・画面切り替えは js/ui.js が行う
// （このファイルは純粋なデータの組み立てだけを行い、DOMには一切触れない）。
//
// 生成にはゲーム本体と同じ js/question-generator.js の generateQuestionFromTemplate() を
// そのまま再利用する（分数・帯分数・百分率・比・縮尺の値の組み立てを重複させない）。
// 固定シードで毎回同じ例題を表示するため、tools/quality-rules.js の createSeededRng() と
// 同じ mulberry32 アルゴリズムをこのファイル内に独立して実装している（tools/ 配下は
// 開発者専用ツールで、ゲーム本体の js/*.js からは参照しない既存の設計方針を保つため。
// tools/quality-check.js のコメント「開発者用ツールでのみ読み込まれ、ゲーム本体からは
// 一切参照しません」を参照）。

import { getTemplateById } from "../data/index.js";
import { getLearningSupportForCategory, resolveHintText } from "../data/learning-support.js";
import { getCategoryById, getEnabledTrainingCategories, getGradeTermGroups, getCategoriesForGradeTerm } from "../data/category-registry.js";
import { generateQuestionFromTemplate, setRandomSource, resetRandomSource } from "./question-generator.js";

/**
 * tools/quality-rules.js の createSeededRng() と同じ mulberry32 実装（独立コピー）。
 * 同じシードを渡せば必ず同じ数列を返すため、例題は毎回同じ内容になる。
 */
function createSeededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 例題確認のカテゴリ一覧を、学年・学期見出し付きでまとめて返す。
 * data/category-registry.js の getGradeTermGroups()/getCategoriesForGradeTerm() を
 * そのまま使うため、カテゴリの追加・削除は自動的に反映される。
 * @returns {Array<{gradeTerm: string, gradeLabel: string, categories: Array}>}
 */
export function getExampleCategoryGroups() {
  return getGradeTermGroups().map((group) => ({
    gradeTerm: group.gradeTerm,
    gradeLabel: group.gradeLabel,
    categories: getCategoriesForGradeTerm(group.gradeTerm)
  }));
}

/**
 * 指定したカテゴリの代表例題を、固定シードで生成する。
 * ゲーム本体（gameState/trainingState/reviewState）・localStorage・6年3学期のローテーション
 * カウンタのいずれにも触れない（generateQuestionFromTemplate() 自体がそれらを参照しない
 * 純粋な構築関数のため）。setRandomSource/resetRandomSource は必ず try...finally で対にし、
 * 例外が起きても乱数源が固定されたままにならないようにする。
 *
 * @returns {{category, template, problem, hintTexts: string[], exampleRoute: object|null,
 *            modelSteps: Array<{left, operator, right, result}>, finalAnswer}}
 */
export function generateExample(categoryId) {
  const support = getLearningSupportForCategory(categoryId);
  if (!support) {
    throw new Error(`カテゴリ「${categoryId}」の学習支援データ（learning-support.js）が見つかりません。`);
  }
  const template = getTemplateById(support.exampleTemplateId);
  if (!template) {
    throw new Error(`例題用テンプレート「${support.exampleTemplateId}」が見つかりません（カテゴリ: ${categoryId}）。`);
  }

  let problem;
  setRandomSource(createSeededRandom(support.exampleSeed));
  try {
    problem = generateQuestionFromTemplate(template);
  } finally {
    resetRandomSource();
  }

  const category = getCategoryById(categoryId);

  if (problem.questionType === "multiStep") {
    const routes = problem.solutionRoutes || [];
    const route = (support.exampleRouteId && routes.find((r) => r.id === support.exampleRouteId)) || routes[0] || null;
    const steps = route && Array.isArray(route.steps) ? route.steps : [];
    // 各ルートのステップは、テンプレート生成時（resolveMultiStepRoutes）にすでに確定した
    // 具体的な数値（left/operator/right/result）を持つため、multiStepEngine.submitStepAnswer()
    // を実際に呼んでゲーム進行を進める必要はない。
    const modelSteps = steps.map((step) => ({
      left: step.left,
      operator: step.operator,
      right: step.right,
      result: step.result
    }));
    const hintTexts = steps.map((_, stepIndex) =>
      resolveHintText({ categoryId, templateHintSteps: template.hintSteps, currentStepIndex: stepIndex })
    );
    return {
      category,
      template,
      problem,
      hintTexts,
      exampleRoute: route,
      modelSteps,
      finalAnswer: problem.answer !== undefined ? problem.answer : problem.result
    };
  }

  const modelSteps = [{ left: problem.left, operator: problem.operator, right: problem.right, result: problem.result }];
  const hintTexts = [resolveHintText({ categoryId, templateHintSteps: template.hintSteps, currentStepIndex: 0 })];
  return {
    category,
    template,
    problem,
    hintTexts,
    exampleRoute: problem.solutionRoutes && problem.solutionRoutes[0] ? problem.solutionRoutes[0] : null,
    modelSteps,
    finalAnswer: problem.result
  };
}

/**
 * 開発者用の検証ツール（tools/quality-check.js）向け。全カテゴリの例題を実際に生成し、
 * 例外の有無・決定性（同じシードで2回生成して結果が一致するか）・模範式の最終結果が
 * finalAnswer と一致するかを確認する。ゲーム本体からは呼ばれない。
 * @returns {{valid: boolean, errors: Array<{categoryId: string, ruleId: string, message: string}>}}
 */
export function validateAllExamples() {
  const categories = getEnabledTrainingCategories();
  const errors = [];

  for (const category of categories) {
    let first;
    try {
      first = generateExample(category.id);
    } catch (e) {
      errors.push({ categoryId: category.id, ruleId: "EXAMPLE_GENERATION_FAILED", message: e.message });
      continue;
    }

    let second;
    try {
      second = generateExample(category.id);
    } catch (e) {
      errors.push({ categoryId: category.id, ruleId: "EXAMPLE_GENERATION_FAILED", message: e.message });
      continue;
    }
    if (JSON.stringify(first.modelSteps) !== JSON.stringify(second.modelSteps) || JSON.stringify(first.finalAnswer) !== JSON.stringify(second.finalAnswer)) {
      errors.push({
        categoryId: category.id,
        ruleId: "EXAMPLE_NOT_DETERMINISTIC",
        message: "同じ固定シードで2回生成した例題の内容が一致しません。"
      });
    }

    if (first.modelSteps.length === 0) {
      errors.push({ categoryId: category.id, ruleId: "EXAMPLE_ROUTE_FAILED", message: "模範式が1件も組み立てられませんでした。" });
      continue;
    }
    const lastStep = first.modelSteps[first.modelSteps.length - 1];
    if (JSON.stringify(lastStep.result) !== JSON.stringify(first.finalAnswer)) {
      errors.push({
        categoryId: category.id,
        ruleId: "EXAMPLE_ROUTE_FAILED",
        message: "模範式の最後のステップの結果が、この問題の答え（finalAnswer）と一致しません。"
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
