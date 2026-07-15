// バトルに出現するエネミー（絵文字・名前・出現レベル・せりふ・紹介文）の一覧。
// js/game.js（バトル開始時のランダム抽選、選んだレベル以下のminLevelを持つエネミーだけが対象）と
// js/ui.js（タイトル画面のスクロール表示、レベルを問わず全種類を表示。結果画面のエネミーコメント表示）の
// 両方から参照する、単一の情報源。エネミーを追加・変更する場合はこの配列だけを編集すればよい。
//
// minLevel   : そのエネミーが出現し始める最小の内部レベル（1〜5、レベルMAXは6として扱う）。
//              例えばレベルMAXでしか出ないエネミーは minLevel:6 にする（内部レベルの仕組みは
//              js/game.js の heartsForLevel() 等と同じ）。
// clearText  : そのエネミーにクリア（勝利）したときに結果画面へ表示するせりふ。
// gameOverText: そのエネミーにゲームオーバー（またはリタイア）になったときに結果画面へ表示するせりふ。
// introText  : キャラ紹介文。今回のバージョンではゲーム内に表示しないが、将来の「エネミー図鑑」
//              機能で使うためデータとして保持しておく。

export const ENEMY_LIST = [
  // すべてのレベルで出現
  {
    emoji: "🦟",
    name: "チクリン",
    minLevel: 1,
    clearText: "うわ～！たたかれた～！",
    gameOverText: "チクッと勝利！かゆいでしょ～？",
    introText: "すばやく飛び回り、気づかないうちにチクリとこうげきしてくる。"
  },
  {
    emoji: "🦎",
    name: "ペタペタン",
    minLevel: 1,
    clearText: "しっぽを置いて、にげるペタン！",
    gameOverText: "ペタッとくっついて、ボクの勝ち！",
    introText: "壁や天井にペタペタくっつき、とつぜん目の前に現れる。"
  },
  {
    emoji: "🦇",
    name: "バサット",
    minLevel: 1,
    clearText: "まぶしすぎる～！バサッ……",
    gameOverText: "バサバサッ！夜空はボクのもの！",
    introText: "暗い場所を好み、大きな羽音を立てながら急降下してくる。"
  },
  {
    emoji: "🐍",
    name: "ニョロキング",
    minLevel: 1,
    clearText: "王さまなのに、まけたニョロ～！",
    gameOverText: "ニョロニョロ王国へようこそ！",
    introText: "ヘビたちの王様で、長い体を使って相手を取り囲む。"
  },
  {
    emoji: "🐙",
    name: "タコンスター",
    minLevel: 1,
    clearText: "足がこんがらがったタコ～！",
    gameOverText: "８本のうでに、スキはなし！",
    introText: "8本の足を器用に動かし、次々と攻撃をくり出す海のスター。"
  },
  {
    emoji: "🦅",
    name: "イーグルン",
    minLevel: 1,
    clearText: "羽がフラフラだ～！",
    gameOverText: "空からぜ～んぶ見えていたぞ！",
    introText: "空高くから相手を見つけ、ものすごい速さで飛びかかる。"
  },
  {
    emoji: "🐺",
    name: "ガウルフ",
    minLevel: 1,
    clearText: "クゥ～ン……強かったワン……",
    gameOverText: "ガウッ！遠ぼえするほどの大勝利！",
    introText: "大きな遠ぼえで仲間を呼び、群れになって攻めてくる。"
  },
  {
    emoji: "👻",
    name: "ユラリン",
    minLevel: 1,
    clearText: "フワッと消えるよ……またね～！",
    gameOverText: "ユ～ラユラ！つかまえられないよ～！",
    introText: "空中をゆらゆらただよい、かべをすり抜けて背後からおどろかせる。"
  },
  // レベル2以上で出現
  {
    emoji: "🐗",
    name: "トッシンボー",
    minLevel: 2,
    clearText: "とっしんする方向をまちがえた～！",
    gameOverText: "止まれない！勝利へ一直線！",
    introText: "一度走り出すと止まれず、どんなものにも一直線に突っ込む。"
  },
  {
    emoji: "👁️",
    name: "ギョロリン",
    minLevel: 2,
    clearText: "目がまわる～！ギョロギョロ～！",
    gameOverText: "ギョロッ！弱点はお見通し！",
    introText: "大きな目で相手の動きを観察し、弱点をすぐに見つけ出す。"
  },
  {
    emoji: "💀",
    name: "ホネボーン",
    minLevel: 2,
    clearText: "ホネがバラバラ、ボーン！",
    gameOverText: "カラカラ笑って、ボクの勝ち！",
    introText: "体がバラバラになっても、カラカラ音を立てて元に戻る。"
  },
  {
    emoji: "🕷️",
    name: "スパイダー！",
    minLevel: 2,
    clearText: "糸がからまった～！だれかほどいて！",
    gameOverText: "クモのす作戦、大成功！",
    introText: "丈夫な糸でクモの巣をはり、動けなくなった相手をねらう。"
  },
  // レベル3以上で出現
  {
    emoji: "🦂",
    name: "サソリンガー",
    minLevel: 3,
    clearText: "チクショ～！しっぽがしびれた～！",
    gameOverText: "ハサミとしっぽのダブル攻撃！",
    introText: "大きなハサミとするどいしっぽを持つ、砂漠の危険な戦士。"
  },
  {
    emoji: "🤖",
    name: "ロボスターMk.II",
    minLevel: 3,
    clearText: "エラー発生！サイキドウシマス……",
    gameOverText: "ショウリ、カクニン。ピピピッ！",
    introText: "戦いのデータを分析し、負けるたびに強くなる最新型ロボット。"
  },
  {
    emoji: "😈",
    name: "ワルイモン",
    minLevel: 3,
    clearText: "いい子になれば勝てたのかな～？",
    gameOverText: "イッヒッヒ！わるい作戦、大成功！",
    introText: "いたずらと悪だくみが大好きで、いつも誰かをこまらせている。"
  },
  {
    emoji: "🧙",
    name: "まほじい",
    minLevel: 3,
    clearText: "呪文を一文字まちがえたわい……",
    gameOverText: "ほっほっほ、これぞ勝利の魔法じゃ！",
    introText: "長年研究した不思議な魔法を使うが、ときどき呪文をまちがえる。"
  },
  // レベル4以上で出現
  {
    emoji: "👾",
    name: "インベーダ",
    minLevel: 4,
    clearText: "ゲームオーバー……ピコーン……",
    gameOverText: "ピコピコ！このステージはいただいた！",
    introText: "電子の世界から現れ、ピコピコ音とともにこうげきをしかける。"
  },
  {
    emoji: "👹",
    name: "大あかおに",
    minLevel: 4,
    clearText: "まいった！ツノまでクラクラだ～！",
    gameOverText: "ガッハッハ！オニにかなぼうじゃ！",
    introText: "大きな体と怪力がじまんで、怒ると地面までゆれるという。"
  },
  {
    emoji: "👺",
    name: "テングスター",
    minLevel: 4,
    clearText: "鼻を高くしすぎた～！",
    gameOverText: "この長い鼻にかけて、わしの勝ち！",
    introText: "長い鼻と大きなうちわを使い、強い風を巻き起こす。"
  },
  {
    emoji: "🧛",
    name: "バンパイアン",
    minLevel: 4,
    clearText: "朝日が出る前に帰ります～！",
    gameOverText: "今夜の勝者は、このわたしだ！",
    introText: "夜になると目を覚まし、マントを広げて音もなく近づいてくる。"
  },
  // レベル5以上で出現
  {
    emoji: "🦖",
    name: "ガブリュウ",
    minLevel: 5,
    clearText: "ガブッといく前に、やられた～！",
    gameOverText: "ガブッと勝利をいただき！",
    introText: "大きな口とするどい歯を持ち、目の前のものに何でもかみつく。"
  },
  {
    emoji: "👽",
    name: "ウチュウジンZ",
    minLevel: 5,
    clearText: "ワレワレハ、タイキャクスル～！",
    gameOverText: "チキュウノショウリ、ゲットシタ！",
    introText: "遠い星から地球を調査するためにやって来たナゾの宇宙人。"
  },
  // レベルMAX（内部レベル6）のみで出現
  {
    emoji: "🛸",
    name: "クルクルーン",
    minLevel: 6,
    clearText: "回りすぎて、目がまわる～！",
    gameOverText: "クルクル回って、勝利にとうちゃく！",
    introText: "回転しながら空を飛び、不思議な光で相手をまどわせる。"
  },
  {
    emoji: "🐲",
    name: "リュウキング",
    minLevel: 6,
    clearText: "無念！お前が真の文章題マスターだ･･･",
    gameOverText: "天までとどけ！王者のほうこう！",
    introText: "空と大地を支配する伝説の王で、口から強力な息を放つ。"
  }
];
