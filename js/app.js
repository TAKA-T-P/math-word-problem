// アプリの初期化・各モジュールの読み込み・画面操作の橋渡しを行うエントリーポイント。

import { initUI } from "./ui.js";
import * as game from "./game.js";
import { grade4Term1Templates } from "../data/grade4-term1.js";

// 出題範囲ごとの問題テンプレート一覧。
// 新しい学期のデータファイルを追加する場合は、ここに1行追加するだけで済みます。
const templateSets = {
  "4-1": grade4Term1Templates
};

function main() {
  // ui.js は DOM要素をキャッシュしてから使う必要があるため、
  // 内部で ui.* を呼び出す game.initGame() より先に initUI() を実行する。
  initUI({
    onStart: (settings) => game.startNewGame(settings),
    onSoundToggle: () => game.toggleSound(),
    onJudge: (answer) => game.handleJudge(answer),
    onNextTap: () => game.handleNextTap(),
    onRetireOpen: () => game.pauseForRetireDialog(),
    onRetireConfirmed: () => game.confirmRetire(),
    onRetireCancelled: () => game.cancelRetire(),
    onRetry: () => game.retryGame(),
    onToTitle: () => game.returnToTitle()
  });

  game.initGame(templateSets);
}

document.addEventListener("DOMContentLoaded", main);
