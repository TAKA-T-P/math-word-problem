// アプリの初期化・各モジュールの読み込み・画面操作の橋渡しを行うエントリーポイント。
//
// 通常バトル（js/game.js）とトレーニング（js/training-mode.js）は互いを参照しない、
// 完全に独立したモジュールです。「今どちらのモードで遊んでいるか」の判定・振り分けは、
// このファイルの currentMode 変数とコールバック内の分岐だけに集約し、
// game.js・training-mode.js・ui.js の内部に if (mode === "training") のような分岐を
// 増やさないようにしています（第6段階の設計方針）。

import { initUI } from "./ui.js";
import * as game from "./game.js";
import * as training from "./training-mode.js";
import { TEMPLATE_SETS_BY_GRADE_TERM } from "../data/index.js";

// 問題データは data/index.js から一元的に取得する。
// data/grade4-term1.js のような個別ファイルは直接 import しない。
// 新しい学期のデータファイルを追加する場合は、data/index.js 側を修正すれば済み、
// このファイルの変更は不要。

// タイトル画面でスタートを押した時点のモードを覚えておき、以降のバトル画面・結果画面の
// 操作（判定・次へ・リタイア・もう一度・タイトルへ戻る）を、正しいモジュールに振り分ける。
let currentMode = "battle";

function main() {
  // ui.js は DOM要素をキャッシュしてから使う必要があるため、
  // 内部で ui.* を呼び出す game.initGame() / training.initTraining() より先に initUI() を実行する。
  initUI({
    onStart: (settings) => {
      currentMode = settings.mode === "training" ? "training" : "battle";
      if (currentMode === "training") {
        training.startTraining(settings);
      } else {
        game.startNewGame(settings);
      }
    },
    onSoundToggle: () => game.toggleSound(),
    onJudge: (answer) => (currentMode === "training" ? training.handleJudge(answer) : game.handleJudge(answer)),
    onNextTap: () => (currentMode === "training" ? training.handleNextTap() : game.handleNextTap()),
    onRetireOpen: () => (currentMode === "training" ? training.pauseForRetireDialog() : game.pauseForRetireDialog()),
    onRetireConfirmed: () => (currentMode === "training" ? training.confirmRetire() : game.confirmRetire()),
    onRetireCancelled: () => (currentMode === "training" ? training.cancelRetire() : game.cancelRetire()),
    onRetry: () => (currentMode === "training" ? training.retryTraining() : game.retryGame()),
    onToTitle: () => (currentMode === "training" ? training.returnToTitle() : game.returnToTitle())
  });

  game.initGame(TEMPLATE_SETS_BY_GRADE_TERM);
  training.initTraining(TEMPLATE_SETS_BY_GRADE_TERM);
}

document.addEventListener("DOMContentLoaded", main);
