// ヒント機能の解決ロジックを一元化するモジュール（運用開始後に追加）。
// js/game.js・js/training-mode.js・js/review-mode.js・js/example-viewer.js は、
// この3つの関数だけを使ってヒントを扱い、判定・使用回数のロジックを複製しない。
//
// problem.hintState = { used: false, visible: false }（js/question-generator.js が
// 問題生成時に必ず付与する）を、このファイルだけが読み書きする想定。

import { resolveHintText } from "../data/learning-support.js";

/**
 * ヒント表示に使う「現在のステップ番号」（0始まり）を求めます。
 * 1段階問題は常に0、多段階問題は multi-step-engine.js が管理する
 * problem.multiStep.currentStepIndex をそのまま使います。
 */
export function getCurrentStepIndexForHint(problem) {
  if (problem.questionType === "multiStep" && problem.multiStep) {
    return problem.multiStep.currentStepIndex;
  }
  return 0;
}

/**
 * 今の問題・今のステップに対応するヒント文を1件返します（表示用の薄いラッパー）。
 */
export function getHintTextForProblem(problem) {
  const currentStepIndex = getCurrentStepIndexForHint(problem);
  const templateHintSteps = (problem.template && problem.template.hintSteps) || null;
  const categoryId = (problem.template && problem.template.categoryId) || null;
  return resolveHintText({ categoryId, templateHintSteps, currentStepIndex });
}

/**
 * 今の問題で、ヒントを初めて使ったかどうかを判定し、初めてならその問題を使用済みにします。
 * @returns {boolean} 初めての使用なら true（呼び出し側は残り回数を1減らす）、
 *   既に使用済みなら false（残り回数はそのまま）。
 */
export function markHintUsedIfFirstTime(problem) {
  if (!problem.hintState) {
    problem.hintState = { used: false, visible: false };
  }
  if (problem.hintState.used) {
    return false;
  }
  problem.hintState.used = true;
  return true;
}
