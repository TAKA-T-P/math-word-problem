// 画面表示・DOM操作・カード操作（タップ／ドラッグ）を担当するモジュール。
// ゲームの状態（ハート数・スコア等）そのものは持たず、game.js から渡された値を
// 表示するだけに徹しています。

const DRAG_THRESHOLD = 6;

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
    enemyEmoji: qs("enemy-emoji"),
    enemyName: qs("enemy-name"),
    enemyHpFill: qs("enemy-hp-fill"),
    questionText: qs("question-text"),
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
    els.rangeSelect.querySelectorAll(".range-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
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

// ============== 問題表示・カード ==============

export function renderProblem(problem) {
  els.questionText.textContent = problem.text;
  slots = [null, null, null];
  allCards = problem.choices.map((c) => ({ ...c }));
  renderSlots();
  renderChoices();
  els.resultBox.textContent = "";
  hideCorrectEffect();
  hideBattleMessage();
}

function isCardPlaced(cardId) {
  return slots.some((c) => c !== null && c.cardId === cardId);
}

function renderChoices() {
  els.choicesContainer.innerHTML = "";
  for (const card of allCards) {
    const placed = isCardPlaced(card.cardId);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `choice-card choice-${card.type}${placed ? " placed" : ""}`;
    btn.dataset.cardId = card.cardId;
    btn.textContent = String(card.value);
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
    if (card) {
      el.textContent = String(card.value);
      el.classList.add("filled");
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
  els.dragGhost.textContent = String(card.value);
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
  els.resultBox.textContent = String(resultValue);
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
  "4-1": "小学4年生・1学期"
};

export function showResultScreen(data) {
  els.resultTitle.textContent = data.title;
  els.resultTitle.className = `result-title ${data.variant || ""}`;
  qs("screen-result").classList.toggle("result-bright", data.variant === "clear");
  qs("screen-result").classList.toggle("result-dark", data.variant === "gameover");

  els.resultRange.textContent = RANGE_LABELS[data.gradeTerm] || data.gradeTerm;
  els.resultLevel.textContent = `レベル${data.level}`;
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
    item.innerHTML = `
      <div class="history-item-head">
        <span class="history-index">第${i + 1}問</span>
        <span class="history-category">${entry.category}</span>
      </div>
      <p class="history-text">${entry.text}</p>
      <p class="history-formula">正解式：${entry.left}${entry.operator}${entry.right} = ${entry.result}${entry.answerUnit}</p>
      <p class="history-final">さいごに作った式：${entry.lastAttemptText}</p>
      <div class="history-counts">
        <span>不正解 ${entry.incorrectCount}回</span>
        <span>時間切れ ${entry.timeoutCount}回</span>
      </div>
    `;
    els.historyList.appendChild(item);
  });
}

function setupResultScreen() {
  els.retryBtn.addEventListener("click", () => {
    callbacks.onRetry && callbacks.onRetry();
  });
  els.toTitleBtn.addEventListener("click", () => {
    callbacks.onToTitle && callbacks.onToTitle();
  });
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
