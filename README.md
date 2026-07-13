# さんすう文章題クエスト！（math-word-battle）

小学4年生〜6年生を対象とした、算数の文章題学習アプリです。
敵キャラクターとのバトル形式で、文章題の式をカードで組み立てながら学習します。

**現在のバージョンは第5段階です。** 小学4年生・1学期（整数の四則計算）・2学期（小数のたし算/ひき算・
大きな数・2けたでわるわり算・整数の2段階文章題）に加えて、**小学4年生・3学期を正式モードとして公開**
しています（小数×整数、小数÷整数、同分母分数のたし算・ひき算を出題）。

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

## 1. ファイル構成

```
math-word-battle/
├─ index.html                 … 各画面のHTML構造、CSS/JSの読み込み
├─ README.md                  … このファイル
├─ css/
│  └─ style.css               … 全画面のスタイル（スマートフォン対応・デバッグパネル・2段階問題の演出含む）
├─ js/
│  ├─ app.js                    … アプリの初期化・画面操作の橋渡し
│  ├─ game.js                    … ゲーム状態管理・問題進行（4-2/4-3は出題プランに従って出題）・ハート/敵HP/タイマー管理・デバッグ出力
│  ├─ ui.js                      … 画面表示・DOM操作・カードのタップ/ドラッグ操作・デバッグパネル表示
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
│  ├─ grade4-term1.js           … 小学4年生・1学期の問題テンプレート（24種類、1段階問題）
│  ├─ grade4-term2.js           … 小学4年生・2学期の問題テンプレート（24種類、小数のたし算/ひき算・大きな数・2けたでわるわり算）
│  ├─ grade4-term3.js           … 小学4年生・3学期の問題テンプレート（24種類、小数×整数・小数÷整数・同分母分数のたし算/ひき算。新規）
│  └─ multi-step-integer.js     … 整数のみの2段階問題テンプレート（12種類。開発版モード「4-multi-step」、4-2モードの「2段階文章題」カテゴリ、4-3モードの復習内容の3か所から共有）
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
| `category` | string | 単元名（例: `"整数のたし算"`） |
| `difficulty` | number | このテンプレート内での相対難易度の目安（1〜）。**現時点ではゲームのロジックには未使用**で、将来のフィルタ機能のために用意している項目 |
| `questionType` | `"singleStep"` \| `"multiStep"` | `singleStep` は1つの式で解く問題。`multiStep` は2つの式で解く問題（[4章](#4-2段階問題questiontype-multistepについて)で詳説） |
| `template` | string（`textParts` と排他） | `{変数名}` を埋め込んだ問題文。整数・小数のみの問題で使用 |
| `textParts` | array（`template` と排他） | 分数のように横並びの文字列だけでは正しく表示できない問題文に使用。文字列パーツと値パーツが交互に並ぶ配列（[5章](#5-値の共通データ形式と分数の扱いvalue-utilsjs--fraction-utilsjs--value-rendererjs)で詳説） |
| `variables` | object | `template`（または`textParts`）/ `solutionRoutes` から参照する変数の生成ルール `{ min, max, step }`。小数の場合は `{ min, max, decimalPlaces }`、分数の場合は `{ type:"fraction", denominator, numeratorMin, numeratorMax }`（後述） |
| `generatorType` | string | 数値の生成方法（後述） |
| `solutionRoutes` | array | 正解として認める式のパターンの配列（`singleStep`と`multiStep`で形が異なる。後述） |
| `answerUnit` | string | 答えの単位 |
| `contentGroup` | `"new"` \| `"review"`（省略可） | その出題範囲内での「新しく習う内容」か「前の学期までの復習内容」かの区分。4-2の出題プラン（新内容/復習内容をおよそ半々で出題）が使う。**省略した場合は自動判定**され、`gradeTerm` が `"4-1"` なら `"review"`、それ以外は `"new"` として扱われる（`js/question-generator.js` の `getContentGroup()`）。このため既存の `grade4-term1.js` は変更不要 |

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

今回実際に使用するのは同分母分数のたし算・ひき算だけですが、将来の小学5・6年生対応
（異分母分数、分数のかけ算・わり算）を見据えて、かけ算・わり算の基礎処理もあらかじめ用意しています。
ただし、**今回の問題データには、異分母分数・分数のかけ算・わり算は追加していません。**

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
| `js/app.js` | エントリーポイント。`data/index.js` から問題データを取得し、各モジュールを読み込み、タイトル画面の操作（スタート・音声切り替え）、リトライ、タイトルへ戻る操作を `game.js` の関数に橋渡しします。 |
| `js/game.js` | `gameState` オブジェクトでゲーム状態を一元管理。起動時に問題テンプレートを `question-validator.js` で検証・フィルタします。問題の進行、ハート管理、敵HP管理、タイマー管理、正解/不正解後の処理、クリア/ゲームオーバー判定、`?debug=true` 時のデバッグ出力を行います。2段階問題の判定・進行自体は `multi-step-engine.js` に委譲し、その結果（正解/不正解、最終正解かどうか）を受け取って既存の共通フロー（ハート減少・タイマー・スコア加算など）に橋渡しするだけに留めています。4-2・4-3モードでは、ゲーム開始時に `question-generator.js` の `planQuestionSequence()` で出題計画を作り（[6章](#6-小学4年生2学期3学期の出題プラン新内容復習内容の比率とカテゴリ配分)）、各問題はその計画に沿って生成します。同一ゲーム内での問題文・式の重複を避ける仕組み（`generateNonDuplicateQuestion()`）、分数を含む問題文（`textParts`）の履歴への保存、分数の分子・分母・約分後の値などを含む詳細なデバッグ出力もここにあります。 |
| `js/ui.js` | 画面の表示切り替え、問題文・選択肢カード・解答欄の表示、HP/ハート/時間ゲージの更新、正解/不正解演出、カードのタップ操作・ドラッグ操作（Pointer Events）、結果画面の表示、デバッグパネルの表示を行います。2段階問題用に、進行表示（「式 1／2」）・中間結果カードの見た目・途中式正解の演出・`?debug=true` 時の開発版モードボタンの動的追加も担当します。数値・分数の表示は必ず `js/value-renderer.js` の `renderValueHtml()` / `renderTextPartsHtml()` を経由し（問題文・カード・解答欄・結果ボックス・履歴）、分数を含むカード・解答欄には専用のクラス（`choice-value-fraction`）で高さを確保します。タイトル画面で最後に選んだ出題範囲の保存・復元も担当します。 |
| `js/question-generator.js` | テンプレートから値を生成し、問題文（`text` またはHTML描画用の `textParts`）・選択肢カード（最大8枚）・`solutionRoutes`（解決済みの正解ルート）を作成します。生成直後に `question-validator.js` で検証し、不正な場合はコンソールにエラーを出力した上で再生成します。`questionType: "multiStep"` の場合は、値の生成とルートの数値解決までを行い、進行状態の初期化・最初のカード生成は `multi-step-engine.js` に委譲します。小数変数（`decimalPlaces`）・分数変数（`type:"fraction"`）の生成、4-2/4-3の出題計画生成（`planQuestionSequence()` `getCandidateTemplatesForSlot()` `getContentGroup()`）もここが担当します。ダミーカード生成・重複排除は、数値と分数のどちらの値にも対応した `value-utils.js` の `valueKey()` を使って値の型を意識せず行います。 |
| `js/multi-step-engine.js` | 2段階問題専用の進行管理。現在の途中式番号、正解候補となる解法ルートの絞り込み、途中式・最終式の判定、中間結果の保存、中間結果カードの生成、次の途中式への移行、複数解法の管理、結果画面用の履歴データの作成を担当します。開発者用検証ページから使う「全ルート完答シミュレーション」もここにあります。式の文字列表示は `js/value-renderer.js` の `renderValueHtml()` を使っており、今回のバージョンの2段階問題はすべて整数のみですが、将来分数の2段階問題を追加した場合にも対応できる下地になっています。 |
| `js/question-validator.js` | 問題テンプレート（構造）と生成済み問題（数値確定後）を検証します。1段階問題・2段階問題の両方に対応し、2段階問題については「式が2つ登録されているか」「ルートID・resultKeyの重複」「存在しない変数/中間結果の参照や循環参照が無いか」「各ルートの最終結果が一致するか」なども検証します。加えて、`gradeTerm`／`contentGroup` の値の妥当性、`template`/`textParts` のどちらかが存在するか、`textParts` の構造・参照先の妥当性、小数の桁数が多すぎないか、分数の分母・分子の範囲や同分母性、`exactDivision`系のわる数が想定範囲内か、`formatNumber()`/`parseFormattedNumber()` の往復変換が元の値と一致するか、分数の表示用HTML・`aria-label`が正しく生成できるか、なども検証します。ゲーム本体と `tools/question-validator.html` の両方から使われます。 |
| `js/answer-checker.js` | `eval()` を使わずに、値（数値または分数）と演算記号から安全に式を計算します。1つの式が正解ステップと一致するかを判定する共通ロジック（`matchesStep`）を持ち、1段階問題の `checkAnswer` と、2段階問題の `multi-step-engine.js` の両方から使われます。実際の計算・比較は自分では行わず、`value-utils.js` の `calculateValues()` / `areValuesEqual()` にすべて委譲しています。 |
| `js/number-utils.js` | 浮動小数点誤差の出ない小数の加減乗除（整数にスケールしてから計算し戻す方式）、整数のわる数による安全なわり算（`divideExactByInteger()`。小数÷整数にも対応）、桁区切り・小数のトリム表示（`formatNumber()`）、表示文字列から数値へ戻す変換（`parseFormattedNumber()`）、誤差を許容した数値比較（`areNumbersEqual()`）を提供します。数値（整数・小数）専用のユーティリティで、分数は扱いません（分数は `fraction-utils.js`）。 |
| `js/fraction-utils.js` | 分数専用の計算処理（新規）。最大公約数（`gcd`）、約分（`simplifyFraction`）、たし算・ひき算・かけ算・わり算（`addFractions` など）、同値判定（`areFractionsEqual`）を、分子・分母だけを使って正確に行います（浮動小数点数を経由しません）。 |
| `js/value-utils.js` | 整数・小数・分数を型を意識せず扱うための共通レイヤー（新規）。`calculateValues()` は値の型に応じて `number-utils.js` または `fraction-utils.js` に処理を振り分け、`areValuesEqual()` は型ごとの同値判定を、`normalizeValue()` は正規化（分数の約分・整数化を含む）を行います。「整数・小数・分数ごとの分岐」をこのファイル1か所に閉じ込めることで、ゲーム本体には型分岐を書かせない設計にしています。 |
| `js/value-renderer.js` | 分数の縦型表示（教科書と同じ、横線の上に分子・下に分母）のHTMLと、`aria-label`（読み上げ用の「分母分の分子」形式）を生成します（新規）。`textParts` 形式の問題文をHTMLに変換する `renderTextPartsHtml()` もここにあります。問題文・選択肢カード・解答欄・■欄・正解演出・問題履歴・問題検証ページ・デバッグ表示は、すべてこのファイルの関数を経由して分数を表示します。 |
| `js/score.js` | 問題ごとの加算スコア、現在のランクを計算します（1段階・2段階共通）。 |
| `js/audio.js` | Web Audio API でカウントダウン音・正解音・不正解音・敵撃破音・ゲームオーバー音を生成します。 |
| `js/storage.js` | ハイスコア・効果音設定・タイトル画面で最後に選んだ出題範囲（`gradeTerm`）を `localStorage` に保存/読み込みします。`localStorage` が使えない環境でもエラーにならないようにしています。 |
| `data/index.js` | 出題範囲（学年・学期）ごとの問題テンプレートを一元管理するレジストリ。ゲーム本体はここ経由でのみデータを取得します。`"4-3"` は `data/grade4-term3.js` に登録し、`"4-multi-step"` の `data/multi-step-integer.js` を4-2の「2段階文章題」カテゴリ・4-3の復習内容としても共有します。 |
| `data/grade4-term1.js` | 小学4年生・1学期の1段階問題テンプレートのデータのみを定義（ゲーム処理は含みません）。 |
| `data/grade4-term2.js` | 小学4年生・2学期の1段階問題テンプレートのデータのみを定義（小数のたし算・ひき算、大きな数、2けたでわるわり算、各6種類・計24種類）。 |
| `data/grade4-term3.js` | 小学4年生・3学期の1段階問題テンプレートのデータのみを定義（小数×整数・小数÷整数・同分母分数のたし算・同分母分数のひき算、各6種類・計24種類。新規）。分数のテンプレートは `textParts` を使用します。 |
| `data/multi-step-integer.js` | 整数のみの2段階問題テンプレートのデータのみを定義。開発版モード（`4-multi-step`）専用のデータであると同時に、4-2モードの「2段階文章題」カテゴリ、4-3モードの復習内容からも同じデータをそのまま参照します（複製はしていません）。 |

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

## 15. 今回対応していない内容／今後追加予定の機能

### 今回のバージョンで対応していない分数・小数の内容

分数データの正確性・既存機能の維持を優先するため、次の内容は今回意図的に対象外としています。

- 異分母分数のたし算・ひき算
- 分数×整数・分数×分数
- 分数÷整数・分数÷分数
- 小数×小数・小数÷小数
- 帯分数への変換（仮分数はそのまま表示します）
- 分数・小数を使った2段階文章題（2段階問題は整数のみのまま）
- 小数と分数が混在する計算・問題

### 今後追加予定の機能

- 小学5年生・6年生の問題データ（異分母分数、分数の四則演算、割合・速さ・比 など）
- 2段階問題の独立した出題範囲としての公開（現在は4-2モードの1カテゴリ・4-3モードの復習内容と、開発版モードのみ）
- 3つ以上の式が必要な問題、括弧を使う式
- トレーニングモード（時間制限なしの練習モード）
- 単元を絞った出題設定
- `difficulty` を使った出題フィルタ
- 効果音・演出のバリエーション追加

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
