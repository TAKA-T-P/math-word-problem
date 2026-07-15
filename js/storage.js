// ハイスコア・効果音設定の保存/読み込みを行うモジュール。
// localStorage が使用できない環境（プライベートブラウジング等）でも
// アプリが停止しないように、すべての操作を try/catch で保護します。

const SOUND_SETTING_KEY = "mathWordBattle_soundEnabled";
const SELECTED_RANGE_KEY = "mathWordBattle_selectedGradeTerm";
const LAST_MODE_KEY = "mathWordBattle_lastMode";
const LAST_TRAINING_GRADETERM_KEY = "mathWordBattle_lastTrainingGradeTerm";
// エネミー図鑑で解放済み（＝倒したことがある）エネミーのID一覧（運用開始後に追加）。
// js/enemy-list.js の各エネミーが持つ安定したid（名前・絵文字が変わっても壊れない）を
// JSON配列として保存する。
const DEFEATED_ENEMY_IDS_KEY = "mathWordBattle_defeatedEnemyIds";
// 小学6年生3学期（第12段階）の出題グループ（グループA/B/Cの3グループ）で、
// 端数（余り）をどのグループから受け取るかのローテーション位置。ゲームを1回開始する
// たびに js/game.js が進め、複数回プレイしたときに毎回同じグループばかりに
// 端数が偏らないようにする（question-generator.js の planQuestionSequenceThreeGroup() 参照）。
const GRADE6_TERM3_ROTATION_KEY = "mathWordBattle_grade6Term3RotationIndex";

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

// ハイスコアのキー接頭辞。出題範囲・レベルの組み合わせごとに `highScore_4-1_level1` のような
// キーが動的に作られるため、一括消去（resetHighScoresAndEnemyDex()）ではこの接頭辞を持つ
// キーをすべて探して削除する（個々の組み合わせを列挙する必要が無い）。
const HIGH_SCORE_KEY_PREFIX = "highScore_";

function buildHighScoreKey(gradeTerm, level) {
  return `${HIGH_SCORE_KEY_PREFIX}${gradeTerm}_level${level}`;
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
 * 前回選択したモード（"battle" | "training" | "review"）を読み込みます。
 * 保存が無い/壊れている/localStorageが使えない場合は null を返します
 * （呼び出し側＝ui.jsが、"battle" 以外の不正値は "battle" 扱いにフォールバックしてください）。
 * トレーニング・総復習のスコア・進捗・ハイスコアはここでは一切扱いません（保存対象外）。
 */
export function loadLastMode() {
  if (!checkLocalStorageAvailable()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LAST_MODE_KEY);
    return raw === "battle" || raw === "training" || raw === "review" ? raw : null;
  } catch (error) {
    return null;
  }
}

/**
 * 選択したモード（"battle" | "training" | "review"）を保存します。
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
 * 小学6年生3学期の出題グループ（グループA/B/C）のローテーション位置を読み込みます
 * （第12段階で追加）。保存が無い/壊れている/localStorageが使えない場合は 0 を返します。
 */
export function loadGrade6Term3RotationIndex() {
  if (!checkLocalStorageAvailable()) {
    return 0;
  }
  try {
    const raw = window.localStorage.getItem(GRADE6_TERM3_ROTATION_KEY);
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 小学6年生3学期の出題グループのローテーション位置を保存します（第12段階で追加）。
 */
export function saveGrade6Term3RotationIndex(index) {
  if (!checkLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(GRADE6_TERM3_ROTATION_KEY, String(index));
  } catch (error) {
    // 保存に失敗しても、アプリの動作は継続する
  }
}

/**
 * 倒したことがあるエネミーのID一覧を読み込みます（エネミー図鑑の解放状態。運用開始後に追加）。
 * 保存が無い/localStorageが使えない場合は空配列を返します。保存データが壊れている
 * （不正なJSON・配列でない・要素が文字列でない）場合も、安全に空配列へフォールバックします
 * （エネミー図鑑が未解放状態から始まるだけで、ゲーム本体は止まりません）。
 */
export function loadDefeatedEnemyIds() {
  if (!checkLocalStorageAvailable()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(DEFEATED_ENEMY_IDS_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id) => typeof id === "string" && id.length > 0);
  } catch (error) {
    return [];
  }
}

/**
 * 倒したことがあるエネミーのID一覧を保存します（運用開始後に追加）。
 * 重複除去は呼び出し側の recordDefeatedEnemy() が行うため、ここでは配列をそのまま
 * JSON文字列にして保存するだけです。
 */
export function saveDefeatedEnemyIds(ids) {
  if (!checkLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(DEFEATED_ENEMY_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    // 保存に失敗しても、アプリの動作は継続する
  }
}

/**
 * 指定したエネミーIDを倒したことがあるかどうかを判定します
 * （エネミー図鑑の解放判定用。運用開始後に追加）。
 */
export function isEnemyDefeated(enemyId) {
  return loadDefeatedEnemyIds().includes(enemyId);
}

/**
 * エネミーを「倒した」として記録します（運用開始後に追加）。
 * 通常バトル・総復習の**クリアが確定した瞬間だけ**呼び出してください
 * （ゲームオーバー・リタイア・結果画面を開いただけ・トレーニングの完了からは呼ばないこと）。
 * すでに記録済みのIDを渡しても重複追加せず、エラーにもなりません。
 */
export function recordDefeatedEnemy(enemyId) {
  if (typeof enemyId !== "string" || enemyId.length === 0) {
    return;
  }
  const ids = loadDefeatedEnemyIds();
  if (ids.includes(enemyId)) {
    return;
  }
  saveDefeatedEnemyIds([...ids, enemyId]);
}

/**
 * すべてのハイスコア（出題範囲・レベルの組み合わせごとの highScore_* キー）と、
 * エネミー図鑑の解放状態（倒したことがあるエネミーの記録）を消去します
 * （ヘルプメニューの「⚠記録を消す」用。運用開始後に追加）。
 * 効果音設定・前回選んだ出題範囲/モード・トレーニングの選択学期・6年3学期の出題グループ
 * ローテーション位置など、それ以外の保存データには一切触れません。
 */
export function resetHighScoresAndEnemyDex() {
  if (!checkLocalStorageAvailable()) {
    return;
  }
  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(HIGH_SCORE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.removeItem(DEFEATED_ENEMY_IDS_KEY);
  } catch (error) {
    // 消去に失敗しても、アプリの動作は継続する
  }
}
