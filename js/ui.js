// 画面表示・DOM操作・カード操作（タップ／ドラッグ）を担当するモジュール。
// ゲームの状態（ハート数・スコア等）そのものは持たず、game.js から渡された値を
// 表示するだけに徹しています。
// 数値の表示は、必ず number-utils.js の formatNumber() を経由します
// （整数・小数・大きな数の表示をアプリ全体で統一するため）。

import { formatNumber } from "./number-utils.js";
import { isFractionValue } from "./value-utils.js";
import { renderValueHtml, renderTextPartsHtml, escapeHtml } from "./value-renderer.js";
import { loadSelectedGradeTerm, saveSelectedGradeTerm } from "./storage.js";

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

function qs(id) {
  return document.getElementById(id);
}

function cacheElements() {
  els = {
    soundToggleBtn: qs("sound-toggle-btn"),
    rangeSelect: qs("range-select"),
    levelSelect: qs("level-select"),
    startBtn: qs("start-btn"),

    countdownText: qs("countdown-text"),

    retireBtn: qs("retire-btn"),
    scoreDisplay: qs("score-display"),
    rankDisplay: qs("rank-display"),
    scoreDelta: qs("score-delta"),
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
    retireYesBtn: qs("retire-confirm-yes"),
    retireNoBtn: qs("retire-confirm-no"),
    damageFlash: qs("damage-flash"),
    dragGhost: qs("drag-ghost"),
    screenBattle: qs("screen-battle"),

    resultTitle: qs("result-title"),
    resultRange: qs("result-range"),
    resultLevel: qs("result-level"),
    resultCorrectCount: qs("result-correct-count"),
    resultHeartsRemaining: qs("result-hearts-remaining"),
    resultScore: qs("result-score"),
    resultRank: qs("result-rank"),
    resultHighscore: qs("result-highscore"),
    resultNewRecord: qs("result-newrecord"),
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

function setupTitleScreen() {
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

  els.startBtn.addEventListener("click", () => {
    const rangeBtn = els.rangeSelect.querySelector(".range-btn.selected");
    const levelBtn = els.levelSelect.querySelector(".level-btn.selected");
    const settings = {
      gradeTerm: rangeBtn ? rangeBtn.dataset.range : "4-1",
      level: levelBtn ? Number.parseInt(levelBtn.dataset.level, 10) : 1
    };
    callbacks.onStart && callbacks.onStart(settings);
  });

  if (DEBUG_MODE) {
    addDevMultiStepRangeOption();
  }

  restoreSelectedGradeTerm();
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
  els.enemyEmoji.classList.remove("enemy-shake", "enemy-defeated");
  els.enemyEmoji.textContent = enemy.emoji;
  els.enemyName.textContent = enemy.name;
}

export function updateEnemyHp(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  els.enemyHpFill.style.width = `${clamped}%`;
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

export function updateScoreboard(score, rank) {
  els.scoreDisplay.textContent = String(score);
  els.rankDisplay.textContent = rank;
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

// ============== 問題表示・カード ==============

// 分数を含む問題文は problem.textParts（文字列/値パーツの配列）を持つため、
// value-renderer.js の renderTextPartsHtml() で縦型分数を含むHTMLとして描画する。
// 整数・小数のみの問題は textParts を持たないため、従来どおり problem.text を
// そのまま（エスケープした上で）表示する。
function renderQuestionText(problem) {
  els.questionText.innerHTML = problem.textParts
    ? renderTextPartsHtml(problem.textParts)
    : escapeHtml(problem.text);
}

export function renderProblem(problem) {
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

function updateStepIndicator(problem) {
  if (problem.questionType === "multiStep" && problem.multiStep) {
    els.stepIndicator.textContent = `式 ${problem.multiStep.currentStepIndex + 1}／${problem.multiStep.totalSteps}`;
    els.stepIndicator.classList.add("show");
  } else {
    els.stepIndicator.classList.remove("show");
    els.stepIndicator.textContent = "";
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
  const displayText = formatNumber(value);
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
      btn.innerHTML = renderValueHtml(card.value);
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
        el.innerHTML = renderValueHtml(card.value);
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
    els.dragGhost.innerHTML = renderValueHtml(card.value);
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

export function showCorrectEffect(resultValue) {
  els.resultBox.innerHTML = renderValueHtml(resultValue);
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
  els.resultBox.innerHTML = renderValueHtml(stepResult);
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
  els.retireDialog.classList.add("show");
}

export function hideRetireDialog() {
  els.retireDialog.classList.remove("show");
}

// ============== 結果画面 ==============

const RANGE_LABELS = {
  "4-1": "小学4年生・1学期",
  "4-2": "小学4年生・2学期",
  "4-3": "小学4年生・3学期",
  "4-multi-step": "2段階問題・整数（開発版）"
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
  els.resultHeartsRemaining.textContent = `${data.heartsRemaining} / ${data.maxHearts}`;
  els.resultScore.textContent = String(data.score);
  els.resultRank.textContent = data.rank;
  els.resultHighscore.textContent = String(data.highScore);
  els.resultNewRecord.classList.toggle("show", Boolean(data.isNewRecord));

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
  const questionTextHtml = entry.textParts ? renderTextPartsHtml(entry.textParts) : escapeHtml(entry.text);
  return `
    <div class="history-item-head">
      <span class="history-index">第${index + 1}問</span>
      <span class="history-category">${escapeHtml(entry.category)}</span>
    </div>
    <p class="history-text">${questionTextHtml}</p>
    <p class="history-formula">正解式：${renderValueHtml(entry.left)}${entry.operator}${renderValueHtml(entry.right)} = ${renderValueHtml(entry.result)}${escapeHtml(entry.answerUnit || "")}</p>
    ${buildHistoryCountsHtml(entry.incorrectCount, entry.timeoutCount)}
  `;
}

function buildMultiStepHistoryHtml(entry, index) {
  const stepsHtml = entry.steps
    .map((step) => {
      if (step.completed) {
        // step.formula は multi-step-engine.js 側で既に formatNumber 済みの文字列。
        return `<p class="history-step">式${step.stepNumber}：${step.formula}＝${formatNumber(step.result)}</p>`;
      }
      if (step.lastAttemptFormula) {
        return `<p class="history-step history-step-incomplete">式${step.stepNumber}：${step.lastAttemptFormula}（解答途中）</p>`;
      }
      return `<p class="history-step history-step-incomplete">式${step.stepNumber}：未回答</p>`;
    })
    .join("");

  const answerLine = entry.isComplete
    ? `<p class="history-final">答え：${renderValueHtml(entry.finalAnswer)}${escapeHtml(entry.answerUnit || "")}</p>`
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
  setupResultScreen();
}
