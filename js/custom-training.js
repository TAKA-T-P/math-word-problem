// カスタムトレーニング（複数カテゴリ・5〜50問を自由に設定できるトレーニングのバリエーション。
// 運用開始後に追加）専用の、設定状態・カテゴリ巡回順生成・問題セット生成・設定検証を担当する
// モジュールです。
//
// ゲーム進行（問題の表示・正誤判定・2〜3段階問題の進行・履歴・結果画面遷移）は複製せず、
// 既存の js/training-mode.js の trainingState / beginTrainingQuestion() 等をそのまま
// 再利用します（このファイルは「カスタム専用の別ゲームエンジン」ではありません）。
// js/question-generator.js の generateQuestion()（テンプレート抽出・生成直後の検証・
// 不正テンプレートの除外を内包）もそのまま使い、カード生成・正誤判定はここでは扱いません。

import { generateQuestion, shuffleArray } from "./question-generator.js";
import { valueKey } from "./value-utils.js";
import { getEnabledTrainingCategories } from "../data/category-registry.js";
import { loadCustomTrainingCategoryIds, saveCustomTrainingCategoryIds, clearCustomTrainingCategoryIds } from "./storage.js";

export const MIN_CUSTOM_TRAINING_QUESTIONS = 5;
export const MAX_CUSTOM_TRAINING_QUESTIONS = 50;
export const DEFAULT_CUSTOM_TRAINING_QUESTIONS = 5;

/**
 * 問題数を 5〜50 の整数へ補正します。DOMが改変された場合（範囲外・整数でない値等）でも、
 * 開始時にここを必ず通すことで安全な値にします。
 */
export function clampCustomTrainingQuestionCount(value) {
  const rounded = Math.round(Number(value));
  if (!Number.isFinite(rounded)) return DEFAULT_CUSTOM_TRAINING_QUESTIONS;
  return Math.min(MAX_CUSTOM_TRAINING_QUESTIONS, Math.max(MIN_CUSTOM_TRAINING_QUESTIONS, rounded));
}

/**
 * 保存されたカテゴリID一覧を、現在のカテゴリレジストリと照合して安全な状態にします。
 *   - 文字列以外・空文字列を除去する
 *   - 重複を除去する（先に登場したものを残す）
 *   - 現在のレジストリに存在しないIDを除去する
 *   - enabledInTraining が false のカテゴリを除去する（getEnabledTrainingCategories() が
 *     すでに enabledInTraining=true のものだけを返すため、availableCategories に
 *     この関数を渡すだけで自動的に満たされる）
 * 壊れた入力（配列でない等）でも例外を投げず、空配列を返します。
 */
export function sanitizeCustomTrainingCategoryIds(savedIds, availableCategories) {
  if (!Array.isArray(savedIds) || !Array.isArray(availableCategories)) return [];
  const validIds = new Set(availableCategories.map((c) => c.id));
  const seen = new Set();
  const result = [];
  for (const id of savedIds) {
    if (typeof id !== "string" || id.length === 0) continue;
    if (!validIds.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

/**
 * localStorageに保存されているカスタムトレーニングのカテゴリ選択を、現在のレジストリと
 * 照合したうえで読み込みます（js/storage.js の loadCustomTrainingCategoryIds() は
 * 「文字列の配列である」ことまでしか検証しないため、ここでさらに存在確認・重複除去を行います）。
 */
export function loadSanitizedCustomTrainingCategoryIds() {
  return sanitizeCustomTrainingCategoryIds(loadCustomTrainingCategoryIds(), getEnabledTrainingCategories());
}

export { saveCustomTrainingCategoryIds, clearCustomTrainingCategoryIds };

/**
 * 選択されたカテゴリを、questionCount問ぶん均等に巡回する出題順（categoryIdの配列）を作ります。
 *   - 1周につき、選択カテゴリを1回ずつランダムな順序で並べる
 *   - 問題数がカテゴリ数で割り切れない場合、最後の端数は「新しくシャッフルした1周分の先頭から
 *     必要数だけ取る」ことで、重複の無い異なるカテゴリの組み合わせになる
 *   - 選択カテゴリが2つ以上のとき、周回の境目（前の周の最後と次の周の最初）で同じカテゴリが
 *     連続しないよう、次の周の最初が前の周の最後と同じ場合は入れ替える
 *   - 選択カテゴリが1つだけの場合は、常にそのカテゴリのまま返す（連続防止の対象外）
 * js/question-generator.js の shuffleArray() をそのまま再利用します。
 */
export function buildCustomTrainingCategorySequence(selectedCategoryIds, questionCount) {
  if (!Array.isArray(selectedCategoryIds) || selectedCategoryIds.length === 0 || questionCount <= 0) {
    return [];
  }

  const sequence = [];
  let previousCategoryId = null;

  while (sequence.length < questionCount) {
    const cycle = shuffleArray(selectedCategoryIds);

    if (selectedCategoryIds.length > 1 && cycle[0] === previousCategoryId) {
      const swapIndex = cycle.findIndex((id) => id !== previousCategoryId);
      if (swapIndex > 0) {
        [cycle[0], cycle[swapIndex]] = [cycle[swapIndex], cycle[0]];
      }
    }

    const remaining = questionCount - sequence.length;
    const takeCount = Math.min(remaining, cycle.length);
    sequence.push(...cycle.slice(0, takeCount));
    previousCategoryId = sequence[sequence.length - 1];
  }

  return sequence;
}

/**
 * 単一段階問題について、値・演算子まで含めた重複判定キーを作ります
 * （js/training-mode.js の buildFormulaDupKey() と同じ考え方の、この用途専用の複製。
 * 分数・小数でも正しく重複判定できるよう value-utils.js の valueKey() を使う）。
 */
function buildFormulaDupKey(problem) {
  if (problem.questionType !== "singleStep") return null;
  return `${valueKey(problem.left)}${problem.operator}${valueKey(problem.right)}`;
}

// 1問あたりの重複回避の再抽選回数の上限。無限ループを避けるための安全弁で、
// これだけ試しても新しい組み合わせが見つからない場合は、諦めてそのまま採用する。
const MAX_CUSTOM_DUP_AVOIDANCE_ATTEMPTS = 20;

/**
 * 選択カテゴリ・出題順に従って、ちょうど questionCount 問を生成します。
 *   - buildCustomTrainingCategorySequence() で作った出題順の、各スロットのcategoryIdから
 *     1問ずつ generateQuestion()（テンプレート抽出・生成直後の検証を内包）で生成する
 *   - 問題文・式ができるだけ重複しないよう、既存の generateTrainingQuestions() と同じ考え方で
 *     再抽選する（カスタムトレーニング全体を通して重複を確認する）
 *   - 同じカテゴリが2周目以降に登場するときは、そのカテゴリで未使用のテンプレートを優先する
 *     （テンプレートを使い切った場合は、同じテンプレートの再利用を許可する＝数値は変わる）
 * @param {string[]} selectedCategoryIds
 * @param {Array} templates - filterValidTemplateSets() 済みのテンプレート一覧全体
 * @param {number} questionCount
 * @returns {Array} 生成された問題の配列（必ず questionCount 件）
 */
export function generateCustomTrainingQuestions(selectedCategoryIds, templates, questionCount) {
  const sequence = buildCustomTrainingCategorySequence(selectedCategoryIds, questionCount);
  const questions = [];
  const usedTexts = new Set();
  const usedFormulaKeys = new Set();
  const usedTemplateIdsByCategory = new Map();
  let lastTemplateId = null;

  for (const categoryId of sequence) {
    const fullPool = templates.filter((t) => t.categoryId === categoryId);
    if (fullPool.length === 0) {
      throw new Error(`カテゴリ "${categoryId}" に対応するテンプレートがありません。`);
    }

    const usedIds = usedTemplateIdsByCategory.get(categoryId) || new Set();
    const freshPool = fullPool.filter((t) => !usedIds.has(t.id));
    const pool = freshPool.length > 0 ? freshPool : fullPool;

    let problem = null;
    for (let attempt = 0; attempt < MAX_CUSTOM_DUP_AVOIDANCE_ATTEMPTS; attempt++) {
      problem = generateQuestion(pool, { excludeTemplateId: lastTemplateId });
      const formulaKey = buildFormulaDupKey(problem);
      const isDuplicate = usedTexts.has(problem.text) || (formulaKey !== null && usedFormulaKeys.has(formulaKey));
      if (!isDuplicate) break;
    }

    usedTexts.add(problem.text);
    const formulaKey = buildFormulaDupKey(problem);
    if (formulaKey !== null) {
      usedFormulaKeys.add(formulaKey);
    }
    usedIds.add(problem.templateId);
    usedTemplateIdsByCategory.set(categoryId, usedIds);
    lastTemplateId = problem.templateId;
    questions.push(problem);
  }

  return questions;
}

/**
 * 開発者用の検証ページ（tools/question-validator.html・tools/quality-check.html）専用。
 * 指定した設定で generateCustomTrainingQuestions() を繰り返し実行し、
 *   - 指定問題数どおり生成されるか
 *   - 選択カテゴリ以外が混ざらないか
 *   - カテゴリ別の出題数の差が最大1問に収まっているか
 *   - 例外が発生しないか
 *   - 選択肢カードが8枚を超えていないか
 * を検証します。通常プレイからは呼び出しません。
 * @returns {{valid: boolean, errors: string[], attempts: number, successfulRuns: number}}
 */
export function validateCustomTrainingSetGeneration(
  selectedCategoryIds,
  templates,
  attempts = 20,
  questionCount = DEFAULT_CUSTOM_TRAINING_QUESTIONS
) {
  const errors = [];
  let successfulRuns = 0;

  for (let run = 0; run < attempts; run++) {
    try {
      const questions = generateCustomTrainingQuestions(selectedCategoryIds, templates, questionCount);
      let runOk = true;

      if (questions.length !== questionCount) {
        errors.push(`run${run}: 生成された問題数が${questionCount}問ではありません（${questions.length}問）`);
        runOk = false;
      }

      const wrongCategory = questions.filter(
        (q) => !q.template || !selectedCategoryIds.includes(q.template.categoryId)
      );
      if (wrongCategory.length > 0) {
        errors.push(`run${run}: 選択していないカテゴリの問題が混ざっています: ${wrongCategory.map((q) => q.templateId).join(", ")}`);
        runOk = false;
      }

      const countsByCategory = new Map();
      for (const q of questions) {
        const id = q.template ? q.template.categoryId : null;
        if (id) countsByCategory.set(id, (countsByCategory.get(id) || 0) + 1);
      }
      const counts = selectedCategoryIds.map((id) => countsByCategory.get(id) || 0);
      if (counts.length > 0 && Math.max(...counts) - Math.min(...counts) > 1) {
        errors.push(`run${run}: カテゴリ別の出題数の差が2問以上あります: ${JSON.stringify(Object.fromEntries(countsByCategory))}`);
        runOk = false;
      }

      const texts = questions.map((q) => q.text);
      const duplicateTextCount = texts.length - new Set(texts).size;
      if (duplicateTextCount > 0) {
        errors.push(`run${run}: 問題文が完全に重複しています（${duplicateTextCount}件）`);
      }

      for (const q of questions) {
        if (!Array.isArray(q.choices) || q.choices.length > 8) {
          errors.push(`run${run}: 選択肢カードが不正です（${q.templateId}）`);
          runOk = false;
        }
      }

      if (runOk) {
        successfulRuns += 1;
      }
    } catch (error) {
      errors.push(`run${run}: 生成中に例外が発生しました: ${error.message}`);
    }
  }

  return { valid: errors.length === 0, errors, attempts, successfulRuns };
}
