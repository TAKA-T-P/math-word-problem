// アプリの初期化・各モジュールの読み込み・画面操作の橋渡しを行うエントリーポイント。

import { initUI } from "./ui.js";
import * as game from "./game.js";
import { TEMPLATE_SETS_BY_GRADE_TERM } from "../data/index.js";

// 問題データは data/index.js から一元的に取得する。
// data/grade4-term1.js のような個別ファイルは直接 import しない。
// 新しい学期のデータファイルを追加する場合は、data/index.js 側を修正すれば済み、
// このファイルの変更は不要。

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

  game.initGame(TEMPLATE_SETS_BY_GRADE_TERM);
}

document.addEventListener("DOMContentLoaded", main);
