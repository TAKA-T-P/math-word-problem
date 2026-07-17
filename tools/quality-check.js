// 全範囲品質確認ツール（tools/quality-check.html）のメインスクリプト。
// 開発者用ツールでのみ読み込まれ、ゲーム本体（js/*.js）からは一切参照しません。
//
// 既存の検証ロジック（js/question-validator.js・js/multi-step-engine.js・
// js/training-mode.js・js/review-mode.js・js/question-generator.js）をそのまま再利用し、
// このファイルでは複製しません。新しく追加するのは、それらがカバーしていないチェック
// （tools/quality-rules.js）と、100回生成の耐久テスト・出題セット検証・重複連続検出・
// 進行状況表示・結果の集計とレポート出力を行う「orchestration」の部分だけです。
//
// プレイヤーの保存データ（js/storage.js）は一切読み書きしません。通常バトルの出題プラン
// 決定（js/game.js の isPlannedGradeTerm() / getTotalQuestionsForLevel()）・総復習の
// スコープ一覧（js/review-mode.js の getReviewScopeKeys()）だけを再利用のためexportして
// もらっており、実際のゲーム状態・DOM（#app配下）・音声・ハイスコア等には触れません。

import { getAllTemplates, TEMPLATE_SETS_BY_GRADE_TERM, getAvailableGradeTerms } from "../data/index.js";
import { categoryRegistry, getCategoriesForGradeTerm, getEnabledTrainingCategories } from "../data/category-registry.js";
import {
  validateTemplateSet,
  validateGeneratedQuestion,
  filterValidTemplateSets,
  validateCategoryRegistry,
  validateCategoryRegistryAgainstTemplates
} from "../js/question-validator.js";
import {
  generateQuestionFromTemplate,
  generateQuestion,
  setRandomSource,
  resetRandomSource,
  planQuestionSequence,
  planQuestionSequenceThreeGroup,
  getCandidateTemplatesForSlot
} from "../js/question-generator.js";
import * as multiStepEngine from "../js/multi-step-engine.js";
import { generateTrainingQuestions, validateTrainingSetGeneration } from "../js/training-mode.js";
import { initReview, generateReviewQuestions, getReviewScopeKeys, getReviewScopeLabel, getQuestionCountForScope } from "../js/review-mode.js";
import { isPlannedGradeTerm, getTotalQuestionsForLevel } from "../js/game.js";
import {
  renderValueHtml,
  renderTextPartsHtml,
  renderPercentConversionHtml,
  renderRelationTableHtml,
  escapeHtml
} from "../js/value-renderer.js";
import { isPercentValue, areValuesEqual } from "../js/value-utils.js";
import * as qr from "./quality-rules.js";

const { RULE, createSeededRng, buildQuestionSignature, buildFormulaSignature, extractDifficultySample, summarizeDifficultySamples, checkDifficultyWarnings, checkSetForDuplicatesAndStreaks, checkQuestionText, checkTextNumericCoincidence, checkQuantityRelation, checkCardStructure, checkSingleStepCardLeak, checkMultiStepCardLeak, checkMixedNumberConsistency, checkMixedNumberPatternClassification, runSelfTest } = qr;

// ============================================================
// 定数
// ============================================================

const DEFAULT_GENERATION_COUNT = 100;
const YIELD_EVERY_N_ITEMS = 15; // これだけ処理するごとに、ブラウザへ制御を戻す
const LEVELS = [1, 2, 3, 4, 5, 6]; // タイトル画面のレベルボタンと同じ固定範囲（レベルMAX=6）
const MOBILE_WIDTHS = [320, 375, 390, 768];
const MAX_MOBILE_TEMPLATES_TO_PREVIEW = 40; // プレビュー候補が多すぎて重くならないための上限

function yieldToBrowser() {
  if (typeof window.requestIdleCallback === "function") {
    return new Promise((resolve) => window.requestIdleCallback(() => resolve(), { timeout: 100 }));
  }
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

// ============================================================
// 実行制御（一時停止・再開・中止）
// ============================================================

const runControl = {
  aborted: false,
  paused: false,
  resumeWaiters: []
};

function resetRunControl() {
  runControl.aborted = false;
  runControl.paused = false;
  runControl.resumeWaiters = [];
}

async function checkPauseAndAbort() {
  while (runControl.paused && !runControl.aborted) {
    await new Promise((resolve) => runControl.resumeWaiters.push(resolve));
  }
  if (runControl.aborted) {
    throw new QualityCheckAborted();
  }
}

class QualityCheckAborted extends Error {}

// ============================================================
// テンプレート探索（対象範囲を data/index.js・category-registry.js から動的に取得する）
// ============================================================

/**
 * 登録されているすべてのテンプレートを、テンプレートIDで重複排除しつつ、
 * 「どのgradeTermキー・どのカテゴリから参照されているか」を集めて返します
 * （4-multi-stepと4-2の「整数の2段階文章題」のように、同じテンプレートが複数の
 * モード・カテゴリから参照されることがあるため）。
 */
function discoverTemplates() {
  const byId = new Map();
  for (const [gradeTermKey, templates] of Object.entries(TEMPLATE_SETS_BY_GRADE_TERM)) {
    for (const template of templates) {
      if (!byId.has(template.id)) {
        byId.set(template.id, { template, referencedByGradeTermKeys: new Set(), referencedByCategoryIds: new Set() });
      }
      const entry = byId.get(template.id);
      entry.referencedByGradeTermKeys.add(gradeTermKey);
      if (template.categoryId) entry.referencedByCategoryIds.add(template.categoryId);
    }
  }
  return [...byId.values()];
}

function stepCountOf(template) {
  if (template.questionType === "multiStep") return template.totalSteps || 2;
  return 1;
}

function valueTypeOf(template) {
  if (!template.variables) return "integer";
  const ranges = Object.values(template.variables);
  if (ranges.some((r) => r && r.type === "fraction")) return "fraction";
  if (ranges.some((r) => r && r.type === "percent")) return "percent";
  if (ranges.some((r) => r && r.decimalPlaces > 0)) return "decimal";
  return "integer";
}

// ============================================================
// 1テンプレートぶんの耐久テスト（標準: 100回）
// ============================================================

/**
 * 1つのテンプレートを count 回、シードを変えながら生成し、有効化されているチェックを
 * すべて実行します。1回のエラーで打ち切らず、残りの回も続けます。
 */
async function runTemplateEndurance(entry, count, baseSeed, enabledChecks, onProgress) {
  const template = entry.template;
  const findings = [];
  const difficultySamples = [];
  let successCount = 0;
  const routeIdsSeen = new Set();
  const unitsSeen = new Set();
  let longestText = "";
  let maxCardCount = 0;

  for (let i = 0; i < count; i++) {
    if (i % YIELD_EVERY_N_ITEMS === 0) {
      await checkPauseAndAbort();
      await yieldToBrowser();
      onProgress?.(i);
    }

    const seed = baseSeed + i;
    let problem = null;
    try {
      setRandomSource(createSeededRng(seed));
      problem = generateQuestionFromTemplate(template);
    } catch (error) {
      findings.push(makeFinding("error", RULE.GENERATION_EXCEPTION, template, i, seed, `生成中に例外が発生しました: ${error.message}`));
      continue;
    } finally {
      resetRandomSource();
    }

    let ok = true;

    if (enabledChecks.generatedQuestion) {
      const { valid, errors } = validateGeneratedQuestion(problem);
      if (!valid) {
        ok = false;
        for (const e of errors) {
          findings.push(makeFinding("error", RULE.GENERATED_QUESTION_INVALID, template, i, seed, e, problem));
        }
      }
    }

    if (problem.questionType === "multiStep" && enabledChecks.routeSimulation) {
      const sim = multiStepEngine.simulateAllRoutesToCompletion(problem);
      if (!sim.valid) {
        ok = false;
        for (const e of sim.errors) {
          findings.push(makeFinding("error", RULE.ROUTE_RESULT_MISMATCH, template, i, seed, e, problem));
        }
      }
      for (const route of problem.solutionRoutes || []) routeIdsSeen.add(route.id);
    }

    if (enabledChecks.generatedQuestion) {
      const leaks =
        problem.questionType === "multiStep" ? checkMultiStepCardLeak(problem, multiStepEngine) : checkSingleStepCardLeak(problem);
      for (const f of leaks) {
        findings.push(makeFinding("error", f.ruleId, template, i, seed, f.message, problem));
        ok = false;
      }
      const cardFindings = checkCardStructure(problem);
      for (const f of cardFindings) {
        findings.push(makeFinding("error", f.ruleId, template, i, seed, f.message, problem));
        ok = false;
      }
      // 帯分数テンプレート（fractionDisplayMode==="mixed"）のときだけ意味のあるチェック。
      // それ以外のテンプレートでは対象外の値が無いため、常に空配列を返す（第11段階で追加）。
      const mixedFindings = checkMixedNumberConsistency(problem);
      for (const f of mixedFindings) {
        findings.push(makeFinding("error", f.ruleId, template, i, seed, f.message, problem));
        ok = false;
      }
      const patternFindings = checkMixedNumberPatternClassification(problem);
      for (const f of patternFindings) {
        findings.push(makeFinding("warning", f.ruleId, template, i, seed, f.message, problem));
      }
    }

    if (enabledChecks.questionSetQuality) {
      const { errors: textErrors, warnings: textWarnings } = checkQuestionText(problem.text);
      for (const e of textErrors) {
        findings.push(makeFinding("error", e.ruleId, template, i, seed, e.message, problem));
        ok = false;
      }
      for (const w of textWarnings) {
        findings.push(makeFinding("warning", w.ruleId, template, i, seed, w.message, problem));
      }
      const coincidences = checkTextNumericCoincidence(problem);
      for (const c of coincidences) {
        findings.push(makeFinding("review", c.ruleId, template, i, seed, c.message, problem));
      }
      const qrFindings = checkQuantityRelation(problem);
      for (const f of qrFindings) {
        findings.push(makeFinding("error", f.ruleId, template, i, seed, f.message, problem));
        ok = false;
      }
    }

    if (ok) successCount++;
    if (typeof problem.text === "string" && problem.text.length > longestText.length) longestText = problem.text;
    if (Array.isArray(problem.choices)) maxCardCount = Math.max(maxCardCount, problem.choices.length);
    if (problem.answerUnit) unitsSeen.add(problem.answerUnit);

    if (enabledChecks.numericDifficulty) {
      difficultySamples.push(extractDifficultySample(problem));
    }
  }

  const stats = summarizeDifficultySamples(difficultySamples);
  const difficultyWarnings = enabledChecks.numericDifficulty ? checkDifficultyWarnings(stats, template.categoryId) : [];
  for (const w of difficultyWarnings) {
    findings.push(makeFinding("warning", w.ruleId, template, null, null, w.message));
  }

  return {
    templateId: template.id,
    category: template.category,
    categoryId: template.categoryId,
    gradeTerm: template.gradeTerm,
    stepCount: stepCountOf(template),
    valueType: valueTypeOf(template),
    referencedByGradeTermKeys: [...entry.referencedByGradeTermKeys],
    referencedByCategoryIds: [...entry.referencedByCategoryIds],
    generationCount: count,
    successCount,
    errorCount: findings.filter((f) => f.severity === "error").length,
    warningCount: findings.filter((f) => f.severity === "warning").length,
    reviewCount: findings.filter((f) => f.severity === "review").length,
    findings,
    stats,
    longestText,
    maxCardCount,
    routeIdsSeen: [...routeIdsSeen],
    unitsSeen: [...unitsSeen]
  };
}

function makeFinding(severity, ruleId, template, generationIndex, seed, message, problem) {
  return {
    severity,
    ruleId,
    gradeTerm: template.gradeTerm,
    categoryId: template.categoryId || null,
    category: template.category,
    templateId: template.id,
    generationIndex,
    seed,
    message,
    questionText: problem ? problem.text : null,
    sample: problem
      ? {
          questionText: problem.text,
          values: problem.values,
          expectedAnswer: problem.answer !== undefined ? problem.answer : problem.result
        }
      : null
  };
}

// ============================================================
// 構造検証（既存の validateTemplateSet / validateCategoryRegistry を再利用）
// ============================================================

function runStructuralValidation(templates) {
  const { results, valid, errors: setLevelErrors } = validateTemplateSet(templates);
  const findings = [];
  for (const r of results) {
    for (const e of r.errors) {
      findings.push({
        severity: "error",
        ruleId: RULE.TEMPLATE_STRUCTURAL_ERROR,
        gradeTerm: "-",
        categoryId: null,
        category: r.category,
        templateId: r.id,
        generationIndex: null,
        seed: null,
        message: e,
        questionText: null,
        sample: null
      });
    }
  }
  for (const e of setLevelErrors) {
    findings.push({
      severity: "error",
      ruleId: RULE.TEMPLATE_STRUCTURAL_ERROR,
      gradeTerm: "-",
      categoryId: null,
      category: "-",
      templateId: "-",
      generationIndex: null,
      seed: null,
      message: e,
      questionText: null,
      sample: null
    });
  }

  const registryResult = validateCategoryRegistry(categoryRegistry);
  const crossResult = validateCategoryRegistryAgainstTemplates(categoryRegistry, templates);
  for (const e of [...registryResult.errors, ...crossResult.errors]) {
    findings.push({
      severity: "error",
      ruleId: RULE.INVALID_CATEGORY_ID,
      gradeTerm: "-",
      categoryId: null,
      category: "カテゴリレジストリ",
      templateId: "-",
      generationIndex: null,
      seed: null,
      message: e,
      questionText: null,
      sample: null
    });
  }

  return { findings, valid: valid && registryResult.valid && crossResult.valid };
}

// ============================================================
// 通常バトルの出題セット検証（section 18）。既存の学期別出題ルール
// （js/question-generator.js の planQuestionSequence* / getCandidateTemplatesForSlot、
// js/game.js の isPlannedGradeTerm() / getTotalQuestionsForLevel()）をそのまま再利用し、
// このファイルでは「何を新内容・復習内容にするか」等のルールを再実装しません。
// ============================================================

function generateBattleQuestionSet(gradeTerm, level, filteredSets, rotationIndex) {
  const totalQuestions = getTotalQuestionsForLevel(level);
  let plan = null;
  if (gradeTerm === "6-3") {
    plan = planQuestionSequenceThreeGroup(totalQuestions, filteredSets, rotationIndex % 3);
  } else if (isPlannedGradeTerm(gradeTerm)) {
    plan = planQuestionSequence(totalQuestions, filteredSets, gradeTerm);
  }

  const questions = [];
  const usedTexts = new Set();
  const usedFormulas = new Set();
  let lastTemplateId = null;
  const MAX_ATTEMPTS = 12;

  for (let i = 0; i < totalQuestions; i++) {
    const candidateTemplates = plan ? getCandidateTemplatesForSlot(plan[i] || null, filteredSets, gradeTerm) : filteredSets[gradeTerm] || [];
    if (candidateTemplates.length === 0) {
      throw new Error(`スロット${i}の候補テンプレートがありません（gradeTerm=${gradeTerm}）`);
    }
    let problem = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      problem = generateQuestion(candidateTemplates, { excludeTemplateId: lastTemplateId });
      const formulaKey = problem.questionType === "singleStep" ? `${problem.left}${problem.operator}${problem.right}` : null;
      const isDup = usedTexts.has(problem.text) || (formulaKey && usedFormulas.has(formulaKey));
      if (!isDup) break;
    }
    usedTexts.add(problem.text);
    if (problem.questionType === "singleStep") {
      usedFormulas.add(`${problem.left}${problem.operator}${problem.right}`);
    }
    lastTemplateId = problem.templateId;
    questions.push(problem);
  }
  return questions;
}

async function runBattleSetValidation(config, allTemplates, onProgress) {
  const filteredSets = filterValidTemplateSets(TEMPLATE_SETS_BY_GRADE_TERM);
  const gradeTerms = Object.keys(filteredSets).filter((g) => (config.includeDevTemplates ? true : g !== "4-multi-step"));
  const findings = [];
  let setsChecked = 0;
  let rotationIndex = 0;

  for (const gradeTerm of gradeTerms) {
    for (const level of LEVELS) {
      for (let s = 0; s < config.setCount; s++) {
        if (s % YIELD_EVERY_N_ITEMS === 0) {
          await checkPauseAndAbort();
          await yieldToBrowser();
          onProgress?.(gradeTerm, level, s);
        }
        try {
          const questions = generateBattleQuestionSet(gradeTerm, level, filteredSets, rotationIndex++);
          const expectedCount = getTotalQuestionsForLevel(level);
          if (questions.length !== expectedCount) {
            findings.push({
              severity: "error",
              ruleId: RULE.SET_GENERATION_FAILED,
              gradeTerm,
              categoryId: null,
              category: `レベル${level}`,
              templateId: "-",
              generationIndex: s,
              seed: null,
              message: `必要な問題数(${expectedCount})と生成数(${questions.length})が一致しません。`,
              questionText: null,
              sample: null
            });
          }
          // 「対象範囲以外のテンプレートが混ざらないか」は、候補テンプレート自体を
          // planQuestionSequence*() / getCandidateTemplatesForSlot()（既存の学期別出題ルール、
          // ここではそのまま再利用しているだけ）から取得しているため、生成後に改めて
          // 出題範囲(gradeTerm)の一致だけで判定すると、新内容50%・復習内容50%という
          // 正しい設計（例: 4-3では4-1/4-2/4-multi-stepの復習内容が意図的に混ざる）を
          // 誤ってエラー扱いしてしまう。この検証はここでは行わない
          // （候補テンプレートの決定ロジック自体は既存関数に委ねるため）。
          const dupFindings = checkSetForDuplicatesAndStreaks(questions);
          for (const f of dupFindings) {
            findings.push({
              severity: f.severity,
              ruleId: f.ruleId,
              gradeTerm,
              categoryId: null,
              category: `レベル${level}`,
              templateId: "-",
              generationIndex: s,
              seed: null,
              message: f.message,
              questionText: null,
              sample: null
            });
          }
        } catch (error) {
          if (error instanceof QualityCheckAborted) throw error;
          findings.push({
            severity: "error",
            ruleId: RULE.SET_GENERATION_FAILED,
            gradeTerm,
            categoryId: null,
            category: `レベル${level}`,
            templateId: "-",
            generationIndex: s,
            seed: null,
            message: `出題セット生成中に例外が発生しました: ${error.message}`,
            questionText: null,
            sample: null
          });
        }
        setsChecked++;
      }
    }
  }

  return { findings, setsChecked };
}

// ============================================================
// トレーニングの出題セット検証（section 19）。既存の generateTrainingQuestions() /
// validateTrainingSetGeneration() をそのまま再利用します。
// ============================================================

async function runTrainingSetValidation(config, allTemplates, onProgress) {
  const validatedTemplates = Object.values(filterValidTemplateSets(TEMPLATE_SETS_BY_GRADE_TERM)).flat();
  const categories = getEnabledTrainingCategories();
  const findings = [];
  let setsChecked = 0;

  for (const category of categories) {
    await checkPauseAndAbort();
    await yieldToBrowser();
    onProgress?.(category.label);

    const poolSize = validatedTemplates.filter((t) => t.categoryId === category.id).length;
    const result = validateTrainingSetGeneration(category.id, validatedTemplates, config.setCount, 5);
    for (const e of result.errors) {
      findings.push({
        severity: "error",
        ruleId: RULE.SET_GENERATION_FAILED,
        gradeTerm: category.gradeTerm,
        categoryId: category.id,
        category: category.label,
        templateId: "-",
        generationIndex: null,
        seed: null,
        message: e,
        questionText: null,
        sample: null
      });
    }

    // さらに、式・数値レベルの連続チェックを何セットか実施する（重いため件数を抑える）。
    const streakSampleCount = Math.min(config.setCount, 20);
    for (let s = 0; s < streakSampleCount; s++) {
      try {
        const questions = generateTrainingQuestions(category.id, validatedTemplates, 5);
        const dupFindings = checkSetForDuplicatesAndStreaks(questions, { templatePoolSize: poolSize });
        for (const f of dupFindings) {
          findings.push({
            severity: f.severity,
            ruleId: f.ruleId,
            gradeTerm: category.gradeTerm,
            categoryId: category.id,
            category: category.label,
            templateId: "-",
            generationIndex: s,
            seed: null,
            message: f.message,
            questionText: null,
            sample: null
          });
        }
      } catch (error) {
        if (error instanceof QualityCheckAborted) throw error;
        findings.push({
          severity: "error",
          ruleId: RULE.SET_GENERATION_FAILED,
          gradeTerm: category.gradeTerm,
          categoryId: category.id,
          category: category.label,
          templateId: "-",
          generationIndex: s,
          seed: null,
          message: `生成中に例外が発生しました: ${error.message}`,
          questionText: null,
          sample: null
        });
      }
    }
    setsChecked += config.setCount;
  }

  return { findings, setsChecked };
}

// ============================================================
// 総復習の出題セット検証（section 20）。既存の generateReviewQuestions() /
// getReviewScopeKeys() をそのまま再利用します。initReview() はテンプレート一覧の
// キャッシュを設定するだけの純粋な処理で、プレイヤーの総復習の進行状態・保存データには
// 一切触れません。
// ============================================================

async function runReviewSetValidation(config, onProgress) {
  initReview(TEMPLATE_SETS_BY_GRADE_TERM);
  const scopes = getReviewScopeKeys();
  const findings = [];
  let setsChecked = 0;

  for (const scope of scopes) {
    const expectedCount = getQuestionCountForScope(scope);
    for (let s = 0; s < config.setCount; s++) {
      if (s % YIELD_EVERY_N_ITEMS === 0) {
        await checkPauseAndAbort();
        await yieldToBrowser();
        onProgress?.(getReviewScopeLabel(scope), s);
      }
      try {
        const questions = generateReviewQuestions(scope);
        if (questions.length !== expectedCount) {
          findings.push({
            severity: "error",
            ruleId: RULE.SET_GENERATION_FAILED,
            gradeTerm: scope,
            categoryId: null,
            category: getReviewScopeLabel(scope),
            templateId: "-",
            generationIndex: s,
            seed: null,
            message: `カテゴリ数(${expectedCount})と生成された問題数(${questions.length})が一致しません。`,
            questionText: null,
            sample: null
          });
        }
        const categoryIds = questions.map((q) => q.template && q.template.categoryId).filter(Boolean);
        if (new Set(categoryIds).size !== categoryIds.length) {
          findings.push({
            severity: "error",
            ruleId: RULE.SET_COMPOSITION_MISMATCH,
            gradeTerm: scope,
            categoryId: null,
            category: getReviewScopeLabel(scope),
            templateId: "-",
            generationIndex: s,
            seed: null,
            message: "同じカテゴリが重複して出題されています。",
            questionText: null,
            sample: null
          });
        }
        const dupFindings = checkSetForDuplicatesAndStreaks(questions);
        for (const f of dupFindings.filter((x) => x.ruleId === RULE.DUPLICATE_QUESTION_IN_SET)) {
          findings.push({
            severity: f.severity,
            ruleId: f.ruleId,
            gradeTerm: scope,
            categoryId: null,
            category: getReviewScopeLabel(scope),
            templateId: "-",
            generationIndex: s,
            seed: null,
            message: f.message,
            questionText: null,
            sample: null
          });
        }
      } catch (error) {
        if (error instanceof QualityCheckAborted) throw error;
        findings.push({
          severity: "error",
          ruleId: RULE.SET_GENERATION_FAILED,
          gradeTerm: scope,
          categoryId: null,
          category: getReviewScopeLabel(scope),
          templateId: "-",
          generationIndex: s,
          seed: null,
          message: `生成中に例外が発生しました: ${error.message}`,
          questionText: null,
          sample: null
        });
      }
      setsChecked++;
    }
  }

  return { findings, setsChecked };
}

// ============================================================
// 1〜3段階問題の回帰テスト（ミス・時間切れシミュレーション、section 17）。
// multi-step-engine.js の submitStepAnswer() / recordTimeout() をそのまま再利用します。
// ゲーム本体のスコア・保存データには一切触れない、生成したその場限りの複製を使います。
// ============================================================

async function runMultiStepRegression(entry, count, baseSeed, onProgress) {
  const template = entry.template;
  if (template.questionType !== "multiStep") return { findings: [], checkedCount: 0 };
  const findings = [];
  let checkedCount = 0;
  const sampleCount = Math.min(count, 10); // 重いシミュレーションのため、テンプレートあたりの回数は抑える

  for (let i = 0; i < sampleCount; i++) {
    if (i % 5 === 0) {
      await checkPauseAndAbort();
      await yieldToBrowser();
      onProgress?.(i);
    }
    const seed = baseSeed + 500000 + i;
    let problem;
    try {
      setRandomSource(createSeededRng(seed));
      problem = generateQuestionFromTemplate(template);
    } catch (error) {
      continue;
    } finally {
      resetRandomSource();
    }

    const totalSteps = problem.multiStep.totalSteps;
    const primaryRoute = problem.solutionRoutes[0];

    // 各ステップで1回だけ、わざと不正解→同じ段階を維持しているかを確認する。
    for (let step = 0; step < totalSteps; step++) {
      const before = { ...multiStepEngine.getDebugSnapshot(problem) };
      const wrongLeft = typeof primaryRoute.steps[step].left === "number" ? primaryRoute.steps[step].left + 9999 : primaryRoute.steps[step].left;
      const outcome = multiStepEngine.submitStepAnswer(problem, wrongLeft, primaryRoute.steps[step].operator, primaryRoute.steps[step].right);
      if (outcome.correct) {
        // 万一「間違った値」がたまたま別の候補ルートで正解になってしまう場合はスキップ
        // （検証の前提が崩れるため、誤検出を避ける）。
        continue;
      }
      const after = multiStepEngine.getDebugSnapshot(problem);
      if (after.currentStepIndex !== before.currentStepIndex) {
        findings.push(
          makeFinding(
            "error",
            RULE.MULTI_STEP_REGRESSION,
            template,
            i,
            seed,
            `式${step + 1}で不正解にしたのに、段階(currentStepIndex)が変化しました: ${before.currentStepIndex} → ${after.currentStepIndex}`,
            problem
          )
        );
      }
      if (JSON.stringify(after.intermediateResults) !== JSON.stringify(before.intermediateResults)) {
        findings.push(
          makeFinding(
            "error",
            RULE.MULTI_STEP_REGRESSION,
            template,
            i,
            seed,
            `式${step + 1}で不正解にしたのに、保存済み中間結果が変化しました。`,
            problem
          )
        );
      }
      checkedCount++;
    }

    // 時間切れシミュレーション（1問につき1回、最初の未完了段階で）。
    try {
      const snapshotBefore = multiStepEngine.getDebugSnapshot(problem);
      multiStepEngine.recordTimeout(problem, null);
      const snapshotAfter = multiStepEngine.getDebugSnapshot(problem);
      if (snapshotAfter.currentStepIndex !== snapshotBefore.currentStepIndex) {
        findings.push(
          makeFinding(
            "error",
            RULE.MULTI_STEP_REGRESSION,
            template,
            i,
            seed,
            `時間切れにしたのに、段階(currentStepIndex)が変化しました: ${snapshotBefore.currentStepIndex} → ${snapshotAfter.currentStepIndex}`,
            problem
          )
        );
      }
      checkedCount++;
    } catch (error) {
      // recordTimeout がこのテンプレートの構造に対応していない場合はスキップ（回帰確認の対象外）。
    }
  }

  return { findings, checkedCount };
}

// ============================================================
// メイン実行
// ============================================================

/**
 * 全範囲品質確認を実行します。
 * @param {object} config - 検証設定（tools/quality-check.html のUIから組み立てる）
 * @param {object} callbacks - { onProgress, onTemplateDone }
 * @returns {object} 集計結果
 */
export async function runQualityCheck(config, callbacks = {}) {
  resetRunControl();
  const startedAt = Date.now();
  const allTemplates = getAllTemplates();
  const discovered = discoverTemplates();

  const targetEntries = discovered.filter((entry) => {
    const t = entry.template;
    if (!config.includeDevTemplates && t.gradeTerm === "4-multi-step") return false;
    if (config.gradeTerm && config.gradeTerm !== "all" && t.gradeTerm !== config.gradeTerm) return false;
    if (config.categoryId && config.categoryId !== "all" && t.categoryId !== config.categoryId) return false;
    if (config.templateId && config.templateId.trim() !== "") {
      return t.id.toLowerCase().includes(config.templateId.trim().toLowerCase());
    }
    return true;
  });

  const structural = runStructuralValidation(allTemplates);

  const templateResults = [];
  let totalGenerations = 0;
  let templateIndex = 0;

  try {
    for (const entry of targetEntries) {
      templateIndex++;
      const baseSeed = config.baseSeed + templateIndex * 100000;
      const result = await runTemplateEndurance(entry, config.generationCount, baseSeed, config.checks, (i) => {
        callbacks.onProgress?.({
          phase: "templates",
          templateIndex,
          templateCount: targetEntries.length,
          currentTemplateId: entry.template.id,
          currentGradeTerm: entry.template.gradeTerm,
          currentCategory: entry.template.category,
          currentGenerationIndex: i,
          generationCount: config.generationCount,
          elapsedMs: Date.now() - startedAt
        });
      });

      if (config.checks.multiStepRegression && entry.template.questionType === "multiStep") {
        const regression = await runMultiStepRegression(entry, config.generationCount, baseSeed, () => {
          callbacks.onProgress?.({
            phase: "regression",
            templateIndex,
            templateCount: targetEntries.length,
            currentTemplateId: entry.template.id,
            elapsedMs: Date.now() - startedAt
          });
        });
        result.findings.push(...regression.findings);
        result.errorCount += regression.findings.filter((f) => f.severity === "error").length;
      }

      templateResults.push(result);
      totalGenerations += result.generationCount;
      callbacks.onTemplateDone?.(result);
    }

    let battleSetResult = { findings: [], setsChecked: 0 };
    if (config.checks.battleSet) {
      battleSetResult = await runBattleSetValidation(config, allTemplates, (gradeTerm, level, s) => {
        callbacks.onProgress?.({ phase: "battleSet", currentGradeTerm: gradeTerm, currentLevel: level, currentSetIndex: s, elapsedMs: Date.now() - startedAt });
      });
    }

    let trainingSetResult = { findings: [], setsChecked: 0 };
    if (config.checks.trainingSet) {
      trainingSetResult = await runTrainingSetValidation(config, allTemplates, (categoryLabel) => {
        callbacks.onProgress?.({ phase: "trainingSet", currentCategory: categoryLabel, elapsedMs: Date.now() - startedAt });
      });
    }

    let reviewSetResult = { findings: [], setsChecked: 0 };
    if (config.checks.reviewSet) {
      reviewSetResult = await runReviewSetValidation(config, (scopeLabel, s) => {
        callbacks.onProgress?.({ phase: "reviewSet", currentCategory: scopeLabel, currentSetIndex: s, elapsedMs: Date.now() - startedAt });
      });
    }

    return finalizeResults({
      startedAt,
      structural,
      templateResults,
      battleSetResult,
      trainingSetResult,
      reviewSetResult,
      totalGenerations,
      aborted: false
    });
  } catch (error) {
    if (error instanceof QualityCheckAborted) {
      return finalizeResults({
        startedAt,
        structural,
        templateResults,
        battleSetResult: { findings: [], setsChecked: 0 },
        trainingSetResult: { findings: [], setsChecked: 0 },
        reviewSetResult: { findings: [], setsChecked: 0 },
        totalGenerations,
        aborted: true
      });
    }
    throw error;
  }
}

export function pauseQualityCheck() {
  runControl.paused = true;
}

export function resumeQualityCheck() {
  runControl.paused = false;
  const waiters = runControl.resumeWaiters.splice(0);
  waiters.forEach((resolve) => resolve());
}

export function abortQualityCheck() {
  runControl.aborted = true;
  resumeQualityCheck();
}

function finalizeResults({ startedAt, structural, templateResults, battleSetResult, trainingSetResult, reviewSetResult, totalGenerations, aborted }) {
  const allFindings = [
    ...structural.findings,
    ...templateResults.flatMap((r) => r.findings),
    ...battleSetResult.findings,
    ...trainingSetResult.findings,
    ...reviewSetResult.findings
  ];

  const errorCount = allFindings.filter((f) => f.severity === "error").length;
  const warningCount = allFindings.filter((f) => f.severity === "warning").length;
  const reviewCount = allFindings.filter((f) => f.severity === "review").length;

  const byGradeTerm = {};
  const byCategory = {};
  const byRule = {};
  const byStepCount = {};
  const byValueType = {};

  function bump(map, key, severity) {
    if (!key) return;
    if (!map[key]) map[key] = { error: 0, warning: 0, review: 0, total: 0 };
    map[key][severity] = (map[key][severity] || 0) + 1;
    map[key].total++;
  }

  for (const f of allFindings) {
    bump(byGradeTerm, f.gradeTerm, f.severity);
    bump(byCategory, f.category, f.severity);
    bump(byRule, f.ruleId, f.severity);
  }
  for (const r of templateResults) {
    bump(byStepCount, `${r.stepCount}段階`, "total");
    bump(byValueType, r.valueType, "total");
  }

  return {
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startedAt,
    aborted,
    templateCount: templateResults.length,
    totalGenerations,
    errorCount,
    warningCount,
    reviewCount,
    gradeTermCount: new Set(templateResults.map((r) => r.gradeTerm)).size,
    categoryCount: new Set(templateResults.map((r) => r.categoryId).filter(Boolean)).size,
    battleSetsChecked: battleSetResult.setsChecked,
    trainingSetsChecked: trainingSetResult.setsChecked,
    reviewSetsChecked: reviewSetResult.setsChecked,
    findings: allFindings,
    templateResults,
    breakdown: { byGradeTerm, byCategory, byRule, byStepCount, byValueType }
  };
}

// ============================================================
// 再現（同じテンプレート・同じシードで1問だけ生成し直す）
// ============================================================

export function reproduceQuestion(templateId, seed) {
  const template = getAllTemplates().find((t) => t.id === templateId);
  if (!template) return null;
  setRandomSource(createSeededRng(seed));
  try {
    return generateQuestionFromTemplate(template);
  } finally {
    resetRandomSource();
  }
}

// ============================================================
// 自己診断（意図的な不正データが、正しいルールIDで検出されるか）
// ============================================================

export function runQualitySelfTest() {
  return runSelfTest({ validateTemplateSet, validateCategoryRegistryAgainstTemplates, categoryRegistry, validateGeneratedQuestion });
}

// ============================================================
// レポート出力（JSON / CSV）
// ============================================================

export function buildJsonReport(config, result) {
  return {
    generatedAt: result.generatedAt,
    config,
    summary: {
      templateCount: result.templateCount,
      totalGenerations: result.totalGenerations,
      errorCount: result.errorCount,
      warningCount: result.warningCount,
      reviewCount: result.reviewCount,
      gradeTermCount: result.gradeTermCount,
      categoryCount: result.categoryCount,
      elapsedMs: result.elapsedMs,
      aborted: result.aborted
    },
    breakdown: result.breakdown,
    findings: result.findings,
    templateResults: result.templateResults.map((r) => ({
      templateId: r.templateId,
      category: r.category,
      categoryId: r.categoryId,
      gradeTerm: r.gradeTerm,
      stepCount: r.stepCount,
      valueType: r.valueType,
      referencedByGradeTermKeys: r.referencedByGradeTermKeys,
      referencedByCategoryIds: r.referencedByCategoryIds,
      generationCount: r.generationCount,
      successCount: r.successCount,
      errorCount: r.errorCount,
      warningCount: r.warningCount,
      reviewCount: r.reviewCount,
      stats: r.stats
    }))
  };
}

function csvEscape(value) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsvReport(result) {
  const columns = ["severity", "ruleId", "gradeTerm", "categoryId", "templateId", "generationIndex", "seed", "message", "questionText"];
  const lines = [columns.join(",")];
  for (const f of result.findings) {
    lines.push(columns.map((c) => csvEscape(f[c])).join(","));
  }
  return lines.join("\n");
}

export function buildErrorsOnlyText(result) {
  return result.findings
    .filter((f) => f.severity === "error")
    .map((f) => `[${f.ruleId}] ${f.templateId} (seed:${f.seed ?? "-"}, index:${f.generationIndex ?? "-"}): ${f.message}`)
    .join("\n");
}

// ============================================================
// スマートフォン表示プレビュー用の代表問題抽出（section 27）
// ============================================================

export function pickRepresentativeProblems(templateResults, maxPerTemplate = 5) {
  const picks = [];
  for (const r of templateResults.slice(0, MAX_MOBILE_TEMPLATES_TO_PREVIEW)) {
    if (!r.stats) continue;
    picks.push({ templateId: r.templateId, category: r.category, reason: "テンプレート統計あり（代表としてシード0番から再生成）", seedHint: 0 });
  }
  return picks.slice(0, maxPerTemplate * MAX_MOBILE_TEMPLATES_TO_PREVIEW);
}

/**
 * 問題を、実際のゲームと同じ value-renderer.js を使ってプレビュー用HTMLへ整形します
 * （品質確認ページ専用の見た目を再実装しない）。
 */
export function formatProblemForPreview(problem) {
  const textHtml = problem.textParts ? renderTextPartsHtml(problem.textParts) : escapeHtml(problem.text);
  const relationTableHtml = problem.relationTable ? renderRelationTableHtml(problem.relationTable) : null;

  if (problem.questionType === "multiStep") {
    const routesHtml = (problem.solutionRoutes || [])
      .map((route) => {
        const stepsHtml = route.steps
          .map((s, i) => `式${i + 1}: ${renderValueHtml(s.left)}${s.operator}${renderValueHtml(s.right)}=${renderValueHtml(s.result)}`)
          .join(" / ");
        return `<div>[${escapeHtml(route.id)}] ${stepsHtml}</div>`;
      })
      .join("");
    return { textHtml, relationTableHtml, formulaHtml: routesHtml, resultHtml: renderValueHtml(problem.answer), unit: problem.answerUnit };
  }

  const resultIsPercent = isPercentValue(problem.result);
  return {
    textHtml,
    relationTableHtml,
    formulaHtml: `${renderValueHtml(problem.left)}${problem.operator}${renderValueHtml(problem.right)}`,
    resultHtml: resultIsPercent ? renderPercentConversionHtml(problem.result) : renderValueHtml(problem.result),
    unit: resultIsPercent ? "" : problem.answerUnit
  };
}

export { discoverTemplates, getAvailableGradeTerms, getCategoriesForGradeTerm, MOBILE_WIDTHS, DEFAULT_GENERATION_COUNT };
