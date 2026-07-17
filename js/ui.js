// 画面表示・DOM操作・カード操作（タップ／ドラッグ）を担当するモジュール。
// ゲームの状態（ハート数・スコア等）そのものは持たず、game.js から渡された値を
// 表示するだけに徹しています。
// 数値の表示は、必ず number-utils.js の formatNumber() を経由します
// （整数・小数・大きな数の表示をアプリ全体で統一するため）。

import { formatNumber } from "./number-utils.js";
import { percentToRatio } from "./percentage-utils.js";
import { isFractionValue, isPercentValue, computeUnsimplifiedFractionResult } from "./value-utils.js";
import {
  renderValueHtml,
  renderTextPartsHtml,
  renderPercentConversionHtml,
  renderRelationTableHtml,
  escapeHtml
} from "./value-renderer.js";
import {
  loadSelectedGradeTerm,
  saveSelectedGradeTerm,
  loadLastMode,
  saveLastMode,
  loadLastTrainingGradeTerm,
  saveLastTrainingGradeTerm,
  loadDefeatedEnemyIds,
  resetHighScoresAndEnemyDex
} from "./storage.js";
import {
  getGradeTermGroups,
  getCategoriesForGradeTerm,
  getCategoriesForGrade,
  getEnabledTrainingCategories
} from "../data/category-registry.js";
import { ENEMY_LIST, getAllEnemiesForDex, getEnemyUnlockHint } from "./enemy-list.js";
import {
  MIN_CUSTOM_TRAINING_QUESTIONS,
  MAX_CUSTOM_TRAINING_QUESTIONS,
  DEFAULT_CUSTOM_TRAINING_QUESTIONS,
  clampCustomTrainingQuestionCount,
  loadSanitizedCustomTrainingCategoryIds,
  saveCustomTrainingCategoryIds,
  clearCustomTrainingCategoryIds
} from "./custom-training.js";

const DRAG_THRESHOLD = 6;

// URL に ?debug=true を付けた場合だけ、タイトル画面に開発版の出題範囲
// 「2段階問題・整数（開発版）」を表示する。通常アクセスでは要素自体を作らない。
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "true";

let els = null;
let callbacks = {};
let inputLocked = false;

// 解答欄・選択肢カードの内部状態
// allCards は問題ごとに1度だけ生成され、順序は変化しない。
// カードが解答欄に配置されているかどうかは slots を見て判定するため、
// 選択肢側の見た目の並び順は常に固定される（配置済みのカードはその場で非表示になるだけ）。
let allCards = [];
let slots = [null, null, null]; // index0:数値 index1:演算記号 index2:数値

// ドラッグ操作の状態
let dragCandidate = null; // { card, source } source: {type:'pool'} | {type:'slot', index}
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let activePointerId = null;

let nextQuestionTapLock = false;

// トレーニングの「問題の しゅるい」ボタンをタップしてから、確認ダイアログの
// 「スタート」が押されるまでの間だけ保持する、開始予定の設定（gradeTerm・categoryId等）。
// ダイアログを閉じる（スタート／もどるのどちらでも）たびに null に戻す。
let pendingTrainingSettings = null;

// 総復習の「○年のまとめ」ボタンをタップしてから、確認ダイアログの
// 「スタート」が押されるまでの間だけ保持する、開始予定の設定（scope・label）。
// pendingTrainingSettings と同じ考え方。
let pendingReviewSettings = null;

// カスタムトレーニング（運用開始後に追加）の設定画面で、現在チェックされているカテゴリID一覧。
// 通常トレーニングの選択状態（学年・学期ボタン等）とは完全に別の変数で管理し、互いを上書きしない。
// 画面を開くたびに loadSanitizedCustomTrainingCategoryIds()（保存データ＋現在のレジストリと
// 照合済み）から復元する。チェックボックスの状態が変わるたびに、この変数と
// localStorage（saveCustomTrainingCategoryIds）の両方を更新する。
let customTrainingSelectedIds = [];

// カスタムトレーニングの出題問題数（メモリ上のみで保持。ページを再読み込みすると5問に戻る仕様
// のため、storage.js には保存しない）。設定画面とタイトル画面を行き来する間は維持する。
let customTrainingQuestionCount = DEFAULT_CUSTOM_TRAINING_QUESTIONS;

// 総復習のスコープキー（"4"|"5"|"6"|"all"）から、確認ダイアログの表示名を求める。
// js/ui.js は js/review-mode.js を import しない設計（js/game.js・js/training-mode.js が
// 互いを深く参照しないのと同じ方針）のため、確認ダイアログの文言を組み立てるために
// 必要な最小限のラベルだけを、ここに独立して持たせている（js/review-mode.js 側にも
// 同じマッピングがあるが、それぞれの用途に閉じた複製であり、まとめる必要はない）。
const REVIEW_SCOPE_LABELS = { "4": "4年のまとめ", "5": "5年のまとめ", "6": "6年のまとめ", all: "小学校のまとめ" };

// 総復習のスコープキーから、開始確認ダイアログに表示する初期ハート数を求める
// （js/review-mode.js の REVIEW_SCOPE_HEARTS と同じ値を持つ、上と同じ理由の独立した複製）。
const REVIEW_SCOPE_HEARTS_FOR_DIALOG = { "4": 3, "5": 3, "6": 3, all: 1 };

/**
 * 総復習モードの「○年のまとめ」スコープから、出題される問題数（＝そのスコープに属する
 * カテゴリ数。1カテゴリにつき1問）を求める。data/category-registry.js から動的に導出する
 * ため、カテゴリが増減しても自動的に追随する（13/17/20/50をハードコードしない）。
 */
function getReviewQuestionCountForScope(scope) {
  const categories = scope === "all" ? getEnabledTrainingCategories() : getCategoriesForGrade(scope);
  return categories.length;
}

function qs(id) {
  return document.getElementById(id);
}

function cacheElements() {
  els = {
    appEl: qs("app"),
    soundToggleBtn: qs("sound-toggle-btn"),
    helpBtn: qs("help-btn"),
    helpMenuTitle: qs("help-menu-title"),
    helpAboutBtn: qs("help-about-btn"),
    helpDexBtn: qs("help-dex-btn"),
    helpResetBtn: qs("help-reset-btn"),
    helpMenuBackBtn: qs("help-menu-back-btn"),
    resetRecordsDialog: qs("reset-records-confirm-dialog"),
    resetRecordsConfirmText: qs("reset-records-confirm-text"),
    resetRecordsDialogButtons: qs("reset-records-dialog-buttons"),
    resetRecordsYesBtn: qs("reset-records-confirm-yes"),
    resetRecordsNoBtn: qs("reset-records-confirm-no"),
    aboutTitle: qs("about-title"),
    aboutBackBtn: qs("about-back-btn"),
    enemyDexTitle: qs("enemy-dex-title"),
    enemyDexBackBtn: qs("enemy-dex-back-btn"),
    enemyDexProgress: qs("enemy-dex-progress"),
    enemyDexGrid: qs("enemy-dex-grid"),
    modeSelect: qs("mode-select"),
    appSubtitle: qs("app-subtitle"),
    enemyPreviewTrack: qs("enemy-preview-track"),
    battleSettings: qs("battle-settings"),
    trainingSettings: qs("training-settings"),
    reviewSettings: qs("review-settings"),
    trainingGradeSelect: qs("training-grade-select"),
    trainingTermSelect: qs("training-term-select"),
    trainingCategorySelect: qs("training-category-select"),
    reviewScopeSelect: qs("review-scope-select"),
    rangeGradeSelect: qs("range-grade-select"),
    rangeTermSelect: qs("range-term-select"),
    rangeDevSelect: qs("range-dev-select"),
    levelSelect: qs("level-select"),
    startBtn: qs("start-btn"),
    trainingStartDialog: qs("training-start-confirm-dialog"),
    trainingStartConfirmText: qs("training-start-confirm-text"),
    trainingStartYesBtn: qs("training-start-confirm-yes"),
    trainingStartNoBtn: qs("training-start-confirm-no"),

    // カスタムトレーニング設定画面（運用開始後に追加）
    customTrainingGearBtn: qs("custom-training-gear-btn"),
    customTrainingTitle: qs("custom-training-title"),
    customTrainingBackBtn: qs("custom-training-back-btn"),
    customTrainingCountSlider: qs("custom-training-count-slider"),
    customTrainingCountValue: qs("custom-training-count-value"),
    customTrainingSelectedCount: qs("custom-training-selected-count"),
    customTrainingCategoryList: qs("custom-training-category-list"),
    customTrainingErrorMessage: qs("custom-training-error-message"),
    customTrainingToggleAllBtn: qs("custom-training-toggle-all-btn"),
    customTrainingStartBtn: qs("custom-training-start-btn"),
    reviewStartDialog: qs("review-start-confirm-dialog"),
    reviewStartConfirmText: qs("review-start-confirm-text"),
    reviewStartYesBtn: qs("review-start-confirm-yes"),
    reviewStartNoBtn: qs("review-start-confirm-no"),

    countdownText: qs("countdown-text"),

    retireBtn: qs("retire-btn"),
    scoreDisplay: qs("score-display"),
    rankDisplay: qs("rank-display"),
    scoreDelta: qs("score-delta"),
    trainingStatusLabel: qs("training-status-label"),
    trainingCategoryDisplay: qs("training-category-display"),
    trainingProgress: qs("training-progress"),
    reviewModeDisplay: qs("review-mode-display"),
    reviewProgressDisplay: qs("review-progress-display"),
    elapsedTimeDisplay: qs("elapsed-time-display"),
    enemyEmoji: qs("enemy-emoji"),
    enemyName: qs("enemy-name"),
    enemyHpFill: qs("enemy-hp-fill"),
    questionText: qs("question-text"),
    stepIndicator: qs("step-indicator"),
    relationTableContainer: qs("relation-table-container"),
    intermediateMark: qs("intermediate-mark"),
    heartsContainer: qs("hearts-container"),
    timerFill: qs("timer-fill"),
    answerSlots: [qs("answer-slot-0"), qs("answer-slot-1"), qs("answer-slot-2")],
    judgeBtn: qs("judge-btn"),
    resultBox: qs("result-box"),
    clearSlotsBtn: qs("clear-slots-btn"),
    choicesContainer: qs("choices-container"),
    correctMark: qs("correct-mark"),
    battleMessage: qs("battle-message"),
    tapToContinue: qs("tap-to-continue"),
    retrySameQuestionBtn: qs("retry-same-question-btn"),
    retireDialog: qs("retire-confirm-dialog"),
    retireConfirmText: qs("retire-confirm-text"),
    retireYesBtn: qs("retire-confirm-yes"),
    retireNoBtn: qs("retire-confirm-no"),
    damageFlash: qs("damage-flash"),
    dangerOverlay: qs("danger-overlay"),
    dragGhost: qs("drag-ghost"),
    screenBattle: qs("screen-battle"),

    resultTitle: qs("result-title"),
    resultEnemyComment: qs("result-enemy-comment"),
    resultEnemyEmoji: qs("result-enemy-emoji"),
    resultEnemyName: qs("result-enemy-name"),
    resultEnemyText: qs("result-enemy-text"),
    resultRange: qs("result-range"),
    resultLevel: qs("result-level"),
    resultCorrectCount: qs("result-correct-count"),
    resultScore: qs("result-score"),
    resultRank: qs("result-rank"),
    resultHighscore: qs("result-highscore"),
    resultNewRecord: qs("result-newrecord"),
    resultTrainingCategory: qs("result-training-category"),
    resultTrainingCompleted: qs("result-training-completed"),
    resultTrainingFirstTry: qs("result-training-firsttry"),
    resultTrainingWrongCount: qs("result-training-wrongcount"),
    resultReviewMode: qs("result-review-mode"),
    resultReviewElapsed: qs("result-review-elapsed"),
    retryBtn: qs("retry-btn"),
    toTitleBtn: qs("to-title-btn"),
    historyList: qs("history-list")
  };
}

// ============== 画面切り替え ==============

export function showScreen(name) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active-screen"));
  const target = qs(`screen-${name}`);
  if (target) {
    target.classList.add("active-screen");
  }
}

// ============== タイトル画面 ==============

/**
 * タイトル画面の「右へスクロールし、左から出現してループする」エネミー一覧を、
 * js/enemy-list.js の ENEMY_LIST から動的に生成する。継ぎ目の無いループにするため、
 * 一覧をそのまま2セット分並べる（詳しくは css/style.css の .enemy-preview-track を参照）。
 * エネミーを追加・変更しても、このファイルや index.html を書き換える必要はない。
 */
function populateEnemyPreview() {
  if (!els.enemyPreviewTrack) return;
  const doubled = [...ENEMY_LIST, ...ENEMY_LIST];
  els.enemyPreviewTrack.innerHTML = doubled.map((enemy) => `<span>${escapeHtml(enemy.emoji)}</span>`).join("");
}

function setupTitleScreen() {
  populateEnemyPreview();

  els.soundToggleBtn.addEventListener("click", () => {
    callbacks.onSoundToggle && callbacks.onSoundToggle();
  });

  els.rangeGradeSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".grade-btn");
    if (!btn || btn.disabled) return;
    selectRangeGradeButton(btn);
    saveSelectedGradeTerm(getSelectedBattleGradeTerm());
  });

  els.rangeTermSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".term-btn");
    if (!btn || btn.disabled) return;
    selectRangeTermButton(btn);
    saveSelectedGradeTerm(getSelectedBattleGradeTerm());
  });

  // 開発版の特殊な出題範囲（?debug=true限定）。学年・学期ボタンとは独立した選択枠のため、
  // 選ばれると学年・学期側の選択状態を解除し、getSelectedBattleGradeTerm() が
  // このボタンの値を優先して返す（selectDevRangeButton参照）。
  els.rangeDevSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".dev-range-btn");
    if (!btn) return;
    selectDevRangeButton(btn);
    saveSelectedGradeTerm(getSelectedBattleGradeTerm());
  });

  els.levelSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".level-btn");
    if (!btn) return;
    els.levelSelect.querySelectorAll(".level-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
  });

  els.modeSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-btn");
    if (!btn) return;
    selectMode(btn.dataset.mode);
    saveLastMode(btn.dataset.mode);
  });

  els.trainingGradeSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".grade-btn");
    if (!btn) return;
    selectTrainingGradeButton(btn);
    const gradeTerm = getSelectedTrainingGradeTerm();
    if (gradeTerm) {
      saveLastTrainingGradeTerm(gradeTerm);
      populateTrainingCategorySelect(gradeTerm);
    }
  });

  els.trainingTermSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".term-btn");
    if (!btn) return;
    selectTrainingTermButton(btn);
    const gradeTerm = getSelectedTrainingGradeTerm();
    if (gradeTerm) {
      saveLastTrainingGradeTerm(gradeTerm);
      populateTrainingCategorySelect(gradeTerm);
    }
  });

  // カテゴリボタンをタップすると、そのカテゴリで本当にトレーニングを始めてよいかの
  // 確認ダイアログ（training-start-confirm-dialog）を開く。カテゴリボタン自体には
  // 「選択状態」の見た目を持たせない（どのボタンをタップしても、常に同じ確認フローになるため）。
  // 学年・学期は populateTrainingGradeTermSelect() が起動時に必ず1つずつ選択済みにするため、
  // ここで未選択を気にする必要はない。
  els.trainingCategorySelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-btn");
    if (!btn) return;
    pendingTrainingSettings = {
      mode: "training",
      gradeTerm: getSelectedTrainingGradeTerm(),
      categoryId: btn.dataset.categoryId,
      categoryLabel: btn.textContent
    };
    showTrainingStartDialog(btn.textContent);
  });

  // 総復習の「○年のまとめ」ボタンをタップすると、確認ダイアログ
  // （review-start-confirm-dialog）を開く。トレーニングのカテゴリボタンと同じく、
  // ボタン自体には「選択状態」の見た目を持たせない。
  els.reviewScopeSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".range-btn");
    if (!btn) return;
    const scope = btn.dataset.scope;
    const label = REVIEW_SCOPE_LABELS[scope] || scope;
    pendingReviewSettings = { mode: "review", scope, label };
    const heartCount = REVIEW_SCOPE_HEARTS_FOR_DIALOG[scope] || 3;
    showReviewStartDialog(label, getReviewQuestionCountForScope(scope), heartCount);
  });

  // このボタンはバトルモード専用（.battle-only。トレーニング・総復習モードでは非表示）。
  els.startBtn.addEventListener("click", () => {
    const levelBtn = els.levelSelect.querySelector(".level-btn.selected");
    const settings = {
      mode: "battle",
      gradeTerm: getSelectedBattleGradeTerm(),
      level: levelBtn ? Number.parseInt(levelBtn.dataset.level, 10) : 1
    };
    callbacks.onStart && callbacks.onStart(settings);
  });

  if (DEBUG_MODE) {
    addDevMultiStepRangeOption();
  }

  restoreSelectedGradeTerm();
  populateTrainingGradeTermSelect();
  restoreSelectedMode();
}

// バトルモードで「開発版」の出題範囲（?debug=true限定）が選ばれているかどうか。
// 学年・学期ボタンとは独立した選択枠のため、専用のフラグで管理する。
let devRangeSelected = false;

function selectRangeGradeButton(btn) {
  devRangeSelected = false;
  els.rangeDevSelect.querySelectorAll(".dev-range-btn").forEach((b) => b.classList.remove("selected"));
  els.rangeGradeSelect.querySelectorAll(".grade-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

function selectRangeTermButton(btn) {
  devRangeSelected = false;
  els.rangeDevSelect.querySelectorAll(".dev-range-btn").forEach((b) => b.classList.remove("selected"));
  els.rangeTermSelect.querySelectorAll(".term-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

function selectDevRangeButton(btn) {
  devRangeSelected = true;
  els.rangeGradeSelect.querySelectorAll(".grade-btn").forEach((b) => b.classList.remove("selected"));
  els.rangeTermSelect.querySelectorAll(".term-btn").forEach((b) => b.classList.remove("selected"));
  els.rangeDevSelect.querySelectorAll(".dev-range-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

/**
 * バトルモードで現在選択されている出題範囲（gradeTerm）を、学年ボタン・学期ボタンの
 * 選択状態から組み立てる。開発版ボタン（?debug=true限定）が選ばれている場合は、
 * 学年・学期の組み合わせではなくそのボタンの値（"4-multi-step"）を返す。
 */
function getSelectedBattleGradeTerm() {
  if (devRangeSelected) {
    const devBtn = els.rangeDevSelect.querySelector(".dev-range-btn.selected");
    if (devBtn) return devBtn.dataset.range;
  }
  const gradeBtn = els.rangeGradeSelect.querySelector(".grade-btn.selected");
  const termBtn = els.rangeTermSelect.querySelector(".term-btn.selected");
  const grade = gradeBtn ? gradeBtn.dataset.grade : "4";
  const term = termBtn ? termBtn.dataset.term : "1";
  return `${grade}-${term}`;
}

/**
 * 前回選択した出題範囲を localStorage から復元する。
 * 保存値が無い場合、あるいは実際に選択可能なボタンと一致しない場合
 * （不正な値・?debug=true を外したことで開発版ボタンが無くなった場合など）は、
 * index.html 側で最初から選択済みになっている小学4年生1学期のままにする。
 */
function restoreSelectedGradeTerm() {
  const saved = loadSelectedGradeTerm();
  if (!saved) return;
  if (saved === "4-multi-step") {
    const devBtn = els.rangeDevSelect.querySelector('.dev-range-btn[data-range="4-multi-step"]');
    if (devBtn) selectDevRangeButton(devBtn);
    return;
  }
  const match = /^(\d+)-(\d+)$/.exec(saved);
  if (!match) return;
  const gradeBtn = els.rangeGradeSelect.querySelector(`.grade-btn[data-grade="${match[1]}"]`);
  const termBtn = els.rangeTermSelect.querySelector(`.term-btn[data-term="${match[2]}"]`);
  if (gradeBtn) selectRangeGradeButton(gradeBtn);
  if (termBtn) selectRangeTermButton(termBtn);
}

// ============== モード選択（通常バトル／トレーニング／総復習） ==============

/**
 * モードを切り替える。#app 要素に mode-training / mode-review クラスを付け外しすることで、
 * タイトル画面の設定ブロックの出し分けと、バトル画面・結果画面の
 * バトル専用要素／トレーニング専用要素／総復習専用要素（.battle-only / .training-only /
 * .review-only / .hide-in-training）の出し分けの両方を、CSS側でまとめて行う
 * （js/ui.js に個別のif分岐を増やさないため）。
 */
export function setMode(mode) {
  els.appEl.classList.toggle("mode-training", mode === "training");
  els.appEl.classList.toggle("mode-review", mode === "review");
}

// タイトル画面のサブタイトル（アプリタイトルの下の説明文）。運用開始後、モード切り替え
// ボタンの下へ移動し、選んでいるモードに応じて文言が変わるようにした。
const MODE_SUBTITLES = {
  battle: "式をつくって エネミーを たおそう！",
  training: "せいげん時間なし、問題パターンをえらんで練習！",
  review: "じっくり考えて、全パターンの問題に正解しよう！"
};

function updateModeSubtitle(mode) {
  if (!els.appSubtitle) return;
  els.appSubtitle.textContent = MODE_SUBTITLES[mode] || MODE_SUBTITLES.battle;
}

function selectMode(mode) {
  els.modeSelect.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("selected"));
  const target = els.modeSelect.querySelector(`.mode-btn[data-mode="${mode}"]`) || els.modeSelect.querySelector(".mode-btn");
  target.classList.add("selected");
  setMode(target.dataset.mode);
  updateModeSubtitle(target.dataset.mode);
}

function restoreSelectedMode() {
  const saved = loadLastMode();
  selectMode(saved === "training" || saved === "review" ? saved : "battle");
}

// ============== トレーニング：学年学期・カテゴリ選択（category-registry.js から動的生成） ==============

function selectTrainingGradeButton(btn) {
  els.trainingGradeSelect.querySelectorAll(".grade-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

function selectTrainingTermButton(btn) {
  els.trainingTermSelect.querySelectorAll(".term-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

/**
 * トレーニングモードで現在選択されている学年・学期（gradeTerm）を、学年ボタン・学期ボタンの
 * 選択状態から組み立てる。どちらも未選択（populateTrainingGradeTermSelect() 実行前など）の
 * 場合は null を返す。
 */
function getSelectedTrainingGradeTerm() {
  const gradeBtn = els.trainingGradeSelect.querySelector(".grade-btn.selected");
  const termBtn = els.trainingTermSelect.querySelector(".term-btn.selected");
  if (!gradeBtn || !termBtn) return null;
  return `${gradeBtn.dataset.grade}-${termBtn.dataset.term}`;
}

/**
 * data/category-registry.js の getGradeTermGroups() から、トレーニングで選べる
 * 学年ボタン・学期ボタンを動的に生成する。個別の学年・学期をここにハードコードしない
 * （実際に存在する gradeTerm の組み合わせから、学年・学期それぞれの一覧を導出する）。
 */
function populateTrainingGradeTermSelect() {
  const groups = getGradeTermGroups();
  const grades = [...new Set(groups.map((g) => g.gradeTerm.split("-")[0]))].sort();
  const terms = [...new Set(groups.map((g) => g.gradeTerm.split("-")[1]))].sort();

  els.trainingGradeSelect.innerHTML = "";
  for (const grade of grades) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "range-btn gradeterm-btn grade-btn";
    btn.dataset.grade = grade;
    btn.textContent = `${grade}年`;
    els.trainingGradeSelect.appendChild(btn);
  }

  els.trainingTermSelect.innerHTML = "";
  for (const term of terms) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "range-btn gradeterm-btn term-btn";
    btn.dataset.term = term;
    btn.textContent = `${term}学期`;
    els.trainingTermSelect.appendChild(btn);
  }

  const savedGradeTerm = loadLastTrainingGradeTerm();
  const isSavedValid = groups.some((g) => g.gradeTerm === savedGradeTerm);
  const [initialGrade, initialTerm] = (isSavedValid ? savedGradeTerm : `${grades[0]}-${terms[0]}`).split("-");

  const gradeBtn = els.trainingGradeSelect.querySelector(`.grade-btn[data-grade="${initialGrade}"]`);
  const termBtn = els.trainingTermSelect.querySelector(`.term-btn[data-term="${initialTerm}"]`);
  if (gradeBtn) selectTrainingGradeButton(gradeBtn);
  if (termBtn) selectTrainingTermButton(termBtn);

  const initialGradeTerm = getSelectedTrainingGradeTerm();
  if (initialGradeTerm) {
    populateTrainingCategorySelect(initialGradeTerm);
  }
}

/**
 * data/category-registry.js の getCategoriesForGradeTerm() から、選択中の学年学期に
 * 属するカテゴリ選択ボタンを動的に生成する。個別のカテゴリ名をここにハードコードしない。
 * カテゴリボタンはタップした時点で確認ダイアログを開くだけのため（選択状態を持たない）、
 * ここで初期選択を行う必要はない。
 */
function populateTrainingCategorySelect(gradeTerm) {
  const categories = getCategoriesForGradeTerm(gradeTerm);
  els.trainingCategorySelect.innerHTML = "";
  for (const category of categories) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "level-btn category-btn";
    btn.dataset.categoryId = category.id;
    btn.textContent = category.label;
    els.trainingCategorySelect.appendChild(btn);
  }
}

// ============== カスタムトレーニング設定画面（運用開始後に追加） ==============
//
// 複数カテゴリ・5〜50問を自由に設定できるトレーニングのバリエーション。ゲーム進行は
// 既存のトレーニング画面（training-only要素）をそのまま使うため、ここで扱うのは
// 「設定」だけ（選択カテゴリ・問題数の管理と、開始時に js/training-mode.js の
// startTraining() へ渡す設定オブジェクトの組み立て）。

/**
 * 出題問題数の表示（スライダー付近の「20問」等）を更新する。
 */
function updateCustomTrainingCountDisplay() {
  if (els.customTrainingCountValue) {
    els.customTrainingCountValue.textContent = `${customTrainingQuestionCount}問`;
  }
  if (els.customTrainingCountSlider) {
    els.customTrainingCountSlider.value = String(customTrainingQuestionCount);
    els.customTrainingCountSlider.setAttribute("aria-valuetext", `${customTrainingQuestionCount}問`);
  }
}

/**
 * 選択中のカテゴリ数表示（「選択中：8カテゴリ」）と、スタートボタンの有効/無効を更新する。
 * aria-live="polite" な要素（index.html側で指定済み）のため、変更するたびに自動で読み上げられる。
 */
function updateCustomTrainingSelectedCount() {
  if (els.customTrainingSelectedCount) {
    els.customTrainingSelectedCount.textContent = `選択中：${customTrainingSelectedIds.length}カテゴリ`;
  }
  if (els.customTrainingStartBtn) {
    els.customTrainingStartBtn.disabled = customTrainingSelectedIds.length === 0;
  }
  updateCustomTrainingToggleAllBtnLabel();
  hideCustomTrainingErrorMessage();
}

/**
 * 画面下部のボタンの文言を選択状況に応じて切り替える（運用開始後に変更。以前は常に
 * 「設定リセット」という固定文言の全解除ボタンだった）。選択中のカテゴリが0のときは
 * 「すべてON」（押すと全カテゴリを選択）、1つ以上選ばれているときは「すべてOFF」
 * （押すと全カテゴリの選択を解除）にする。
 */
function updateCustomTrainingToggleAllBtnLabel() {
  if (!els.customTrainingToggleAllBtn) return;
  els.customTrainingToggleAllBtn.textContent = customTrainingSelectedIds.length === 0 ? "すべてON" : "すべてOFF";
}

function showCustomTrainingErrorMessage(text) {
  if (!els.customTrainingErrorMessage) return;
  els.customTrainingErrorMessage.textContent = text;
  els.customTrainingErrorMessage.hidden = false;
}

function hideCustomTrainingErrorMessage() {
  if (!els.customTrainingErrorMessage) return;
  els.customTrainingErrorMessage.hidden = true;
  els.customTrainingErrorMessage.textContent = "";
}

/**
 * data/category-registry.js の getEnabledTrainingCategories() から、学年・学期ごとに
 * 見出しを付けたチェックボックス一覧を動的に生成する。カテゴリの追加・削除は
 * レジストリ側だけで完結し、このファイルを書き換える必要は無い。
 * 各チェックボックスの value / data-category-id には、安定した categoryId を使う
 * （表示名 label はレジストリ変更で変わりうるため、抽出・保存には使わない）。
 *
 * 学年・学期グループの見出し（.custom-training-group-heading）にもチェックボックスを持たせ、
 * 配下のカテゴリチェックボックス（.custom-training-category-item input）と同じ
 * .custom-training-group 内に入れ子で配置する（運用開始後に追加）。これにより、
 * 大カテゴリのチェックボックスから querySelectorAll() で配下のカテゴリだけを
 * まとめて取得できる（handleCustomTrainingGroupCheckboxChange() /
 * handleCustomTrainingCategoryCheckboxChange() 参照）。
 * 大カテゴリのチェックボックスの初期状態は、配下の全カテゴリが選択済みかどうかで決める。
 */
function renderCustomTrainingCategoryList() {
  if (!els.customTrainingCategoryList) return;
  const categories = getEnabledTrainingCategories();
  const selectedSet = new Set(customTrainingSelectedIds);

  const fragment = document.createDocumentFragment();
  let currentGroupEl = null;
  let currentGradeTerm = null;
  for (const category of categories) {
    if (category.gradeTerm !== currentGradeTerm) {
      currentGradeTerm = category.gradeTerm;
      currentGroupEl = document.createElement("div");
      currentGroupEl.className = "custom-training-group";

      const heading = document.createElement("label");
      heading.className = "custom-training-group-heading";

      const groupCheckbox = document.createElement("input");
      groupCheckbox.type = "checkbox";
      groupCheckbox.dataset.groupGradeTerm = category.gradeTerm;
      const totalInGroup = categories.filter((c) => c.gradeTerm === category.gradeTerm).length;
      const selectedInGroup = categories.filter((c) => c.gradeTerm === category.gradeTerm && selectedSet.has(c.id)).length;
      groupCheckbox.checked = totalInGroup > 0 && selectedInGroup === totalInGroup;

      const headingText = document.createElement("span");
      headingText.textContent = category.gradeLabel;

      heading.appendChild(groupCheckbox);
      heading.appendChild(headingText);
      currentGroupEl.appendChild(heading);
      fragment.appendChild(currentGroupEl);
    }

    const label = document.createElement("label");
    label.className = "custom-training-category-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = category.id;
    checkbox.dataset.categoryId = category.id;
    checkbox.checked = selectedSet.has(category.id);

    const textSpan = document.createElement("span");
    textSpan.textContent = category.label;

    label.appendChild(checkbox);
    label.appendChild(textSpan);
    currentGroupEl.appendChild(label);
  }

  els.customTrainingCategoryList.innerHTML = "";
  els.customTrainingCategoryList.appendChild(fragment);
}

/**
 * 大カテゴリ（学年・学期）のチェックボックスが操作されたときの処理（運用開始後に追加）。
 * ONにすると、同じ .custom-training-group 内の個別カテゴリをすべてONにする。
 * OFFにすると、同じグループ内の個別カテゴリをすべてOFFにする。
 */
function handleCustomTrainingGroupCheckboxChange(groupCheckbox) {
  const groupEl = groupCheckbox.closest(".custom-training-group");
  if (!groupEl) return;
  const shouldCheck = groupCheckbox.checked;
  const selectedSet = new Set(customTrainingSelectedIds);

  groupEl.querySelectorAll('input[type="checkbox"][data-category-id]').forEach((cb) => {
    cb.checked = shouldCheck;
    if (shouldCheck) {
      selectedSet.add(cb.dataset.categoryId);
    } else {
      selectedSet.delete(cb.dataset.categoryId);
    }
  });

  customTrainingSelectedIds = [...selectedSet];
  saveCustomTrainingCategoryIds(customTrainingSelectedIds);
  updateCustomTrainingSelectedCount();
}

/**
 * 個別カテゴリのチェックボックスが操作されたときの処理。従来の選択状態の更新に加えて、
 * 同じグループ内の個別カテゴリが全てONになったかどうかで、大カテゴリのチェックボックスの
 * 状態も同期させる（運用開始後に追加。1つでもOFFにすれば大カテゴリはOFFになり、
 * 逆にすべてONになれば大カテゴリも自動でONになる）。
 */
function handleCustomTrainingCategoryCheckboxChange(checkbox) {
  const categoryId = checkbox.dataset.categoryId;
  if (checkbox.checked) {
    if (!customTrainingSelectedIds.includes(categoryId)) {
      customTrainingSelectedIds = [...customTrainingSelectedIds, categoryId];
    }
  } else {
    customTrainingSelectedIds = customTrainingSelectedIds.filter((id) => id !== categoryId);
  }
  saveCustomTrainingCategoryIds(customTrainingSelectedIds);

  const groupEl = checkbox.closest(".custom-training-group");
  const groupCheckbox = groupEl ? groupEl.querySelector('input[type="checkbox"][data-group-grade-term]') : null;
  if (groupCheckbox) {
    const itemCheckboxes = [...groupEl.querySelectorAll('input[type="checkbox"][data-category-id]')];
    groupCheckbox.checked = itemCheckboxes.length > 0 && itemCheckboxes.every((cb) => cb.checked);
  }

  updateCustomTrainingSelectedCount();
}

function setupCustomTrainingSettings() {
  els.customTrainingGearBtn.addEventListener("click", openCustomTrainingSettings);
  els.customTrainingBackBtn.addEventListener("click", closeCustomTrainingSettingsToTitle);

  els.customTrainingCountSlider.addEventListener("input", (e) => {
    customTrainingQuestionCount = clampCustomTrainingQuestionCount(e.target.value);
    updateCustomTrainingCountDisplay();
  });

  els.customTrainingCategoryList.addEventListener("change", (e) => {
    const checkbox = e.target.closest('input[type="checkbox"]');
    if (!checkbox) return;
    if (checkbox.dataset.groupGradeTerm !== undefined) {
      handleCustomTrainingGroupCheckboxChange(checkbox);
    } else {
      handleCustomTrainingCategoryCheckboxChange(checkbox);
    }
  });

  els.customTrainingToggleAllBtn.addEventListener("click", () => {
    // 選択中が0件なら全カテゴリをON、1件以上あれば全カテゴリをOFFにする
    // （運用開始後に変更。以前は常に全解除だけを行う「設定リセット」ボタンだった）。
    const shouldSelectAll = customTrainingSelectedIds.length === 0;
    customTrainingSelectedIds = shouldSelectAll ? getEnabledTrainingCategories().map((c) => c.id) : [];
    if (shouldSelectAll) {
      saveCustomTrainingCategoryIds(customTrainingSelectedIds);
    } else {
      clearCustomTrainingCategoryIds();
    }
    // 問題数スライダーは変更しない（第12章の仕様）。カテゴリのチェック（大カテゴリ・
    // 個別カテゴリの両方）だけをまとめて切り替える。
    els.customTrainingCategoryList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = shouldSelectAll;
    });
    updateCustomTrainingSelectedCount();
    focusElement(els.customTrainingToggleAllBtn);
  });

  els.customTrainingStartBtn.addEventListener("click", () => {
    // ボタン自体はcustomTrainingSelectedIdsが空のときdisabledになるが、DOM操作等で
    // 無効化が解除された場合に備え、開始処理側でも改めて0件かどうかを確認する。
    if (customTrainingSelectedIds.length === 0) {
      showCustomTrainingErrorMessage("出題するカテゴリを1つ以上選んでください。");
      return;
    }
    hideCustomTrainingErrorMessage();
    callbacks.onStart &&
      callbacks.onStart({
        mode: "training",
        trainingVariant: "custom",
        selectedCategoryIds: [...customTrainingSelectedIds],
        totalQuestions: customTrainingQuestionCount
      });
  });
}

function openCustomTrainingSettings() {
  customTrainingSelectedIds = loadSanitizedCustomTrainingCategoryIds();
  renderCustomTrainingCategoryList();
  updateCustomTrainingSelectedCount();
  updateCustomTrainingCountDisplay();
  hideCustomTrainingErrorMessage();
  showScreen("custom-training-settings");
  focusElement(els.customTrainingTitle);
}

function closeCustomTrainingSettingsToTitle() {
  showScreen("title");
  focusElement(els.customTrainingGearBtn);
}

/**
 * ?debug=true のときだけ、タイトル画面に開発版の出題範囲ボタンを追加する。
 * index.html には最初から書かず、ここで動的に生成することで、
 * 通常アクセス時にはDOM上にも一切存在しない状態にしている。
 */
function addDevMultiStepRangeOption() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "range-btn dev-range-btn";
  btn.dataset.range = "4-multi-step";
  btn.innerHTML = "2段階問題・整数<br />（開発版）";
  els.rangeDevSelect.appendChild(btn);
}

export function setSoundIcon(enabled) {
  els.soundToggleBtn.textContent = enabled ? "🔊" : "🔇";
}

// ============== カウントダウン画面 ==============

export function setCountdownText(text) {
  els.countdownText.textContent = text;
  els.countdownText.classList.remove("countdown-pop");
  // reflow を挟んでアニメーションを再生させる
  void els.countdownText.offsetWidth;
  els.countdownText.classList.add("countdown-pop");
}

// ============== バトル画面：基本表示 ==============

export function setEnemy(enemy) {
  els.enemyEmoji.classList.remove("enemy-shake", "enemy-defeated", "enemy-danger");
  els.enemyEmoji.style.filter = "";
  setDangerOverlayIntensity(0);
  els.enemyEmoji.textContent = enemy.emoji;
  els.enemyName.textContent = enemy.name;
}

export function updateEnemyHp(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  els.enemyHpFill.style.width = `${clamped}%`;
}

/**
 * 画面全体をうっすら赤く点滅させる演出（.danger-overlay）の強さを更新する。
 * intensity が 0 のときは演出を止め、0より大きいときは点滅アニメーションを有効にし、
 * 点滅の最小/最大の不透明度を intensity に応じてCSS変数で指定する。
 */
function setDangerOverlayIntensity(intensity) {
  if (!els.dangerOverlay) return;
  if (intensity <= 0) {
    els.dangerOverlay.classList.remove("pulse");
    els.dangerOverlay.style.removeProperty("--danger-overlay-min");
    els.dangerOverlay.style.removeProperty("--danger-overlay-max");
    return;
  }
  els.dangerOverlay.classList.add("pulse");
  els.dangerOverlay.style.setProperty("--danger-overlay-min", (0.02 + intensity * 0.05).toFixed(3));
  els.dangerOverlay.style.setProperty("--danger-overlay-max", (0.05 + intensity * 0.12).toFixed(3));
}

/**
 * 解答時間ゲージの残量比率（0〜1）に応じて、エネミーを赤く光らせる演出と、
 * それに合わせた画面全体の赤い点滅演出（.danger-overlay）を更新する。
 * 残量が50%を下回ったときだけ発動し、0%に近づくほど強く（にじみ・点滅が濃く）なる。
 * 50%以上に回復した場合は、両方とも通常の見た目に戻す。
 */
export function updateEnemyDangerGlow(ratio) {
  if (!els.enemyEmoji) return;
  if (ratio >= 0.5) {
    els.enemyEmoji.classList.remove("enemy-danger");
    els.enemyEmoji.style.filter = "";
    setDangerOverlayIntensity(0);
    return;
  }
  const intensity = Math.min(1, Math.max(0, 1 - ratio / 0.5));
  els.enemyEmoji.classList.add("enemy-danger");
  const blur = Math.round(6 + intensity * 16);
  const alpha = (0.45 + intensity * 0.5).toFixed(2);
  els.enemyEmoji.style.filter =
    `drop-shadow(0 0 ${blur}px rgba(255, 45, 45, ${alpha})) drop-shadow(0 6px 6px rgba(0, 0, 0, 0.4))`;
  setDangerOverlayIntensity(intensity);
}

export function updateHearts(current, max) {
  els.heartsContainer.innerHTML = "";
  for (let i = 0; i < max; i++) {
    const span = document.createElement("span");
    span.className = "heart-icon";
    span.textContent = i < current ? "❤️" : "🖤";
    els.heartsContainer.appendChild(span);
  }
}

export function updateTimer(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  els.timerFill.style.width = `${clamped}%`;
  els.timerFill.classList.toggle("timer-warning", clamped <= 25);
}

/**
 * 秒数を「M分S秒」の表示用文字列に変換する（総復習モードの経過時間表示用）。
 */
function formatElapsedTime(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}分${seconds}秒`;
}

/**
 * 総復習モード専用。ゲームスタート（1問目開始）からの経過時間を、時間制限ゲージ
 * （.timer-bar、バトル専用）と同じ場所に表示する。js/review-mode.js が1秒おきに呼び出す。
 */
export function updateElapsedTime(totalSeconds) {
  if (!els.elapsedTimeDisplay) return;
  els.elapsedTimeDisplay.textContent = `けいか時間 ${formatElapsedTime(totalSeconds)}`;
}

// ランクの並び（H が最低、SS が最高）。score.js の RANK_TABLE + TOP_RANK と対応させている。
const RANK_ORDER = ["H", "G", "F", "E", "D", "C", "B", "A", "S", "SS"];
// S・SS ランクのときだけ、ランクカードを光らせる。
const RANK_GLOW_THRESHOLD_INDEX = RANK_ORDER.indexOf("S");

/**
 * ランク文字列（"S+" のようにノーミス表示の "+" が付いている場合はそれを除いた基準ランク）から、
 * ランクカードの背景色を求める。H(青)→中間(緑〜黄緑)→A(黄)にかけて色相を連続的に変化させ、
 * 最高位のSSだけは金色で固定する。
 */
function getRankBadgeColor(baseRank) {
  const idx = RANK_ORDER.indexOf(baseRank);
  if (idx === -1) return null;
  if (idx >= RANK_GLOW_THRESHOLD_INDEX) {
    // S・SS は金色（SSはより明るい金色のグラデーションにする）。
    return baseRank === "SS" ? "linear-gradient(180deg, #fff2b0, #ffd700)" : "#ffcb3d";
  }
  // 色相: H(idx0)=215(青) → A(idx7)=48(黄) にかけて線形に変化させる。
  const hue = 215 - ((215 - 48) * idx) / (RANK_GLOW_THRESHOLD_INDEX - 1);
  return `hsl(${hue}, 78%, 55%)`;
}

/**
 * ランクカードの色・光る演出を、現在のランクに応じて更新する。
 * 特別ランク「MAX"（全問タイムボーナス上限でクリア。運用開始後に追加）のときだけ、
 * 通常のランク色（インラインstyle.background）ではなく、CSS側の虹色グラデーション
 * （.rank-max）で光らせる。そのため、通常ランクのインライン背景色を必ず解除しておく。
 */
function applyRankBadgeStyle(rank) {
  if (!els.rankDisplay) return;
  if (rank === "MAX") {
    els.rankDisplay.style.background = "";
    els.rankDisplay.classList.remove("rank-badge-glow");
    els.rankDisplay.classList.add("rank-max");
    return;
  }
  els.rankDisplay.classList.remove("rank-max");
  const baseRank = String(rank).replace("+", "");
  const color = getRankBadgeColor(baseRank);
  if (color) {
    els.rankDisplay.style.background = color;
  }
  const idx = RANK_ORDER.indexOf(baseRank);
  els.rankDisplay.classList.toggle("rank-badge-glow", idx >= RANK_GLOW_THRESHOLD_INDEX);
}

// スコア表示のカウントアップ演出用。
let scoreAnimationHandle = null;
const SCORE_COUNTUP_DURATION_MS = 700;

function setScoreDisplayInstant(score) {
  if (scoreAnimationHandle !== null) {
    cancelAnimationFrame(scoreAnimationHandle);
    scoreAnimationHandle = null;
  }
  els.scoreDisplay.textContent = String(score);
}

/**
 * スコア表示を fromScore から toScore まで、滑らかにカウントアップさせながら変化させる
 * （easeOutQuad：はじめは速く、終わりにかけてゆっくり止まる）。
 */
function animateScoreDisplay(fromScore, toScore) {
  if (scoreAnimationHandle !== null) {
    cancelAnimationFrame(scoreAnimationHandle);
  }
  const startTime = performance.now();
  const step = (now) => {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / SCORE_COUNTUP_DURATION_MS);
    const eased = 1 - (1 - t) * (1 - t);
    const currentValue = Math.round(fromScore + (toScore - fromScore) * eased);
    els.scoreDisplay.textContent = String(currentValue);
    if (t < 1) {
      scoreAnimationHandle = requestAnimationFrame(step);
    } else {
      scoreAnimationHandle = null;
      els.scoreDisplay.textContent = String(toScore);
    }
  };
  scoreAnimationHandle = requestAnimationFrame(step);
}

/**
 * スコア・ランク表示を更新する。
 * スコアが増える場合（正解時）はカウントアップ演出で表示し、
 * 増えない場合（新しいゲーム開始時のリセットなど）は即座に反映する。
 */
export function updateScoreboard(score, rank) {
  const currentDisplayed = Number.parseInt(els.scoreDisplay.textContent, 10) || 0;
  if (score > currentDisplayed) {
    animateScoreDisplay(currentDisplayed, score);
  } else {
    setScoreDisplayInstant(score);
  }
  els.rankDisplay.textContent = rank;
  applyRankBadgeStyle(rank);
}

/**
 * 正解した瞬間に、スコア表示のすぐ下に「+1000」のような加算スコアをポップアップ表示する。
 * 前回のアニメーションが残っていても、reflow を挟んで再生し直すことで毎回きちんと表示させる。
 */
export function showScoreDelta(addedScore) {
  if (!els.scoreDelta) return;
  els.scoreDelta.textContent = `+${addedScore}`;
  els.scoreDelta.classList.remove("show");
  void els.scoreDelta.offsetWidth;
  els.scoreDelta.classList.add("show");
}

/**
 * スコア加算ポップアップを即座に隠し、"show" クラスも取り除く。
 * 新しいゲームを開始する直前に呼び出すことで、前のゲーム最後の加算スコア表示が
 * 残らないようにする（下の setupScoreDelta() の対策と合わせた保険）。
 */
export function hideScoreDelta() {
  if (!els.scoreDelta) return;
  els.scoreDelta.classList.remove("show");
}

/**
 * スコア加算ポップアップのアニメーションが自然に終わったら、"show" クラスを取り除く。
 * これを行わないと、アニメーション終了後も "show" クラス（アニメーション再生指定）が
 * 要素に残ったままになり、画面が display:none → 表示へ切り替わった際に
 * （例: 前のゲームをクリアしてリトライし、新しいバトル画面が表示されたとき）
 * ブラウザがアニメーションを最初から再生し直してしまい、前回の加算スコアが
 * 1問目の開始時に再表示されてしまう（実際に起きていた不具合）。
 */
function setupScoreDelta() {
  if (!els.scoreDelta) return;
  els.scoreDelta.addEventListener("animationend", () => {
    els.scoreDelta.classList.remove("show");
  });
}

/**
 * トレーニング画面のヘッダー（カテゴリ名）と、問題番号（例: "問題 2／5"）を更新する。
 * 2段階問題のときは、既存の #step-indicator（"式を2つ答えよう！"）と同時に表示される。
 * isCustom（カスタムトレーニングかどうか）が true のときは、「トレーニング」の固定
 * ラベルを非表示にする（運用開始後に追加。「トレーニング　カスタムトレーニング（Nカテゴリ）
 * 　リタイア」のように3つ並ぶと折り返されて見た目が崩れるという指摘を受けて、
 * カスタムトレーニングではヘッダーにカテゴリラベルの文言とリタイアボタンだけを表示する）。
 */
export function updateTrainingHeader(categoryLabel, questionNumber, totalQuestions, isCustom) {
  if (els.trainingCategoryDisplay) {
    els.trainingCategoryDisplay.textContent = categoryLabel;
  }
  if (els.trainingStatusLabel) {
    els.trainingStatusLabel.hidden = !!isCustom;
  }
  if (els.trainingProgress) {
    els.trainingProgress.textContent = `問題 ${questionNumber}／${totalQuestions}`;
    els.trainingProgress.classList.add("show");
  }
}

/**
 * 総復習画面のヘッダー（スコア表示の位置に「4年のまとめ　1問目／13問」のように表示する）を
 * 更新する。updateTrainingHeader() と同じ考え方だが、総復習にはハート・敵HPはあっても
 * スコアが無いため、スコア表示（.status-pill）と同じ場所を丸ごと置き換える形にしている。
 */
export function updateReviewHeader(scopeLabel, questionNumber, totalQuestions) {
  if (els.reviewModeDisplay) {
    els.reviewModeDisplay.textContent = scopeLabel;
  }
  if (els.reviewProgressDisplay) {
    els.reviewProgressDisplay.textContent = `${questionNumber}問目／${totalQuestions}問`;
  }
}

/**
 * トレーニングの不正解時に、バトルのダメージ演出（画面全体の赤フラッシュ＋シェイク）よりも
 * 控えめな、解答欄まわりだけの軽いシェイク演出を行う。
 */
export function triggerTrainingIncorrectEffect() {
  const target = els.answerSlots[0] ? els.answerSlots[0].closest(".answer-area") : null;
  if (!target) return;
  target.classList.remove("mini-shake");
  void target.offsetWidth;
  target.classList.add("mini-shake");
}

// ============== 問題表示・カード ==============

// 現在表示中の問題の分数を約分して表示するかどうか（第9段階で追加）。
// renderProblem() が problem.simplifyFractions から設定し、以後 renderChoices()・renderSlots()・
// ドラッグ中のカード表示など、problem を直接受け取らない再描画関数もこのモジュール変数を参照する。
// 既定は true（約分して表示。これまでと同じ挙動）。
let currentSimplifyFractions = true;

// 現在表示中の問題が帯分数表示かどうか（第11段階：同分母分数のたし算・ひき算への帯分数追加で追加）。
// currentSimplifyFractions と同じ考え方で、renderProblem() が problem.template.fractionDisplayMode
// から設定し、以後の再描画関数もこのモジュール変数を参照する。fractionDisplayMode はテンプレート
// 自身に紐づく値（セッションごとに変わらない）なので、simplifyFractions と違い、
// ゲーム側（game.js等）で毎回計算し直す必要はない。既定は false（これまで通りの仮分数表示）。
let currentMixedNumberDisplay = false;

// 分数を含む問題文は problem.textParts（文字列/値パーツの配列）を持つため、
// value-renderer.js の renderTextPartsHtml() で縦型分数を含むHTMLとして描画する。
// 整数・小数のみの問題は textParts を持たないため、従来どおり problem.text を
// そのまま（エスケープした上で）表示する。
function renderQuestionText(problem) {
  els.questionText.innerHTML = problem.textParts
    ? renderTextPartsHtml(problem.textParts, { simplify: currentSimplifyFractions, mixedNumber: currentMixedNumberDisplay })
    : escapeHtml(problem.text);
}

/**
 * 比例・反比例の関係表（problem.relationTable）を表示する（小学6年生3学期、第12段階で追加）。
 * 表を持たない問題（大半のテンプレート）では、コンテナを空にして非表示のままにする。
 */
function renderRelationTable(problem) {
  if (problem.relationTable) {
    els.relationTableContainer.innerHTML = renderRelationTableHtml(problem.relationTable);
    els.relationTableContainer.setAttribute("aria-hidden", "false");
  } else {
    els.relationTableContainer.innerHTML = "";
    els.relationTableContainer.setAttribute("aria-hidden", "true");
  }
}

export function renderProblem(problem) {
  currentSimplifyFractions = problem.simplifyFractions !== false;
  currentMixedNumberDisplay = !!(problem.template && problem.template.fractionDisplayMode === "mixed");
  renderQuestionText(problem);
  updateStepIndicator(problem);
  renderRelationTable(problem);
  slots = [null, null, null];
  allCards = problem.choices.map((c) => ({ ...c }));
  renderSlots();
  renderChoices();
  els.resultBox.textContent = "";
  hideCorrectEffect();
  hideIntermediateStepEffect();
  hideBattleMessage();
}

/**
 * 途中式正解の後、問題文・敵の状態はそのままに、進行表示・解答欄・選択肢だけを
 * 次のステップ用に再構築する（2段階問題専用）。
 */
export function renderStepChoices(problem) {
  updateStepIndicator(problem);
  slots = [null, null, null];
  allCards = problem.choices.map((c) => ({ ...c }));
  renderSlots();
  renderChoices();
  els.resultBox.textContent = "";
}

/**
 * 2〜3段階問題の進行表示を更新する。「式 ○／○」のような進行番号は表示しない。
 * 1つ目の式のときは「式を2つ答えよう！」（totalStepsに応じて「3つ」等に変わる）、
 * 2つ目以降の式のときは、それまでに正解した式をすべて「→」でつなげて
 * （例: 3段階問題の3つ目の式では "4+5=9 → 90÷9＝10"）、続けて「の続きを答えよう」と
 * 表示する（第12段階で、直前の1つの式だけを表示していたのを、それまでの全ての式を
 * 表示するよう変更）。
 */
function updateStepIndicator(problem) {
  if (problem.questionType === "multiStep" && problem.multiStep) {
    const state = problem.multiStep;
    const prevSteps = state.completedSteps
      .filter((s) => s.stepIndex < state.currentStepIndex)
      .sort((a, b) => a.stepIndex - b.stepIndex);
    let html;
    if (prevSteps.length > 0) {
      const formulaHtml = prevSteps
        .map(
          (step) =>
            `${renderValueHtml(step.left)}${escapeHtml(step.operator)}${renderValueHtml(step.right)}＝${renderValueHtml(step.result)}`
        )
        .join(escapeHtml(" → "));
      html = `<span class="step-indicator-prev">${formulaHtml}</span>${escapeHtml("の続きを答えよう")}`;
    } else {
      html = escapeHtml(`式を${state.totalSteps}つ答えよう！`);
    }
    els.stepIndicator.innerHTML = html;
    els.stepIndicator.classList.add("show");
  } else {
    els.stepIndicator.classList.remove("show");
    els.stepIndicator.innerHTML = "";
  }
}

function isCardPlaced(cardId) {
  return slots.some((c) => c !== null && c.cardId === cardId);
}

/**
 * 値の種類・表示文字列の長さに応じて、カードの文字サイズ・高さを自動調整するための
 * クラス名を返す。分数は縦に場所を取るため専用のクラス（choice-value-fraction）を、
 * 125,000 のような大きな数は文字サイズを縮小するクラスを返す。
 */
function getValueCardSizeClass(value) {
  if (isFractionValue(value)) return "choice-value-fraction";
  // カード・解答欄は桁区切りカンマを付けずに表示するため、実際に表示される文字列の
  // 長さ（カンマ無し）を基準にサイズクラスを決める（百分率は比率＝小数に変換して表示するため、
  // その小数表記の長さで判定する）。
  const displayText = isPercentValue(value)
    ? formatNumber(percentToRatio(value), { useSeparator: false })
    : formatNumber(value, { useSeparator: false });
  if (displayText.length >= 8) return "choice-value-xlong";
  if (displayText.length >= 6) return "choice-value-long";
  return "";
}

const SIZE_CLASS_NAMES = ["choice-value-long", "choice-value-xlong", "choice-value-fraction"];

function renderChoices() {
  els.choicesContainer.innerHTML = "";
  for (const card of allCards) {
    const placed = isCardPlaced(card.cardId);
    const isIntermediate = card.source === "intermediate";
    const sizeClass = card.type === "number" ? getValueCardSizeClass(card.value) : "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `choice-card choice-${card.type}${placed ? " placed" : ""}${isIntermediate ? " choice-intermediate" : ""}${sizeClass ? ` ${sizeClass}` : ""}`;
    btn.dataset.cardId = card.cardId;
    if (card.type === "number") {
      // 選択肢カードの数字は桁区切りカンマを付けずに表示する（例: "3,900" ではなく "3900"）。
      btn.innerHTML = renderValueHtml(card.value, { useSeparator: false, simplify: currentSimplifyFractions, mixedNumber: currentMixedNumberDisplay });
    } else {
      btn.textContent = String(card.value);
    }
    if (placed) {
      btn.disabled = true;
      btn.tabIndex = -1;
    }
    els.choicesContainer.appendChild(btn);
  }
}

function renderSlots() {
  slots.forEach((card, index) => {
    const el = els.answerSlots[index];
    el.classList.remove(...SIZE_CLASS_NAMES);
    if (card) {
      if (card.type === "number") {
        // 解答欄も選択肢カードと同じく、桁区切りカンマを付けずに表示する。
        el.innerHTML = renderValueHtml(card.value, { useSeparator: false, simplify: currentSimplifyFractions, mixedNumber: currentMixedNumberDisplay });
      } else {
        el.textContent = String(card.value);
      }
      el.classList.add("filled");
      if (card.type === "number") {
        const sizeClass = getValueCardSizeClass(card.value);
        if (sizeClass) el.classList.add(sizeClass);
      }
      el.dataset.cardId = card.cardId;
    } else {
      el.textContent = "";
      el.classList.remove("filled");
      delete el.dataset.cardId;
    }
  });
  updateJudgeButtonState();
}

function updateJudgeButtonState() {
  const allFilled = slots[0] !== null && slots[1] !== null && slots[2] !== null;
  els.judgeBtn.classList.toggle("ready", allFilled);
}

export function clearAnswerSlots() {
  slots = [null, null, null];
  els.resultBox.textContent = "";
  renderSlots();
  renderChoices();
}

function getSlotIndexForCardType(type) {
  if (type === "operator") {
    return slots[1] === null ? 1 : -1;
  }
  // 数値：空いている方（0を優先、なければ2）
  if (slots[0] === null) return 0;
  if (slots[2] === null) return 2;
  return -1;
}

function isValidSlotForType(index, type) {
  if (index === 1) return type === "operator";
  return type === "number";
}

function placeCardInSlot(card, index) {
  const occupant = slots[index];
  slots[index] = card;
  return occupant;
}

export function getPlacedAnswer() {
  if (slots[0] === null || slots[1] === null || slots[2] === null) {
    return null;
  }
  return {
    left: slots[0].value,
    operator: slots[1].value,
    right: slots[2].value
  };
}

// ============== カード操作（タップ／ドラッグ） ==============

function findSlotElementIndex(el) {
  if (!el) return -1;
  const slotEl = el.closest(".answer-slot");
  if (!slotEl) return -1;
  return Number.parseInt(slotEl.dataset.index, 10);
}

function handlePoolTap(card) {
  const targetIndex = getSlotIndexForCardType(card.type);
  if (targetIndex === -1) {
    return; // 空きなし。何もしない
  }
  // occupant があっても push はしない。allCards に残っているため、
  // 配置されなくなった時点で自動的に元の位置に選択肢として再表示される。
  placeCardInSlot(card, targetIndex);
  renderSlots();
  renderChoices();
}

function handleSlotTap(index) {
  const card = slots[index];
  if (!card) return;
  slots[index] = null;
  els.resultBox.textContent = "";
  renderSlots();
  renderChoices();
}

function moveDrag(cardData, source, destIndex, destIsPool) {
  // ソースがスロットだった場合は、まずそのスロットを空にする
  // （プールが元々ソースの場合は allCards 上の並びを変えないため何もしない）
  if (source.type === "slot") {
    slots[source.index] = null;
  }

  if (destIsPool) {
    // プールへ戻す＝どのスロットにも属さない状態にするだけでよい
    renderSlots();
    renderChoices();
    return;
  }

  if (destIndex === -1 || !isValidSlotForType(destIndex, cardData.type)) {
    // 不正な移動先：元のスロットに戻す
    if (source.type === "slot") {
      slots[source.index] = cardData;
    }
    renderSlots();
    renderChoices();
    return;
  }

  const occupant = slots[destIndex];
  slots[destIndex] = cardData;
  if (occupant && source.type === "slot" && source.index !== destIndex) {
    slots[source.index] = occupant; // 入れ替え
  }
  // occupant がプール発生（source.type === "pool"）の場合は、
  // allCards 上の元の位置にそのまま選択肢として再表示される。
  renderSlots();
  renderChoices();
}

function showGhost(x, y, card) {
  if (card.type === "number") {
    // ドラッグ中のカードも、選択肢カード・解答欄と同じくカンマ無しで表示する。
    els.dragGhost.innerHTML = renderValueHtml(card.value, { useSeparator: false, simplify: currentSimplifyFractions, mixedNumber: currentMixedNumberDisplay });
  } else {
    els.dragGhost.textContent = String(card.value);
  }
  els.dragGhost.className = `drag-ghost drag-ghost-${card.type} visible`;
  positionGhost(x, y);
}

function positionGhost(x, y) {
  els.dragGhost.style.left = `${x}px`;
  els.dragGhost.style.top = `${y}px`;
}

function hideGhost() {
  els.dragGhost.classList.remove("visible");
}

function onPointerDown(e) {
  if (inputLocked) return;
  const poolCardEl = e.target.closest(".choice-card");
  const slotEl = e.target.closest(".answer-slot");

  let card = null;
  let source = null;

  if (poolCardEl && !poolCardEl.disabled) {
    card = allCards.find((c) => c.cardId === poolCardEl.dataset.cardId);
    source = { type: "pool" };
  } else if (slotEl) {
    const index = Number.parseInt(slotEl.dataset.index, 10);
    if (slots[index]) {
      card = slots[index];
      source = { type: "slot", index };
    }
  }

  if (!card) return;

  dragCandidate = { card, source };
  isDragging = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  activePointerId = e.pointerId;
}

function onPointerMove(e) {
  if (!dragCandidate || e.pointerId !== activePointerId) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  if (!isDragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
    isDragging = true;
    showGhost(e.clientX, e.clientY, dragCandidate.card);
  }
  if (isDragging) {
    e.preventDefault();
    positionGhost(e.clientX, e.clientY);
  }
}

function onPointerUp(e) {
  if (!dragCandidate || e.pointerId !== activePointerId) return;
  const { card, source } = dragCandidate;

  if (isDragging) {
    hideGhost();
    const dropEl = document.elementFromPoint(e.clientX, e.clientY);
    const slotIndex = findSlotElementIndex(dropEl);
    const overPool = dropEl && dropEl.closest("#choices-container");
    if (slotIndex >= 0) {
      moveDrag(card, source, slotIndex, false);
    } else if (overPool) {
      moveDrag(card, source, -1, true);
    } else {
      // どこにもドロップされなかった：元に戻す（何もしない=再描画のみ）
      renderSlots();
      renderChoices();
    }
  } else {
    // タップ操作
    if (source.type === "pool") {
      handlePoolTap(card);
    } else {
      handleSlotTap(source.index);
    }
  }

  dragCandidate = null;
  isDragging = false;
  activePointerId = null;
}

function onPointerCancel() {
  dragCandidate = null;
  isDragging = false;
  activePointerId = null;
  hideGhost();
  renderSlots();
  renderChoices();
}

function setupCardInteraction() {
  els.choicesContainer.addEventListener("pointerdown", onPointerDown);
  els.answerSlots.forEach((el) => el.addEventListener("pointerdown", onPointerDown));
  document.addEventListener("pointermove", onPointerMove, { passive: false });
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerCancel);

  els.clearSlotsBtn.addEventListener("click", () => {
    if (inputLocked) return;
    clearAnswerSlots();
  });

  els.judgeBtn.addEventListener("click", () => {
    if (inputLocked) return;
    const answer = getPlacedAnswer();
    if (!answer) {
      shakeElement(els.judgeBtn);
      return;
    }
    lockInput();
    callbacks.onJudge && callbacks.onJudge(answer);
  });
}

function shakeElement(el) {
  el.classList.remove("mini-shake");
  void el.offsetWidth;
  el.classList.add("mini-shake");
}

// ============== 入力ロック ==============

export function lockInput() {
  inputLocked = true;
}

export function unlockInput() {
  inputLocked = false;
}

// ============== 正解・不正解演出 ==============

export function showCorrectEffect(resultValue, { simplify = true, mixedNumber = false } = {}) {
  // ■欄の答えの数字は、選択肢カード・解答欄と同じく桁区切りカンマを付けずに表示する。
  // 百分率が答えになるのは「割合・百分率」（何%ですかと問う問題）だけのため、
  // その場合だけ「0.5→50%」のように小数と百分率の両方を示す。
  els.resultBox.innerHTML = isPercentValue(resultValue)
    ? renderPercentConversionHtml(resultValue, { useSeparator: false })
    : renderValueHtml(resultValue, { useSeparator: false, simplify, mixedNumber });
  els.correctMark.classList.add("show");
  nextQuestionTapLock = false;
  window.setTimeout(() => {
    els.tapToContinue.classList.add("show");
    // トレーニング以外のモードでは .training-only の display:none により常に非表示のまま
    // なので、show クラスを付けても問題ない（運用開始後に追加）。
    els.retrySameQuestionBtn.classList.add("show");
  }, 450);
}

export function hideCorrectEffect() {
  els.correctMark.classList.remove("show");
  els.tapToContinue.classList.remove("show");
  els.retrySameQuestionBtn.classList.remove("show");
}

/**
 * 2段階問題で、1つ目の式に正解したときの小さめの演出。
 * 大きな正解演出（showCorrectEffect）とは別の、控えめなマークを表示する。
 */
export function showIntermediateStepEffect(stepResult) {
  els.resultBox.innerHTML = renderValueHtml(stepResult, { useSeparator: false });
  els.intermediateMark.classList.add("show");
}

export function hideIntermediateStepEffect() {
  els.intermediateMark.classList.remove("show");
}

export function triggerEnemyShake() {
  els.enemyEmoji.classList.remove("enemy-shake");
  void els.enemyEmoji.offsetWidth;
  els.enemyEmoji.classList.add("enemy-shake");
}

/**
 * 敵を倒したときの演出。絵文字が点滅しながら消えていく。
 */
export function triggerEnemyDefeatEffect() {
  els.enemyEmoji.classList.remove("enemy-shake");
  void els.enemyEmoji.offsetWidth;
  els.enemyEmoji.classList.add("enemy-defeated");
}

export function triggerDamageEffect() {
  els.screenBattle.classList.remove("screen-shake");
  els.damageFlash.classList.remove("flash");
  void els.screenBattle.offsetWidth;
  els.screenBattle.classList.add("screen-shake");
  els.damageFlash.classList.add("flash");
  window.setTimeout(() => {
    els.screenBattle.classList.remove("screen-shake");
    els.damageFlash.classList.remove("flash");
  }, 420);
}

function setupNextQuestionTap() {
  els.tapToContinue.addEventListener("click", () => {
    if (nextQuestionTapLock) return;
    nextQuestionTapLock = true;
    els.tapToContinue.classList.remove("show");
    els.retrySameQuestionBtn.classList.remove("show");
    callbacks.onNextTap && callbacks.onNextTap();
  });

  // 「同じ問題をもう一度」（トレーニング専用。運用開始後に追加）。tapToContinueと
  // 同じロックを共有し、どちらか一方を押したら両方のボタンを閉じる。
  els.retrySameQuestionBtn.addEventListener("click", () => {
    if (nextQuestionTapLock) return;
    nextQuestionTapLock = true;
    els.tapToContinue.classList.remove("show");
    els.retrySameQuestionBtn.classList.remove("show");
    callbacks.onRetrySameQuestion && callbacks.onRetrySameQuestion();
  });
}

export function showBattleMessage(text, variant) {
  els.battleMessage.textContent = text;
  els.battleMessage.className = `battle-message show ${variant || ""}`;
}

export function hideBattleMessage() {
  els.battleMessage.classList.remove("show");
}

// ============== リタイア確認ダイアログ ==============

function setupRetireDialog() {
  els.retireBtn.addEventListener("click", () => {
    callbacks.onRetireOpen && callbacks.onRetireOpen();
    showRetireDialog();
  });
  els.retireYesBtn.addEventListener("click", () => {
    hideRetireDialog();
    callbacks.onRetireConfirmed && callbacks.onRetireConfirmed();
  });
  els.retireNoBtn.addEventListener("click", () => {
    hideRetireDialog();
    callbacks.onRetireCancelled && callbacks.onRetireCancelled();
  });
}

export function showRetireDialog() {
  const isTraining = els.appEl.classList.contains("mode-training");
  const isReview = els.appEl.classList.contains("mode-review");
  if (els.retireConfirmText) {
    els.retireConfirmText.textContent = isTraining
      ? "トレーニングを終了しますか？"
      : isReview
        ? "総復習をやめますか？"
        : "バトルをリタイアしますか？";
  }
  els.retireYesBtn.textContent = isTraining ? "終了する" : isReview ? "やめる" : "リタイアする";
  els.retireNoBtn.textContent = isTraining ? "続ける" : isReview ? "続ける" : "バトルに戻る";
  els.retireDialog.classList.add("show");
}

export function hideRetireDialog() {
  els.retireDialog.classList.remove("show");
}

// ============== トレーニング開始確認ダイアログ ==============

function setupTrainingStartConfirmDialog() {
  els.trainingStartYesBtn.addEventListener("click", () => {
    hideTrainingStartDialog();
    if (pendingTrainingSettings) {
      callbacks.onStart && callbacks.onStart(pendingTrainingSettings);
    }
    pendingTrainingSettings = null;
  });
  els.trainingStartNoBtn.addEventListener("click", () => {
    hideTrainingStartDialog();
    pendingTrainingSettings = null;
  });
}

function showTrainingStartDialog(categoryLabel) {
  els.trainingStartConfirmText.textContent = `${categoryLabel} のトレーニングをはじめますか？`;
  els.trainingStartDialog.classList.add("show");
}

function hideTrainingStartDialog() {
  els.trainingStartDialog.classList.remove("show");
}

// ============== 総復習開始確認ダイアログ ==============

function setupReviewStartConfirmDialog() {
  els.reviewStartYesBtn.addEventListener("click", () => {
    hideReviewStartDialog();
    if (pendingReviewSettings) {
      callbacks.onStart && callbacks.onStart(pendingReviewSettings);
    }
    pendingReviewSettings = null;
  });
  els.reviewStartNoBtn.addEventListener("click", () => {
    hideReviewStartDialog();
    pendingReviewSettings = null;
  });
}

function showReviewStartDialog(scopeLabel, questionCount, heartCount) {
  // 「○年のまとめを はじめますか？」の後で改行し、2行目にハート数・クリア条件（必要正解数）を
  // 表示する（運用開始後に変更。以前は2行目が「全13問です。」だけだった）。
  els.reviewStartConfirmText.innerHTML = `${escapeHtml(scopeLabel)}を はじめますか？<br />ハートは${heartCount}個で ${questionCount}問正解したらクリア！`;
  els.reviewStartDialog.classList.add("show");
}

function hideReviewStartDialog() {
  els.reviewStartDialog.classList.remove("show");
}

// ============== ヘルプ画面（ヘルプメニュー／このゲームについて／エネミー図鑑。運用開始後に追加） ==============
//
// ヘルプは、ゲーム進行（問題・スコア・ハート等）を一切持たない、タイトル画面の補助画面のため、
// js/app.js の MODES ディスパッチテーブル（バトル/トレーニング/総復習の切り替え）には
// 追加しない。画面遷移・エネミー図鑑の描画は、すべてこの中だけで完結する。

// 「エネミー図鑑」から「もどる」で戻ったとき、ヘルプメニューのどのボタンにフォーカスを
// 戻すか（「このゲームについて」か「エネミー図鑑」、直前に押した方）を覚えておく。
let lastPressedHelpMenuButton = null;

/**
 * 指定した要素にフォーカスを移す。画面切り替え直後に呼ばれることが多いため、
 * 描画が落ち着いた次のフレームで実行する（要素が見つからない場合は何もしない）。
 */
function focusElement(el) {
  if (!el) return;
  window.requestAnimationFrame(() => {
    try {
      el.focus({ preventScroll: false });
    } catch (error) {
      // フォーカス移動に失敗しても、画面遷移自体は継続する
    }
  });
}

function getActiveScreenId() {
  const active = document.querySelector(".screen.active-screen");
  return active ? active.id : null;
}

function openHelpMenu() {
  showScreen("help-menu");
  focusElement(els.helpMenuTitle);
}

function closeHelpMenuToTitle() {
  showScreen("title");
  focusElement(els.helpBtn);
}

function openAboutScreen() {
  lastPressedHelpMenuButton = els.helpAboutBtn;
  showScreen("about");
  focusElement(els.aboutTitle);
}

function openEnemyDexScreen() {
  lastPressedHelpMenuButton = els.helpDexBtn;
  renderEnemyDex();
  showScreen("enemy-dex");
  focusElement(els.enemyDexTitle);
}

function backToHelpMenuFromDetail() {
  showScreen("help-menu");
  focusElement(lastPressedHelpMenuButton || els.helpMenuTitle);
}

/**
 * エネミー図鑑のグリッドを描画する。js/enemy-list.js の getAllEnemiesForDex()（唯一の
 * 情報源）と js/storage.js の loadDefeatedEnemyIds()（解放状態）だけから組み立てるため、
 * 図鑑専用のエネミー情報をここで別に持つことはない。
 * 倒したことがあるエネミーは絵文字・名前・キャラ紹介文を、まだ倒していないエネミーは
 * 「❓」「？？？」と出現条件のヒント（getEnemyUnlockHint()）だけを表示し、本来の絵文字・
 * 名前・紹介文はDOM上のどこにも（aria-label等にも）出力しない。
 */
function renderEnemyDex() {
  const enemies = getAllEnemiesForDex();
  const defeatedIds = new Set(loadDefeatedEnemyIds());
  // 現在存在しないエネミーID（削除・変更されたもの）を発見数に含めないよう、
  // 保存データ側ではなく、実在するエネミー一覧側を基準に数える。
  const defeatedCount = enemies.filter((enemy) => defeatedIds.has(enemy.id)).length;

  if (els.enemyDexProgress) {
    els.enemyDexProgress.textContent = `発見したエネミー　${defeatedCount}／${enemies.length}`;
  }
  if (!els.enemyDexGrid) return;

  els.enemyDexGrid.innerHTML = "";
  for (const enemy of enemies) {
    const defeated = defeatedIds.has(enemy.id);
    const card = document.createElement("div");
    card.className = `enemy-dex-card ${defeated ? "defeated" : "undefeated"}`;
    // カード全体に aria-label を付け、中の各要素は aria-hidden にすることで、
    // 読み上げ順（絵文字→名前→紹介文の情報）を1つの文としてまとめて制御する
    // （未解放時に本来の名前・紹介文が読み上げ内容へ混ざらないようにするため）。
    card.setAttribute("role", "group");

    if (defeated) {
      card.setAttribute("aria-label", `${enemy.name}。${enemy.introText}`);
      card.innerHTML = `
        <span class="enemy-dex-emoji" aria-hidden="true">${escapeHtml(enemy.emoji)}</span>
        <span class="enemy-dex-name" aria-hidden="true">${escapeHtml(enemy.name)}</span>
        <span class="enemy-dex-desc" aria-hidden="true">${escapeHtml(enemy.introText)}</span>
      `;
    } else {
      const hint = getEnemyUnlockHint(enemy);
      card.setAttribute("aria-label", `まだ倒していないエネミー。${hint}`);
      card.innerHTML = `
        <span class="enemy-dex-emoji" aria-hidden="true">❓</span>
        <span class="enemy-dex-name" aria-hidden="true">？？？</span>
        <span class="enemy-dex-desc" aria-hidden="true">${escapeHtml(hint)}</span>
      `;
    }
    els.enemyDexGrid.appendChild(card);
  }
}

// 「⚠記録を消す」確認ダイアログの現在の段階（1: 最初の確認、2: 赤文字の最終確認）。
// ダイアログを閉じる（「もどる」を押した／消去完了メッセージが自動で閉じた、どちらの場合も）
// たびに1へ戻す。
let resetRecordsConfirmStep = 1;

// 消去完了メッセージ「すべての記録を消去しました。」を表示しておく時間。
const RESET_RECORDS_DONE_MESSAGE_MS = 2500;

function showResetRecordsDialog(step) {
  resetRecordsConfirmStep = step;
  els.resetRecordsDialogButtons.classList.remove("dialog-buttons-hidden");
  if (step === 1) {
    els.resetRecordsConfirmText.innerHTML = "すべてのハイスコアとエネミー図鑑の情報を消去します。<br />よろしいですか？";
    els.resetRecordsConfirmText.classList.remove("dialog-warning-text");
  } else {
    els.resetRecordsConfirmText.innerHTML = "本当によろしいですか？<br />後悔しませんね？";
    els.resetRecordsConfirmText.classList.add("dialog-warning-text");
  }
  els.resetRecordsDialog.classList.add("show");
}

function hideResetRecordsDialog() {
  els.resetRecordsDialog.classList.remove("show");
  els.resetRecordsDialogButtons.classList.remove("dialog-buttons-hidden");
  resetRecordsConfirmStep = 1;
}

/**
 * 実際に消去を実行したあと、「⚠消去する」「もどる」ボタンを隠して完了メッセージだけを
 * 一定時間（RESET_RECORDS_DONE_MESSAGE_MS）表示してから、自動でダイアログを閉じて
 * 元のヘルプメニュー画面へ戻す（「⚠記録を消す」ボタンへフォーカスも戻す）。
 */
function showResetRecordsDoneMessage() {
  resetRecordsConfirmStep = 1;
  els.resetRecordsConfirmText.innerHTML = "すべての記録を消去しました。";
  els.resetRecordsConfirmText.classList.remove("dialog-warning-text");
  els.resetRecordsDialogButtons.classList.add("dialog-buttons-hidden");
  els.resetRecordsDialog.classList.add("show");
  window.setTimeout(() => {
    hideResetRecordsDialog();
    focusElement(els.helpResetBtn);
  }, RESET_RECORDS_DONE_MESSAGE_MS);
}

/**
 * 「⚠記録を消す」の確認ダイアログ。同じ「⚠消去する」ボタンを2回押させることで、
 * 誤操作による消去を防ぐ2段階確認にしている。1回目は通常の確認文、2回目は赤文字の
 * 最終確認文に切り替わり（showResetRecordsDialog参照）、2回目を押したときだけ
 * 実際に resetHighScoresAndEnemyDex() を呼び出し、完了メッセージを表示する
 * （showResetRecordsDoneMessage参照）。
 */
function setupResetRecordsDialog() {
  els.helpResetBtn.addEventListener("click", () => {
    showResetRecordsDialog(1);
  });
  els.resetRecordsYesBtn.addEventListener("click", () => {
    if (resetRecordsConfirmStep === 1) {
      showResetRecordsDialog(2);
      return;
    }
    resetHighScoresAndEnemyDex();
    showResetRecordsDoneMessage();
  });
  els.resetRecordsNoBtn.addEventListener("click", () => {
    hideResetRecordsDialog();
    focusElement(els.helpResetBtn);
  });
}

function setupHelpScreens() {
  els.helpBtn.addEventListener("click", openHelpMenu);
  els.helpAboutBtn.addEventListener("click", openAboutScreen);
  els.helpDexBtn.addEventListener("click", openEnemyDexScreen);
  els.helpMenuBackBtn.addEventListener("click", closeHelpMenuToTitle);
  els.aboutBackBtn.addEventListener("click", backToHelpMenuFromDetail);
  els.enemyDexBackBtn.addEventListener("click", backToHelpMenuFromDetail);

  // ヘルプ関連画面・カスタムトレーニング設定画面が表示されているときだけ、Escキーで
  // 1つ前の画面へ戻れるようにする。ゲーム中（バトル/カウントダウン/結果画面）の
  // キー操作には一切影響しない。
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const activeId = getActiveScreenId();
    if (activeId === "screen-about" || activeId === "screen-enemy-dex") {
      backToHelpMenuFromDetail();
    } else if (activeId === "screen-help-menu") {
      closeHelpMenuToTitle();
    } else if (activeId === "screen-custom-training-settings") {
      closeCustomTrainingSettingsToTitle();
    }
  });
}

// ============== 結果画面 ==============

const RANGE_LABELS = {
  "4-1": "小学4年生・1学期",
  "4-2": "小学4年生・2学期",
  "4-3": "小学4年生・3学期",
  "4-multi-step": "2段階問題・整数（開発版）",
  "5-1": "小学5年生・1学期",
  "5-2": "小学5年生・2学期",
  "5-3": "小学5年生・3学期",
  "6-1": "小学6年生・1学期",
  "6-2": "小学6年生・2学期",
  "6-3": "小学6年生・3学期"
};

// 内部レベル（レベルMAXの計算には6を使う）を、タイトル画面のボタンと同じ表示ラベルに変換する。
// 6だけが「レベルMAX」の内部値のため、6のときだけ "MAX" と表示する。
function formatLevelLabel(level) {
  return level === 6 ? "MAX" : String(level);
}

export function showResultScreen(data) {
  els.resultTitle.textContent = data.title;
  els.resultTitle.className = `result-title ${data.variant || ""}`;
  qs("screen-result").classList.toggle("result-bright", data.variant === "clear");
  qs("screen-result").classList.toggle("result-dark", data.variant === "gameover");

  // その回のバトルに登場したエネミーの絵文字・名前と、クリア/ゲームオーバーで異なるせりふを表示する。
  // リタイア時は、ゲームオーバー時と同じせりふ（gameOverText）を使う。
  if (data.enemy) {
    els.resultEnemyEmoji.textContent = data.enemy.emoji;
    els.resultEnemyName.textContent = data.enemy.name;
    els.resultEnemyText.textContent = data.variant === "clear" ? data.enemy.clearText : data.enemy.gameOverText;
    els.resultEnemyComment.setAttribute("aria-hidden", "false");
  } else {
    els.resultEnemyComment.setAttribute("aria-hidden", "true");
  }

  els.resultRange.textContent = RANGE_LABELS[data.gradeTerm] || data.gradeTerm;
  els.resultLevel.textContent = `レベル${formatLevelLabel(data.level)}`;
  els.resultCorrectCount.textContent = `${data.correctCount}問`;
  els.resultScore.textContent = String(data.score);
  els.resultRank.textContent = data.rank;
  // 特別ランク「MAX」（運用開始後に追加）のときだけ、結果画面のランク表示にも
  // バトル中のランクカードと同じ虹色グラデーションの光る演出（.rank-max）を付ける。
  els.resultRank.classList.toggle("rank-max", data.rank === "MAX");
  els.resultHighscore.textContent = String(data.highScore);
  els.resultNewRecord.classList.toggle("show", Boolean(data.isNewRecord));

  renderHistory(data.history);
}

/**
 * トレーニング結果画面を表示する。バトル結果画面（showResultScreen）と同じ
 * #screen-result / #history-list を再利用しつつ、score/rank/highscore/hearts等の
 * バトル専用項目は .battle-only クラス（#app.mode-training 適用時にCSSで非表示）に
 * まかせ、ここではトレーニング専用項目（カテゴリ・完了数・1回で正解・ミス）だけを設定する。
 * スコア・ランク・ハイスコア・残りハート・敵HP・ゲームオーバー状態は一切表示しない。
 */
export function showTrainingResultScreen(data) {
  els.resultTitle.textContent = data.title;
  els.resultTitle.className = `result-title ${data.variant || ""}`;
  qs("screen-result").classList.toggle("result-bright", data.variant === "clear");
  qs("screen-result").classList.toggle("result-dark", data.variant === "gameover");

  if (els.resultTrainingCategory) {
    els.resultTrainingCategory.textContent = data.categoryLabel;
  }
  if (els.resultTrainingCompleted) {
    els.resultTrainingCompleted.textContent = `${data.completedQuestions}／${data.totalQuestions}問`;
  }
  if (els.resultTrainingFirstTry) {
    els.resultTrainingFirstTry.textContent = `${data.firstTryCorrectCount}問`;
  }
  if (els.resultTrainingWrongCount) {
    els.resultTrainingWrongCount.textContent = `${data.totalWrongCount}回`;
  }
  els.resultNewRecord.classList.remove("show");

  renderHistory(data.history);
}

/**
 * 総復習の結果画面を表示する。バトル結果画面（showResultScreen）と同じ
 * #screen-result / #history-list を再利用しつつ、スコア・ランク・ハイスコア・出題範囲・
 * レベルといったバトル専用項目は .battle-only クラス（#app.mode-review 適用時にCSSで
 * 非表示）にまかせ、ここでは総復習専用項目（モード名・けいか時間）と、バトルと共有する
 * 項目（エネミーコメント・せいかい数）だけを設定する。
 */
export function showReviewResultScreen(data) {
  els.resultTitle.textContent = data.title;
  els.resultTitle.className = `result-title ${data.variant || ""}`;
  qs("screen-result").classList.toggle("result-bright", data.variant === "clear");
  qs("screen-result").classList.toggle("result-dark", data.variant === "gameover");

  // その回に登場したエネミー（フォーミュラ仮面／フォーミュラ仮面エース）の絵文字・名前と、
  // クリア/ゲームオーバーで異なるせりふを表示する。バトルの showResultScreen() と同じ仕組み。
  if (data.enemy) {
    els.resultEnemyEmoji.textContent = data.enemy.emoji;
    els.resultEnemyName.textContent = data.enemy.name;
    els.resultEnemyText.textContent = data.variant === "clear" ? data.enemy.clearText : data.enemy.gameOverText;
    els.resultEnemyComment.setAttribute("aria-hidden", "false");
  } else {
    els.resultEnemyComment.setAttribute("aria-hidden", "true");
  }

  els.resultCorrectCount.textContent = `${data.correctCount}問`;
  if (els.resultReviewMode) {
    els.resultReviewMode.textContent = data.scopeLabel;
  }
  if (els.resultReviewElapsed) {
    els.resultReviewElapsed.textContent = formatElapsedTime(data.elapsedSeconds);
  }
  els.resultNewRecord.classList.remove("show");

  renderHistory(data.history);
}

function renderHistory(history) {
  els.historyList.innerHTML = "";
  history.forEach((entry, i) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML =
      entry.questionType === "multiStep"
        ? buildMultiStepHistoryHtml(entry, i)
        : buildSingleStepHistoryHtml(entry, i);
    els.historyList.appendChild(item);
  });
}

/**
 * 不正解・時間切れの回数表示を組み立てる。
 * どちらも0回の問題では、この行自体を表示しない（空文字を返す）。
 * 片方だけ発生している場合は、発生した方だけを表示する。
 */
function buildHistoryCountsHtml(incorrectCount, timeoutCount) {
  const parts = [];
  if (incorrectCount > 0) {
    parts.push(`<span>不正解 ${incorrectCount}回</span>`);
  }
  if (timeoutCount > 0) {
    parts.push(`<span>時間切れ ${timeoutCount}回</span>`);
  }
  if (parts.length === 0) return "";
  return `<div class="history-counts">${parts.join("")}</div>`;
}

function buildSingleStepHistoryHtml(entry, index) {
  // 分数を含む問題文は entry.textParts（value-renderer.js で縦型分数として描画）を使う。
  // 整数・小数のみの問題は textParts を持たないため、entry.text をそのまま表示する。
  const simplify = entry.simplifyFractions !== false;
  // 帯分数表示だったかどうかも、entry.fractionDisplayMode（プレイ時の値をそのまま複製したもの）
  // から判定する。simplifyFractions と違い、プレイ中の学期によって変わらない値のため、
  // 履歴表示時に改めて計算し直す必要はない（第11段階で追加。プレイ時に見たままの表示形式を、
  // 後から仮分数表示に戻さないようにするため）。
  const mixedNumber = entry.fractionDisplayMode === "mixed";
  const questionTextHtml = entry.textParts
    ? renderTextPartsHtml(entry.textParts, { simplify, mixedNumber })
    : escapeHtml(entry.text);
  // 約分しない表示のときは、entry.result（生成時にすでに約分済みの値）ではなく、
  // 同分母のまま計算した値を使う（value-utils.js の computeUnsimplifiedFractionResult を参照）。
  const displayResult = simplify
    ? entry.result
    : computeUnsimplifiedFractionResult(entry.left, entry.operator, entry.right) ?? entry.result;
  // 「割合・百分率」（何%ですかと問う問題）の答えだけは、小数と百分率の両方を
  // 「0.5→50%」の形式で示す。この場合、百分率記号はすでに含まれているため、
  // answerUnit（"%"）は付け足さない。
  const resultDisplayHtml = isPercentValue(displayResult)
    ? renderPercentConversionHtml(displayResult, { useSeparator: false })
    : `${renderValueHtml(displayResult, { useSeparator: false, simplify, mixedNumber })}${escapeHtml(entry.answerUnit || "")}`;
  return `
    <div class="history-item-head">
      <span class="history-index">第${index + 1}問</span>
      <span class="history-category">${escapeHtml(entry.category)}</span>
    </div>
    <p class="history-text">${questionTextHtml}</p>
    <p class="history-formula">正解式：${renderValueHtml(entry.left, { useSeparator: false, simplify, mixedNumber })}${entry.operator}${renderValueHtml(entry.right, { useSeparator: false, simplify, mixedNumber })} = ${resultDisplayHtml}</p>
    ${buildHistoryCountsHtml(entry.incorrectCount, entry.timeoutCount)}
  `;
}

function buildMultiStepHistoryHtml(entry, index) {
  // 分数・比を含む問題文は entry.textParts（value-renderer.js で縦型分数・比として描画）を使う。
  // 整数・小数のみの問題は textParts を持たないため、entry.text をそのまま表示する
  // （1段階問題の buildSingleStepHistoryHtml() と同じ分岐。第11段階で追加）。
  const questionTextHtml = entry.textParts ? renderTextPartsHtml(entry.textParts) : escapeHtml(entry.text);
  const stepsHtml = entry.steps
    .map((step) => {
      if (step.completed) {
        // step.formula は multi-step-engine.js 側で既に桁区切り無しで整形済みの文字列。
        // step.result は数値のことも百分率（割引・増量の途中結果）のこともあるため、
        // 型を意識せず扱える renderValueHtml() を使う（百分率は小数で表示される）。
        return `<p class="history-step">式${step.stepNumber}：${step.formula}＝${renderValueHtml(step.result, { useSeparator: false })}</p>`;
      }
      if (step.lastAttemptFormula) {
        return `<p class="history-step history-step-incomplete">式${step.stepNumber}：${step.lastAttemptFormula}（解答途中）</p>`;
      }
      return `<p class="history-step history-step-incomplete">式${step.stepNumber}：未回答</p>`;
    })
    .join("");

  const answerLine = entry.isComplete
    ? `<p class="history-final">答え：${renderValueHtml(entry.finalAnswer, { useSeparator: false })}${escapeHtml(entry.answerUnit || "")}</p>`
    : `<p class="history-final history-step-incomplete">状態：解答途中</p>`;

  // 比例・反比例の関係表（小学6年生3学期、第12段階で追加）。表を持たない問題では空文字列。
  const relationTableHtml = entry.relationTable ? renderRelationTableHtml(entry.relationTable) : "";

  return `
    <div class="history-item-head">
      <span class="history-index">第${index + 1}問</span>
      <span class="history-category">${escapeHtml(entry.category)}</span>
    </div>
    <p class="history-text">${questionTextHtml}</p>
    ${relationTableHtml}
    ${stepsHtml}
    ${answerLine}
    ${buildHistoryCountsHtml(entry.incorrectCount, entry.timeoutCount)}
  `;
}

function setupResultScreen() {
  els.retryBtn.addEventListener("click", () => {
    callbacks.onRetry && callbacks.onRetry();
  });
  els.toTitleBtn.addEventListener("click", () => {
    callbacks.onToTitle && callbacks.onToTitle();
  });
}

// ============== デバッグパネル ==============
// game.js が ?debug=true のときだけ呼び出す。通常アクセス時は一切呼ばれない。

let debugPanelEl = null;

/**
 * 画面右下に小さなデバッグ情報パネルを表示する。
 * 既存の画面レイアウトには影響しない固定オーバーレイとして body 直下に追加する。
 */
export function updateDebugPanel(text) {
  if (!debugPanelEl) {
    debugPanelEl = document.createElement("pre");
    debugPanelEl.id = "debug-panel";
    debugPanelEl.className = "debug-panel";
    document.body.appendChild(debugPanelEl);
  }
  debugPanelEl.textContent = text;
}

// ============== 初期化 ==============

export function initUI(cb) {
  callbacks = cb || {};
  cacheElements();
  setupTitleScreen();
  setupCardInteraction();
  setupNextQuestionTap();
  setupRetireDialog();
  setupTrainingStartConfirmDialog();
  setupCustomTrainingSettings();
  setupReviewStartConfirmDialog();
  setupHelpScreens();
  setupResetRecordsDialog();
  setupResultScreen();
  setupScoreDelta();
}
