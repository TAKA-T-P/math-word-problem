# さんすう文章題クエスト！（math-word-battle）

小学4年生〜6年生を対象とした、算数の文章題学習アプリです。
敵キャラクターとのバトル形式で、文章題の式をカードで組み立てながら学習します。

**現在のバージョンは第8段階です。** 小学4年生・1学期（整数の四則計算）・2学期（小数のたし算/ひき算・
大きな数・2けたでわるわり算・整数の2段階文章題）・3学期（小数×整数、小数÷整数、同分母分数のたし算・ひき算）・
5年生1学期（小数×小数、小数÷小数、小数倍、もとの量）に加えて、
**小学5年生・2学期（異分母分数のたし算・ひき算、平均、単位量あたり、混み具合）を通常バトルの正式モードとして追加**しました。
タイマー・ハート・敵HP・スコアの無い「トレーニングモード」では、22種類のカテゴリ（単元）から1つを選び、
そのカテゴリだけを5問、時間を気にせず何度でも解き直しながら練習できます
（詳しくは[18. トレーニングモード（第6段階）](#18-トレーニングモード第6段階)、
5年1学期の内容は[19. 小学5年生・1学期（第7段階）](#19-小学5年生1学期第7段階)、
5年2学期の内容は[20. 小学5年生・2学期（第8段階）](#20-小学5年生2学期第8段階)）。

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
復習内容の一部として、同じデータを再利用しています。小数・分数を使った2段階問題は今回未対応です。
詳しくは[10. 開発版モード（2段階問題・整数）の起動方法](#10-開発版モード2段階問題整数の起動方法)）。

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

## 1. ファイル構成

```
math-word-battle/
├─ index.html                 … 各画面のHTML構造、CSS/JSの読み込み
├─ README.md                  … このファイル
├─ css/
│  └─ style.css               … 全画面のスタイル（スマートフォン対応・デバッグパネル・2段階問題の演出含む）
├─ js/
│  ├─ app.js                    … アプリの初期化・画面操作の橋渡し・モード（バトル/トレーニング）の振り分け
│  ├─ game.js                    … 通常バトルの状態管理・問題進行（4-2/4-3は出題プランに従って出題）・ハート/敵HP/タイマー管理・デバッグ出力
│  ├─ training-mode.js           … トレーニングモードの状態管理・カテゴリ指定の問題生成・進行・リタイア・結果画面遷移（新規）
│  ├─ ui.js                      … 画面表示・DOM操作・カードのタップ/ドラッグ操作・モード選択/カテゴリ選択UI・デバッグパネル表示
│  ├─ question-generator.js       … テンプレートから問題・選択肢カードを生成し、生成直後に検証する。4-2/4-3の出題プラン生成（新内容/復習内容の比率・カテゴリ配分）もここが担当
│  ├─ multi-step-engine.js        … 2段階問題の進行管理・途中式判定・中間結果カード・履歴整形
│  ├─ question-validator.js       … 問題テンプレート／生成済み問題を検証する（1段階・2段階・小数・分数・contentGroup対応）
│  ├─ answer-checker.js          … 式の正誤判定（eval() 不使用、複数解法=solutionRoutes対応。実際の計算・比較は value-utils.js に委譲）
│  ├─ number-utils.js            … 浮動小数点誤差の出ない小数計算・数値の表示整形（桁区切り）・比較
│  ├─ fraction-utils.js          … 分数専用の計算処理（約分・四則演算・同値判定）。分子・分母のみで計算し、小数へ変換しない（新規）
│  ├─ value-utils.js             … 整数・小数・分数を型を意識せず扱う共通レイヤー（`calculateValues` `areValuesEqual` など）。ゲーム本体に型ごとの分岐を書かないための橋渡し役（新規）
│  ├─ value-renderer.js          … 分数の縦型表示（教科書と同じ、横線の上に分子・下に分母）のHTML生成、textParts形式の問題文の描画（新規）
│  ├─ score.js                   … スコア・ランク計算
│  ├─ audio.js                   … Web Audio API による効果音生成
│  └─ storage.js                 … ハイスコア・効果音設定・選択中の出題範囲の保存/読み込み
├─ data/
│  ├─ index.js                  … 問題データ読み込みの一元窓口。ゲーム本体はここ経由でのみ取得する
│  ├─ category-registry.js      … トレーニングで選べる22カテゴリの単一の情報源（id/表示名/学期/表示可否/表示順。第8段階で5カテゴリ追加）
│  ├─ grade4-term1.js           … 小学4年生・1学期の問題テンプレート（24種類、1段階問題）
│  ├─ grade4-term2.js           … 小学4年生・2学期の問題テンプレート（24種類、小数のたし算/ひき算・大きな数・2けたでわるわり算）
│  ├─ grade4-term3.js           … 小学4年生・3学期の問題テンプレート（24種類、小数×整数・小数÷整数・同分母分数のたし算/ひき算）
│  ├─ grade5-term1.js           … 小学5年生・1学期の問題テンプレート（32種類、小数×小数・小数÷小数・小数倍・もとの量）
│  ├─ grade5-term2.js           … 小学5年生・2学期の問題テンプレート（30種類、異分母分数のたし算/ひき算・平均・単位量あたり・混み具合。第8段階で新規）
│  └─ multi-step-integer.js     … 整数のみの2段階問題テンプレート（12種類。開発版モード「4-multi-step」、4-2モードの「2段階文章題」カテゴリ、4-3/5-1/5-2モードの復習内容から共有）
└─ tools/
   └─ question-validator.html   … 開発者用の問題データ検証ページ（1段階・2段階・整数/小数/分数、出題範囲/カテゴリ等でフィルタ可能）
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
| `variables` | object | `template`（または`textParts`）/ `solutionRoutes` から参照する変数の生成ルール `{ min, max, step }`。小数の場合は `{ min, max, decimalPlaces }`、分数の場合は `{ type:"fraction", denominator, numeratorMin, numeratorMax }`（後述） |
| `generatorType` | string | 数値の生成方法（後述） |
| `solutionRoutes` | array | 正解として認める式のパターンの配列（`singleStep`と`multiStep`で形が異なる。後述） |
| `answerUnit` | string | 答えの単位 |
| `contentGroup` | `"new"` \| `"review"`（省略可） | その出題範囲内での「新しく習う内容」か「前の学期までの復習内容」かの区分。4-2の出題プラン（新内容/復習内容をおよそ半々で出題）が使う。**省略した場合は自動判定**され、`gradeTerm` が `"4-1"` なら `"review"`、それ以外は `"new"` として扱われる（`js/question-generator.js` の `getContentGroup()`）。このため既存の `grade4-term1.js` は変更不要 |
| `quantityRelation` | object（省略可、第7段階で追加、第8段階で汎用化） | 「2つの既知の値から、積にあたる3つ目の値を求める」という数量関係を持つテンプレート専用のメタデータ。`type` によってフィールド名が変わる（小数倍・もとの量: `{type:"multiplicative-comparison", baseKey, comparedKey, multiplierKey, unknown}`、平均: `{type:"average", totalKey, countKey, averageKey, unknown}`、単位量あたり・混み具合: `{type:"unit-rate", totalKey, unitCountKey, perUnitKey, unknown}`）。詳しくは[19章](#19-小学5年生1学期第7段階)・[20章](#20-小学5年生2学期第8段階) |

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

2段階問題は、1つ目の式の答え（中間結果）を使って2つ目の式を解く問題です。今回のバージョンは
**すべて「整数だけ・ちょうど2つの式」に限定**しています（3つ以上の式や、小数・分数は対象外）。

2段階問題専用の進行管理（今どちらの式を解いているか、正解ルートの絞り込み、中間結果カードの生成、
履歴の整形など）は、すべて `js/multi-step-engine.js` が担当します。`game.js` や `ui.js` には
2段階問題固有の判定ロジックを持たせていません。

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
  （`variables` または `generatorType` が計算する値を参照）か、
  `{ source: "result", key: "..." }`（**同じルート内の、より前のステップの `resultKey`** を参照）のどちらかです。
  後のステップから前のステップの `resultKey` しか参照できないため、循環参照は構造上起こりません。
- `operator` は `"+"` `"-"` `"×"` `"÷"` のいずれか。交換法則（たし算・かけ算は順序を問わない）は
  演算子から自動判定されます（`commutative` を明示的に書くこともできます）。
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

このアプリでは、問題の値（変数の値・カードの値・正解の値など）は、次の2つの形のどちらかです。

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

### 値の共通処理（`js/value-utils.js`）

整数・小数・分数を、型を意識せず扱うための関数を提供します。ゲーム本体（`game.js` `ui.js`
`answer-checker.js` `question-generator.js`）は、これらの関数を呼ぶだけで、
「整数か小数か分数か」で分岐する処理を自前で書く必要がありません。

| 関数 | 役割 |
|---|---|
| `calculateValues(left, operator, right)` | 値の型に応じて安全に計算する（数値は `number-utils.js`、分数は `fraction-utils.js` に委譲）。計算できない場合（0で割る、割り切れない、今回未対応の型の組み合わせなど）は `null` を返す |
| `areValuesEqual(a, b)` | 値の型を意識せず、2つの値が等しいかを判定する（分数は分子・分母から正確に、数値は誤差許容で） |
| `normalizeValue(value)` | 値を正規化する（数値は丸め誤差の除去、分数は約分・整数への変換） |
| `formatValue(value)` | 値をプレーンテキストに変換する（分数は `"3/5"` 形式。**画面表示には使わない**。デバッグ用テキスト専用） |
| `isFractionValue(value)` / `isValueNegative(value)` / `valueKey(value)` など | 型判定・符号判定・Set/Mapのキー生成などの補助関数 |

`js/answer-checker.js` の `safeCalculate()` は `calculateValues()` を、`matchesStep()` は
`areValuesEqual()` をそのまま呼び出すだけになっており、正誤判定のコード自体は
整数・小数・分数のどれであっても変わりません。

### 分数専用の計算処理（`js/fraction-utils.js`）

分子・分母だけを使って正確に計算する、分数専用の関数を提供します。

`gcd(a,b)` `normalizeFraction(fraction)`（分母を必ず正にする）`simplifyFraction(fraction)`（約分）
`addFractions(a,b)` `subtractFractions(a,b)` `multiplyFractions(a,b)` `divideFractions(a,b)`
`areFractionsEqual(a,b)`（分子・分母から正確に同値判定）`isValidFraction(value)`
`fractionToNumber(value)`（表示・比較の補助にのみ使用。分数どうしの計算には使わない）

`addFractions`/`subtractFractions` は、最初からクロス乗算（`a.numerator×b.denominator±b.numerator×a.denominator`）で
計算しており、**分母が同じかどうかに関わらず正しく計算できる**設計でした。そのため第8段階（小学5年生2学期）の
異分母分数のたし算・ひき算を追加する際も、これらの関数は無改造のまま使用しています
（詳しくは[20章](#20-小学5年生2学期第8段階)）。`lcm(a,b)`（最小公倍数）・`convertToCommonDenominator(a,b)`（通分）は
第8段階で追加しました。実際の正誤判定・答えの計算には使用せず、開発者用検証ページのデバッグ表示
（通分前・通分後）や、将来の解説機能のために用意しています。
かけ算・わり算の基礎処理は、将来の小学6年生対応を見据えてあらかじめ用意していますが、
**今回の問題データには、分数のかけ算・わり算は追加していません。**

同値判定（`areFractionsEqual`。例: `1/2` と `2/4` は同じ値として扱う）は、値の比較・結果表示にのみ使用し、
児童が作った式が正解ルートの**構造**と一致するかどうかの判定には使いません（そちらは
`answer-checker.js` の `matchesStep()` が、登録された正解ルートの `left`/`right` とカードの値を
直接比較します）。今回は同分母のみを扱うため、値の同値性と構造の一致は実質的に一致します。

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
3. `index.html` のタイトル画面（`#range-select` 内）にある、該当する
   「今後追加」ボタンから `disabled` 属性を外し、`data-range` 属性を設定してください
   （4-1・4-2のボタンが実例です）。
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

タイトル画面の「しゅつだいはんい」に、通常は存在しない
**「2段階問題・整数（開発版）」** ボタンが表示されます（`js/ui.js` が `?debug=true` のときだけ
動的にボタンを追加しており、`index.html` には最初から書かれていません＝通常アクセスでは
選択する手段がありません）。このボタンを選んでスタートすると、`data/multi-step-integer.js` の
問題だけが出題されます。レベル1〜3の選択やハイスコア保存は、通常モードと同じ仕組みをそのまま使います。

## 11. 各JavaScriptファイルの役割

| ファイル | 役割 |
|---|---|
| `js/app.js` | エントリーポイント。`data/index.js` から問題データを取得し、各モジュールを読み込み、タイトル画面の操作（スタート・音声切り替え）、判定、次へ、リタイア、リトライ、タイトルへ戻る操作を `game.js`（通常バトル）または `training.js`（トレーニング）の関数に橋渡しします。**「今どちらのモードで遊んでいるか」の判定・振り分けは、このファイルの `currentMode` 変数とコールバック内の分岐だけに集約**しており、`game.js`・`training-mode.js`・`ui.js` の内部には `if (mode === "training")` のような分岐を増やしていません（第6段階の設計方針）。 |
| `js/game.js` | 通常バトルの `gameState` オブジェクトでゲーム状態を一元管理。起動時に問題テンプレートを `question-validator.js` の `filterValidTemplateSets()`（トレーニングと共通）で検証・フィルタします。問題の進行、ハート管理、敵HP管理、タイマー管理、正解/不正解後の処理、クリア/ゲームオーバー判定、`?debug=true` 時のデバッグ出力を行います。2段階問題の判定・進行自体は `multi-step-engine.js` に委譲し、その結果（正解/不正解、最終正解かどうか）を受け取って既存の共通フロー（ハート減少・タイマー・スコア加算など）に橋渡しするだけに留めています。4-2・4-3モードでは、ゲーム開始時に `question-generator.js` の `planQuestionSequence()` で出題計画を作り（[6章](#6-小学4年生2学期3学期の出題プラン新内容復習内容の比率とカテゴリ配分)）、各問題はその計画に沿って生成します。同一ゲーム内での問題文・式の重複を避ける仕組み（`generateNonDuplicateQuestion()`）、分数を含む問題文（`textParts`）の履歴への保存、分数の分子・分母・約分後の値などを含む詳細なデバッグ出力もここにあります。カウントダウン演出（`runCountdown()`）は `training-mode.js` からも再利用されるため export しています。トレーニングモードの状態（`trainingState`）や `training-mode.js` を参照することは一切ありません。 |
| `js/training-mode.js` | トレーニングモード専用の状態（`trainingState`）・進行管理（新規、第6段階）。`gameState` とは完全に独立しており、タイマー・ハート・敵HP・スコア・ランク・ハイスコアを一切参照しません。`generateTrainingQuestions(categoryId, templates, count)` が、指定カテゴリのテンプレートだけから（新内容/復習内容の比率処理は使わず）ちょうど5問を、問題文・式の重複を避けながら生成します。1問ごとの正解/不正解処理は、ハート減少・ゲームオーバーの代わりに「同じ問題（2段階なら同じ式）を解答欄をクリアしたまま再挑戦させる」処理になっており、`answer-checker.js`・`multi-step-engine.js`・`ui.js` のカード生成/正誤判定/分数表示はすべて通常バトルと同じ関数をそのまま再利用します。開発者用検証ページ向けの `validateTrainingSetGeneration()`（指定カテゴリで20回生成し、5問ちょうどか・他カテゴリが混ざらないか・重複が無いかを検証）もここにあります。 |
| `js/ui.js` | 画面の表示切り替え、問題文・選択肢カード・解答欄の表示、HP/ハート/時間ゲージの更新、正解/不正解演出、カードのタップ操作・ドラッグ操作（Pointer Events）、結果画面の表示、デバッグパネルの表示を行います。2段階問題用に、進行表示（「式 1／2」）・中間結果カードの見た目・途中式正解の演出・`?debug=true` 時の開発版モードボタンの動的追加も担当します。数値・分数の表示は必ず `js/value-renderer.js` の `renderValueHtml()` / `renderTextPartsHtml()` を経由し（問題文・カード・解答欄・結果ボックス・履歴）、分数を含むカード・解答欄には専用のクラス（`choice-value-fraction`）で高さを確保します。タイトル画面で最後に選んだ出題範囲・モード・トレーニングの学期/カテゴリの保存・復元も担当します。**第6段階で追加**: モード選択ボタン（`setMode()`）、`data/category-registry.js` から動的に生成する学年学期/カテゴリ選択ボタン、トレーニング画面のヘッダー更新（`updateTrainingHeader()`）、トレーニング専用の軽い誤答演出（`triggerTrainingIncorrectEffect()`）、トレーニング結果画面（`showTrainingResultScreen()`）。バトル画面・結果画面のバトル専用/トレーニング専用要素の出し分けは、`#app` 要素への `mode-training` クラスの付け外し（CSS側の `.battle-only` / `.training-only`）にまとめており、`ui.js` 自体には要素ごとの表示切り替えロジックをほとんど書いていません。 |
| `js/question-generator.js` | テンプレートから値を生成し、問題文（`text` またはHTML描画用の `textParts`）・選択肢カード（最大8枚）・`solutionRoutes`（解決済みの正解ルート）を作成します。生成直後に `question-validator.js` で検証し、不正な場合はコンソールにエラーを出力した上で再生成します。`questionType: "multiStep"` の場合は、値の生成とルートの数値解決までを行い、進行状態の初期化・最初のカード生成は `multi-step-engine.js` に委譲します。小数変数（`decimalPlaces`）・分数変数（`type:"fraction"`）の生成、4-2/4-3/5-1/5-2の出題計画生成（`planQuestionSequence()` `getCandidateTemplatesForSlot()` `getContentGroup()`、`GRADE_TERM_PLAN_CONFIG` にモードを1件追加するだけで新しい学期にも適用できる）もここが担当します。ダミーカード生成・重複排除は、数値と分数のどちらの値にも対応した `value-utils.js` の `valueKey()` を使って値の型を意識せず行います。**第7段階で追加**: `quantityRelation` を持つテンプレート（小数倍・もとの量）専用の値生成（`generateDecimalMultiplicativeComparisonValues()`）と、そのテンプレートの「見えている数値」を `solutionRoutes[0]` から動的に判定する `getVisibleNumbers()` の分岐。**第8段階で追加**: 「2つの既知の値から積にあたる3つ目の値を求める」共通ロジック `generateProportionalValues()` を切り出し、`generateDecimalMultiplicativeComparisonValues()`（小数倍・もとの量）に加えて `generateAverageValues()`（平均）・`generateUnitRateValues()`（単位量あたり・混み具合）がこれを共有します。異分母分数のたし算・ひき算は `generateStandardValues()` のエイリアスのため、この点は無改造です。 |
| `js/multi-step-engine.js` | 2段階問題専用の進行管理。現在の途中式番号、正解候補となる解法ルートの絞り込み、途中式・最終式の判定、中間結果の保存、中間結果カードの生成、次の途中式への移行、複数解法の管理、結果画面用の履歴データの作成を担当します。開発者用検証ページから使う「全ルート完答シミュレーション」もここにあります。式の文字列表示は `js/value-renderer.js` の `renderValueHtml()` を使っており、今回のバージョンの2段階問題はすべて整数のみですが、将来分数の2段階問題を追加した場合にも対応できる下地になっています。 |
| `js/question-validator.js` | 問題テンプレート（構造）と生成済み問題（数値確定後）を検証します。1段階問題・2段階問題の両方に対応し、2段階問題については「式が2つ登録されているか」「ルートID・resultKeyの重複」「存在しない変数/中間結果の参照や循環参照が無いか」「各ルートの最終結果が一致するか」なども検証します。加えて、`gradeTerm`／`contentGroup` の値の妥当性、`template`/`textParts` のどちらかが存在するか、`textParts` の構造・参照先の妥当性、小数の桁数が多すぎないか、分数の分母・分子の範囲や同分母性、`exactDivision`系のわる数が想定範囲内か、`formatNumber()`/`parseFormattedNumber()` の往復変換が元の値と一致するか、分数の表示用HTML・`aria-label`が正しく生成できるか、なども検証します。ゲーム本体（`game.js`・`training-mode.js`）と `tools/question-validator.html` の両方から使われます。**第6段階で追加**: `filterValidTemplateSets()`（不正なテンプレートを出題プールから除外する処理を`game.js`から移設し、通常バトル・トレーニング共通で使う）、`validateCategoryRegistry()`（カテゴリレジストリ自体のID重複・必須項目チェック）、`validateCategoryRegistryAgainstTemplates()`（レジストリとテンプレートの対応関係。孤立した`categoryId`・テンプレート0件のカテゴリが無いかを検証）。**第7段階で追加**: `validateQuantityRelation()`（小数倍・もとの量テンプレートの `quantityRelation` の構造検証）と、`comparedKey` のような動的な変数名も「既知の変数」として扱う `getKnownVariableKeys()` ヘルパー。**第8段階で追加**: `validateQuantityRelation()` を `QUANTITY_RELATION_TYPE_CONFIG` で汎用化し、平均（`type:"average"`）・単位量あたり（`type:"unit-rate"`）にも対応。異分母分数専用の `validateUnlikeDenominators()`（分母が異なることを要求）・`validateNonNegativeUnlikeDenominatorSubtraction()`（クロス乗算で答えが負にならないか検証）を追加。既存の「生成された分数の分母が同じか」というチェックは、同分母専用の `generatorType`（`SAME_DENOMINATOR_GENERATOR_TYPES`）に限定するよう修正（異分母分数を誤って弾かないようにするため）。 |
| `js/answer-checker.js` | `eval()` を使わずに、値（数値または分数）と演算記号から安全に式を計算します。1つの式が正解ステップと一致するかを判定する共通ロジック（`matchesStep`）を持ち、1段階問題の `checkAnswer` と、2段階問題の `multi-step-engine.js` の両方から使われます。実際の計算・比較は自分では行わず、`value-utils.js` の `calculateValues()` / `areValuesEqual()` にすべて委譲しています。 |
| `js/number-utils.js` | 浮動小数点誤差の出ない小数の加減乗除（整数にスケールしてから計算し戻す方式）、整数のわる数による安全なわり算（`divideExactByInteger()`。小数÷整数にも対応）、桁区切り・小数のトリム表示（`formatNumber()`）、表示文字列から数値へ戻す変換（`parseFormattedNumber()`）、誤差を許容した数値比較（`areNumbersEqual()`）を提供します。数値（整数・小数）専用のユーティリティで、分数は扱いません（分数は `fraction-utils.js`）。 |
| `js/fraction-utils.js` | 分数専用の計算処理。最大公約数（`gcd`）、約分（`simplifyFraction`）、たし算・ひき算・かけ算・わり算（`addFractions` など）、同値判定（`areFractionsEqual`）を、分子・分母だけを使って正確に行います（浮動小数点数を経由しません）。`addFractions`/`subtractFractions` は最初から異分母対応（クロス乗算）です。**第8段階で追加**: 最小公倍数（`lcm`）・通分（`convertToCommonDenominator`。デバッグ表示・将来の解説機能用で、正誤判定には使用しません）。 |
| `js/value-utils.js` | 整数・小数・分数を型を意識せず扱うための共通レイヤー（新規）。`calculateValues()` は値の型に応じて `number-utils.js` または `fraction-utils.js` に処理を振り分け、`areValuesEqual()` は型ごとの同値判定を、`normalizeValue()` は正規化（分数の約分・整数化を含む）を行います。「整数・小数・分数ごとの分岐」をこのファイル1か所に閉じ込めることで、ゲーム本体には型分岐を書かせない設計にしています。 |
| `js/value-renderer.js` | 分数の縦型表示（教科書と同じ、横線の上に分子・下に分母）のHTMLと、`aria-label`（読み上げ用の「分母分の分子」形式）を生成します（新規）。`textParts` 形式の問題文をHTMLに変換する `renderTextPartsHtml()` もここにあります。問題文・選択肢カード・解答欄・■欄・正解演出・問題履歴・問題検証ページ・デバッグ表示は、すべてこのファイルの関数を経由して分数を表示します。 |
| `js/score.js` | 問題ごとの加算スコア、現在のランクを計算します（1段階・2段階共通）。 |
| `js/audio.js` | Web Audio API でカウントダウン音・正解音・不正解音・敵撃破音・ゲームオーバー音を生成します。 |
| `js/storage.js` | ハイスコア・効果音設定・タイトル画面で最後に選んだ出題範囲（`gradeTerm`）を `localStorage` に保存/読み込みします。`localStorage` が使えない環境でもエラーにならないようにしています。**第6段階で追加**: `lastMode`（前回選んだモード）・`lastTrainingGradeTerm`・`lastTrainingCategoryId` の保存/読み込み。トレーニングのスコア・進捗・ハイスコアは保存しません。既存のハイスコア用キーとは別のキーを使っており、既存データには一切触れません。 |
| `data/index.js` | 出題範囲（学年・学期）ごとの問題テンプレートを一元管理するレジストリ。ゲーム本体はここ経由でのみデータを取得します。`"4-3"` は `data/grade4-term3.js`、`"5-1"` は `data/grade5-term1.js`、`"5-2"` は `data/grade5-term2.js`（第8段階）に登録し、`"4-multi-step"` の `data/multi-step-integer.js` を4-2の「2段階文章題」カテゴリ・4-3/5-1/5-2の復習内容としても共有します。 |
| `data/category-registry.js` | トレーニングモードで選べる22カテゴリの単一の情報源（第6段階で新規導入、第7段階で4カテゴリ、第8段階で5カテゴリ追加）。各カテゴリは `{ id, label, gradeTerm, gradeLabel, enabledInTraining, order }` を持ち、`getCategoriesForGradeTerm()` `getGradeTermGroups()` `getCategoryById()` のヘルパーを提供します。`js/ui.js` はこのレジストリからタイトル画面のカテゴリ選択ボタンを動的に生成するだけで、カテゴリ名を個別にハードコードしていません。詳しくは[18章](#18-トレーニングモード第6段階)。 |
| `data/grade4-term1.js` | 小学4年生・1学期の1段階問題テンプレートのデータのみを定義（ゲーム処理は含みません）。 |
| `data/grade4-term2.js` | 小学4年生・2学期の1段階問題テンプレートのデータのみを定義（小数のたし算・ひき算、大きな数、2けたでわるわり算、各6種類・計24種類）。 |
| `data/grade4-term3.js` | 小学4年生・3学期の1段階問題テンプレートのデータのみを定義（小数×整数・小数÷整数・同分母分数のたし算・同分母分数のひき算、各6種類・計24種類）。分数のテンプレートは `textParts` を使用します。 |
| `data/grade5-term1.js` | 小学5年生・1学期の1段階問題テンプレートのデータのみを定義（小数×小数・小数÷小数・小数倍・もとの量、各8種類・計32種類）。小数倍・もとの量のテンプレートは `quantityRelation` メタデータを持ちます。詳しくは[19章](#19-小学5年生1学期第7段階)。 |
| `data/grade5-term2.js` | 小学5年生・2学期の問題テンプレートのデータのみを定義（異分母分数のたし算・ひき算・平均・単位量あたり・混み具合、各6種類・計30種類。第8段階で新規）。平均・単位量あたり・混み具合のテンプレートは `quantityRelation` メタデータを持ち、「2つの数の平均」だけは `questionType:"multiStep"` の2段階問題です。詳しくは[20章](#20-小学5年生2学期第8段階)。 |
| `data/multi-step-integer.js` | 整数のみの2段階問題テンプレートのデータのみを定義。開発版モード（`4-multi-step`）専用のデータであると同時に、4-2モードの「2段階文章題」カテゴリ、4-3/5-1/5-2モードの復習内容からも同じデータをそのまま参照します（複製はしていません）。 |

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
- カウントダウン画面（3・2・1・START!）
- バトル画面（敵HP、ハート、時間ゲージ、問題文、解答欄、選択肢カード）
- 選択肢カードのタップ配置・ドラッグ配置（Pointer Events対応、配置済みカードは元の位置を保ったまま非表示）
- 解答欄が揃うと「＝」ボタンがオレンジ色に光って目立つ
- eval() を使わない安全な正誤判定（複数の正解ルート = `solutionRoutes` に対応）
- 正解・不正解演出（○マーク、画面シェイク、赤フラッシュ、効果音）
- 敵を倒したときの点滅して消える演出
- スコア・ランク計算、ノーミス判定（+表示）
- クリア／ゲームオーバー／リタイアの判定と結果画面
- 結果画面での問題履歴表示（スクロール可能、リタイア時の途中問題も含む）
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
  - 問題全体を通して一度でもミスがあれば、スコア計算のゲージ残量を0%として扱う
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

## 15. 今回対応していない内容／今後追加予定の機能

### 今回のバージョンで対応していない分数・小数の内容

分数・小数データの正確性・既存機能の維持を優先するため、次の内容は今回意図的に対象外としています。

- 分数×整数・分数×分数
- 分数÷整数・分数÷分数
- 帯分数への変換（仮分数はそのまま表示します）
- 分数・小数を使った2段階文章題（2段階問題は整数のみ、または「2つの数の平均」のような
  たし算→わり算の組み合わせに限定。異分母分数・小数倍・単位量あたりなどを組み合わせた
  2段階問題は今回追加していません）
- 小数と分数が混在する計算・問題
- 速さ・道のり・時間、割合・百分率・歩合・値引き・増量（第8段階でも対象外）
- 分数の比・比例・反比例・縮尺
- 「AとBのどちらが混んでいるか」を文字で答える問題（今回の解答形式は数式を作る形式のため）
- 3つ以上の値から平均を求める問題、複数グループの平均を合成する加重平均
- 小学5年生3学期以降・小学6年生の内容（比、拡大図・縮図、円の面積、角柱・円柱の体積 など）

### 今後追加予定の機能

- 小学5年生3学期以降・6年生の問題データ（比、拡大図・縮図、円の面積・角柱円柱の体積 など）
- 2段階問題の独立した出題範囲としての公開（現在は4-2モードの1カテゴリ・4-3/5-1/5-2モードの復習内容と、開発版モードのみ）
- 3つ以上の式が必要な問題、括弧を使う式
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
- [ ] タイトル画面でレベル1〜3・出題範囲（4年1学期）を選択できる
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
- [ ] 結果画面に問題履歴（不正解回数・時間切れ回数含む）が表示される
- [ ] リトライ・タイトルへ戻るが正しく動作する
- [ ] ハイスコアが保存され、再読み込み後も保持されている
- [ ] スマートフォンの縦画面で崩れずに表示・操作できる
- [ ] 1段階問題のプレイ中に、途中式表示や中間結果カードが表示されない

### 2段階問題（開発版モード）

- [ ] `?debug=true` を付けたときだけ、タイトル画面に「2段階問題・整数（開発版）」が表示される
- [ ] `?debug=true` を付けない場合、上記ボタンもデバッグパネルも一切表示されない
- [ ] 開発版モードを選ぶと、`data/multi-step-integer.js` の問題だけが出題される
- [ ] 問題文の近くに「式 1／2」のような進行表示が出る
- [ ] 1つ目の式に正解すると、小さめの演出（○）が出て、中間結果カードが選択肢に追加される
- [ ] 1つ目の式の正解では、敵HP・スコア・正解数・問題履歴の完了記録が変化しない
- [ ] 表示が「式 2／2」に切り替わり、2つ目の式用のカードが表示される
- [ ] 2つ目の式に正解すると、大きな「○」・敵HP減少・スコア加算・正解数+1・問題履歴の記録が行われる
- [ ] 1つ目・2つ目どちらの式で不正解/時間切れになっても、ハートが1つ減り、同じ式に再挑戦になる
      （2つ目の式でミスしても1つ目の式に戻らない）
- [ ] 途中式正解時はタイマーが全回復しない（一時停止→再開）。不正解・時間切れ時は全回復する
- [ ] 問題内で一度でもミスすると、最終正解時のスコア計算でゲージ残量が0%になる
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

### quantityRelationを持つテンプレート（小数倍・もとの量・平均・単位量あたり・混み具合、第7〜8段階）

`quantityRelation.type` によって、フィールド名・`unknown` に使える値が異なります
（`js/question-validator.js` の `QUANTITY_RELATION_TYPE_CONFIG` を参照）。

| type | 既知（生成元）のキー | 自動計算されるキー | unknown に使える値 |
|---|---|---|---|
| `"multiplicative-comparison"`（小数倍・もとの量） | `baseKey` `multiplierKey` | `comparedKey` | `"base"` `"compared"` `"multiplier"` |
| `"average"`（平均） | `countKey` `averageKey` | `totalKey` | `"total"` `"count"` `"average"` |
| `"unit-rate"`（単位量あたり・混み具合） | `unitCountKey` `perUnitKey` | `totalKey` | `"total"` `"unitCount"` `"perUnit"` |

- [ ] `quantityRelation.type` が上記3種類のいずれかになっている
- [ ] 「既知（生成元）のキー」2つが `variables` に存在するキー名と一致している
- [ ] 「自動計算されるキー」は `variables` に**含めない**（生成時に自動計算される値のため）
- [ ] `quantityRelation.unknown` が、その `type` に対応する3つの値のいずれかになっている
- [ ] `solutionRoutes` の `left`/`right` が、`unknown` に応じて正しい2変数を参照している
      （例: 小数倍で `unknown:"compared"` なら `base×multiplier`、平均で `unknown:"average"` なら
      `total÷count`、単位量あたりで `unknown:"total"` なら `perUnit×unitCount`）
- [ ] `template`（または `textParts`）に、自動計算されるキー（例: `{compared}` `{total}`）の
      プレースホルダーが、そのキーが `unknown` **ではない**ときだけ使われている
      （答えにあたる値を問題文に出してはいけない）
- [ ] `generatorType` が、その `type` に対応するもの（小数倍・もとの量: `decimalMultiplicativeComparison`
      `decimalOriginalQuantity`／平均: `averageFromTotal` `totalFromAverage`／
      単位量あたり・混み具合: `unitRate` `totalFromUnitRate`）になっている
- [ ] 「既知（生成元）」側の2つの変数の `decimalPlaces` を2桁以内にしておく
      （積・商のどちらを逆算しても、安全に有限小数として求まるようにするため）
- [ ] 平均の `countKey`（個数）が整数の範囲（`decimalPlaces` 無し）で定義されている
- [ ] 検証ページで、生成された問題の`quantityRelation`関連のエラー（`validateQuantityRelation()`）が出ていない

### 分数のテンプレート（同分母分数のたし算・ひき算）

- [ ] `template` ではなく `textParts` を使い、分数の値パーツは `{ type:"value", ref:"変数名" }` の形式になっている
- [ ] `variables.a` と `variables.b` の `denominator`（分母）が同じ値になっている（同分母分数のため）
- [ ] ひき算の場合、`variables.a.numeratorMin` が `variables.b.numeratorMax` 以上になっている
      （答えが必ず0以上になるように）
- [ ] `generatorType` が `"sameDenominatorFractionAddition"`（たし算）または
      `"sameDenominatorFractionSubtraction"`（ひき算）になっている
- [ ] たし算は `commutative: true`、ひき算は `commutative: false` になっている
- [ ] 検証ページで、生成された問題の分数が縦型（横線の上に分子・下に分母）で表示されている
- [ ] 検証ページの「値の種類」フィルターで「分数のみ」を選ぶと、追加したテンプレートが表示される

### 2段階問題（questionType: "multiStep"）

- [ ] `solutionRoutes` の各ルートに一意な `id` が付いている
- [ ] 各ルートの `steps` がちょうど2要素になっている
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

第6段階時点では13カテゴリでしたが、第7段階で5年1学期の4カテゴリを追加し、現在17カテゴリ登録されています
（5年1学期の内訳は[19章](#19-小学5年生1学期第7段階)を参照）。

| 学期 | カテゴリ（categoryId） |
|---|---|
| 4-1 | `integer-addition` `integer-subtraction` `integer-multiplication` `integer-division-one-digit` |
| 4-2 | `decimal-addition` `decimal-subtraction` `large-numbers` `integer-division-two-digit` `multi-step-integer` |
| 4-3 | `decimal-times-integer` `decimal-division-by-integer` `same-denominator-fraction-addition` `same-denominator-fraction-subtraction` |
| 5-1 | `decimal-times-decimal` `decimal-divided-by-decimal` `decimal-multiplicative-comparison` `decimal-original-quantity` |

`js/ui.js` はタイトル画面の「がくねん・がっき」「もんだいの しゅるい」ボタンを、
`getGradeTermGroups()` / `getCategoriesForGradeTerm()` を使って**このレジストリから動的に生成**します。
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
- [ ] トレーニングを選ぶと、「がくねん・がっき」「もんだいの しゅるい」の選択UIが表示される
- [ ] カテゴリ一覧が `data/category-registry.js` から動的に生成されている（13カテゴリ、学期ごとに正しくグループ化）
- [ ] トレーニング開始で、選んだカテゴリだけから5問が出題される（他のカテゴリが混ざらない）
- [ ] トレーニング中、敵キャラ・ハート・時間ゲージ・スコア・ランクが表示されない
- [ ] トレーニング中、問題番号（「問題 1／5」）とカテゴリ名が表示される
- [ ] 2段階問題のカテゴリでは、「式 1／2」と「問題 N／5」が同時に表示される
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
| 正解時の加算スコア | `(10+せいかい数)×(50+ゲージ残量%)×4` | `js/score.js` の `calculateQuestionScore()`。以前の開発段階で×2から×4へ変更済み |
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
| 正解時の加算スコア | `(10+n)×(50+ゲージ残量%)×4` |
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
