// Web Audio API を使って効果音を生成するモジュール。
// 外部の音声ファイルは一切使用しません。
// AudioContext はブラウザの仕様上、ユーザー操作の後にしか開始できないため、
// initAudio() をユーザー操作（スタートボタン等）のハンドラ内から呼び出してください。

let audioContext = null;
let soundEnabled = true;

/**
 * AudioContext を初期化（または再開）します。
 * 何度呼び出しても、AudioContext は1つしか生成されません。
 */
export function initAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    try {
      audioContext = new AudioContextClass();
    } catch (error) {
      audioContext = null;
      return;
    }
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
}

export function isSoundEnabled() {
  return soundEnabled;
}

function canPlay() {
  return soundEnabled && audioContext && audioContext.state !== "closed";
}

/**
 * 単音を鳴らします。クリックノイズを避けるため、簡単なエンベロープをかけています。
 */
function playTone({ frequency, startTime, duration, type = "sine", peakVolume = 0.2 }) {
  if (!canPlay()) {
    return;
  }
  const ctx = audioContext;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  const attackEnd = startTime + Math.min(0.02, duration / 4);
  const releaseStart = Math.max(attackEnd, startTime + duration - Math.min(0.05, duration / 3));

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakVolume, attackEnd);
  gain.gain.setValueAtTime(peakVolume, releaseStart);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playSlide({ startFrequency, endFrequency, startTime, duration, type = "sawtooth", peakVolume = 0.18 }) {
  if (!canPlay()) {
    return;
  }
  const ctx = audioContext;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(startFrequency, startTime);
  oscillator.frequency.linearRampToValueAtTime(endFrequency, startTime + duration);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakVolume, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

/**
 * カウントダウン音（3・2・1・START!）。
 * final が true のときは、START! 用に高く長い音を鳴らします。
 */
export function playCountdown(final = false) {
  if (!canPlay()) {
    return;
  }
  const now = audioContext.currentTime;
  if (final) {
    playTone({ frequency: 987.77, startTime: now, duration: 0.35, type: "triangle", peakVolume: 0.25 });
  } else {
    playTone({ frequency: 659.25, startTime: now, duration: 0.15, type: "triangle", peakVolume: 0.2 });
  }
}

/**
 * 解答時間ゲージが減っている間、0.5秒ごとに鳴らす「カチ」という時計の秒針のような音。
 * 短く控えめな音量にし、連続で鳴っても耳障りになりすぎないようにしている。
 */
export function playTick() {
  if (!canPlay()) {
    return;
  }
  const now = audioContext.currentTime;
  playTone({ frequency: 1200, startTime: now, duration: 0.045, type: "square", peakVolume: 0.04 });
}

/**
 * 正解音（明るい上昇アルペジオ）。
 */
export function playCorrect() {
  if (!canPlay()) {
    return;
  }
  const now = audioContext.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, index) => {
    playTone({
      frequency: freq,
      startTime: now + index * 0.08,
      duration: 0.16,
      type: "sine",
      peakVolume: 0.22
    });
  });
}

/**
 * 不正解・ダメージ音（低く短いブザー音）。
 */
export function playDamage() {
  if (!canPlay()) {
    return;
  }
  const now = audioContext.currentTime;
  playSlide({
    startFrequency: 220,
    endFrequency: 110,
    startTime: now,
    duration: 0.25,
    type: "sawtooth",
    peakVolume: 0.22
  });
}

/**
 * 敵撃破音（軽快な上昇シーケンス）。
 */
export function playEnemyDefeated() {
  if (!canPlay()) {
    return;
  }
  const now = audioContext.currentTime;
  const notes = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4,C5,E5,G5,C6
  notes.forEach((freq, index) => {
    playTone({
      frequency: freq,
      startTime: now + index * 0.09,
      duration: 0.2,
      type: "square",
      peakVolume: 0.16
    });
  });
}

/**
 * ゲームオーバー音（重く下降するシーケンス）。
 */
export function playGameOver() {
  if (!canPlay()) {
    return;
  }
  const now = audioContext.currentTime;
  const notes = [392.0, 349.23, 293.66, 220.0];
  notes.forEach((freq, index) => {
    playTone({
      frequency: freq,
      startTime: now + index * 0.22,
      duration: 0.3,
      type: "triangle",
      peakVolume: 0.2
    });
  });
}
