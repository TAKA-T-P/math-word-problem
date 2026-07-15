// アプリの初期化・各モジュールの読み込み・画面操作の橋渡しを行うエントリーポイント。
//
// 通常バトル（js/game.js）・トレーニング（js/training-mode.js）・総復習
// （js/review-mode.js）は、互いを参照しない完全に独立したモジュールです。
// 「今どのモードで遊んでいるか」の判定・振り分けは、このファイルの MODES ディスパッチ
// テーブルと currentMode 変数だけに集約し、game.js・training-mode.js・review-mode.js・
// ui.js の内部に if (mode === "training") のような分岐を増やさないようにしています
// （第6段階の設計方針。モードが3つに増えた運用開始後、if/三項演算子の連鎖では
// 読みにくくなるため、モードごとの操作をまとめたディスパッチテーブルに整理しました）。

import { initUI } from "./ui.js";
import * as game from "./game.js";
import * as training from "./training-mode.js";
import * as review from "./review-mode.js";
import { TEMPLATE_SETS_BY_GRADE_TERM } from "../data/index.js";

// 問題データは data/index.js から一元的に取得する。
// data/grade4-term1.js のような個別ファイルは直接 import しない。
// 新しい学期のデータファイルを追加する場合は、data/index.js 側を修正すれば済み、
// このファイルの変更は不要。

// モード（"battle"|"training"|"review"）ごとに、タイトル画面・バトル画面・結果画面の
// 操作をどのモジュールのどの関数に橋渡しするかをまとめたディスパッチテーブル。
// 各モジュールの関数名はモードごとに異なる（例: retryGame/retryTraining/retryReview）ため、
// ここで統一された名前（start/judge/nextTap/...）に正規化する。
const MODES = {
  battle: {
    start: (settings) => game.startNewGame(settings),
    judge: (answer) => game.handleJudge(answer),
    nextTap: () => game.handleNextTap(),
    retireOpen: () => game.pauseForRetireDialog(),
    retireConfirmed: () => game.confirmRetire(),
    retireCancelled: () => game.cancelRetire(),
    retry: () => game.retryGame(),
    toTitle: () => game.returnToTitle()
  },
  training: {
    start: (settings) => training.startTraining(settings),
    judge: (answer) => training.handleJudge(answer),
    nextTap: () => training.handleNextTap(),
    retireOpen: () => training.pauseForRetireDialog(),
    retireConfirmed: () => training.confirmRetire(),
    retireCancelled: () => training.cancelRetire(),
    retry: () => training.retryTraining(),
    toTitle: () => training.returnToTitle()
  },
  review: {
    start: (settings) => review.startReview(settings),
    judge: (answer) => review.handleJudge(answer),
    nextTap: () => review.handleNextTap(),
    retireOpen: () => review.pauseForRetireDialog(),
    retireConfirmed: () => review.confirmRetire(),
    retireCancelled: () => review.cancelRetire(),
    retry: () => review.retryReview(),
    toTitle: () => review.returnToTitle()
  }
};

// タイトル画面でスタートを押した時点のモードを覚えておき、以降のバトル画面・結果画面の
// 操作（判定・次へ・リタイア・もう一度・タイトルへ戻る）を、正しいモジュールに振り分ける。
let currentMode = "battle";

function main() {
  // ui.js は DOM要素をキャッシュしてから使う必要があるため、
  // 内部で ui.* を呼び出す game.initGame() / training.initTraining() / review.initReview() より
  // 先に initUI() を実行する。
  initUI({
    onStart: (settings) => {
      currentMode = MODES[settings.mode] ? settings.mode : "battle";
      MODES[currentMode].start(settings);
    },
    onSoundToggle: () => game.toggleSound(),
    onJudge: (answer) => MODES[currentMode].judge(answer),
    onNextTap: () => MODES[currentMode].nextTap(),
    onRetireOpen: () => MODES[currentMode].retireOpen(),
    onRetireConfirmed: () => MODES[currentMode].retireConfirmed(),
    onRetireCancelled: () => MODES[currentMode].retireCancelled(),
    onRetry: () => MODES[currentMode].retry(),
    onToTitle: () => MODES[currentMode].toTitle()
  });

  game.initGame(TEMPLATE_SETS_BY_GRADE_TERM);
  training.initTraining(TEMPLATE_SETS_BY_GRADE_TERM);
  review.initReview(TEMPLATE_SETS_BY_GRADE_TERM);
}

document.addEventListener("DOMContentLoaded", main);
