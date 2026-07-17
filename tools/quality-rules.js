// 全範囲品質確認ツール（tools/quality-check.html / tools/quality-check.js）専用の、
// 純粋なルール・シグネチャ・統計ロジックをまとめたモジュールです。
//
// このファイルは開発者用ツールでのみ import され、ゲーム本体（js/*.js）からは
// 一切参照しません。DOM を必要としない（Node.js からも動作確認できる）純粋関数だけを
// 置き、実際の画面へのレンダリング・進行制御は tools/quality-check.js 側が担当します。
//
// 既存の検証ロジック（js/question-validator.js の validateTemplate() / validateTemplateSet() /
// validateGeneratedQuestion() や js/multi-step-engine.js の simulateAllRoutesToCompletion()）は
// ここでは複製しません。ここに置くのは、それらがカバーしていない「値としての漏えい確認
// （全カードを対象・全値型対応）」「問題文そのものの文章チェック」「数量関係との照合」
// 「重複・連続出題のシグネチャ」「数値難易度の統計」「乱数シード」など、品質確認ツール
// 専用の新しいチェックだけです。

import { areValuesEqual, valueKey, isFractionValue, isPercentValue, isRatioValue, isScaleValue, formatValue } from "../js/value-utils.js";
import { getDecimalPlaces, formatNumber } from "../js/number-utils.js";
import { toMixedNumberParts, mixedNumberToImproperFraction, isValidMixedNumberParts, areFractionsEqual, simplifyFraction } from "../js/fraction-utils.js";
import { renderValueHtml } from "../js/value-renderer.js";

/**
 * カードに実際に表示される文字列を求めます（選択肢カード・解答欄と同じ、桁区切り
 * カンマ無しの表示。js/question-generator.js の buildChoiceCards() 呼び出し元と同じ
 * useSeparator:false での表示に合わせています）。数値難易度の統計（カードの文字数）で、
 * 表示前の生の浮動小数点値（例: 1.7999999999999998）をそのまま文字数にしないための
 * ヘルパーです（運用開始後に追加。以前は生の値をString()していたため、実際には
 * "1.8"と表示される値を19文字と誤って数えてしまっていた）。
 */
function displayedCardText(value) {
  if (typeof value === "number") return formatNumber(value, { useSeparator: false });
  return formatValue(value, { simplify: true });
}

// ============================================================
// ルールID（安全性: すべての呼び出し元で同じ文字列を使えるよう、ここで一元管理する）
// ============================================================

export const RULE = Object.freeze({
  // 構造・生成（既存検証の結果をそのまま使うが、表示側で統一のIDを付けるためのラッパー）
  TEMPLATE_STRUCTURAL_ERROR: "TEMPLATE_STRUCTURAL_ERROR",
  GENERATION_EXCEPTION: "GENERATION_EXCEPTION",
  GENERATED_QUESTION_INVALID: "GENERATED_QUESTION_INVALID",
  ROUTE_RESULT_MISMATCH: "ROUTE_RESULT_MISMATCH",
  // カード・答え・中間結果
  INITIAL_CARD_CONTAINS_ANSWER: "INITIAL_CARD_CONTAINS_ANSWER",
  INITIAL_CARD_CONTAINS_INTERMEDIATE: "INITIAL_CARD_CONTAINS_INTERMEDIATE",
  CARD_COUNT_EXCEEDED: "CARD_COUNT_EXCEEDED",
  CARD_DUPLICATE_ID: "CARD_DUPLICATE_ID",
  CARD_INVALID_VALUE: "CARD_INVALID_VALUE",
  // 問題文
  QUESTION_TEXT_INVALID: "QUESTION_TEXT_INVALID",
  QUESTION_LEAKS_ANSWER: "QUESTION_LEAKS_ANSWER",
  QUESTION_LEAKS_INTERMEDIATE: "QUESTION_LEAKS_INTERMEDIATE",
  QUESTION_TEXT_COINCIDENCE: "QUESTION_TEXT_COINCIDENCE",
  TEXT_NEEDS_REVIEW: "TEXT_NEEDS_REVIEW",
  TEXT_TOO_LONG: "TEXT_TOO_LONG",
  // 単位・数量関係
  UNIT_MISMATCH: "UNIT_MISMATCH",
  QUANTITY_RELATION_MISMATCH: "QUANTITY_RELATION_MISMATCH",
  // 重複・連続
  DUPLICATE_QUESTION_IN_SET: "DUPLICATE_QUESTION_IN_SET",
  CONSECUTIVE_SAME_TEMPLATE: "CONSECUTIVE_SAME_TEMPLATE",
  CONSECUTIVE_SAME_FORMULA: "CONSECUTIVE_SAME_FORMULA",
  CONSECUTIVE_SAME_VALUES: "CONSECUTIVE_SAME_VALUES",
  CONSECUTIVE_SAME_CATEGORY: "CONSECUTIVE_SAME_CATEGORY",
  // 難易度・表示
  VALUE_TOO_COMPLEX: "VALUE_TOO_COMPLEX",
  MOBILE_OVERFLOW: "MOBILE_OVERFLOW",
  // 段階の回帰
  MULTI_STEP_REGRESSION: "MULTI_STEP_REGRESSION",
  // 出題セット
  SET_GENERATION_FAILED: "SET_GENERATION_FAILED",
  SET_COMPOSITION_MISMATCH: "SET_COMPOSITION_MISMATCH",
  // 帯分数（第11段階：同分母分数のたし算・ひき算への帯分数追加で追加）
  INVALID_MIXED_NUMBER: "INVALID_MIXED_NUMBER",
  MIXED_NUMBER_VALUE_MISMATCH: "MIXED_NUMBER_VALUE_MISMATCH",
  MIXED_NUMBER_PATTERN_MISMATCH: "MIXED_NUMBER_PATTERN_MISMATCH",
  MIXED_NUMBER_RENDER_ERROR: "MIXED_NUMBER_RENDER_ERROR",
  MIXED_NUMBER_ARIA_ERROR: "MIXED_NUMBER_ARIA_ERROR",
  MIXED_NUMBER_OVERFLOW: "MIXED_NUMBER_OVERFLOW"
});

// ============================================================
// 乱数シード（mulberry32。外部ライブラリを使わない、小さく決定的な擬似乱数生成器）
// ============================================================

/**
 * 32bit整数シードから、決定的な乱数生成関数（0以上1未満）を作ります。
 * 同じシードから毎回同じ数列を生成するため、js/question-generator.js の
 * setRandomSource() と組み合わせて「同じテンプレート・同じシード」で
 * 同じ問題を再現するために使います。
 */
export function createSeededRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
// シグネチャ（重複・連続出題の検出用）
// ============================================================

function stableStringify(value) {
  if (value === null || value === undefined) return String(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${k}:${stableStringify(value[k])}`)
      .join(",")}}`;
  }
  return String(value);
}

/**
 * 問題文・使用値・最終答えを含む、完全一致確認用の署名を作ります。
 */
export function buildQuestionSignature(problem) {
  const answer = problem.answer !== undefined ? problem.answer : problem.result;
  return `${problem.text}|${stableStringify(problem.values)}|${stableStringify(answer)}`;
}

/**
 * 登録された正解式・正解ルートを正規化した署名を作ります（ルートの並び順に依存しないよう、
 * ルートごとの式をソートしてから結合します）。
 */
export function buildFormulaSignature(problem) {
  if (problem.questionType === "multiStep") {
    const routeStrings = (problem.solutionRoutes || [])
      .map((route) => route.steps.map((s) => `${valueKey(s.left)}${s.operator}${valueKey(s.right)}`).join("→"))
      .sort();
    return routeStrings.join("|");
  }
  const routes = problem.solutionRoutes && problem.solutionRoutes.length > 0 ? problem.solutionRoutes : [problem];
  return routes
    .map((r) => `${valueKey(r.left)}${r.operator}${valueKey(r.right)}`)
    .sort()
    .join("|");
}

/**
 * テンプレートで使用された主要変数の値を、変数キー順に並べた署名を作ります。
 */
export function buildValueSignature(problem) {
  const values = problem.values || {};
  return Object.keys(values)
    .sort()
    .map((k) => `${k}=${valueKey(values[k])}`)
    .join(",");
}

// ============================================================
// カード・答え・中間結果の漏えい確認（全カード・全値型を対象。既存のvalidateGeneratedQuestion()
// は「ダミーカードだけ」「1つ目の式だけ」を見る軽量チェックのため、ここではそれより広い範囲を
// value-utils.js の areValuesEqual() で確認する）
// ============================================================

// このゲームは「カードを左辺・演算子・右辺へ組み立てて『＝』を押す」方式で、
// 答えを直接カードとして選んで提出する手段が無いため、正解を組み立てるのに実際に必要な
// カード（source: "variable"／"intermediate"／"operator"）が答えと数字として偶然一致しても
// 「漏えい」にはなりません（例: 64÷8=8 は divisor が answer と同じ8になる正当な問題）。
// 本当に問題なのは、無くても解けるのに紛れ込んだ「dummy」カードが答えと一致するケース
// （既存の js/multi-step-engine.js / js/question-validator.js が「dummyカードだけ」を対象に
// している設計を踏襲しつつ、値型の比較を areValuesEqual() に揃え、対象を全ステップへ広げる）。
function dummyNumberCardValues(choices) {
  return (choices || []).filter((c) => c.type === "number" && c.source === "dummy").map((c) => c.value);
}

function findEqualValue(values, target) {
  return values.some((v) => areValuesEqual(v, target));
}

/**
 * 1段階問題の初期カードのうち、ダミーカードに最終答えが紛れ込んでいないかを確認します。
 */
export function checkSingleStepCardLeak(problem) {
  const findings = [];
  const values = dummyNumberCardValues(problem.choices);
  const answer = problem.result;
  if (answer !== undefined && findEqualValue(values, answer)) {
    findings.push({ ruleId: RULE.INITIAL_CARD_CONTAINS_ANSWER, message: `最終答え ${formatValue(answer)} と同じ値のダミーカードが含まれています。` });
  }
  return findings;
}

/**
 * 多段階問題について、各ステップに取り組む「前」のカードに、そのステップ以降の結果
 * （最終答えを含む）が含まれていないかを、実際にステップを進めながら確認します。
 * 元の problem オブジェクトは変更しません（{...problem} で作った複製を進める）。
 * multiStepEngine は呼び出し側（quality-check.js）から渡してもらいます
 * （このファイル自体はDOM・他モジュールへの依存を増やしたくないための設計）。
 */
export function checkMultiStepCardLeak(problem, multiStepEngine) {
  const findings = [];
  const totalSteps = problem.multiStep.totalSteps;
  const finalAnswer = problem.answer !== undefined ? problem.answer : problem.result;
  const resultsByStepIndex = Array.from({ length: totalSteps }, (_, stepIndex) =>
    (problem.solutionRoutes || []).filter((r) => r.steps[stepIndex]).map((r) => r.steps[stepIndex].result)
  );

  const clone = { ...problem };
  multiStepEngine.initializeMultiStepQuestion(clone);
  const primaryRoute = problem.solutionRoutes[0];

  for (let step = 0; step < totalSteps; step++) {
    const values = dummyNumberCardValues(clone.choices);
    const notYetComputed = [];
    if (finalAnswer !== undefined) notYetComputed.push({ value: finalAnswer, isFinal: true });
    for (let s = step; s < totalSteps; s++) {
      for (const r of resultsByStepIndex[s]) {
        notYetComputed.push({ value: r, isFinal: s === totalSteps - 1 });
      }
    }
    for (const entry of notYetComputed) {
      if (findEqualValue(values, entry.value)) {
        findings.push({
          ruleId: entry.isFinal ? RULE.INITIAL_CARD_CONTAINS_ANSWER : RULE.INITIAL_CARD_CONTAINS_INTERMEDIATE,
          message: `式${step + 1}に取り組む前のカードに、${entry.isFinal ? "最終答え" : "まだ求めていない中間結果"} ${formatValue(entry.value)} が含まれています。`,
          step
        });
      }
    }
    if (step < totalSteps - 1 && primaryRoute.steps[step]) {
      const s = primaryRoute.steps[step];
      multiStepEngine.submitStepAnswer(clone, s.left, s.operator, s.right);
    }
  }
  return findings;
}

/**
 * 選択肢カードそのものの構造的な整合性（枚数・ID重複・不正な値）を確認します。
 */
export function checkCardStructure(problem) {
  const findings = [];
  const choices = problem.choices;
  if (!Array.isArray(choices)) return findings;
  if (choices.length > 8) {
    findings.push({ ruleId: RULE.CARD_COUNT_EXCEEDED, message: `選択肢カードが上限(8枚)を超えています: ${choices.length}枚` });
  }
  const ids = choices.map((c) => c.cardId);
  if (new Set(ids).size !== ids.length) {
    findings.push({ ruleId: RULE.CARD_DUPLICATE_ID, message: "カードIDが重複しています。" });
  }
  for (const card of choices) {
    if (card.type === "number") {
      const v = card.value;
      if (typeof v === "number" && !Number.isFinite(v)) {
        findings.push({ ruleId: RULE.CARD_INVALID_VALUE, message: `カードの数値がNaN/Infinityです: ${JSON.stringify(v)}` });
      }
    }
  }
  return findings;
}

// ============================================================
// 帯分数の整合性確認（第11段階：同分母分数のたし算・ひき算への帯分数追加で追加）
// js/fraction-utils.js の toMixedNumberParts()/mixedNumberToImproperFraction()、
// js/value-renderer.js の renderValueHtml() など、既存の帯分数処理そのものは再実装せず、
// それらを実際に呼び出した結果が壊れていないかだけをここで確認します。
// ============================================================

/**
 * 帯分数として表示されうる分数値（problem.template.fractionDisplayMode === "mixed" の
 * 問題の left/right/result）について、以下を確認します。
 *   - 仮分数⇔帯分数の往復変換が一致するか（INVALID_MIXED_NUMBER / MIXED_NUMBER_VALUE_MISMATCH）
 *   - 実際のレンダリングHTMLに「Xと0/Y」という誤った表示が含まれていないか（MIXED_NUMBER_RENDER_ERROR）
 *   - aria-labelが「(整数部)と(分母)分の(分子)」の形式になっているか（MIXED_NUMBER_ARIA_ERROR）
 * 常にエラー相当（正誤判定・アクセシビリティに直接影響しうる不具合）を返します。
 */
export function checkMixedNumberConsistency(problem) {
  const findings = [];
  const template = problem.template;
  if (!template || template.fractionDisplayMode !== "mixed") return findings;

  const simplify = problem.simplifyFractions !== false;
  const candidates = [
    { label: "left", value: problem.left },
    { label: "right", value: problem.right },
    { label: "result", value: problem.result }
  ];

  for (const { label, value } of candidates) {
    if (!isFractionValue(value)) continue;
    // renderValueHtml() 自身の分岐（約分してから判定する）と全く同じ順序で判定する。
    // ここが value（未約分の場合がある元の値）のままだと、約分後には整数や真分数になる値を
    // 誤って帯分数扱いしてしまい、実際には発生していない不一致を報告してしまう。
    const s = simplify ? simplifyFraction(value) : value;
    if (s.denominator === 1) continue; // 約分の結果、整数になる値は帯分数表示の対象外
    if (Math.abs(s.numerator) < s.denominator) continue; // 1未満（真分数）は帯分数表示の対象外

    const parts = toMixedNumberParts(s);
    if (parts.numerator !== 0 && !isValidMixedNumberParts(parts)) {
      findings.push({
        ruleId: RULE.INVALID_MIXED_NUMBER,
        message: `${label} の帯分数分解が不正です: ${JSON.stringify(s)} → whole=${parts.whole}, numerator=${parts.numerator}, denominator=${parts.denominator}`
      });
    }
    const roundTrip = mixedNumberToImproperFraction(parts.whole, parts.numerator, parts.denominator);
    if (!areFractionsEqual(s, roundTrip)) {
      findings.push({
        ruleId: RULE.MIXED_NUMBER_VALUE_MISMATCH,
        message: `${label} の仮分数⇔帯分数の往復変換が一致しません: 元の値=${JSON.stringify(s)}, 復元値=${JSON.stringify(roundTrip)}`
      });
    }

    const html = renderValueHtml(value, { useSeparator: false, simplify, mixedNumber: true });
    if (/と0\//.test(html)) {
      findings.push({
        ruleId: RULE.MIXED_NUMBER_RENDER_ERROR,
        message: `${label} の表示に「と0/」という誤った帯分数表示が含まれています: ${html}`
      });
    }
    if (parts.numerator !== 0) {
      const expectedAria = `aria-label="${parts.whole}と${parts.denominator}分の${parts.numerator}"`;
      if (!html.includes(expectedAria)) {
        findings.push({
          ruleId: RULE.MIXED_NUMBER_ARIA_ERROR,
          message: `${label} の読み上げラベルが想定形式（${parts.whole}と${parts.denominator}分の${parts.numerator}）と一致しません: ${html}`
        });
      }
    }

    // カードとして表示する際の桁数が大きくなりすぎていないか（スマートフォンでのはみ出しリスクの目安）。
    // 実際のオーバーフロー確認は tools/quality-check.html のモバイルプレビューで行うが、
    // ここでは生成データの時点で明らかに大きすぎる値を早期に検知する。
    const digitLength = String(parts.whole).length + String(parts.numerator).length + String(parts.denominator).length;
    if (digitLength > 4) {
      findings.push({
        ruleId: RULE.MIXED_NUMBER_OVERFLOW,
        message: `${label} の帯分数の桁数が大きく、カード幅からはみ出す可能性があります（whole=${parts.whole}, numerator=${parts.numerator}, denominator=${parts.denominator}）。テンプレートの数値範囲を見直すことを推奨します。`
      });
    }
  }

  return findings;
}

/**
 * mixedNumberPattern（"addition-no-carry" 等、デバッグ・品質確認専用のメタ情報）が、
 * 実際に生成された値のくり上がり・くり下がり条件と一致しているかを確認します。
 * 正誤判定には一切使われない情報のため、不一致でも問題の正しさ自体には影響しませんが、
 * テンプレート設計のバグ（意図した出題パターンになっていない）を検出するために確認します。
 */
export function checkMixedNumberPatternClassification(problem) {
  const findings = [];
  const template = problem.template;
  if (!template || !template.mixedNumberPattern) return findings;
  const variables = template.variables || {};
  const varA = variables.a;
  const varB = variables.b;
  const values = problem.values || {};
  if (!varA || !varB || !values.a || !values.b) return findings;

  const numeratorPartOf = (range, value) =>
    range.type === "mixedFraction" ? toMixedNumberParts(value).numerator : value.numerator;
  const p = numeratorPartOf(varA, values.a);
  const q = numeratorPartOf(varB, values.b);
  const denominator = varA.denominator;
  const pattern = template.mixedNumberPattern;

  const isConsistent =
    (pattern === "addition-no-carry" && p + q < denominator) ||
    (pattern === "addition-with-carry" && p + q > denominator) ||
    (pattern === "subtraction-no-borrow" && p >= q) ||
    (pattern === "subtraction-with-borrow" && p < q);

  if (!isConsistent) {
    findings.push({
      ruleId: RULE.MIXED_NUMBER_PATTERN_MISMATCH,
      message: `mixedNumberPattern="${pattern}" と実際の値が一致しません（分子部分: a=${p}, b=${q}, 分母=${denominator}）。`
    });
  }
  return findings;
}

// ============================================================
// 問題文の整合性確認
// ============================================================

const TEXT_INVALID_PATTERNS = [
  { pattern: /undefined/, label: "undefined" },
  { pattern: /\bnull\b/, label: "null" },
  { pattern: /NaN/, label: "NaN" },
  { pattern: /Infinity/, label: "Infinity" },
  { pattern: /\[object Object\]/, label: "[object Object]" },
  { pattern: /\{[a-zA-Z0-9_]+\}/, label: "未解決のプレースホルダー" }
];

const TEXT_LENGTH_WARNING_THRESHOLD = 90;
const TEXT_LENGTH_ERROR_THRESHOLD = 160;

/**
 * 生成後の問題文（problem.text、プレーンテキスト化済み）を確認します。
 * @returns {{errors: Array<{ruleId,message}>, warnings: Array<{ruleId,message}>}}
 */
export function checkQuestionText(text) {
  const errors = [];
  const warnings = [];

  if (typeof text !== "string" || text.length === 0) {
    errors.push({ ruleId: RULE.QUESTION_TEXT_INVALID, message: "問題文が空です。" });
    return { errors, warnings };
  }

  for (const { pattern, label } of TEXT_INVALID_PATTERNS) {
    if (pattern.test(text)) {
      errors.push({ ruleId: RULE.QUESTION_TEXT_INVALID, message: `問題文に「${label}」が含まれています。` });
    }
  }

  if (text.length >= TEXT_LENGTH_ERROR_THRESHOLD) {
    errors.push({ ruleId: RULE.QUESTION_TEXT_INVALID, message: `問題文が極端に長すぎます（${text.length}文字）。` });
  } else if (text.length >= TEXT_LENGTH_WARNING_THRESHOLD) {
    warnings.push({ ruleId: RULE.TEXT_TOO_LONG, message: `問題文が長めです（${text.length}文字）。` });
  }

  if (!/[。？?]\s*$/.test(text.trim())) {
    warnings.push({ ruleId: RULE.TEXT_NEEDS_REVIEW, message: "問題文の末尾が句点・疑問符で終わっていません。" });
  }
  if (!/か[。？?]?\s*$/.test(text.trim())) {
    warnings.push({ ruleId: RULE.TEXT_NEEDS_REVIEW, message: "問題文に「〜か。」のような問いかけが見当たりません。" });
  }

  // 「同じ語句の不自然な連続」をN-gram（文字の並び）の出現回数だけで機械的に判定する案も
  // 検討したが、実際にテンプレートへ通してみると「〜ました。〜ました。」のように、
  // 2つの事実＋問いかけという、この文章題の文体そのものが持つ自然な過去形の繰り返し
  // （「ありました」「もらいました」等）まで大量に誤検出してしまい、警告として機能しなかった
  // （運用開始後に検証して削除）。この種の「文章として不自然かどうか」は自動判定に頼らず、
  // 「目視確認」用の代表サンプル抽出（pickRepresentativeProblems等）に委ねる。

  return { errors, warnings };
}

/**
 * 問題文の中に、最終答え・中間結果（hiddenIntermediateKeys以外の変数）と同じ数値が
 * 偶然含まれていないかを確認します。構造的な直接参照（hiddenIntermediateKeysが
 * textPartsから直接参照されているケース）は、既存の js/question-validator.js の
 * validateTemplate() がすでに検出しているため、ここでは扱いません（数値の偶然の一致だけを
 * 「目視確認」として報告します）。
 */
export function checkTextNumericCoincidence(problem) {
  const findings = [];
  if (typeof problem.text !== "string") return findings;

  const hiddenValues = [];
  const finalAnswer = problem.answer !== undefined ? problem.answer : problem.result;
  if (finalAnswer !== undefined) hiddenValues.push({ label: "最終答え", value: finalAnswer });
  if (problem.questionType === "multiStep" && problem.solutionRoutes) {
    for (const route of problem.solutionRoutes) {
      for (const step of route.steps.slice(0, -1)) {
        hiddenValues.push({ label: "中間結果", value: step.result });
      }
    }
  }

  for (const { label, value } of hiddenValues) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const text = String(Math.trunc(value)) === String(value) ? String(value) : formatValue(value);
    if (text.length < 2) continue; // 1桁の数字は偶然一致しやすいため対象外
    // 前後が数字（またはピリオド続き）でないことを確認する（例: 答え20が「120」の
    // 部分文字列として誤って一致しないようにする。運用開始後に修正）。
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![0-9.])${escaped}(?![0-9])`);
    if (re.test(problem.text)) {
      findings.push({
        ruleId: RULE.QUESTION_TEXT_COINCIDENCE,
        message: `${label}と同じ数値（${text}）が問題文にあります。意味を目視確認してください。`
      });
    }
  }
  return findings;
}

// ============================================================
// 数量関係との照合（quantityRelation.type ごとに、正解ルートとは別の経路で期待値を求め、
// solutionRoutes/answer と一致するか照合する）
// ============================================================

function num(v) {
  return typeof v === "number" ? v : NaN;
}

// quantityRelation.type ごとの再計算式。値が一致しない場合だけ findings を返す。
// 対応していない type は黙って何もしない（未対応の数量関係を誤ってエラー扱いしないため）。
const QUANTITY_RELATION_CHECKERS = {
  "direct-proportion": (values, qr) => {
    const { knownX, knownY, targetX, targetY } = {
      knownX: num(values[qr.knownXKey]),
      knownY: num(values[qr.knownYKey]),
      targetX: num(values[qr.targetXKey]),
      targetY: num(values[qr.targetYKey])
    };
    if ([knownX, knownY, targetX, targetY].some(Number.isNaN)) return null;
    const expected = (knownY / knownX) * targetX;
    return Math.abs(expected - targetY) < 1e-6 ? null : { expected, actual: targetY };
  },
  "inverse-proportion": (values, qr) => {
    const knownX = num(values[qr.knownXKey]);
    const knownY = num(values[qr.knownYKey]);
    const targetX = num(values[qr.targetXKey]);
    const targetY = num(values[qr.targetYKey]);
    if ([knownX, knownY, targetX, targetY].some(Number.isNaN)) return null;
    const expected = (knownX * knownY) / targetX;
    return Math.abs(expected - targetY) < 1e-6 ? null : { expected, actual: targetY };
  },
  "scale-length": (values, qr) => {
    const scale = num(values[qr.scaleKey]);
    const mapLength = num(values[qr.mapLengthKey]);
    const actualLength = values[qr.actualLengthKey];
    if (Number.isNaN(scale) || Number.isNaN(mapLength) || typeof actualLength !== "number") return null;
    const factor = qr.actualLengthUnit === "km" ? 100000 : 100;
    const expectedActual = (mapLength * scale) / factor;
    return Math.abs(expectedActual - actualLength) < 1e-6 ? null : { expected: expectedActual, actual: actualLength };
  }
};

/**
 * quantityRelation を持つ問題について、正解ルートとは独立に期待値を再計算し、
 * 実際に生成された値と一致するかを確認します。
 */
export function checkQuantityRelation(problem) {
  const findings = [];
  const qr = problem.template && problem.template.quantityRelation;
  if (!qr || !qr.type) return findings;
  const checker = QUANTITY_RELATION_CHECKERS[qr.type];
  if (!checker) return findings;
  const mismatch = checker(problem.values || {}, qr);
  if (mismatch) {
    findings.push({
      ruleId: RULE.QUANTITY_RELATION_MISMATCH,
      message: `数量関係(${qr.type})から求めた期待値(${mismatch.expected})と、生成された値(${mismatch.actual})が一致しません。`
    });
  }
  return findings;
}

// ============================================================
// 数値難易度の統計
// ============================================================

function collectNumericLeaves(value, out) {
  if (typeof value === "number" && Number.isFinite(value)) {
    out.push(value);
  } else if (isFractionValue(value)) {
    out.push(value.numerator, value.denominator);
  } else if (isPercentValue(value)) {
    out.push(value.value);
  } else if (isRatioValue(value)) {
    out.push(value.antecedent, value.consequent);
  } else if (isScaleValue(value)) {
    out.push(value.denominator);
  }
}

/**
 * 1回の生成結果から、数値難易度の分析に使う値を抜き出します。
 */
export function extractDifficultySample(problem) {
  const leaves = [];
  for (const v of Object.values(problem.values || {})) {
    collectNumericLeaves(v, leaves);
  }
  const answer = problem.answer !== undefined ? problem.answer : problem.result;
  const answerLeaves = [];
  collectNumericLeaves(answer, answerLeaves);

  const fractionValues = Object.values(problem.values || {}).filter(isFractionValue);
  const maxDenominator = fractionValues.reduce((m, f) => Math.max(m, Math.abs(f.denominator)), 0);
  const maxNumerator = fractionValues.reduce((m, f) => Math.max(m, Math.abs(f.numerator)), 0);

  const decimalPlacesList = Object.values(problem.values || {})
    .filter((v) => typeof v === "number")
    .map((v) => getDecimalPlaces(v));

  const cardTexts = (problem.choices || []).filter((c) => c.type === "number").map((c) => displayedCardText(c.value));

  return {
    maxAbsValue: leaves.length ? Math.max(...leaves.map(Math.abs)) : 0,
    minAbsValue: leaves.length ? Math.min(...leaves.map(Math.abs)) : 0,
    maxAnswerAbsValue: answerLeaves.length ? Math.max(...answerLeaves.map(Math.abs)) : 0,
    maxDigits: leaves.length ? Math.max(...leaves.map((v) => String(Math.trunc(Math.abs(v))).length)) : 0,
    maxDecimalPlaces: decimalPlacesList.length ? Math.max(...decimalPlacesList) : 0,
    maxFractionDenominator: maxDenominator,
    maxFractionNumerator: maxNumerator,
    textLength: typeof problem.text === "string" ? problem.text.length : 0,
    maxCardLength: cardTexts.length ? Math.max(...cardTexts.map((t) => t.length)) : 0,
    cardCount: (problem.choices || []).length
  };
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(sortedValues.length - 1, Math.floor((p / 100) * sortedValues.length));
  return sortedValues[idx];
}

/**
 * extractDifficultySample() の結果を複数回ぶんまとめて、テンプレート単位の統計にします。
 */
export function summarizeDifficultySamples(samples) {
  if (samples.length === 0) {
    return null;
  }
  const maxAbsValues = samples.map((s) => s.maxAbsValue).sort((a, b) => a - b);
  return {
    count: samples.length,
    minValue: Math.min(...samples.map((s) => s.minAbsValue)),
    maxValue: Math.max(...maxAbsValues),
    medianValue: percentile(maxAbsValues, 50),
    p95Value: percentile(maxAbsValues, 95),
    maxDigits: Math.max(...samples.map((s) => s.maxDigits)),
    maxDecimalPlaces: Math.max(...samples.map((s) => s.maxDecimalPlaces)),
    maxFractionDenominator: Math.max(...samples.map((s) => s.maxFractionDenominator)),
    maxFractionNumerator: Math.max(...samples.map((s) => s.maxFractionNumerator)),
    maxAnswerValue: Math.max(...samples.map((s) => s.maxAnswerAbsValue)),
    maxTextLength: Math.max(...samples.map((s) => s.textLength)),
    maxCardLength: Math.max(...samples.map((s) => s.maxCardLength)),
    maxCardCount: Math.max(...samples.map((s) => s.cardCount))
  };
}

// ============================================================
// カテゴリ別の品質基準（難易度警告のしきい値を、カテゴリごとに調整できるようにする）
// ============================================================

const DEFAULT_QUALITY_RULE = {
  maxOperandDigits: 6,
  maxAnswerDigits: 7,
  maxFractionDenominator: 30,
  maxDecimalPlaces: 3,
  maxCardLength: 8
};

// カテゴリIDごとの上書き設定。ここに書かれていないカテゴリは DEFAULT_QUALITY_RULE を使う。
// 縮尺・大きな数など、意図的に大きな数値を扱うカテゴリだけ上限を緩める。
export const QUALITY_RULES_BY_CATEGORY = {
  "scale-find-actual-length": { maxOperandDigits: 9, maxAnswerDigits: 9, maxCardLength: 10 },
  "scale-find-map-length": { maxOperandDigits: 9, maxAnswerDigits: 9, maxCardLength: 10 },
  "large-numbers": { maxOperandDigits: 9, maxAnswerDigits: 9, maxCardLength: 10 },
  "distance-proportional-map": { maxOperandDigits: 9, maxAnswerDigits: 9 }
};

export function getQualityRuleForCategory(categoryId) {
  return { ...DEFAULT_QUALITY_RULE, ...(QUALITY_RULES_BY_CATEGORY[categoryId] || {}) };
}

/**
 * テンプレート単位の統計（summarizeDifficultySamples()の結果）と、カテゴリ別の品質基準から、
 * 難易度に関する警告を作ります（不正値でない限りエラーにはしない）。
 */
export function checkDifficultyWarnings(stats, categoryId) {
  const warnings = [];
  if (!stats) return warnings;
  const rule = getQualityRuleForCategory(categoryId);

  if (stats.maxDigits > rule.maxOperandDigits) {
    warnings.push({ ruleId: RULE.VALUE_TOO_COMPLEX, message: `数値の桁数が想定より多い可能性があります（最大${stats.maxDigits}桁、目安${rule.maxOperandDigits}桁）。` });
  }
  if (String(Math.trunc(stats.maxAnswerValue)).length > rule.maxAnswerDigits) {
    warnings.push({ ruleId: RULE.VALUE_TOO_COMPLEX, message: `答えの桁数が想定より多い可能性があります（最大${Math.trunc(stats.maxAnswerValue)}）。` });
  }
  if (stats.maxDecimalPlaces > rule.maxDecimalPlaces) {
    warnings.push({ ruleId: RULE.VALUE_TOO_COMPLEX, message: `小数点以下の桁数が多すぎる可能性があります（最大${stats.maxDecimalPlaces}桁）。` });
  }
  if (stats.maxFractionDenominator > rule.maxFractionDenominator) {
    warnings.push({ ruleId: RULE.VALUE_TOO_COMPLEX, message: `分数の分母が大きすぎる可能性があります（最大${stats.maxFractionDenominator}）。` });
  }
  if (stats.maxCardLength > rule.maxCardLength) {
    warnings.push({ ruleId: RULE.VALUE_TOO_COMPLEX, message: `カードの表示文字数が長く、スマートフォンで読みにくい可能性があります（最大${stats.maxCardLength}文字）。` });
  }
  if (stats.maxTextLength >= TEXT_LENGTH_WARNING_THRESHOLD) {
    warnings.push({ ruleId: RULE.TEXT_TOO_LONG, message: `問題文が長いテンプレートです（最大${stats.maxTextLength}文字）。` });
  }
  return warnings;
}

// ============================================================
// 重複・連続出題の検出（1セット分の問題配列を受け取る）
// ============================================================

/**
 * 1セット（通常バトル・トレーニング・総復習いずれかの、生成された問題の配列）について、
 * 完全重複・連続出題を検出します。
 * @param {Array} problems
 * @param {{minTemplatesAvoidingRepeat?: number}} options - カテゴリのテンプレート数が
 *   少なく、連続を完全には避けられない場合に警告の文言を変えるためのヒント。
 */
export function checkSetForDuplicatesAndStreaks(problems, options = {}) {
  const findings = [];
  const questionSigCounts = new Map();

  for (const problem of problems) {
    const sig = buildQuestionSignature(problem);
    questionSigCounts.set(sig, (questionSigCounts.get(sig) || 0) + 1);
  }
  for (const [sig, count] of questionSigCounts) {
    if (count > 1) {
      findings.push({ ruleId: RULE.DUPLICATE_QUESTION_IN_SET, message: `完全に同じ問題が${count}回出題されています。`, severity: "error" });
    }
  }

  const scarcePool = Boolean(options.templatePoolSize && options.templatePoolSize <= 2);

  for (let i = 1; i < problems.length; i++) {
    const prev = problems[i - 1];
    const cur = problems[i];
    if (prev.templateId && cur.templateId && prev.templateId === cur.templateId) {
      findings.push({
        ruleId: RULE.CONSECUTIVE_SAME_TEMPLATE,
        message: scarcePool
          ? `同じテンプレートが連続しています（このカテゴリはテンプレート数が少なく、避けられない場合があります）。`
          : "同じテンプレートが連続しています。",
        severity: "warning"
      });
    }
    if (buildFormulaSignature(prev) === buildFormulaSignature(cur)) {
      findings.push({ ruleId: RULE.CONSECUTIVE_SAME_FORMULA, message: "同じ正解式が連続しています。", severity: "warning" });
    }
    if (buildValueSignature(prev) === buildValueSignature(cur) && buildValueSignature(prev) !== "") {
      findings.push({ ruleId: RULE.CONSECUTIVE_SAME_VALUES, message: "同じ主要数値の組み合わせが連続しています。", severity: "warning" });
    }
    if (prev.category && cur.category && prev.category === cur.category) {
      let streak = 1;
      for (let j = i; j > 0 && problems[j].category === problems[j - 1].category; j--) streak++;
      if (streak >= 3) {
        findings.push({ ruleId: RULE.CONSECUTIVE_SAME_CATEGORY, message: `同じカテゴリ「${cur.category}」が${streak}問連続しています。`, severity: "warning" });
      }
    }
  }

  return findings;
}

// ============================================================
// 意図的な不正データによる自己診断（37章／セクション36）
// 品質確認ロジック自体が、既知の不正パターンを正しく検出できるかを確認するための
// fixture（テスト専用データ）です。本番の問題データファイル（data/*.js）には一切
// 混ぜません。テンプレート単体で判定できるもの（構造検証で検出）と、「生成済みの問題」
// の形をあらかじめ手で組み立てて判定するもの（生成後の検証で検出）の2種類があります。
// ============================================================

const BASE_VALID_TEMPLATE = {
  gradeTerm: "4-1",
  category: "テスト",
  categoryId: "integer-addition",
  contentGroup: "new",
  difficulty: 1,
  questionType: "singleStep",
  template: "{a}と{b}をたすといくつですか。",
  variables: { a: { min: 1, max: 9, step: 1 }, b: { min: 1, max: 9, step: 1 } },
  generatorType: "standard",
  solutionRoutes: [{ left: "a", operator: "+", right: "b", commutative: true }],
  answerUnit: ""
};

/**
 * テンプレート構造検証（既存の validateTemplate() / validateTemplateSet() /
 * validateCategoryRegistryAgainstTemplates()）が検出すべき、不正なテンプレートの一覧。
 */
export const TEMPLATE_FIXTURES = [
  {
    name: "重複したテンプレートID",
    expectedRuleId: "TEMPLATE_DUPLICATE_ID",
    templates: [
      { ...BASE_VALID_TEMPLATE, id: "fixture_dup_id" },
      { ...BASE_VALID_TEMPLATE, id: "fixture_dup_id" }
    ]
  },
  {
    name: "存在しないカテゴリID",
    expectedRuleId: "INVALID_CATEGORY_ID",
    templates: [{ ...BASE_VALID_TEMPLATE, id: "fixture_invalid_category", categoryId: "no-such-category-xyz" }]
  },
  {
    name: "存在しない変数を参照している",
    expectedRuleId: "TEMPLATE_STRUCTURAL_ERROR",
    templates: [
      {
        ...BASE_VALID_TEMPLATE,
        id: "fixture_undefined_variable",
        solutionRoutes: [{ left: "a", operator: "+", right: "doesNotExist", commutative: true }]
      }
    ]
  },
  {
    name: "4段階以上の問題",
    expectedRuleId: "TEMPLATE_STRUCTURAL_ERROR",
    templates: [
      {
        ...BASE_VALID_TEMPLATE,
        id: "fixture_four_steps",
        questionType: "multiStep",
        totalSteps: 4,
        generatorType: "multiStepSumToDivisible",
        variables: { divisor: { values: [2] }, quotient: { min: 2, max: 5, step: 1 }, a: { min: 1, max: 5, step: 1 } },
        solutionRoutes: [
          {
            id: "route1",
            steps: [
              { left: { source: "variable", key: "a" }, operator: "+", right: { source: "variable", key: "a" }, resultKey: "r1" },
              { left: { source: "result", key: "r1" }, operator: "+", right: { source: "variable", key: "a" }, resultKey: "r2" },
              { left: { source: "result", key: "r2" }, operator: "+", right: { source: "variable", key: "a" }, resultKey: "r3" },
              { left: { source: "result", key: "r3" }, operator: "+", right: { source: "variable", key: "a" }, resultKey: "answer" }
            ]
          }
        ]
      }
    ]
  }
];

/**
 * 「生成済みの問題」の形をあらかじめ手で組み立てた、不正なデータの一覧
 * （js/question-validator.js の validateGeneratedQuestion() や、このファイルの
 * checkSingleStepCardLeak() 等が検出すべきもの）。
 */
export function buildGeneratedQuestionFixtures() {
  const baseProblem = {
    id: "fixture_q_1",
    templateId: "fixture_template",
    questionType: "singleStep",
    text: "3と5をたすといくつですか。",
    left: 3,
    operator: "+",
    right: 5,
    result: 8,
    answerUnit: "",
    solutionRoutes: [{ left: 3, operator: "+", right: 5, result: 8, commutative: true }],
    choices: [
      { cardId: "c1", type: "number", value: 3, source: "variable" },
      { cardId: "c2", type: "number", value: 5, source: "variable" },
      { cardId: "c3", type: "number", value: 2, source: "dummy" },
      { cardId: "c4", type: "number", value: 9, source: "dummy" },
      { cardId: "op1", type: "operator", value: "+", source: "operator" },
      { cardId: "op2", type: "operator", value: "-", source: "dummyOperator" },
      { cardId: "op3", type: "operator", value: "×", source: "dummyOperator" },
      { cardId: "op4", type: "operator", value: "÷", source: "dummyOperator" }
    ]
  };

  return [
    {
      name: "間違った最終答え",
      expectedRuleId: "GENERATED_QUESTION_INVALID",
      kind: "generatedQuestion",
      problem: { ...baseProblem, solutionRoutes: [{ left: 3, operator: "+", right: 5, result: 999, commutative: true }] }
    },
    {
      name: "0で割る式",
      expectedRuleId: "GENERATED_QUESTION_INVALID",
      kind: "generatedQuestion",
      problem: {
        ...baseProblem,
        operator: "÷",
        result: 0,
        solutionRoutes: [{ left: 3, operator: "÷", right: 0, result: 0 }]
      }
    },
    {
      name: "最終答えを初期カードに入れる（ダミーカード）",
      expectedRuleId: "INITIAL_CARD_CONTAINS_ANSWER",
      kind: "cardLeak",
      problem: {
        ...baseProblem,
        choices: baseProblem.choices.map((c) => (c.cardId === "c3" ? { ...c, value: 8 } : c))
      }
    },
    {
      name: "カードを上限より多くする",
      expectedRuleId: "CARD_COUNT_EXCEEDED",
      kind: "cardStructure",
      problem: {
        ...baseProblem,
        choices: [...baseProblem.choices, { cardId: "extra1", type: "number", value: 100, source: "dummy" }]
      }
    },
    {
      name: "undefinedを含む問題文",
      expectedRuleId: "QUESTION_TEXT_INVALID",
      kind: "text",
      problem: { ...baseProblem, text: "3とundefinedをたすといくつですか。" }
    },
    {
      name: "表示幅からはみ出す長い値（極端に長い問題文）",
      expectedRuleId: "TEXT_TOO_LONG",
      kind: "text",
      problem: { ...baseProblem, text: "あ".repeat(120) + "か。" }
    },
    {
      // 第11段階：帯分数追加で追加。mixedNumberPattern="addition-no-carry" と宣言しているのに、
      // 実際の分子部分の和（3+4=7）が分母（5）を超えており、本当は繰り上がりが発生する組み合わせ。
      name: "帯分数のcarry/borrow分類がテンプレートの宣言と矛盾している",
      expectedRuleId: "MIXED_NUMBER_PATTERN_MISMATCH",
      kind: "mixedNumberPattern",
      problem: {
        template: {
          fractionDisplayMode: "mixed",
          mixedNumberPattern: "addition-no-carry",
          variables: {
            a: { type: "mixedFraction", denominator: 5, wholeMin: 1, wholeMax: 3, numeratorMin: 3, numeratorMax: 4 },
            b: { type: "mixedFraction", denominator: 5, wholeMin: 1, wholeMax: 3, numeratorMin: 3, numeratorMax: 4 }
          }
        },
        values: {
          a: { type: "fraction", numerator: 13, denominator: 5 },
          b: { type: "fraction", numerator: 14, denominator: 5 }
        },
        left: { type: "fraction", numerator: 13, denominator: 5 },
        right: { type: "fraction", numerator: 14, denominator: 5 },
        result: { type: "fraction", numerator: 27, denominator: 5 },
        simplifyFractions: true
      }
    }
  ];
}

/**
 * すべてのfixtureを実際にチェック関数へ通し、期待したルールIDで検出できるかを確認します。
 * 依存する既存の検証関数（validateTemplateSet／validateGeneratedQuestion）は
 * 呼び出し側（tools/quality-check.js）から注入してもらいます
 * （このファイル自体はjs/question-validator.jsへ依存しない設計を保つため）。
 * @returns {Array<{name, expectedRuleId, passed, detail}>}
 */
export function runSelfTest({ validateTemplateSet, validateCategoryRegistryAgainstTemplates, categoryRegistry, validateGeneratedQuestion }) {
  const results = [];

  for (const fixture of TEMPLATE_FIXTURES) {
    let detected = false;
    let detail = "";
    try {
      const { results: structuralResults } = validateTemplateSet(fixture.templates);
      const structuralErrors = structuralResults.flatMap((r) => r.errors);
      const crossResult = validateCategoryRegistryAgainstTemplates(categoryRegistry, fixture.templates);
      const allErrors = [...structuralErrors, ...crossResult.errors];
      detected = allErrors.length > 0;
      detail = allErrors.join(" / ");
    } catch (error) {
      detected = true;
      detail = `例外: ${error.message}`;
    }
    results.push({ name: fixture.name, expectedRuleId: fixture.expectedRuleId, passed: detected, detail });
  }

  for (const fixture of buildGeneratedQuestionFixtures()) {
    let detected = false;
    let detail = "";
    try {
      if (fixture.kind === "generatedQuestion") {
        const { valid, errors } = validateGeneratedQuestion(fixture.problem);
        detected = !valid;
        detail = errors.join(" / ");
      } else if (fixture.kind === "cardLeak") {
        const findings = checkSingleStepCardLeak(fixture.problem);
        detected = findings.length > 0;
        detail = findings.map((f) => f.message).join(" / ");
      } else if (fixture.kind === "cardStructure") {
        const findings = checkCardStructure(fixture.problem);
        detected = findings.length > 0;
        detail = findings.map((f) => f.message).join(" / ");
      } else if (fixture.kind === "text") {
        const { errors, warnings } = checkQuestionText(fixture.problem.text);
        detected = errors.length > 0 || warnings.length > 0;
        detail = [...errors, ...warnings].map((f) => f.message).join(" / ");
      } else if (fixture.kind === "mixedNumberPattern") {
        const findings = checkMixedNumberPatternClassification(fixture.problem);
        detected = findings.length > 0;
        detail = findings.map((f) => f.message).join(" / ");
      }
    } catch (error) {
      detected = true;
      detail = `例外: ${error.message}`;
    }
    results.push({ name: fixture.name, expectedRuleId: fixture.expectedRuleId, passed: detected, detail });
  }

  return results;
}
