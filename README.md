# さんすう文章題クエスト！（math-word-battle）

小学4年生〜6年生を対象とした、算数の文章題学習アプリです。
敵キャラクターとのバトル形式で、文章題の式をカードで組み立てながら学習します。

**現在のバージョンは第12段階です。** 小学4年生・1学期（整数の四則計算）・2学期（小数のたし算/ひき算・
大きな数・2けたでわるわり算・整数の2段階文章題）・3学期（小数×整数、小数÷整数、同分母分数のたし算・ひき算）・
5年生1学期（小数×小数、小数÷小数、小数倍、もとの量）・5年生2学期（異分母分数のたし算・ひき算、平均、
単位量あたり、混み具合）・5年生3学期（速さ・道のり・時間、割合・比べる量・百分率・もとにする量、割引、増量）・
6年生1学期（分数×整数、分数×分数、分数÷整数、整数÷分数、分数÷分数、分数倍・比べる量、分数倍・もとの量、
単位量あたり（分数））・6年生2学期（分数の速さ・道のり・時間、分数割合・比べる量・割合・もとにする量、
比を使った数量、比例配分）に加えて、**小学6年生・3学期（比例・対応する量、反比例・対応する量、
縮尺・実際の長さ、縮尺・地図上の長さ）を通常バトルの正式モードとして追加**しました
（「縮尺を求める」カテゴリは運用開始後に削除しました）。
第12段階では、比例定数・反比例の一定の積を「式1で児童が求める中間結果」として扱い、問題文には一切
表示しません。式には使わず問題文・表示専用の内部データ型として「縮尺」（例: `1：25,000`）を新設し、
長さの単位変換（mm・cm・m・km）も浮動小数点誤差の出ない専用処理として追加しています。また、
小学6年生3学期モードだけは、新内容50%・復習50%の既存方式ではなく、**小学5年生1〜3学期の復習・
小学6年生1〜2学期の復習・小学6年生3学期の新内容の3グループを、長期的におよそ1：1：1にする専用の
出題プラン**を使います（比例・比例定数、反比例・一定の積という独立カテゴリ、比例・反比例のグラフ、
拡大図・縮図の作図は今回は対象外。詳しくは[24. 小学6年生・3学期（第12段階）](#24-小学6年生3学期第12段階)）。
タイマー・ハート・敵HP・スコアの無い「トレーニングモード」では、50種類のカテゴリ（単元）から1つを選び、
そのカテゴリだけを5問、時間を気にせず何度でも解き直しながら練習できます
（詳しくは[18. トレーニングモード（第6段階）](#18-トレーニングモード第6段階)、
5年1学期の内容は[19. 小学5年生・1学期（第7段階）](#19-小学5年生1学期第7段階)、
5年2学期の内容は[20. 小学5年生・2学期（第8段階）](#20-小学5年生2学期第8段階)、
5年3学期の内容は[21. 小学5年生・3学期（第9段階）](#21-小学5年生3学期第9段階)、
6年1学期の内容は[22. 小学6年生・1学期（第10段階）](#22-小学6年生1学期第10段階)、
6年2学期の内容は[23. 小学6年生・2学期（第11段階）](#23-小学6年生2学期第11段階)、
6年3学期の内容は[24. 小学6年生・3学期（第12段階）](#24-小学6年生3学期第12段階)）。

運用開始後には、「文章題バトル」「トレーニング」に続く**第3のモード「総復習」**を追加しました。
「4年のまとめ」「5年のまとめ」「6年のまとめ」「小学校のまとめ」の4つから1つを選ぶと、
そのスコープに属する全カテゴリ（学年・学期を問わず、`data/category-registry.js` に登録されている
カテゴリ）から**ちょうど1問ずつ**、ランダムな順番で出題されます（4年＝13問、5年＝17問、
6年＝20問、小学校＝3学年合計50問。カテゴリ数はレジストリから動的に導出するため、今後カテゴリが
増減しても手動で数値を書き換える必要はありません）。文章題バトルと同じくハート・敵HPを持ち、
クリア／ゲームオーバー／リタイアの判定がありますが、スコア・ランク・時間制限（解答時間ゲージ）は
無く、代わりに「ゲームスタート（1問目開始）からの経過時間」を表示します。ハートは3個
（「小学校のまとめ」だけは1個）、出現する敵は固定（「小学校のまとめ」以外は「フォーミュラ仮面」、
「小学校のまとめ」は上位種の「フォーミュラ仮面エース」）です。詳しくは
[14. 現時点で実装済みの機能](#14-現時点で実装済みの機能)を参照してください。

3学期モードでは、分数を**教科書と同じ縦型（横線の上に分子、下に分母）**で表示します。整数・小数・分数は
`js/value-utils.js` が用意する共通の関数（`calculateValues` `areValuesEqual` など）を通じて扱うため、
ゲーム本体のコードには「整数か小数か分数か」で分岐する処理をほとんど書いていません。分数の計算は
小数に変換せず、分子・分母のまま正確に行います（`js/fraction-utils.js`）。

2学期・3学期モードはどちらも、その学期の新出内容と、それ以前の学期の復習内容をおよそ半々の比率で出題し、
同じカテゴリの問題が3問以上連続しないように出題順を調整します（3学期の復習内容は、1学期・2学期の
両方から偏りなく選ばれます）。小数計算は浮動小数点誤差が出ないよう専用のユーティリティ
（`js/number-utils.js`）で安全に計算・表示しています。

整数だけを使った「2つの式で解く」2段階問題そのものは、まだ独立の正式モードとしては
公開しておらず、`?debug=true` を付けたときだけタイトル画面に現れる開発版モードとして
確認できます（4年2学期モードでは「2段階文章題」という新内容の1カテゴリとして、4年3学期モードでは
復習内容の一部として、同じデータを再利用しています。小数を使った2段階問題は今回も未対応ですが、
6年2学期モードでは分数の速さ・比を使った数量・比例配分として、分数の値を含む2〜3段階問題を追加しています。
詳しくは[10. 開発版モード（2段階問題・整数）の起動方法](#10-開発版モード2段階問題整数の起動方法)、
6年2学期の内容は[23. 小学6年生・2学期（第11段階）](#23-小学6年生2学期第11段階)）。

- HTML / CSS / JavaScript のみで作成（React・Vue・Node.js・npm・ビルドツール不使用）
- JavaScript は ES Modules（`<script type="module">`）を使用
- ファイル間の参照はすべて相対パス（GitHub Pagesのプロジェクトサイトでも動作）
- 外部ライブラリ・外部画像・外部音声ファイルは不使用
- 敵キャラクターは絵文字、効果音は Web Audio API で生成
- ハイスコアは `localStorage` に保存
- `eval()` は使用しない

## 目次

1. [ファイル構成](#1-ファイル構成)
2. [問題データの共通スキーマ](#2-問題データの共通スキーマ)
3. [1段階問題のテンプレート追加方法](#3-1段階問題のテンプレート追加方法)
4. [2段階問題（questionType: "multiStep"）について](#4-2段階問題questiontype-multistepについて)
5. [値の共通データ形式と分数の扱い（value-utils.js / fraction-utils.js / value-renderer.js）](#5-値の共通データ形式と分数の扱いvalue-utilsjs--fraction-utilsjs--value-rendererjs)
6. [小学4年生・2学期/3学期の出題プラン（新内容/復習内容の比率とカテゴリ配分）](#6-小学4年生2学期3学期の出題プラン新内容復習内容の比率とカテゴリ配分)
7. [問題データの読み込み（data/index.js）と新しい学期の追加方法](#7-問題データの読み込みdataindexjsと新しい学期の追加方法)
8. [問題検証ページの使い方（tools/question-validator.html）](#8-問題検証ページの使い方toolsquestion-validatorhtml)
9. [デバッグモードの使い方（?debug=true）](#9-デバッグモードの使い方debugtrue)
10. [開発版モード（2段階問題・整数）の起動方法](#10-開発版モード2段階問題整数の起動方法)
11. [各JavaScriptファイルの役割](#11-各javascriptファイルの役割)
12. [ローカルでの起動方法](#12-ローカルでの起動方法)
13. [GitHub Pagesでの公開方法](#13-github-pagesでの公開方法)
14. [現時点で実装済みの機能](#14-現時点で実装済みの機能)
15. [今回対応していない内容／今後追加予定の機能](#15-今回対応していない内容今後追加予定の機能)
16. [動作確認用チェックリスト](#16-動作確認用チェックリスト)
17. [問題データ追加時のチェック項目](#17-問題データ追加時のチェック項目)
18. [トレーニングモード（第6段階）](#18-トレーニングモード第6段階)
19. [小学5年生・1学期（第7段階）](#19-小学5年生1学期第7段階)
20. [小学5年生・2学期（第8段階）](#20-小学5年生2学期第8段階)
21. [小学5年生・3学期（第9段階）](#21-小学5年生3学期第9段階)
22. [小学6年生・1学期（第10段階）](#22-小学6年生1学期第10段階)
23. [小学6年生・2学期（第11段階）](#23-小学6年生2学期第11段階)
24. [小学6年生・3学期（第12段階）](#24-小学6年生3学期第12段階)

## 1. ファイル構成

```
math-word-battle/
├─ index.html                 … 各画面のHTML構造、CSS/JSの読み込み
├─ README.md                  … このファイル
├─ css/
│  └─ style.css               … 全画面のスタイル（スマートフォン対応・デバッグパネル・2段階問題の演出含む）
├─ js/
│  ├─ app.js                    … アプリの初期化・画面操作の橋渡し・モード（バトル/トレーニング/総復習）の振り分け（MODESディスパッチテーブル。運用開始後に総復習を追加）
│  ├─ game.js                    … 通常バトルの状態管理・問題進行（4-2/4-3は出題プランに従って出題）・ハート/敵HP/タイマー管理・デバッグ出力。クリアが確定した瞬間だけ、登場したエネミーをエネミー図鑑へ記録する（recordDefeatedEnemy()、運用開始後に追加）
│  ├─ enemy-list.js              … 出現するエネミー24種類（通常バトルのランダム抽選プール）の絵文字・名前・出現レベル・クリア/ゲームオーバー時のせりふ・キャラ紹介文の単一の情報源。game.js（抽選）・ui.js（タイトル画面のプレビュー・結果画面のエネミーコメント・エネミー図鑑）から参照する。総復習専用の固定エネミー（FORMULA_KAMEN/FORMULA_KAMEN_ACE）もここにあるが、ランダム抽選プールには含めない（運用開始後に追加）。各エネミーが持つ一意なid・図鑑対象一覧を返す`getAllEnemiesForDex()`・未解放時の出現条件ヒントを組み立てる`getEnemyUnlockHint()`も、エネミー図鑑機能の実装にあわせて追加した（運用開始後に追加）
│  ├─ training-mode.js           … トレーニングモードの状態管理・カテゴリ指定の問題生成・進行・リタイア・結果画面遷移（新規）。エネミーが登場しないため、エネミー図鑑への記録は一切行わない
│  ├─ review-mode.js             … 総復習モードの状態管理・スコープ（学年/小学校）内の全カテゴリから1問ずつの問題生成・進行・ハート/敵HP管理・経過時間計測・リタイア・結果画面遷移（運用開始後に追加。game.js/training-mode.jsのどちらとも深く参照し合わない独立モジュール）。クリアが確定した瞬間だけ、登場した固定エネミーをエネミー図鑑へ記録する（recordDefeatedEnemy()、運用開始後に追加）
│  ├─ ui.js                      … 画面表示・DOM操作・カードのタップ/ドラッグ操作・モード選択/カテゴリ選択UI・デバッグパネル表示。ヘルプボタン・ヘルプメニュー・「このゲームについて」・エネミー図鑑の画面遷移と描画、フォーカス管理、Escキーでの1つ前の画面への遷移も担当する（運用開始後に追加。ゲーム進行を持たないため`js/app.js`のMODESディスパッチテーブルには追加していない）
│  ├─ question-generator.js       … テンプレートから問題・選択肢カードを生成し、生成直後に検証する。4-2/4-3の出題プラン生成（新内容/復習内容の比率・カテゴリ配分）もここが担当
│  ├─ multi-step-engine.js        … 複数段階問題（1〜3段階）の進行管理・途中式判定・中間結果カード・履歴整形（第11段階で2段階固定から汎用化）
│  ├─ question-validator.js       … 問題テンプレート／生成済み問題を検証する（1〜3段階・小数・分数・百分率・比・contentGroup対応）
│  ├─ answer-checker.js          … 式の正誤判定（eval() 不使用、複数解法=solutionRoutes対応。実際の計算・比較は value-utils.js に委譲）
│  ├─ number-utils.js            … 浮動小数点誤差の出ない小数計算・数値の表示整形（桁区切り）・比較
│  ├─ fraction-utils.js          … 分数専用の計算処理（約分・四則演算・同値判定）。分子・分母のみで計算し、小数へ変換しない（新規）
│  ├─ percentage-utils.js        … 百分率（パーセント）専用の計算処理（比率⇔百分率の変換・表示・同値判定）。`{type:"percent", value}` の値オブジェクトのみを扱う（第9段階で新規）
│  ├─ ratio-utils.js             … 比（`{type:"ratio", antecedent, consequent}`）専用のユーティリティ（生成・表示用整形・前項/後項の取り出し）。式の計算には一切使わない、表示・メタデータ専用（第11段階で新規）
│  ├─ scale-utils.js             … 縮尺（`{type:"scale", numerator:1, denominator}`）専用のユーティリティ（生成・表示用整形「1：25,000」・実際の長さ⇔地図上の長さの変換）。式の計算には一切使わない、表示・メタデータ専用（第12段階で新規）
│  ├─ unit-utils.js              … 長さの単位変換（mm・cm・m・km）専用のユーティリティ。内部ではmmへの倍率（10の累乗）で管理し、浮動小数点誤差を出さない（第12段階で新規）
│  ├─ value-utils.js             … 整数・小数・分数・百分率・比・縮尺を型を意識せず扱う共通レイヤー（`calculateValues` `areValuesEqual` など）。ゲーム本体に型ごとの分岐を書かないための橋渡し役（新規、第9段階で百分率対応・第11段階で比の表示対応と`divideValuesAsFraction`・第12段階で縮尺の表示対応と`areValuesEqual`の比/縮尺対応を追加）
│  ├─ value-renderer.js          … 分数の縦型表示（教科書と同じ、横線の上に分子・下に分母）・比の表示（`5：3`）・縮尺の表示（`1：25,000`）・比例反比例の関係表（`renderRelationTableHtml`）のHTML生成、textParts形式の問題文の描画（新規、第11段階で比の表示・第12段階で縮尺の表示と関係表の描画を追加）
│  ├─ score.js                   … スコア・ランク計算
│  ├─ audio.js                   … Web Audio API による効果音生成
│  └─ storage.js                 … ハイスコア・効果音設定・選択中の出題範囲の保存/読み込み・6年3学期の出題グループローテーション位置（第12段階で追加）。倒したことがあるエネミーのID一覧（エネミー図鑑の解放状態）の保存/読み込みも担当する（運用開始後に追加）
├─ data/
│  ├─ index.js                  … 問題データ読み込みの一元窓口。ゲーム本体はここ経由でのみ取得する
│  ├─ category-registry.js      … トレーニング・総復習で選べる50カテゴリの単一の情報源（id/表示名/学期/表示可否/表示順。第12段階で5カテゴリ追加、うち「縮尺を求める」は運用開始後に削除し現在は4カテゴリ）。`getCategoriesForGrade()`（学年単位の一覧、運用開始後に追加）は総復習モード専用
│  ├─ grade4-term1.js           … 小学4年生・1学期の問題テンプレート（24種類、1段階問題）
│  ├─ grade4-term2.js           … 小学4年生・2学期の問題テンプレート（24種類、小数のたし算/ひき算・大きな数・2けたでわるわり算）
│  ├─ grade4-term3.js           … 小学4年生・3学期の問題テンプレート（24種類、小数×整数・小数÷整数・同分母分数のたし算/ひき算）
│  ├─ grade5-term1.js           … 小学5年生・1学期の問題テンプレート（32種類、小数×小数・小数÷小数・小数倍・もとの量）
│  ├─ grade5-term2.js           … 小学5年生・2学期の問題テンプレート（30種類、異分母分数のたし算/ひき算・平均・単位量あたり・混み具合。第8段階で新規）
│  ├─ grade5-term3.js           … 小学5年生・3学期の問題テンプレート（40種類、速さ・道のり・時間・割合（比べる量/百分率/もとにする量）・割引・増量。第9段階で新規）
│  ├─ grade6-term1.js           … 小学6年生・1学期の問題テンプレート（40種類、分数×整数/分数×分数/分数÷整数/整数÷分数/分数÷分数/分数倍・比べる量/分数倍・もとの量/単位量あたり（分数）。第10段階で新規（単位量あたり（分数）を含む））
│  ├─ grade6-term2.js           … 小学6年生・2学期の問題テンプレート（40種類、分数の速さ/分数の道のり/分数の時間/分数割合・比べる量/分数割合・割合/分数割合・もとにする量/比を使った数量/比例配分。第11段階で新規）
│  ├─ grade6-term3.js           … 小学6年生・3学期の問題テンプレート（24種類、比例・対応する量/反比例・対応する量/縮尺・実際の長さ/縮尺・地図上の長さ。第12段階で新規。「縮尺を求める」カテゴリ・6種類は運用開始後に削除）
│  └─ multi-step-integer.js     … 整数のみの2段階問題テンプレート（12種類。開発版モード「4-multi-step」、4-2モードの「2段階文章題」カテゴリ、4-3/5-1/5-2/5-3モードの復習内容から共有。6-1/6-2モードは運用開始後に4年生の内容を復習対象から外したため対象外）
└─ tools/
   └─ question-validator.html   … 開発者用の問題データ検証ページ（1〜3段階・整数/小数/分数/比/縮尺、出題範囲/カテゴリ/段階数等でフィルタ可能、関係表の表示にも対応）
```

## 2. 問題データの共通スキーマ

小数・分数・割合などを安全に追加できるように、すべての問題テンプレートは次の共通スキーマに従います。
（`js/question-validator.js` の `validateTemplate` がこのスキーマを検証します。）

| 項目 | 型 | 説明 |
|---|---|---|
| `id` | string | 他と重複しない一意なID |
| `gradeTerm` | string | 学年・学期（例: `"4-1"` `"4-2"`）。出題範囲の切り替えに使うキーでもある |
| `category` | string | 単元名の**表示名**（例: `"整数のたし算"`）。画面表示専用で、抽出・照合には使わない |
| `categoryId` | string | 単元の**安定した内部ID**（例: `"integer-addition"`）。`data/category-registry.js` の `id` と一致させる。トレーニングモードはこのIDでテンプレートを絞り込む（新規、第6段階） |
| `difficulty` | number | このテンプレート内での相対難易度の目安（1〜）。**現時点ではゲームのロジックには未使用**で、将来のフィルタ機能のために用意している項目 |
| `questionType` | `"singleStep"` \| `"multiStep"` | `singleStep` は1つの式で解く問題。`multiStep` は2つの式で解く問題（[4章](#4-2段階問題questiontype-multistepについて)で詳説） |
| `template` | string（`textParts` と排他） | `{変数名}` を埋め込んだ問題文。整数・小数のみの問題で使用 |
| `textParts` | array（`template` と排他） | 分数のように横並びの文字列だけでは正しく表示できない問題文に使用。文字列パーツと値パーツが交互に並ぶ配列（[5章](#5-値の共通データ形式と分数の扱いvalue-utilsjs--fraction-utilsjs--value-rendererjs)で詳説） |
| `variables` | object | `template`（または`textParts`）/ `solutionRoutes` から参照する変数の生成ルール `{ min, max, step }`。小数の場合は `{ min, max, decimalPlaces }`、分数の場合は `{ type:"fraction", denominator, numeratorMin, numeratorMax }`、百分率の場合は `{ type:"percent", values:[10,20,25,...] }`（「きりのよい」割合の一覧から1つを選ぶ。第9段階で追加。後述） |
| `generatorType` | string | 数値の生成方法（後述） |
| `solutionRoutes` | array | 正解として認める式のパターンの配列（`singleStep`と`multiStep`で形が異なる。後述） |
| `answerUnit` | string | 答えの単位 |
| `contentGroup` | `"new"` \| `"review"`（省略可） | その出題範囲内での「新しく習う内容」か「前の学期までの復習内容」かの区分。4-2の出題プラン（新内容/復習内容をおよそ半々で出題）が使う。**省略した場合は自動判定**され、`gradeTerm` が `"4-1"` なら `"review"`、それ以外は `"new"` として扱われる（`js/question-generator.js` の `getContentGroup()`）。このため既存の `grade4-term1.js` は変更不要 |
| `quantityRelation` | object（省略可、第7段階で追加、第8段階で汎用化、第9段階で速さ・割合を追加、第10段階で分数倍・単位量あたり・分数版を追加） | 「2つの既知の値から、積にあたる3つ目の値を求める」という数量関係を持つテンプレート専用のメタデータ。`type` によってフィールド名が変わる（小数倍・もとの量: `{type:"multiplicative-comparison", baseKey, comparedKey, multiplierKey, unknown}`、平均: `{type:"average", totalKey, countKey, averageKey, unknown}`、単位量あたり・混み具合: `{type:"unit-rate", totalKey, unitCountKey, perUnitKey, unknown}`、速さ: `{type:"speed", distanceKey, timeKey, speedKey, unknown, distanceUnit, timeUnit, speedUnit}`、割合: `{type:"percentage", baseKey, comparedKey, rateKey, unknown}`、分数倍: `{type:"fraction-multiplicative-comparison", baseKey, comparedKey, multiplierKey, unknown}`、単位量あたり・分数版: `{type:"fraction-unit-rate", totalKey, unitCountKey, perUnitKey, unknown}`）。詳しくは[19章](#19-小学5年生1学期第7段階)・[20章](#20-小学5年生2学期第8段階)・[21章](#21-小学5年生3学期第9段階)・[22章](#22-小学6年生1学期第10段階) |

### 小数を扱う変数（`decimalPlaces`）

`variables` の各変数は、`step` の代わりに `decimalPlaces` を指定すると小数として生成されます。

```js
variables: {
  a: { min: 1.1, max: 9.9, decimalPlaces: 1 },  // 小数第1位までの値をランダム生成
  b: { min: 0.1, max: 5.9, decimalPlaces: 1 }
}
```

小数の生成・加減乗算・比較・表示は、すべて `js/number-utils.js` の関数（`addDecimal` `subtractDecimal`
`multiplyDecimal` `areNumbersEqual` `formatNumber` など）を経由し、`0.1 + 0.2` のような
浮動小数点誤差が出ないようにしています（整数にスケールしてから計算し、戻す方式）。
**小数を扱うテンプレート・ロジックを追加する場合は、`+` `-` `*` の直接計算や `===` による比較を使わず、
必ず `number-utils.js` の関数を使ってください。**

### `generatorType`

| 値 | 用途 | 内容 |
|---|---|---|
| `"standard"` | 除算を含まない問題全般（整数・小数・分数どちらも） | `variables` に定義した各変数を、独立に生成する（`step` 指定なら整数、`decimalPlaces` 指定なら小数、`type:"fraction"` 指定なら分数） |
| `"decimalAddition"` / `"decimalSubtraction"` / `"decimalTimesInteger"` | 小数のたし算・ひき算・かけ算(×整数) | `"standard"` の別名（生成ロジックは同じ）。テンプレートを見ただけで用途が分かるように、意味づけのために別名を用意している |
| `"sameDenominatorFractionAddition"` / `"sameDenominatorFractionSubtraction"` | 同分母分数のたし算・ひき算 | `"standard"` の別名。`variables.a` / `variables.b` を両方とも同じ `denominator` を持つ分数型として定義することで、常に同分母の問題になる |
| `"exactDivision"` | 1段階のわり算（1けたでわる、整数） | `variables.divisor`（わる数・1〜9）と `variables.quotient`（商）を別々に決めてから `dividend`(=divisor×quotient) を自動計算する。わり算が必ずあまりなく割り切れることを保証する |
| `"exactDivisionTwoDigit"` | 1段階のわり算（2けたでわる、整数） | `exactDivision` と同じアルゴリズムで、`variables.divisor` の範囲が10〜99になる点だけが異なる |
| `"exactDecimalDivisionByInteger"` | 小数÷整数 | `exactDivision` と同様に、先に `variables.quotient`（小数第1〜2位）と `variables.divisor`（整数・2〜9）を決めてから `dividend`(=quotient×divisor) を自動計算する。必ず有限小数で割り切れることを保証する |
| `"decimalTimesDecimal"`（第7段階） | 小数×小数 | `"standard"` の別名。`variables` の両方の変数に `decimalPlaces` を指定するだけで作れる。積の小数点以下の桁数が2桁を超えないよう、両変数の `decimalPlaces` の合計が2以下になるように範囲を設計する |
| `"exactDecimalDivisionByDecimal"`（第7段階） | 小数÷小数 | `exactDecimalDivisionByInteger` と同じ考え方で、`variables.divisor`・`variables.quotient` をどちらも小数として先に決めてから `dividend`(=divisor×quotient) を自動計算する。必ず有限小数で割り切れることを保証する |
| `"decimalMultiplicativeComparison"` / `"decimalOriginalQuantity"`（第7段階） | 小数倍・もとの量 | `template.quantityRelation` の `baseKey`・`multiplierKey` が指す変数を独立に生成し、`comparedKey`(=base×multiplier) を自動計算する。どちらが「未知（答え）」かは `solutionRoutes` 側が決めるため、小数倍（比較量を求める／何倍かを求める）・もとの量（基準量を求める）のすべてで同じ生成関数を共有する（詳しくは[19章](#19-小学5年生1学期第7段階)） |
| `"unlikeDenominatorFractionAddition"` / `"unlikeDenominatorFractionSubtraction"`（第8段階） | 異分母分数のたし算・ひき算 | `"standard"` の別名。`variables.a` / `variables.b` を**異なる**固定の `denominator` を持つ分数型として定義するだけで作れる（`fraction-utils.js` の `addFractions`/`subtractFractions` が最初から異分母対応のため、通分専用の生成関数は不要）。ひき算は範囲設計で答えが負にならないようにする（詳しくは[20章](#20-小学5年生2学期第8段階)） |
| `"averageFromTotal"` / `"totalFromAverage"`（第8段階） | 平均 | `template.quantityRelation` の `countKey`・`averageKey` が指す変数を独立に生成し、`totalKey`(=count×average) を自動計算する。平均を求める（合計÷個数）・合計を求める（平均×個数）のどちらも同じ生成関数を共有する |
| `"averageOfTwoValues"`（第8段階） | 2つの数の平均（2段階問題） | `multiStepSumToDivisible` と全く同じ生成ロジック。`variables.divisor` を常に2に固定したテンプレートにするだけで「たし算→わり算」の2段階問題として実現できる |
| `"unitRate"` / `"totalFromUnitRate"`（第8段階） | 単位量あたり・混み具合 | `template.quantityRelation` の `unitCountKey`・`perUnitKey` が指す変数を独立に生成し、`totalKey`(=unitCount×perUnit) を自動計算する。混み具合は単位量あたりと数量関係が同じ構造のため、同じ generatorType を共有し、categoryId・問題文のテーマだけで区別する |
| `"findSpeed"` / `"findDistance"` / `"findTime"`（第9段階） | 速さ・道のり・時間 | `template.quantityRelation` の `speedKey`・`timeKey` が指す変数を独立に生成し、`distanceKey`(=speed×time) を自動計算する（内部的には第8段階の `generateProportionalValues()` をそのまま再利用）。速さ・道のり・時間のどれが「未知（答え）」かは `solutionRoutes` 側が決めるため、3つの generatorType すべてで同じ生成関数を共有する |
| `"percentageFindCompared"` / `"percentageFindRate"` / `"percentageFindBase"`（第9段階） | 割合（比べる量・百分率・もとにする量） | `template.quantityRelation` の `baseKey`・`rateKey` が指す変数を独立に生成し、`comparedKey`(=base×ratio(rate)) を自動計算する。`rate` は `{type:"percent", value}` のため、乗算前に `percentToRatio()` で比率に変換する点だけが `unitRate` 系と異なる |
| `"discountTwoStep"` / `"increaseTwoStep"`（第9段階） | 割引・増量（2段階問題、複数解法） | `"standard"` の別名。`originalPrice`（または `originalAmount`）・`discountRate`（または `increaseRate`）を独立に生成するだけでよく、専用の生成関数は不要。支払う割合・値引き額・増えた量・最終的な答えは、登録した2つの解法ルートがそれぞれ独立に計算し、整数スケール小数演算のため必ず一致する（詳しくは[21章](#21-小学5年生3学期第9段階)） |
| `"fractionTimesInteger"` / `"fractionTimesFraction"` / `"fractionDividedByInteger"` / `"integerDividedByFraction"` / `"fractionDividedByFraction"`（第10段階） | 分数×整数・分数×分数・分数÷整数・整数÷分数・分数÷分数 | いずれも `"standard"` の別名。分数のかけ算・わり算は `value-utils.js` の `calculateValues()` が必ず正確な分子・分母の計算として行うため（あまりが出ることも循環小数になることもない）、小数のわり算のように「割り切れることを事前に保証する」専用の生成関数は不要で、各変数を独立に生成するだけで作れる |
| `"fractionMultiplierFindCompared"` / `"fractionMultiplierFindBase"`（第10段階） | 分数倍（比べる量・もとの量） | `template.quantityRelation` の `baseKey`・`multiplierKey` が指す変数（もとにする量は整数、分数倍は分数）を独立に生成し、`comparedKey`(=base×multiplier) を `calculateValues()` で計算する。整数×分数の交換法則も自動的に成り立つため、小数倍と同じ「どちらが未知かは `solutionRoutes` 側が決める」設計をそのまま踏襲できる |
| `"fractionUnitRate"`（第10段階） | 単位量あたり（分数） | `template.quantityRelation` の `unitCountKey`・`perUnitKey` が指す変数（どちらも分数）を独立に生成し、`totalKey`(=unitCount×perUnit) を `calculateValues()` で計算する。分数倍と全く同じ「2つの既知の値から積にあたる3つ目の値を求める」構造のため、汎用化した `generateFractionProportionalValues()` を共有する |
| `"multiStepDivideFirst"` | 2段階「わり算 → 何か」 | `exactDivision` と同様に `divisor`・`quotient` から `dividend` を計算し、それ以外の変数は独立に生成する |
| `"multiStepSumToDivisible"` | 2段階「たし算 → わり算」 | `divisor`・`quotient`・`a` を定義すると、`sum`(=divisor×quotient) と `b`(=sum-a) が自動計算される。1つ目の式の答え（a+b）が必ず割り切れることを保証する |

`exactDivision` / `exactDivisionTwoDigit` / `exactDecimalDivisionByInteger` / `multiStepDivideFirst` /
`multiStepSumToDivisible` が計算する値（`dividend` `sum` `b` など）は `variables` に定義しなくても、
`template` の `{...}` や `solutionRoutes` から参照できる「計算済み変数」です。

## 3. 1段階問題のテンプレート追加方法

新しい1段階問題テンプレートは、**ゲーム本体のJavaScriptを修正せずに**
`data/grade4-term1.js` の配列 `grade4Term1Templates` に要素を追加するだけで反映されます。

### 通常のテンプレート（たし算・ひき算・かけ算）

```js
{
  id: "g4t1_add_007",           // 他と重複しない一意のID
  gradeTerm: "4-1",
  category: "整数のたし算",       // "整数のたし算" / "整数のひき算" / "整数のかけ算" / "整数のわり算"
  difficulty: 1,                 // 相対難易度の目安（現時点では未使用、任意の正の整数でよい）
  questionType: "singleStep",
  template: "{a}円の本と{b}円のノートを買いました。代金は全部で何円ですか。",
  variables: {
    a: { min: 100, max: 900, step: 10 },
    b: { min: 100, max: 900, step: 10 }
  },
  generatorType: "standard",
  solutionRoutes: [
    { left: "a", operator: "+", right: "b", commutative: true } // たし算・かけ算は true、ひき算は false
  ],
  answerUnit: "円"
}
```

ひき算のテンプレートを追加する場合は、`variables.a` の範囲が
`variables.b` の範囲より必ず大きくなるようにしてください
（例: a は 500〜999、b は 100〜400）。これにより、答えが必ず正の整数になります。

### わり算のテンプレート

```js
{
  id: "g4t1_div_007",
  gradeTerm: "4-1",
  category: "整数のわり算",
  difficulty: 1,
  questionType: "singleStep",
  template: "{dividend}枚のカードを、{divisor}人に同じ数ずつ配ります。1人分は何枚ですか。",
  variables: {
    divisor: { min: 2, max: 9, step: 1 },     // わる数（1けた固定。min は必ず1以上にする）
    quotient: { min: 5, max: 40, step: 1 }    // 商（答え）の範囲
  },
  generatorType: "exactDivision",
  solutionRoutes: [
    { left: "dividend", operator: "÷", right: "divisor", commutative: false }
  ],
  answerUnit: "枚"
}
```

### 小数のテンプレート（4-2）

```js
{
  id: "g4t2_decimal_add_001",
  gradeTerm: "4-2",
  category: "小数のたし算",
  contentGroup: "new",
  difficulty: 1,
  questionType: "singleStep",
  template: "{a}Lのジュースと{b}Lのジュースを合わせました。全部で何Lですか。",
  variables: {
    a: { min: 1.1, max: 9.9, decimalPlaces: 1 },
    b: { min: 0.1, max: 5.9, decimalPlaces: 1 }
  },
  generatorType: "decimalAddition",
  solutionRoutes: [
    { left: "a", operator: "+", right: "b", commutative: true }
  ],
  answerUnit: "L"
}
```

小数のひき算も同様の形で、`variables.a` の範囲が `variables.b` の範囲より必ず大きくなるようにします。

### 2けたでわるわり算のテンプレート（4-2）

```js
{
  id: "g4t2_div2_001",
  gradeTerm: "4-2",
  category: "2けたでわるわり算",
  contentGroup: "new",
  difficulty: 2,
  questionType: "singleStep",
  template: "{dividend}枚の紙を{divisor}人に同じ数ずつ配ります。1人分は何枚ですか。",
  variables: {
    divisor: { min: 10, max: 99, step: 1 },
    quotient: { min: 10, max: 60, step: 1 }
  },
  generatorType: "exactDivisionTwoDigit",
  solutionRoutes: [
    { left: "dividend", operator: "÷", right: "divisor", commutative: false }
  ],
  answerUnit: "枚"
}
```

### 小数×整数のテンプレート（4-3）

```js
{
  id: "g4t3_dec_mul_001",
  gradeTerm: "4-3",
  category: "小数×整数",
  contentGroup: "new",
  difficulty: 2,
  questionType: "singleStep",
  template: "1本{a}mのリボンが{b}本あります。全部の長さは何mですか。",
  variables: {
    a: { min: 1.1, max: 8.9, decimalPlaces: 1 },
    b: { min: 2, max: 9, step: 1 }
  },
  generatorType: "decimalTimesInteger",
  solutionRoutes: [
    { left: "a", operator: "×", right: "b", commutative: true }
  ],
  answerUnit: "m"
}
```

### 小数÷整数のテンプレート（4-3）

```js
{
  id: "g4t3_dec_div_001",
  gradeTerm: "4-3",
  category: "小数÷整数",
  contentGroup: "new",
  difficulty: 2,
  questionType: "singleStep",
  template: "{dividend}Lのジュースを{divisor}つの容器に同じ量ずつ分けます。1つの容器には何L入りますか。",
  variables: {
    divisor: { min: 2, max: 9, step: 1 },
    quotient: { min: 1.1, max: 8.9, decimalPlaces: 1 }
  },
  generatorType: "exactDecimalDivisionByInteger",
  solutionRoutes: [
    { left: "dividend", operator: "÷", right: "divisor", commutative: false }
  ],
  answerUnit: "L"
}
```

### 同分母分数のたし算・ひき算のテンプレート（4-3）

分数は `template`（文字列）ではなく `textParts` を使います。分数を含む値パーツは
`{ type: "value", ref: "変数名" }` の形式で、`variables` のキー名を参照します
（実際の値への解決は生成時に自動で行われます）。詳しくは
[5章](#5-値の共通データ形式と分数の扱いvalue-utilsjs--fraction-utilsjs--value-rendererjs)を参照してください。

```js
{
  id: "g4t3_frac_sub_001",
  gradeTerm: "4-3",
  category: "同分母分数のひき算",
  contentGroup: "new",
  difficulty: 2,
  questionType: "singleStep",
  textParts: [
    { type: "text", value: "水が" },
    { type: "value", ref: "a" },
    { type: "text", value: "Lあり、そのうち" },
    { type: "value", ref: "b" },
    { type: "text", value: "L使いました。残りは何Lですか。" }
  ],
  variables: {
    a: { type: "fraction", denominator: 8, numeratorMin: 5, numeratorMax: 7 },
    b: { type: "fraction", denominator: 8, numeratorMin: 1, numeratorMax: 4 }
  },
  generatorType: "sameDenominatorFractionSubtraction",
  solutionRoutes: [
    { left: "a", operator: "-", right: "b", commutative: false }
  ],
  answerUnit: "L"
}
```

`a` と `b` は必ず同じ `denominator`（分母）を指定してください（同分母分数の問題のため）。
ひき算の場合は、`a.numeratorMin` が `b.numeratorMax` 以上になるように設計し、答えが常に0以上になるようにします
（たし算にはこの制約はありません）。分母は小学4年生として不自然に大きくならないよう、2〜12の範囲にしてください。

テンプレートを追加・変更したら、**必ず [問題検証ページ](#8-問題検証ページの使い方toolsquestion-validatorhtml) で確認してください。**

## 4. 2段階問題（questionType: "multiStep"）について

複数段階問題は、前の式の答え（中間結果）を使って次の式を解く問題です。第10段階までは
**すべて「ちょうど2つの式」に限定**していましたが、第11段階で**1〜3個の式**に汎用化しました
（4つ以上の式や、かっこを使った式は今回も対象外）。テンプレートの `totalSteps`（1〜3）が
実際の式の数を表し、`solutionRoutes[].steps` の要素数と一致している必要があります。
値は整数（開発版モード・4-2の「2段階文章題」）・百分率（第9段階、割引・増量）に加えて、
第11段階から**分数**（分数の速さ・比を使った数量・比例配分）にも対応しました。小数を使った
複数段階問題は今回も対象外です。

複数段階問題専用の進行管理（今どの式を解いているか、正解ルートの絞り込み、中間結果カードの生成、
履歴の整形など）は、すべて `js/multi-step-engine.js` が担当します。`game.js` や `ui.js` には
複数段階問題固有の判定ロジックを持たせていません。第11段階での3段階への拡張も、この関数の
中身（各ステップの処理・候補ルートの絞り込み）はもともと段階数に依存しない実装だったため、
`js/question-validator.js` の「ちょうど2」という構造検証と、`js/ui.js` の進行表示文言
（「式1／2」）の2箇所だけを段階数に依存しない形へ書き換えるだけで対応できました。

### データ形式

```js
{
  id: "multi_mul_sub_001",
  gradeTerm: "4-multi-step",
  category: "2段階・かけ算とひき算",
  difficulty: 2,
  questionType: "multiStep",
  template: "1箱に{perBox}個のお菓子が入っています。{boxCount}箱あり、そのうち{used}個食べました。残りは何個ですか。",
  variables: {
    perBox: { min: 12, max: 40, step: 1 },
    boxCount: { min: 2, max: 8, step: 1 },
    used: { min: 5, max: 20, step: 1 }        // perBox×boxCount の最小値(24)より必ず小さくなる範囲にする
  },
  generatorType: "standard",
  solutionRoutes: [
    {
      id: "routeA",                            // ルートの一意なID（テンプレート内で重複不可）
      steps: [                                  // ちょうど2要素
        {
          left: { source: "variable", key: "perBox" },
          operator: "×",
          right: { source: "variable", key: "boxCount" },
          resultKey: "total"                    // 次のステップから参照できる名前（ルート内で重複不可）
        },
        {
          left: { source: "result", key: "total" },   // 1つ目のステップの結果を参照
          operator: "-",
          right: { source: "variable", key: "used" },
          resultKey: "answer"
        }
      ]
    }
  ],
  answerUnit: "個"
}
```

- `solutionRoutes[].steps[].left` / `right` は `{ source: "variable", key: "..." }`
  （`variables` または `generatorType` が計算する値を参照）、
  `{ source: "result", key: "..." }`（**同じルート内の、より前のステップの `resultKey`** を参照）、
  `{ source: "literal", value: ... }`（第9段階で追加。どの変数にも対応しない固定値をそのまま使う。例:
  割引問題の「100%」は `{ source: "literal", value: { type: "percent", value: 100 } }`）のいずれかです。
  後のステップから前のステップの `resultKey` しか参照できないため、循環参照は構造上起こりません。
- `operator` は `"+"` `"-"` `"×"` `"÷"` のいずれか。交換法則（たし算・かけ算は順序を問わない）は
  演算子から自動判定されます（`commutative` を明示的に書くこともできます）。
- `resultType`（省略可、第9段階で追加）: ステップの計算結果を別の型に変換したい場合に指定します。
  - `"percent"`（第9段階）: 通常の数値÷数値の結果（比率、例: 0.3）を百分率の値オブジェクト
    （例: `{type:"percent", value:30}`）に変換します（`ratioToPercent()`）。「割合・百分率」
    （比べる量÷もとにする量＝割合）のように、計算自体は普通の数値の割り算だが
    **表示だけ百分率にしたい**場合に使います。
  - `"fraction"`（第11段階で追加）: `operator:"÷"` のとき、通常の（小数として計算を試みる）
    除算ではなく、必ず `divideValuesAsFraction()` による**分数のままの正確なわり算**を使います。
    例えば `12÷20` は通常の除算なら `0.6` として問題なく求まりますが、分数の速さ
    （`8÷(25/60)` のような分/時間の単位換算）では、割り切れる場合でも `0.6` ではなく `3/5` と
    **分数のまま表示したい**ため、このフラグで強制しています。
  - `"number"` / `"numberOrFraction"`（第11段階で追加）: 型の変換は行わない、ドキュメント用の
    明示的な指定です（省略した場合と動作は同じ）。分数の速さのように、ルートによって最終結果が
    整数になる場合と分数になる場合がある（例: 見かけ上は整数だが理論上は分数になりうる）ことを
    テンプレートを読む人に伝えるために付けています。
- 生成されると、`js/question-generator.js` が `solutionRoutes` の `left`/`right`/`operator` を実際の数値に解決し、
  `js/multi-step-engine.js` が進行状態（`problem.multiStep`）と1つ目の式用のカード（`problem.choices`）を作ります。

### 複数解法（solutionRoutes に複数ルートを登録する）

1つの問題に複数の正しい解き方がある場合、`solutionRoutes` に複数のルートを登録できます。
すべてのルートは、**同じ変数（`variables`）から出発して、必ず同じ最終結果になる**必要があります
（この一致は `question-validator.js` が検証します）。

```js
solutionRoutes: [
  {
    id: "routeA",
    steps: [
      { left: {source:"variable", key:"a"}, operator:"-", right: {source:"variable", key:"b"}, resultKey:"remaining" },
      { left: {source:"result", key:"remaining"}, operator:"+", right: {source:"variable", key:"c"}, resultKey:"answer" }
    ]
  },
  {
    id: "routeB",
    steps: [
      { left: {source:"variable", key:"a"}, operator:"+", right: {source:"variable", key:"c"}, resultKey:"beforeDistribution" },
      { left: {source:"result", key:"beforeDistribution"}, operator:"-", right: {source:"variable", key:"b"}, resultKey:"answer" }
    ]
  }
]
```

1つ目の式を正解した時点で、その式に**一致しないルートだけ**を候補から除外します
（同じ1つ目の式を複数のルートが共有している場合は、全部そのまま候補に残ります）。
2つ目の式のカードは、その時点で候補に残っているルートが必要とする数値・演算記号をすべて含みます。

### 中間結果の参照方法

1つ目の式に正解すると、その `resultKey` の値が「中間結果」として記録され（`problem.multiStep.intermediateResults`）、
以降のステップの `{ source: "result", key: "..." }` から参照できます。同時に、その値を持つカードが
選択肢に追加されます（`card.source === "intermediate"`。ui.js が通常のカードと見た目を変えています）。

### 2段階問題テンプレートの追加方法

`data/multi-step-integer.js` の配列 `multiStepIntegerTemplates` に要素を追加します
（ゲーム本体のJavaScript修正は不要です）。範囲設計の注意点:

- ひき算を含む場合は、引かれる数の最小値が引く数の最大値を必ず上回るようにする
- わり算を含む場合は、`multiStepDivideFirst`（わり算が先）または `multiStepSumToDivisible`
  （たし算の後にわり算）のような専用の `generatorType` を使い、独立乱数だけで
  「たまたま割り切れる」ことに頼らないようにする
- 最終結果・途中結果が大きくなりすぎないよう、変数の範囲を調整する

### 2段階問題の検証方法

[問題検証ページ](#8-問題検証ページの使い方toolsquestion-validatorhtml)は、`multiStep` テンプレートについて
数値を変えて**20回生成**し、さらに`js/multi-step-engine.js` の `simulateAllRoutesToCompletion()` を使って
**すべての解法ルートを実際に最後まで解けるか**（各ステップのカードが8枚以内か、中間結果カードが
1つ目の式の前から表示されていないか、最終的な答えがダミーカードに紛れていないか、なども含む）
をシミュレーションします。

## 5. 値の共通データ形式と分数の扱い（value-utils.js / fraction-utils.js / value-renderer.js）

このアプリでは、問題の値（変数の値・カードの値・正解の値など）は、次の3つの形のいずれかです
（百分率は第9段階で追加）。

### 整数・小数

素のJavaScript数値のまま扱います（例: `3`、`2.4`）。既存の設計（Stage1〜4）をそのまま維持しています。

### 分数

分数は**分子と分母を分けたオブジェクト**で扱います。`"3/5"` のような文字列や、`0.6` のような
小数へ変換した値を、計算用の内部値として使うことはありません。

```js
{
  type: "fraction",
  numerator: 3,
  denominator: 5
}
```

- 分子・分母は必ず整数にしてください。分母が0の分数は生成しません。
- 計算結果は自動的に約分されます（例: `2/4` → `1/2`）。
- 約分した結果、分母が1になる場合（＝整数になる場合）は、分数オブジェクトのままにせず、
  素の整数値に変換します（例: `6/3` → `2`、`4/8+4/8` → `1`）。これは `js/value-utils.js` の
  `normalizeValue()` が行います。
- 仮分数になった場合、今回のバージョンでは帯分数に変換せず、仮分数のまま扱います。

### 百分率（第9段階で追加）

百分率（パーセント）も、分数と同じく**専用のオブジェクト**で扱います。`"20%"` のような文字列や、
`0.2` のような比率に変換した値を、計算用の内部値として使うことはありません。

```js
{
  type: "percent",
  value: 20   // 「20%」を表す。比率（0.2）ではなく、パーセント表記の数値をそのまま持つ
}
```

- 百分率専用の計算処理は `js/percentage-utils.js` に切り出しています（分数における
  `fraction-utils.js` と同じ位置づけ）。`isValidPercent(value)` `normalizePercent(value)`
  `percentToRatio(value)`（百分率→比率、20% → 0.2）`ratioToPercent(ratio)`（比率→百分率、0.3 → 30%）
  `formatPercent(value)`（表示用テキスト、`"20%"`）`arePercentValuesEqual(a,b)` を提供します。
- `js/value-utils.js` の `calculateValues()` は、百分率どうし・数値×百分率・数値÷百分率の
  組み合わせだけをサポートします。サポート対象の組み合わせと結果の型は次のとおりです。

  | 左辺 | 演算子 | 右辺 | 結果の型 | 例 |
  |---|---|---|---|---|
  | percent | `+` | percent | percent | `100% + 25% = 125%` |
  | percent | `-` | percent | percent | `100% - 20% = 80%` |
  | number | `×` | percent | number | `3000 × 20% = 600` |
  | percent | `×` | number | number | `20% × 3000 = 600`（交換法則） |
  | number | `÷` | percent | number | `600 ÷ 20% = 3000` |
  | number | `÷` | number | number（`resultType:"percent"` 指定時のみ percent） | `15 ÷ 50 = 0.3`（または `resultType:"percent"` 指定時は `30%`） |

  上記以外の組み合わせ（`percent × percent`、`number + percent`、`number - percent`、
  `percent ÷ percent`、分数と百分率の混在など）は、すべて `null` を返します
  （テンプレート側でこれらの組み合わせを使おうとすると、`question-validator.js` が
  生成結果を「計算不能」としてエラーにするため、不正なテンプレートを混入させても
  プレイヤーに出題される前に検出できます）。
- 選択肢カード・解答欄・正解演出・問題履歴への百分率の表示は、分数と同じく
  `js/value-renderer.js` の `renderValueHtml(value)` が一元的に行いますが、**表示は「%」ではなく
  比率（小数）に変換して行います**（例: `20%` → `"0.2"`）。割合の計算は
  小数で行うという教科書の指導方法に合わせたもので、`percentToRatio(value)` で比率に変換してから
  通常の数値と同じ `formatNumber()` で整形するだけのため、分数のような専用のCSSクラス・
  `aria-label` は不要です（プレーンな数値と同じ見た目・読み上げになります）。
  問題文中の「20%が…」のような自然な言い回しは、この `renderValueHtml()` を経由しない
  別経路（`js/question-generator.js` の `renderTemplateText()` が `formatPercent(value)` を直接使う）
  のため、この変更の影響を受けず、これまでどおり「%」で表示されます。
- ただし「割合・百分率」（比べる量÷もとにする量＝割合。問題文が「何%ですか」と百分率での
  回答を求める）の**正解時・問題履歴の答え表示だけ**は例外です。計算結果の小数（例: `0.5`）に
  加えて、百分率への変換も「0.5→50%」の形式で示します（`js/value-renderer.js` の
  `renderPercentConversionHtml(value)`）。2段階問題（割引・増量）の途中結果（「支払う割合」
  「増量後の割合」など）は、あくまで計算の中間値であり「%で答える」ものではないため、
  この変換は行わず、通常どおり小数のみで表示します。

### 値の共通処理（`js/value-utils.js`）

整数・小数・分数・百分率を、型を意識せず扱うための関数を提供します。ゲーム本体（`game.js` `ui.js`
`answer-checker.js` `question-generator.js`）は、これらの関数を呼ぶだけで、
「整数か小数か分数か百分率か」で分岐する処理を自前で書く必要がありません。

| 関数 | 役割 |
|---|---|
| `calculateValues(left, operator, right)` | 値の型に応じて安全に計算する（数値は `number-utils.js`、分数は `fraction-utils.js`、百分率は `percentage-utils.js` に委譲）。計算できない場合（0で割る、割り切れない、今回未対応の型の組み合わせなど）は `null` を返す |
| `areValuesEqual(a, b)` | 値の型を意識せず、2つの値が等しいかを判定する（分数は分子・分母から正確に、百分率は`value`どうしを比較、数値は誤差許容で） |
| `normalizeValue(value)` | 値を正規化する（数値は丸め誤差の除去、分数は約分・整数への変換、百分率は丸め誤差の除去） |
| `formatValue(value)` | 値をプレーンテキストに変換する（分数は `"3/5"` 形式、百分率は `"20%"` 形式。**画面表示には使わない**。デバッグ用テキスト専用） |
| `isFractionValue(value)` / `isPercentValue(value)` / `isValueNegative(value)` / `valueKey(value)` など | 型判定・符号判定・Set/Mapのキー生成などの補助関数 |

`js/answer-checker.js` の `safeCalculate()` は `calculateValues()` を、`matchesStep()` は
`areValuesEqual()` をそのまま呼び出すだけになっており、正誤判定のコード自体は
整数・小数・分数のどれであっても変わりません。

### 分数専用の計算処理（`js/fraction-utils.js`）

分子・分母だけを使って正確に計算する、分数専用の関数を提供します。

`gcd(a,b)` `normalizeFraction(fraction)`（分母を必ず正にする）`simplifyFraction(fraction)`（約分）
`addFractions(a,b)` `subtractFractions(a,b)` `multiplyFractions(a,b)` `divideFractions(a,b)`
`multiplyFractionByInteger(fraction,integer)`（分数×整数、第10段階で追加）
`divideFractionByInteger(fraction,integer)`（分数÷整数、第10段階で追加）
`divideIntegerByFraction(integer,fraction)`（整数÷分数、第10段階で追加）
`areFractionsEqual(a,b)`（分子・分母から正確に同値判定）`isValidFraction(value)`
`fractionToNumber(value)`（表示・比較の補助にのみ使用。分数どうしの計算には使わない）

`addFractions`/`subtractFractions` は、最初からクロス乗算（`a.numerator×b.denominator±b.numerator×a.denominator`）で
計算しており、**分母が同じかどうかに関わらず正しく計算できる**設計でした。そのため第8段階（小学5年生2学期）の
異分母分数のたし算・ひき算を追加する際も、これらの関数は無改造のまま使用しています
（詳しくは[20章](#20-小学5年生2学期第8段階)）。`lcm(a,b)`（最小公倍数）・`convertToCommonDenominator(a,b)`（通分）は
第8段階で追加しました。実際の正誤判定・答えの計算には使用せず、開発者用検証ページのデバッグ表示
（通分前・通分後）や、将来の解説機能のために用意しています。

`multiplyFractions`/`divideFractions` は、将来の小学6年生対応を見据えてあらかじめ用意されていましたが、
第10段階（小学6年生1学期）で初めて実際の問題データから使用しています。分数のわり算は、
`a/b ÷ c/d = a/b × d/c`（右辺の逆数をかける）という教科書どおりの方法で計算し、右辺の分子が0
（0でわる）の場合は `null` を返します。分数×整数・分数÷整数・整数÷分数は、整数を分母1の分数として
扱うのではなく、専用の関数（`multiplyFractionByInteger` など）を用意し、整数側が本当に整数かどうかを
`Number.isInteger()` で確認してから計算します（今回は分数×小数・分数÷小数を想定していないため）。
分数のかけ算・わり算は、小数のわり算と違って**必ず正確な分子・分母の計算になり**、あまりが出ることも
循環小数になることもないため、生成ロジック側で「割り切れることを事前に保証する」ような専用の
仕組みは不要です（詳しくは[22章](#22-小学6年生1学期第10段階)）。

同値判定（`areFractionsEqual`。例: `1/2` と `2/4` は同じ値として扱う）は、値の比較・結果表示にのみ使用し、
児童が作った式が正解ルートの**構造**と一致するかどうかの判定には使いません（そちらは
`answer-checker.js` の `matchesStep()` が、登録された正解ルートの `left`/`right` とカードの値を
直接比較します）。

### 縦型分数表示（`js/value-renderer.js`）

分数は、次のように**横並び**では表示しません。

```text
3/5
```

教科書のように、横線の上に分子・下に分母を表示する**縦型表示**にします。

```html
<span class="fraction" aria-label="5分の3">
  <span class="fraction-numerator">3</span>
  <span class="fraction-denominator">5</span>
</span>
```

`aria-label` は日本語の読み上げに合わせて「分母分の分子」の形式にしています（分子3、分母5なら「5分の3」）。

この縦型分数のHTMLは `js/value-renderer.js` の `renderValueHtml(value)` が一元的に生成します。
問題文・選択肢カード・解答欄・■欄・正解演出・問題履歴・問題検証ページ・デバッグ表示は、
**すべてこの関数を経由**しており、各画面が個別にHTMLを組み立てることはありません。
整数・小数を渡した場合は、`number-utils.js` の `formatNumber()`（桁区切り・末尾0除去）で
整形した上でHTMLエスケープしたテキストを返します。

約分した結果、分母が1になる場合（＝整数値の場合）は、縦型分数ではなく通常の整数として表示します
（第10段階で追加）。分数の計算「結果」の整数化はもともと `normalizeValue()` が行っていましたが、
分数×分数・分数倍のように**カードに直接載る操作前の値**（まだ計算していない生の分数）が、
たまたま整数に約分できる分子・分母の組み合わせだった場合（例: `2/1`）にも同じ表示にするため、
`renderValueHtml()` 自身にもこの分岐を追加しています。デバッグ用テキスト専用の `formatValue()`
（`js/value-utils.js`）にも同じ挙動を揃えています。

### 約分せずに表示する分数（同分母分数のたし算・ひき算、4-3/5-1限定。第9段階で追加）

`renderValueHtml(value, { simplify })` は既定で分数を約分してから表示しますが、
`simplify: false` を渡すと、テンプレートで生成された分子・分母をそのまま（それ以上約分せず）
表示します。これは、**まだ約分を学習していない学年・学期**で「同分母分数のたし算・ひき算」
（`categoryId: "same-denominator-fraction-addition"` / `"same-denominator-fraction-subtraction"`）
を出題する場合に使用します。約分は小学5年生2学期（異分母分数）で初めて学習するため、
それより前の段階（4年3学期での新出時、5年1学期での復習時）では、通分・約分の概念を
使わずに「同じ分母のまま分子だけをたし引きする」という素朴な計算方法で表示を揃えます。
5年2学期以降（このテンプレートが復習内容として登場する場合を含む）は、約分を学習済みのため
これまでどおり約分して表示します。

判定に使うのは、テンプレート自身の `gradeTerm`（常に `"4-3"`）ではなく、
**今そのバトル/トレーニングセッション全体で選ばれている出題範囲**（`gameState.gradeTerm` /
`trainingState.gradeTerm`）です。これにより、5-1モードの復習内容として同じテンプレートが
出題される場合も約分なしで表示され、5-2モードの復習内容として出題される場合は約分して
表示される、という区別ができます（`js/question-generator.js` の
`shouldDisplayFractionsUnsimplified(template, currentGradeTerm)` が判定します）。

- 問題文中の分数（`a`・`b`。テンプレートで生成された生の分子・分母のまま、約分は一切行われません）
- 選択肢カード・解答欄・ドラッグ中のカード（同上）
- 正解時の■欄・問題履歴の答え（`js/value-utils.js` の `computeUnsimplifiedFractionResult(left, operator, right)` が、
  同分母どうしの分子をたし引きするだけの「約分前の答え」を計算します。内部の正誤判定・保存データ自体は
  引き続き `addFractions`/`subtractFractions` の約分済みの値を使うため、この関数は表示直前にのみ使用します）
- `?debug=true` の「正解式」表示（実際の画面表示と食い違わないよう、デバッグ表示も同じ規則に揃えています）

`answer-checker.js` の正誤判定（`matchesStep`）は、この表示切り替えの影響を一切受けません。
判定は常にテンプレートが生成した生の値どうしを比較するため、約分して表示するかどうかは
純粋に見た目だけの違いです。

CSS（`css/style.css`）側では、`.fraction` `.fraction-numerator` `.fraction-denominator` の
3つのクラスで縦型レイアウトを組んでいます。分数を含むカード・解答欄には `choice-value-fraction`
クラスが付き、通常のカードより高さを確保して上下が切れないようにしています。

### 問題文中の分数データ（`textParts`）

問題文を単純な文字列だけで管理すると、縦型分数表示ができません。分数を含む問題文は、
テンプレートの `template`（文字列）の代わりに `textParts`（文字列パーツと値パーツが交互に並ぶ配列）
を使用します。

```js
// テンプレート内（値はまだ確定していないため、変数名を ref で参照する）
textParts: [
  { type: "text", value: "水が" },
  { type: "value", ref: "a" },
  { type: "text", value: "Lあります。そのうち" },
  { type: "value", ref: "b" },
  { type: "text", value: "L使いました。残りは何Lですか。" }
]
```

問題が生成されると、`js/question-generator.js` が `ref` を実際の値に解決し、
`problem.textParts` に次のような、値が確定した配列を保存します（`js/value-renderer.js` の
`renderTextPartsHtml()` がこれをHTMLに変換します）。

```js
[
  { type: "text", value: "水が" },
  { type: "value", value: { type: "fraction", numerator: 5, denominator: 8 } },
  { type: "text", value: "Lあります。そのうち" },
  { type: "value", value: { type: "fraction", numerator: 2, denominator: 8 } },
  { type: "text", value: "L使いました。残りは何Lですか。" }
]
```

同時に、`problem.text`（HTML描画を経由しない場所＝デバッグ表示や履歴の内部データで使う
プレーンテキスト表現）も、`formatValue()` を使って自動的に組み立てられます。

整数・小数のみの問題は、引き続き従来どおり `template`（文字列）を使えます。`textParts` は
分数を含む問題だけが使用する、`template` と排他の項目です（`problem.textParts` が存在するかどうかで、
`ui.js` がどちらの描画方法を使うか自動的に判断します）。

## 6. 小学4年生・2学期/3学期の出題プラン（新内容/復習内容の比率とカテゴリ配分）

4-2・4-3モード（`gradeTerm: "4-2"` / `"4-3"`）は、他のモードと違い、出題する問題を
**ゲーム開始時にまとめて計画**します（`js/question-generator.js` の `planQuestionSequence()`）。
これは `js/game.js` が `gameState.questionPlan` として保持し、各問題を出すたびに参照します。

### 新内容・復習内容の区分（モードごとの設定）

「あるテンプレートが新内容か復習内容か」は、テンプレート単体では決まらず、**今どのモードで
遊んでいるか**によって変わります。例えば整数の2段階文章題（`gradeTerm: "4-multi-step"`）は、
4-2モードでは新内容の1カテゴリ（「2段階文章題」）ですが、4-3モードでは復習内容の一部です
（4-3では小数・分数の2段階問題を追加していないため）。この判定は `js/question-generator.js` の
`GRADE_TERM_PLAN_CONFIG` にモードごとに定義しています。

| モード | 新内容として扱う元データ | 復習内容として扱う元データ |
|---|---|---|
| `"4-2"` | `data/grade4-term2.js`（24種類）＋ `data/multi-step-integer.js`（12種類、「2段階文章題」という1つのカテゴリにまとめる） | `data/grade4-term1.js`（24種類） |
| `"4-3"` | `data/grade4-term3.js`（24種類：小数×整数・小数÷整数・同分母分数のたし算・同分母分数のひき算の4カテゴリ） | `data/grade4-term1.js`（24種類）＋ `data/grade4-term2.js`（24種類）＋ `data/multi-step-integer.js`（12種類、「2段階文章題」というカテゴリ扱い） |

> **`data/multi-step-integer.js` は複製していません。** 開発版モード（`4-multi-step`）・
> 4-2モードの「2段階文章題」カテゴリ・4-3モードの復習内容の3か所から、同じ12種類のテンプレートを
> 実行時に共有しています（`js/question-generator.js` の `groupTemplatesByCategory()`）。

### 出題比率とカテゴリ・学期のシャッフル

1. 出題数（例: 10問）に対して、新内容を `Math.ceil(出題数 / 2)` 問、残りを復習内容とする
   （出題数が奇数の場合は新内容側を1問多くする）
2. 新内容の各問題には、そのモードのカテゴリ（4-2は5カテゴリ、4-3は4カテゴリ）を
   均等に近い頻度で割り当てる（カテゴリ一覧をシャッフルしてからラウンドロビンで割り当てる）
3. 復習内容の各問題には、**まず学期を選び、次にその学期の中でカテゴリを選ぶ**、という2段階の
   ラウンドロビンで割り当てる（4-2の復習は4-1のみなので学期選択は実質1択、4-3の復習は
   4-1・4-2・4-multi-stepの3学期から均等に選ばれる。特定の学期・カテゴリだけに偏らないようにするため）
4. 新内容・復習内容の全体を1つの配列にまとめてシャッフルする（新内容→復習内容のようにブロックでは並べない）
5. 同じキー（新内容は各カテゴリ、復習内容は「復習内容」全体を1つのまとまりとして扱う）が
   **3問以上連続しないよう**、条件を満たすまで再シャッフルする（`limitConsecutiveRuns()`。
   無限ループを避けるため、再シャッフルの試行回数には上限（200回）を設けており、
   上限に達した場合はそれまでで一番良い結果をそのまま使う）

この計画は `gameState.questionPlan` にゲーム開始時点で確定され、各問題を生成する際は
その回のスロット（新内容なら `{contentGroup:"new", category}`、復習内容なら
`{contentGroup:"review", reviewGradeTerm, category}`）に応じたテンプレート集合
（`getCandidateTemplatesForSlot()`）から選ばれます。`?debug=true` を付けると、この計画全体の
新内容/復習内容の数・カテゴリ内訳をデバッグパネルで確認できます（[9章](#9-デバッグモードの使い方debugtrue)）。

### 同一ゲーム内での重複問題の回避

4-2・4-3モードに限らず、同じ問題文・同じ式（1段階問題の場合）が1回のゲーム内で繰り返し出題されないよう、
`js/game.js` の `generateNonDuplicateQuestion()` が、既出の問題文・式を記録しつつ、
重複した場合は最大15回まで再生成を試みます（15回試しても重複が解消しない場合は、そのまま出題します）。

## 7. 問題データの読み込み（data/index.js）と新しい学期の追加方法

ゲーム本体（`js/app.js` など）は、`data/grade4-term1.js` のような個別のデータファイルを
**直接 import しません**。必ず `data/index.js` を経由してテンプレートを取得します。

```js
// js/app.js
import { TEMPLATE_SETS_BY_GRADE_TERM } from "../data/index.js";
```

`TEMPLATE_SETS_BY_GRADE_TERM` には、`"4-1"`（小学4年生・1学期）・`"4-2"`（小学4年生・2学期）・
`"4-multi-step"`（2段階問題・整数の開発版、4-2の「2段階文章題」カテゴリとしても共有）の3つが
登録済みです。新しい学期の問題データ（例: `grade4-term3.js` `grade5-term1.js` など）を
追加する手順は次のとおりです。

1. `data/` フォルダに、`data/grade4-term1.js` と同じ形式（[共通スキーマ](#2-問題データの共通スキーマ)）の
   新しいファイルを追加します。他と重複しない配列名を `export const` してください。
2. `data/index.js` の先頭で import し、`TEMPLATE_SETS_BY_GRADE_TERM` に1行追加します
   （コメントアウトされた import 例をあらかじめ用意してあります）。
3. `gradeTerm` が `"学年-学期"`（4・5・6年 × 1・2・3学期）の組み合わせであれば、
   タイトル画面側（バトルモードの`#range-grade-select`/`#range-term-select`、
   トレーニングモードの`#training-grade-select`/`#training-term-select`）は
   学年ボタン・学期ボタンを組み合わせて選ぶ汎用UIのため、`index.html`・`js/ui.js`とも
   修正は不要です（運用開始後に、学年・学期の9択1段グリッドから、学年3ボタン＋学期3ボタンの
   2段選択UIへ変更しました。詳しくは[14章](#14-現時点で実装済みの機能)を参照）。
   4・5・6年、1〜3学期の組み合わせに当てはまらない新しい枠（例: 中学生の内容）を追加する
   場合だけ、`js/ui.js`の学年ボタン・学期ボタン生成ロジックの拡張が必要です。
4. 復習内容/新内容の出題プラン（[6章](#6-小学4年生2学期3学期の出題プラン新内容復習内容の比率とカテゴリ配分)）を
   その学期にも適用したい場合は、`js/game.js` の `startNewGame()` 内にある
   `gameState.gradeTerm === "4-2"` の判定に、新しい `gradeTerm` を追加してください。
   プランを使わない（従来どおり全テンプレートから一様ランダムに出題する）場合は、
   何も変更しなくてもそのまま動作します。

これ以外の `js/ui.js` `js/question-generator.js` などのゲーム本体ファイルは、
原則として修正する必要はありません。`js/storage.js` の `loadSelectedGradeTerm()` /
`saveSelectedGradeTerm()` は、タイトル画面で最後に選んだ出題範囲を
`localStorage` に保存・復元する仕組みで、新しい `gradeTerm` を追加してもそのまま使えます
（ボタンが存在しない・`disabled` の場合は自動的に4-1へフォールバックします）。

## 8. 問題検証ページの使い方（tools/question-validator.html）

開発者用の検証ページです。プレイヤー向けの画面ではありません。
[ローカルサーバーを起動](#12-ローカルでの起動方法)した状態で、次のURLを開いてください。

```
http://localhost:8000/tools/question-validator.html
```

このページは `data/index.js` に登録されている**すべての問題テンプレート**（1段階・2段階・
整数/小数/分数のすべて）について、次を行います。

- テンプレートの構造検証（[共通スキーマ](#2-問題データの共通スキーマ)を満たしているか）
- 1段階問題（`singleStep`）は数値を変えて**30回**生成し、すべて正常に生成できるか確認
  （分数は組み合わせによる不具合が起こりやすいため、第4段階までの10回より多く確認しています）
- 2段階問題（`multiStep`）は数値を変えて**20回**生成し、さらに**すべての解法ルートを最後まで
  解けるか**をシミュレーション（[4章](#4-2段階問題questiontype-multistepについて)参照）

画面には次の情報が表示されます。

- 総テンプレート数／正常なテンプレート数／エラーがあるテンプレート数
- テンプレートごとの問題ID・単元名・OK/NGバッジ・新内容/復習内容（`contentGroup`）バッジ・
  値の種類（整数/小数/分数）・エラー内容
- 生成された問題文の例（分数を含む場合は `textParts` を使って**実際のゲームと同じ縦型分数**で表示）・
  正解式（2段階問題は式1・式2の両方。分数も縦型で表示）・計算結果（`js/value-renderer.js` の
  `renderValueHtml()` を経由するため、バトル画面と全く同じ見た目になります）

一覧の上部にあるフィルターで、表示するテンプレートを絞り込めます。

- **出題範囲**（`gradeTerm`）: `4-1` `4-2` `4-3` `4-multi-step` など
- **カテゴリ**（`category`）: 「小数のたし算」「同分母分数のひき算」など
- **段階**（`questionType`）: 1段階のみ／2段階のみ
- **値の種類**: 整数のみ／小数のみ／分数のみ（テンプレートの `variables` 定義から判定）
- **判定**: 正常のみ／エラーのみ

フィルターは一覧の表示にのみ影響し、画面上部の総数・正常数・エラー数の集計は
**常に全テンプレート**を対象にしたまま変わりません（絞り込み後の件数は一覧の上にある
「表示中: N / M 件」で確認できます）。

「再検証する」ボタンで、乱数を変えて再実行できます。
新しいテンプレートを追加・変更した際は、このページで **NG（エラー）表示が無いこと** を確認してください。

## 9. デバッグモードの使い方（?debug=true）

ゲーム画面のURLに `?debug=true` を付けてアクセスすると、問題が切り替わるたびに
画面右下のデバッグパネルとブラウザの開発者コンソールに、次の情報が表示されます。

- 選択した出題範囲
- `questionType`
- 問題ID／テンプレートID／単元
- **新内容／復習内容**（出題プランのあるモードでは実際のスロットの区分を、無いモードでは
  テンプレートから大まかに判定した区分を表示。4-3の復習内容は、どの学期（4-1/4-2/4-multi-step）の
  どのカテゴリかも表示します）
- 生成に使用した `generatorType`
- 正解式（`js/value-utils.js` の `formatValue()` で整形した表示用の式。分数は `"3/5"` のような
  プレーンテキスト形式。縦型HTMLは別項目「表示用HTML」で確認できます）
- 元の数値データ（生成された生の値。小数・分数の分子分母もそのまま）
- **値の詳細**: 各変数について、値の種類（`number`/`fraction`）、分数の場合は分子・分母・
  最大公約数・約分後の分子分母、数値の場合は小数点以下の桁数、いずれも表示用の文字列表現
- **表示用HTML**: 各変数を `js/value-renderer.js` の `renderValueHtml()` で変換した実際のHTML文字列
  （分数は `<span class="fraction">...` を含む縦型表示用のマークアップ）
- **分数カードの一意ID**: その問題の選択肢カードのうち、値が分数であるものの `cardId` 一覧
- 現在のゲーム状態（画面・出題範囲・レベル・ハート・正解数・スコア・ランク・敵HP など）

出題範囲が **4-2 または 4-3** の場合は、さらに次も表示されます。

- 問題一覧全体の新内容／復習内容の数（例: `{"new":5,"review":5}`）
- 問題一覧全体のカテゴリ構成（4-3の場合、復習内容は `復習内容(4-1:整数のたし算)` のように
  学期とカテゴリの両方が分かる形式で内訳が表示されます）

これらは `gameState.questionPlan`（[6章](#6-小学4年生2学期3学期の出題プラン新内容復習内容の比率とカテゴリ配分)で
説明した、ゲーム開始時に確定する出題計画）の内容をそのまま集計したもので、
実際にどんな比率・順番で出題されているかをその場で確認できます。

2段階問題（`questionType: "multiStep"`）の場合は、さらに次も表示されます。

- `currentStepIndex`（今、何問目の式を解いているか）／`totalSteps`
- `candidateRouteIds`（現在も正解になりうる解法ルートのID一覧）
- `intermediateResults`（確定した中間結果）
- `completedSteps`（完了したステップの記録）
- `currentQuestionPenalized`（この問題で一度でもミスがあったか）
- 現在の段階で正解となる式（候補ルートごと）
- 各解法ルートの状態（候補に残っているか、各ステップの式）

```
http://localhost:8000/index.html?debug=true
```

`?debug=true` を付けずに通常アクセスした場合は、デバッグパネルは生成されず、
デバッグ用のコンソール出力も一切行われません。

## 10. 開発版モード（2段階問題・整数）の起動方法

2段階問題は、独立した出題範囲としては、まだ正式には公開していません
（4-2モードでは「2段階文章題」という新内容の1カテゴリとして、4-3モードでは復習内容の一部として、
既に出題されています。小数・分数を使った2段階問題は今回未対応です）。
2段階問題**だけ**を連続して確認したい場合は、`?debug=true` を付けてアクセスしてください。

```
http://localhost:8000/index.html?debug=true
```

タイトル画面の「学年」「学期」ボタンの下に、通常は存在しない
**「2段階問題・整数（開発版）」** ボタンが表示されます（`js/ui.js` が `?debug=true` のときだけ
`#range-dev-select` へ動的にボタンを追加しており、`index.html` には最初から書かれていません
＝通常アクセスでは選択する手段がありません。学年・学期の組み合わせに当てはまらない特殊な
出題範囲のため、学年・学期ボタンとは独立した選択枠になっている）。このボタンを選んで
スタートすると、`data/multi-step-integer.js` の問題だけが出題されます。レベル1〜3の選択や
ハイスコア保存は、通常モードと同じ仕組みをそのまま使います。

## 11. 各JavaScriptファイルの役割

| ファイル | 役割 |
|---|---|
| `js/app.js` | エントリーポイント。`data/index.js` から問題データを取得し、各モジュールを読み込み、タイトル画面の操作（スタート・音声切り替え）、判定、次へ、リタイア、リトライ、タイトルへ戻る操作を `game.js`（通常バトル）・`training-mode.js`（トレーニング）・`review-mode.js`（総復習）の関数に橋渡しします。**「今どのモードで遊んでいるか」の判定・振り分けは、このファイルの `MODES` ディスパッチテーブルと `currentMode` 変数だけに集約**しており、`game.js`・`training-mode.js`・`review-mode.js`・`ui.js` の内部には `if (mode === "training")` のような分岐を増やしていません（第6段階の設計方針。運用開始後、モードが3つに増えた際、if/三項演算子の連鎖ではなく `MODES.battle`/`MODES.training`/`MODES.review` それぞれが `start`/`judge`/`nextTap`/... の同じ関数名を持つディスパッチテーブルに整理しました）。 |
| `js/game.js` | 通常バトルの `gameState` オブジェクトでゲーム状態を一元管理。起動時に問題テンプレートを `question-validator.js` の `filterValidTemplateSets()`（トレーニング・総復習と共通）で検証・フィルタします。問題の進行、ハート管理、敵HP管理、タイマー管理、正解/不正解後の処理、クリア/ゲームオーバー判定、`?debug=true` 時のデバッグ出力を行います。2段階問題の判定・進行自体は `multi-step-engine.js` に委譲し、その結果（正解/不正解、最終正解かどうか）を受け取って既存の共通フロー（ハート減少・タイマー・スコア加算など）に橋渡しするだけに留めています。4-2・4-3モードでは、ゲーム開始時に `question-generator.js` の `planQuestionSequence()` で出題計画を作り（[6章](#6-小学4年生2学期3学期の出題プラン新内容復習内容の比率とカテゴリ配分)）、各問題はその計画に沿って生成します。同一ゲーム内での問題文・式の重複を避ける仕組み（`generateNonDuplicateQuestion()`）、分数を含む問題文（`textParts`）の履歴への保存、分数の分子・分母・約分後の値などを含む詳細なデバッグ出力もここにあります。カウントダウン演出（`runCountdown()`）は `training-mode.js`・`review-mode.js` からも再利用されるため export しています。トレーニングモード・総復習モードの状態（`trainingState`／`reviewState`）や、それぞれのファイルを参照することは一切ありません。**運用開始後に追加**: クリアが確定した瞬間（`finishGame()` の `type === "clear"` 分岐）にだけ、登場したエネミーを `js/storage.js` の `recordDefeatedEnemy()` でエネミー図鑑へ記録します（ゲームオーバー・リタイアからは呼びません）。 |
| `js/training-mode.js` | トレーニングモード専用の状態（`trainingState`）・進行管理（新規、第6段階）。`gameState` とは完全に独立しており、タイマー・ハート・敵HP・スコア・ランク・ハイスコアを一切参照しません。`generateTrainingQuestions(categoryId, templates, count)` が、指定カテゴリのテンプレートだけから（新内容/復習内容の比率処理は使わず）ちょうど5問を、問題文・式の重複を避けながら生成します。1問ごとの正解/不正解処理は、ハート減少・ゲームオーバーの代わりに「同じ問題（2段階なら同じ式）を解答欄をクリアしたまま再挑戦させる」処理になっており、`answer-checker.js`・`multi-step-engine.js`・`ui.js` のカード生成/正誤判定/分数表示はすべて通常バトルと同じ関数をそのまま再利用します。開発者用検証ページ向けの `validateTrainingSetGeneration()`（指定カテゴリで20回生成し、5問ちょうどか・他カテゴリが混ざらないか・重複が無いかを検証）もここにあります。 |
| `js/review-mode.js` | 総復習モード専用の状態（`reviewState`）・進行管理（運用開始後に追加）。`gameState`（通常バトル）・`trainingState`（トレーニング）のどちらとも完全に独立しています。「文章題バトルをベースとするが、スコア・ランク・時間制限が無い」という設計のため、ハート・敵HP・クリア/ゲームオーバー/リタイアの判定・演出は `game.js` と同じ考え方、問題を事前にすべて生成しておく進行方式・タイマー概念が無い点は `training-mode.js` と同じ考え方を組み合わせていますが、どちらのファイルも深く参照しません（唯一の例外は `runCountdown()` の再利用）。`getQuestionCountForScope(scope)` がスコープ（`"4"`／`"5"`／`"6"`／`"all"`）に属するカテゴリ数（＝出題数）を `data/category-registry.js` から動的に導出し、開始時にそのスコープの全カテゴリから1問ずつ生成してシャッフルします（`generateReviewQuestions()`）。ゲームスタート（1問目開始）からの経過時間を1秒おきに `ui.updateElapsedTime()` へ渡す処理、固定エネミー（`js/enemy-list.js` の `FORMULA_KAMEN`／`FORMULA_KAMEN_ACE`）の割り当て、スコープに応じたハート数（「小学校のまとめ」だけ1個）の決定もここが担当します。**運用開始後に追加**: `js/game.js` と同じく、クリアが確定した瞬間（`finishReview()` の `type === "clear"` 分岐）にだけ、登場した固定エネミーを `recordDefeatedEnemy()` でエネミー図鑑へ記録します。 |
| `js/ui.js` | 画面の表示切り替え、問題文・選択肢カード・解答欄の表示、HP/ハート/時間ゲージの更新、正解/不正解演出、カードのタップ操作・ドラッグ操作（Pointer Events）、結果画面の表示、デバッグパネルの表示を行います。2〜3段階問題用に、進行表示（「式を2つ答えよう！」／「（それまでの式）の続きを答えよう」。第12段階で「式 ○／○：」の進行番号表示を廃止）・中間結果カードの見た目・途中式正解の演出・`?debug=true` 時の開発版モードボタンの動的追加も担当します。数値・分数の表示は必ず `js/value-renderer.js` の `renderValueHtml()` / `renderTextPartsHtml()` を経由し（問題文・カード・解答欄・結果ボックス・履歴）、分数を含むカード・解答欄には専用のクラス（`choice-value-fraction`）で高さを確保します。タイトル画面で最後に選んだ出題範囲・モード・トレーニングの学期/カテゴリの保存・復元も担当します。**第6段階で追加**: モード選択ボタン（`setMode()`）、`data/category-registry.js` から動的に生成する学年学期/カテゴリ選択ボタン、トレーニング画面のヘッダー更新（`updateTrainingHeader()`）、トレーニング専用の軽い誤答演出（`triggerTrainingIncorrectEffect()`）、トレーニング結果画面（`showTrainingResultScreen()`）。バトル画面・結果画面のバトル専用/トレーニング専用/総復習専用要素の出し分けは、`#app` 要素への `mode-training`／`mode-review` クラスの付け外し（CSS側の `.battle-only` / `.training-only` / `.review-only` / `.hide-in-training`）にまとめており、`ui.js` 自体には要素ごとの表示切り替えロジックをほとんど書いていません。**運用開始後に追加**: 総復習モードの「学年」ボタン（`#review-scope-select`。4つの固定ボタン）・開始確認ダイアログ（`showReviewStartDialog()`。`getReviewQuestionCountForScope()` で問題数を`data/category-registry.js`から動的に算出）、バトル画面ヘッダーの総復習表示（`updateReviewHeader()`）、経過時間表示（`updateElapsedTime()`）、総復習結果画面（`showReviewResultScreen()`）、タイトル画面のサブタイトル（アプリタイトル直下の説明文）をモードに応じて切り替える `updateModeSubtitle()`（以前は常に固定文言で、モード切り替えボタンより上にあったが、ボタンの下へ移動しモードごとに文言を変えるよう変更）。**運用開始後に追加**: ヘルプボタン・ヘルプメニュー・「このゲームについて」・エネミー図鑑の画面遷移（`openHelpMenu()` `openAboutScreen()` `openEnemyDexScreen()` `backToHelpMenuFromDetail()` `closeHelpMenuToTitle()`）、エネミー図鑑の描画（`renderEnemyDex()`。`js/enemy-list.js` の `getAllEnemiesForDex()`/`getEnemyUnlockHint()` と `js/storage.js` の `loadDefeatedEnemyIds()` だけから組み立てる）、画面遷移時のフォーカス移動（`focusElement()`）、ヘルプ関連画面が表示されているときだけ働くEscキーでの1つ前の画面への遷移。ヘルプはゲーム進行を持たない補助画面のため `js/app.js` の `MODES` ディスパッチテーブルには追加していません。 |
| `js/question-generator.js` | テンプレートから値を生成し、問題文（`text` またはHTML描画用の `textParts`）・選択肢カード（最大8枚）・`solutionRoutes`（解決済みの正解ルート）を作成します。生成直後に `question-validator.js` で検証し、不正な場合はコンソールにエラーを出力した上で再生成します。`questionType: "multiStep"` の場合は、値の生成とルートの数値解決までを行い、進行状態の初期化・最初のカード生成は `multi-step-engine.js` に委譲します。小数変数（`decimalPlaces`）・分数変数（`type:"fraction"`）・百分率変数（`type:"percent"`）の生成、4-2/4-3/5-1/5-2/5-3の出題計画生成（`planQuestionSequence()` `getCandidateTemplatesForSlot()` `getContentGroup()`、`GRADE_TERM_PLAN_CONFIG` にモードを1件追加するだけで新しい学期にも適用できる）もここが担当します。ダミーカード生成・重複排除は、数値・分数・百分率のどの値にも対応した `value-utils.js` の `valueKey()` を使って値の型を意識せず行います。**第7段階で追加**: `quantityRelation` を持つテンプレート（小数倍・もとの量）専用の値生成（`generateDecimalMultiplicativeComparisonValues()`）と、そのテンプレートの「見えている数値」を `solutionRoutes[0]` から動的に判定する `getVisibleNumbers()` の分岐。**第8段階で追加**: 「2つの既知の値から積にあたる3つ目の値を求める」共通ロジック `generateProportionalValues()` を切り出し、`generateDecimalMultiplicativeComparisonValues()`（小数倍・もとの量）に加えて `generateAverageValues()`（平均）・`generateUnitRateValues()`（単位量あたり・混み具合）がこれを共有します。異分母分数のたし算・ひき算は `generateStandardValues()` のエイリアスのため、この点は無改造です。**第9段階で追加**: `pickPercentValue()`（百分率変数の生成）、`generateSpeedValues()`（速さ、`generateProportionalValues()` を再利用）、`generatePercentageValues()`（割合）、`resolveOperand()` の `{source:"literal"}` 対応（割引・増量の固定値「100%」）、`applyResultType()`（`resultType:"percent"` の変換）、`generateDummyPercent()`、`renderTemplateText()` の百分率対応（`String(value)` が `"[object Object]"` になっていたバグの修正）。**第10段階で追加**: `fractionTimesInteger`/`fractionTimesFraction`/`fractionDividedByInteger`/`integerDividedByFraction`/`fractionDividedByFraction`（すべて `generateStandardValues()` のエイリアス）、`generateFractionMultiplicativeComparisonValues()`（分数倍。もとにする量×分数倍を `calculateValues()` に委譲）、`QUANTITY_RELATION_GENERATOR_TYPES`/`GRADE_TERM_PLAN_CONFIG` に `"6-1"` 関連を追加。分数倍の内部ロジックは `generateFractionProportionalValues(variables, aKey, bKey, productKey)` として汎用化しており（小数版の `generateProportionalValues()` と同じ考え方）、`generateFractionUnitRateValues()`（単位量あたり・分数版）がこれを共有します。 |
| `js/multi-step-engine.js` | 2段階問題専用の進行管理。現在の途中式番号、正解候補となる解法ルートの絞り込み、途中式・最終式の判定、中間結果の保存、中間結果カードの生成、次の途中式への移行、複数解法の管理、結果画面用の履歴データの作成を担当します。開発者用検証ページから使う「全ルート完答シミュレーション」もここにあります。式の文字列表示は `js/value-renderer.js` の `renderValueHtml()` を使っており、すでに解決済みの値（数値・分数・百分率のいずれか）を型を意識せず扱う設計のため、第9段階の百分率2段階問題（割引・増量）にも無改造で対応できました。 |
| `js/question-validator.js` | 問題テンプレート（構造）と生成済み問題（数値確定後）を検証します。1段階問題・2段階問題の両方に対応し、2段階問題については「式が2つ登録されているか」「ルートID・resultKeyの重複」「存在しない変数/中間結果の参照や循環参照が無いか」「各ルートの最終結果が一致するか」なども検証します。加えて、`gradeTerm`／`contentGroup` の値の妥当性、`template`/`textParts` のどちらかが存在するか、`textParts` の構造・参照先の妥当性、小数の桁数が多すぎないか、分数の分母・分子の範囲や同分母性、百分率の値の妥当性、`exactDivision`系のわる数が想定範囲内か、`formatNumber()`/`parseFormattedNumber()` の往復変換が元の値と一致するか、分数・百分率の表示用HTML・`aria-label`が正しく生成できるか、なども検証します。ゲーム本体（`game.js`・`training-mode.js`）と `tools/question-validator.html` の両方から使われます。**第6段階で追加**: `filterValidTemplateSets()`（不正なテンプレートを出題プールから除外する処理を`game.js`から移設し、通常バトル・トレーニング共通で使う）、`validateCategoryRegistry()`（カテゴリレジストリ自体のID重複・必須項目チェック）、`validateCategoryRegistryAgainstTemplates()`（レジストリとテンプレートの対応関係。孤立した`categoryId`・テンプレート0件のカテゴリが無いかを検証）。**第7段階で追加**: `validateQuantityRelation()`（小数倍・もとの量テンプレートの `quantityRelation` の構造検証）と、`comparedKey` のような動的な変数名も「既知の変数」として扱う `getKnownVariableKeys()` ヘルパー。**第8段階で追加**: `validateQuantityRelation()` を `QUANTITY_RELATION_TYPE_CONFIG` で汎用化し、平均（`type:"average"`）・単位量あたり（`type:"unit-rate"`）にも対応。異分母分数専用の `validateUnlikeDenominators()`（分母が異なることを要求）・`validateNonNegativeUnlikeDenominatorSubtraction()`（クロス乗算で答えが負にならないか検証）を追加。既存の「生成された分数の分母が同じか」というチェックは、同分母専用の `generatorType`（`SAME_DENOMINATOR_GENERATOR_TYPES`）に限定するよう修正（異分母分数を誤って弾かないようにするため）。**第9段階で追加**: `QUANTITY_RELATION_TYPE_CONFIG` に速さ（`type:"speed"`）・割合（`type:"percentage"`）を追加、`validatePercentVariable()`（百分率変数の検証）、`validateValueRepresentation()` の百分率対応、`validateMultiStepSolutionRoutes()` の `{source:"literal"}` オペランド対応、`applyResultTypeForValidation()`（生成側と独立に `resultType:"percent"` を再現し、正解式の再計算と一致させる）。**第10段階で追加**: `VALID_GRADE_TERMS` に `"6-1"` を追加、新しい `generatorType` 7種のルール、`QUANTITY_RELATION_TYPE_CONFIG` に分数倍（`type:"fraction-multiplicative-comparison"`）を追加、0でわるチェックを型を意識せず行う `isZeroValue()`（`value-utils.js`）に統一。`fractionUnitRate` の `generatorType` ルール、`QUANTITY_RELATION_TYPE_CONFIG` の単位量あたり・分数版（`type:"fraction-unit-rate"`）も第10段階で追加しています。 |
| `js/answer-checker.js` | `eval()` を使わずに、値（数値・分数・百分率）と演算記号から安全に式を計算します。1つの式が正解ステップと一致するかを判定する共通ロジック（`matchesStep`）を持ち、1段階問題の `checkAnswer` と、2段階問題の `multi-step-engine.js` の両方から使われます。実際の計算・比較は自分では行わず、`value-utils.js` の `calculateValues()` / `areValuesEqual()` にすべて委譲しています。 |
| `js/number-utils.js` | 浮動小数点誤差の出ない小数の加減乗除（整数にスケールしてから計算し戻す方式）、整数のわる数による安全なわり算（`divideExactByInteger()`。小数÷整数にも対応）、桁区切り・小数のトリム表示（`formatNumber()`）、表示文字列から数値へ戻す変換（`parseFormattedNumber()`）、誤差を許容した数値比較（`areNumbersEqual()`）を提供します。数値（整数・小数）専用のユーティリティで、分数・百分率は扱いません（分数は `fraction-utils.js`、百分率は `percentage-utils.js`）。 |
| `js/fraction-utils.js` | 分数専用の計算処理。最大公約数（`gcd`）、約分（`simplifyFraction`）、たし算・ひき算・かけ算・わり算（`addFractions` など）、同値判定（`areFractionsEqual`）を、分子・分母だけを使って正確に行います（浮動小数点数を経由しません）。`addFractions`/`subtractFractions` は最初から異分母対応（クロス乗算）です。**第8段階で追加**: 最小公倍数（`lcm`）・通分（`convertToCommonDenominator`。デバッグ表示・将来の解説機能用で、正誤判定には使用しません）。**第10段階で追加**: `multiplyFractions`/`divideFractions` を実データから初めて使用（わり算は右辺の逆数をかける方式）、`multiplyFractionByInteger()`/`divideFractionByInteger()`/`divideIntegerByFraction()`（分数と整数が混在する乗除）。 |
| `js/percentage-utils.js` | 百分率専用の計算処理（新規、第9段階）。`isValidPercent` `normalizePercent` `percentToRatio`（百分率→比率）`ratioToPercent`（比率→百分率）`formatPercent`（表示用テキスト）`arePercentValuesEqual` を、`{type:"percent", value}` の値オブジェクトのみを使って行います。`fraction-utils.js` と同じ位置づけの、値の型ごとの専用計算モジュールです。 |
| `js/value-utils.js` | 整数・小数・分数・百分率を型を意識せず扱うための共通レイヤー（新規、第9段階で百分率対応を追加）。`calculateValues()` は値の型に応じて `number-utils.js`・`fraction-utils.js`・`percentage-utils.js` に処理を振り分け、`areValuesEqual()` は型ごとの同値判定を、`normalizeValue()` は正規化（分数の約分・整数化、百分率の丸め誤差除去を含む）を行います。「整数・小数・分数・百分率ごとの分岐」をこのファイル1か所に閉じ込めることで、ゲーム本体には型分岐を書かせない設計にしています。**第10段階で追加**: `calculateValues()` に分数×分数・分数÷分数・分数×整数・整数×分数・分数÷整数・整数÷分数の組み合わせを追加、`toFractionValue()`（整数を分母1の分数に変換）、`isZeroValue()`（分数・百分率・数値のどれでも0判定。0でわるチェックの共通化）。 |
| `js/value-renderer.js` | 分数の縦型表示（教科書と同じ、横線の上に分子・下に分母）のHTMLと、`aria-label`（読み上げ用のテキスト）を生成します（新規、第9段階で百分率対応を追加）。百分率は比率（小数）に変換してから通常の数値と同じ形式で表示します（`renderPercentConversionHtml()` は「割合・百分率」の答え表示専用で、「0.5→50%」の形式を作ります）。`textParts` 形式の問題文をHTMLに変換する `renderTextPartsHtml()` もここにあります。分数は、約分の結果分母が1になる場合は縦型ではなく整数として表示します（第10段階で追加）。問題文・選択肢カード・解答欄・■欄・正解演出・問題履歴・問題検証ページ・デバッグ表示は、すべてこのファイルの関数を経由して分数・百分率を表示します。 |
| `js/score.js` | 問題ごとの加算スコア、現在のランクを計算します（1段階・2段階共通）。 |
| `js/audio.js` | Web Audio API でカウントダウン音・正解音・不正解音・敵撃破音・ゲームオーバー音を生成します。 |
| `js/storage.js` | ハイスコア・効果音設定・タイトル画面で最後に選んだ出題範囲（`gradeTerm`）を `localStorage` に保存/読み込みします。`localStorage` が使えない環境でもエラーにならないようにしています。**第6段階で追加**: `lastMode`（前回選んだモード）・`lastTrainingGradeTerm`・`lastTrainingCategoryId` の保存/読み込み。トレーニング・総復習のスコア・進捗・ハイスコアは保存しません。既存のハイスコア用キーとは別のキーを使っており、既存データには一切触れません。**運用開始後に変更**: `loadLastMode()`/`saveLastMode()` が扱う値に `"review"` を追加（総復習モードの選択も記憶・復元できるようにした）。総復習の「どのスコープを選んだか」自体は保存しません（トレーニングのカテゴリボタンと同じく、タップした瞬間に確認ダイアログを開くだけの操作のため）。**運用開始後に追加**: `loadDefeatedEnemyIds()`/`saveDefeatedEnemyIds()`/`isEnemyDefeated()`/`recordDefeatedEnemy()`（エネミー図鑑の解放状態。キー: `mathWordBattle_defeatedEnemyIds`）。保存データが不正なJSON・配列でない・要素が文字列でない場合は安全に空配列へフォールバックし、既に記録済みのIDを渡しても重複追加しません。 |
| `data/index.js` | 出題範囲（学年・学期）ごとの問題テンプレートを一元管理するレジストリ。ゲーム本体はここ経由でのみデータを取得します。`"4-3"` は `data/grade4-term3.js`、`"5-1"` は `data/grade5-term1.js`、`"5-2"` は `data/grade5-term2.js`（第8段階）、`"5-3"` は `data/grade5-term3.js`（第9段階）、`"6-1"` は `data/grade6-term1.js`（第10段階）に登録し、`"4-multi-step"` の `data/multi-step-integer.js` を4-2の「2段階文章題」カテゴリ・4-3/5-1/5-2/5-3/6-1の復習内容としても共有します。 |
| `data/category-registry.js` | トレーニングモードで選べる38カテゴリの単一の情報源（第6段階で新規導入、第7段階で4カテゴリ、第8段階で5カテゴリ、第9段階で8カテゴリ、第10段階で8カテゴリ（分数×整数〜単位量あたり（分数）を含む）追加）。各カテゴリは `{ id, label, gradeTerm, gradeLabel, enabledInTraining, order }` を持ち、`getCategoriesForGradeTerm()` `getGradeTermGroups()` `getCategoryById()` のヘルパーを提供します。`js/ui.js` はこのレジストリからタイトル画面のカテゴリ選択ボタンを動的に生成するだけで、カテゴリ名を個別にハードコードしていません。詳しくは[18章](#18-トレーニングモード第6段階)。 |
| `data/grade4-term1.js` | 小学4年生・1学期の1段階問題テンプレートのデータのみを定義（ゲーム処理は含みません）。 |
| `data/grade4-term2.js` | 小学4年生・2学期の1段階問題テンプレートのデータのみを定義（小数のたし算・ひき算、大きな数、2けたでわるわり算、各6種類・計24種類）。 |
| `data/grade4-term3.js` | 小学4年生・3学期の1段階問題テンプレートのデータのみを定義（小数×整数・小数÷整数・同分母分数のたし算・同分母分数のひき算、各6種類・計24種類）。分数のテンプレートは `textParts` を使用します。 |
| `data/grade5-term1.js` | 小学5年生・1学期の1段階問題テンプレートのデータのみを定義（小数×小数・小数÷小数・小数倍・もとの量、各8種類・計32種類）。小数倍・もとの量のテンプレートは `quantityRelation` メタデータを持ちます。詳しくは[19章](#19-小学5年生1学期第7段階)。 |
| `data/grade5-term2.js` | 小学5年生・2学期の問題テンプレートのデータのみを定義（異分母分数のたし算・ひき算・平均・単位量あたり・混み具合、各6種類・計30種類。第8段階で新規）。平均・単位量あたり・混み具合のテンプレートは `quantityRelation` メタデータを持ち、「2つの数の平均」だけは `questionType:"multiStep"` の2段階問題です。詳しくは[20章](#20-小学5年生2学期第8段階)。 |
| `data/grade5-term3.js` | 小学5年生・3学期の問題テンプレートのデータのみを定義（速さ・道のり・時間・割合（比べる量/百分率/もとにする量）・割引・増量、各5種類・計40種類。第9段階で新規）。速さ・割合のテンプレートは `quantityRelation` メタデータを持ち、割引・増量は `questionType:"multiStep"` の2段階問題（それぞれ2つの解法ルート）です。詳しくは[21章](#21-小学5年生3学期第9段階)。 |
| `data/grade6-term1.js` | 小学6年生・1学期の問題テンプレートのデータのみを定義（分数×整数/分数×分数/分数÷整数/整数÷分数/分数÷分数/分数倍・比べる量/分数倍・もとの量/単位量あたり（分数）、各5種類・計40種類。第10段階で新規（単位量あたり（分数）を含む））。すべて `textParts` を使用（分数の値が問題文に直接登場するため）。分数倍・単位量あたり（分数）のテンプレートは `quantityRelation` メタデータを持ちます。詳しくは[22章](#22-小学6年生1学期第10段階)。 |
| `data/multi-step-integer.js` | 整数のみの2段階問題テンプレートのデータのみを定義。開発版モード（`4-multi-step`）専用のデータであると同時に、4-2モードの「2段階文章題」カテゴリ、4-3/5-1/5-2/5-3モードの復習内容からも同じデータをそのまま参照します（複製はしていません）。 |

## 12. ローカルでの起動方法

このアプリは ES Modules を使用しているため、`index.html` を直接ダブルクリックして開くと
`file://` プロトコルの制約により正しく動作しません（モジュールの読み込みがブロックされます）。
必ずローカルサーバーを起動して確認してください。

### Python がインストールされている場合

```bash
cd math-word-battle
python -m http.server 8000
```

ブラウザで以下のアドレスにアクセスしてください。

```
http://localhost:8000
```

### Node.js がインストールされている場合

```bash
cd math-word-battle
npx serve .
```

表示されたアドレス（例: `http://localhost:3000`）にアクセスしてください。

### VSCode を使う場合

拡張機能「Live Server」をインストールし、`index.html` を右クリックして
「Open with Live Server」を選択してください。

## 13. GitHub Pagesでの公開方法

1. このフォルダ（`math-word-battle` 以下の中身）をGitHubリポジトリにコミット・プッシュします。
   - リポジトリのルートに `index.html` が来るようにしてください
     （`math-word-battle` フォルダごとプッシュした場合は、そのフォルダをルートにするか、
     GitHub Pagesの公開ディレクトリを合わせてください）。
2. GitHubのリポジトリページで「Settings」→「Pages」を開きます。
3. 「Build and deployment」の「Source」で「Deploy from a branch」を選びます。
4. 公開したいブランチ（例: `main`）と、公開フォルダ（`/root` または `/docs`）を選択し、保存します。
5. 数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/` でアプリが公開されます。

すべてのファイル参照が相対パスになっているため、プロジェクトサイト
（`https://<ユーザー名>.github.io/<リポジトリ名>/` のようにサブパスを持つURL）でも
そのまま動作します。`tools/question-validator.html` はプレイヤー向けの導線からはリンクしていない、
開発者用のページです。2段階問題の開発版モードも、`?debug=true` を付けない限り
一般のプレイヤーからは見えません。

## 14. 現時点で実装済みの機能

- タイトル・設定画面（レベル選択、出題範囲選択、効果音ON/OFF、ハイスコア連動）
- タイトル画面の**学年・学期選択UI**（運用開始後に変更。文章題バトル・トレーニングとも、
  以前は「4年1学期」〜「6年3学期」の9つの組み合わせボタンを1段のグリッドから直接選ぶ形式
  だったが、「学年」（4年／5年／6年）ボタンと「学期」（1学期／2学期／3学期）ボタンを別々の
  2段で選び、選んだ組み合わせ（例: 5年＋2学期→`"5-2"`）を出題範囲として使う形式に変更した。
  バトルモードは`index.html`に固定の学年3ボタン・学期3ボタンを配置し、トレーニングモードは
  従来どおり`data/category-registry.js`の`getGradeTermGroups()`から実在する学年・学期の
  一覧を動的に導出してボタンを生成する（js/ui.jsの`populateTrainingGradeTermSelect()`）。
  `?debug=true`限定の開発版の出題範囲（2段階問題・整数）は学年・学期の組み合わせに
  当てはまらないため、学年・学期ボタンとは独立した選択枠（`#range-dev-select`）として
  分離し、選ばれると学年・学期側の選択状態を解除する。localStorageへの保存形式
  （`"5-2"`のような`gradeTerm`文字列）自体は変更していないため、以前の選択も
  正しく復元される）
- **「倍」を表す値が1にならないようにする修正**（運用開始後にバグ修正。「分数倍・比べる量」で
  「花だんの面積は3㎡です。菜園の面積は花だんの面積の1倍です。菜園の面積は何㎡ですか。」のように、
  ○倍の○が1になる問題が生成されていた。「1倍」は「○と同じ」を回りくどく言っているだけで
  文章題として不自然なため、`js/question-generator.js`に`pickMultiplierValueExcludingOne()`を
  追加し、小数倍・もとの量（`generateDecimalMultiplicativeComparisonValues()`）・分数倍
  （`generateFractionMultiplicativeComparisonValues()`）の`multiplier`の値が、範囲から選んだ
  結果ちょうど1になった場合は選び直すようにした。「1あたり」が正当な値になりうる単位量あたり
  （`unitRate`・`fractionUnitRate`）や、「1」が正当な値になりうる平均（`average`）には
  この制約を適用していない（`multiplier`専用））
- カウントダウン画面（3・2・1・START!）
- バトル画面（敵HP、ハート、時間ゲージ、問題文、解答欄、選択肢カード）
- 選択肢カードのタップ配置・ドラッグ配置（Pointer Events対応、配置済みカードは元の位置を保ったまま非表示）
- 解答欄が揃うと「＝」ボタンがオレンジ色に光って目立つ
- eval() を使わない安全な正誤判定（複数の正解ルート = `solutionRoutes` に対応）
- 正解・不正解演出（○マーク、画面シェイク、赤フラッシュ、効果音）
- 敵を倒したときの点滅して消える演出
- スコア・ランク計算、ノーミス判定（+表示）
- クリア／ゲームオーバー／リタイアの判定と結果画面
- 結果画面での**エネミーコメント表示**（運用開始後に追加。結果タイトルのすぐ下に、その回のバトルに
  登場したエネミーの絵文字・名前と、専用のせりふを表示する。せりふはクリア時とゲームオーバー時で
  異なり、リタイア時はゲームオーバー時と同じせりふを使う。24種類のエネミー全員に個別のせりふを
  用意しており、単一の情報源（`js/enemy-list.js`）はキャラ紹介文も保持している。紹介文は
  この時点では画面に表示せず、将来の「エネミー図鑑」機能のためのデータとして温存していたが、
  運用開始後にエネミー図鑑機能を実装し、倒したことがあるエネミーの説明として実際に使うように
  なった。詳しくは後述の「エネミー図鑑」の項目を参照）
- 結果画面での**ハイスコア更新表示の変更**（運用開始後に変更。以前は「✨ ハイスコア こうしん！ ✨」を
  独立した1行として表示していたが、「今回のスコア」の数字の右に黄色い文字で「✨新記録！✨」を
  添える表示に変更した。表示・非表示のON/OFF自体は従来どおり `data.isNewRecord` で切り替える）
- **タイムボーナス方式のスコア計算**（運用開始後に変更。以前は「解答時間ゲージの残量%」を使う
  `(10+n)×(50+ゲージ残量%)×4` だったが、「正解までにかかった秒数」を直接使う
  `(10+n)×(10+タイムボーナス)×20` に変更した。タイムボーナス＝`24－正解までにかかった秒数÷係数`
  （最大20・最小0にクランプ、小数点以下は切り捨てて必ず整数にする）。係数は問題の段階数によって
  異なり、1段階問題は1（＝従来どおり4秒以内に正解すると20、24秒以上かかると0）、2段階問題は
  1.75、3段階問題は2.5（運用開始後に追加。多段階問題は式の数が多いほど時間がかかるのが自然な
  ため、経過秒数を係数で割ってから同じ基準で評価する）。`js/score.js` の `calculateTimeBonus()`
  が計算し、`js/game.js` の `handleCorrect()` で経過秒数（`currentQuestionDurationSec ×
  (1－lastTimerRatio)`）と段階数（`problem.multiStep.totalSteps`。1段階問題は1）を渡す。
  1問の中で不正解・時間切れが一度でもあった場合はタイムボーナスを0として扱う点は従来
  （ゲージ残量0%扱い）と同じ）
- リトライ（同条件で再挑戦）／タイトルへ戻る
- ハイスコアの保存・読み込み（出題範囲＋レベルの組み合わせごと）
- スマートフォン縦画面対応（セーフエリア・100dvh・44px以上のタップ領域）
- 小学4年生・1学期のたし算・ひき算・かけ算・わり算（24テンプレート、共通スキーマ）
- 問題テンプレート／生成済み問題の検証機能（`js/question-validator.js`）と、不正な問題を出題しない安全策
- 開発者用の問題検証ページ（`tools/question-validator.html`）
- 問題データの読み込みの一元化（`data/index.js`）
- `?debug=true` によるデバッグ情報表示
- **整数のみの2段階（2つの式で解く）文章題**（`questionType: "multiStep"`）
  - 1つ目の式に正解すると、中間結果カードが出現し、敵HP・スコアは変えずに2つ目の式へ進む
  - 2つ目の式に正解すると、通常の1問正解として敵HP減少・スコア加算・正解数加算・履歴記録を行う
  - 不正解・時間切れ後も、同じ問題・同じ途中式に再挑戦できる（1つ目の式に戻らない）
  - 途中式正解時はタイマーを全回復させず、一時停止→再開する
  - 問題全体を通して一度でもミスがあれば、スコア計算のタイムボーナスを0として扱う
  - 複数の解法ルートに対応（どちらの解き方でも正解と判定し、履歴には実際に使った解法を記録）
  - 結果画面の問題履歴が2段階問題に対応（式1・式2それぞれの表示、リタイア時の途中状態も表示）
  - 12種類のテンプレート（かけ算→たし算・かけ算→ひき算・たし算→わり算・その他、各3種類以上）
  - うち2種類は複数解法問題
  - 開発者用検証ページで2段階問題の全ルート完答シミュレーションが可能
  - 独立モードとしては `?debug=true` の開発版モード限定だが、**4-2モードの「2段階文章題」カテゴリとしては正式に出題される**
- **小学4年生・2学期（正式モード、`gradeTerm: "4-2"`）**
  - 小数のたし算・小数のひき算（浮動小数点誤差の出ない安全な計算・表示）
  - 大きな数（10,000以上）のたし算・ひき算・かけ算（桁区切り表示）
  - 2けたでわるわり算（あまりが出ない範囲で出題）
  - 整数の2段階文章題（`data/multi-step-integer.js` を複製せず再利用）
  - 1学期の復習内容と2学期の新出内容をおよそ半々の比率で出題し、新内容側は5カテゴリに均等に近い頻度で配分
  - 新内容→復習内容のようなブロック出題にならないようシャッフルし、同じカテゴリ（復習内容全体を含む）が
    3問以上連続しないように調整
  - 同じ問題文・同じ式が1回のゲーム内で繰り返し出題されないようにする重複回避
  - タイトル画面で最後に選んだ出題範囲を記憶し、次回起動時に自動選択（無効な値の場合は4-1にフォールバック）
  - 大きな数・小数のカードや解答欄が、はみ出したり折り返したりしないよう自動的に文字サイズを縮小
  - ハイスコアは出題範囲＋レベルの組み合わせごとに保存（4-2にも独立したハイスコア枠がある）
- **小学4年生・3学期（正式モード、`gradeTerm: "4-3"`）**
  - 小数×整数（かけ算なので順序を問わず正解）
  - 小数÷整数（必ず有限小数で割り切れる。循環小数・あまりのあるわり算は出題しない）
  - 同分母分数のたし算（順序を問わず正解）・同分母分数のひき算（順序を区別）
  - 分数は分子・分母だけで正確に計算し、浮動小数点数（小数）へ変換しない
  - 分数の計算結果を自動的に約分して表示（整数になる場合は整数で表示。例: `4/8+4/8` → `1`）
  - 分数を**教科書と同じ縦型**（横線の上に分子・下に分母）で表示。問題文・選択肢カード・解答欄・
    ■欄・正解演出・問題履歴・問題検証ページ・デバッグ表示のすべてで統一
  - 分数の縦型表示には読み上げ用の `aria-label`（「5分の3」の形式）を設定
  - 分数カードも数値カードとして扱われ、タップ・ドラッグ操作、44px以上のタップ領域を維持
  - 分数カード・解答欄は、上下が切れないよう自動的に高さを確保
  - 整数・小数・分数を、`js/value-utils.js` の共通関数（`calculateValues` `areValuesEqual` など）を
    通じて型を意識せず扱う設計（ゲーム本体に型ごとの分岐をほとんど書いていない）
  - 1・2学期の復習内容と3学期の新出内容をおよそ半々の比率で出題し、新内容側は4カテゴリに均等に近い頻度で配分
  - 復習内容は、1学期・2学期（整数の2段階文章題を含む）から**偏りなく**選ばれる
    （学期を選んでからカテゴリを選ぶ、2段階のラウンドロビン方式）
  - 同じ問題文・同じ式が1回のゲーム内で繰り返し出題されないようにする重複回避
  - タイトル画面で最後に選んだ出題範囲を記憶し、次回起動時に自動選択（無効な値の場合は4-1にフォールバック）
  - ハイスコアは出題範囲＋レベルの組み合わせごとに保存（4-3にも独立したハイスコア枠がある）
  - 24種類の新規テンプレート（小数×整数・小数÷整数・同分母分数のたし算・同分母分数のひき算、各6種類）
- **トレーニングモード（第6段階、新規）**
  - タイトル画面でモード（通常バトル／トレーニング）を選択できる
  - 13カテゴリ（`data/category-registry.js`）から1つを選び、そのカテゴリだけを5問出題
  - タイマー・ハート・敵HP・スコア・ランク・ハイスコアが無く、不正解でもゲームオーバーにならない
  - 不正解時は同じ問題（2段階問題は同じ式）を解答欄をクリアしたまま何度でも再挑戦できる
  - 1段階・2段階・整数/小数/分数のすべての問題形式に対応（既存の生成・判定・表示ロジックをそのまま再利用）
  - 5問すべて正解すると結果画面へ（カテゴリ名・完了数・1回で正解した数・ミス回数・問題履歴を表示）
  - 「もう一度」で同じカテゴリの新しい5問を再生成、「タイトルに戻る」でタイトル画面へ
  - リタイア機能（確認ダイアログの文言・ボタンがトレーニング向けに変わる）
  - 詳しくは[18章](#18-トレーニングモード第6段階)
- **小学5年生・1学期（第7段階、正式モード、`gradeTerm: "5-1"`）**
  - 小数×小数（かけ算なので順序を問わず正解）
  - 小数÷小数（必ず有限小数で割り切れる。循環小数・あまりのあるわり算は出題しない）
  - 小数倍（基準量・何倍から比較量を求める／基準量・比較量から何倍かを求める、の両方に対応）
  - もとの量（比較量・何倍から基準量＝もとの量を求める）
  - 「基準量の何倍が比較量である」という数量関係を `quantityRelation` メタデータで表現し、
    小数倍・もとの量の両カテゴリで同じ値生成ロジックを共有（詳しくは[19章](#19-小学5年生1学期第7段階)）
  - 小数×小数・小数÷小数は、`js/value-utils.js` の `calculateValues()` の `"÷"` 判定を
    「わる数が整数か小数か」で分岐させることで、既存の整数÷整数の判定を壊さずに対応
  - 1〜3学期の復習内容（整数の2段階文章題を含む）と5年1学期の新出内容をおよそ半々の比率で出題
  - 新内容側は4カテゴリに均等に近い頻度で配分。復習内容は4-1/4-2/4-3/4-multi-stepから偏りなく選ばれる
  - この段階の新内容（小数×小数・小数÷小数・小数倍・もとの量）はすべて1段階問題（既存の整数2段階文章題は復習として引き続き出題）
  - 同じ問題文・同じ式が1回のゲーム内で繰り返し出題されないようにする重複回避
  - ハイスコアは出題範囲＋レベルの組み合わせごとに保存（5-1にも独立したハイスコア枠がある）
  - 32種類の新規テンプレート（小数×小数・小数÷小数・小数倍・もとの量、各8種類）
  - トレーニングモードの4新規カテゴリにも対応（`decimal-times-decimal` `decimal-divided-by-decimal`
    `decimal-multiplicative-comparison` `decimal-original-quantity`）
- **小学5年生・2学期（第8段階、正式モード、`gradeTerm: "5-2"`）**
  - 異分母分数のたし算（`fraction-utils.js` のクロス乗算計算をそのまま利用。順序を問わず正解）
  - 異分母分数のひき算（順序を区別。答えが負にならないよう範囲設計＋構造検証で保証）
  - 平均（合計・個数から平均を求める／個数・平均から合計を求める。かけ算は順序を問わず正解）
  - 2つの数の平均（既存の2段階問題エンジンを再利用、divisorを2に固定）
  - 単位量あたり（全体量・単位数から1単位あたりを求める／1単位あたり・単位数から全体量を求める）
  - 混み具合（1㎡あたりなどの人数・頭数を求める数値問題のみ。「どちらが混んでいるか」は今回未対応）
  - 「基準量の何倍が比較量」（小数倍・もとの量）と同じ `quantityRelation` の枠組みを、
    「合計＝個数×平均」（平均）・「全体量＝単位数×1単位あたり」（単位量あたり・混み具合）にも拡張
  - 1〜3学期＋5年1学期の復習内容と5年2学期の新出内容を同数（新内容:復習=1:1）で出題
  - 新内容側は5カテゴリに均等に近い頻度で配分（新内容5問なら5カテゴリ1問ずつ、6問なら+1カテゴリ）
  - 復習内容は4-1/4-2/4-3/4-multi-step/5-1から偏りなく選ばれる
  - 同じ問題文・同じ式が1回のゲーム内で繰り返し出題されないようにする重複回避
  - ハイスコアは出題範囲＋レベルの組み合わせごとに保存（5-2にも独立したハイスコア枠がある）
  - 30種類の新規テンプレート（異分母分数のたし算・ひき算・平均・単位量あたり・混み具合、各6種類）
  - トレーニングモードの5新規カテゴリにも対応（`unlike-fraction-addition` `unlike-fraction-subtraction`
    `average` `unit-rate` `crowdedness`）
- **小学5年生・3学期（第9段階、正式モード、`gradeTerm: "5-3"`）**
  - 速さ（道のり・時間から速さを求める）・道のり（速さ・時間から道のりを求める）・
    時間（道のり・速さから時間を求める）。単位は km/時・m/分・m/秒の3種類のみで、単位換算は行わない
  - 割合・比べる量（もとにする量・割合から比べる量を求める）・割合・百分率（比べる量・もとにする量から
    割合を求める。数値÷数値の結果を百分率として表示する `resultType:"percent"` を使用）・
    割合・もとにする量（比べる量・割合からもとにする量を求める）
  - 割引・増量（2段階問題、それぞれ2つの解法ルートに対応。割引:
    「100%－割引率＝支払う割合、もとの値段×支払う割合＝代金」と
    「もとの値段×割引率＝値引き額、もとの値段－値引き額＝代金」のどちらでも正解。
    増量も同様に「100%＋増量率」と「増量分を先に求める」の2ルート）
  - 整数・小数・分数に続く4つ目の値の型として**百分率**（`{type:"percent", value}`）を追加
    （詳しくは[5章](#5-値の共通データ形式と分数の扱いvalue-utilsjs--fraction-utilsjs--value-rendererjs)）
  - 「基準量の何倍が比較量」（小数倍・平均・単位量あたり）と同じ `quantityRelation` の枠組みを、
    「道のり＝速さ×時間」（速さ）・「比べる量＝もとにする量×割合」（割合）にも拡張
  - 1〜3学期＋5年1〜2学期の復習内容と5年3学期の新出内容を同数（新内容:復習=1:1）で出題
  - 新内容側は8カテゴリに均等に近い頻度で配分（ラウンドロビン、8カテゴリ以下なので出題数の範囲内では重複しない）
  - 復習内容は4-1/4-2/4-3/4-multi-step/5-1/5-2から偏りなく選ばれる
  - 同じ問題文・同じ式が1回のゲーム内で繰り返し出題されないようにする重複回避
  - ハイスコアは出題範囲＋レベルの組み合わせごとに保存（5-3にも独立したハイスコア枠がある）
  - 40種類の新規テンプレート（速さ・道のり・時間・割合（比べる量/百分率/もとにする量）・割引・増量、各5種類）
  - トレーニングモードの8新規カテゴリにも対応（`speed-find-speed` `speed-find-distance` `speed-find-time`
    `percentage-compared-amount` `percentage-rate` `percentage-base-amount`
    `percentage-discount` `percentage-increase`。割引・増量は2段階問題としてトレーニングでも出題される）
- **小学6年生・1学期（第10段階、正式モード、`gradeTerm: "6-1"`）**
  - 分数×整数・分数×分数（どちらもかけ算なので順序を問わず正解）
  - 分数÷整数・整数÷分数・分数÷分数（すべてわり算なので順序を区別。わり算は右辺の逆数をかける
    方式で正確に計算し、0でわる問題は生成・検証の両方で防止）
  - 分数倍・比べる量（もとにする量・分数倍から比べる量を求める）・分数倍・もとの量
    （比べる量・分数倍からもとの量を求める）
  - 単位量あたり（分数）（単位数・1単位あたりの量のどちらも分数になりうる単位量あたり）
  - 分数のかけ算・わり算は、小学4年生3学期から使ってきた分子・分母による正確な計算をそのまま拡張
    （浮動小数点数へ変換しない）。約分・整数化（分母が1になる場合は整数として表示）・仮分数の
    そのままの表示も、既存の分数機構をそのまま再利用
  - 「もとにする量の何倍が比べる量」という数量関係を `quantityRelation.type:
    "fraction-multiplicative-comparison"` として、「単位数×1単位あたりの量＝全体量」という数量関係を
    `quantityRelation.type: "fraction-unit-rate"` として表現し、小数倍・速さ・割合・単位量あたりと
    同じ枠組みを再利用
  - 5年1〜3学期の復習内容と6年1学期の新出内容を同数（新内容:復習=1:1）で出題（運用開始後に変更。
    以前は4年生1〜3学期の内容も復習に含めていたが、4年生の内容は出題しないよう変更した）
  - 新内容側は8カテゴリに均等に近い頻度で配分（ラウンドロビン、8カテゴリ以下なので出題数の範囲内では重複しない）
  - 復習内容は5-1/5-2/5-3から偏りなく選ばれる
  - 同じ問題文・同じ式が1回のゲーム内で繰り返し出題されないようにする重複回避
  - ハイスコアは出題範囲＋レベルの組み合わせごとに保存（6-1にも独立したハイスコア枠がある）
  - 40種類の新規テンプレート（分数×整数・分数×分数・分数÷整数・整数÷分数・分数÷分数・
    分数倍・比べる量・分数倍・もとの量・単位量あたり（分数）、各5種類）
  - トレーニングモードの8新規カテゴリにも対応（`fraction-times-integer` `fraction-times-fraction`
    `fraction-divided-by-integer` `integer-divided-by-fraction` `fraction-divided-by-fraction`
    `fraction-multiplier-compared-amount` `fraction-multiplier-base-amount` `fraction-unit-rate`）
- **小学6年生・2学期（第11段階、正式モード、`gradeTerm: "6-2"`）**
  - 分数の速さ・分数の道のり・分数の時間（分・時間の単位換算を含む2段階問題。それぞれ2つの解法ルートに対応）
  - 分数割合・比べる量（もとにする量・分数の割合から比べる量を求める）・分数割合・割合
    （比べる量・もとにする量から分数の割合を求める。`resultType:"fraction"` により必ず分数で表示）・
    分数割合・もとにする量（比べる量・分数の割合からもとにする量を求める）
  - 比を使った数量（比の一方の項に対応する量から、もう一方の項に対応する量を求める2段階問題。
    標準ルートに加えて「未知の比の項÷既知の比の項＝何倍か」ルートにも対応。後者は運用開始後に追加）
  - 比例配分（合計量を比で配分する3段階問題。「合計÷比の和×比の項」ルートに加えて「対象の比の項
    ÷比の和＝何倍か→合計×何倍か」ルートにも対応（後者は運用開始後に追加）。3段階すべてを答える
    必要があり、2段階のショートカット計算は正解ルートとして登録していない）
  - 複数段階問題エンジン（`js/multi-step-engine.js`）を、これまでの「ちょうど2つの式」固定から
    **1〜3個の式**に汎用化（既存の1段階・2段階問題の挙動は変更なし）
  - 式には使わず、問題文・履歴・デバッグ表示にのみ使う内部データ型として**比**
    （`{type:"ratio", antecedent, consequent}`、表示は`5：3`）を新設。カード・解答欄には登場しない
  - 「もとにする量の何倍が比べる量」（分数倍・割合）と同じ `quantityRelation` の枠組みを、
    分数割合（`type:"fraction-rate"`）にも拡張。速さの単位換算・比を使った数量・比例配分は、
    既知の変数がどのキーになるかが「求めるもの」によって変わる非対称な構造のため、
    `quantityRelation` の汎用チェックではなく専用の検証関数を用意
  - 5年1〜3学期＋6年1学期の復習内容と6年2学期の新出内容を同数（新内容:復習=1:1）で出題
    （運用開始後に変更。以前は4年生1〜3学期の内容も復習に含めていたが、4年生の内容は出題しない
    よう変更した）
  - 新内容側は8カテゴリに均等に近い頻度で配分（ラウンドロビン、8カテゴリ以下なので出題数の範囲内では重複しない）
  - 復習内容は5-1/5-2/5-3/6-1から偏りなく選ばれる
  - 同じ問題文・同じ式が1回のゲーム内で繰り返し出題されないようにする重複回避
  - ハイスコアは出題範囲＋レベルの組み合わせごとに保存（6-2にも独立したハイスコア枠がある）
  - 40種類の新規テンプレート（分数の速さ・分数の道のり・分数の時間・分数割合（比べる量/割合/もとにする量）・
    比を使った数量・比例配分、各5種類）
  - トレーニングモードの8新規カテゴリにも対応（`fraction-speed-find-speed` `fraction-speed-find-distance`
    `fraction-speed-find-time` `fraction-rate-compared-amount` `fraction-rate-rate`
    `fraction-rate-base-amount` `ratio-application` `proportional-allocation`。速さ・比を使った数量・
    比例配分は複数段階問題としてトレーニングでも出題される）
- **小学6年生・3学期（第12段階、正式モード、`gradeTerm: "6-3"`）**
  - 比例・対応する量（既知の対応関係から比例定数を求め、別の対応する量を計算する2段階問題。
    「1つ分の量を求める」「比例式に相当する計算」「後項÷前項で何倍かを求める」
    「前項÷後項の倍率で割る」の4つの正解ルートに対応。3つ目・4つ目のルートは運用開始後に追加）
  - 反比例・対応する量（既知の対応関係から一定の積を求め、別の対応する量を計算する2段階問題。
    標準ルートに加えて「増えた倍率で割る」「減る倍率を掛ける」の2ルートにも対応。
    後者2つは運用開始後に追加）
  - 縮尺・実際の長さ（縮尺と地図上の長さから、実際の長さ（km/m）を求める2段階問題）
  - 縮尺・地図上の長さ（縮尺と実際の長さから、地図上の長さ（cm）を求める2段階問題）
  - 比例定数・反比例の一定の積は、独立したカテゴリとしては追加せず、式1で児童が求める
    中間結果として扱う（問題文には一切表示しない。`hiddenIntermediateKeys` で検証する）
  - 式には使わず、問題文・履歴・デバッグ表示にのみ使う内部データ型として**縮尺**
    （`{type:"scale", numerator:1, denominator}`、表示は`1：25,000`）を新設
  - 長さの単位変換（mm・cm・m・km）を専用のユーティリティ（`js/unit-utils.js`）として追加。
    内部ではmmへの倍率（10の累乗）で管理し、浮動小数点誤差を出さない
  - 比例・反比例の一部のテンプレートで、対応関係を表す**関係表**（HTMLの`table`要素、見出しに`th`）
    を表示（`relationTable`。児童が求める値のセルは「？」として表示し、答えを漏らさない）
  - 6年3学期モードだけは、新内容50%・復習50%の既存方式ではなく、**グループA（5年1〜3学期の復習）・
    グループB（6年1〜2学期の復習）・グループC（6年3学期の新内容）の3グループを長期的に約1:1:1にする
    専用の出題プラン**（`planQuestionSequenceThreeGroup()`）を使用。小学4年生の内容は出題対象に含めない
  - 3グループへ均等配分できない端数（余り）は、ゲームを1回開始するたびにローテーションする
    グループが受け取る（`js/storage.js`に永続化。毎回同じグループばかりに偏らない）
  - グループA・グループBの内部は、それぞれ「学期を選ぶ→カテゴリを選ぶ」の2段階ラウンドロビンで、
    特定の学期・カテゴリに偏らないようにする
  - グループCの内部は、4カテゴリのラウンドロビンで、未選択カテゴリを優先する
  - 24種類の新規テンプレート（比例・対応する量・反比例・対応する量・縮尺・実際の長さ・
    縮尺・地図上の長さ、各6種類。「縮尺を求める」カテゴリ・6種類は運用開始後に削除した）
  - トレーニングモードの4新規カテゴリにも対応（`proportion-corresponding-value`
    `inverse-proportion-corresponding-value` `scale-find-actual-length` `scale-find-map-length`。
    比例・比例定数、反比例・一定の積という独立カテゴリは追加していない）
- **第3のモード「総復習」**（運用開始後に追加。「文章題バトル」「トレーニング」に続く3つ目の
  モードとして、タイトル画面のモード選択ボタンの右に追加した）
  - モード選択ボタンは3つになったが、「文章題バトル」ボタンだけ他の2つより横幅を広くしている
    （`.mode-select` の `grid-template-columns: 1.4fr 1fr 1fr`）
  - アプリタイトル直下にあった説明文（`.app-subtitle`）は、モード選択ボタンの下へ移動し、
    選んでいるモードによって文言が変わるようにした（文章題バトル「式をつくって エネミーを
    たおそう！」／トレーニング「せいげん時間なし、問題パターンをえらんで練習！」／
    総復習「じっくり考えて、全パターンの問題に正解しよう！」）
  - 総復習を選ぶと、サブメニューとして「4年のまとめ」「5年のまとめ」「6年のまとめ」
    「小学校のまとめ」の4つのボタンが表示される。いずれかをタップすると、トレーニングと
    同じ仕組みの確認ダイアログが開き、「○年のまとめを はじめますか？」（1行目）
    「全部で○問です。」（2行目）の2行のテキストと「スタート」「もどる」ボタンが表示される
    （運用開始後に変更。以前は「○年のまとめを はじめますか？ 全○問」の1行だった）
  - 総復習は、**選んだスコープに属するすべてのカテゴリから、ちょうど1問ずつをランダムな順番で
    出題する**モード。「4年のまとめ」は4年1〜3学期の13カテゴリから13問、「5年のまとめ」は
    5年1〜3学期の17カテゴリから17問、「6年のまとめ」は6年1〜3学期の20カテゴリから20問、
    「小学校のまとめ」は3学年ぶん・全50カテゴリから50問が出題される（すべて全問正解でクリア）。
    カテゴリ数（＝出題数）は `data/category-registry.js` から動的に導出するため、
    13/17/20/50 をどこにもハードコードしていない（今後カテゴリが増減しても自動的に追随する）
  - 「文章題バトル」モードをベースとしているため、敵・敵HP・ハートがあり、クリア／ゲームオーバー／
    リタイアの判定・演出（結果画面を含む）は通常バトルと同じ仕組みを再利用しているが、
    **スコア・ランクは無い**。スコア表示の位置には、代わりに「4年のまとめ　1問目／13問」の
    ようにモード名と問題数を表示する
  - **時間制限（解答時間ゲージ）も無い**。代わりに、ゲームスタート（1問目開始）からの経過時間
    （「けいか時間 ○分○秒」）を1秒おきに更新して表示する。時間制限ゲージの表示位置に
    そのまま重ねる形にしており、レイアウトは変えていない
  - ハートは3個。ただし「小学校のまとめ」だけは、3学年ぶんの全カテゴリを扱う難易度の高さを
    踏まえて1個にしている
  - 出現する敵は固定（ランダム抽選ではない）。「4年のまとめ」「5年のまとめ」「6年のまとめ」では
    「フォーミュラ仮面」、「小学校のまとめ」ではその上位種「フォーミュラ仮面エース」が登場する。
    この2体は `js/enemy-list.js` の `FORMULA_KAMEN`/`FORMULA_KAMEN_ACE` として、通常バトルの
    ランダム抽選プール（`ENEMY_LIST`）とは別に定義しており、通常バトル・タイトル画面の
    エネミープレビューには一切登場しない
  - モードの切り替え・振り分けは、他の2モードと同じく `js/app.js` の1箇所（`MODES` ディスパッチ
    テーブル）だけに集約しており、`js/review-mode.js` は `js/game.js`（通常バトル）・
    `js/training-mode.js`（トレーニング）のどちらとも深く参照し合わない、独立したモジュール
  - `?debug=true` のデバッグパネル・コンソール出力にも対応（総復習の進行状態専用の出力）
- **ヘルプ機能・エネミー図鑑**（運用開始後に追加）
  - タイトル画面左上に「？」ヘルプボタンを追加（右上の音声切り替えボタンと左右対称の位置。
    `aria-label="ヘルプを開く"`）。タイトル画面にしか存在せず、他画面には表示されない
  - 「？」を押すとヘルプメニューが開き、「このゲームについて」「エネミー図鑑」「もどる」の
    3つのボタンが縦に並ぶ。「もどる」でタイトル画面へ戻る
  - **「このゲームについて」画面**: ゲームの紹介・基本的な遊び方（①モードをえらぶ→②問題を
    読む→③カードで式をつくる→④「＝」ボタンで答える→⑤正解してこうげき→⑥エネミーをたおす、の
    6ステップ）・3モード（文章題バトル／トレーニング／総復習）それぞれの説明・操作のヒントを、
    見出しと本文に分けたカード形式で表示する。式を完成させただけでは自動的に正誤判定されず、
    必ず「＝」ボタンを押す必要があること、2〜3段階問題では式ごとに「＝」を押すことを明記している
  - **エネミー図鑑画面**: `js/enemy-list.js` の `getAllEnemiesForDex()`（通常バトルの
    `ENEMY_LIST`24種類＋総復習専用の`FORMULA_KAMEN`/`FORMULA_KAMEN_ACE`の合計26種類。図鑑専用の
    エネミー情報を別に持たず、単一の情報源からそのまま組み立てる）を、2列（画面がさらに狭い場合は
    1列）のカードグリッドで表示する。画面上部に「発見したエネミー　○／26」と表示し、
    総数はハードコードせず対象エネミー一覧の件数から動的に求める
  - **倒したエネミーの解放**: 通常バトル・総復習で**クリアが確定した瞬間だけ**、登場した
    エネミーを解放する（`js/storage.js` の `recordDefeatedEnemy()`。`js/game.js`・
    `js/review-mode.js` それぞれの `finishGame()`/`finishReview()` の `type === "clear"` 分岐
    にのみ追加しており、ゲームオーバー・リタイア・結果画面を開いただけでは解放しない。
    トレーニングは `js/storage.js` を一切参照しないため、完了しても図鑑は変化しない）
  - 解放済みのエネミーは絵文字・名前・キャラ紹介文（`introText`）を表示し、まだ倒していない
    エネミーは本来の絵文字・名前・紹介文を一切表示・出力せず、代わりに「❓」「？？？」と
    出現条件のヒントを表示する。ヒントは `js/enemy-list.js` の `getEnemyUnlockHint()` が、
    エネミーごとの出現条件（`minLevel` または `reviewScope`）から動的に生成するため、専用の
    文章を個別管理しておらず、実際の抽選条件（`pickRandomEnemy()`/`pickEnemyForScope()`）と
    食い違うことがない（例: `レベル3以上であらわれるかも？`、レベルMAX限定は
    `レベルMAXであらわれるかも？`、総復習の学年のまとめ専用は`学年の総復習であらわれるかも？`、
    小学校のまとめ専用は`小学校の総復習であらわれるかも？`）
  - **安定したエネミーID**（運用開始後に新設）: 図鑑の解放状態は、名前や絵文字ではなく、
    エネミーごとに一意な `id`（例: `chikurin`、`formula-kamen`）で管理する。名前・絵文字を
    変更しても解放状態は失われない
  - 未解放カードは、DOM上（`aria-label`・`title`・非表示テキスト等を含む）のどこにも本来の
    名前・紹介文を出力しない。カード全体に読み上げ用の `aria-label`（例:「まだ倒していない
    エネミー。レベル3以上であらわれるかもしれません。」）を付け、子要素は `aria-hidden` にして
    二重読み上げを防いでいる
  - 解放状態は `localStorage`（キー: `mathWordBattle_defeatedEnemyIds`）へJSON配列として保存し、
    ページを再読み込みしても維持される。保存データが不正なJSON・配列でない・存在しないエネミー
    IDを含む場合も、安全に無視するかフォールバックし、ゲーム本体やハイスコア等の他の保存データに
    影響しない。この機能を実装した時点では図鑑は未解放状態から始まり、過去のクリア実績を
    正確なエネミーIDの記録が無いまま推測で解放することはしない
  - フォーカス管理: 「？」を押すとヘルプメニューの見出しへ、「このゲームについて」/
    「エネミー図鑑」を押すとその画面のタイトルへ、詳細画面の「もどる」を押すとヘルプメニューで
    直前に押したボタンへ、ヘルプメニューの「もどる」を押すとタイトル画面の「？」ボタンへ、
    それぞれフォーカスを移す。ヘルプ関連画面が表示されているときだけ、Escキーで1つ前の画面へ
    戻れる（ゲーム中の操作には影響しない）
  - ヘルプは、問題・スコア・ハート等のゲーム進行を一切持たないタイトル画面の補助画面のため、
    `js/app.js` の `MODES` ディスパッチテーブル（バトル/トレーニング/総復習の切り替え）には
    追加していない。画面遷移・図鑑の描画はすべて `js/ui.js` の中だけで完結し、ヘルプ画面を
    開いても選択中のモード・学年・学期・レベル・トレーニングのカテゴリ・総復習のスコープ・
    効果音設定は一切リセットされない

## 15. 今回対応していない内容／今後追加予定の機能

### 今回のバージョンで対応していない分数・小数の内容

分数・小数データの正確性・既存機能の維持を優先するため、次の内容は今回意図的に対象外としています。

- 帯分数への変換（仮分数はそのまま表示します）
- 小数を使った複数段階文章題（複数段階問題は整数・百分率・分数のみ対応。「2つの数の平均」の
  たし算→わり算のような整数の組み合わせ、割引・増量の百分率、分数の速さ・比を使った数量・
  比例配分の分数は対応済みですが、小数倍・単位量あたりなど小数を含む段階を組み合わせた
  複数段階問題は今回も追加していません）
- 小数と分数が混在する計算・問題
- 比を簡単にする問題、比の値（比を分数で表す問題）、比例・反比例・縮尺（第11段階では比を
  「比を使った数量」「比例配分」の2カテゴリでのみ、内部データとして表示・利用しています）
- 「AとBのどちらが混んでいるか」を文字で答える問題（今回の解答形式は数式を作る形式のため）
- 3つ以上の値から平均を求める問題、複数グループの平均を合成する加重平均
- 小学6年生3学期の内容（**第12段階で比例・反比例・縮尺の「対応する量を求める」4カテゴリのみ
  追加**しました。拡大図・縮図の作図、円の面積、角柱・円柱の体積は引き続き対象外です）

### 今回のバージョンで対応していない速さ・割合の内容（第9段階）

速さ・百分率データの正確性・既存機能の維持を優先するため、次の内容は今回意図的に対象外としています。

- 速さの単位換算を含む問題（km↔m、時↔分↔秒の変換。km/時・m/分・m/秒の3種類の単位のみで、
  1つの問題内では必ず対応する単位だけを使う。**第11段階の分数の速さでは分↔時間の変換を追加**
  していますが、km↔mやm/分↔m/秒のような他の単位換算は引き続き対象外です）
- 平均の速さ、往復・追いつき・出会いなどの複数区間・複数移動体を扱う速さの問題
- 分数を使った速さ・割合の問題（**第11段階で分数の速さ・分数割合として追加**しました）
- 比・拡大図・縮図（**第11段階で「比を使った数量」「比例配分」の2カテゴリ、
  第12段階で縮尺（実際の長さ⇔地図上の長さ）の2カテゴリを追加**。
  比を簡単にする問題・比の値・拡大図/縮図の作図は引き続き対象外）
- 複合の割引（割引後にさらに割引、割引と増量の組み合わせ）、消費税込み価格の計算
- 3つ以上の式が必要な問題、括弧を使う式（**第11段階で複数段階問題エンジンを1〜3個の式に
  汎用化**しましたが、4つ以上の式・括弧を使う式は引き続き対象外）

### 今回のバージョンで対応していない分数の乗除・分数倍の内容（第10段階）

分数計算の正確性・既存機能の維持を優先するため、次の内容は今回意図的に対象外としています。

- 分数を使った速さ・分数を使った割合（分数と速さ・百分率が混在する問題。
  **第11段階で、分数を使った速さ・分数の割合として追加**しました。ただし分数と百分率が
  同じ問題の中で混在する問題や、分数と速さの単位換算以外の混在は引き続き対象外）
- 帯分数を使った入力・表示（今回も仮分数のまま扱います。既存方針の継続）
- 分数の乗除を含む2段階文章題（**第11段階で分数の速さ・比を使った数量として追加**）、
  複数の分数計算を連続して行う問題、括弧を使う式
- 3回以上の計算が必要な問題（**第11段階で比例配分として追加**。4回以上は引き続き対象外）
- 比・比の値・比例配分・比例・反比例・縮尺（**第11段階で比例配分・比を使った数量の2カテゴリ、
  第12段階で比例・反比例・縮尺の「対応する量を求める」4カテゴリを追加**。比を簡単にする問題・
  比の値・比例定数/一定の積を答えさせる独立カテゴリ・グラフ・拡大図/縮図の作図は引き続き対象外）
- 分数の単位換算を含む問題（**第11段階で分数の速さの分↔時間の変換のみ追加**。他の単位換算は対象外）

### 今回のバージョンで対応していない比・複数段階問題の内容（第11段階）

比・複数段階問題データの正確性・既存機能の維持を優先するため、次の内容は今回意図的に対象外としています。

- 比を簡単にする問題（例: `6：8` を `3：4` に簡単にする）
- 比の値（比を分数で表す問題、例: `3：4` → `3/4`）
- 小学6年生3学期の内容（**第12段階で比例・反比例・縮尺の「対応する量を求める」4カテゴリのみ
  追加**。比例式のグラフ、拡大図・縮図の作図、比例式を使わない縮図の問題は引き続き対象外）
- 解答欄・選択肢カードとしての「：」演算子（比は問題文・履歴・デバッグ表示にのみ登場し、
  式の一部としては一切使いません）
- 4つ以上の式が必要な問題、括弧を使う式（複数段階問題は1〜3個の式までの対応です）
- km↔m・m/分↔m/秒のような、分↔時間以外の単位換算を含む分数の問題

### 今回のバージョンで対応していない比例・反比例・縮尺の内容（第12段階）

比例・反比例・縮尺データの正確性・既存機能の維持を優先するため、次の内容は今回意図的に対象外としています。

- 比例・比例定数、反比例・一定の積を最終的な答えにする独立カテゴリ（比例定数・一定の積は、
  「対応する量を求める」問題の式1で児童が求める中間結果としてのみ扱い、問題文には表示しません）
- 座標平面へのグラフ描画、比例・反比例のグラフ
- 文字式の入力（`y＝ax`などの式を作る問題、比例式を入力する問題、未知数記号`x`を解答欄へ配置する機能）
- 面積・体積の縮尺、縮図・拡大図の作図
- mm↔cm↔m↔km以外の単位換算、長さ以外（重さ・かさ等）の単位換算
- 4つ以上の式が必要な問題、括弧を使う式
- 関係表を持たないテンプレートを含む一部のテンプレートでの関係表の省略（関係表は比例・反比例の
  一部のテンプレートだけが持ち、すべてのテンプレートに必須ではありません）

### 今後追加予定の機能

- 小学6年生3学期以降の問題データ（比例・反比例のグラフ、拡大図・縮図の作図、円の面積・
  角柱円柱の体積 など）
- 複数段階問題の独立した出題範囲としての公開（現在は4-2モードの1カテゴリ・
  4-3/5-1/5-2/5-3/6-1/6-2モードの復習内容と、開発版モード、6-2/6-3モードの新出内容の一部としてのみ）
- 4つ以上の式が必要な問題、括弧を使う式
- 比を簡単にする問題・比の値
- `difficulty` を使った出題フィルタ
- 効果音・演出のバリエーション追加

### トレーニングモード（第6段階）で今回対応していない内容

意図的に今回のスコープ外としています（[18章](#18-トレーニングモード第6段階)参照）。

- トレーニングの成績（完了数・1回で正解した数・ミス回数など）の永続保存
- 単元ごとの正答率統計、苦手単元の自動選択
- ヒント・解説表示
- ログイン・サーバー/クラウド同期

## 16. 動作確認用チェックリスト

### 1段階問題（既存機能の回帰確認）

- [ ] `python -m http.server` 等のローカルサーバー経由で `index.html` が表示できる
- [ ] コンソールにJavaScriptエラーが出ていない
- [ ] タイトル画面でレベル1〜3を選択できる
- [ ] タイトル画面の「学年」（4年／5年／6年）・「学期」（1学期／2学期／3学期）ボタンを
      それぞれ選ぶと組み合わさって出題範囲になる（例: 5年＋2学期→小学5年生・2学期の問題が出題される）
- [ ] 学年・学期の選択がページ再読み込み後も保持される
- [ ] スタート後、カウントダウン→バトル画面に遷移する
- [ ] 4種類（たし算・ひき算・かけ算・わり算）の問題が出題される
- [ ] わり算の答えが必ず割り切れる
- [ ] かけ算の交換法則が有効（順番を入れ替えても正解）
- [ ] ひき算・わり算は順序を区別する
- [ ] カードをタップして解答欄に配置できる（残りのカードの位置は動かない）
- [ ] カードをドラッグして解答欄に配置できる（スマートフォン実機でも操作できる）
- [ ] 演算記号カードは演算記号欄にしか置けない／数値カードは数値欄にしか置けない
- [ ] 解答欄が揃うと「＝」ボタンが光る
- [ ] 正解時にエフェクトが出て、タップで次の問題に進める
- [ ] 不正解・時間切れでハートが減り、同じ問題に再挑戦になる
- [ ] ハートが0になるとゲームオーバーになる
- [ ] 必要正解数に到達するとクリアになる（敵HPが0になり、点滅して消える）
- [ ] スコア・ランクが仕様通り計算される
- [ ] すばやく正解するほど加算スコアが大きくなり、時間をかけるほど小さくなる（タイムボーナス方式）
- [ ] 不正解・時間切れの後に正解しても、その問題のタイムボーナスは0として加算される（スコアが下がる）
- [ ] ハイスコアを更新したとき、結果画面の「今回のスコア」の数字の右に黄色い文字で
      「✨新記録！✨」が表示される（更新しなかったときは表示されない）
- [ ] バトル画面・タイトル画面のエネミープレビューに表示される名前が最新のエネミーリスト（24種類）と一致する
- [ ] 結果画面のタイトル（「クリア！」「ゲームオーバー！」等）のすぐ下に、その回のバトルに登場した
      エネミーの絵文字・名前と、専用のせりふが表示される
- [ ] エネミーコメントのせりふが、クリア時とゲームオーバー時で異なる
- [ ] リタイアしたときは、ゲームオーバー時と同じせりふが表示される
- [ ] トレーニングモードの結果画面には、エネミーコメントが表示されない（敵が出現しないため）
- [ ] 結果画面に問題履歴（不正解回数・時間切れ回数含む）が表示される
- [ ] リトライ・タイトルへ戻るが正しく動作する
- [ ] ハイスコアが保存され、再読み込み後も保持されている
- [ ] スマートフォンの縦画面で崩れずに表示・操作できる
- [ ] 1段階問題のプレイ中に、途中式表示や中間結果カードが表示されない

### 2段階問題（開発版モード）

- [ ] `?debug=true` を付けたときだけ、タイトル画面に「2段階問題・整数（開発版）」が表示される
- [ ] `?debug=true` を付けない場合、上記ボタンもデバッグパネルも一切表示されない
- [ ] 開発版モードを選ぶと、`data/multi-step-integer.js` の問題だけが出題される
- [ ] 問題文の近くに「式を2つ答えよう！」のような進行表示が出る（第12段階で「式 ○／○：」の
      進行番号表示を廃止したため、番号は表示されない）
- [ ] 1つ目の式に正解すると、小さめの演出（○）が出て、中間結果カードが選択肢に追加される
- [ ] 1つ目の式の正解では、敵HP・スコア・正解数・問題履歴の完了記録が変化しない
- [ ] 表示が「式 2／2」に切り替わり、2つ目の式用のカードが表示される
- [ ] 2つ目の式に正解すると、大きな「○」・敵HP減少・スコア加算・正解数+1・問題履歴の記録が行われる
- [ ] 1つ目・2つ目どちらの式で不正解/時間切れになっても、ハートが1つ減り、同じ式に再挑戦になる
      （2つ目の式でミスしても1つ目の式に戻らない）
- [ ] 途中式正解時はタイマーが全回復しない（一時停止→再開）。不正解・時間切れ時は全回復する
- [ ] 問題内で一度でもミスすると、最終正解時のスコア計算でタイムボーナスが0になる
- [ ] 複数解法問題で、どちらの解き方でも正解と判定される
- [ ] 結果画面の問題履歴に、式1・式2それぞれの内容が表示される
- [ ] リタイア・ゲームオーバー時、途中までしか解けなかった問題も履歴に残る
- [ ] `tools/question-validator.html` で2段階問題テンプレートがすべてOK（NGが無い）
- [ ] 各2段階テンプレートを20回生成してもエラーがない（検証ページで確認）

### 小学4年生・2学期（4-2モード）

- [ ] タイトル画面の出題範囲に「小学4年生・2学期」ボタンが表示され、選択できる（disabledではない）
- [ ] 4-2モードを選ぶと、小数のたし算・小数のひき算・大きな数・2けたでわるわり算・2段階文章題が出題される
- [ ] 小数の計算結果が正しい（例: `2.4 + 1.75 = 4.15` のように、`0.1+0.2` のような誤差が出ない）
- [ ] 小数の答えの末尾に不要な0が付かない（例: `4.10` ではなく `4.15`、`4.2` に対して `4.20` にならない）
- [ ] 大きな数が桁区切り（例: `125,000`）で問題文・カード・解答欄・結果表示・履歴すべてに一貫して表示される
- [ ] 2けたでわるわり算で、わる数が常に10〜99の範囲になっている
- [ ] 10問（デフォルト出題数）を通しで見たとき、新内容（2学期の新出内容）と復習内容（1学期の内容）が
      およそ半々になっている（`?debug=true` のデバッグパネルの「問題一覧の新内容/復習内容の数」で確認できる）
- [ ] 同じカテゴリの問題（復習内容全体も1つのまとまりとして）が3問以上連続しない
- [ ] `?debug=true` のデバッグパネルに、選択した出題範囲・新内容/復習内容・generatorType・
      表示用数値・小数点以下の桁数・カテゴリ構成が表示される
- [ ] 数値の大きいカード・小数のカードが、画面からはみ出したり、折り返して読みにくくなったりしない
      （スマートフォン縦画面でも確認）
- [ ] ページ全体が横スクロールしない
- [ ] ハイスコアが4-2＋レベルの組み合わせごとに独立して保存・表示される
- [ ] 一度タイトル画面で4-2を選んでページを再読み込みすると、4-2が選択された状態で復元される
- [ ] `tools/question-validator.html` で `gradeTerm` フィルターを `4-2` にすると、24件のテンプレートが
      すべてOK（NGが無い）と表示される
- [ ] `4-1`（既存の1学期モード）が、4-2追加後もこれまでと全く同じように動作する（回帰確認）

### 小学4年生・3学期（4-3モード）

- [ ] タイトル画面の出題範囲に「小学4年生・3学期」ボタンが表示され、選択できる（disabledではない）
- [ ] 4-3モードを選ぶと、小数×整数・小数÷整数・同分母分数のたし算・同分母分数のひき算・
      （復習として）整数の2段階文章題が出題される
- [ ] 小数×整数の答えが正しい（例: `1.8×6=10.8`）。順序を入れ替えても正解（`6×1.8`）
- [ ] 小数÷整数の答えが正しい（例: `7.2÷4=1.8`）。順序を入れ替えると不正解になる
- [ ] 小数÷整数の答えが必ず有限小数になり、あまりのあるわり算・循環小数が出題されない
- [ ] 同分母分数のたし算の答えが正しい（例: `2/7+3/7=5/7`）。順序を入れ替えても正解
- [ ] 同分母分数のひき算の答えが正しい（例: `7/8-3/8=4/8`→表示は約分後の`1/2`）。順序を入れ替えると不正解になる
- [ ] 分数の計算結果が正しく約分される（例: `2/4`→`1/2`、`4/4`→整数の`1`）
- [ ] 分数が問題文・選択肢カード・解答欄・■欄・正解演出・問題履歴のすべてで**縦型**（横線の上に分子・下に分母）に表示される
- [ ] 分子・分母が2けたの分数でも表示が崩れない
- [ ] 分数カードをタップ・ドラッグで解答欄に配置できる。演算記号欄には配置できない
- [ ] 分数カード・解答欄が上下で切れず、タップ領域が44px以上ある
- [ ] 10問（デフォルト出題数）を通しで見たとき、新内容（3学期の新出内容）と復習内容（1・2学期の内容）が
      およそ半々になっている（`?debug=true` のデバッグパネルで確認できる）
- [ ] 復習内容が1学期・2学期の両方から出題される（どちらか一方に偏らない）
- [ ] 同じカテゴリの問題（復習内容全体も1つのまとまりとして）が3問以上連続しない
- [ ] `?debug=true` のデバッグパネルに、値の種類・分数の分子分母・最大公約数・約分後の値・
      使用したgeneratorType・表示用HTML・分数カードの一意IDが表示される
- [ ] ページ全体が横スクロールしない。スマートフォン縦画面でも分数が切れずに表示される
- [ ] ハイスコアが4-3＋レベルの組み合わせごとに独立して保存・表示される
- [ ] 一度タイトル画面で4-3を選んでページを再読み込みすると、4-3が選択された状態で復元される
- [ ] `tools/question-validator.html` で `gradeTerm` フィルターを `4-3` にすると、24件のテンプレートが
      すべてOK（NGが無い）と表示される。「値の種類」フィルターで分数・小数それぞれ12件ずつ表示される
- [ ] `4-1`・`4-2`（既存モード）が、4-3追加後もこれまでと全く同じように動作する（回帰確認）

### 小学5年生・1学期（5-1モード、第7段階）

- [ ] タイトル画面の出題範囲に「5年1学期」ボタンが表示され、選択できる（disabledではない）
- [ ] 5-1モードを選ぶと、小数×小数・小数÷小数・小数倍・もとの量・（復習として）4年生1〜3学期の内容
      （整数の2段階文章題を含む）が出題される
- [ ] 小数×小数の答えが正しい（例: `2.4×3.5=8.4`）。順序を入れ替えても正解
- [ ] 小数÷小数の答えが正しい（例: `4.8÷1.2=4`）。順序を入れ替えると不正解になる
- [ ] 小数÷小数の答えが必ず有限小数になり、あまりのあるわり算・循環小数が出題されない
- [ ] 小数倍で、比較量を求める問題（基準量×何倍）が正しく判定される。順序を入れ替えても正解
- [ ] 小数倍で、何倍かを求める問題（比較量÷基準量）が正しく判定される。順序を入れ替えると不正解になる
- [ ] もとの量（比較量÷何倍＝基準量）が正しく判定される。順序を入れ替えると不正解になる
- [ ] 小数倍・もとの量の問題で、答えにあたる数値（基準量・比較量・何倍のいずれか）が選択肢カードに
      紛れ込んでいない（`getVisibleNumbers()` が正しく「見えている2つの数値」だけをカードにしている）
- [ ] 10問（デフォルト出題数）を通しで見たとき、新内容（5年1学期の新出内容）と復習内容（4年生1〜3学期の内容）が
      およそ半々になっている（`?debug=true` のデバッグパネルで確認できる）
- [ ] 新内容の4カテゴリ（小数×小数・小数÷小数・小数倍・もとの量）に極端な偏りがない
      （特にレベルMAXの新内容6問で、特定のカテゴリが0件のまま別のカテゴリに3件以上偏らない）
- [ ] 復習内容が4年生1〜3学期（整数の2段階文章題を含む）から偏りなく出題される
- [ ] 同じカテゴリの問題（復習内容全体も1つのまとまりとして）が3問以上連続しない
- [ ] レベルMAXでハート数が2個になっている（レベル5と同じ。5-1追加でこの仕様は変更していない）
- [ ] ページ全体が横スクロールしない。スマートフォン縦画面でも崩れずに表示される
- [ ] ハイスコアが5-1＋レベルの組み合わせごとに独立して保存・表示される
- [ ] 一度タイトル画面で5-1を選んでページを再読み込みすると、5-1が選択された状態で復元される
- [ ] `tools/question-validator.html` で `gradeTerm` フィルターを `5-1` にすると、32件のテンプレートが
      すべてOK（NGが無い）と表示される
- [ ] トレーニングモードの「がくねん・がっき」に「小学5年生・1学期」が表示され、4カテゴリ
      （小数×小数・小数÷小数・小数倍・もとの量）をそれぞれ選んで5問練習できる
- [ ] `4-1`・`4-2`・`4-3`（既存モード）が、5-1追加後もこれまでと全く同じように動作する（回帰確認）

### 小学5年生・2学期（5-2モード、第8段階）

- [ ] タイトル画面の出題範囲に「5年2学期」ボタンが表示され、選択できる（disabledではない）
- [ ] 5-2モードを選ぶと、異分母分数のたし算・ひき算・平均・単位量あたり・混み具合・
      （復習として）4年生1〜3学期・5年生1学期の内容が出題される
- [ ] 異分母分数のたし算の答えが正しい（例: `2/5+1/4=13/20`）。順序を入れ替えても正解
- [ ] 異分母分数のひき算の答えが正しい（例: `5/6-1/4=7/12`）。順序を入れ替えると不正解になる
- [ ] 異分母分数のひき算で、答えが負になる問題が出題されない
- [ ] 分数の計算結果が正しく約分される。分母が異なる分数でも正しく通分・計算される
- [ ] 平均の問題（合計・個数→平均）の答えが正しい（例: `35÷5=7`）
- [ ] 平均の問題（個数・平均→合計）の答えが正しい（例: `4×6=24`）。順序を入れ替えても正解
- [ ] 「2つの数の平均」（2段階問題）が、式1（たし算）→式2（2でわる）の順で正しく解ける
- [ ] 単位量あたりの問題（全体量・単位数→1単位あたり）の答えが正しい（例: `18÷2.5=7.2`）
- [ ] 単位量あたりの問題（1単位あたり・単位数→全体量）の答えが正しい（例: `150×4=600`）
- [ ] 単位量あたり・平均のわり算は順序を区別し、かけ算は順序を問わず正解になる
- [ ] 混み具合の問題で、1㎡あたりなどの人数・頭数を数値で求める問題が出題される
- [ ] 混み具合で「AとBのどちらが混んでいるか」を文字で答えさせる問題が出題されない
- [ ] 単位量あたり・平均・混み具合の答えが必ず有限小数または整数になり、循環小数が出題されない
- [ ] 10問（デフォルト出題数）を通しで見たとき、新内容（5年2学期の新出内容）と復習内容
      （4年生1〜3学期・5年生1学期の内容）が同数になっている（`?debug=true` のデバッグパネルで確認できる）
- [ ] 新内容の5カテゴリに極端な偏りがない（レベル5の新内容5問は5カテゴリ1問ずつ、
      レベルMAXの新内容6問は「+1カテゴリ」が毎回同じにならない）
- [ ] 復習内容が4年生1〜3学期・5年生1学期から偏りなく出題される
- [ ] 同じカテゴリの問題（復習内容全体も1つのまとまりとして）が3問以上連続しない
- [ ] レベルMAXでハート数が2個、問題数が12問、初期制限時間が20秒になっている（5-2追加でこの仕様は変更していない）
- [ ] ページ全体が横スクロールしない。スマートフォン縦画面でも崩れずに表示される
- [ ] ハイスコアが5-2＋レベルの組み合わせごとに独立して保存・表示される
- [ ] 一度タイトル画面で5-2を選んでページを再読み込みすると、5-2が選択された状態で復元される
- [ ] `tools/question-validator.html` で `gradeTerm` フィルターを `5-2` にすると、30件のテンプレートが
      すべてOK（NGが無い）と表示される
- [ ] トレーニングモードの「がくねん・がっき」に「小学5年生・2学期」が表示され、5カテゴリ
      （異分母分数のたし算・ひき算・平均・単位量あたり・混み具合）をそれぞれ選んで5問練習できる
- [ ] `4-1`・`4-2`・`4-3`・`5-1`（既存モード）が、5-2追加後もこれまでと全く同じように動作する（回帰確認）

### 小学5年生・3学期（5-3モード、第9段階）

- [ ] タイトル画面の出題範囲に「5年3学期」ボタンが表示され、選択できる（disabledではない）
- [ ] 5-3モードを選ぶと、速さ・道のり・時間・割合（比べる量/百分率/もとにする量）・割引・増量・
      （復習として）4年生1〜3学期・5年生1〜2学期の内容が出題される
- [ ] 速さの問題（道のり・時間→速さ）の答えが正しい（例: `30km÷1時間=時速30km`）
- [ ] 道のりの問題（速さ・時間→道のり）の答えが正しい（例: `分速250m×4分=1000m`）。順序を入れ替えても正解
- [ ] 時間の問題（道のり・速さ→時間）の答えが正しい（例: `1320m÷分速220m=6分`）
- [ ] 速さ・道のり・時間の問題が、km/時・m/分・m/秒のいずれか1種類の単位だけで完結し、
      単位換算（km↔m、時↔分↔秒）を必要とする問題が出題されない
- [ ] 割合・比べる量の問題（もとにする量・割合→比べる量）の答えが正しい（問題文は「1100円の50%」の
      ように`%`表記だが、カード・解答欄・正解式は`1100×0.5=550`のように小数で表示される）。
      順序を入れ替えても正解
- [ ] 割合・百分率の問題（比べる量・もとにする量→割合）は、カード・解答欄・正解式は小数（例: `5÷20=0.25`）
      だが、正解時・問題履歴の答え表示だけは「小数→百分率」の形式（例: `0.25→25%`）になる
      （問題文が「何%ですか」と百分率での回答を求めるため）
- [ ] 割合・もとにする量の問題（比べる量・割合→もとにする量）の答えが正しい（カード・解答欄は
      `2640÷0.6=4400` のように小数で表示される）
- [ ] 割引の問題が2段階問題として出題され、「式を2つ答えよう！」の進行表示が出る
- [ ] 割引の1つ目の式（`100%－割引率＝支払う割合`）と、別解（`もとの値段×割引率＝値引き額`）の
      どちらの解き方でも1つ目の式が正解と判定される（カード・解答欄・中間結果は
      `1-0.2=0.8` のように小数で表示される）
- [ ] 割引の2つ目の式に正解すると、正しい代金が計算・表示される（例: `2900×0.75=2175`。
      最終的な代金はもともと小数ではなく通常の金額のため、百分率への変換表示は行わない）
- [ ] 増量の問題が2段階問題として出題され、割引と同様に2つの解法ルートのどちらでも正解になる
- [ ] 割引・増量のカード・解答欄・中間結果カードに小数（`%`無し）が正しく表示され、
      `[object Object]` のような表示崩れが出ない
- [ ] 百分率が関わるカードが、数値カードと同様にタップ・ドラッグで解答欄に配置できる
- [ ] 問題文中の「20%が…」「20%引き」のような自然な言い回しは、これまでどおり`%`表記のまま
      表示される（カード・解答欄だけが小数表記に変わり、問題文には影響しない）
- [ ] 10問（デフォルト出題数）を通しで見たとき、新内容（5年3学期の新出内容）と復習内容
      （4年生1〜3学期・5年生1〜2学期の内容）が同数になっている（`?debug=true` のデバッグパネルで確認できる）
- [ ] 新内容の8カテゴリに極端な偏りがない（レベル5の新内容5問・レベルMAXの新内容6問が、
      毎回同じカテゴリの組み合わせにならない）
- [ ] 復習内容が4年生1〜3学期・5年生1〜2学期から偏りなく出題される
- [ ] 同じカテゴリの問題（復習内容全体も1つのまとまりとして）が3問以上連続しない
- [ ] レベルMAXでハート数が2個、問題数が12問、初期制限時間が20秒になっている（5-3追加でこの仕様は変更していない）
- [ ] ページ全体が横スクロールしない。スマートフォン縦画面でも崩れずに表示される
- [ ] ハイスコアが5-3＋レベルの組み合わせごとに独立して保存・表示される
- [ ] 一度タイトル画面で5-3を選んでページを再読み込みすると、5-3が選択された状態で復元される
- [ ] `tools/question-validator.html` で `gradeTerm` フィルターを `5-3` にすると、40件のテンプレートが
      すべてOK（NGが無い）と表示される
- [ ] トレーニングモードの「がくねん・がっき」に「小学5年生・3学期」が表示され、8カテゴリ
      （速さ・道のり・時間・割合の3種類・割引・増量）をそれぞれ選んで5問練習できる
      （割引・増量は2段階問題としてトレーニングでも出題される）
- [ ] `4-1`・`4-2`・`4-3`・`5-1`・`5-2`（既存モード）が、5-3追加後もこれまでと全く同じように動作する（回帰確認）

### 小学6年生・1学期（6-1モード、第10段階）

- [ ] タイトル画面の出題範囲に「6年1学期」ボタンが表示され、選択できる（disabledではない）
- [ ] 6-1モードを選ぶと、分数×整数・分数×分数・分数÷整数・整数÷分数・分数÷分数・
      分数倍・比べる量・分数倍・もとの量・（復習として）5年生1〜3学期の内容が出題される。
      **小学4年生の内容は出題されない**（運用開始後に変更）
- [ ] 分数×整数の答えが正しい（例: `3/4×6=9/2`）。順序を入れ替えても正解（例: `6×3/4=9/2`）
- [ ] 分数×分数の答えが正しい（例: `2/3×3/4=1/2`）。順序を入れ替えても正解
- [ ] 分数÷整数の答えが正しい（例: `3/4÷3=1/4`）。順序を入れ替えると不正解になる
- [ ] 整数÷分数の答えが正しい（例: `3÷3/4=4`、逆数をかける方式で正確に計算される）。
      順序を入れ替えると不正解になる
- [ ] 分数÷分数の答えが正しい（例: `3/4÷3/8=2`、`5/6÷2/9=15/4`）。順序を入れ替えると不正解になる
- [ ] 分数の乗除の計算結果がすべて正しく約分される（例: `2/3×3/4=6/12` ではなく `1/2`）
- [ ] 約分の結果、分母が1になる場合は整数として表示される（縦型分数ではなく通常の数字。
      例: `3/4×8=6`。カード・解答欄・■欄・履歴のすべてで一貫する）
- [ ] 仮分数がそのまま縦型で表示される（帯分数に変換されない）
- [ ] 0でわる問題（分数÷0、整数÷0/n、分数÷0/n）が生成・出題されない
- [ ] 分数倍・比べる量の答えが正しい（例: `6×2/3=4`）。順序を入れ替えても正解
- [ ] 分数倍・もとの量の答えが正しい（例: `4÷2/3=6`）。順序を入れ替えると不正解になる
- [ ] 単位量あたり（分数）の答えが正しい（例: `9/10÷3/4=6/5`）。
      順序を入れ替えると不正解になる
- [ ] 10問（デフォルト出題数）を通しで見たとき、新内容（6年1学期の新出内容）と復習内容
      （5年生1〜3学期の内容）が同数になっている（`?debug=true` のデバッグパネルで確認できる）
- [ ] 新内容の8カテゴリに極端な偏りがない（レベル5の新内容5問・レベルMAXの新内容6問が、
      毎回同じカテゴリの組み合わせにならない）
- [ ] 復習内容が5年生1〜3学期から偏りなく出題される（4年生1〜3学期の内容は出題されない）
- [ ] 同じカテゴリの問題（復習内容全体も1つのまとまりとして）が3問以上連続しない
- [ ] レベルMAXでハート数が2個、問題数が12問、初期制限時間が20秒になっている（6-1追加でこの仕様は変更していない）
- [ ] ページ全体が横スクロールしない。スマートフォン縦画面でも崩れずに表示される
- [ ] ハイスコアが6-1＋レベルの組み合わせごとに独立して保存・表示される
- [ ] 一度タイトル画面で6-1を選んでページを再読み込みすると、6-1が選択された状態で復元される
- [ ] `tools/question-validator.html` で `gradeTerm` フィルターを `6-1` にすると、40件のテンプレートが
      すべてOK（NGが無い）と表示される
- [ ] トレーニングモードの「がくねん・がっき」に「小学6年生・1学期」が表示され、8カテゴリ
      （分数×整数・分数×分数・分数÷整数・整数÷分数・分数÷分数・分数倍・比べる量・分数倍・もとの量・
      単位量あたり（分数））をそれぞれ選んで5問練習できる
- [ ] `4-1`・`4-2`・`4-3`・`5-1`・`5-2`・`5-3`（既存モード）が、6-1追加後もこれまでと全く同じように動作する（回帰確認）

### 小学6年生・2学期（6-2モード、第11段階）

- [ ] タイトル画面の出題範囲に「6年2学期」ボタンが表示され、選択できる（disabledではない）
- [ ] 6-2モードを選ぶと、分数の速さ・分数の道のり・分数の時間・分数割合・比べる量・分数割合・割合・
      分数割合・もとにする量・比を使った数量・比例配分・（復習として）5年生1〜3学期・
      6年生1学期の内容が出題される。**小学4年生の内容は出題されない**（運用開始後に変更）
- [ ] 分数の速さで、1つ目の式のときに「式を2つ答えよう！」の進行表示が出る（3段階問題ではないことを確認）
- [ ] 分数の速さ（例: `20分＝1/3時間、5÷(1/3)=15km/時`）で、分→時間の変換ルートと、1分あたりの
      速さを求めてから60倍するルートの**どちらで解いても正解**と判定される
- [ ] 分数の道のり（例: `5÷60=1/12時間、72×1/12=6km`、または `72÷60=6/5km/分、6/5×5=6km`）で、
      2つのルートのどちらでも正解と判定される
- [ ] 分数の時間（例: `2÷(24/5)=5/12時間、5/12×60=25分`、または `24/5÷60=2/25km/分、2÷(2/25)=25分`）で、
      2つのルートのどちらでも正解と判定される
- [ ] 分数の速さ・道のり・時間のいずれも、途中式の中間結果が分数のまま正しく表示される
      （`[object Object]` にならない。60分＝1時間のような整数になる場合は整数として表示される）
- [ ] 分数割合・比べる量の答えが正しい（例: `もとにする量12×分数の割合5/6=10`）。順序を入れ替えても正解
- [ ] 分数割合・割合の答えが**必ず分数で表示**される（例: `12÷20` は `0.6` ではなく `3/5` と表示される。
      `resultType:"fraction"` の強制変換が効いていることを確認）。順序を入れ替えると不正解になる
- [ ] 分数割合・もとにする量の答えが正しい（例: `比べる量10÷分数の割合5/6=12`）。順序を入れ替えると不正解になる
- [ ] 比を使った数量で、比の表示が「5：3」のように全角コロンで、改行されずに1つの単語として表示される
- [ ] 比を使った数量が2段階問題として出題され、1つ目の式のときに「式を2つ答えよう！」の進行表示が出る
- [ ] 比を使った数量で、標準ルートに加えて「未知の比の項÷既知の比の項＝何倍か」ルート
      （例: 比4：3、ねこ15頭のとき犬は？で `4÷3=4/3→15×4/3=20`。割り切れない場合は分数のまま扱う）
      でも正解と判定される
- [ ] 比例配分が3段階問題として出題され、「式を3つ答えよう！」→「（式1）の続きを答えよう」→
      「（式1） → （式2）の続きを答えよう」（1つ目・2つ目の式が両方表示される）と進行表示が
      切り替わる（第12段階で、直前の1つの式だけでなく、それまでの全ての式を表示するよう変更）
- [ ] 比例配分の3段階目でミス・時間切れになっても、1段階目・2段階目まで正解した状態は保たれ、
      3段階目だけ再挑戦になる（1段階目に戻らない）
- [ ] 比例配分で、2段階のショートカット計算（例: 合計÷比の項×比の他方の項）を答えても
      正解と判定**されない**（登録されている3段階の正解ルート以外は不正解として扱われる）
- [ ] 比例配分で、標準ルートに加えて「対象の比の項÷比の和＝何倍か→合計×何倍か」ルート
      （例: リボン28cm・比4：3・姉の分で `4+3=7→4÷7=4/7→28×4/7=16`。割り切れない場合は
      分数のまま扱う）でも正解と判定される
- [ ] 比例配分・比を使った数量のどちらも、中間結果カードが正しいタイミングで選択肢に追加される
      （比例配分は1段階目・2段階目の正解後にそれぞれ1枚ずつ、合計2枚の中間結果カードが使える）
- [ ] 選択肢カードの枚数が、どのテンプレートでもダミーを含めて8枚以内になっている
- [ ] 10問（デフォルト出題数）を通しで見たとき、新内容（6年2学期の新出内容）と復習内容
      （5年生1〜3学期・6年生1学期の内容）が同数になっている
      （`?debug=true` のデバッグパネルで確認できる）
- [ ] 新内容の8カテゴリに極端な偏りがない（レベル5の新内容5問・レベルMAXの新内容6問が、
      毎回同じカテゴリの組み合わせにならない）
- [ ] 復習内容が5年生1〜3学期・6年生1学期から偏りなく出題される（4年生1〜3学期の内容は出題されない）
- [ ] 同じカテゴリの問題（復習内容全体も1つのまとまりとして）が3問以上連続しない
- [ ] レベルMAXでハート数が2個、問題数が12問、初期制限時間が20秒になっている（6-2追加でこの仕様は変更していない）
- [ ] ページ全体が横スクロールしない。スマートフォン縦画面でも「5：3」のような比の表示が
      途中で折り返さずに表示される
- [ ] ハイスコアが6-2＋レベルの組み合わせごとに独立して保存・表示される（`highScore_6-2_level1`〜
      `highScore_6-2_level6`。他の学期のハイスコアキーを上書きしない）
- [ ] 一度タイトル画面で6-2を選んでページを再読み込みすると、6-2が選択された状態で復元される
- [ ] `tools/question-validator.html` で `gradeTerm` フィルターを `6-2` にすると、40件のテンプレートが
      すべてOK（NGが無い）と表示される。「段階数」フィルターで1段階0件・2段階30件・3段階10件になる
      （速さ3カテゴリ×5＋比を使った数量5＝2段階25件+分数割合3カテゴリ×5＝1段階15件+比例配分5＝3段階5件。
      実際の内訳はテンプレート定義を参照）
- [ ] `tools/question-validator.html` の各テンプレートの例に、登録されているすべての解法ルートが表示される
      （速さ3カテゴリはルートが2本ずつ表示される）
- [ ] トレーニングモードの「がくねん・がっき」に「小学6年生・2学期」が表示され、8カテゴリ
      （分数の速さ・分数の道のり・分数の時間・分数割合・比べる量・分数割合・割合・分数割合・もとにする量・
      比を使った数量・比例配分）をそれぞれ選んで5問練習できる。速さ・比を使った数量・比例配分は
      トレーニングモードでも複数段階（2〜3段階）の進行・中間結果カードが正しく動作する
- [ ] `4-1`・`4-2`・`4-3`・`5-1`・`5-2`・`5-3`・`6-1`（既存モード）が、6-2追加後もこれまでと
      全く同じように動作する（回帰確認）。特に6-1の分数×分数・分数倍の1段階問題が、複数段階問題エンジンの
      1〜3段階汎用化の影響を受けていないことを確認する

### 小学6年生・3学期（6-3モード、第12段階）

- [ ] タイトル画面の出題範囲に「6年3学期」ボタンが表示され、選択できる（disabledではない）
- [ ] 6-3モードを選ぶと、比例・対応する量・反比例・対応する量・縮尺・実際の長さ・縮尺・地図上の長さ・
      （復習として）5年生1〜3学期・6年生1〜2学期の内容が出題される。**小学4年生の内容は
      出題されない**
- [ ] 比例・対応する量の答えが正しい（例: `600÷4=150→150×7=1050`）。「1つ分の量を求める」ルート・
      「比例式に相当する計算」ルート（`600×7=4200→4200÷4=1050`）・「後項÷前項で何倍かを求める」ルート
      （`7÷4=7/4→600×7/4=1050`。割り切れない場合は分数のまま扱う）・「前項÷後項の倍率で割る」ルート
      （`4÷7=4/7→600÷(4/7)=1050`。同じく割り切れない場合は分数のまま扱う）の**いずれで答えても正解**と判定される
- [ ] 反比例・対応する量の答えが正しい（例: `4×12=48→48÷6=8`）。式1のかけ算は順序を入れ替えても正解
      （`12×4`でも正解）と判定される
- [ ] 反比例・対応する量で、「増えた倍率で割る」ルート（例: 6人・72日、9人では？で
      `9÷6=3/2→72÷3/2=48`）・「減る倍率を掛ける」ルート（同じ例で `6÷9=2/3→72×2/3=48`）でも
      正解と判定される（どちらも割り切れない場合は分数のまま扱う）
- [ ] 反比例・対応する量の問題文に、一定の積（上の例では`48`）が**直接表示されていない**
      （長方形の面積、仕事全体の人日など、一定の積に相当する数値が問題文に無いことを確認する）
- [ ] 比例・対応する量の問題文に、比例定数が**直接表示されていない**
- [ ] 比例定数・一定の積そのものを答えさせる独立カテゴリ（`proportion-constant`
      `inverse-proportion-constant`）が存在しない
- [ ] 一部の比例・反比例の問題で、関係表（`table`要素、見出しに`th`）が表示される。関係表の
      未知のセルには「？」が表示され、答えの数値が表示されない
- [ ] 縮尺・実際の長さの答えが正しい（例: 縮尺1：25,000、地図上4cm→実際の長さ`4×25000=100000cm=1km`）
- [ ] 縮尺・地図上の長さの答えが正しい（例: 縮尺1：50,000、実際の長さ2km→`2km=200000cm`、
      `200000÷50000=4cm`）
- [ ] 縮尺の表示（`1：25,000`）が改行されず、3桁区切りカンマ付きで表示される
- [ ] 長さの単位変換（mm・cm・m・km）で浮動小数点誤差が出ない（例: `0.1km`のような値が
      `99999.99999cm`のような誤差付きで表示されない）
- [ ] 10問（デフォルト出題数）を通しで見たとき、グループA（5年生1〜3学期の復習）・グループB
      （6年生1〜2学期の復習）・グループC（6年生3学期の新出内容）が、長期的（複数回プレイ）で
      およそ1：1：1になっている（`?debug=true` のデバッグパネルの `questionGroupCounts` で確認できる）
- [ ] レベル3（6問）・レベルMAX（12問）では、1回のプレイでグループA・B・Cがちょうど2問ずつ・
      4問ずつになっている
- [ ] レベル1・2・4・5（端数が出るレベル）では、複数回プレイしたときに余りを受け取るグループが
      ローテーションし、毎回同じグループばかりに偏らない
- [ ] グループCの新内容4カテゴリに極端な偏りがない（レベルMAXの新内容4問で、未選択カテゴリが
      優先して選ばれ、4カテゴリすべてが重複なく選ばれる）
- [ ] 復習内容（グループA・B）が、5年生1〜3学期・6年生1〜2学期のそれぞれの学期・カテゴリから
      偏りなく出題される
- [ ] 同じカテゴリの問題（同じグループ全体も1つのまとまりとして）が3問以上連続しない
- [ ] レベルMAXでハート数が2個、問題数が12問、初期制限時間が20秒になっている（6-3追加でこの仕様は変更していない）
- [ ] ページ全体が横スクロールしない。スマートフォン縦画面でも関係表・縮尺の表示が崩れない
      （関係表は横にはみ出す場合、表だけがスクロールする）
- [ ] ハイスコアが6-3＋レベルの組み合わせごとに独立して保存・表示される（`highScore_6-3_level1`〜
      `highScore_6-3_level6`。他の学期のハイスコアキーを上書きしない）
- [ ] 一度タイトル画面で6-3を選んでページを再読み込みすると、6-3が選択された状態で復元される
- [ ] `tools/question-validator.html` で `gradeTerm` フィルターを `6-3` にすると、24件のテンプレートが
      すべてOK（NGが無い）と表示される
- [ ] `tools/question-validator.html` の関係表を持つテンプレートの例に、関係表が正しく表示される
- [ ] トレーニングモードの「がくねん・がっき」に「小学6年生・3学期」が表示され、4カテゴリ
      （比例・対応する量・反比例・対応する量・縮尺・実際の長さ・縮尺・地図上の長さ）を
      それぞれ選んで5問練習できる。比例・比例定数、反比例・一定の積は表示されない
- [ ] `4-1`・`4-2`・`4-3`・`5-1`・`5-2`・`5-3`・`6-1`・`6-2`（既存モード）が、6-3追加後もこれまでと
      全く同じように動作する（回帰確認）

### 総復習モード（運用開始後に追加）

- [ ] タイトル画面のモード選択ボタンが「文章題バトル」「トレーニング」「総復習」の3つになっており、
      「文章題バトル」ボタンだけ他の2つより横幅が広い
- [ ] モード選択ボタンの下（アプリタイトルの下ではない）にサブタイトルが表示され、選んだモードに
      応じて文言が変わる（文章題バトル／トレーニング／総復習でそれぞれ異なるテキスト）
- [ ] 総復習を選ぶと、「4年のまとめ」「5年のまとめ」「6年のまとめ」「小学校のまとめ」の
      4つのボタンが表示される
- [ ] いずれかのボタンをタップすると、確認ダイアログが開き「○年のまとめを はじめますか？」
      （1行目）「全部で○問です。」（2行目）が改行して表示される
      （4年＝13問、5年＝17問、6年＝20問、小学校＝50問）
- [ ] 確認ダイアログで「もどる」を押すとキャンセルでき、「スタート」を押すとカウントダウン→
      バトル画面に遷移する
- [ ] バトル画面のスコア表示の位置に、「4年のまとめ　1問目／13問」のようにモード名と問題数が
      表示される（スコア・ランクは表示されない）
- [ ] 敵・敵HPバー・ハート（4/5/6年のまとめは3個、小学校のまとめは1個）が表示される
- [ ] 時間制限（解答時間ゲージ）が表示されず、代わりに「けいか時間 ○分○秒」の経過時間表示が
      1秒おきに更新される（1問目が始まった瞬間からカウントが始まる）
- [ ] 「4年のまとめ」「5年のまとめ」「6年のまとめ」では「フォーミュラ仮面」、「小学校のまとめ」
      では「フォーミュラ仮面エース」が固定で登場する（この2体はランダム抽選の対象にはならず、
      通常バトルやタイトル画面のエネミープレビューには一切登場しない）
- [ ] 「4年のまとめ」で、4年1〜3学期の13カテゴリから重複なく1問ずつ、ランダムな順番で出題される
      （`?debug=true` のデバッグパネルで、生成された問題のテンプレートID・categoryIdを確認できる）
- [ ] 「5年のまとめ」「6年のまとめ」「小学校のまとめ」でも、それぞれ17／20／50カテゴリから
      重複なく1問ずつ出題される
- [ ] 不正解でハートが減り、同じ問題に再挑戦になる。ハートが0になるとゲームオーバーになる
- [ ] すべての問題に正解するとクリアになる（敵HPが0になり、点滅して消える）。一度もミスしなければ
      「ノーミスクリア！」になる
- [ ] リタイアボタンを押すと「総復習をやめますか？」の確認ダイアログが表示され、「やめる」で
      リタイアできる
- [ ] クリア／ゲームオーバー／リタイアいずれの場合も、結果画面のタイトルのすぐ下に敵の絵文字・
      名前・専用のせりふ（クリア時／ゲームオーバー時・リタイア時で異なる）が表示される
- [ ] 結果画面に「せいかい数」「モード」「けいか時間」が表示され、「出題はんい」「レベル」
      「今回のランク」「今回のスコア」「ハイスコア」は表示されない
- [ ] 結果画面の「もういちど」を押すと、同じスコープで新しい出題順で再挑戦できる
- [ ] 2段階問題（4年2学期の「2段階文章題」カテゴリなど）が総復習に含まれる場合も、進行表示
      （「式を2つ答えよう！」等）・中間結果カードが正しく動作する
- [ ] 文章題バトル・トレーニングモードが、総復習追加後もこれまでと全く同じように動作する
      （回帰確認。特にハート・敵の表示、結果画面のレイアウトが崩れていないこと）

### ヘルプ機能・エネミー図鑑（運用開始後に追加）

- [ ] タイトル画面左上に「？」ヘルプボタンが表示され、右上の音声切り替えボタンと重ならない
- [ ] バトル画面・カウントダウン画面・結果画面では「？」ボタンが表示されない
- [ ] 「？」を押すとヘルプメニューが開き、「このゲームについて」「エネミー図鑑」「もどる」の
      3つのボタンが表示される
- [ ] ヘルプメニューを開いた後にタイトルへ戻ると、学年・学期・レベル・選択中のモード
      （文章題バトル/トレーニング/総復習）・トレーニングの選択学期/カテゴリ・総復習の
      選択スコープ・効果音設定が、開く前のまま保持されている
- [ ] 「このゲームについて」を開くと、ゲームの紹介・基本的な遊び方（①〜⑥）・3モードの説明・
      操作のヒントが、見出しと本文に分かれたカードで表示される
- [ ] 「＝」ボタンを押して初めて正誤判定されることが、遊び方の説明文からわかる
      （式を完成させただけで自動的に正解になるとは書かれていない）
- [ ] 2〜3段階の問題では、式ごとに「＝」ボタンを押すことが遊び方の説明文からわかる
- [ ] 「このゲームについて」の右上の「もどる」を押すとヘルプメニューへ戻る
- [ ] 「このゲームについて」の画面を最後まで縦スクロールでき、横スクロールは発生しない
- [ ] 「エネミー図鑑」を開くと、画面上部に「発見したエネミー　○／26」と表示される
- [ ] 初回（一度も勝ったことが無い状態）は「発見したエネミー　0／26」で、すべてのカードが
      「❓」「？？？」と出現条件のヒントだけを表示している
- [ ] 未解放カードに、本来の絵文字・名前・キャラ紹介文が一切表示されない
- [ ] 通常のエネミー（レベル1〜5で出現）の未解放カードに「レベル○以上であらわれるかも？」、
      レベルMAX限定のエネミーには「レベルMAXであらわれるかも？」と表示される
      （「レベル6であらわれるかも？」のように内部レベルの数値をそのまま表示しない）
- [ ] 総復習専用エネミー（フォーミュラ仮面／フォーミュラ仮面エース）の未解放カードには、
      通常のレベル条件ではなく「学年の総復習であらわれるかも？」「小学校の総復習であらわれる
      かも？」が表示される
- [ ] エネミー図鑑のカードが、スマートフォン幅で2列（さらに狭い画面では1列）に並び、
      横スクロールが発生しない
- [ ] 「エネミー図鑑」の右上の「もどる」を押すとヘルプメニューへ戻る
- [ ] ヘルプメニューの「もどる」を押すとタイトル画面へ戻る
- [ ] 「このゲームについて」「エネミー図鑑」が表示されている間だけ、Escキーでヘルプメニューへ
      戻れる。ヘルプメニュー表示中にEscキーを押すとタイトル画面へ戻る
- [ ] バトル画面・結果画面が表示されている間は、Escキーを押しても何も起こらない（回帰確認）
- [ ] 文章題バトルでエネミーのHPを0にしてクリアすると、そのエネミーだけがエネミー図鑑で
      解放される（絵文字・名前・キャラ紹介文が表示されるようになる）
- [ ] 文章題バトルでゲームオーバーになっても、エネミー図鑑は解放されない
- [ ] 文章題バトルでリタイアしても、エネミー図鑑は解放されない
- [ ] 総復習で固定エネミー（フォーミュラ仮面／フォーミュラ仮面エース）のHPを0にしてクリアすると、
      実際に登場していた方のエネミーだけがエネミー図鑑で解放される
- [ ] 総復習でゲームオーバー・リタイアになっても、エネミー図鑑は解放されない
- [ ] トレーニングを完了しても、エネミー図鑑の解放状態・発見数は変化しない
      （トレーニングの既存の5問進行が壊れていないことも合わせて確認する）
- [ ] 同じエネミーを複数回倒しても、発見数が重複してカウントされない
- [ ] エネミー図鑑を解放した状態でページを再読み込みしても、解放状態が保持される
- [ ] ブラウザの開発者ツールで `localStorage` の `mathWordBattle_defeatedEnemyIds` を
      壊れたJSON（例: 不完全な文字列）に書き換えてページを再読み込みしても、アプリが
      停止せず、エネミー図鑑は未解放状態（0／26）として安全に扱われる
- [ ] エネミー図鑑を解放しても、ハイスコア・効果音設定・前回選んだ出題範囲など、他の保存データが
      上書きされない
- [ ] 文章題バトル・トレーニング・総復習が、ヘルプ機能・エネミー図鑑の追加後もこれまでと
      全く同じように動作する（回帰確認）

## 17. 問題データ追加時のチェック項目

### 共通（1段階・2段階どちらでも）

- [ ] `id` が既存のすべてのテンプレートと重複していない
- [ ] [共通スキーマ](#2-問題データの共通スキーマ)の必須項目（`id` `gradeTerm` `category` `difficulty`
      `questionType` `variables` `generatorType` `solutionRoutes` `answerUnit`、
      および `template`/`textParts` のどちらか一方）をすべて満たしている
- [ ] `template` 内の `{変数名}`（または `textParts` の `ref`）が、すべて `variables`
      （または `generatorType` が計算する変数）に存在する
- [ ] わり算を含む場合、`generatorType` に応じてわる数の範囲が正しい
      （`exactDivision` は1〜9、`exactDivisionTwoDigit` は10〜99、
      `exactDecimalDivisionByInteger` は2〜9。`variables.divisor.min` が1以上になっている）
- [ ] 小数を扱う変数がある場合、`step` ではなく `decimalPlaces` を指定している
      （`decimalPlaces` は現状2桁までを想定。3桁以上にする場合は `js/question-validator.js` の
      `MAX_REASONABLE_DECIMAL_PLACES` の見直しが必要）
- [ ] 分数を扱う変数がある場合、`{ type:"fraction", denominator, numeratorMin, numeratorMax }` の形式で、
      分母が2〜12の範囲・分子が整数になっている
- [ ] `contentGroup` を明示する場合は `"new"` か `"review"` のどちらかになっている
      （省略した場合は `gradeTerm` から自動判定されるため、既存ファイルへの追記は不要）
- [ ] [`tools/question-validator.html`](#8-問題検証ページの使い方toolsquestion-validatorhtml) で
      再検証し、追加したテンプレートが **OK** 表示になっている（NGが1件も無い）

### 1段階問題（questionType: "singleStep"）

- [ ] `solutionRoutes` の `operator` が `"+"` `"-"` `"×"` `"÷"` のいずれかになっている
- [ ] `solutionRoutes` の `left` / `right` が、`variables`（または計算済み変数）のキー名と一致している
- [ ] ひき算のように順序を区別する問題は `commutative: false`、たし算・かけ算のように
      順序を問わない問題は `commutative: true` になっている
- [ ] ひき算の場合、`variables` の範囲設定により、答えが必ず正の数になる（`a` の最小値 > `b` の最大値、など。
      小数のひき算でも同じ考え方で範囲を設計する）

### 異分母分数のテンプレート（異分母分数のたし算・ひき算、第8段階）

- [ ] `generatorType` が `"unlikeDenominatorFractionAddition"`（たし算）または
      `"unlikeDenominatorFractionSubtraction"`（ひき算）になっている
- [ ] `variables.a` と `variables.b` の `denominator`（分母）が**異なる**値になっている
      （同分母分数とは逆の条件。`js/question-validator.js` の `validateUnlikeDenominators` が検証）
- [ ] ひき算の場合、`variables.a.numeratorMin × variables.b.denominator` が
      `variables.b.numeratorMax × variables.a.denominator` 以上になっている
      （クロス乗算で「aの最小値 ≥ bの最大値」を保証。`validateNonNegativeUnlikeDenominatorSubtraction` が検証）
- [ ] たし算は `commutative: true`、ひき算は `commutative: false` になっている
- [ ] 検証ページで、生成された問題の分数が正しく計算・約分され、縦型で表示されている

### quantityRelationを持つテンプレート（小数倍・もとの量・平均・単位量あたり・混み具合・速さ・割合・分数倍・分数割合、第7〜11段階）

`quantityRelation.type` によって、フィールド名・`unknown` に使える値が異なります
（`js/question-validator.js` の `QUANTITY_RELATION_TYPE_CONFIG` を参照）。

| type | 既知（生成元）のキー | 自動計算されるキー | unknown に使える値 |
|---|---|---|---|
| `"multiplicative-comparison"`（小数倍・もとの量） | `baseKey` `multiplierKey` | `comparedKey` | `"base"` `"compared"` `"multiplier"` |
| `"average"`（平均） | `countKey` `averageKey` | `totalKey` | `"total"` `"count"` `"average"` |
| `"unit-rate"`（単位量あたり・混み具合） | `unitCountKey` `perUnitKey` | `totalKey` | `"total"` `"unitCount"` `"perUnit"` |
| `"speed"`（速さ・道のり・時間、第9段階） | `speedKey` `timeKey` | `distanceKey` | `"distance"` `"speed"` `"time"` |
| `"percentage"`（割合、第9段階） | `baseKey` `rateKey` | `comparedKey` | `"compared"` `"rate"` `"base"` |
| `"fraction-multiplicative-comparison"`（分数倍、第10段階） | `baseKey` `multiplierKey` | `comparedKey` | `"base"` `"compared"` `"multiplier"` |
| `"fraction-unit-rate"`（単位量あたり・分数版、第10段階） | `unitCountKey` `perUnitKey` | `totalKey` | `"total"` `"unitCount"` `"perUnit"` |
| `"fraction-rate"`（分数割合、第11段階） | `baseKey` `rateKey` | `comparedKey` | `"compared"` `"rate"` `"base"` |

- [ ] `quantityRelation.type` が上記8種類のいずれかになっている
- [ ] 「既知（生成元）のキー」2つが `variables` に存在するキー名と一致している
- [ ] 「自動計算されるキー」は `variables` に**含めない**（生成時に自動計算される値のため）
- [ ] `quantityRelation.unknown` が、その `type` に対応する3つの値のいずれかになっている
- [ ] `solutionRoutes` の `left`/`right` が、`unknown` に応じて正しい2変数を参照している
      （例: 小数倍で `unknown:"compared"` なら `base×multiplier`、平均で `unknown:"average"` なら
      `total÷count`、単位量あたりで `unknown:"total"` なら `perUnit×unitCount`、速さで
      `unknown:"speed"` なら `distance÷time`、割合で `unknown:"rate"` なら `compared÷base`
      （このときだけ `resultType:"percent"` を指定して結果を百分率にする）、分数倍で
      `unknown:"compared"` なら `base×multiplier`、`unknown:"base"` なら `compared÷multiplier`、
      単位量あたり・分数版で `unknown:"perUnit"` なら `total÷unitCount`、分数割合で
      `unknown:"rate"` なら `compared÷base`（このときだけ `resultType:"fraction"` を指定して、
      割り切れる場合でも必ず分数のまま表示する。百分率の `resultType:"percent"` とは併用しない）
- [ ] `template`（または `textParts`）に、自動計算されるキー（例: `{compared}` `{total}` `{distance}`）の
      プレースホルダーが、そのキーが `unknown` **ではない**ときだけ使われている
      （答えにあたる値を問題文に出してはいけない）
- [ ] `generatorType` が、その `type` に対応するもの（小数倍・もとの量: `decimalMultiplicativeComparison`
      `decimalOriginalQuantity`／平均: `averageFromTotal` `totalFromAverage`／
      単位量あたり・混み具合: `unitRate` `totalFromUnitRate`／速さ: `findSpeed` `findDistance` `findTime`／
      割合: `percentageFindCompared` `percentageFindRate` `percentageFindBase`／
      分数倍: `fractionMultiplierFindCompared` `fractionMultiplierFindBase`／
      単位量あたり・分数版: `fractionUnitRate`／
      分数割合: `fractionRateFindCompared` `fractionRateFindRate` `fractionRateFindBase`）になっている
- [ ] 「既知（生成元）」側の2つの変数の `decimalPlaces` を2桁以内にしておく
      （積・商のどちらを逆算しても、安全に有限小数として求まるようにするため。分数倍の `baseKey` は
      整数、`multiplierKey` は分数のため、この制約は当てはまらない）
- [ ] 平均の `countKey`（個数）が整数の範囲（`decimalPlaces` 無し）で定義されている
- [ ] 速さの `distanceUnit`/`timeUnit`/`speedUnit`（表示用メタデータ）が、km/時・m/分・m/秒のいずれか
      対応する組み合わせになっている（1つのテンプレート内で単位換算が発生しないように）
- [ ] 割合の `rateKey` が指す変数は `{ type:"percent", values:[...] }` の形式になっている
      （`min`/`max`/`step` ではなく、きりのよい割合の一覧から選ぶ）
- [ ] 分数倍の `baseKey` が指す変数は整数の範囲（`{min, max, step}`）、`multiplierKey` が指す変数は
      `{ type:"fraction", denominator, numeratorMin, numeratorMax }` になっている
- [ ] 分数倍・小数倍の `multiplierKey`（何倍）は、`numerator === denominator`（分数）や `1.0`（小数）が
      範囲内に含まれていてもよい（生成時に `pickMultiplierValueExcludingOne()` が自動的に除外するため、
      テンプレート側で意図的に1を避ける必要はない。運用開始後に追加。「○の1倍」は「○と同じ」を
      回りくどく言っているだけで文章題として不自然なため、1倍は出題されない）
- [ ] 単位量あたり・分数版の `unitCountKey`・`perUnitKey` が指す変数は、どちらも
      `{ type:"fraction", denominator, numeratorMin, numeratorMax }` になっている（数値0を含めない）
- [ ] 分数割合の `baseKey` が指す変数は整数の範囲（`{min, max, step}`）、`rateKey` が指す変数は
      `{ type:"fraction", denominator, numeratorMin, numeratorMax }` になっている。「分数割合・割合」
      （`unknown:"rate"`）では `baseKey` の `step` を `rateKey` の `denominator` の倍数にそろえ、
      `comparedAmount = baseAmount×rate` が必ず整数になるようにする（そうしないと、整数のみを
      表示する `template` 文字列に分数オブジェクトが紛れ込み `[object Object]` になってしまう）
- [ ] 検証ページで、生成された問題の`quantityRelation`関連のエラー（`validateQuantityRelation()`）が出ていない

### 分数のテンプレート（同分母分数のたし算・ひき算、第4〜9段階の内容）

- [ ] `template` ではなく `textParts` を使い、分数の値パーツは `{ type:"value", ref:"変数名" }` の形式になっている
- [ ] `variables.a` と `variables.b` の `denominator`（分母）が同じ値になっている（同分母分数のため）
- [ ] ひき算の場合、`variables.a.numeratorMin` が `variables.b.numeratorMax` 以上になっている
      （答えが必ず0以上になるように）
- [ ] `generatorType` が `"sameDenominatorFractionAddition"`（たし算）または
      `"sameDenominatorFractionSubtraction"`（ひき算）になっている
- [ ] たし算は `commutative: true`、ひき算は `commutative: false` になっている
- [ ] 検証ページで、生成された問題の分数が縦型（横線の上に分子・下に分母）で表示されている
- [ ] 検証ページの「値の種類」フィルターで「分数のみ」を選ぶと、追加したテンプレートが表示される

### 分数の乗除のテンプレート（分数×整数・分数×分数・分数÷整数・整数÷分数・分数÷分数、第10段階）

- [ ] `template` ではなく `textParts` を使っている（分数の値が問題文に直接登場するため）
- [ ] `generatorType` が `"fractionTimesInteger"`／`"fractionTimesFraction"`／
      `"fractionDividedByInteger"`／`"integerDividedByFraction"`／`"fractionDividedByFraction"`の
      いずれかになっている（すべて `"standard"` のエイリアスで、専用の生成関数は不要）
- [ ] わり算を含むテンプレートは、わる数（分数÷整数の整数側、整数÷分数・分数÷分数の右側の分数）が
      0にならない範囲になっている（分数の場合は `numeratorMin` が1以上、整数の場合は `min` が1以上）
- [ ] かけ算（`fractionTimesInteger` `fractionTimesFraction`）は `commutative: true`、
      わり算（`fractionDividedByInteger` `integerDividedByFraction` `fractionDividedByFraction`）は
      `commutative: false` になっている
- [ ] 分数×分数・分数倍のように「仮分数を含めてもよい」テンプレートでは、生成される分数の
      分子・分母の組み合わせが、意図せず整数に約分できてしまっても問題ない
      （`renderValueHtml()` が分母1の場合は自動的に整数表示に切り替えるため）
- [ ] 検証ページで、生成された問題の分数の計算結果が正しく約分され、分母が1になる場合は
      整数として表示されていることを確認する
- [ ] 検証ページで、生成された問題が縦型分数で表示され、`[object Object]` のような表示崩れが無いことを確認する

### 百分率のテンプレート（割合・割引・増量、第9段階）

- [ ] 百分率を扱う変数は `{ type:"percent", values:[10,20,25,...] }`（配列から選ぶ形式）になっている
      （`min`/`max`/`step` や `decimalPlaces` は使わない）
- [ ] `values` の各要素が、分母が2・4・5・10のいずれかになる「きりのよい」割合になっている
      （例: 10・20・25・30・40・50・60・75・80。中途半端な割合にすると、比べる量・答えが
      きれいな整数にならないことがある）
- [ ] もとにする量（`baseKey` が指す変数、または割引・増量の `originalPrice`/`originalAmount`）の
      `step` が、`values` に含まれるすべての割合の分母の最小公倍数の倍数になっている
      （例: 割合の候補が10%・20%・25%・50%なら最小公倍数は20なので、`step: 20` 以上の倍数にする。
      これにより、比べる量・支払う代金などが必ず整数になる）
- [ ] 計算結果を百分率で返す必要がある場合（割合・百分率のように「数値÷数値」の結果を`%`として
      表示したい場合）だけ、`solutionRoutes` に `resultType:"percent"` を指定している
      （それ以外の計算に `resultType` を付けると、`question-validator.js` がエラーにする）
- [ ] 検証ページで、生成された問題の百分率（カード・正解式・解答欄）が `0.2` のような小数で
      表示され、`[object Object]` のような表示崩れが無いことを確認する
      （問題文中の「20%」という自然な言い回しはこの限りではない）
- [ ] 「割合・百分率」（答えが百分率になるテンプレート）だけは、正解式の最終結果が
      `0.25→25%` のように「小数→百分率」の形式で表示されることを確認する

### 複数段階問題（questionType: "multiStep"）

- [ ] `solutionRoutes` の各ルートに一意な `id` が付いている
- [ ] 各ルートの `steps` の要素数が、テンプレートの `totalSteps`（1〜3）と一致している
      （第11段階で「ちょうど2要素」固定から1〜3要素に汎用化。同じテンプレート内の複数ルートは
      全ルートが同じ `totalSteps` になっている必要がある）
- [ ] 各ステップの `resultKey` が、同じルート内で重複していない
- [ ] 各ステップの `left` / `right` が `{ source, key }` の形式で、`source: "result"` は
      「同じルート内の、より前のステップの `resultKey`」だけを参照している（自己参照・前方参照はエラーになる）
- [ ] 途中結果・最終結果が負の数にならないよう、`variables` の範囲を設計している
      （ひき算を含む場合は、引かれる数の最小値が引く数の最大値を必ず上回るようにする）
- [ ] わり算を含む場合、`multiStepDivideFirst` または `multiStepSumToDivisible` など、
      割り切れることを保証する専用の `generatorType` を使っている
- [ ] 複数解法にする場合、すべてのルートが同じ `variables` から出発して同じ最終結果になっている
- [ ] `data/multi-step-integer.js` に追加した場合、`gradeTerm` は `"4-multi-step"` のままにしている
      （新しい学期キーを使う場合は [7章](#7-問題データの読み込みdataindexjsと新しい学期の追加方法)の手順に従う）
- [ ] 検証ページで、20回の生成に加えて「全ルート完答シミュレーション」がすべて成功している

### 割引・増量のテンプレート（2段階問題、複数解法、第9段階）

- [ ] `generatorType` が `"discountTwoStep"`（割引）または `"increaseTwoStep"`（増量）になっている
      （専用の生成関数は無く、`"standard"` と同じ値生成のため、`variables` を独立に定義するだけでよい）
- [ ] どの変数にも対応しない固定値（割引・増量の「100%」）は、`{ source: "variable", key: "..." }` ではなく
      `{ source: "literal", value: { type: "percent", value: 100 } }` の形式になっている
- [ ] 2つの解法ルートが登録されている（割引: 「支払う割合を先に求める」ルートと
      「値引き額を先に求める」ルート／増量: 「増量後の割合を先に求める」ルートと
      「増えた量を先に求める」ルート）
- [ ] `originalPrice`（または `originalAmount`）の `step` と、割引率/増量率の `values` の組み合わせが、
      「百分率のテンプレート」チェック項目の範囲設計（最小公倍数の倍数）を満たしている
- [ ] 検証ページで、両方のルートが同じ最終的な答えに到達し、「全ルート完答シミュレーション」が成功している
- [ ] 検証ページで、1つ目の式の選択肢カードに「100%」と割引率/増量率の百分率カードが含まれ、
      2つ目の式の選択肢カードに、もとの値段/量と、1つ目の式で正解したときの中間結果（百分率）が
      含まれていることを確認する

### 分数の速さ・道のり・時間のテンプレート（単位換算を含む複数ルート、第11段階）

- [ ] `generatorType` が `fractionSpeedWithMinuteConversion`／`fractionDistanceWithMinuteConversion`／
      `fractionTimeWithMinuteConversion`（すべて `"standard"` のエイリアス）のいずれかになっている
- [ ] `totalSteps: 2`、`solutionRoutes` にちょうど2つのルートが登録されている
- [ ] 各ルートの2ステップのうち、少なくとも1ステップが `{ source:"literal", value:60 }` を使って
      分↔時間の変換を行っている（分速×60＝時速、または分÷60＝時間）
- [ ] 変換ステップ（÷60）には `resultType:"fraction"` を指定し、割り切れる場合も分数のまま
      計算されるようにしている（例: `20÷60` を `0.333...` ではなく `1/3` として扱う）
- [ ] 最終ステップには `resultType:"numberOrFraction"` を指定している（結果が整数・分数どちらにも
      なりうることを明示するドキュメント用の指定。動作は省略時と同じ）
- [ ] 2つのルートが異なる計算順序（例: 「時間に変換してから道のりを時間で割る」ルートと
      「1分あたりの量を求めてから60倍する」ルート）で、必ず同じ最終結果に到達する
- [ ] 検証ページで、「全ルート完答シミュレーション」が両方のルートで成功し、中間結果の分数が
      `[object Object]` にならず正しく表示される

### 比を使った数量・比例配分のテンプレート（比の内部データ型、第11段階）

- [ ] 比を扱う値は `js/ratio-utils.js` の `createRatio(antecedent, consequent)` で生成し、
      `{type:"ratio", antecedent, consequent}` の形式になっている（式・カードには使わず、
      `textParts` の値パーツとして問題文に埋め込む、または `quantityRelation` のメタデータとして使うだけ）
- [ ] 比の表示に使う演算子カード（「：」）は一切生成していない（解答欄・選択肢カードに比が
      登場しないことを検証ページ・実機の両方で確認する）
- [ ] 比を使った数量は `generatorType: "ratioApplication"`、`totalSteps: 2`。
      `variables` に比の前項・後項（整数）と、生成専用の非表示変数 `unitAmount` を持ち、
      「既知の量÷対応する比の項＝単位量、単位量×もう一方の比の項＝答え」の2ステップになっている
- [ ] 比例配分は `generatorType: "proportionalAllocation"`、`totalSteps: 3`。
      `solutionRoutes` の演算子の並びが必ず `["+", "÷", "×"]`（比の前項＋後項＝比の和、
      合計÷比の和＝単位量、単位量×目的の比の項＝答え）になっている
- [ ] 比例配分で、「合計÷片方の比の項×もう片方の比の項」のような2段階のショートカット計算を
      正解ルートとして**登録していない**（登録すると、教科書の解き方（比の和を使う3段階）以外の
      別解が正解になってしまうため）
- [ ] 検証ページで、`totalSteps` が2（比を使った数量）または3（比例配分）になっているテンプレートが
      すべてOKと表示され、「段階数」フィルターで2段階・3段階それぞれのテンプレートを絞り込める
- [ ] 比の前項・後項（`variables` の `firstRatioKey`/`secondRatioKey` が指す変数）の範囲は、
      1以外の整数の組み合わせが十分に存在し、かつ互いに素な組み合わせ（例: `(2,3)`）が
      少なくとも1つは含まれるようにする（`pickCoprimeRatioTerms()` が「互いに素かつどちらも
      1でもない」組み合わせが出るまで選び直すため、範囲が狭すぎる・互いに素な組み合わせが
      無いと生成に失敗する。第11段階で追加）

### 比例・対応する量／反比例・対応する量のテンプレート（中間結果の非表示、第12段階）

- [ ] `generatorType` が `"findDirectProportionValue"`（比例）または `"findInverseProportionValue"`
      （反比例）になっている
- [ ] `quantityRelation.type` が `"direct-proportion"`／`"inverse-proportion"` で、`unknown` が
      常に `"targetY"` になっている（比例定数・一定の積そのものを答えさせる問題は作らない）
- [ ] 比例の `variables` に `knownXKey`・`targetXKey`・`constantKey`（比例定数）が指す3つの
      変数がすべて定義されている（`knownYKey`・`targetYKey` は生成時に自動計算されるため
      `variables` に含めない）。反比例も同様（ただし一定の積の代わりに、内部専用の
      `variables.scaleFactor` を使う。`productKey` が指す変数は `variables` に含めない）
- [ ] `hiddenIntermediateKeys` に、比例定数／一定の積の変数名を指定している
      （`validateHiddenIntermediateKeys()` が、`template`（または`textParts`）でこの変数が
      直接参照されていないかを検証する）
- [ ] 比例は必ず2つの正解ルート（「÷→×」＝1つ分の量を求める、「×→÷」＝比例式に相当する計算）を
      登録し、2つのルートが異なる手順になっている
- [ ] 反比例は必ず1つの正解ルート（「×→÷」）で、式1（knownX×knownY）に `commutative: true` を
      指定している（依頼文の「式1のかけ算では交換法則を認めてください」）
- [ ] `knownX`・`targetX` が偶然同じ値にならないよう、`pickDistinctValuePair()` で選び直している
      （比例・反比例の両方で共通のヘルパー）
- [ ] 反比例のテンプレートで、一定の積に相当する数値（長方形の面積、仕事全体の人日など）が
      問題文に一切登場していないことを検証ページ・実機の両方で確認する
- [ ] 関係表（`relationTable`）を追加する場合、`rowHeaders`（行見出しの配列）と `columns`
      （各列のセル配列。`{type:"value", ref:変数名}` または児童が求める値を表す
      `{type:"unknown"}`）の形式になっている。関係表を追加するのは、比例・反比例テンプレート
      全体のうち少なくとも3分の1程度が目安

### 縮尺のテンプレート（縮尺の内部データ型・長さの単位変換、第12段階）

- [ ] `generatorType` が `"findActualLengthFromScale"`／`"findMapLengthFromScale"`
      のいずれかになっている（2カテゴリとも `generateScaleLengthValues()` を共有する。
      「縮尺を求める」カテゴリ・`"findScale"` は運用開始後に削除した）
- [ ] `quantityRelation.type` が `"scale-length"` で、`scaleKey`・`mapLengthKey` が指す変数は
      `variables` に存在し、`actualLengthKey` が指す変数は（生成時に自動計算される値のため）
      `variables` に含めていない（これは `unknown` の値に関わらず常に同じ構成）
- [ ] 縮尺の分母（`scaleKey` が指す変数）は、`{ min, max, step }` の連続範囲ではなく
      `{ values: [...] }` の「きりのよい」値の一覧で定義している（分数の時間の
      `answerMinutes` と同じ設計）。実際の長さの単位が`"km"`の場合、変換後の値が
      小数第2位までに収まるよう、`values` は1000の倍数だけにする（`"m"`の場合はこの制約はない）
- [ ] `quantityRelation.actualLengthUnit` が `"km"`／`"m"` のいずれかになっている
- [ ] 正解ルートは必ず1つで、2段階（長さの単位変換のステップを含む）になっている。単位変換の
      ステップには `{source:"literal", value:100000}`（km）または `{source:"literal", value:100}`
      （m）が使われている
- [ ] 検証ページで、生成された問題の縮尺（カード・正解式・解答欄には登場せず、問題文にのみ登場）が
      `1：25,000` のように3桁区切りカンマ付きで表示され、改行されていないことを確認する
- [ ] 検証ページで、「全ルート完答シミュレーション」が成功し、`[object Object]` のような
      表示崩れが無いことを確認する

## 18. トレーニングモード（第6段階）

通常バトルとは別に、**1つのカテゴリ（単元）だけを5問、時間を気にせず練習できるモード**です。
タイマー・ハート・敵HP・スコア・ランク・ハイスコアという「バトル」の概念を一切持たず、
不正解でもゲームオーバーにならず、同じ問題を何度でも解き直せます。

### 状態分離の方針

通常バトル（`js/game.js` の `gameState`）とトレーニング（`js/training-mode.js` の `trainingState`）は、
**完全に独立した別オブジェクト**です。`game.js` は `training-mode.js` を import せず、
`training-mode.js` も `game.js` の内部状態を参照しません（唯一の例外は、カウントダウン演出
`runCountdown()` を `game.js` から再利用している点だけです）。

「今どちらのモードで遊んでいるか」の判定・振り分けは、`js/app.js` の `currentMode` 変数と
コールバックの分岐だけに集約しています。

```js
// js/app.js（要約）
onJudge: (answer) => (currentMode === "training" ? training.handleJudge(answer) : game.handleJudge(answer)),
```

`game.js`・`training-mode.js`・`ui.js` の内部には `if (mode === "training") {...}` のような
分岐を増やしていません。画面側の出し分け（バトル専用要素／トレーニング専用要素の表示切替）も、
`ui.js` の `setMode()` が `#app` 要素に `mode-training` クラスを付け外しするだけで、
実際の表示・非表示は CSS 側（`.battle-only` / `.training-only`）にまとめています。

### カテゴリレジストリ（data/category-registry.js）

トレーニングで選べるカテゴリの**単一の情報源**です。各カテゴリは次の形を持ちます。

```js
{
  id: "same-denominator-fraction-addition", // categoryId（テンプレート側と一致させる、安定した内部ID）
  label: "同分母分数のたし算",                 // 画面表示名
  gradeTerm: "4-3",                          // 学年・学期キー（通常バトルの出題範囲と同じ値）
  gradeLabel: "小学4年生・3学期",              // 学年・学期の表示名
  enabledInTraining: true,                    // トレーニングの選択肢として表示するか
  order: 12                                   // 表示順
}
```

第6段階時点では13カテゴリでしたが、第7段階で5年1学期の4カテゴリ、第8段階で5年2学期の5カテゴリ、
第9段階で5年3学期の8カテゴリ、第10段階で6年1学期の8カテゴリを追加し、
現在38カテゴリ登録されています
（5年1学期の内訳は[19章](#19-小学5年生1学期第7段階)、5年2学期の内訳は[20章](#20-小学5年生2学期第8段階)、
5年3学期の内訳は[21章](#21-小学5年生3学期第9段階)、6年1学期の内訳は[22章](#22-小学6年生1学期第10段階)を参照）。

| 学期 | カテゴリ（categoryId） |
|---|---|
| 4-1 | `integer-addition` `integer-subtraction` `integer-multiplication` `integer-division-one-digit` |
| 4-2 | `decimal-addition` `decimal-subtraction` `large-numbers` `integer-division-two-digit` `multi-step-integer` |
| 4-3 | `decimal-times-integer` `decimal-division-by-integer` `same-denominator-fraction-addition` `same-denominator-fraction-subtraction` |
| 5-1 | `decimal-times-decimal` `decimal-divided-by-decimal` `decimal-multiplicative-comparison` `decimal-original-quantity` |
| 5-2 | `unlike-fraction-addition` `unlike-fraction-subtraction` `average` `unit-rate` `crowdedness` |
| 5-3 | `speed-find-speed` `speed-find-distance` `speed-find-time` `percentage-compared-amount` `percentage-rate` `percentage-base-amount` `percentage-discount` `percentage-increase` |
| 6-1 | `fraction-times-integer` `fraction-times-fraction` `fraction-divided-by-integer` `integer-divided-by-fraction` `fraction-divided-by-fraction` `fraction-multiplier-compared-amount` `fraction-multiplier-base-amount` `fraction-unit-rate` |

`js/ui.js` はタイトル画面の「がくねん」「がっき」「もんだいの しゅるい」ボタンを、
`getGradeTermGroups()` / `getCategoriesForGradeTerm()` を使って**このレジストリから動的に生成**します
（運用開始後、学年・学期は「がくねん」「がっき」の2つのボタン群に分割しましたが、
`getGradeTermGroups()` から学年・学期それぞれの一覧を導出する仕組みなのは変わりません。
詳しくは[14章](#14-現時点で実装済みの機能)を参照）。
カテゴリ名を `index.html` や `js/ui.js` に個別にハードコードすることはありません。

`multi-step-integer` だけは特別扱いで、`data/multi-step-integer.js` の12テンプレートは
`category`（表示名）が5種類に分かれていますが、`categoryId` はすべて `"multi-step-integer"`
に統一し、トレーニングでは「整数の2段階文章題」という1つのカテゴリとしてまとめて出題します。

### 既存テンプレートへの categoryId 追加

`data/grade4-term1.js` `grade4-term2.js` `grade4-term3.js` `multi-step-integer.js` の
既存84テンプレートすべてに `categoryId` フィールドを追加しました。`category`（表示名、日本語）は
そのまま残しており、画面表示に使い続けます。**カテゴリの抽出・照合には、必ず `categoryId` を使い、
`category`（表示名）は使わないでください**（表示名は将来変更されうるため）。

```js
{
  id: "g4t3_frac_add_001",
  gradeTerm: "4-3",
  categoryId: "same-denominator-fraction-addition", // 抽出・照合用
  category: "同分母分数のたし算",                       // 表示用
  // ...
}
```

新しいテンプレートを追加する場合も、既存の[3章](#3-1段階問題のテンプレート追加方法)・
[4章](#4-2段階問題questiontype-multistepについて)の手順に加えて、`categoryId` を必ず追加してください。
第7段階で追加した `data/grade5-term1.js` の32テンプレートは、最初から `categoryId` を持つ形で作成しています。

### 問題抽出方法（js/training-mode.js）

`generateTrainingQuestions(categoryId, templates, count = 5)` が、指定した `categoryId` に一致する
テンプレートだけを対象に、ちょうど `count` 問（既定5問）を生成します。

- 4-2/4-3モードで使う「新内容/復習内容の比率処理」（`planQuestionSequence()`）は**使用しません**。
  常に1カテゴリだけから出題します。
- 1段階・2段階のどちらのテンプレートも、既存の `question-generator.js` の `generateQuestion()` を
  そのまま呼び出します（2段階問題は自動的に `multiStep` として初期化されます）。特別扱いは不要です。
- 問題文・式ができるだけ重複しないよう、`js/value-utils.js` の `valueKey()` を使って
  型（数値・分数）を意識せず重複判定し、重複した場合は再抽選します
  （最大20回。テンプレートが5種類未満のカテゴリでは同じテンプレートを複数回使いますが、
  それでも無限ループにはならないよう上限を設けています）。

開発者用検証ページ向けに `validateTrainingSetGeneration(categoryId, templates, attempts, count)` も
用意しており、指定回数（既定20回）繰り返し生成して、常に指定した問題数になるか・他のカテゴリが
混ざらないか・例外が発生しないか・問題文が完全に重複していないか・選択肢が8枚を超えていないかを検証します。

### 既存機能の再利用範囲

カード生成・タップ/ドラッグ操作・正誤判定・2段階問題の進行・分数の縦型表示は、**すべて通常バトルと
同じ関数をそのまま使用**しています。トレーニング専用の判定ロジックは書いていません。

| 機能 | 使用する関数 |
|---|---|
| 問題生成・選択肢カード生成 | `question-generator.js` の `generateQuestion()` |
| 正誤判定（1段階） | `answer-checker.js` の `checkAnswer()` |
| 2段階問題の進行・途中式判定 | `multi-step-engine.js` の `submitStepAnswer()` など |
| 画面描画（問題文・カード・解答欄） | `ui.js` の `renderProblem()` `renderStepChoices()` |
| 分数の縦型表示 | `value-renderer.js` の `renderValueHtml()` `renderTextPartsHtml()` |
| 正解演出・履歴表示 | `ui.js` の `showCorrectEffect()` `renderHistory()`（履歴のHTML組み立ては無改造） |

トレーニング側で新しく用意したのは、タイマー・ハート・敵HP・スコアを**呼ばないこと**による差分と、
不正解時に「ハートを減らさず・ゲームオーバーにせず・同じ問題を再挑戦させる」処理、
問題完了ごとの集計（完了数・1回で正解した数・ミス回数）だけです。

### 不正解時の挙動

不正解（または2段階問題の途中式の不正解）のとき、通常バトルと異なり次のようになります。

- ハートを減らさない・ゲームオーバーにならない
- 同じ問題（2段階問題は同じ式・同じステップ）に再挑戦する。2段階問題の場合、2つ目の式で
  間違えても1つ目の式には戻りません（`multi-step-engine.js` が候補ルート・中間結果を保持したまま）
- 解答欄はクリアされる
- 効果音は不正解音を再生するが、演出はバトルの「画面赤フラッシュ＋大きめのシェイク」より
  控えめな「解答欄まわりの軽いシェイクのみ」にしている（学習モードとして過度に強い演出を避けるため）
- その問題を1回でも間違えた場合、正解しても「1回で正解」の数には数えない
  （`trainingState.currentQuestionHadMistake` で判定）

### トレーニング結果画面

バトル結果画面（`#screen-result`）を再利用しつつ、`.battle-only` / `.training-only` クラスで
表示項目を出し分けています。

- タイトル: 5問すべて完了なら「トレーニング完了！」、リタイアなら「トレーニング終了」
- カテゴリ名、完了数（例: `5／5問`）、1回で正解した数（例: `4問`）、ミス回数（例: `1回`）
- スコア・ランク・ハイスコア・残りハート・敵HPは**一切表示しません**
- 問題履歴は通常バトルと同じ `renderHistory()` を再利用（1段階/2段階どちらも対応、分数も縦型表示）
- 「もう一度」で同じカテゴリの新しい5問を再生成、「タイトルに戻る」でタイトル画面へ
  （最後に選んだ学期・カテゴリは `localStorage` に残るため、次回タイトル画面でも初期値として復元されます）

### localStorageへの影響

`js/storage.js` に、次の3つを新規追加しました（既存のハイスコア用キー・効果音設定キーとは別のキーで、
既存データには一切触れません）。

| キー | 内容 |
|---|---|
| `lastMode` | 前回選んだモード（`"battle"` または `"training"`） |
| `lastTrainingGradeTerm` | 前回選んだトレーニングの学年・学期 |
| `lastTrainingCategoryId` | 前回選んだトレーニングのカテゴリID |

トレーニングの**スコア・進捗・ハイスコア・途中経過は一切保存しません**。保存された値が不正
（レジストリに存在しない学期・カテゴリなど）な場合は、`js/ui.js` が安全にデフォルト値
（先頭のカテゴリ）へフォールバックします。

### 拡張方法（将来、新しい学年・学期のカテゴリを追加する場合）

1. 新しいデータファイル（例: `data/grade5-term1.js`）の各テンプレートに `categoryId` を追加する
2. `data/category-registry.js` の配列に、そのカテゴリの `{ id, label, gradeTerm, gradeLabel,
   enabledInTraining, order }` を1件追加する

この2箇所だけで、タイトル画面のカテゴリ選択UI・トレーニングの出題プール・検証ページの
カテゴリ一覧に自動的に反映されます（`js/ui.js` `js/training-mode.js` `tools/question-validator.html`
のいずれも、レジストリから動的に読み込むため個別の修正は不要です）。

### 動作確認用チェックリスト（トレーニングモード）

- [ ] タイトル画面に「通常バトル」「トレーニング」のモード選択ボタンが表示され、切り替えられる
- [ ] トレーニングを選ぶと、出題範囲・レベル・ハート数・時間制限・スコア/ランクの説明が非表示になる
- [ ] トレーニングを選ぶと、「がくねん」「がっき」「もんだいの しゅるい」の選択UIが表示される
- [ ] カテゴリ一覧が `data/category-registry.js` から動的に生成されている（13カテゴリ、学期ごとに正しくグループ化）
- [ ] トレーニング開始で、選んだカテゴリだけから5問が出題される（他のカテゴリが混ざらない）
- [ ] トレーニング中、敵キャラ・ハート・時間ゲージ・スコア・ランクが表示されない
- [ ] トレーニング中、問題番号（「問題 1／5」）とカテゴリ名が表示される
- [ ] 2段階問題のカテゴリでは、「式を2つ答えよう！」などの進行表示と「問題 N／5」が同時に表示される
- [ ] 不正解でもハートが減らず、ゲームオーバーにならず、同じ問題に再挑戦できる
- [ ] 2段階問題で2つ目の式を間違えても、1つ目の式には戻らない
- [ ] 5問すべて正解すると、自動ではなく「タップして次へ」の後に結果画面へ遷移する
- [ ] 結果画面のタイトルが「トレーニング完了！」になる（5問完了時）
- [ ] 結果画面に、カテゴリ名・完了数・1回で正解した数・ミス回数・問題履歴が表示される
- [ ] 結果画面にスコア・ランク・ハイスコア・残りハート・敵HPが表示されない
- [ ] 「もう一度」で、同じカテゴリの新しい5問（前回と完全に同じ組み合わせではない）が生成される
- [ ] 「タイトルに戻る」でタイトル画面に戻る
- [ ] リタイアボタンを押すと「トレーニングを終了しますか？」の確認ダイアログが出る
      （ボタンは「終了する」「続ける」）
- [ ] 「続ける」でバトル画面に戻り、「終了する」で結果画面（タイトル「トレーニング終了」）に遷移する
- [ ] リタイア時、解答途中の問題も履歴に残る
- [ ] 分数カテゴリで、問題文・カード・解答欄・履歴の分数がすべて縦型で正しく表示される
- [ ] `?debug=true` で、`mode: training`・`trainingCategoryId`・`trainingCategoryLabel`・
      `trainingQuestionNumber`・`trainingCompletedQuestions`・`firstTryCorrectCount`・
      `totalWrongCount`・`currentQuestionWrongCount`・`currentQuestionHadMistake`・
      生成された5問のテンプレートID・各問題の`categoryId`・カテゴリ内のテンプレート総数・正解式が
      デバッグパネルに表示される
- [ ] `tools/question-validator.html` に「トレーニングモード：カテゴリレジストリ」が表示され、
      13カテゴリすべてOK（ID重複・孤立categoryId・テンプレート0件のカテゴリが無い）
- [ ] 検証ページの「トレーニングモード：出題テスト」で、カテゴリを選んで「5問生成する」が
      正しく動作し、「20回検証する」がすべてのカテゴリでOKになる
- [ ] タイトル画面で一度トレーニングモード・特定の学期/カテゴリを選んでページを再読み込みすると、
      その選択状態で復元される（`lastMode` `lastTrainingGradeTerm` `lastTrainingCategoryId`）
- [ ] 通常バトル（レベル1〜5・MAX、4-1/4-2/4-3すべて）が、トレーニング追加後もこれまでと
      全く同じスコア・ランク・ハイスコア計算で動作する（回帰確認）
- [ ] モードを何度切り替えても、バトルの `gameState` とトレーニングの `trainingState` が
      互いに影響し合わない（例: トレーニング中にスコア表示が残っていない、バトル中に
      トレーニングの問題番号表示が出ない）
- [ ] コンソールにJavaScriptエラーが出ていない（バトル・トレーニングどちらのフローでも）
- [ ] スマートフォン縦画面で、トレーニングのモード選択・カテゴリ選択・バトル画面・結果画面が
      崩れずに操作できる

## 19. 小学5年生・1学期（第7段階）

小学4年生・1〜3学期に続く、**通常バトルの正式モード**として `gradeTerm: "5-1"` を追加しました。
新出内容は「小数×小数」「小数÷小数」「小数倍」「もとの量」の4カテゴリで、すべて1段階問題
（`questionType: "singleStep"`）です。2段階問題との組み合わせ（例: 小数倍を含む2段階問題）は
今回は追加していません（既存の整数の2段階文章題は、引き続き復習内容として出題されます）。

### 安全な小数×小数・小数÷小数の計算（number-utils.js / value-utils.js）

小数×整数・小数÷整数（4年3学期）と同じ「整数にスケーリングしてから計算し、戻す」方式を、
小数×小数・小数÷小数にも拡張しました。

- `multiplyDecimal(a, b)`（既存）: 両方の小数点以下の桁数ぶんスケーリングしてから掛け合わせるため、
  小数×整数と全く同じ関数が小数×小数にもそのまま使えます（`multiplyDecimal(2.4, 3.5) === 8.4`）。
- `divideExactByDecimal(dividend, divisor, maxDecimalPlaces = 2)`（新規）: わる数が小数の場合の
  安全な「割り切れる場合だけ商を返す」わり算です。わられる数・わる数の両方を、小数点以下の桁数が
  大きい方に合わせてスケーリングして整数どうしの比に変換してから、既存の `divideExactByInteger()`
  （桁数を増やしながら割り切れるか試すロジック）にそのまま委譲します。
  `divideExactByDecimal(4.8, 1.2) === 4`、`divideExactByDecimal(12, 1.5) === 8`、
  `divideExactByDecimal(12, 0.4) === 30`、`divideExactByDecimal(1, 3) === null`（循環小数は拒否）。

これに伴い、`js/value-utils.js` の `calculateValues()` の `"÷"` ケースを、わる数が整数かどうかで
`divideExactByInteger()` / `divideExactByDecimal()` を使い分けるように変更しました。
**この変更前は、わる数が小数の場合に常に `null` を返していた**ため（`divideExactByInteger()` は
整数以外のわる数を明示的に拒否する設計だった）、この修正が無いと小数÷小数・小数倍・もとの量の
「わり算で答えを求める」パターンが一切成立しませんでした。`calculateValues()` は問題生成時の
`solutionRoutes` の解決と、`answer-checker.js` 経由の正誤判定の両方から呼ばれる共通の1か所のため、
この1つの修正で生成・判定の両方が同時に正しく動くようになっています。

### 小数倍・もとの量の数量関係（quantityRelation）

「基準量(base)の何倍(multiplier)が比較量(compared)である」という関係を、テンプレートの
`quantityRelation` フィールドで表現します。

```js
quantityRelation: {
  type: "multiplicative-comparison",
  baseKey: "base",          // variables内の、基準量の変数名
  comparedKey: "compared",   // 生成時に base×multiplier として自動計算される変数名（variablesには含めない）
  multiplierKey: "multiplier", // variables内の、何倍の変数名
  unknown: "compared"        // "base" | "compared" | "multiplier" のうち、どれが答えか
}
```

- `unknown: "compared"`（比較量を求める。小数倍カテゴリ）: 基準量・何倍が問題文に示され、
  `solutionRoutes` は `base × multiplier = compared`。かけ算なので `commutative: true`。
- `unknown: "multiplier"`（何倍かを求める。小数倍カテゴリ）: 基準量・比較量が問題文に示され、
  `solutionRoutes` は `compared ÷ base = multiplier`。わり算なので `commutative: false`
  （順序を逆にすると不正解）。
- `unknown: "base"`（もとの量＝基準量を求める。もとの量カテゴリ）: 比較量・何倍が問題文に示され、
  `solutionRoutes` は `compared ÷ multiplier = base`。同じく `commutative: false`。

値の生成は、`unknown` の値にかかわらず**常に同じ関数**（`js/question-generator.js` の
`generateDecimalMultiplicativeComparisonValues()`）で行います。`baseKey`・`multiplierKey` が指す
変数を独立に生成し、`comparedKey` の値は `multiplyDecimal(base, multiplier)` で自動計算するだけで、
「どれが答えか」は `solutionRoutes` 側だけが決めます。小数倍・もとの量という2つのカテゴリ
（`generatorType: "decimalMultiplicativeComparison"` / `"decimalOriginalQuantity"`）も、
このテンプレート単位の `quantityRelation`/`solutionRoutes` の違いだけで表現しており、
生成ロジック自体を分岐させていません。

`comparedKey` は生成時にしか存在しない値のため、`variables` には**含めません**。一方で、
`unknown` が `"multiplier"` や `"base"` のときは `comparedKey`（例: `"compared"`）が問題文
（`template`/`textParts`）や `solutionRoutes` の中で「既知の変数」として参照されます。
`js/question-validator.js` はこれを許可するため、`variables` のキー・`generatorType` の
`computedVariables` に加えて `quantityRelation.comparedKey` も「既知の変数名」として扱う
`getKnownVariableKeys()` ヘルパーを用意しています。

### 選択肢カードの「見えている数値」の判定（getVisibleNumbers）

小数倍・もとの量の問題では、`base`・`multiplier`・`compared` の3つの値が生成されますが、
そのうち「答え」にあたる1つは選択肢カードに含めてはいけません。`Object.keys(template.variables)`
のような固定リストでは、`unknown` によって答えが変わることを表現できない
（`compared` は `variables` に存在しないため、`unknown:"multiplier"`/`"base"` のときに
本来「見えている」はずの `compared` を見落としてしまう）ため、`js/question-generator.js` の
`getVisibleNumbers()` は、テンプレートの `solutionRoutes[0].left`/`.right` が実際に参照している
2つの変数だけを「見えている数値」として使う、データ駆動の判定にしています。

### 出題比率（新内容/復習内容）への統合

5-1モードの出題プランも、既存の4-2/4-3モードと**全く同じ仕組み**（[6章](#6-小学4年生2学期3学期の出題プラン新内容復習内容の比率とカテゴリ配分)の
`planQuestionSequence()` / `GRADE_TERM_PLAN_CONFIG`）で実現しています。新しいバランス調整コードは
追加しておらず、`GRADE_TERM_PLAN_CONFIG` に次の1エントリを追加しただけです。

```js
"5-1": {
  newContentGradeTerms: ["5-1"],
  reviewGradeTerms: ["4-1", "4-2", "4-3", "4-multi-step"]
}
```

これにより、新内容（5-1の4カテゴリ）・復習内容（4年生1〜3学期＋整数の2段階文章題）が
およそ半々の比率で、それぞれのカテゴリ・学期に偏りなく、同じキーが3問以上連続しないように
自動的に出題されます（レベルMAX＝12問のとき、新内容6問・復習内容6問）。

### トレーニングモードへの統合

`data/category-registry.js` に4カテゴリを追加しただけで、トレーニングモードのカテゴリ選択UI・
問題生成・検証ページのすべてに自動的に反映されました（`js/training-mode.js` `js/ui.js`
`tools/question-validator.html` は、いずれもレジストリから動的に読み込むため、コードの変更は
一切不要でした）。

```js
{ id: "decimal-times-decimal", label: "小数×小数", gradeTerm: "5-1", gradeLabel: "小学5年生・1学期", enabledInTraining: true, order: 14 },
{ id: "decimal-divided-by-decimal", label: "小数÷小数", gradeTerm: "5-1", gradeLabel: "小学5年生・1学期", enabledInTraining: true, order: 15 },
{ id: "decimal-multiplicative-comparison", label: "小数倍", gradeTerm: "5-1", gradeLabel: "小学5年生・1学期", enabledInTraining: true, order: 16 },
{ id: "decimal-original-quantity", label: "もとの量", gradeTerm: "5-1", gradeLabel: "小学5年生・1学期", enabledInTraining: true, order: 17 }
```

### レベルMAXのハート数・スコア/ランク計算式（既存の設計を維持）

第7段階の依頼内容には「レベルMAXのハート数は1個」「スコア加算は現在値の半分の式」といった、
本アプリの現在の実装とは異なる古い数値が含まれていましたが、**これらはこのアプリの開発の中で
既に意図的に変更済みの仕様**のため、5-1追加にあたって変更していません。

| 項目 | 現在の実装 | 備考 |
|---|---|---|
| レベルMAXのハート数 | 2個（レベル5と同じ） | `js/game.js` の `heartsForLevel()`。以前の開発段階で1個から2個へ変更済み |
| 正解時の加算スコア | `(10+せいかい数)×(10+タイムボーナス)×20` | `js/score.js` の `calculateQuestionScore()`。以前の開発段階で×2から×4へ、さらに`(50+ゲージ残量%)×4`から`(10+タイムボーナス)×20`へ変更済み（タイムボーナス＝`calculateTimeBonus()`、詳細は後述） |
| ランク係数 | `現在のスコア÷(1600×レベル)` | `js/score.js` の `calculateRank()`。以前の開発段階で800→1000→1600へ変更済み |
| 解答時間ゲージの加速倍率 | 1.0倍→2.0倍（問題が進むほど加速） | `js/game.js` の `speedMultiplier()`。以前の開発段階で1.5倍から2.0倍へ変更済み |

これらは `gradeTerm`（学年・学期）に依存しないレベル・スコア共通の仕組みのため、5-1モードにも
そのままの値で自然に適用されています（5-1専用の特別な計算式は用意していません）。

### 既存機能への影響

5-1追加にあたって変更したのは、次のファイル・箇所だけです。それ以外の既存ファイル
（`js/training-mode.js` `js/storage.js` `js/enemy-list.js` `js/multi-step-engine.js`
`js/answer-checker.js` `js/value-renderer.js` `css/style.css` など）は無改造です。

| ファイル | 変更内容 |
|---|---|
| `js/number-utils.js` | `divideExactByDecimal()` を新規追加 |
| `js/value-utils.js` | `calculateValues()` の `"÷"` ケースを、わる数の整数/小数で分岐するよう修正 |
| `js/question-generator.js` | 新しい `generatorType` 4種・`quantityRelation` 対応の値生成・`getVisibleNumbers()` の分岐・`GRADE_TERM_PLAN_CONFIG` に `"5-1"` を追加 |
| `js/question-validator.js` | `VALID_GRADE_TERMS` に `"5-1"` を追加・新しい `generatorType` 4種のルール・`validateQuantityRelation()`・`getKnownVariableKeys()` を追加 |
| `data/grade5-term1.js` | 新規ファイル（32テンプレート） |
| `data/index.js` | `grade5-term1.js` の import・`TEMPLATE_SETS_BY_GRADE_TERM` への登録 |
| `data/category-registry.js` | 4カテゴリを追加（order 14〜17） |
| `js/game.js` | `PLANNED_GRADE_TERMS` に `"5-1"` を追加（出題プランを使うモードとして登録するだけ） |
| `js/ui.js` | `RANGE_LABELS` に `"5-1": "小学5年生・1学期"` を追加 |
| `index.html` | 「5年1学期」ボタンの `disabled` を解除し、`data-range="5-1"` を設定 |

ハイスコアの保存キー（`js/storage.js` の `buildHighScoreKey(gradeTerm, level)`）は
`gradeTerm` と `level` から動的に文字列を組み立てる汎用的な実装のため、`"5-1"` を渡しても
`highScore_5-1_level1` のようなキーが自動的に使われます。レベルMAXは既存モードと同じ
`level: 6` を使う設計のため（`level: 10` のような特別な値は使っていません）、ハイスコアキーの
移行処理は不要でした。

### 動作確認・検証の進め方

- Node.js での単体検証: `js/question-generator.js` の `generateQuestion()` を、32テンプレート
  それぞれについて30回ずつ、レベル1〜MAXの出題プランを20回ずつ、トレーニングの5問セットを
  4カテゴリそれぞれ20回ずつ生成し、`js/question-validator.js` の `validateGeneratedQuestion()`
  ですべて検証（ブラウザ・DOM無しで `js/question-generator.js` 等を直接importして実行できます）。
- ブラウザでの回帰確認: [問題検証ページ](#8-問題検証ページの使い方toolsquestion-validatorhtml)で
  `gradeTerm` を `5-1` に絞り込み、32件すべてOKになっているか、カテゴリレジストリが17件すべてOKに
  なっているかを確認。実際にバトル画面・トレーニング画面でレベル1〜MAX、4カテゴリすべてを一通り
  プレイし、コンソールにエラーが出ていないかを確認。
- 詳しいチェック項目は[16章の「小学5年生・1学期（5-1モード、第7段階）」](#16-動作確認用チェックリスト)、
  テンプレート追加時のチェック項目は[17章の「quantityRelationを持つテンプレート」](#17-問題データ追加時のチェック項目)を参照してください。

## 20. 小学5年生・2学期（第8段階）

小学5年生・1学期に続く、**通常バトルの正式モード**として `gradeTerm: "5-2"` を追加しました。
新出内容は「異分母分数のたし算」「異分母分数のひき算」「平均」「単位量あたり」「混み具合」の
5カテゴリです。異分母分数のたし算・ひき算・単位量あたり・混み具合・平均（合計/個数から平均・
平均/個数から合計を求める単発の問題）は1段階問題、「2つの数の平均」だけは2段階問題です。

### 異分母分数の計算（fraction-utils.js は無改造）

第8段階で最初に確認したのは、既存の `js/fraction-utils.js` の `addFractions`/`subtractFractions` が
**最初から異分母対応だった**という点です。

```js
export function addFractions(a, b) {
  return simplifyFraction({
    type: "fraction",
    numerator: a.numerator * b.denominator + b.numerator * a.denominator,
    denominator: a.denominator * b.denominator
  });
}
```

分母をクロス乗算（`a.denominator × b.denominator`）で揃えてから計算しているため、`a.denominator`
と `b.denominator` が同じでも異なっていても正しく計算できます（これまで「同分母分数」でしか
使っていなかったのは、4年3学期のテンプレート側が意図的に同じ分母を指定していたからにすぎません）。
そのため、`js/fraction-utils.js` 自体への変更は最小限（`lcm()`・`convertToCommonDenominator()` の
追加のみ）で済みました。これらの2関数は、正誤判定・答えの計算には使用せず、開発者用検証ページの
デバッグ表示（通分前・通分後）や将来の解説機能のために用意しています。

異分母分数のたし算・ひき算は、`generatorType: "unlikeDenominatorFractionAddition"` /
`"unlikeDenominatorFractionSubtraction"` として登録していますが、生成ロジックは `"standard"`
（各変数を独立に生成する）のエイリアスです。`variables.a` / `variables.b` の `denominator` を
テンプレートごとに**異なる**固定値として定義するだけで、異分母分数の問題になります。

ひき算で答えが負にならないようにするため、`js/question-validator.js` に
`validateNonNegativeUnlikeDenominatorSubtraction()` を追加しました。分母が異なるため、
同分母のときのような分子どうしの直接比較はできず、クロス乗算で判定します。

```text
a.numeratorMin/a.denominator ≥ b.numeratorMax/b.denominator
⇔ a.numeratorMin×b.denominator ≥ b.numeratorMax×a.denominator
```

また、既存の `validateGeneratedQuestion()` には「生成された分数の分母が一致しているか」を
確認するチェックがありましたが、これは同分母専用の `generatorType`（`sameDenominatorFraction*`）
に限定されておらず、**そのままでは異分母分数の問題を毎回誤ってエラー扱いにしてしまう**ことが
分かりました。`SAME_DENOMINATOR_GENERATOR_TYPES` という許可リストを追加し、このチェックを
同分母専用の `generatorType` のときだけ実行するように修正しています（[既存機能への影響](#既存機能への影響-1)参照）。

### 平均・単位量あたり・混み具合のデータ設計（quantityRelationの汎用化）

小数倍・もとの量（第7段階）で導入した「2つの既知の値から、積にあたる3つ目の値を求める」という
`quantityRelation` の考え方を、平均・単位量あたりにもそのまま拡張しました。

```js
// 平均（合計＝個数×平均）
quantityRelation: { type: "average", totalKey: "total", countKey: "count", averageKey: "average", unknown: "average" }

// 単位量あたり・混み具合（全体量＝単位数×1単位あたり）
quantityRelation: { type: "unit-rate", totalKey: "total", unitCountKey: "unitCount", perUnitKey: "perUnit", unknown: "perUnit" }
```

値の生成も、小数倍・もとの量のときと同じ考え方で共通化しています。`js/question-generator.js` に
「aKey×bKey=productKeyの関係を持つ2つの値を独立に生成し、積を計算する」という汎用の
`generateProportionalValues(variables, aKey, bKey, productKey)` を切り出し、
`generateDecimalMultiplicativeComparisonValues()`（小数倍・もとの量）・`generateAverageValues()`
（平均）・`generateUnitRateValues()`（単位量あたり・混み具合）の3つがこれを共有しています。
「どの値が未知（答え）か」は、小数倍・もとの量のときと同じく `solutionRoutes` 側が決めるため、
値の生成ロジック自体は「未知が何か」を意識しません。

- **平均を求める**（`averageFromTotal`、`unknown:"average"`）: `count`（個数）・`average`（平均）を
  独立に生成し、`total`(=count×average) を計算。解法は `total÷count=average`。`count` は必ず整数に
  なるよう `variables` を設計するため（`decimalPlaces` を指定しない）、この逆算は
  `divideExactByInteger()` を使い、必ず有限小数（最大2桁）で割り切れます。
- **合計を求める**（`totalFromAverage`、`unknown:"total"`）: 同じ2つの値を生成し、解法は
  `average×count=total`（かけ算なので `commutative:true`）。
- **2つの数の平均**（`averageOfTwoValues`、2段階問題）: 既存の `multiStepSumToDivisible`
  （たし算→わり算）をそのまま再利用し、`variables.divisor` を常に2に固定するだけで実現しています。
  新しい生成関数は追加していません。
- **単位量あたりを求める**（`unitRate`、`unknown:"perUnit"`）: `unitCount`（単位数、小数の場合あり）・
  `perUnit`（1単位あたり）を生成し、`total`(=unitCount×perUnit) を計算。解法は `total÷unitCount=perUnit`。
  `unitCount` が小数の場合は、第7段階で追加した `divideExactByDecimal()` が使われます。
- **全体量を求める**（`totalFromUnitRate`、`unknown:"total"`）: 解法は `perUnit×unitCount=total`
  （かけ算なので `commutative:true`）。
- **混み具合**は、単位量あたりと数量関係が完全に同じ構造（全体量＝単位数×1単位あたり）のため、
  `generatorType`（`unitRate`/`totalFromUnitRate`）も `quantityRelation.type`（`"unit-rate"`）も
  単位量あたりと共有しています。`categoryId`（`crowdedness`）と問題文のテーマ（部屋・会場・牧場の
  人数/頭数）だけで区別しており、コード上の特別扱いは一切ありません。

`js/question-validator.js` 側も、`validateQuantityRelation()` を `QUANTITY_RELATION_TYPE_CONFIG`
（`type` ごとに「既知のキー2つ」「自動計算されるキー1つ」「`unknown` に使える値」を定義したマップ）
で汎用化し、小数倍・もとの量に加えて平均・単位量あたりも同じ1つの関数で検証できるようにしました。
`getKnownVariableKeys()`（問題文・`solutionRoutes` から参照してよい変数名を求めるヘルパー）も、
`comparedKey` 固定ではなく、`type` に応じた「自動計算されるキー」を動的に求めるよう汎用化しています。

### 混み具合で「どちらが混んでいるか」問題を出題しない理由

このアプリの解答形式は「カードを組み合わせて数式を作る」形式であり、「A」「B」のような文字を
選択させる形式には対応していません。混み具合の教科書的な単元には「2つの部屋のどちらが混んでいるか
比べる」という発展的な出題形式がありますが、今回は対応せず、「1㎡あたりの人数」「1台あたりの
台数」のような**数値を求める**問題だけに限定しています。

### 出題比率・トレーニングモードへの統合

5-2モードの出題プランも、既存の `planQuestionSequence()` / `GRADE_TERM_PLAN_CONFIG` の仕組みを
そのまま使っています。追加したのは次の1エントリだけです。

```js
"5-2": {
  newContentGradeTerms: ["5-2"],
  reviewGradeTerms: ["4-1", "4-2", "4-3", "4-multi-step", "5-1"]
}
```

依頼文の「小学4年生1学期〜小学5年生1学期の復習」という指定どおり、`5-1`（小学5年生1学期）も
復習内容の対象に含めています。新内容側は5カテゴリを均等に近い頻度で配分する既存のラウンドロビン
方式（`buildRoundRobinLabels()`）がそのまま使われるため、レベル5（新内容5問）では5カテゴリが
必ず1問ずつ、レベルMAX（新内容6問）では「+1カテゴリ」が実行のたびにランダムに変わります
（毎回同じカテゴリに偏らないことをNode.jsテストで確認済みです）。

トレーニングモードへの統合も、`data/category-registry.js` に5カテゴリ（order 18〜22）を
追加しただけです。`js/training-mode.js` `js/ui.js` `tools/question-validator.html` は
いずれもレジストリから動的に読み込むため、コードの変更は一切不要でした。

```js
{ id: "unlike-fraction-addition", label: "異分母分数のたし算", gradeTerm: "5-2", gradeLabel: "小学5年生・2学期", enabledInTraining: true, order: 18 },
{ id: "unlike-fraction-subtraction", label: "異分母分数のひき算", gradeTerm: "5-2", gradeLabel: "小学5年生・2学期", enabledInTraining: true, order: 19 },
{ id: "average", label: "平均", gradeTerm: "5-2", gradeLabel: "小学5年生・2学期", enabledInTraining: true, order: 20 },
{ id: "unit-rate", label: "単位量あたり", gradeTerm: "5-2", gradeLabel: "小学5年生・2学期", enabledInTraining: true, order: 21 },
{ id: "crowdedness", label: "混み具合", gradeTerm: "5-2", gradeLabel: "小学5年生・2学期", enabledInTraining: true, order: 22 }
```

### 現在の難易度・スコア・ランク・タイマー仕様（変更なし）

依頼文には、レベルMAXのハート数・スコア加算式・ランク係数・タイマー加速上限について、
このアプリの現在の実装と完全に一致する数値が明記されていました。実装前に `js/game.js`
`js/score.js` を確認し、以下がすべて依頼文どおりであることを確認済みです（変更していません）。

| 項目 | 現在の実装 |
|---|---|
| レベルMAXの内部レベル | 6 |
| レベルMAXのハート数 | 2個 |
| レベルMAXの必要正解数 | 12問（`2×内部レベル`） |
| レベルMAXの初期制限時間 | 20秒（`120秒÷内部レベル`） |
| 正解時の加算スコア | `(10+n)×(10+タイムボーナス)×20` |
| ランク係数 | `現在のスコア÷(1600×レベル)`（MAXは`÷9600`） |
| タイマー加速倍率 | `1+(n-1)/(N-1)`、1問目1.0倍・最終問題2.0倍 |

### 既存機能への影響

5-2追加にあたって変更したのは、次のファイル・箇所だけです。それ以外の既存ファイル
（`js/training-mode.js` `js/storage.js` `js/enemy-list.js` `js/multi-step-engine.js`
`js/answer-checker.js` `js/value-renderer.js` `js/score.js` `css/style.css` など）は無改造です。

| ファイル | 変更内容 |
|---|---|
| `js/fraction-utils.js` | `lcm()`・`convertToCommonDenominator()` を新規追加（`addFractions`/`subtractFractions` 自体は無改造） |
| `js/question-generator.js` | 新しい `generatorType` 7種・共通化した `generateProportionalValues()`・`generateAverageValues()`・`generateUnitRateValues()`・`QUANTITY_RELATION_GENERATOR_TYPES` の拡張・`GRADE_TERM_PLAN_CONFIG` に `"5-2"` を追加 |
| `js/question-validator.js` | `VALID_GRADE_TERMS` に `"5-2"` を追加・新しい `generatorType` 7種のルール・`validateQuantityRelation()` の汎用化（`QUANTITY_RELATION_TYPE_CONFIG`）・`validateUnlikeDenominators()`・`validateNonNegativeUnlikeDenominatorSubtraction()`・分母一致チェックを同分母専用の `generatorType` に限定する修正 |
| `data/grade5-term2.js` | 新規ファイル（30テンプレート） |
| `data/index.js` | `grade5-term2.js` の import・`TEMPLATE_SETS_BY_GRADE_TERM` への登録 |
| `data/category-registry.js` | 5カテゴリを追加（order 18〜22） |
| `js/game.js` | `PLANNED_GRADE_TERMS` に `"5-2"` を追加（出題プランを使うモードとして登録するだけ） |
| `js/ui.js` | `RANGE_LABELS` に `"5-2": "小学5年生・2学期"` を追加 |
| `index.html` | 「5年2学期」ボタンの `disabled` を解除し、`data-range="5-2"` を設定 |

`js/game.js`・`js/score.js`・`js/storage.js` のハート数・スコア・ランク・タイマー加速・
ハイスコアキーの仕組みはレベル・`gradeTerm`に対して汎用的な実装のため、5-2にもそのまま
（無改造で）正しく適用されています。

### 動作確認・検証の進め方

- Node.js での単体検証: 30テンプレートそれぞれについて30回ずつ、レベル1〜MAXの出題プランを
  20回ずつ、トレーニングの5問セットを5カテゴリそれぞれ20回ずつ生成し、`validateGeneratedQuestion()`
  ですべて検証。レベル5（新内容5問）で5カテゴリが必ず1問ずつになること、レベルMAX（新内容6問）の
  「+1カテゴリ」が複数回の実行で同じにならないことも確認しています。
- ブラウザでの回帰確認: [問題検証ページ](#8-問題検証ページの使い方toolsquestion-validatorhtml)で
  `gradeTerm` を `5-2` に絞り込み、30件すべてOKになっているか、カテゴリレジストリが22件すべてOKに
  なっているかを確認。実際にバトル画面・トレーニング画面でレベル1〜MAX、5カテゴリすべて
  （「平均」カテゴリは1段階・2段階の両方を含む）を一通りプレイし、コンソールにエラーが
  出ていないかを確認。
- 詳しいチェック項目は[16章の「小学5年生・2学期（5-2モード、第8段階）」](#16-動作確認用チェックリスト)、
  テンプレート追加時のチェック項目は[17章の「異分母分数のテンプレート」「quantityRelationを持つ
  テンプレート」](#17-問題データ追加時のチェック項目)を参照してください。

## 21. 小学5年生・3学期（第9段階）

小学5年生・2学期に続く、**通常バトルの正式モード**として `gradeTerm: "5-3"` を追加しました。
新出内容は「速さ」「道のり」「時間」「割合・比べる量」「割合・百分率」「割合・もとにする量」
「割引」「増量」の8カテゴリです。速さ・道のり・時間・割合の3種類は1段階問題、割引・増量は
2段階問題（それぞれ2つの解法ルート）です。第9段階では、整数・小数・分数に続く4つ目の値の型として
**百分率（パーセント）**を導入しています。

### 4つ目の値の型としての百分率（percentage-utils.js / value-utils.js）

これまでのバージョンは、値を「整数・小数（素のJavaScript数値）」「分数（`{type:"fraction", ...}`）」の
2つの形で扱ってきました。第9段階では、これに百分率 `{type:"percent", value}` を追加しています。
`"20%"` のような文字列表現や、`0.2` のような比率へ変換した値を内部値として使うことは一切ありません。

分数のときと同様に、百分率専用の計算処理は `js/percentage-utils.js` という新規ファイルに
切り出しました（`js/fraction-utils.js` と同じ位置づけ）。

```js
export function percentToRatio(value) {
  return normalizeNumber(divideDecimal(value.value, 100));   // 20% → 0.2
}
export function ratioToPercent(ratio) {
  return { type: "percent", value: normalizeNumber(multiplyDecimal(ratio, 100)) };  // 0.3 → 30%
}
```

`js/value-utils.js` の `calculateValues()` には、百分率を含む計算の組み合わせを追加しています。
サポートする組み合わせは限定的で、それ以外はすべて `null`（計算不能）を返すよう明示的に制限しました
（詳しくは[5章の「百分率」節](#百分率第9段階で追加)）。

```js
if (isPercentValue(left) && isPercentValue(right)) {
  // percent + percent、percent - percent のみ（percent × percent、percent ÷ percent は非対応）
}
if (isPercentValue(left) && typeof right === "number") {
  // percent × number のみ
}
if (typeof left === "number" && isPercentValue(right)) {
  // number × percent、number ÷ percent
}
```

これにより、「数値×百分率＝比べる量」「比べる量÷もとにする量＝割合（％）」「割合＋割合」
「もとの値段×支払う割合＝代金」のような、教科書に出てくる組み合わせだけを許可し、
`percent × percent` のような意味を持たない組み合わせをテンプレートに書いても、
生成結果が自動的に検証エラーになる（後述）ようにしています。

### 数値÷数値の結果を百分率として扱う（resultType）

「割合・百分率」（比べる量÷もとにする量＝割合を求める）は、計算自体は**ふつうの数値の割り算**
（例: `15÷50=0.3`）ですが、答えは百分率（`30%`）として表示する必要があります。この「計算は
数値のまま行い、結果の型だけ変える」ケースのために、`solutionRoutes`（および2段階問題の
`steps`）に `resultType: "percent"` という新しいフィールドを追加しました。

```js
solutionRoutes: [
  { left: "compared", operator: "÷", right: "base", commutative: false, resultType: "percent" }
]
```

生成時（`js/question-generator.js` の `applyResultType()`）に `calculateValues()` の結果（`0.3`）を
`ratioToPercent()` で百分率（`{type:"percent", value:30}`）に変換し、`resultType` フィールド自体も
生成済みの問題オブジェクトに複製しています。これは、`js/question-validator.js` 側が**独立に**
`safeCalculate(route.left, route.operator, route.right)` を計算して正解式と突き合わせる際、
同じ変換（`applyResultTypeForValidation()`。循環import を避けるための重複実装）をしないと
「`0.3` と `{type:"percent",value:30}` が一致しない」という誤検出になってしまうためです
（実装中に実際にこの不一致が発生し、`resultType` を検証側にも伝播させることで解決しました）。

### 速さ・道のり・時間（quantityRelationの拡張、単位はkm/時・m/分・m/秒に限定）

小数倍・もとの量・平均・単位量あたり（第7〜8段階）で使ってきた `quantityRelation` の枠組みに、
「道のり＝速さ×時間」という数量関係を追加しました。

```js
quantityRelation: {
  type: "speed",
  distanceKey: "distance", timeKey: "time", speedKey: "speed", unknown: "speed",
  distanceUnit: "km", timeUnit: "時間", speedUnit: "km/時"
}
```

値の生成は、既存の `generateProportionalValues(variables, aKey, bKey, productKey)`
（第8段階で単位量あたり用に切り出した汎用関数）をそのまま `generateSpeedValues()` から
呼び出すだけで実現しています。新しい生成アルゴリズムは追加していません。

単位は、依頼どおり **km/時・m/分・m/秒の3種類だけ**に限定し、1つのテンプレート内では
必ず対応する単位（例: 道のりkm・時間時間・速さkm/時）だけを使います。km↔m、時↔分↔秒のような
単位換算を必要とする問題（例: 「2時間30分」「1.5km＝1500m」）は今回意図的に追加していません。

### 割合（比べる量・百分率・もとにする量）

「もとにする量×割合＝比べる量」という数量関係を、`quantityRelation.type: "percentage"` として
追加しました。

```js
quantityRelation: { type: "percentage", baseKey: "base", comparedKey: "compared", rateKey: "rate", unknown: "compared" }
```

値の生成（`generatePercentageValues()`）は、速さや単位量あたりと似ていますが、`rate`
（割合）が百分率型のため、掛け算の前に `percentToRatio()` で比率に変換する処理が必要な点だけが
異なります（このためだけに専用の生成関数を用意し、`generateProportionalValues()` は再利用していません）。

割合を「きりのよい」値（分母が2・4・5・10のいずれかになる10%・20%・25%・30%・40%・50%・60%・
75%・80%など）に限定し、もとにする量の `step` をそれらの最小公倍数（20）の倍数にすることで、
比べる量が常に整数になるように範囲を設計しています。

### 割引・増量（2段階問題・複数解法・literal オペランド）

割引・増量は、それぞれ次の2つの解法ルートを持つ2段階問題として実装しています。

```js
// 割引: 「支払う割合を先に求める」ルート
[100% - discountRate% = paymentRate%] → [originalPrice × paymentRate% = answer]
// 割引: 「値引き額を先に求める」ルート
[originalPrice × discountRate% = discountAmount] → [originalPrice - discountAmount = answer]
```

依頼文の元の書式では、この「100%」のような**固定値**を `left`/`right` に直接値オブジェクトとして
埋め込む書き方（`left: {type:"percent", value:100}`）が使われていましたが、既存の
`solutionRoutes[].steps[].left`/`right` は必ず `{ source, key }` の形式（`variables` または
前のステップの結果を参照する）という設計だったため、これに合わせて次のように読み替えています。

```js
left: { source: "literal", value: { type: "percent", value: 100 } }
```

`js/question-generator.js` の `resolveOperand()` に `operand.source === "literal"` の分岐を1つ
追加するだけで対応でき（`operand.value` をそのまま返す）、この解決は生成時に一度だけ行われるため、
`js/multi-step-engine.js` などの下流のコード（カード生成・進行管理）は、値がどこから来たかを
一切意識せず、これまでどおり動作します。

`discountTwoStep`/`increaseTwoStep` という `generatorType` を用意していますが、専用の生成関数は
必要ありませんでした（`"standard"` と同じ、独立変数の生成のみ）。支払う割合・値引き額・増えた量・
最終的な答えは、登録した2つのルートがそれぞれ独立に計算しますが、整数へスケールしてから計算する
小数演算（`multiplyDecimal` など）を使っているため、分配法則（`a×(1-r) = a - a×r`）が
浮動小数点誤差なく成立し、両ルートの最終結果は理論的にも実装的にも必ず一致します
（Node.jsでの検証でも、5個体×30回すべてで両ルートの最終結果が一致することを確認済みです）。

### 出題比率・トレーニングモードへの統合

5-3モードの出題プランも、既存の `planQuestionSequence()` / `GRADE_TERM_PLAN_CONFIG` の仕組みを
そのまま使っています。追加したのは次の1エントリだけです。

```js
"5-3": {
  newContentGradeTerms: ["5-3"],
  reviewGradeTerms: ["4-1", "4-2", "4-3", "4-multi-step", "5-1", "5-2"]
}
```

新内容側は8カテゴリを均等に近い頻度で配分する既存のラウンドロビン方式（`buildRoundRobinLabels()`）が
そのまま使われます。新内容の数は最大でもレベルMAXの6問（8カテゴリ以下）のため、ラウンドロビンが
一周して重複することはありません（レベル1〜5・MAXすべてで、Node.jsテストにより新内容:復習が
正確に1:1になることと、カテゴリの出現数に極端な偏りがないことを確認済みです）。

トレーニングモードへの統合も、`data/category-registry.js` に8カテゴリ（order 23〜30）を
追加しただけです。`js/training-mode.js` `js/ui.js` `tools/question-validator.html` は
いずれもレジストリから動的に読み込むため、コードの変更は一切不要でした。割引・増量は
2段階問題ですが、トレーニングモードの2段階問題対応は5年2学期の「2つの数の平均」ですでに
実装済みのため、そのまま動作します。

```js
{ id: "speed-find-speed", label: "速さ", gradeTerm: "5-3", gradeLabel: "小学5年生・3学期", enabledInTraining: true, order: 23 },
{ id: "speed-find-distance", label: "道のり", gradeTerm: "5-3", gradeLabel: "小学5年生・3学期", enabledInTraining: true, order: 24 },
{ id: "speed-find-time", label: "時間", gradeTerm: "5-3", gradeLabel: "小学5年生・3学期", enabledInTraining: true, order: 25 },
{ id: "percentage-compared-amount", label: "割合・比べる量", gradeTerm: "5-3", gradeLabel: "小学5年生・3学期", enabledInTraining: true, order: 26 },
{ id: "percentage-rate", label: "割合・百分率", gradeTerm: "5-3", gradeLabel: "小学5年生・3学期", enabledInTraining: true, order: 27 },
{ id: "percentage-base-amount", label: "割合・もとにする量", gradeTerm: "5-3", gradeLabel: "小学5年生・3学期", enabledInTraining: true, order: 28 },
{ id: "percentage-discount", label: "割引", gradeTerm: "5-3", gradeLabel: "小学5年生・3学期", enabledInTraining: true, order: 29 },
{ id: "percentage-increase", label: "増量", gradeTerm: "5-3", gradeLabel: "小学5年生・3学期", enabledInTraining: true, order: 30 }
```

### 現在の難易度・スコア・ランク・タイマー仕様（変更なし）

依頼文には、レベルMAXのハート数・スコア加算式・ランク係数・タイマー加速上限について、
このアプリの現在の実装と完全に一致する数値が明記されていました。実装前に `js/game.js`
`js/score.js` を確認し、以下がすべて依頼文どおりであることを確認済みです（変更していません）。

| 項目 | 現在の実装 |
|---|---|
| レベルMAXの内部レベル | 6 |
| レベルMAXのハート数 | 2個 |
| レベルMAXの必要正解数 | 12問（`2×内部レベル`） |
| レベルMAXの初期制限時間 | 20秒（`120秒÷内部レベル`） |
| 正解時の加算スコア | `(10+n)×(10+タイムボーナス)×20` |
| ランク係数 | `現在のスコア÷(1600×レベル)`（MAXは`÷9600`） |
| タイマー加速倍率 | `1+(n-1)/(N-1)`、1問目1.0倍・最終問題2.0倍 |

### 既存機能への影響

5-3追加にあたって変更したのは、次のファイル・箇所だけです。それ以外の既存ファイル
（`js/training-mode.js` `js/storage.js` `js/enemy-list.js` `js/multi-step-engine.js`
`js/answer-checker.js` `js/fraction-utils.js` `js/score.js` など）は無改造です。

| ファイル | 変更内容 |
|---|---|
| `js/percentage-utils.js` | 新規追加。百分率専用の計算処理（比率⇔百分率変換・表示・同値判定） |
| `js/value-utils.js` | `isPercentValue`・`calculateValues`/`areValuesEqual`/`formatValue`/`valueKey`等の百分率対応・`computeUnsimplifiedFractionResult`（分数の約分なし表示、前回リクエスト分） |
| `js/value-renderer.js` | 百分率を比率（小数）に変換して表示（`renderValueHtml()`）・「割合・百分率」の答え専用の「小数→百分率」表示（`renderPercentConversionHtml()`。カード・解答欄・履歴の表示を`%`表記から小数表記に変更した際の追加分） |
| `js/ui.js` | 百分率カードのサイズクラス判定（`percentToRatio()`＋`formatNumber()`で小数表記の長さを使うよう修正）・正解演出（`showCorrectEffect()`）と問題履歴（`buildSingleStepHistoryHtml()`/`buildMultiStepHistoryHtml()`）の百分率表示を小数表記に統一 |
| `js/question-generator.js` | 新しい `generatorType` 8種（`findSpeed`/`findDistance`/`findTime`/`percentageFindCompared`/`percentageFindRate`/`percentageFindBase`/`discountTwoStep`/`increaseTwoStep`）・`pickPercentValue()`・`generateSpeedValues()`・`generatePercentageValues()`・`resolveOperand()` の `literal` 対応・`applyResultType()`・`generateDummyPercent()`・`renderTemplateText()` の百分率対応（`[object Object]` バグの修正）・`QUANTITY_RELATION_GENERATOR_TYPES`/`GRADE_TERM_PLAN_CONFIG` の拡張 |
| `js/question-validator.js` | `VALID_GRADE_TERMS` に `"5-3"` を追加・新しい `generatorType` 8種のルール・`QUANTITY_RELATION_TYPE_CONFIG` に `speed`/`percentage` を追加・`validatePercentVariable()`・`validateValueRepresentation()` の百分率対応・`validateMultiStepSolutionRoutes()` の `literal` オペランド対応・`applyResultTypeForValidation()`（`resultType` の重複実装） |
| `data/grade5-term3.js` | 新規ファイル（40テンプレート） |
| `data/index.js` | `grade5-term3.js` の import・`TEMPLATE_SETS_BY_GRADE_TERM` への登録 |
| `data/category-registry.js` | 8カテゴリを追加（order 23〜30） |
| `js/game.js` | `PLANNED_GRADE_TERMS` に `"5-3"` を追加（出題プランを使うモードとして登録するだけ） |
| `js/ui.js` | `RANGE_LABELS` に `"5-3": "小学5年生・3学期"` を追加 |
| `index.html` | 「5年3学期」ボタンの `disabled` を解除し、`data-range="5-3"` を設定 |

`js/game.js`・`js/score.js`・`js/storage.js` のハート数・スコア・ランク・タイマー加速・
ハイスコアキーの仕組みはレベル・`gradeTerm`に対して汎用的な実装のため、5-3にもそのまま
（無改造で）正しく適用されています。

### 動作確認・検証の進め方

- Node.js での単体検証: 40テンプレートそれぞれについて30回ずつ、レベル1〜MAXの出題プランを
  20回ずつ、トレーニングの5問セットを8カテゴリそれぞれ20回ずつ生成し、`validateGeneratedQuestion()`
  ですべて検証（全件成功）。割引・増量は「全ルート完答シミュレーション」で両方の解法ルートが
  同じ最終結果に到達することも確認しています。
- ブラウザでの回帰確認（Playwright）: タイトル画面の「5年3学期」ボタン表示、バトルモード
  （レベル1・レベルMAX）でのカウントダウン→問題文・選択肢カードの表示（`[object Object]`や
  `undefined`/`NaN`が出ないこと）、トレーニングモードの8カテゴリすべてでの出題確認、
  百分率が関わるカード・解答欄・正解式が `0.2` のように小数で表示され`%`表記にならないこと
  （問題文中の「20%」という自然な言い回しは`%`のまま変わらないこと）、「割合・百分率」だけは
  正解時・問題履歴の答え表示が `0.25→25%` のように小数と百分率の両方を示すこと、
  割引の2段階問題で両方の解法ルートのどちらでも1つ目の式が正解になり、2つ目の式まで
  正しく解けて正しい代金が小数の中間結果（`%`表記ではなく）とともに表示されること、
  コンソールにJavaScriptエラーが出ていないこと、既存モード（4-1〜5-2）が5-3追加後も
  従来どおり動作すること、をすべて確認済みです（カード・解答欄の百分率表示変更を含む）。
- 詳しいチェック項目は[16章の「小学5年生・3学期（5-3モード、第9段階）」](#16-動作確認用チェックリスト)、
  テンプレート追加時のチェック項目は[17章の「quantityRelationを持つテンプレート」「百分率の
  テンプレート」「割引・増量のテンプレート」](#17-問題データ追加時のチェック項目)を参照してください。

## 22. 小学6年生・1学期（第10段階）

小学5年生・3学期に続く、**通常バトルの正式モード**として `gradeTerm: "6-1"` を追加しました。
新出内容は「分数×整数」「分数×分数」「分数÷整数」「整数÷分数」「分数÷分数」「分数倍・比べる量」
「分数倍・もとの量」「単位量あたり（分数）」の8カテゴリで、すべて1段階問題です。小学4年生3学期
からたし算・ひき算のみだった分数の計算に、第10段階で初めてかけ算・わり算を追加しています。

### 分数のかけ算・わり算を「実データ」で初めて使用（fraction-utils.js）

`js/fraction-utils.js` の `multiplyFractions`/`divideFractions` は、実は第9段階以前から
「将来の小学6年生対応を見据えて」用意されていた関数でした。

```js
export function multiplyFractions(a, b) {
  return simplifyFraction({
    type: "fraction",
    numerator: a.numerator * b.numerator,
    denominator: a.denominator * b.denominator
  });
}

export function divideFractions(a, b) {
  if (b.numerator === 0) return null; // 0でわる
  return simplifyFraction({
    type: "fraction",
    numerator: a.numerator * b.denominator,
    denominator: a.denominator * b.numerator
  });
}
```

`divideFractions` は「右辺の逆数をかける」という教科書どおりの方法（`a/b ÷ c/d = a/b × d/c`）で
実装されており、右辺の分子が0（0でわる）の場合は `null` を返す安全設計もすでに備わっていました。
そのため第10段階では、これらの関数自体には手を加えず、**分数×整数・整数÷分数のように整数が
混在する組み合わせ**を扱うための3つの関数だけを新規に追加しています。

```js
export function multiplyFractionByInteger(fraction, integer) {
  if (!Number.isInteger(integer)) return null; // 小数は今回未対応
  return simplifyFraction({ type: "fraction", numerator: fraction.numerator * integer, denominator: fraction.denominator });
}
export function divideFractionByInteger(fraction, integer) {
  if (!Number.isInteger(integer) || integer === 0) return null;
  return simplifyFraction({ type: "fraction", numerator: fraction.numerator, denominator: fraction.denominator * integer });
}
export function divideIntegerByFraction(integer, fraction) {
  if (!Number.isInteger(integer) || fraction.numerator === 0) return null;
  return simplifyFraction({ type: "fraction", numerator: integer * fraction.denominator, denominator: fraction.numerator });
}
```

整数を分母1の分数として扱ってから `multiplyFractions`/`divideFractions` に渡す設計ではなく、
専用の関数を用意したのは、整数側が本当に整数かどうか（`Number.isInteger()`）を確認してから
計算するためです（今回は分数×小数・分数÷小数を想定していないため、意図せず小数が渡された場合は
`null` を返して安全に失敗させます）。

### 分数の乗除は「割り切れることの事前保証」が不要

小数のわり算（小数÷整数・小数÷小数）を追加した第7段階・第8段階では、「先に商とわる数を決めてから
わられる数を逆算する」という専用の生成ロジック（`generateExactDecimalDivisionValues()` など）が
必要でした。これは、小数の除算が「必ずしも割り切れるとは限らない」ためです。

分数の乗除にはこの制約が一切ありません。`a/b ÷ c/d` は、`c/d` の分子が0でない限り、
必ず正確な分数 `ad/bc` として計算できます（あまりが出ることも、循環小数になることもありません）。
そのため、分数×整数・分数×分数・分数÷整数・整数÷分数・分数÷分数の5カテゴリはすべて、
専用の生成関数を持たない `"standard"` のエイリアス（`generateStandardValues()` がそのまま使われる）
として実装できました。テンプレート側で気をつけるべきことは「わる数（またはその分子）を0にしない」
という、変数の範囲設計だけです。

### 分数倍（比べる量・もとの量）

小数倍（第7段階）・速さ・割合（第9段階）と同じ「もとにする量×何か＝比べる量」という
`quantityRelation` の枠組みに、分数倍を追加しました。

```js
quantityRelation: {
  type: "fraction-multiplicative-comparison",
  baseKey: "baseAmount", comparedKey: "comparedAmount", multiplierKey: "multiplier", unknown: "compared"
}
```

小数倍との違いは、もとにする量（`baseKey`）が整数、分数倍（`multiplierKey`）が分数という点だけです。
値の生成（`generateFractionMultiplicativeComparisonValues()`）は、`base×multiplier` の計算を
小数倍のときの `multiplyDecimal()` ではなく、`js/value-utils.js` の `calculateValues()` に
委譲しています。`calculateValues(整数, "×", 分数)` は「整数×分数の交換法則」まで含めて正しく
計算できるため、分数専用の掛け算処理をこの関数の中に書く必要がありませんでした。

```js
function generateFractionMultiplicativeComparisonValues(variables, quantityRelation) {
  const { baseKey, comparedKey, multiplierKey } = quantityRelation;
  return generateFractionProportionalValues(variables, baseKey, multiplierKey, comparedKey);
}
```

「もとの量を求める」問題（`unknown:"base"`）の解法ルートは `comparedAmount ÷ multiplier` です。
`comparedAmount` は整数のことも分数のこと（`base×multiplier` が割り切れない場合）もありますが、
どちらであっても `calculateValues()` が型を自動判定して正しく計算するため、値生成側で
場合分けをする必要はありません。この逆算（比べる量÷分数倍＝もとの量）は、分数の乗除がすべて
**整数の分子・分母どうしの正確な計算**（浮動小数点数を一切経由しない）であるため、小数のときの
ような「誤差なく逆算できるか」を気にする必要がなく、常に理論上も実装上も完全に一致します。

### 単位量あたり（分数）の追加

分数倍を実装した際、値の生成ロジック（`base×multiplier=compared` を計算する部分）は
`generateFractionMultiplicativeComparisonValues()` に直書きしていました。「単位量あたり（分数）」を
「単位量あたり（分数）」（単位数×1単位あたりの量＝全体量。単位数・1単位あたりの量の**どちらも
分数**になりうる点が、5年生2学期の単位量あたりと異なります）を追加するにあたり、この2つの
カテゴリが「2つの既知の値から積にあたる3つ目の値を求める」という全く同じ構造を持つことに
気づいたため、小数版の `generateProportionalValues()` と同じ考え方で、分数版の共通ロジックを
`generateFractionProportionalValues(variables, aKey, bKey, productKey)` として汎用化し、
分数倍・単位量あたり（分数）の両方がこれを共有するようにリファクタリングしました。

```js
function generateFractionProportionalValues(variables, aKey, bKey, productKey) {
  const aValue = pickValueForRange(variables[aKey]);
  const bValue = pickValueForRange(variables[bKey]);
  const productValue = calculateValues(aValue, "×", bValue);
  return { [aKey]: aValue, [bKey]: bValue, [productKey]: productValue };
}

function generateFractionUnitRateValues(variables, quantityRelation) {
  const { unitCountKey, perUnitKey, totalKey } = quantityRelation;
  return generateFractionProportionalValues(variables, unitCountKey, perUnitKey, totalKey);
}
```

`quantityRelation.type: "fraction-unit-rate"` は `unitCountKey`・`perUnitKey`・`totalKey`・
`unknown` を持ち、`js/question-validator.js` の `QUANTITY_RELATION_TYPE_CONFIG` にも
既存の `"unit-rate"`（小数版）とは別に登録しています（既知の2キー・自動計算される1キーの
組み合わせ自体は小数版と同じですが、`type` 文字列を分けることで、分数版のテンプレートに
小数版の `generatorType`（`unitRate`/`totalFromUnitRate`）を誤って指定してしまうミスを
検証段階で検出できます）。5種類のテンプレートはすべて `unknown:"perUnit"`（1単位あたりの
量を求める）で、解法ルートは `total ÷ unitCount = perUnit` です。

### カードに載る「操作前の値」が整数に約分できてしまう場合の表示

分数倍・分数×分数のように「仮分数を含めてよい」テンプレートでは、生成された分数がたまたま
整数に約分できる分子・分母の組み合わせ（例: `numerator:6, denominator:3` → 約分すると `2/1`）に
なることがあります。これまでの `js/value-renderer.js` の `renderValueHtml()` は、分数を渡された
場合に必ず縦型分数のHTML（横線の上に分子・下に分母）を生成していたため、この場合「2」の下に
「1」を表示する不自然な見た目になってしまうことが実装中に判明しました。

```js
if (isFractionValue(value)) {
  const s = simplify ? simplifyFraction(value) : value;
  if (s.denominator === 1) {
    return escapeHtml(formatNumber(s.numerator, { useSeparator }));
  }
  // ...縦型分数のHTMLを生成...
}
```

約分した結果の分母が1になる場合は、縦型分数ではなく通常の整数として表示するようにしました。
これは「計算結果」の整数化（`js/value-utils.js` の `normalizeValue()`）とは別の話で、**まだ
何も計算していない、カードに直接載る生の値**が、たまたま約分可能な形で生成された場合の表示を
扱っています。デバッグ用テキスト専用の `formatValue()` にも同じ挙動を揃え、
`js/question-validator.js` の分数表示検証（`validateValueRepresentation()`）も、実際に
縦型分数として描画される場合だけ `aria-label` の形式をチェックするよう修正しています。

### 出題比率・トレーニングモードへの統合

6-1モードの出題プランも、既存の `planQuestionSequence()` / `GRADE_TERM_PLAN_CONFIG` の仕組みを
そのまま使っています。追加したのは次の1エントリだけです。

```js
"6-1": {
  newContentGradeTerms: ["6-1"],
  reviewGradeTerms: ["4-1", "4-2", "4-3", "4-multi-step", "5-1", "5-2", "5-3"]
}
```

> **運用開始後の変更について**: `reviewGradeTerms` は上記の第10段階時点のものです。運用開始後、
> 6-1モードの復習内容から4年生の内容（`"4-1"` `"4-2"` `"4-3"` `"4-multi-step"`）を除外し、
> 現在は `reviewGradeTerms: ["5-1", "5-2", "5-3"]` になっています。

新内容側は8カテゴリを均等に近い頻度で配分する既存のラウンドロビン方式（`buildRoundRobinLabels()`）が
そのまま使われます。新内容の数は最大でもレベルMAXの6問（8カテゴリ以下）のため、ラウンドロビンが
一周して重複することはありません（レベル1〜5・MAXすべてで、Node.jsテストにより新内容:復習が
正確に1:1になることと、8カテゴリの出現数に極端な偏りがないことを確認済みです）。

トレーニングモードへの統合も、`data/category-registry.js` に8カテゴリ（order 31〜38）を
追加しただけです。`js/training-mode.js` `js/ui.js` `tools/question-validator.html` は
いずれもレジストリから動的に読み込むため、コードの変更は一切不要でした（単位量あたり（分数）を
追加した際も同様に、レジストリへの追加だけで済んでいます）。

```js
{ id: "fraction-times-integer", label: "分数×整数", gradeTerm: "6-1", gradeLabel: "小学6年生・1学期", enabledInTraining: true, order: 31 },
{ id: "fraction-times-fraction", label: "分数×分数", gradeTerm: "6-1", gradeLabel: "小学6年生・1学期", enabledInTraining: true, order: 32 },
{ id: "fraction-divided-by-integer", label: "分数÷整数", gradeTerm: "6-1", gradeLabel: "小学6年生・1学期", enabledInTraining: true, order: 33 },
{ id: "integer-divided-by-fraction", label: "整数÷分数", gradeTerm: "6-1", gradeLabel: "小学6年生・1学期", enabledInTraining: true, order: 34 },
{ id: "fraction-divided-by-fraction", label: "分数÷分数", gradeTerm: "6-1", gradeLabel: "小学6年生・1学期", enabledInTraining: true, order: 35 },
{ id: "fraction-multiplier-compared-amount", label: "分数倍・比べる量", gradeTerm: "6-1", gradeLabel: "小学6年生・1学期", enabledInTraining: true, order: 36 },
{ id: "fraction-multiplier-base-amount", label: "分数倍・もとの量", gradeTerm: "6-1", gradeLabel: "小学6年生・1学期", enabledInTraining: true, order: 37 },
{ id: "fraction-unit-rate", label: "単位量あたり(分数)", gradeTerm: "6-1", gradeLabel: "小学6年生・1学期", enabledInTraining: true, order: 38 }
```

### 現在の難易度・スコア・ランク・タイマー仕様（変更なし）

依頼文には、レベルMAXのハート数・スコア加算式・ランク係数・タイマー加速上限について、
このアプリの現在の実装と完全に一致する数値が明記されていました。実装前に `js/game.js`
`js/score.js` を確認し、以下がすべて依頼文どおりであることを確認済みです（変更していません）。

| 項目 | 現在の実装 |
|---|---|
| レベルMAXの内部レベル | 6 |
| レベルMAXのハート数 | 2個 |
| レベルMAXの必要正解数 | 12問（`2×内部レベル`） |
| レベルMAXの初期制限時間 | 20秒（`120秒÷内部レベル`） |
| 正解時の加算スコア | `(10+n)×(10+タイムボーナス)×20` |
| ランク係数 | `現在のスコア÷(1600×レベル)`（MAXは`÷9600`） |
| タイマー加速倍率 | `1+(n-1)/(N-1)`、1問目1.0倍・最終問題2.0倍 |

### 既存機能への影響

6-1追加にあたって変更したのは、次のファイル・箇所だけです。それ以外の既存ファイル
（`js/training-mode.js` `js/storage.js` `js/enemy-list.js` `js/multi-step-engine.js`
`js/answer-checker.js` `js/percentage-utils.js` `js/score.js` など）は無改造です。

| ファイル | 変更内容 |
|---|---|
| `js/fraction-utils.js` | `multiplyFractionByInteger()`・`divideFractionByInteger()`・`divideIntegerByFraction()` を新規追加（`multiplyFractions`/`divideFractions` 自体は無改造。第9段階以前からすでに実装済みだった） |
| `js/value-utils.js` | `calculateValues()` に分数×分数・分数÷分数・分数×整数・整数×分数・分数÷整数・整数÷分数を追加、`toFractionValue()`・`isZeroValue()` を新規追加（`isZeroValue()` は0でわるチェックを型を意識せず行うためのヘルパーで、`question-validator.js` 側の既存チェックもこれに統一） |
| `js/value-renderer.js` | `renderValueHtml()` に、分数の約分結果が分母1（整数）になる場合は縦型分数ではなく整数として表示する分岐を追加。`js/value-utils.js` の `formatValue()` にも同じ挙動を追加 |
| `js/question-generator.js` | 新しい `generatorType` 8種（`fractionTimesInteger`/`fractionTimesFraction`/`fractionDividedByInteger`/`integerDividedByFraction`/`fractionDividedByFraction`/`fractionMultiplierFindCompared`/`fractionMultiplierFindBase`/`fractionUnitRate`）・`generateFractionProportionalValues()`（汎用化。`generateFractionMultiplicativeComparisonValues()`と`generateFractionUnitRateValues()`が共有）・`QUANTITY_RELATION_GENERATOR_TYPES`/`GRADE_TERM_PLAN_CONFIG` の拡張（`fractionUnitRate` を含む） |
| `js/question-validator.js` | `VALID_GRADE_TERMS` に `"6-1"` を追加・新しい `generatorType` 8種のルール・`QUANTITY_RELATION_TYPE_CONFIG` に `fraction-multiplicative-comparison`／`fraction-unit-rate` を追加・分数のaria-labelチェックを実際に縦型分数として表示される場合だけ行うよう修正 |
| `data/grade6-term1.js` | 新規ファイル（計40テンプレート。単位量あたり（分数）5種類を含む） |
| `data/index.js` | `grade6-term1.js` の import・`TEMPLATE_SETS_BY_GRADE_TERM` への登録 |
| `data/category-registry.js` | 8カテゴリを追加（order 31〜38。単位量あたり（分数）を含む） |
| `js/game.js` | `PLANNED_GRADE_TERMS` に `"6-1"` を追加（出題プランを使うモードとして登録するだけ） |
| `js/ui.js` | `RANGE_LABELS` に `"6-1": "小学6年生・1学期"` を追加 |
| `index.html` | 「6年1学期」ボタンの `disabled` を解除し、`data-range="6-1"` を設定 |

`js/game.js`・`js/score.js`・`js/storage.js` のハート数・スコア・ランク・タイマー加速・
ハイスコアキーの仕組みはレベル・`gradeTerm`に対して汎用的な実装のため、6-1にもそのまま
（無改造で）正しく適用されています。

### 動作確認・検証の進め方

- Node.js での単体検証: 分数のかけ算・わり算（`2/3×3/4=1/2`、`3/4÷3/8=2`、`5/6÷2/9=15/4` など、
  依頼文にある計算例をすべて）・約分（`6/12→1/2` など）・同値判定・0でわる不正値（`3/4÷0` など）を
  個別に確認した上で、40テンプレートそれぞれについて40回ずつ、レベル1〜MAXの出題プランを
  20回ずつ、トレーニングの5問セットを8カテゴリそれぞれ20回ずつ生成し、`validateGeneratedQuestion()`
  ですべて検証（全件成功）。カテゴリレジストリ全体（38件）の整合性検証も実施しています。
- ブラウザでの回帰確認（Playwright）: タイトル画面の「6年1学期」ボタン表示、バトルモード
  （レベル1・レベルMAX）でのカウントダウン→問題文・選択肢カードの表示（縦型分数として正しく
  描画され、`[object Object]`や`undefined`/`NaN`が出ないこと）、トレーニングモードの8カテゴリ
  すべてでの出題確認、`?debug=true` の正解式を読み取って実際にカードを配置し、8カテゴリ全問
  正しい答えが計算・表示されることを1つずつ確認（分数÷分数の約分・整数÷分数の逆数計算・
  分数倍のもとの量の逆算・単位量あたり（分数）の除算を含む）、コンソールにJavaScriptエラーが
  出ていないこと、既存モード（4-1〜5-3、分数・小数・百分率を含む）が6-1追加後も従来どおり
  動作すること、をすべて確認済みです。
- 詳しいチェック項目は[16章の「小学6年生・1学期（6-1モード、第10段階）」](#16-動作確認用チェックリスト)、
  テンプレート追加時のチェック項目は[17章の「quantityRelationを持つテンプレート」「分数の乗除の
  テンプレート」](#17-問題データ追加時のチェック項目)を参照してください。

## 23. 小学6年生・2学期（第11段階）

小学6年生・1学期に続く、**通常バトルの正式モード**として `gradeTerm: "6-2"` を追加しました。
新出内容は「分数の速さ」「分数の道のり」「分数の時間」「分数割合・比べる量」「分数割合・割合」
「分数割合・もとにする量」「比を使った数量」「比例配分」の8カテゴリです。速さ3カテゴリ・
比を使った数量は2段階問題、比例配分は3段階問題、分数割合3カテゴリは1段階問題です。
今回は比を「比を使った数量」「比例配分」の2カテゴリでのみ内部データとして使い、比を簡単にする問題・
比の値・比例・反比例・縮尺（小学6年生3学期の内容）は対象外としています。

### 複数段階問題エンジンの「ちょうど2段階」から「1〜3段階」への汎用化

依頼文には「中間結果を複数回参照する3段階の問題（比例配分）に対応してほしい」という要求がありましたが、
実装前に `js/multi-step-engine.js`・`js/question-generator.js` を調査したところ、**進行管理の本体は
もともと段階数に依存しない実装**であることが分かりました。`problem.multiStep.currentStepIndex` と
`totalSteps` を比較して「最後の式かどうか」を判定する作りのため、`totalSteps` が2でも3でも
同じコードがそのまま動きます。

```js
// js/multi-step-engine.js（抜粋、無改造の既存コード）
if (stepIndex === route.steps.length - 1 && !outcome.isFinal) { /* ... */ }
```

段階数に依存していたのは、次の2箇所だけでした。

1. **`js/question-validator.js` の構造検証** — `REQUIRED_MULTI_STEP_COUNT = 2` という定数で
   「ちょうど2要素」を要求していた箇所を、`MIN_MULTI_STEP_COUNT = 1` / `MAX_MULTI_STEP_COUNT = 3`
   による範囲チェックに変更し、あわせて「同じテンプレート内の複数ルートは全ルートが同じ段階数か」
   という整合性チェックを追加しました。
2. **`js/ui.js` の進行表示文言** — `updateStepIndicator()` が `式 ${index+1}／2` のように
   `2` を直書きしていた箇所を、`problem.multiStep.totalSteps` を参照する形に書き換えました。
   あわせて、2段階目以降は「1つ前の式の内容＋の続きを答えよう」という表示にし、3段階問題でも
   今どの式まで解いたかが一目で分かるようにしています。

```js
function updateStepIndicator(problem) {
  const state = problem.multiStep;
  const progressLabel = `式 ${state.currentStepIndex + 1}／${state.totalSteps}`;
  const prevStep = state.completedSteps.find((s) => s.stepIndex === state.currentStepIndex - 1);
  // prevStep があれば「◯＋◯＝◯の続きを答えよう」、無ければ「式を${totalSteps}つ答えよう！」
}
```

**運用開始後にさらに変更**: 上記の実装は「式 ○／○：」という進行番号を表示し、かつ
2段階前より前の式は表示しない（3段階目では直前の1つの式しか見えない）ものでしたが、
ユーザー報告を受けて次のように変更しました。

- 進行番号（「式 ○／○：」）の表示を廃止し、「式を3つ答えよう！」／「（それまでの式）の続きを
  答えよう」のように、番号を出さずに文章だけで進行を伝える形にしました。
- `prevStep`（直前の1つの式だけを探す）を `prevSteps`（現在のステップより前の**すべて**の
  完了済みステップを `stepIndex` 順に集める）に変更し、3段階問題の3段階目では
  「4+5=9 → 90÷9＝10 の続きを答えよう」のように、1段階目・2段階目の式を両方「→」でつなげて
  表示するようにしています。

```js
function updateStepIndicator(problem) {
  const state = problem.multiStep;
  const prevSteps = state.completedSteps
    .filter((s) => s.stepIndex < state.currentStepIndex)
    .sort((a, b) => a.stepIndex - b.stepIndex);
  // prevSteps が1件以上あれば「◯＋◯＝◯ → ◯÷◯＝◯の続きを答えよう」（すべて「→」でつなげる）、
  // 無ければ「式を${state.totalSteps}つ答えよう！」
}
```

このほか、`js/question-generator.js` の `generateMultiStepQuestionFromTemplate()` が
`textParts`（分数を含む問題文）に対応していなかった点（既存は `template` 文字列専用だった）を
1段階問題側の実装にならって追加し、`js/multi-step-engine.js` の履歴生成（`buildHistoryEntry()`）にも
`textParts` を伝播させています。**依頼文が挙げていた「意味を持つ単位付き中間結果」の実装方針**
（`semanticRole`/`unit` フィールドを持つ拡張フラクションオブジェクト）は、既存コードとの整合性を
優先し、より単純な「ステップの `resultType` で表示形式だけを制御する」設計（後述）に置き換えています。

### 比の内部データ型（js/ratio-utils.js）

「比を使った数量」「比例配分」の問題文には比（例: `みかんとりんごの数の比は5：3です`）が登場しますが、
比そのものを式に使ったり、選択肢カードとして操作させたりすることは今回のスコープ外です（依頼文にも
「：」演算子カードは追加しないよう明記されていました）。そこで、比は**表示・メタデータ専用**の
新しい値の型として実装しています。

```js
// js/ratio-utils.js
export function createRatio(antecedent, consequent) {
  return { type: "ratio", antecedent, consequent };
}
export function formatRatio(ratio) {
  return `${ratio.antecedent}：${ratio.consequent}`; // 全角コロン
}
```

`js/value-utils.js` の `getValueType`/`formatValue`/`valueKey` と `js/value-renderer.js` の
`renderValueHtml` に、既存の整数・小数・分数・百分率と同じように比の分岐を追加しています。ただし
`calculateValues()`（式の計算）には一切関与させていません。比の値は `textParts` の値パーツとして
問題文に埋め込むか、`quantityRelation` のメタデータとして解答ロジック（比の前項・後項を取り出す）に
使うだけで、選択肢カード・解答欄・正解式には一度も登場しません。

```css
/* css/style.css */
.ratio-value {
  white-space: nowrap; /* 「5：3」が前項・コロン・後項の間で改行しないように */
  font-weight: 800;
}
```

依頼文の元の設計（`sumRatioTerms` 等に加えて `simplifyRatio`／比を分数として返す関数）のうち、
比を簡単にする問題・比の値は今回追加しないカテゴリのため、それらの関数（`normalizeRatio` は
将来のための最小限の実装のみ）は今回のテンプレートからは呼び出されません。

### 分数の速さ・道のり・時間（分↔時間の単位換算、2ルート）

小学5年生3学期の速さ（[21章](#21-小学5年生3学期第9段階)）は、km/時・m/分・m/秒のいずれか
1種類の単位だけを使い、単位換算を行わない1段階問題でした。6年2学期の「分数の速さ」は、
**分で与えられた時間を分数の時間（km/時）に変換してから計算する**、単位換算を含む2段階問題です。

```js
// data/grade6-term2.js（分数の速さ、例）
{
  id: "g6t2_speed_find_speed_001",
  questionType: "multiStep",
  totalSteps: 2,
  variables: { distance: {...}, minutes: {...} }, // 分数の速さ = distance ÷ (minutes÷60)
  generatorType: "fractionSpeedWithMinuteConversion", // "standard" のエイリアス
  solutionRoutes: [
    {
      id: "convert-time-route", // 分を時間（分数）に変換してから道のり÷時間
      steps: [
        { left:{source:"variable",key:"minutes"}, operator:"÷", right:{source:"literal",value:60},
          resultType:"fraction", resultKey:"hours" },
        { left:{source:"variable",key:"distance"}, operator:"÷", right:{source:"result",key:"hours"},
          resultType:"numberOrFraction", resultKey:"answer" }
      ]
    },
    {
      id: "per-minute-route", // 1分あたりの速さを求めてから60倍する
      steps: [
        { left:{source:"variable",key:"distance"}, operator:"÷", right:{source:"variable",key:"minutes"},
          resultType:"fraction", resultKey:"speedPerMinute" },
        { left:{source:"result",key:"speedPerMinute"}, operator:"×", right:{source:"literal",value:60},
          resultType:"numberOrFraction", resultKey:"answer" }
      ]
    }
  ]
}
```

「分数の道のり」「分数の時間」も、既知の量が変わるだけで同じ2ルート構成です（道のりは
`時間×速さ` と `分速×分`、時間は `道のり÷速さ` と `道のり÷分速`）。単位換算のステップ
（÷60）には `resultType:"fraction"` を指定し、割り切れる場合でも小数（例: `0.333...`ではなく
実際には`20÷60`は循環小数になるため常に分数が必要）ではなく分数のまま計算・表示するようにしています。
依頼文にあった具体例（`20÷60=1/3`、`5÷1/3=15`、`50÷60=5/6`、`72×5/6=60` など）はすべて
Node.jsの単体テストで個別に確認済みです。km↔mやm/分↔m/秒のような、分↔時間以外の単位換算は
依頼文の指示どおり今回対象外としています。

### resultType:"fraction" ―― 割り切れても分数のまま表示する

`resultType:"percent"`（第9段階）は「計算自体は普通の数値の割り算だが、結果の**型**を百分率に
変換する」ものでした。分数の速さ・分数割合・割合で必要になったのは、これと少し違う要求です。
`12÷20` のような式は、通常の `calculateValues()` なら**小数として正確に計算できてしまう**ため
`0.6` が返りますが、教科書の解き方に合わせて**必ず分数のまま**（`3/5`）表示したいケースがあります。

```js
// js/question-generator.js
function computeStepResult(left, operator, right, resultType) {
  if (resultType === "fraction" && operator === "÷") {
    const forced = divideValuesAsFraction(left, right); // 小数計算を経由せず、必ず分数として計算
    if (forced !== null) return forced;
  }
  const result = safeCalculate(left, operator, right);
  if (resultType === "percent" && typeof result === "number") {
    return ratioToPercent(result);
  }
  return result;
}
```

`divideValuesAsFraction()`（`js/value-utils.js`、新規）は、両辺を `toFractionValue()` で
分数化してから `fraction-utils.js` の `divideFractions()` で計算するため、割り切れるかどうかに
関わらず必ず分数の値オブジェクトを返します。この関数は `js/question-generator.js`（生成時）と
`js/question-validator.js`（生成済み問題の再計算による検証）の両方に実装しており、
どちらか一方だけが `resultType:"fraction"` を認識していると、検証側が「不一致」と誤判定してしまう
ため、同じロジックを重複実装しています（`resultType:"percent"` のときと同じ設計上の理由です）。

### 分数割合（比べる量・割合・もとにする量）

小学5年生3学期の割合（[21章](#21-小学5年生3学期第9段階)）と同じ「もとにする量×割合＝比べる量」の
`quantityRelation` の枠組みに、百分率ではなく**分数**の割合を追加しました。

```js
quantityRelation: {
  type: "fraction-rate",
  baseKey: "baseAmount", comparedKey: "comparedAmount", rateKey: "rate", unknown: "compared"
}
```

値の生成（`generateFractionRateValues()`）は、6年1学期の分数倍・単位量あたり（分数）と同じ
`generateFractionProportionalValues(variables, aKey, bKey, productKey)` を再利用しています。
「分数割合・割合」（`unknown:"rate"`）だけは `resultType:"fraction"` を指定し、
`comparedAmount÷baseAmount` が割り切れる場合でも必ず分数のまま表示されるようにしています
（百分率のような小数⇔百分率の変換とは混在させず、分数のまま扱う、という依頼文の指示どおりです）。

実装中、「分数割合・割合」「分数割合・もとにする量」の2カテゴリで構造検証エラーが発生しました。
原因は2つあり、1つは `baseAmount` の範囲の `step` が `rate` の分母の倍数になっておらず、
`comparedAmount = baseAmount×rate` がたまたま非整数の分数になって、整数専用の `template` 文字列に
分数オブジェクトが紛れ込んでいたこと（`baseAmount` の `step` を分母の倍数にそろえて解決）。
もう1つは、「分数割合・もとにする量」のテンプレートで `variables` のキー名を誤って
`comparedAmount` にしていたこと（`generateFractionRateValues()` は常に固定のキー名
`baseAmount`/`rate` を読むため、テンプレート側の「見えている量」がどちらであっても
`variables` のキー名自体は変えてはいけません。6年1学期の割合・平均などと同じ既存の設計です）。
どちらも値の生成ロジックとテンプレートデータのミスマッチだったため、テンプレート側の修正で解決しています。

### 比を使った数量・比例配分（非対称なquantityRelation）

速さ・分数割合は「2つの既知のキーの組み合わせが `unknown` によらず常に同じ」構造でしたが、
比を使った数量・比例配分は**どちらの量が既知かによって、生成すべき変数の組み合わせ自体が変わる**
構造のため、既存の `QUANTITY_RELATION_TYPE_CONFIG` の汎用チェックには当てはめず、専用の
検証関数（`validateRatioApplication()`／`validateProportionalAllocation()`）を用意しました。

```js
// data/grade6-term2.js（比を使った数量、例）
// 「みかんとりんごの数の比は5：3。みかんが20個なら、りんごは何個？」
{
  variables: { firstRatio: {values:[5]}, secondRatio: {values:[3]}, unitAmount: {min:2,max:12,step:1} },
  generatorType: "ratioApplication", totalSteps: 2,
  quantityRelation: { type:"ratio-application",
    firstRatioKey:"firstRatio", secondRatioKey:"secondRatio",
    firstAmountKey:"firstAmount", secondAmountKey:"secondAmount", known:"firstAmount" },
  solutionRoutes: [{ steps: [
    { left:{source:"variable",key:"firstAmount"}, operator:"÷", right:{source:"variable",key:"firstRatio"}, resultKey:"unit" },
    { left:{source:"result",key:"unit"}, operator:"×", right:{source:"variable",key:"secondRatio"}, resultKey:"answer" }
  ]}]
}
```

`unitAmount`（比の1あたりにあたる量）は、生成時にだけ使う非表示変数です。既知の量
（`firstAmount` または `secondAmount`、どちらが既知かはテンプレートごとに `known` で指定）は
`unitAmount×対応する比の項` として逆算されるため、必ず割り切れる整数になります（第10段階の
「単位量あたり」以来、繰り返し使っている「先に商を決めて逆算する」パターンです）。

**運用開始後に追加**: 比例・対応する量の `multiplier-first-route`（[24章](#24-小学6年生3学期第12段階)
参照）と同じ考え方の別解ルートを、比を使った数量の5テンプレートすべてに追加しました。
「未知の比の項÷既知の比の項＝何倍か」→「既知の量×何倍か＝答え」というルートです
（例:「犬とねこの比は4：3、ねこ15頭のとき犬は？」で `4÷3=4/3→15×4/3=20`）。比の項どうしの
わり算は割り切れるとは限らない（この例では`4/3`）ため、`resultType:"fraction"` を指定して
分数のまま正確に計算しています。`validateRatioApplication()` は、`known`（既知の量）の値から
「既知の比の項」「未知の比の項」を動的に判定し、`multiplier-first-route` の1つ目の式が
正しく「未知÷既知」の順序になっているか（前項・後項を取り違えていないか）まで検証します。

```js
// data/grade6-term2.js（比例配分、例）
// 「合計200個のあめを、姉と妹で5：3に分けます。姉のぶんは何個？」
{
  variables: { firstRatio: {values:[5]}, secondRatio: {values:[3]}, unitAmount: {min:5,max:25,step:1} },
  generatorType: "proportionalAllocation", totalSteps: 3,
  quantityRelation: { type:"proportional-allocation",
    firstRatioKey:"firstRatio", secondRatioKey:"secondRatio", totalKey:"totalAmount", target:"first" },
  solutionRoutes: [{ steps: [
    { left:{source:"variable",key:"firstRatio"}, operator:"+", right:{source:"variable",key:"secondRatio"}, resultKey:"ratioSum" },
    { left:{source:"variable",key:"totalAmount"}, operator:"÷", right:{source:"result",key:"ratioSum"}, resultKey:"unit" },
    { left:{source:"result",key:"unit"}, operator:"×", right:{source:"variable",key:"firstRatio"}, resultKey:"answer" }
  ]}]
}
```

比例配分は依頼文で「合計÷片方の比の項×もう片方の比の項」という2段階のショートカット計算を
**正解ルートとして登録しないこと**が明示されていました。教科書の解き方（比の和を先に求める3段階）
以外の計算方法でも答え自体は一致してしまいますが、`solutionRoutes` に登録していない式は
`answer-checker.js` が不正解として扱うため、意図せずショートカットが正解になることはありません。
`validateProportionalAllocation()` は、各ルートの演算子の並びが必ず `["+", "÷", "×"]` になっている
ことを検証段階でもチェックし、誤って2段階の別解を登録してしまうミスを防いでいます。

**運用開始後に追加**: 標準ルート（比の和→1あたりの量→対象の比の項）に加えて、「比の和→
対象の比の項÷比の和＝何倍か→合計×何倍か＝答え」という別解ルート（`ratio-fraction-route`）を
5テンプレートすべてに追加しました（例:「リボン28cmを4：3に分ける、姉の分は？」で
`4+3=7→4÷7=4/7→28×4/7=16`）。1段階目（比の和を求める式）は両方のルートで完全に同じ式のため、
`multi-step-engine.js`の候補ルート絞り込み機構がそのまま両立させます。標準ルートと
`ratio-fraction-route` はどちらも演算子の並びが `["+", "÷", "×"]` で同じになるため、比例・
対応する量の`multiplier-first-route`と同じ理由で、並びだけでなくルートIDごとに参照している
変数・`resultType`まで個別に検証する設計にしています。禁止されている2段階ショートカットは、
そもそも3段階の要件（`steps.length===3`）を満たさないため、この検証には影響しません。

### 出題比率・トレーニングモードへの統合

6-2モードの出題プランも、既存の `planQuestionSequence()` / `GRADE_TERM_PLAN_CONFIG` の仕組みを
そのまま使っています。追加したのは次の1エントリだけです。

```js
"6-2": {
  newContentGradeTerms: ["6-2"],
  reviewGradeTerms: ["4-1", "4-2", "4-3", "4-multi-step", "5-1", "5-2", "5-3", "6-1"]
}
```

> **運用開始後の変更について**: `reviewGradeTerms` は上記の第11段階時点のものです。運用開始後、
> 6-2モードの復習内容から4年生の内容（`"4-1"` `"4-2"` `"4-3"` `"4-multi-step"`）を除外し、
> 現在は `reviewGradeTerms: ["5-1", "5-2", "5-3", "6-1"]` になっています。

新内容側は8カテゴリを均等に近い頻度で配分する既存のラウンドロビン方式（`buildRoundRobinLabels()`）が
そのまま使われます。トレーニングモードへの統合も、`data/category-registry.js` に8カテゴリ
（order 39〜46）を追加しただけです。

```js
{ id: "fraction-speed-find-speed", label: "分数の速さ", gradeTerm: "6-2", gradeLabel: "小学6年生・2学期", enabledInTraining: true, order: 39 },
{ id: "fraction-speed-find-distance", label: "分数の道のり", gradeTerm: "6-2", gradeLabel: "小学6年生・2学期", enabledInTraining: true, order: 40 },
{ id: "fraction-speed-find-time", label: "分数の時間", gradeTerm: "6-2", gradeLabel: "小学6年生・2学期", enabledInTraining: true, order: 41 },
{ id: "fraction-rate-compared-amount", label: "分数割合・比べる量", gradeTerm: "6-2", gradeLabel: "小学6年生・2学期", enabledInTraining: true, order: 42 },
{ id: "fraction-rate-rate", label: "分数割合・割合", gradeTerm: "6-2", gradeLabel: "小学6年生・2学期", enabledInTraining: true, order: 43 },
{ id: "fraction-rate-base-amount", label: "分数割合・もとにする量", gradeTerm: "6-2", gradeLabel: "小学6年生・2学期", enabledInTraining: true, order: 44 },
{ id: "ratio-application", label: "比を使った数量", gradeTerm: "6-2", gradeLabel: "小学6年生・2学期", enabledInTraining: true, order: 45 },
{ id: "proportional-allocation", label: "比例配分", gradeTerm: "6-2", gradeLabel: "小学6年生・2学期", enabledInTraining: true, order: 46 }
```

複数段階問題エンジンの1〜3段階汎用化により、`js/training-mode.js` は無改造のまま、速さ3カテゴリ
（2段階・複数ルート）・比を使った数量（2段階）・比例配分（3段階）のすべてがトレーニングモードでも
正しく進行します（第10段階までと同様、レジストリへの追加だけで済んでいます）。

### 現在の難易度・スコア・ランク・タイマー仕様（変更なし）

依頼文には、レベルMAXのハート数・スコア加算式・ランク係数・タイマー加速上限について、
このアプリの現在の実装と完全に一致する数値が明記されていました。実装前に `js/game.js`
`js/score.js` を確認し、以下がすべて依頼文どおりであることを確認済みです（変更していません）。

| 項目 | 現在の実装 |
|---|---|
| レベルMAXの内部レベル | 6 |
| レベルMAXのハート数 | 2個 |
| レベルMAXの必要正解数 | 12問（`2×内部レベル`） |
| レベルMAXの初期制限時間 | 20秒（`120秒÷内部レベル`） |
| 正解時の加算スコア | `(10+n)×(10+タイムボーナス)×20` |
| ランク係数 | `現在のスコア÷(1600×レベル)`（MAXは`÷9600`） |
| タイマー加速倍率 | `1+(n-1)/(N-1)`、1問目1.0倍・最終問題2.0倍 |

複数段階問題が3段階に増えても、敵HP・スコア・ハイスコアが変化するのは**最終ステップに正解した
とき**だけという既存の設計（`js/multi-step-engine.js`）はそのまま維持されており、比例配分の
1段階目・2段階目の正解では引き続き敵HP・スコアは変化しません。

### 既存機能への影響

6-2追加にあたって変更したのは、次のファイル・箇所だけです。それ以外の既存ファイル
（`js/training-mode.js` `js/storage.js` `js/enemy-list.js` `js/answer-checker.js`
`js/percentage-utils.js` `js/score.js` `js/fraction-utils.js` など）は無改造です。

| ファイル | 変更内容 |
|---|---|
| `js/ratio-utils.js` | 新規追加。`createRatio` `normalizeRatio` `formatRatio` `isValidRatio` `sumRatioTerms` `getRatioTerm` `areRatiosEqual` |
| `js/value-utils.js` | 比の型判定・表示（`isRatioValue` `formatValue` `valueKey` `getValueType` への分岐追加）、`divideValuesAsFraction()`（`resultType:"fraction"` 用の強制分数除算）を新規追加 |
| `js/value-renderer.js` | `renderValueHtml()` に比の表示分岐（`buildRatioAriaLabel()` を含む）を追加 |
| `css/style.css` | `.ratio-value`（比が改行されないようにする）のスタイルを追加 |
| `js/ui.js` | `updateStepIndicator()` を段階数固定から `problem.multiStep.totalSteps` を参照する形に汎用化。`buildMultiStepHistoryHtml()` の `textParts` 対応 |
| `js/multi-step-engine.js` | `buildHistoryEntry()` の `textParts` 伝播。`simulateAllRoutesToCompletion()` の最終結果比較を、分数オブジェクトでも正しく判定できるよう `areValuesEqual()` を使う形に修正（従来は `!==` による参照比較のため、複数ルートの最終結果が分数になるケースを誤って「不一致」と判定するバグがあった。実際のゲームプレイの正誤判定（`answer-checker.js`）はもともと `areValuesEqual()` を使っており影響なし）。**運用開始後に発見・修正**: `buildChoicesForActiveStep()` が、現在のステップで必要な数値を値そのものをキーにした `Map` で集約していたため、1つのステップの左辺・右辺（または複数の候補ルートが必要とする値どうし）がたまたま同じ値になる場合に、カードが1枚に集約されてしまい解答不可能になるバグがあった（例:「比を使った数量」で比の項ともとにする量への1あたりの量がどちらも6になり、正解式が`6×6`になるケース）。`valueKey()` を使って値ごとの必要枚数（ルートをまたいだ最大値）を数えてからカードを生成するよう修正。あわせて、`simulateAllRoutesToCompletion()` 内の「必要なカードがあるか」の判定（`Array.includes()` による参照比較）も、複数ルートが同じ値を共有する分数の中間結果を誤って「無い」と判定していた箇所を `areValuesEqual()` ベースに修正した |
| `js/question-generator.js` | `generateMultiStepQuestionFromTemplate()` の `textParts` 対応、`computeStepResult()`（`applyResultType()` を置き換え、`resultType:"fraction"` の強制分数除算に対応）、新しい `generatorType` 8種（速さ3種・分数割合3種・`ratioApplication`・`proportionalAllocation`）、`generateFractionRateValues()` `generateRatioApplicationValues()` `generateProportionalAllocationValues()`、`GRADE_TERM_PLAN_CONFIG` に `"6-2"` を追加。**運用開始後に追加**: `pickCoprimeRatioTerms()`（比を使った数量・比例配分の比の前項・後項を、互いに素かつどちらも1ではない整数になるまで選び直す共通ヘルパー。約分できる比（例: 6：4）や、一方が1の比を出題しないため） |
| `js/question-validator.js` | `VALID_GRADE_TERMS` に `"6-2"` を追加、複数段階問題の構造検証を「ちょうど2」から「1〜3、かつ同一テンプレート内のルート間で段階数が一致」に汎用化、`QUANTITY_RELATION_TYPE_CONFIG` に `fraction-rate` を追加、`computeStepResultForValidation()`（生成側と同じ強制分数除算を再現）、速さ・比を使った数量・比例配分専用の検証関数（`validateSpeedWithUnitConversion` `validateRatioApplication` `validateProportionalAllocation`）。**運用開始後に追加**: `validateGeneratedMultiStepQuestion()` に、生成された比（`problem.values.ratioValue`）が互いに素かつどちらも1ではないことを確認するチェックを追加（生成側の `pickCoprimeRatioTerms()` の保証を、検証側でも独立に再確認する） |
| `data/grade6-term2.js` | 新規ファイル（計40テンプレート） |
| `data/index.js` | `grade6-term2.js` の import・`TEMPLATE_SETS_BY_GRADE_TERM` への登録 |
| `data/category-registry.js` | 8カテゴリを追加（order 39〜46） |
| `js/game.js` | `PLANNED_GRADE_TERMS` に `"6-2"` を追加 |
| `js/ui.js` | `RANGE_LABELS` に `"6-2": "小学6年生・2学期"` を追加 |
| `index.html` | 「6年2学期」ボタンの `disabled` を解除し、`data-range="6-2"` を設定。「6年3学期」ボタンは引き続き `disabled`（今後追加） |
| `tools/question-validator.html` | 「段階数」フィルター（1〜3）を追加、複数段階問題の例をすべての解法ルート（1ルートのみの場合は従来どおり）を表示する形に変更 |

`js/game.js`・`js/score.js`・`js/storage.js`のハート数・スコア・ランク・タイマー加速・
ハイスコアキーの仕組みはレベル・`gradeTerm`に対して汎用的な実装のため、6-2にもそのまま
（無改造で）正しく適用されています。複数段階問題エンジンの1〜3段階汎用化は、既存の
整数2段階問題（4-multi-step）・割引/増量（5-3）の2段階問題の動作には影響しません
（`totalSteps` は常に実際の `steps` の要素数と一致しており、既存テンプレートはすべて2のままです）。

### 動作確認・検証の進め方

- Node.js での単体検証: 分数の速さ・道のり・時間の単位換算計算（`20÷60=1/3`、`5÷(1/3)=15`、
  `50÷60=5/6`、`72×5/6=60`、`72÷60=6/5`、`6/5×50=60`、`2÷(24/5)=5/12`、`5/12×60=25`、
  `24/5÷60=2/25`、`2÷(2/25)=25` など依頼文にある計算例をすべて）・分数割合の強制分数除算
  （`12÷20=3/5`、`0.6` にならないこと）・比例配分の3段階計算（`5+3=8`、`120÷8=15`、`15×5=75`、
  `15×3=45`）・比例配分の禁止ルート（`60÷20`のような2段階ショートカットが正解として登録されて
  いないこと）を個別に確認した上で、25件の複数段階テンプレートすべてについて、登録されている
  全解法ルートを実際に最後まで解けるかの完答シミュレーション（`simulateAllRoutesToCompletion()`）を
  10回ずつ実施（全件成功）。検証ページ（`tools/question-validator.html`）では40テンプレート
  それぞれについて、1段階問題は30回・複数段階問題は20回生成して `validateGeneratedQuestion()` で
  検証（全件OK）。レベル1〜MAXの出題プランを20回ずつ、
  トレーニングの5問セットを8カテゴリそれぞれ20回ずつ生成し、全件検証。カテゴリレジストリ全体
  （46件）の整合性検証も実施しています。
- ブラウザでの回帰確認（手動）: タイトル画面の「6年2学期」ボタン表示、バトルモード
  （レベル1・レベルMAX）でのカウントダウン→問題文・選択肢カードの表示（分数・比が正しく
  描画され、`[object Object]`や`undefined`/`NaN`が出ないこと）、分数の速さ・道のり・時間で
  2つの解法ルートのどちらでも正解と判定されること、比例配分で3段階目のミス・時間切れが
  1・2段階目の状態を壊さないこと、比例配分のショートカット計算が不正解になること、
  トレーニングモードの8カテゴリすべてでの出題・複数段階の進行確認、`?debug=true` の正解式を
  読み取って実際にカードを配置し、8カテゴリ全問正しい答えが計算・表示されることを1つずつ確認、
  コンソールにJavaScriptエラーが出ていないこと、既存モード（4-1〜6-1、分数・小数・百分率を含む）
  が6-2追加後も従来どおり動作することを確認してください（詳しいチェック手順は本回答の末尾の
  テスト手順一覧を参照）。
- 詳しいチェック項目は[16章の「小学6年生・2学期（6-2モード、第11段階）」](#16-動作確認用チェックリスト)、
  テンプレート追加時のチェック項目は[17章の「分数の速さ・道のり・時間のテンプレート」「比を使った
  数量・比例配分のテンプレート」](#17-問題データ追加時のチェック項目)を参照してください。

## 24. 小学6年生・3学期（第12段階）

> **運用開始後の変更について**: この章は第12段階を実装した当時の記録です。「縮尺を求める」
> カテゴリ（下記5カテゴリのうちの1つ）は、運用開始後にカテゴリごと削除しました。
> 現在の実装は4カテゴリ（比例・対応する量／反比例・対応する量／縮尺・実際の長さ／
> 縮尺・地図上の長さ）・24種類のテンプレートです。以下の記述はカテゴリ数・テンプレート数を
> 含めて当時のまま残していますが、「縮尺を求める」に関する部分は現在は存在しません。

小学6年生・2学期に続く、**通常バトルの正式モード**として `gradeTerm: "6-3"` を追加しました。
新出内容は「比例・対応する量」「反比例・対応する量」「縮尺・実際の長さ」「縮尺・地図上の長さ」
「縮尺を求める」の5カテゴリで、すべて2段階問題です。比例定数・反比例の一定の積は独立したカテゴリ
としては追加せず、式1で児童が求める中間結果として扱います。6年3学期モードは、これまでの
「新内容50%・復習50%」の2グループ方式ではなく、「5年生1〜3学期の復習」「6年生1〜2学期の復習」
「6年生3学期の新内容」の3グループを長期的に約1：1：1にする、専用の出題プランを使います。

### 比例定数・反比例の一定の積を「独立カテゴリ」にしない設計

依頼文には「比例・比例定数」「反比例・一定の積」という独立カテゴリは追加しないこと、
比例定数・一定の積は「対応する量を求める」2段階問題の**式1の中間結果**として扱うことが
明記されていました。これは、第9段階の割引・増量（「支払う割合」を式1で求めてから式2で
代金を計算する）や、第11段階の比を使った数量（「1あたりの量」を式1で求めてから式2で
対応する量を計算する）と全く同じ設計パターンです。新しい概念を発明する必要はなく、
既存の「中間結果を式1で求めさせ、最終的な答えとしては出題しない」という2段階問題の
王道パターンをそのまま比例・反比例に適用しています。

```js
// data/grade6-term3.js（比例・対応する量、例）
quantityRelation: {
  type: "direct-proportion",
  knownXKey: "knownX", knownYKey: "knownY",
  targetXKey: "targetX", targetYKey: "targetY",
  constantKey: "proportionConstant", unknown: "targetY"
},
hiddenIntermediateKeys: ["proportionConstant"],
```

`hiddenIntermediateKeys` は、依頼文にあった設計をそのまま採用したフィールドです。
`js/question-validator.js` の `validateHiddenIntermediateKeys()` が、このキーが
`template`／`textParts` で直接参照されていないかを検証します。依頼文の「単純な文字列一致
だけでなく、テンプレート変数の参照元も確認してください」という指示どおり、生成後の数値の
文字列比較ではなく、**どの変数を参照しているか**（`textParts` の `ref`）を見て判定するため、
「別の意味で同じ数値がたまたま問題文に登場した」だけの誤検出は起こりません。

### 比例・対応する量の値生成（比例定数を先に決めて逆算する）

`generateDirectProportionValues()` は、比例定数を**先に**決め、そこから
`knownY＝比例定数×knownX`、`targetY＝比例定数×targetX` を計算します。第7段階の小数倍
（`base×multiplier=compared`）以来、このアプリで繰り返し使ってきた「2つの既知の値から
積にあたる3つ目の値を求める」パターンを、比例定数・knownX・targetXの**3つの入力**から
knownY・targetYの**2つの出力**を作る形に拡張しただけです。

```js
function generateDirectProportionValues(variables, quantityRelation) {
  const { knownXKey, knownYKey, targetXKey, targetYKey, constantKey } = quantityRelation;
  const constant = pickValueForRange(variables[constantKey]);
  const [knownX, targetX] = pickDistinctValuePair(variables[knownXKey], variables[targetXKey]);
  const knownY = normalizeNumber(multiplyDecimal(constant, knownX));
  const targetY = normalizeNumber(multiplyDecimal(constant, targetX));
  return { [knownXKey]: knownX, [knownYKey]: knownY, [targetXKey]: targetX, [targetYKey]: targetY, [constantKey]: constant };
}
```

`pickDistinctValuePair()`（新規）は、`knownX` と `targetX` が偶然同じ値にならないよう
選び直す共通ヘルパーです。「縦を4cmから4cmにすると」のような不自然な問題を避けるため、
第11段階で追加した `pickCoprimeRatioTerms()`（比の前項・後項を互いに素にする）と同じ
「条件を満たすまで選び直す」設計をそのまま再利用しています。

正解ルートは、依頼文どおり最低2つ登録します。「1つ分の量を求める」ルート
（`knownY÷knownX＝比例定数`→`比例定数×targetX＝答え`）と、「比例式に相当する計算」ルート
（`knownY×targetX＝積`→`積÷knownX＝答え`）です。後者が必ず割り切れる理由は、
`knownY×targetX` が `比例定数×knownX×targetX` に等しく、これは `knownX` で必ず割り切れる
（掛けた本人を割り戻すだけ）ためで、浮動小数点の丸め誤差を気にする必要がありません。

**運用開始後に追加**: 依頼文には「何倍かを求める」解き方に、前項・後項どちらを分子にするかで
2通りの別解があるという指摘がありました。

- `multiplier-first-route`: `targetX÷knownX＝何倍か`→`knownY×何倍か＝答え`
  （例:「長さ4mの重さが300gの針金、5mでは何g？」で `5÷4=5/4（倍）→300×5/4=375`）
- `divisor-first-route`: `knownX÷targetX＝倍率`→`knownY÷倍率＝答え`
  （例:「工場で8時間に製品を160個作ります、2時間では何個？」で `8÷2=4→160÷4=40`）

どちらも `targetX÷knownX`／`knownX÷targetX` が整数として割り切れるとは限らない
（`multiplier-first-route`の例では`5/4`）ため、`resultType:"fraction"` を指定して、
必ず分数のまま正確に計算しています。2つ目のステップ（`knownY÷倍率`）は、倍率が整数に
約分された場合でも分数のままでも、`calculateValues()` が型を意識せず正しく計算するため、
特別な分岐は不要でした。`js/question-validator.js` の `validateDirectProportion()` は、
`unit-value-route` と `multiplier-first-route` がどちらも演算記号の並びが「÷,×」で
同じになる（＝並び順だけでは区別できない）ことを踏まえ、ルートIDごとに参照している変数・
`resultType`まで個別に検証する設計にしています。3つ目・4つ目のルートはどちらも任意
（2ルートのテンプレートも引き続き妥当）で、6テンプレートすべてに4ルートとも登録済みです。

### 反比例・対応する量の値生成（一定の積を両側から作る）

反比例は「一方が増えるともう一方が減る」関係のため、比例と同じ「比例定数を先に決めて
両側に掛ける」方法は使えません。代わりに、`knownX`・`targetX` と、内部専用の倍率
`variables.scaleFactor` を使い、`knownY＝targetX×倍率`、`targetY＝knownX×倍率` を
計算します。

```js
function generateInverseProportionValues(variables, quantityRelation) {
  const { knownXKey, knownYKey, targetXKey, targetYKey, productKey } = quantityRelation;
  const [knownX, targetX] = pickDistinctValuePair(variables[knownXKey], variables[targetXKey]);
  const scaleFactor = pickValueForRange(variables.scaleFactor);
  const knownY = normalizeNumber(multiplyDecimal(targetX, scaleFactor));
  const targetY = normalizeNumber(multiplyDecimal(knownX, scaleFactor));
  const product = normalizeNumber(multiplyDecimal(knownX, knownY));
  return { [knownXKey]: knownX, [knownYKey]: knownY, [targetXKey]: targetX, [targetYKey]: targetY, [productKey]: product };
}
```

`knownX×knownY＝knownX×targetX×倍率`、`targetX×targetY＝targetX×knownX×倍率` は
常に等しいため、一定の積（`productKey`）が自動的に整数のまま一致します。反比例は
当初、依頼文の指示どおり正解ルートを1つだけ登録していました（`knownX×knownY＝一定の積`→
`一定の積÷targetX＝答え`）。式1のかけ算には `commutative:true` を指定して、
`knownX×knownY` と `knownY×knownX` のどちらの順序でも正解と判定されるようにしています。

**運用開始後に追加**: 反比例でも「何倍になったか」から直接答えを求める別解が2通りある、
というユーザー報告を受け、次の2ルートを6テンプレートすべてに追加しました。

- `target-over-known-route`: `targetX÷knownX＝増えた倍率`→`knownY÷増えた倍率＝答え`
  （例:「6人で72日、9人では？」で `9÷6=3/2→72÷3/2=48`。Xが増えた分だけYを割って減らす）
- `known-over-target-route`: `knownX÷targetX＝減る倍率`→`knownY×減る倍率＝答え`
  （同じ例で `6÷9=2/3→72×2/3=48`。増えた倍率の逆数を先に求め、それをYに掛ける）

比例の `multiplier-first-route`／`divisor-first-route` と同様、どちらの式1も割り切れるとは
限らないため `resultType:"fraction"` を指定しています。`validateInverseProportion()` は、
ルートIDごとに演算子の並び・`resultType`・参照している変数（`targetX÷knownX`か
`knownX÷targetX`か、取り違えていないか）まで個別に検証します。特に2つの新ルートは、
どちらが分子でどちらが分母かを逆にすると答えが変わってしまう（反比例は積が一定であって
比例定数が一定ではないため、比例のときのような対称性が無い）ため、この検証が重要です。

### 縮尺の内部データ型（js/scale-utils.js）

縮尺は、比（`js/ratio-utils.js`）と全く同じ設計思想で実装しています。
`{type:"scale", numerator:1, denominator}` という値オブジェクトを新設し、式の計算
（カード・解答欄）には一切使わず、問題文・履歴・デバッグ表示専用にしています。

```js
// js/scale-utils.js
export function createScale(denominator) {
  return { type: "scale", numerator: 1, denominator };
}
export function formatScale(value) {
  const denominatorText = String(value.denominator).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value.numerator}：${denominatorText}`; // 例: "1：25,000"
}
```

`js/value-utils.js`・`js/value-renderer.js` への組み込みも、比のときと同じ手順
（`isScaleValue`・`getValueType`・`formatValue`・`valueKey`・`renderValueHtml` に分岐を
1つずつ追加）で完了しました。ただし、比とは異なり縮尺は「縮尺を求める」カテゴリの
**最終的な答え**になり得るため、値の同値判定 `areValuesEqual()` にも縮尺の分岐が必要でした。
これは実装中にNode.jsテストで発見したバグで、詳しくは次項で説明します。

### 実装中に見つけたバグ: areValuesEqual() が縮尺を判定できなかった

「縮尺を求める」の生成テストで、`80000÷8` の期待値と計算値が**見た目は完全に同じ縮尺
オブジェクト**なのに「一致しません」と判定される不具合が見つかりました。

```
正解式と計算結果が一致しません: 80000÷8
  => 期待値{"type":"scale","numerator":1,"denominator":10000},
     計算値{"type":"scale","numerator":1,"denominator":10000}
```

原因は `js/value-utils.js` の `areValuesEqual()` が、比（`ratio`）・縮尺（`scale`）の
分岐を一度も持っていなかったことです。分数・百分率には専用の比較ロジックがありましたが、
比はこれまで一度も「最終的な答え」になったことが無かったため（比を使った数量・比例配分の
答えは常に普通の整数でした）、この抜けが表面化しませんでした。縮尺を求めるカテゴリで
初めて「型オブジェクトそのものが答えになる」ケースが生まれ、素の数値比較にフォールバックして
`NaN`同士の比較のような形になり、常に不一致と判定されていました。

```js
// js/value-utils.js（修正後）
export function areValuesEqual(a, b) {
  if (isPercentValue(a) || isPercentValue(b)) {
    return arePercentValuesEqual(a, b);
  }
  if (isScaleValue(a) || isScaleValue(b)) {
    return areScalesEqual(a, b);
  }
  if (isRatioValue(a) || isRatioValue(b)) {
    return isValidRatio(a) && isValidRatio(b) && a.antecedent === b.antecedent && a.consequent === b.consequent;
  }
  // ...（分数・数値の既存の分岐はそのまま）
}
```

縮尺の分岐を追加するついでに、同じ理由で欠けていた比の分岐も追加しました（比は今回も
最終的な答えにはなりませんが、将来同じ抜けが再発しないための予防的な修正です）。

### 長さの単位変換（js/unit-utils.js）

長さの単位（mm・cm・m・km）は、依頼文の設計どおり「mmへの倍率」で内部管理しています。
倍率がすべて10の累乗の整数（1・10・1,000・1,000,000）のため、変換は常に正確な掛け算・
割り算になり、浮動小数点誤差を心配する必要がありません。

```js
const MM_PER_UNIT = { mm: 1, cm: 10, m: 1000, km: 1000000 };
export function convertLength(value, fromUnit, toUnit) {
  const factor = getLengthConversionFactor(fromUnit, toUnit); // MM_PER_UNIT[fromUnit] / MM_PER_UNIT[toUnit]
  return normalizeNumber(value * factor);
}
```

縮尺3カテゴリの生成（`generateScaleLengthValues()`）は、縮尺の分母（`scaleKey`）を
「きりのよい」値の一覧（`variables.scaleKey.values`。第11段階の「分数の時間」の
`answerMinutes` と同じ設計）から選び、地図上の長さ（cm、小さい整数）を独立に生成したうえで、
`実際の長さ（cm）＝地図上の長さ×縮尺の分母` を計算します。実際の長さの表示単位が`km`の
場合、変換後の値が小数第2位までに収まるよう、縮尺の分母の候補をあらかじめ1000の倍数に
そろえています（例: `25000`。地図上の長さは1〜20程度の任意の整数でよく、`地図上の長さ×25000`
は必ず`1000`の倍数になるため、`÷100000`（cmからkmへの変換）の結果が必ず小数第2位までに
収まります）。`m`表示の場合はこの制約が不要です（`÷100`は整数÷100なので常に小数第2位までに
収まります）。

3カテゴリ（縮尺・実際の長さ／縮尺・地図上の長さ／縮尺を求める）は、**どの量が「未知」でも
`variables` には常に縮尺の分母と地図上の長さの2つだけを定義する**という共通設計にすることで、
たった1つの生成関数を共有できるようにしました（分数割合の3カテゴリが `generateFractionRateValues()`
を共有するのと同じ考え方です）。「未知」がどれかは、テンプレートの `textParts` がどの変数を
問題文に出すか（`quantityRelation.unknown` はテンプレートを読む人向けのドキュメントラベルで、
実際の生成ロジックの分岐には使いません）で決まります。

### 縮尺を求める（resultType:"scaleDenominator"）

「縮尺を求める」の最終ステップは、`実際の長さ（cm）÷地図上の長さ＝縮尺の分母` という
普通の整数の割り算ですが、表示は数値ではなく縮尺（`1：n`）にしたい、という点で
第9段階の `resultType:"percent"`（数値÷数値を百分率として表示）と全く同じ構造です。
`computeStepResult()` に同じパターンでもう1つの変換を追加しました。

```js
if (resultType === "scaleDenominator" && typeof result === "number") {
  return createScale(result);
}
```

### 比例・反比例の関係表（relationTable）

関係表は、`textParts` と同じ「宣言的に書いて、生成時に実際の値へ解決する」設計にしています。

```js
// テンプレート側（宣言的）
relationTable: {
  rowHeaders: ["ノートの冊数（さつ）", "代金（円）"],
  columns: [
    [{ type: "value", ref: "knownX" }, { type: "value", ref: "knownY" }],
    [{ type: "value", ref: "targetX" }, { type: "unknown" }]
  ]
}
```

`resolveRelationTable()`（`js/question-generator.js`）が `{type:"value", ref:...}` を
実際の値に置き換え、`{type:"unknown"}` はそのまま残します。`renderRelationTableHtml()`
（`js/value-renderer.js`）が、`{type:"unknown"}` のセルだけ「？」として表示することで、
児童が求める値を関係表からも漏らさないようにしています。表は`table`要素・見出しセルに`th`を
使い、スマートフォンで横にはみ出す場合は表だけがスクロールするようにしました
（`.relation-table-wrap { overflow-x: auto; }`）。比例・反比例のテンプレートのうち、
2種類ずつ（全体の約1/3）に関係表を持たせています。

### 6年3学期の3グループ出題プラン

依頼文には「新内容50%・復習50%の既存方式を使わないでください」という明確な指示がありました。
既存の `planQuestionSequence()`（2グループ）をそのまま拡張するのではなく、専用の
`planQuestionSequenceThreeGroup()` を新設しています。ただし内部の部品（学期→カテゴリの
2段階ラウンドロビン）は、既存の `planReviewSlots()` から `planSlotsForTermList()` として
切り出し、対象学期のリストを引数で渡せるように汎用化した上で共有しています。

```js
const GRADE6_TERM3_GROUP_SOURCE_TERMS = {
  grade5: ["5-1", "5-2", "5-3"],
  grade6Review: ["6-1", "6-2"]
};

function buildGrade6Term3GroupCounts(totalQuestions, rotationIndex) {
  const base = Math.floor(totalQuestions / 3);
  const remainder = totalQuestions - base * 3; // 0, 1, または 2
  const counts = { grade5: base, grade6Review: base, grade6Term3: base };
  for (let i = 0; i < remainder; i++) {
    const group = GRADE6_TERM3_QUESTION_GROUPS[(rotationIndex + i) % 3];
    counts[group] += 1;
  }
  return counts;
}
```

`rotationIndex` を0・1・2と1ずつ進めながらこの関数を呼ぶと、依頼文が提示した例
（レベル1で `{1,1,0}`→`{0,1,1}`→`{1,0,1}`、レベル2で `{2,1,1}`→`{1,2,1}`→`{1,1,2}`）と
**完全に一致する配分**が得られることをNode.jsテストで確認しています（3で割り切れる
レベル3・MAXでは、そもそも端数が無いため常に均等になります）。

`rotationIndex` の管理は `js/game.js` が担当し、`js/storage.js` に永続化した値を
ゲーム開始のたびに読み込み・`+1`（3で割った余り）して保存します。`question-generator.js`
自体は「副作用のない純粋関数群」という既存方針を守るため、localStorageには一切触れず、
`rotationIndex` を必ず引数として受け取ります。

```js
// js/game.js
if (gameState.gradeTerm === "6-3") {
  const rotationIndex = loadGrade6Term3RotationIndex();
  gameState.questionPlan = planQuestionSequenceThreeGroup(gameState.totalQuestions, templateSets, rotationIndex);
  saveGrade6Term3RotationIndex((rotationIndex + 1) % 3);
}
```

グループA・Bの内部（学期→カテゴリ）、グループCの内部（5カテゴリのラウンドロビン）は
既存の仕組みをそのまま再利用しているため、目新しいコードはこの「グループの端数配分」だけです。
出題プランのスロットには、既存の `contentGroup`（`"new"`／`"review"`。デバッグパネルの
新内容/復習内容カウントとの後方互換のため維持）に加えて、`questionGroup`
（`"grade5"`／`"grade6Review"`／`"grade6Term3"`）という新しいラベルを追加しています。
`getCandidateTemplatesForSlot()` は無改造のまま動作します（`GRADE_TERM_PLAN_CONFIG["6-3"]`
に `reviewGradeTerms: ["5-1","5-2","5-3","6-1","6-2"]` を登録しておくだけで、
既存のスロット解決ロジックがそのまま6-3のグループA/Bスロットも正しく処理できるためです）。

### 現在の難易度・スコア・ランク・タイマー仕様（変更なし）

依頼文には、レベルMAXのハート数・スコア加算式・ランク係数・タイマー加速上限について、
このアプリの現在の実装と完全に一致する数値が明記されていました。実装前に `js/game.js`
`js/score.js` を確認し、以下がすべて依頼文どおりであることを確認済みです（変更していません）。

| 項目 | 現在の実装 |
|---|---|
| レベルMAXの内部レベル | 6 |
| レベルMAXのハート数 | 2個 |
| レベルMAXの必要正解数 | 12問（`2×内部レベル`） |
| レベルMAXの初期制限時間 | 20秒（`120秒÷内部レベル`） |
| 正解時の加算スコア | `(10+n)×(10+タイムボーナス)×20` |
| ランク係数 | `現在のスコア÷(1600×レベル)`（MAXは`÷9600`） |
| タイマー加速倍率 | `1+(n-1)/(N-1)`、1問目1.0倍・最終問題2.0倍 |

`js/game.js`・`js/score.js` は `gradeTerm` に対して汎用的な実装（レベル・問題数だけを
見て計算する）のため、6-3にもそのまま（無改造で）正しく適用されています。

### 既存機能への影響

6-3追加にあたって変更したのは、次のファイル・箇所だけです。それ以外の既存ファイル
（`js/training-mode.js` `js/answer-checker.js` `js/percentage-utils.js` `js/ratio-utils.js`
`js/fraction-utils.js` `js/score.js` `js/audio.js` `js/enemy-list.js` など）は無改造です。

| ファイル | 変更内容 |
|---|---|
| `js/scale-utils.js` | 新規追加。`createScale` `isValidScale` `normalizeScale` `scaleToFraction` `formatScale` `getScaleDenominator` `calculateActualLength` `calculateMapLength` `areScalesEqual` |
| `js/unit-utils.js` | 新規追加。`isSupportedLengthUnit` `getLengthConversionFactor` `convertLength` `formatLength`（mm・cm・m・kmの相互変換、内部はmmへの倍率で管理） |
| `js/value-utils.js` | 縮尺の型判定・表示（`isScaleValue` `formatValue` `valueKey` `getValueType` への分岐追加）。**バグ修正**: `areValuesEqual()` に縮尺・比の比較分岐を追加（従来は縮尺どうし・比どうしの比較に対応しておらず、「縮尺を求める」の最終結果比較が常に不一致と誤判定されるバグがあった） |
| `js/value-renderer.js` | `renderValueHtml()` に縮尺の表示分岐（`buildScaleAriaLabel()` を含む）を追加。`renderRelationTableHtml()`（比例・反比例の関係表をtable要素のHTMLに変換）を新規追加 |
| `css/style.css` | `.scale-value`（縮尺が改行されないようにする）・`.relation-table-wrap`／`.relation-table`（関係表のスタイル、横スクロール対応）を追加 |
| `index.html` | 「6年3学期」ボタンの `disabled` を解除し、`data-range="6-3"` を設定。関係表用のコンテナ（`#relation-table-container`）をバトル画面に追加 |
| `js/ui.js` | `RANGE_LABELS` に `"6-3": "小学6年生・3学期"` を追加。`renderRelationTable()`（関係表の表示・非表示切り替え）を新規追加し `renderProblem()` から呼び出す。問題履歴の関係表表示にも対応 |
| `js/multi-step-engine.js` | `buildHistoryEntry()` に `relationTable` の伝播を追加（`textParts` と同じパターン） |
| `js/storage.js` | `loadGrade6Term3RotationIndex()` / `saveGrade6Term3RotationIndex()` を新規追加（3グループの端数ローテーション位置の永続化） |
| `js/question-generator.js` | 新しい `generatorType` 5種（`findDirectProportionValue` `findInverseProportionValue` `findActualLengthFromScale` `findMapLengthFromScale` `findScale`）、`generateDirectProportionValues()` `generateInverseProportionValues()` `generateScaleLengthValues()` `pickDistinctValuePair()`、`computeStepResult()` に `resultType:"scaleDenominator"` を追加、`resolveRelationTable()`（関係表の値解決）、`planQuestionSequenceThreeGroup()`（6-3専用の3グループ出題プラン）、`planSlotsForTermList()`（`planReviewSlots()` から切り出した汎用ヘルパー）、`GRADE_TERM_PLAN_CONFIG` に `"6-3"` を追加 |
| `js/question-validator.js` | `VALID_GRADE_TERMS` に `"6-3"` を追加、新しい `generatorType` 5種のルール、`computeStepResultForValidation()` に `resultType:"scaleDenominator"` を追加、比例・反比例・縮尺専用の検証関数（`validateDirectProportion` `validateInverseProportion` `validateScaleLength`）、`validateHiddenIntermediateKeys()`（中間結果が問題文に漏れていないかの検証）、`validateRelationTable()`（関係表の構造検証）、生成済み問題の縮尺の妥当性検証を追加 |
| `data/grade6-term3.js` | 新規ファイル（計30テンプレート） |
| `data/index.js` | `grade6-term3.js` の import・`TEMPLATE_SETS_BY_GRADE_TERM` への登録 |
| `data/category-registry.js` | 5カテゴリを追加（order 47〜51） |
| `tools/question-validator.html` | 関係表の表示に対応（`gradeTerm`・カテゴリのフィルターは既存の仕組みで自動的に6-3に対応済みのため無改造） |

### 動作確認・検証の進め方

- Node.js での単体検証: 比例（`600÷4=150→150×7=1050`、`600×7=4200→4200÷4=1050`）・反比例
  （`4×12=48→48÷6=8`、`6×8=48→48÷12=4`）の計算例を確認したうえで、全30テンプレートについて
  40回ずつ生成し、`validateGeneratedQuestion()` で検証（全件成功）。**意図的な不正データ**
  （中間結果を問題文に漏らす、比例の正解ルートを1つだけにする、反比例の式1に`commutative`を
  付けない、「縮尺を求める」の最終ステップから`resultType`を外す、など5パターン）を検証関数に
  渡し、すべて正しく「不正」と判定されることも確認しています（検証ロジック自体の妥当性確認）。
  6年3学期モードの3グループ配分は、レベル1〜MAXそれぞれについて、ローテーション位置0・1・2を
  1周させて集計し、依頼文の推奨配分表と完全に一致すること、3周（9ゲーム相当）の合計で
  グループA・B・Cが必ず同数になることを確認済みです。カテゴリレジストリ全体（51件）の
  整合性検証、8新規カテゴリのトレーニング生成（各20回）もすべて成功しています。
- ブラウザでの回帰確認（手動）: タイトル画面の「6年3学期」ボタン表示、バトルモード
  （レベル1・レベルMAX）でのカウントダウン→問題文・選択肢カード・関係表の表示（縮尺が
  `1：25,000`のように改行されずに表示され、`[object Object]`や`undefined`/`NaN`が出ないこと）、
  比例・対応する量で2つの解法ルートのどちらでも正解と判定されること、反比例の問題文に一定の積が
  表示されていないこと、縮尺3カテゴリの単位変換が正しいこと、トレーニングモードの5カテゴリすべてでの
  出題確認、`?debug=true` の `questionGroupCounts` でグループ構成を確認、コンソールに
  JavaScriptエラーが出ていないこと、既存モード（4-1〜6-2）が6-3追加後も従来どおり動作することを
  確認してください（詳しいチェック手順は本回答の末尾のテスト手順一覧を参照）。
- 詳しいチェック項目は[16章の「小学6年生・3学期（6-3モード、第12段階）」](#16-動作確認用チェックリスト)、
  テンプレート追加時のチェック項目は[17章の「比例・対応する量／反比例・対応する量のテンプレート」
  「縮尺のテンプレート」](#17-問題データ追加時のチェック項目)を参照してください。
