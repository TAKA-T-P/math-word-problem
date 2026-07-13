// バトルに出現するエネミー（絵文字・名前・出現レベル）の一覧。
// js/game.js（バトル開始時のランダム抽選、選んだレベル以下のminLevelを持つエネミーだけが対象）と
// js/ui.js（タイトル画面のスクロール表示、レベルを問わず全種類を表示）の
// 両方から参照する、単一の情報源。エネミーを追加・変更する場合はこの配列だけを編集すればよい。
//
// minLevel: そのエネミーが出現し始める最小の内部レベル（1〜5、レベルMAXは6として扱う）。
// 例えばレベルMAXでしか出ないエネミーは minLevel:6 にする（内部レベルの仕組みは
// js/game.js の heartsForLevel() 等と同じ）。

export const ENEMY_LIST = [
  // すべてのレベルで出現
  { emoji: "🦟", name: "ぶんぶん", minLevel: 1 },
  { emoji: "🦎", name: "とかげ", minLevel: 1 },
  { emoji: "🦇", name: "こうもり", minLevel: 1 },
  { emoji: "🐍", name: "へび", minLevel: 1 },
  { emoji: "🐙", name: "タコンスター", minLevel: 1 },
  { emoji: "🦅", name: "わし", minLevel: 1 },
  { emoji: "🐺", name: "おおかみ", minLevel: 1 },
  { emoji: "👻", name: "おばけ", minLevel: 1 },
  // レベル2以上で出現
  { emoji: "🐗", name: "いのしし", minLevel: 2 },
  { emoji: "👁️", name: "まなこ", minLevel: 2 },
  { emoji: "💀", name: "がいこつ", minLevel: 2 },
  { emoji: "🕷️", name: "クモンスター", minLevel: 2 },
  // レベル3以上で出現
  { emoji: "🦂", name: "さそり", minLevel: 3 },
  { emoji: "🤖", name: "ロボット", minLevel: 3 },
  { emoji: "😈", name: "あくまくん", minLevel: 3 },
  { emoji: "🧙", name: "まほうつかい", minLevel: 3 },
  // レベル4以上で出現
  { emoji: "👾", name: "インベーダー", minLevel: 4 },
  { emoji: "👹", name: "あかおに", minLevel: 4 },
  { emoji: "👺", name: "てんぐ", minLevel: 4 },
  { emoji: "🧛", name: "きゅうけつき", minLevel: 4 },
  // レベル5以上で出現
  { emoji: "🦖", name: "きょうりゅう", minLevel: 5 },
  { emoji: "👽", name: "エイリアン", minLevel: 5 },
  // レベルMAX（内部レベル6）のみで出現
  { emoji: "🛸", name: "UFO", minLevel: 6 },
  { emoji: "🐲", name: "ドラゴン", minLevel: 6 }
];
