// 画面表示・DOM操作・カード操作（タップ／ドラッグ）を担当するモジュール。
// ゲームの状態（ハート数・スコア等）そのものは持たず、game.js から渡された値を
// 表示するだけに徹しています。
// 数値の表示は、必ず number-utils.js の formatNumber() を経由します
// （整数・小数・大きな数の表示をアプリ全体で統一するため）。

import { formatNumber } from "./number-utils.js";
import { percentToRatio } from "./percentage-utils.js";
import { isFractionValue, isPercentValue, computeUnsimplifiedFractionResult } from "./value-utils.js";
import { renderValueHtml, renderTextPartsHtml, renderPercentConversionHtml, escapeHtml } from "./value-renderer.js";
import {
  loadSelectedGradeTerm,
  saveSelectedGradeTerm,
  loadLastMode,
  saveLastMode,
  loadLastTrainingGradeTerm,
  saveLastTrainingGradeTerm
} from "./storage.js";
import { getGradeTermGroups, getCategoriesForGradeTerm } from "../data/category-registry.js";
import { ENEMY_LIST } from "./enemy-list.js";

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

function qs(id) {
  return document.getElementById(id);
}

function cacheElements() {
  els = {
    appEl: qs("app"),
    soundToggleBtn: qs("sound-toggle-btn"),
    modeSelect: qs("mode-select"),
    enemyPreviewTrack: qs("enemy-preview-track"),
    battleSettings: qs("battle-settings"),
    trainingSettings: qs("training-settings"),
    trainingGradeTermSelect: qs("training-gradeterm-select"),
    trainingCategorySelect: qs("training-category-select"),
    rangeSelect: qs("range-select"),
    levelSelect: qs("level-select"),
    startBtn: qs("start-btn"),
    trainingStartDialog: qs("training-start-confirm-dialog"),
    trainingStartConfirmText: qs("training-start-confirm-text"),
    trainingStartYesBtn: qs("training-start-confirm-yes"),
    trainingStartNoBtn: qs("training-start-confirm-no"),

    countdownText: qs("countdown-text"),

    retireBtn: qs("retire-btn"),
    scoreDisplay: qs("score-display"),
    rankDisplay: qs("rank-display"),
    scoreDelta: qs("score-delta"),
    trainingCategoryDisplay: qs("training-category-display"),
    trainingProgress: qs("training-progress"),
    enemyEmoji: qs("enemy-emoji"),
    enemyName: qs("enemy-name"),
    enemyHpFill: qs("enemy-hp-fill"),
    questionText: qs("question-text"),
    stepIndicator: qs("step-indicator"),
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
    retireDialog: qs("retire-confirm-dialog"),
    retireConfirmText: qs("retire-confirm-text"),
    retireYesBtn: qs("retire-confirm-yes"),
    retireNoBtn: qs("retire-confirm-no"),
    damageFlash: qs("damage-flash"),
    dangerOverlay: qs("danger-overlay"),
    dragGhost: qs("drag-ghost"),
    screenBattle: qs("screen-battle"),

    resultTitle: qs("result-title"),
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

  els.rangeSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".range-btn");
    if (!btn || btn.disabled) return;
    selectRangeButton(btn);
    saveSelectedGradeTerm(btn.dataset.range);
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

  els.trainingGradeTermSelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".gradeterm-btn");
    if (!btn) return;
    selectTrainingGradeTermButton(btn);
    saveLastTrainingGradeTerm(btn.dataset.gradeterm);
    populateTrainingCategorySelect(btn.dataset.gradeterm);
  });

  // カテゴリボタンをタップすると、そのカテゴリで本当にトレーニングを始めてよいかの
  // 確認ダイアログ（training-start-confirm-dialog）を開く。カテゴリボタン自体には
  // 「選択状態」の見た目を持たせない（どのボタンをタップしても、常に同じ確認フローになるため）。
  // 学年・学期は populateTrainingGradeTermSelect() が起動時に必ず1つ選択済みにするため、
  // ここで未選択を気にする必要はない。
  els.trainingCategorySelect.addEventListener("click", (e) => {
    const btn = e.target.closest(".category-btn");
    if (!btn) return;
    const gradeTermBtn = els.trainingGradeTermSelect.querySelector(".gradeterm-btn.selected");
    pendingTrainingSettings = {
      mode: "training",
      gradeTerm: gradeTermBtn ? gradeTermBtn.dataset.gradeterm : null,
      categoryId: btn.dataset.categoryId,
      categoryLabel: btn.textContent
    };
    showTrainingStartDialog(btn.textContent);
  });

  // このボタンはバトルモード専用（.battle-only。トレーニングモードでは非表示）。
  els.startBtn.addEventListener("click", () => {
    const rangeBtn = els.rangeSelect.querySelector(".range-btn.selected");
    const levelBtn = els.levelSelect.querySelector(".level-btn.selected");
    const settings = {
      mode: "battle",
      gradeTerm: rangeBtn ? rangeBtn.dataset.range : "4-1",
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

function selectRangeButton(btn) {
  els.rangeSelect.querySelectorAll(".range-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
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
  const matchingBtn = Array.from(els.rangeSelect.querySelectorAll(".range-btn")).find(
    (b) => b.dataset.range === saved && !b.disabled
  );
  if (matchingBtn) {
    selectRangeButton(matchingBtn);
  }
}

// ============== モード選択（通常バトル／トレーニング） ==============

/**
 * モードを切り替える。#app 要素に mode-training クラスを付け外しすることで、
 * タイトル画面の設定ブロックの出し分けと、バトル画面・結果画面の
 * バトル専用要素／トレーニング専用要素（.battle-only / .training-only）の
 * 出し分けの両方を、CSS側でまとめて行う（js/ui.js に個別のif分岐を増やさないため）。
 */
export function setMode(mode) {
  els.appEl.classList.toggle("mode-training", mode === "training");
}

function selectMode(mode) {
  els.modeSelect.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("selected"));
  const target = els.modeSelect.querySelector(`.mode-btn[data-mode="${mode}"]`) || els.modeSelect.querySelector(".mode-btn");
  target.classList.add("selected");
  setMode(target.dataset.mode);
}

function restoreSelectedMode() {
  const saved = loadLastMode();
  selectMode(saved === "training" ? "training" : "battle");
}

// ============== トレーニング：学年学期・カテゴリ選択（category-registry.js から動的生成） ==============

function selectTrainingGradeTermButton(btn) {
  els.trainingGradeTermSelect.querySelectorAll(".gradeterm-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

/**
 * data/category-registry.js の getGradeTermGroups() から、トレーニングで選べる
 * 学年・学期ボタンを動的に生成する。個別の学期をここにハードコードしない。
 */
function populateTrainingGradeTermSelect() {
  const groups = getGradeTermGroups();
  els.trainingGradeTermSelect.innerHTML = "";
  for (const group of groups) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "range-btn gradeterm-btn";
    btn.dataset.gradeterm = group.gradeTerm;
    btn.textContent = formatShortGradeTermLabel(group.gradeTerm);
    els.trainingGradeTermSelect.appendChild(btn);
  }

  const savedGradeTerm = loadLastTrainingGradeTerm();
  const matching = groups.find((g) => g.gradeTerm === savedGradeTerm);
  const initialGradeTerm = matching ? matching.gradeTerm : groups.length > 0 ? groups[0].gradeTerm : null;
  if (initialGradeTerm) {
    const btn = els.trainingGradeTermSelect.querySelector(`.gradeterm-btn[data-gradeterm="${initialGradeTerm}"]`);
    if (btn) selectTrainingGradeTermButton(btn);
    populateTrainingCategorySelect(initialGradeTerm);
  }
}

/**
 * gradeTerm キー（例: "4-1"）から、タイトル画面ボタン向けの短い表示名を作る
 * （例: "4-1" → "4年1学期"）。既存の #range-select ボタン表記に合わせている。
 */
function formatShortGradeTermLabel(gradeTerm) {
  const match = /^(\d+)-(\d+)$/.exec(gradeTerm);
  return match ? `${match[1]}年${match[2]}学期` : gradeTerm;
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
  els.rangeSelect.appendChild(btn);
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
 */
function applyRankBadgeStyle(rank) {
  if (!els.rankDisplay) return;
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
 */
export function updateTrainingHeader(categoryLabel, questionNumber, totalQuestions) {
  if (els.trainingCategoryDisplay) {
    els.trainingCategoryDisplay.textContent = categoryLabel;
  }
  if (els.trainingProgress) {
    els.trainingProgress.textContent = `問題 ${questionNumber}／${totalQuestions}`;
    els.trainingProgress.classList.add("show");
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

// 分数を含む問題文は problem.textParts（文字列/値パーツの配列）を持つため、
// value-renderer.js の renderTextPartsHtml() で縦型分数を含むHTMLとして描画する。
// 整数・小数のみの問題は textParts を持たないため、従来どおり problem.text を
// そのまま（エスケープした上で）表示する。
function renderQuestionText(problem) {
  els.questionText.innerHTML = problem.textParts
    ? renderTextPartsHtml(problem.textParts, { simplify: currentSimplifyFractions })
    : escapeHtml(problem.text);
}

export function renderProblem(problem) {
  currentSimplifyFractions = problem.simplifyFractions !== false;
  renderQuestionText(problem);
  updateStepIndicator(problem);
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
 * 2段階問題の進行表示を更新する。1つ目の式のときは「式を2つ答えよう！」、
 * 2つ目の式のときは、直前に正解した式（例: "22+138=160"）に続けて
 * 「の続きを答えよう」と表示する。
 */
function updateStepIndicator(problem) {
  if (problem.questionType === "multiStep" && problem.multiStep) {
    const state = problem.multiStep;
    const prevStep = state.completedSteps.find((s) => s.stepIndex === state.currentStepIndex - 1);
    let html;
    if (prevStep) {
      const formulaHtml =
        `${renderValueHtml(prevStep.left)}${escapeHtml(prevStep.operator)}${renderValueHtml(prevStep.right)}` +
        `＝${renderValueHtml(prevStep.result)}`;
      html = `<span class="step-indicator-prev">${formulaHtml}</span>${escapeHtml("の続きを答えよう")}`;
    } else {
      html = escapeHtml("式を2つ答えよう！");
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
      btn.innerHTML = renderValueHtml(card.value, { useSeparator: false, simplify: currentSimplifyFractions });
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
        el.innerHTML = renderValueHtml(card.value, { useSeparator: false, simplify: currentSimplifyFractions });
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
    els.dragGhost.innerHTML = renderValueHtml(card.value, { useSeparator: false, simplify: currentSimplifyFractions });
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

export function showCorrectEffect(resultValue, { simplify = true } = {}) {
  // ■欄の答えの数字は、選択肢カード・解答欄と同じく桁区切りカンマを付けずに表示する。
  // 百分率が答えになるのは「割合・百分率」（何%ですかと問う問題）だけのため、
  // その場合だけ「0.5→50%」のように小数と百分率の両方を示す。
  els.resultBox.innerHTML = isPercentValue(resultValue)
    ? renderPercentConversionHtml(resultValue, { useSeparator: false })
    : renderValueHtml(resultValue, { useSeparator: false, simplify });
  els.correctMark.classList.add("show");
  nextQuestionTapLock = false;
  window.setTimeout(() => {
    els.tapToContinue.classList.add("show");
  }, 450);
}

export function hideCorrectEffect() {
  els.correctMark.classList.remove("show");
  els.tapToContinue.classList.remove("show");
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
    callbacks.onNextTap && callbacks.onNextTap();
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
  if (els.retireConfirmText) {
    els.retireConfirmText.textContent = isTraining ? "トレーニングを終了しますか？" : "バトルをリタイアしますか？";
  }
  els.retireYesBtn.textContent = isTraining ? "終了する" : "リタイアする";
  els.retireNoBtn.textContent = isTraining ? "続ける" : "バトルに戻る";
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

// ============== 結果画面 ==============

const RANGE_LABELS = {
  "4-1": "小学4年生・1学期",
  "4-2": "小学4年生・2学期",
  "4-3": "小学4年生・3学期",
  "4-multi-step": "2段階問題・整数（開発版）",
  "5-1": "小学5年生・1学期",
  "5-2": "小学5年生・2学期",
  "5-3": "小学5年生・3学期",
  "6-1": "小学6年生・1学期"
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

  els.resultRange.textContent = RANGE_LABELS[data.gradeTerm] || data.gradeTerm;
  els.resultLevel.textContent = `レベル${formatLevelLabel(data.level)}`;
  els.resultCorrectCount.textContent = `${data.correctCount}問`;
  els.resultScore.textContent = String(data.score);
  els.resultRank.textContent = data.rank;
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
  const questionTextHtml = entry.textParts
    ? renderTextPartsHtml(entry.textParts, { simplify })
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
    : `${renderValueHtml(displayResult, { useSeparator: false, simplify })}${escapeHtml(entry.answerUnit || "")}`;
  return `
    <div class="history-item-head">
      <span class="history-index">第${index + 1}問</span>
      <span class="history-category">${escapeHtml(entry.category)}</span>
    </div>
    <p class="history-text">${questionTextHtml}</p>
    <p class="history-formula">正解式：${renderValueHtml(entry.left, { useSeparator: false, simplify })}${entry.operator}${renderValueHtml(entry.right, { useSeparator: false, simplify })} = ${resultDisplayHtml}</p>
    ${buildHistoryCountsHtml(entry.incorrectCount, entry.timeoutCount)}
  `;
}

function buildMultiStepHistoryHtml(entry, index) {
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

  return `
    <div class="history-item-head">
      <span class="history-index">第${index + 1}問</span>
      <span class="history-category">${escapeHtml(entry.category)}</span>
    </div>
    <p class="history-text">${escapeHtml(entry.text)}</p>
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
  setupResultScreen();
  setupScoreDelta();
}
