// ハイスコア・効果音設定の保存/読み込みを行うモジュール。
// localStorage が使用できない環境（プライベートブラウジング等）でも
// アプリが停止しないように、すべての操作を try/catch で保護します。

const SOUND_SETTING_KEY = "mathWordBattle_soundEnabled";
const SELECTED_RANGE_KEY = "mathWordBattle_selectedGradeTerm";
const LAST_MODE_KEY = "mathWordBattle_lastMode";
const LAST_TRAINING_GRADETERM_KEY = "mathWordBattle_lastTrainingGradeTerm";
const LAST_TRAINING_CATEGORY_KEY = "mathWordBattle_lastTrainingCategoryId";

let localStorageAvailable = null;

function checkLocalStorageAvailable() {
  if (localStorageAvailable !== null) {
    return localStorageAvailable;
  }
  try {
    const testKey = "__math_word_battle_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    localStorageAvailable = true;
  } catch (error) {
    localStorageAvailable = false;
  }
  return localStorageAvailable;
}

function buildHighScoreKey(gradeTerm, level) {
  return `highScore_${gradeTerm}_level${level}`;
}

/**
 * 出題範囲とレベルの組み合わせに対応するハイスコアを読み込みます。
 * 保存データが無い/壊れている場合は 0 を返します。
 */
export function loadHighScore(gradeTerm, level) {
  if (!checkLocalStorageAvailable()) {
    return 0;
  }
  try {
    const raw = window.localStorage.getItem(buildHighScoreKey(gradeTerm, level));
    if (raw === null) {
      return 0;
    }
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * ハイスコアを保存します。既存のハイスコアより高い場合のみ更新します。
 * @returns {boolean} ハイスコアが更新されたかどうか
 */
export function saveHighScoreIfBetter(gradeTerm, level, score) {
  if (!checkLocalStorageAvailable()) {
    return false;
  }
  const current = loadHighScore(gradeTerm, level);
  if (score <= current) {
    return false;
  }
  try {
    window.localStorage.setItem(buildHighScoreKey(gradeTerm, level), String(score));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 効果音ON/OFF設定を読み込みます。デフォルトはON（true）です。
 */
export function loadSoundSetting() {
  if (!checkLocalStorageAvailable()) {
    return true;
  }
  try {
    const raw = window.localStorage.getItem(SOUND_SETTING_KEY);
    if (raw === null) {
      return true;
    }
    return raw === "true";
  } catch (error) {
    return true;
  }
}

/**
 * 効果音ON/OFF設定を保存します。
 */
export function saveSoundSetting(enabled) {
  if (!checkLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(SOUND_SETTING_KEY, enabled ? "true" : "false");
  } catch (error) {
    // 保存に失敗しても、アプリの動作は継続する
  }
}

/**
 * 前回選択した出題範囲（gradeTerm）を読み込みます。
 * 保存が無い/localStorageが使えない場合は null を返します。
 * 値が本当に選択可能な出題範囲かどうかは、ここでは判定しません
 * （呼び出し側＝ui.jsが、実際にタイトル画面に存在するボタンと突き合わせて、
 *  一致しなければ小学4年生1学期を初期値にしてください）。
 */
export function loadSelectedGradeTerm() {
  if (!checkLocalStorageAvailable()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SELECTED_RANGE_KEY);
    return typeof raw === "string" && raw.length > 0 ? raw : null;
  } catch (error) {
    return null;
  }
}

/**
 * 選択した出題範囲（gradeTerm）を保存します。
 */
export function saveSelectedGradeTerm(gradeTerm) {
  if (!checkLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(SELECTED_RANGE_KEY, gradeTerm);
  } catch (error) {
    // 保存に失敗しても、アプリの動作は継続する
  }
}

/**
 * 前回選択したモード（"battle" | "training"）を読み込みます。
 * 保存が無い/壊れている/localStorageが使えない場合は null を返します
 * （呼び出し側＝ui.jsが、"battle" 以外の不正値は "battle" 扱いにフォールバックしてください）。
 * トレーニングのスコア・進捗・ハイスコアはここでは一切扱いません（保存対象外）。
 */
export function loadLastMode() {
  if (!checkLocalStorageAvailable()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LAST_MODE_KEY);
    return raw === "battle" || raw === "training" ? raw : null;
  } catch (error) {
    return null;
  }
}

/**
 * 選択したモード（"battle" | "training"）を保存します。
 */
export function saveLastMode(mode) {
  if (!checkLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(LAST_MODE_KEY, mode);
  } catch (error) {
    // 保存に失敗しても、アプリの動作は継続する
  }
}

/**
 * 前回選択したトレーニングの学年・学期（gradeTerm）を読み込みます。
 * 保存が無い/localStorageが使えない場合は null を返します。
 * 値が実際に選択可能な学期かどうかは、呼び出し側（ui.js）が
 * data/category-registry.js の内容と突き合わせて判定してください。
 */
export function loadLastTrainingGradeTerm() {
  if (!checkLocalStorageAvailable()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LAST_TRAINING_GRADETERM_KEY);
    return typeof raw === "string" && raw.length > 0 ? raw : null;
  } catch (error) {
    return null;
  }
}

/**
 * 選択したトレーニングの学年・学期（gradeTerm）を保存します。
 */
export function saveLastTrainingGradeTerm(gradeTerm) {
  if (!checkLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(LAST_TRAINING_GRADETERM_KEY, gradeTerm);
  } catch (error) {
    // 保存に失敗しても、アプリの動作は継続する
  }
}

/**
 * 前回選択したトレーニングのカテゴリID（categoryId）を読み込みます。
 * 保存が無い/localStorageが使えない場合は null を返します。
 * 値が実際に選択可能なカテゴリかどうかは、呼び出し側（ui.js）が
 * data/category-registry.js の内容と突き合わせて判定してください。
 */
export function loadLastTrainingCategoryId() {
  if (!checkLocalStorageAvailable()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LAST_TRAINING_CATEGORY_KEY);
    return typeof raw === "string" && raw.length > 0 ? raw : null;
  } catch (error) {
    return null;
  }
}

/**
 * 選択したトレーニングのカテゴリID（categoryId）を保存します。
 */
export function saveLastTrainingCategoryId(categoryId) {
  if (!checkLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(LAST_TRAINING_CATEGORY_KEY, categoryId);
  } catch (error) {
    // 保存に失敗しても、アプリの動作は継続する
  }
}
