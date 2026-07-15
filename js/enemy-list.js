// バトルに出現するエネミー（絵文字・名前・出現レベル・せりふ・紹介文）の一覧。
// js/game.js（バトル開始時のランダム抽選、選んだレベル以下のminLevelを持つエネミーだけが対象）と
// js/ui.js（タイトル画面のスクロール表示、レベルを問わず全種類を表示。結果画面のエネミーコメント表示。
// エネミー図鑑の描画）の両方から参照する、単一の情報源。エネミーを追加・変更する場合は
// この配列だけを編集すればよい。
//
// id         : エネミー図鑑の解放状態（js/storage.js への保存）を名前・絵文字ではなく
//              安定して識別するための一意なID（運用開始後に追加）。名前・絵文字を変更しても
//              解放状態が失われないよう、一度決めたIDは変更しない。
// minLevel   : そのエネミーが出現し始める最小の内部レベル（1〜5、レベルMAXは6として扱う）。
//              例えばレベルMAXでしか出ないエネミーは minLevel:6 にする（内部レベルの仕組みは
//              js/game.js の heartsForLevel() 等と同じ）。
// clearText  : そのエネミーにクリア（勝利）したときに結果画面へ表示するせりふ。
// gameOverText: そのエネミーにゲームオーバー（またはリタイア）になったときに結果画面へ表示するせりふ。
// introText  : キャラ紹介文。エネミー図鑑で、倒したことがあるエネミーの説明として表示する
//              （運用開始後、エネミー図鑑機能を実装しゲーム内で使用するようになった）。

export const ENEMY_LIST = [
  // すべてのレベルで出現
  {
    id: "chikurin",
    emoji: "🦟",
    name: "チクリン",
    minLevel: 1,
    clearText: "うわ～！たたかれた～！",
    gameOverText: "チクッと勝利！かゆいでしょ～？",
    introText: "すばやく飛び回り、気づかないうちにチクリとこうげきしてくる。"
  },
  {
    id: "petapetan",
    emoji: "🦎",
    name: "ペタペタン",
    minLevel: 1,
    clearText: "しっぽを置いて、にげるペタン！",
    gameOverText: "ペタッとくっついて、ボクの勝ち！",
    introText: "壁や天井にペタペタくっつき、とつぜん目の前に現れる。"
  },
  {
    id: "basatto",
    emoji: "🦇",
    name: "バサット",
    minLevel: 1,
    clearText: "まぶしすぎる～！バサッ……",
    gameOverText: "バサバサッ！夜空はボクのもの！",
    introText: "暗い場所を好み、大きな羽音を立てながら急降下してくる。"
  },
  {
    id: "nyoro-king",
    emoji: "🐍",
    name: "ニョロキング",
    minLevel: 1,
    clearText: "王さまなのに、まけたニョロ～！",
    gameOverText: "ニョロニョロ王国へようこそ！",
    introText: "ヘビたちの王様で、長い体を使って相手を取り囲む。"
  },
  {
    id: "takon-star",
    emoji: "🐙",
    name: "タコンスター",
    minLevel: 1,
    clearText: "足がこんがらがったタコ～！",
    gameOverText: "８本のうでに、スキはなし！",
    introText: "8本の足を器用に動かし、次々と攻撃をくり出す海のスター。"
  },
  {
    id: "eagle-run",
    emoji: "🦅",
    name: "イーグルン",
    minLevel: 1,
    clearText: "羽がフラフラだ～！",
    gameOverText: "空からぜ～んぶ見えていたぞ！",
    introText: "空高くから相手を見つけ、ものすごい速さで飛びかかる。"
  },
  {
    id: "gaurufu",
    emoji: "🐺",
    name: "ガウルフ",
    minLevel: 1,
    clearText: "クゥ～ン……強かったワン……",
    gameOverText: "ガウッ！遠ぼえするほどの大勝利！",
    introText: "大きな遠ぼえで仲間を呼び、群れになって攻めてくる。"
  },
  {
    id: "yurarin",
    emoji: "👻",
    name: "ユラリン",
    minLevel: 1,
    clearText: "フワッと消えるよ……またね～！",
    gameOverText: "ユ～ラユラ！つかまえられないよ～！",
    introText: "空中をゆらゆらただよい、かべをすり抜けて背後からおどろかせる。"
  },
  // レベル2以上で出現
  {
    id: "tosshin-bo",
    emoji: "🐗",
    name: "トッシンボー",
    minLevel: 2,
    clearText: "とっしんする方向をまちがえた～！",
    gameOverText: "止まれない！勝利へ一直線！",
    introText: "一度走り出すと止まれず、どんなものにも一直線に突っ込む。"
  },
  {
    id: "gyororin",
    emoji: "👁️",
    name: "ギョロリン",
    minLevel: 2,
    clearText: "目がまわる～！ギョロギョロ～！",
    gameOverText: "ギョロッ！弱点はお見通し！",
    introText: "大きな目で相手の動きを観察し、弱点をすぐに見つけ出す。"
  },
  {
    id: "hone-bone",
    emoji: "💀",
    name: "ホネボーン",
    minLevel: 2,
    clearText: "ホネがバラバラ、ボーン！",
    gameOverText: "カラカラ笑って、ボクの勝ち！",
    introText: "体がバラバラになっても、カラカラ音を立てて元に戻る。"
  },
  {
    id: "spider",
    emoji: "🕷️",
    name: "スパイダー！",
    minLevel: 2,
    clearText: "糸がからまった～！だれかほどいて！",
    gameOverText: "クモのす作戦、大成功！",
    introText: "丈夫な糸でクモの巣をはり、動けなくなった相手をねらう。"
  },
  // レベル3以上で出現
  {
    id: "sasoringer",
    emoji: "🦂",
    name: "サソリンガー",
    minLevel: 3,
    clearText: "チクショ～！しっぽがしびれた～！",
    gameOverText: "ハサミとしっぽのダブル攻撃！",
    introText: "大きなハサミとするどいしっぽを持つ、砂漠の危険な戦士。"
  },
  {
    id: "robo-star",
    emoji: "🤖",
    name: "ロボスターMk.II",
    minLevel: 3,
    clearText: "エラー発生！サイキドウシマス……",
    gameOverText: "ショウリ、カクニン。ピピピッ！",
    introText: "戦いのデータを分析し、負けるたびに強くなる最新型ロボット。"
  },
  {
    id: "waruimon",
    emoji: "😈",
    name: "ワルイモン",
    minLevel: 3,
    clearText: "いい子になれば勝てたのかな～？",
    gameOverText: "イッヒッヒ！わるい作戦、大成功！",
    introText: "いたずらと悪だくみが大好きで、いつも誰かをこまらせている。"
  },
  {
    id: "mahojii",
    emoji: "🧙",
    name: "まほじい",
    minLevel: 3,
    clearText: "呪文を一文字まちがえたわい……",
    gameOverText: "ほっほっほ、これぞ勝利の魔法じゃ！",
    introText: "長年研究した不思議な魔法を使うが、ときどき呪文をまちがえる。"
  },
  // レベル4以上で出現
  {
    id: "invader",
    emoji: "👾",
    name: "インベーダ",
    minLevel: 4,
    clearText: "ゲームオーバー……ピコーン……",
    gameOverText: "ピコピコ！このステージはいただいた！",
    introText: "電子の世界から現れ、ピコピコ音とともにこうげきをしかける。"
  },
  {
    id: "oo-akaoni",
    emoji: "👹",
    name: "大あかおに",
    minLevel: 4,
    clearText: "まいった！ツノまでクラクラだ～！",
    gameOverText: "ガッハッハ！オニにかなぼうじゃ！",
    introText: "大きな体と怪力がじまんで、怒ると地面までゆれるという。"
  },
  {
    id: "tengu-star",
    emoji: "👺",
    name: "テングスター",
    minLevel: 4,
    clearText: "鼻を高くしすぎた～！",
    gameOverText: "この長い鼻にかけて、わしの勝ち！",
    introText: "長い鼻と大きなうちわを使い、強い風を巻き起こす。"
  },
  {
    id: "vampirian",
    emoji: "🧛",
    name: "バンパイアン",
    minLevel: 4,
    clearText: "朝日が出る前に帰ります～！",
    gameOverText: "今夜の勝者は、このわたしだ！",
    introText: "夜になると目を覚まし、マントを広げて音もなく近づいてくる。"
  },
  // レベル5以上で出現
  {
    id: "gaburyu",
    emoji: "🦖",
    name: "ガブリュウ",
    minLevel: 5,
    clearText: "ガブッといく前に、やられた～！",
    gameOverText: "ガブッと勝利をいただき！",
    introText: "大きな口とするどい歯を持ち、目の前のものに何でもかみつく。"
  },
  {
    id: "alien-z",
    emoji: "👽",
    name: "ウチュウジンZ",
    minLevel: 5,
    clearText: "ワレワレハ、タイキャクスル～！",
    gameOverText: "チキュウノショウリ、ゲットシタ！",
    introText: "遠い星から地球を調査するためにやって来たナゾの宇宙人。"
  },
  // レベルMAX（内部レベル6）のみで出現
  {
    id: "kurukurun",
    emoji: "🛸",
    name: "クルクルーン",
    minLevel: 6,
    clearText: "回りすぎて、目がまわる～！",
    gameOverText: "クルクル回って、勝利にとうちゃく！",
    introText: "回転しながら空を飛び、不思議な光で相手をまどわせる。"
  },
  {
    id: "ryu-king",
    emoji: "🐲",
    name: "リュウキング",
    minLevel: 6,
    clearText: "無念！お前が真の文章題マスターだ･･･",
    gameOverText: "天までとどけ！王者のほうこう！",
    introText: "空と大地を支配する伝説の王で、口から強力な息を放つ。"
  }
];

// 総復習モード専用の固定エネミー（運用開始後に追加）。ENEMY_LIST（通常バトルのランダム抽選プール・
// タイトル画面のプレビュー表示）には含めない（js/review-mode.js だけが参照する）。
// minLevel を持たないのは、総復習モードにレベルの概念が無いため。
// 「4年のまとめ」「5年のまとめ」「6年のまとめ」では FORMULA_KAMEN が、
// その完全上位版である「小学校のまとめ」では FORMULA_KAMEN_ACE が固定で出現する。
// reviewScope: "grade"（学年のまとめ）/ "all"（小学校のまとめ）は、エネミー図鑑の出現条件
// ヒント（getEnemyUnlockHint()）が、名前の文字列比較ではなく安定したフィールドで
// 総復習専用エネミーを判定できるようにするための出現種別（運用開始後に追加）。
export const FORMULA_KAMEN = {
  id: "formula-kamen",
  emoji: "🦹",
  name: "フォーミュラ仮面",
  reviewScope: "grade",
  clearText: "まさかここまでやるとは……合格よ！",
  gameOverText: "きちんと復習しないと、おしおきよ！",
  introText: "数式を自在にあやつり、こうげきをしかけてくるナゾの女戦士。"
};

export const FORMULA_KAMEN_ACE = {
  id: "formula-kamen-ace",
  emoji: "🦹‍♂️",
  name: "フォーミュラ仮面エース",
  reviewScope: "all",
  clearText: "すべての問題を完ペキに解ききるとは……まいりました！",
  gameOverText: "すべて計算どおり！これがエースの実力さ！",
  introText: "すべての数式を完ペキに使いこなす、フォーミュラ仮面の最強進化形。"
};

// プレイヤーが操作中に遭遇しうる、レベルMAXの内部値（js/game.js の heartsForLevel() 等と同じ、
// 6を「レベルMAX」として扱う仕組みに合わせている）。
const MAX_INTERNAL_LEVEL = 6;

/**
 * エネミー図鑑に掲載するエネミー一覧を返します（運用開始後に追加）。
 * 通常バトルのランダム抽選プール（ENEMY_LIST）に、総復習専用の固定エネミー
 * （FORMULA_KAMEN・FORMULA_KAMEN_ACE）を加えた、プレイヤーが実際に遭遇しうる
 * 全エネミーです。図鑑用のエネミー情報を別途手入力せず、この関数が唯一の情報源
 * （ENEMY_LIST・FORMULA_KAMEN・FORMULA_KAMEN_ACE）からそのまま組み立てます。
 */
export function getAllEnemiesForDex() {
  return [...ENEMY_LIST, FORMULA_KAMEN, FORMULA_KAMEN_ACE];
}

/**
 * まだ倒していないエネミーの出現条件を、プレイヤー向けのヒント文にして返します
 * （エネミー図鑑の未解放カード用。運用開始後に追加）。
 * 文章をエネミーごとに個別管理せず、実際の出現条件（minLevel・reviewScope）から
 * 動的に生成するため、抽選条件（js/game.js の pickRandomEnemy()、
 * js/review-mode.js の pickEnemyForScope()）とヒントが食い違うことがない。
 * - reviewScope:"all"（小学校のまとめ専用）→「小学校の総復習であらわれるかも？」
 * - reviewScope:"grade"（学年のまとめ専用）→「学年の総復習であらわれるかも？」
 * - minLevel が内部レベル6（レベルMAX）以上 →「レベルMAXであらわれるかも？」
 *   （タイトル画面のレベル表示と同じく、内部値の6をそのまま表示しない）
 * - それ以外の minLevel →「レベル○以上であらわれるかも？」
 *   （pickRandomEnemy() が `minLevel <= level` で判定するため、常に「以上」の表現になる）
 */
export function getEnemyUnlockHint(enemy) {
  if (enemy.reviewScope === "all") {
    return "小学校の総復習であらわれるかも？";
  }
  if (enemy.reviewScope === "grade") {
    return "学年の総復習であらわれるかも？";
  }
  if (typeof enemy.minLevel === "number") {
    if (enemy.minLevel >= MAX_INTERNAL_LEVEL) {
      return "レベルMAXであらわれるかも？";
    }
    return `レベル${enemy.minLevel}以上であらわれるかも？`;
  }
  return "まだ正体はナゾ……？";
}
