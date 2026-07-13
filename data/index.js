// 問題データの読み込みを一元化するレジストリ。
// ゲーム本体（js/*.js）は、data/grade4-term1.js のような個別ファイルを
// 直接 import せず、必ずこのファイル経由でテンプレートを取得してください。
//
// 新しい学期の問題データを追加する手順:
//   1. data/ に新しいファイルを追加する（例: data/grade4-term2.js）。
//      形式は data/grade4-term1.js を参考にしてください（共通スキーマに従うこと）。
//   2. このファイルの先頭で import する。
//   3. TEMPLATE_SETS_BY_GRADE_TERM に1行追加する。
//   4. index.html の出題範囲ボタン（#range-select）の該当ボタンから
//      disabled を外し、data-range 属性を設定する。
// これ以外の js/game.js・js/ui.js・js/question-generator.js 等の
// ゲーム本体ファイルは修正不要です。

import { grade4Term1Templates } from "./grade4-term1.js";
// 整数のみの2段階（2つの式で解く）問題。開発版モード（?debug=true でタイトル画面に表示される
// 「2段階問題・整数（開発版）」）専用のキー "4-multi-step" として登録する一方、
// 小学4年生2学期モード（"4-2"）の「2段階文章題」カテゴリからも
// js/question-generator.js の buildNewContentCategoryGroups() 経由で再利用されます
// （同じテンプレートを複製せず、1つのデータを2つの文脈で使い回しています）。
import { multiStepIntegerTemplates } from "./multi-step-integer.js";
// 小学4年生・2学期の新内容（小数のたし算・ひき算、大きな数、2けたでわるわり算）。
import { grade4Term2Templates } from "./grade4-term2.js";
// 小学4年生・3学期の新内容（小数×整数、小数÷整数、同分母分数のたし算・ひき算）。
import { grade4Term3Templates } from "./grade4-term3.js";

// 将来追加する学期データは、ここに import 文を追加していきます。
// import { grade5Term1Templates } from "./grade5-term1.js";
// import { grade5Term2Templates } from "./grade5-term2.js";
// import { grade5Term3Templates } from "./grade5-term3.js";
// import { grade6Term1Templates } from "./grade6-term1.js";
// import { grade6Term2Templates } from "./grade6-term2.js";
// import { grade6Term3Templates } from "./grade6-term3.js";

/**
 * 出題範囲キー（gradeTerm）ごとの問題テンプレート一覧。
 * キーは各テンプレートの gradeTerm フィールドと一致させてください。
 *
 * "4-multi-step" は開発版専用キーです。js/ui.js が ?debug=true のときだけ
 * タイトル画面にこのキーを選択するボタンを動的に追加するため、
 * 通常アクセスではプレイヤーが選択する手段がありません。
 */
export const TEMPLATE_SETS_BY_GRADE_TERM = {
  "4-1": grade4Term1Templates,
  "4-2": grade4Term2Templates,
  "4-3": grade4Term3Templates,
  "4-multi-step": multiStepIntegerTemplates
  // "5-1": grade5Term1Templates,
  // "5-2": grade5Term2Templates,
  // "5-3": grade5Term3Templates,
  // "6-1": grade6Term1Templates,
  // "6-2": grade6Term2Templates,
  // "6-3": grade6Term3Templates
};

/**
 * 指定した出題範囲（gradeTerm）のテンプレート一覧を取得します。
 * 存在しない場合は空配列を返します。
 */
export function getTemplatesForGradeTerm(gradeTerm) {
  return TEMPLATE_SETS_BY_GRADE_TERM[gradeTerm] || [];
}

/**
 * 登録されているすべての出題範囲キーを取得します。
 */
export function getAvailableGradeTerms() {
  return Object.keys(TEMPLATE_SETS_BY_GRADE_TERM);
}

/**
 * 登録されているすべてのテンプレートを1つの配列にまとめて取得します。
 * 開発者用の検証ページ（tools/question-validator.html）などで使用します。
 */
export function getAllTemplates() {
  return Object.values(TEMPLATE_SETS_BY_GRADE_TERM).flat();
}
