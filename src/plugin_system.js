// @ts-nocheck
const { NakoRuntimeError } = require('./nako_errors')
const NakoVersion = require('./nako_version')

const PluginSystem = {
  初期化: {
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      sys.__v0['ナデシコバージョン'] = typeof NakoVersion === 'undefined' ? '?' : NakoVersion.version
      // なでしこの関数や変数を探して返す
      sys.__findVar = function (nameStr, def) {
        if (typeof nameStr === 'function') { return nameStr }
        if (sys.__locals[nameStr]) { return sys.__locals[nameStr] }
        for (let i = 2; i >= 0; i--) {
          const scope = sys.__varslist[i]
          if (scope[nameStr]) { return scope[nameStr] }
        }
        return def
      }
      // 文字列から関数を探す
      sys.__findFunc = function (nameStr, parentFunc) {
        const f = sys.__findVar(nameStr)
        if (typeof f === 'function') { return f }
        throw new Error(`『${parentFunc}』に実行できない関数が指定されました。`)
      }
      // システム関数を実行
      sys.__exec = function (func, params) {
        // システム命令を優先
        const f0 = sys.__v0[func]
        if (f0) { return f0.apply(this, params) }
        // グローバル・ローカルを探す
        const f = sys.__findVar(func)
        if (!f) { throw new Error('システム関数でエイリアスの指定ミス:' + func) }
        return f.apply(this, params)
      }
      // タイマーに関する処理(タイマーは「!クリア」で全部停止する)
      sys.__timeout = []
      sys.__interval = []
    }
  },
  '!クリア': {
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      sys.__exec('全タイマー停止', [sys])
      if (sys.__genMode === '非同期モード') { sys.__stopAsync(sys) }
    }
  },

  // @システム定数
  ナデシコバージョン: { type: 'const', value: '?' }, // @なでしこばーじょん
  ナデシコエンジン: { type: 'const', value: 'nadesi.com/v3' }, // @なでしこえんじん
  ナデシコ種類: { type: 'const', value: 'wnako3/cnako3' }, // @なでしこしゅるい
  はい: { type: 'const', value: 1 }, // @はい
  いいえ: { type: 'const', value: 0 }, // @いいえ
  真: { type: 'const', value: 1 }, // @しん
  偽: { type: 'const', value: 0 }, // @ぎ
  永遠: { type: 'const', value: 1 }, // @えいえん
  オン: { type: 'const', value: 1 }, // @おん
  オフ: { type: 'const', value: 0 }, // @おふ
  改行: { type: 'const', value: '\n' }, // @かいぎょう
  タブ: { type: 'const', value: '\t' }, // @たぶ
  カッコ: { type: 'const', value: '「' }, // @かっこ
  カッコ閉: { type: 'const', value: '」' }, // @かっことじ
  波カッコ: { type: 'const', value: '{' }, // @なみかっこ
  波カッコ閉: { type: 'const', value: '}' }, // @なみかっことじ
  OK: { type: 'const', value: true }, // @OK
  NG: { type: 'const', value: false }, // @NG
  キャンセル: { type: 'const', value: 0 }, // @きゃんせる
  PI: { type: 'const', value: Math.PI }, // @PI
  空: { type: 'const', value: '' }, // @から
  NULL: { type: 'const', value: null }, // @NULL
  undefined: { type: 'const', value: undefined }, // @undefined
  未定義: { type: 'const', value: undefined }, // @みていぎ
  エラーメッセージ: { type: 'const', value: '' }, // @えらーめっせーじ
  対象: { type: 'const', value: '' }, // @たいしょう
  対象キー: { type: 'const', value: '' }, // @たいしょうきー
  回数: { type: 'const', value: '' }, // @かいすう
  CR: { type: 'const', value: '\r' }, // @CR
  LF: { type: 'const', value: '\n' }, // @LF
  非数: { type: 'const', value: NaN }, // @ひすう
  無限大: { type: 'const', value: Infinity }, // @むげんだい
  空配列: { // @空の配列を返す。『[]』と同義。 // @からはいれつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      return []
    }
  },
  空辞書: { // @空の辞書型を返す。『{}』と同義。 // @からじしょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      return []
    }
  },
  空ハッシュ: { // @空のハッシュを返す(v3.2以降非推奨) // @からはっしゅ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      return {}
    }
  },
  空オブジェクト: { // @空のオブジェクトを返す(v3.2以降非推奨) // @からおぶじぇくと
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      return sys.__exec('空ハッシュ', [sys])
    }
  },

  // @標準出力
  表示: { // @Sを表示 // @ひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function (s, sys) {
      sys.__varslist[0]['表示ログ'] += (s + '\n')
      sys.logger.send('stdout', s + '')
    },
    return_none: true
  },
  表示ログ: { type: 'const', value: '' }, // @ひょうじろぐ
  表示ログクリア: { // @表示ログを空にする // @ひょうじろぐくりあ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      sys.__varslist[0]['表示ログ'] = ''
    },
    return_none: true
  },
  言: { // @Sを表示 // @いう
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function (s, sys) {
      sys.logger.send('stdout', s + '')
    },
    return_none: true
  },
  コンソール表示: { // @Sをコンソール表示する(console.log) // @こんそーるひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function (s, sys) {
      console.log(s)
    },
    return_none: true
  },

  // @四則演算
  足: { // @AとBを足す // @たす
    type: 'func',
    josi: [['に', 'と'], ['を']],
    isVariableJosi: false,
    pure: true,
    fn: function (a, b) {
      return a + b
    }
  },
  引: { // @AからBを引く // @ひく
    type: 'func',
    josi: [['から'], ['を']],
    pure: true,
    fn: function (a, b) {
      return a - b
    }
  },
  掛: { // @AにBを掛ける // @かける
    type: 'func',
    josi: [['に', 'と'], ['を']],
    pure: true,
    fn: function (a, b) {
      return a * b
    }
  },
  倍: { // @AのB倍を求める // @ばい
    type: 'func',
    josi: [['の'], ['']],
    pure: true,
    fn: function (a, b) {
      return a * b
    }
  },
  割: { // @AをBで割る // @わる
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a, b) {
      return a / b
    }
  },
  割余: { // @AをBで割った余りを求める // @わったあまり
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a, b) {
      return a % b
    }
  },
  以上: { // @AがB以上か // @いじょう
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function (a, b) {
      return a >= b
    }
  },
  以下: { // @AがB以下か // @いか
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function (a, b) {
      return a <= b
    }
  },
  未満: { // @AがB未満か // @みまん
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function (a, b) {
      return a < b
    }
  },
  超: { // @AがB超か // @ちょう
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function (a, b) {
      return a > b
    }
  },
  等: { // @AがBと等しいか // @ひとしい
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function (a, b) {
      return a === b
    }
  },
  等無: { // @AがBと等しくないか // @ひとしくない
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function (a, b) {
      return a !== b
    }
  },
  一致: { // @AがBと一致するか(配列や辞書も比較可能) // @いっち
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function (a, b) {
      // オブジェクトの場合、JSONに変換して比較
      if (typeof (a) === 'object') {
        const jsonA = JSON.stringify(a)
        const jsonB = JSON.stringify(b)
        return jsonA === jsonB
      }
      return a === b
    }
  },
  不一致: { // @AがBと不一致か(配列や辞書も比較可能) // @ふいっち
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function (a, b) {
      // オブジェクトの場合、JSONに変換して比較
      if (typeof (a) === 'object') {
        const jsonA = JSON.stringify(a)
        const jsonB = JSON.stringify(b)
        return jsonA !== jsonB
      }
      return a !== b
    }
  },
  範囲内: { // @VがAからBの範囲内か // @はんいない
    type: 'func',
    josi: [['が'], ['から'], ['の']],
    pure: true,
    fn: function (v, a, b) {
      return (a <= v) && (v <= b)
    }
  },
  連続加算: { // @A1+A2+A3...にBを足す // @れんぞくかさん
    type: 'func',
    josi: [['を'], ['に', 'と']],
    isVariableJosi: true,
    pure: true,
    fn: function (b, ...a) {
      // 末尾のシステム変数を除外
      a.pop()
      a.push(b)
      return a.reduce((p, c) => p + c)
    }
  },

  // @敬語
  ください: { // @敬語対応のため // @ください
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  お願: { // @ソースコードを読む人を気持ちよくする // @おねがいします
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  です: { // @ソースコードを読む人を気持ちよくする // @です
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  拝啓: { // @ソースコードを読む人を気持ちよくする // @はいけい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      sys.__reisetu = 0
    },
    return_none: true
  },
  礼節レベル取得: { // @(お遊び)敬語を何度使ったか返す // @おねがいします
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      return sys.__reisetu
    }
  },

  // @特殊命令
  JS実行: { // @JavaScriptのコードSRCを実行する(変数sysでなでしこシステムを参照できる) // @JSじっこう
    type: 'func',
    josi: [['を', 'で']],
    pure: true,
    fn: function (src, sys) {
      return eval(src) // eslint-disable-line
    }
  },
  JSオブジェクト取得: { // @なでしこで定義した関数や変数nameのJavaScriptオブジェクトを取得する // @JSおぶじぇくとしゅとく
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (name, sys) {
      return sys.__findVar(name, null)
    }
  },
  JS関数実行: { // @JavaScriptの関数NAMEを引数ARGS(配列)で実行する // @JSかんすうしゅとく
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (name, args, sys) {
      // nameが文字列ならevalして関数を得る
      // eslint-disable-next-line no-eval
      if (typeof name === 'string') { name = eval(name) }
      if (typeof name !== 'function') { throw new Error('JS関数取得で実行できません。') }

      // argsがArrayでなければArrayに変換する
      if (!(args instanceof Array)) { args = [args] }

      // 実行
      return name.apply(null, args)
    }
  },
  JSメソッド実行: { // @JavaScriptのオブジェクトOBJのメソッドMを引数ARGS(配列)で実行する // @JSめそっどじっこう
    type: 'func',
    josi: [['の'], ['を'], ['で']],
    fn: function (obj, m, args, sys) {
      // objが文字列ならevalして関数を得る
      // eslint-disable-next-line no-eval
      if (typeof obj === 'string') { obj = eval(obj) }
      if (typeof obj !== 'object') { throw new Error('JSオブジェクトを取得できませんでした。') }

      // method を求める
      if (typeof m !== 'function') {
        m = obj[m]
      }

      // argsがArrayでなければArrayに変換する
      if (!(args instanceof Array)) { args = [args] }

      // 実行
      return m.apply(obj, args)
    }
  },

  ナデシコ: { // @なでしこのコードCODEを実行する // @なでしこする
    type: 'func',
    josi: [['を', 'で']],
    fn: function (code, sys) {
      sys.__varslist[0]['表示ログ'] = ''
      sys.__self.runEx(code, 'immediate-code.nako3', { resetEnv: false, resetLog: true })
      const out = sys.__varslist[0]['表示ログ'] + ''
      if (out) {
        sys.logger.send('stdout', out)
      }
      return out
    }
  },
  ナデシコ続: { // @なでしこのコードCODEを実行する // @なでしこつづける
    type: 'func',
    josi: [['を', 'で']],
    fn: function (code, sys) {
      sys.__self.runEx(code, 'immediate-code.nako3', { resetEnv: false, resetLog: false })
      const out = sys.__varslist[0]['表示ログ'] + ''
      if (out) {
        sys.logger.send('stdout', out)
      }
      return out
    }
  },
  実行: { // @ 無名関数（あるいは、文字列で関数名を指定）Fを実行する(Fが関数でなければ無視する) // @じっこう
    type: 'func',
    josi: [['を', 'に', 'で']],
    pure: false,
    fn: function (f, sys) {
      // #938 の規則に従って処理
      // 引数が関数なら実行
      if (typeof f === 'function') { return f(sys) }
      // 文字列なら関数に変換できるか判定して実行
      if (typeof f === 'string') {
        const tf = sys.__findFunc(f, '実行')
        if (typeof tf === 'function') {
          return tf(sys)
        }
      }
      // それ以外ならそのまま値を返す
      return f
    }
  },
  実行時間計測: { // @ 関数Fを実行して要した時間をミリ秒で返す // @じっこうじかんけいそく
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (f, sys) {
      if (typeof f === 'string') { f = sys.__findFunc(f, '実行時間計測') }
      //
      if (performance && performance.now) {
        const t1 = performance.now()
        f(sys)
        const t2 = performance.now()
        return (t2 - t1)
      } else {
        const t1 = Date.now()
        f(sys)
        const t2 = Date.now()
        return (t2 - t1)
      }
    }
  },

  // @型変換
  変数型確認: { // @変数Vの型を返す // @へんすうかたかくにん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return typeof (v)
    }
  },
  TYPEOF: { // @変数Vの型を返す // @TYPEOF
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return typeof (v)
    }
  },
  文字列変換: { // @値Vを文字列に変換 // @もじれつへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return String(v)
    }
  },
  TOSTR: { // @値Vを文字列に変換 // @TOSTR
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return String(v)
    }
  },
  整数変換: { // @値Vを整数に変換 // @せいすうへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return parseInt(v)
    }
  },
  TOINT: { // @値Vを整数に変換 // @TOINT
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return parseInt(v)
    }
  },
  実数変換: { // @値Vを実数に変換 // @じっすうへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return parseFloat(v)
    }
  },
  TOFLOAT: { // @値Vを実数に変換 // @TOFLOAT
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return parseFloat(v)
    }
  },
  INT: { // @値Vを整数に変換 // @INT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return parseInt(v)
    }
  },
  FLOAT: { // @値Vを実数に変換 // @FLOAT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return parseFloat(v)
    }
  },
  NAN判定: { // @値VがNaNかどうかを判定 // @NANはんてい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return isNaN(v)
    }
  },
  HEX: { // @値Vを16進数に変換 // @HEX
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return parseInt(a).toString(16)
    }
  },
  RGB: { // @HTML用のカラーコードを返すRGB(R,G,B)で各値は0-255 // @RGB
    type: 'func',
    josi: [['と'], ['の'], ['で']],
    pure: true,
    fn: function (r, g, b) {
      const z2 = (v) => {
        const v2 = '00' + parseInt(v).toString(16)
        return v2.substr(v2.length - 2, 2)
      }
      return '#' + z2(r) + z2(g) + z2(b)
    }
  },

  // @論理演算
  論理OR: { // @(ビット演算で)AとBの論理和を返す(v1非互換)。 // @ろんりOR
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a, b) {
      return (a || b)
    }
  },
  論理AND: { // @(ビット演算で)AとBの論理積を返す(v1非互換)。日本語の「AかつB」に相当する // @ろんりAND
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a, b) {
      return (a && b)
    }
  },
  論理NOT: { // @値Vが0ならば1、それ以外ならば0を返す(v1非互換) // @ろんりNOT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return (!v) ? 1 : 0
    }
  },

  // @ビット演算
  OR: { // @(ビット演算で)AとBの論理和を返す。 // @OR
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a, b) {
      return (a | b)
    }
  },
  AND: { // @(ビット演算で)AとBの論理積を返す。日本語の「AかつB」に相当する // @AND
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a, b) {
      return (a & b)
    }
  },
  XOR: { // @(ビット演算で)AとBの排他的論理和を返す。// @XOR
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a, b) {
      return (a ^ b)
    }
  },
  NOT: { // @(ビット演算で)vの各ビットを反転して返す。// @NOT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return (~v)
    }
  },
  SHIFT_L: { // @VをAビット左へシフトして返す // @SHIFT_L
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a, b) {
      return (a << b)
    }
  },
  SHIFT_R: { // @VをAビット右へシフトして返す(符号を維持する) // @SHIFT_R
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a, b) {
      return (a >> b)
    }
  },
  SHIFT_UR: { // @VをAビット右へシフトして返す(符号を維持しない、0で埋める) // @SHIFT_UR
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a, b) {
      return (a >>> b)
    }
  },

  // @文字列処理
  文字数: { // @文字列Vの文字数を返す // @もじすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      if (!Array.from) { return String(v).length }
      return Array.from(v).length
    }
  },
  何文字目: { // @文字列SでAが何文字目にあるか調べて返す // @なんもじめ
    type: 'func',
    josi: [['で', 'の'], ['が']],
    pure: true,
    fn: function (s, a) {
      return String(s).indexOf(a) + 1
    }
  },
  CHR: { // @文字コードから文字を返す // @CHR
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      if (!String.fromCodePoint) { return String.fromCharCode(v) }
      return String.fromCodePoint(v)
    }
  },
  ASC: { // @文字列Vの最初の文字の文字コードを返す // @ASC
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      if (!String.prototype.codePointAt) { return String(v).charCodeAt(0) }
      return String(v).codePointAt(0)
    }
  },
  文字挿入: { // @文字列SのI文字目に文字列Aを挿入する // @もじそうにゅう
    type: 'func',
    josi: [['で', 'の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (s, i, a) {
      if (i <= 0) { i = 1 }
      const ss = String(s)
      const mae = ss.substr(0, i - 1)
      const usi = ss.substr(i - 1)
      return mae + a + usi
    }
  },
  文字検索: { // @文字列Sで文字列A文字目からBを検索。見つからなければ0を返す。(類似命令に『何文字目』がある)(v1非互換) // @もじけんさく
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を']],
    pure: true,
    fn: function (s, a, b) {
      let str = String(s)
      str = str.substr(a)
      const res = str.indexOf(b)
      if (res === -1) { return 0 }
      return res + 1 + a
    }
  },
  追加: { // @文字列SにAを追加して返す(v1非互換) // @ついか
    type: 'func',
    josi: [['で', 'に', 'へ'], ['を']],
    pure: true,
    fn: function (s, a) {
      return String(s) + String(a)
    }
  },
  一行追加: { // @文字列SにAと改行を追加して返す(v1非互換) // @いちぎょうついか
    type: 'func',
    josi: [['で', 'に', 'へ'], ['を']],
    pure: true,
    fn: function (s, a) {
      return String(s) + String(a) + '\n'
    }
  },
  文字列分解: { // @文字列Vを一文字ずつに分解して返す // @もじれつぶんかい
    type: 'func',
    josi: [['を', 'の', 'で']],
    pure: true,
    fn: function (v) {
      if (!Array.from) { return String(v).split('') }
      return Array.from(v)
    }
  },
  リフレイン: { // @文字列VをCNT回繰り返す(v1非互換) // @りふれいん
    type: 'func',
    josi: [['を', 'の'], ['で']],
    pure: true,
    fn: function (v, cnt) {
      let s = ''
      for (let i = 0; i < cnt; i++) { s += String(v) }
      return s
    }
  },
  出現回数: { // @文字列SにAが何回出現するか数える // @しゅつげんかいすう
    type: 'func',
    josi: [['で'], ['の']],
    pure: true,
    fn: function (s, a) {
      let cnt = 0
      const re = new RegExp(a.replace(/(.)/g, '\\$1'), 'g')
      String(s).replace(re, m => {
        cnt++
      })
      return cnt
    }
  },
  MID: { // @文字列SのA文字目からCNT文字を抽出する // @MID
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を']],
    pure: true,
    fn: function (s, a, cnt) {
      cnt = cnt || undefined
      return (String(s).substr(a - 1, cnt))
    }
  },
  文字抜出: { // @文字列SのA文字目からCNT文字を抽出する // @もじぬきだす
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を', '']],
    pure: true,
    fn: function (s, a, cnt) {
      cnt = cnt || undefined
      return (String(s).substr(a - 1, cnt))
    }
  },
  LEFT: { // @文字列Sの左端からCNT文字を抽出する // @LEFT
    type: 'func',
    josi: [['の', 'で'], ['だけ']],
    pure: true,
    fn: function (s, cnt) {
      return (String(s).substr(0, cnt))
    }
  },
  文字左部分: { // @文字列Sの左端からCNT文字を抽出する // @もじひだりぶぶん
    type: 'func',
    josi: [['の', 'で'], ['だけ', '']],
    pure: true,
    fn: function (s, cnt) {
      return (String(s).substr(0, cnt))
    }
  },
  RIGHT: { // @文字列Sの右端からCNT文字を抽出する // @RIGHT
    type: 'func',
    josi: [['の', 'で'], ['だけ']],
    pure: true,
    fn: function (s, cnt) {
      s = '' + s
      return (s.substr(s.length - cnt, cnt))
    }
  },
  文字右部分: { // @文字列Sの右端からCNT文字を抽出する // @もじみぎぶぶん
    type: 'func',
    josi: [['の', 'で'], ['だけ', '']],
    pure: true,
    fn: function (s, cnt) {
      s = '' + s
      return (s.substr(s.length - cnt, cnt))
    }
  },
  区切: { // @文字列Sを区切り文字Aで区切って配列で返す // @くぎる
    type: 'func',
    josi: [['の', 'を'], ['で']],
    pure: true,
    fn: function (s, a) {
      return ('' + s).split('' + a)
    }
  },
  切取: { // @文字列Sから文字列Aまでの部分を抽出する(v1非互換) // @きりとる
    type: 'func',
    josi: [['から', 'の'], ['まで', 'を']],
    pure: true,
    fn: function (s, a) {
      s = String(s)
      const i = s.indexOf(a)
      if (i < 0) { return s }
      return s.substr(0, i)
    }
  },
  文字削除: { // @文字列SのA文字目からB文字分を削除して返す // @もじさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['だけ', 'を', '']],
    pure: true,
    fn: function (s, a, b) {
      s = '' + s
      const mae = s.substr(0, a - 1)
      const usi = s.substr((a - 1 + b))
      return mae + usi
    }
  },

  // @置換・トリム
  置換: { // @文字列Sのうち文字列AをBに全部置換して返す // @ちかん
    type: 'func',
    josi: [['の', 'で'], ['を', 'から'], ['に', 'へ']],
    pure: true,
    fn: function (s, a, b) {
      return String(s).split(a).join(b)
    }
  },
  単置換: { // @文字列Sのうち、最初に出現するAだけをBに置換して返す // @たんちかん
    type: 'func',
    josi: [['の', 'で'], ['を'], ['に', 'へ']],
    pure: true,
    fn: function (s, a, b) {
      s = String(s)
      const re = new RegExp(a.replace(/(.)/g, '\\$1'), '')
      return s.replace(re, b)
    }
  },
  トリム: { // @文字列Sの前後にある空白を削除する // @とりむ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      s = String(s).replace(/^\s+/, '').replace(/\s+$/, '')
      return s
    }
  },
  空白除去: { // @文字列Sの前後にある空白を削除する // @くうはくじょきょ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      s = String(s).replace(/^\s+/, '').replace(/\s+$/, '')
      return s
    }
  },

  // @文字変換
  大文字変換: { // @アルファベットの文字列Sを大文字に変換 // @おおもじへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      return String(s).toUpperCase()
    }
  },
  小文字変換: { // @アルファベットの文字列Sを小文字に変換 // @こもじへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      return String(s).toLowerCase()
    }
  },
  平仮名変換: { // @文字列Sのカタカナをひらがなに変換 // @ひらがなへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      const kanaToHira = (str) => {
        return String(str).replace(/[\u30a1-\u30f6]/g, function (m) {
          const chr = m.charCodeAt(0) - 0x60
          return String.fromCharCode(chr)
        })
      }
      return kanaToHira(s)
    }
  },
  カタカナ変換: { // @文字列Sのひらがなをカタカナに変換 // @かたかなへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      const hiraToKana = (str) => {
        return String(str).replace(/[\u3041-\u3096]/g, function (m) {
          const chr = m.charCodeAt(0) + 0x60
          return String.fromCharCode(chr)
        })
      }
      return hiraToKana(s)
    }
  },
  英数全角変換: { // @文字列Sの半角英数文字を全角に変換 // @えいすうぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      return String(s).replace(/[A-Za-z0-9]/g, function (v) {
        return String.fromCharCode(v.charCodeAt(0) + 0xFEE0)
      })
    }
  },
  英数半角変換: { // @文字列Sの全角英数文字を半角に変換 // @えいすうはんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      return String(s).replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (v) {
        return String.fromCharCode(v.charCodeAt(0) - 0xFEE0)
      })
    }
  },
  英数記号全角変換: { // @文字列Sの半角英数記号文字を全角に変換 // @えいすうきごうぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      return String(s).replace(/[\x20-\x7F]/g, function (v) {
        return String.fromCharCode(v.charCodeAt(0) + 0xFEE0)
      })
    }
  },
  英数記号半角変換: { // @文字列Sの記号文字を半角に変換 // @えいすうきごうはんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s) {
      return String(s).replace(/[\uFF00-\uFF5F]/g, function (v) {
        return String.fromCharCode(v.charCodeAt(0) - 0xFEE0)
      })
    }
  },
  カタカナ全角変換: { // @文字列Sの半角カタカナを全角に変換 // @かたかなぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s, sys) {
      // 半角カタカナ
      const zen1 = sys.__v0['全角カナ一覧']
      const han1 = sys.__v0['半角カナ一覧']
      const zen2 = sys.__v0['全角カナ濁音一覧']
      const han2 = sys.__v0['半角カナ濁音一覧']
      let str = ''
      let i = 0
      while (i < s.length) {
        // 濁点の変換
        const c2 = s.substr(i, 2)
        const n2 = han2.indexOf(c2)
        if (n2 >= 0) {
          str += zen2.charAt(n2 / 2)
          i += 2
          continue
        }
        // 濁点以外の変換
        const c = s.charAt(i)
        const n = han1.indexOf(c)
        if (n >= 0) {
          str += zen1.charAt(n)
          i++
          continue
        }
        str += c
        i++
      }
      return str
    }
  },
  カタカナ半角変換: { // @文字列Sの全角カタカナを半角に変換 // @かたかなはんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s, sys) {
      // 半角カタカナ
      const zen1 = sys.__v0['全角カナ一覧']
      const han1 = sys.__v0['半角カナ一覧']
      const zen2 = sys.__v0['全角カナ濁音一覧']
      const han2 = sys.__v0['半角カナ濁音一覧']
      return s.split('').map((c) => {
        const i = zen1.indexOf(c)
        if (i >= 0) {
          return han1.charAt(i)
        }
        const j = zen2.indexOf(c)
        if (j >= 0) {
          return han2.substr(j * 2, 2)
        }
        return c
      }).join('')
    }
  },
  全角変換: { // @文字列Sの半角文字を全角に変換 // @ぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: false,
    fn: function (s, sys) {
      let result = s
      result = sys.__exec('カタカナ全角変換', [result, sys])
      result = sys.__exec('英数記号全角変換', [result, sys])
      return result
    }
  },
  半角変換: { // @文字列Sの全角文字を半角に変換 // @はんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: false,
    fn: function (s, sys) {
      let result = s
      result = sys.__exec('カタカナ半角変換', [result, sys])
      result = sys.__exec('英数記号半角変換', [result, sys])
      return result
    }
  },
  全角カナ一覧: { type: 'const', value: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッ、。ー「」' }, // @ぜんかくかないちらん
  全角カナ濁音一覧: { type: 'const', value: 'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ' }, // @ぜんかくかなだくおんいちらん
  半角カナ一覧: { type: 'const', value: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｧｨｩｪｫｬｭｮｯ､｡ｰ｢｣ﾞﾟ' }, // @はんかくかないちらん
  半角カナ濁音一覧: { type: 'const', value: 'ｶﾞｷﾞｸﾞｹﾞｺﾞｻﾞｼﾞｽﾞｾﾞｿﾞﾀﾞﾁﾞﾂﾞﾃﾞﾄﾞﾊﾞﾋﾞﾌﾞﾍﾞﾎﾞﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ' }, // @はんかくかなだくおんいちらん

  // @JSON
  JSONエンコード: { // @オブジェクトVをJSON形式にエンコードして返す // @JSONえんこーど
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (v) {
      return JSON.stringify(v)
    }
  },
  JSONエンコード整形: { // @オブジェクトVをJSON形式にエンコードして整形して返す // @JSONえんこーどせいけい
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (v) {
      return JSON.stringify(v, null, 2)
    }
  },
  JSONデコード: { // @JSON文字列Sをオブジェクトにデコードして返す // @JSONでこーど
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function (s) {
      return JSON.parse(s)
    }
  },

  // @正規表現
  正規表現マッチ: { // @文字列Aを正規表現パターンBでマッチして結果を返す(パターンBは「/pat/opt」の形式で指定。optにgの指定がなければ部分マッチが『抽出文字列』に入る) // @せいきひょうげんまっち
    type: 'func',
    josi: [['を', 'が'], ['で', 'に']],
    pure: true,
    fn: function (a, b, sys) {
      let re
      const f = b.match(/^\/(.+)\/([a-zA-Z]*)$/)
      // パターンがない場合
      if (f === null) { re = new RegExp(b, 'g') } else { re = new RegExp(f[1], f[2]) }

      const sa = sys.__varslist[0]['抽出文字列'] = []
      const m = String(a).match(re)
      let result = m
      if (re.global) {
        // no groups
      } else if (m) {
        // has group?
        if (m.length > 0) {
          result = m[0]
          for (let i = 1; i < m.length; i++) { sa[i - 1] = m[i] }
        }
      }
      return result
    }
  },
  抽出文字列: { type: 'const', value: [] }, // @ちゅうしゅつもじれつ
  正規表現置換: { // @文字列Sの正規表現パターンAをBに置換して結果を返す(パターンAは/pat/optで指定) // @せいきひょうげんちかん
    type: 'func',
    josi: [['の'], ['を', 'から'], ['で', 'に', 'へ']],
    pure: true,
    fn: function (s, a, b) {
      let re
      const f = a.match(/^\/(.+)\/([a-zA-Z]*)/)
      if (f === null) { re = new RegExp(a, 'g') } else { re = new RegExp(f[1], f[2]) }

      return String(s).replace(re, b)
    }
  },
  正規表現区切: { // @文字列Sを正規表現パターンAで区切って配列で返す(パターンAは/pat/optで指定) // @せいきひょうげんくぎる
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (s, a) {
      let re
      const f = a.match(/^\/(.+)\/([a-zA-Z]*)/)
      if (f === null) { re = new RegExp(a, 'g') } else { re = new RegExp(f[1], f[2]) }

      return String(s).split(re)
    }
  },

  // @指定形式
  通貨形式: { // @数値Vを三桁ごとにカンマで区切る // @つうかけいしき
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (v) {
      return String(v).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
    }
  },
  ゼロ埋: { // @数値VをA桁の0で埋める // @ぜろうめ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (v, a) {
      v = String(v)
      let z = '0'
      for (let i = 0; i < a; i++) { z += '0' }
      a = parseInt(a)
      if (a < v.length) { a = v.length }
      const s = z + String(v)
      return s.substr(s.length - a, a)
    }
  },
  空白埋: { // @文字列VをA桁の空白で埋める // @くうはくうめ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (v, a) {
      v = String(v)
      let z = ' '
      for (let i = 0; i < a; i++) { z += ' ' }
      a = parseInt(a)
      if (a < v.length) { a = v.length }
      const s = z + String(v)
      return s.substr(s.length - a, a)
    }
  },

  // @文字種類
  かなか判定: { // @文字列Sの1文字目がひらがなか判定 // @かなかはんてい
    type: 'func',
    josi: [['を', 'の', 'が']],
    pure: true,
    fn: function (s) {
      const c = String(s).charCodeAt(0)
      return (c >= 0x3041 && c <= 0x309F)
    }
  },
  カタカナ判定: { // @文字列Sの1文字目がカタカナか判定 // @かたかなかはんてい
    type: 'func',
    josi: [['を', 'の', 'が']],
    pure: true,
    fn: function (s) {
      const c = String(s).charCodeAt(0)
      return (c >= 0x30A1 && c <= 0x30FA)
    }
  },
  数字判定: { // @文字列Sの1文字目が数字か判定 // @すうじかはんてい
    type: 'func',
    josi: [['を', 'が']],
    pure: true,
    fn: function (s) {
      const c = String(s).charAt(0)
      return ((c >= '0' && c <= '9') || (c >= '０' && c <= '９'))
    }
  },
  数列判定: { // @文字列S全部が数字か判定 // @すうれつかはんてい
    type: 'func',
    josi: [['を', 'が']],
    pure: true,
    fn: function (s) {
      return (String(s).match(/^[0-9.]+$/) !== null)
    }
  },

  // @配列操作
  配列結合: { // @配列Aを文字列Sでつなげて文字列で返す // @はいれつけつごう
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a, s) {
      // 配列ならOK
      if (a instanceof Array) { return a.join('' + s) }

      const a2 = String(a).split('\n') // 配列でなければ無理矢理改行で区切ってみる
      return a2.join('' + s)
    }
  },
  配列検索: { // @配列Aから文字列Sを探してインデックス番号(0起点)を返す。見つからなければ-1を返す。 // @はいれつけんさく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function (a, s) {
      if (a instanceof Array) { return a.indexOf(s) }// 配列ならOK

      return -1
    }
  },
  配列要素数: { // @配列Aの要素数を返す // @はいれつようそすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      if (a instanceof Array) { return a.length }// 配列ならOK

      if (a instanceof Object) { return Object.keys(a).length }

      return 1
    }
  },
  要素数: { // @配列Aの要素数を返す // @ようそすう
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (a, sys) {
      return sys.__exec('配列要素数', [a])
    }
  },
  配列挿入: { // @配列AのI番目(0起点)に要素Sを追加して返す(v1非互換) // @はいれつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (a, i, s) {
      if (a instanceof Array) { return a.splice(i, 0, s) } // 配列ならOK

      throw new Error('『配列挿入』で配列以外の要素への挿入。')
    }
  },
  配列一括挿入: { // @配列AのI番目(0起点)に配列bを追加して返す(v1非互換) // @はいれついっかつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (a, i, b) {
      if (a instanceof Array && b instanceof Array) { // 配列ならOK
        for (let j = 0; j < b.length; j++) { a.splice(i + j, 0, b[j]) }

        return a
      }
      throw new Error('『配列一括挿入』で配列以外の要素への挿入。')
    }
  },
  配列ソート: { // @配列Aをソートして返す(A自体を変更) // @はいれつそーと
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a) {
      if (a instanceof Array) { return a.sort() } // 配列ならOK

      throw new Error('『配列ソート』で配列以外が指定されました。')
    }
  },
  配列数値ソート: { // @配列Aをソートして返す(A自体を変更) // @はいれつすうちそーと
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a) {
      // 配列ならOK
      if (a instanceof Array) {
        return a.sort((a, b) => {
          return parseFloat(a) - parseFloat(b)
        })
      }

      throw new Error('『配列数値ソート』で配列以外が指定されました。')
    }
  },
  配列カスタムソート: { // @関数Fで配列Aをソートして返す(引数A自体を変更) // @はいれつかすたむそーと
    type: 'func',
    josi: [['で'], ['の', 'を']],
    pure: false,
    fn: function (f, a, sys) {
      let ufunc = f
      if (typeof f === 'string') {
        ufunc = sys.__findFunc(f, '配列カスタムソート')
      }
      if (a instanceof Array) {
        return a.sort(ufunc)
      }
      throw new Error('『配列カスタムソート』で配列以外が指定されました。')
    }
  },
  配列逆順: { // @配列Aを逆にして返す。Aを書き換える(A自体を変更)。 // @はいれつぎゃくじゅん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a) {
      if (a instanceof Array) { return a.reverse() } // 配列ならOK
      throw new Error('『配列ソート』で配列以外が指定されました。')
    }
  },
  配列シャッフル: { // @配列Aをシャッフルして返す。Aを書き換える // @はいれつしゃっふる
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a) {
      if (a instanceof Array) { // 配列ならOK
        for (let i = a.length - 1; i > 0; i--) {
          const r = Math.floor(Math.random() * (i + 1))
          const tmp = a[i]
          a[i] = a[r]
          a[r] = tmp
        }
        return a
      }
      throw new Error('『配列シャッフル』で配列以外が指定されました。')
    }
  },
  配列削除: { // @配列AのI番目(0起点)の要素を削除して返す。Aの内容を書き換える。辞書型変数ならキーIを削除する。 // @はいれつさくじょ
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: false,
    fn: function (a, i, sys) {
      return sys.__exec('配列切取', [a, i, sys])
    }
  },
  配列切取: { // @配列AのI番目(0起点)の要素を切り取って返す。Aの内容を書き換える。辞書型変数ならキーIを削除する。 // @はいれつきりとる
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function (a, i) {
      // 配列変数のとき
      if (a instanceof Array) {
        const b = a.splice(i, 1)
        if (b instanceof Array) { return b[0] } // 切り取った戻り値は必ずArrayになるので。
        return null
      }
      // 辞書型変数のとき
      if (a instanceof Object && typeof (i) === 'string') { // 辞書型変数も許容
        if (a[i]) {
          const old = a[i]
          delete a[i]
          return old
        }
        return undefined
      }
      throw new Error('『配列切取』で配列以外を指定。')
    }
  },
  配列取出: { // @配列AのI番目(0起点)からCNT個の要素を取り出して返す。Aの内容を書き換える // @はいれつとりだし
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    pure: true,
    fn: function (a, i, cnt) {
      if (a instanceof Array) { return a.splice(i, cnt) }
      throw new Error('『配列取出』で配列以外を指定。')
    }
  },
  配列ポップ: { // @配列Aの末尾を取り出して返す。Aの内容を書き換える。 // @はいれつぽっぷ
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (a) {
      if (a instanceof Array) { return a.pop() }
      throw new Error('『配列ポップ』で配列以外の処理。')
    }
  },
  配列追加: { // @配列Aの末尾にBを追加して返す。Aの内容を書き換える。 // @はいれつついか
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    pure: true,
    fn: function (a, b) {
      if (a instanceof Array) { // 配列ならOK
        a.push(b)
        return a
      }
      throw new Error('『配列追加』で配列以外の処理。')
    }
  },
  配列複製: { // @配列Aを複製して返す。 // @はいれつふくせい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (a) {
      return JSON.parse(JSON.stringify(a))
    }
  },
  配列足: { // @配列Aに配列Bを足し合わせて返す。 // @はいれつたす
    type: 'func',
    josi: [['に', 'へ', 'と'], ['を']],
    pure: true,
    fn: function (a, b) {
      if (a instanceof Array) {
        return a.concat(b)
      }
      return JSON.parse(JSON.stringify(a))
    }
  },
  配列最大値: { // @配列Aの値の最大値を調べて返す。 // @はいれつさいだいち
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return a.reduce((x, y) => Math.max(x, y))
    }
  },
  配列最小値: { // @配列Aの値の最小値を調べて返す。 // @はいれつさいしょうち
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return a.reduce((x, y) => Math.min(x, y))
    }
  },
  配列合計: { // @配列Aの値を全て足して返す。配列の各要素を数値に変換して計算する。数値に変換できない文字列は0になる。 // @はいれつごうけい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      if (a instanceof Array) {
        let v = 0
        a.forEach((n) => {
          const nn = parseFloat(n)
          if (isNaN(nn)) { return }
          v += nn
        })
        return v
      }
      throw new Error('『配列合計』で配列変数以外の値が指定されました。')
    }
  },
  // @二次元配列処理
  表ソート: { // @二次元配列AでB列目(0起点)(あるいはキー名)をキーに文字列順にソートする。Aの内容を書き換える。 // @ひょうそーと
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (a, no) {
      if (!(a instanceof Array)) {
        throw new Error('『表ソート』には配列を指定する必要があります。')
      }
      a.sort((n, m) => {
        const ns = n[no]
        const ms = m[no]

        if (ns === ms) {
          return 0
        } else if (ns < ms) {
          return -1
        } else {
          return 1
        }
      })
      return a
    }
  },
  // @二次元配列処理
  表数値ソート: { // @二次元配列AでB列目(0起点)(あるいはキー名)をキーに数値順にソートする。Aの内容を書き換える。 // @ひょうすうちそーと
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (a, no) {
      if (!(a instanceof Array)) {
        throw new Error('『表数値ソート』には配列を指定する必要があります。')
      }
      a.sort((n, m) => {
        const ns = n[no]
        const ms = m[no]
        return ns - ms
      })
      return a
    }
  },
  表ピックアップ: { // @配列Aの列番号B(0起点)(あるいはキー名)で検索文字列Sを含む行を返す // @ひょうぴっくあっぷ
    type: 'func',
    josi: [['の'], ['から'], ['を', 'で']],
    pure: true,
    fn: function (a, no, s) {
      if (!(a instanceof Array)) { throw new Error('『表ピックアップ』には配列を指定する必要があります。') }
      return a.filter((row) => String(row[no]).indexOf(s) >= 0)
    }
  },
  表完全一致ピックアップ: { // @配列Aの列番号B(0起点)(あるいはキー名)で検索文字列Sと一致する行を返す // @ひょうぴっくあっぷ
    type: 'func',
    josi: [['の'], ['から'], ['を', 'で']],
    pure: true,
    fn: function (a, no, s) {
      if (!(a instanceof Array)) { throw new Error('『表完全ピックアップ』には配列を指定する必要があります。') }
      return a.filter((row) => row[no] === s)
    }
  },
  表検索: { // @二次元配列AでCOL列目(0起点)からキーSを含む行をROW行目から検索して何行目にあるか返す。見つからなければ-1を返す。 // @ひょうけんさく
    type: 'func',
    josi: [['の'], ['で', 'に'], ['から'], ['を']],
    pure: true,
    fn: function (a, col, row, s) {
      if (!(a instanceof Array)) { throw new Error('『表検索』には配列を指定する必要があります。') }
      for (let i = row; i < a.length; i++) {
        if (a[i][col] === s) { return i }
      }
      return -1
    }
  },
  表列数: { // @二次元配列Aの列数を調べて返す。 // @ひょうれつすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      if (!(a instanceof Array)) { throw new Error('『表列数』には配列を指定する必要があります。') }
      let cols = 1
      for (let i = 0; i < a.length; i++) {
        if (a[i].length > cols) { cols = a[i].length }
      }
      return cols
    }
  },
  表行数: { // @二次元配列Aの行数を調べて返す。 // @ひょうぎょうすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      if (!(a instanceof Array)) { throw new Error('『表行数』には配列を指定する必要があります。') }
      return a.length
    }
  },
  表行列交換: { // @二次元配列Aの行と列を交換して返す。 // @ひょうぎょうれつこうかん
    type: 'func',
    josi: [['の', 'を']],
    pure: false,
    fn: function (a, sys) {
      if (!(a instanceof Array)) { throw new Error('『表行列交換』には配列を指定する必要があります。') }
      const cols = sys.__exec('表列数', [a])
      const rows = a.length
      const res = []
      for (let r = 0; r < cols; r++) {
        const row = []
        res.push(row)
        for (let c = 0; c < rows; c++) {
          row[c] = a[c][r] ? a[c][r] : ''
        }
      }
      return res
    }
  },
  表右回転: { // @二次元配列Aを90度回転して返す。 // @ひょうみぎかいてん
    type: 'func',
    josi: [['の', 'を']],
    pure: false,
    fn: function (a, sys) {
      if (!(a instanceof Array)) { throw new Error('『表右回転』には配列を指定する必要があります。') }
      const cols = sys.__exec('表列数', [a])
      const rows = a.length
      const res = []
      for (let r = 0; r < cols; r++) {
        const row = []
        res.push(row)
        for (let c = 0; c < rows; c++) {
          row[c] = a[rows - c - 1][r]
        }
      }
      return res
    }
  },
  表重複削除: { // @二次元配列AのI列目にある重複項目を削除して返す。 // @ひょうじゅうふくさくじょ
    type: 'func',
    josi: [['の'], ['を', 'で']],
    pure: true,
    fn: function (a, i, sys) {
      if (!(a instanceof Array)) { throw new Error('『表重複削除』には配列を指定する必要があります。') }
      const res = []
      const keys = {}
      for (let n = 0; n < a.length; n++) {
        const k = a[n][i]
        if (undefined === keys[k]) {
          keys[k] = true
          res.push(a[n])
        }
      }
      return res
    }
  },
  表列取得: { // @二次元配列AのI列目を返す。 // @ひょうれつしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (a, i, sys) {
      if (!(a instanceof Array)) { throw new Error('『表列取得』には配列を指定する必要があります。') }
      const res = a.map(row => row[i])
      return res
    }
  },
  表列挿入: { // @二次元配列Aの(0から数えて)I列目に配列Sを挿入して返す // @ひょうれつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (a, i, s) {
      if (!(a instanceof Array)) { throw new Error('『表列挿入』には配列を指定する必要があります。') }
      const res = []
      a.forEach((row, idx) => {
        let nr = []
        if (i > 0) { nr = nr.concat(row.slice(0, i)) }
        nr.push(s[idx])
        nr = nr.concat(row.slice(i))
        res.push(nr)
      })
      return res
    }
  },
  表列削除: { // @二次元配列Aの(0から数えて)I列目削除して返す // @ひょうれつそうにゅう
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (a, i) {
      if (!(a instanceof Array)) { throw new Error('『表列削除』には配列を指定する必要があります。') }
      const res = []
      a.forEach((row, idx) => {
        const nr = row.slice(0)
        nr.splice(i, 1)
        res.push(nr)
      })
      return res
    }
  },
  表列合計: { // @二次元配列Aの(0から数えて)I列目を合計して返す。 // @ひょうれつごうけい
    type: 'func',
    josi: [['の'], ['を', 'で']],
    pure: true,
    fn: function (a, i) {
      if (!(a instanceof Array)) { throw new Error('『表列合計』には配列を指定する必要があります。') }
      let sum = 0
      a.forEach((row) => { sum += row[i] })
      return sum
    }
  },
  表曖昧検索: { // @二次元配列AのROW行目からCOL列目(0起点)で正規表現Sにマッチする行を検索して何行目にあるか返す。見つからなければ-1を返す。(v1非互換) // @ひょうれつあいまいけんさく
    type: 'func',
    josi: [['の'], ['から'], ['で'], ['を']],
    pure: true,
    fn: function (a, row, col, s) {
      if (!(a instanceof Array)) { throw new Error('『表曖昧検索』には配列を指定する必要があります。') }
      const re = new RegExp(s)
      for (let i = 0; i < a.length; i++) {
        const row = a[i]
        if (re.test(row[col])) { return i }
      }
      return -1
    }
  },
  表正規表現ピックアップ: { // @二次元配列AでI列目(0起点)から正規表現パターンSにマッチする行をピックアップして返す。 // @ひょうせいきひょうげんぴっくあっぷ
    type: 'func',
    josi: [['の', 'で'], ['から'], ['を']],
    pure: true,
    fn: function (a, col, s) {
      if (!(a instanceof Array)) { throw new Error('『表正規表現ピックアップ』には配列を指定する必要があります。') }
      const re = new RegExp(s)
      const res = []
      for (let i = 0; i < a.length; i++) {
        const row = a[i]
        if (re.test(row[col])) { res.push(row.slice(0)) }
      }
      return res
    }
  },
  // @辞書型変数の操作
  辞書キー列挙: { // @辞書型変数Aのキーの一覧を配列で返す。 // @じしょきーれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      const keys = []
      if (a instanceof Object) { // オブジェクトのキーを返す
        for (const key in a) { keys.push(key) }
        return keys
      }
      if (a instanceof Array) { // 配列なら数字を返す
        for (let i = 0; i < a.length; i++) { keys.push(i) }
        return keys
      }
      throw new Error('『辞書キー列挙』でハッシュ以外が与えられました。')
    }
  },
  辞書キー削除: { // @辞書型変数AからキーKEYを削除して返す（A自体を変更する）。 // @じしょきーさくじょ
    type: 'func',
    josi: [['から', 'の'], ['を']],
    pure: true,
    fn: function (a, key) {
      if (a instanceof Object) { // オブジェクトのキーを返す
        if (a[key]) { delete a[key] }
        return a
      }
      throw new Error('『辞書キー削除』でハッシュ以外が与えられました。')
    }
  },
  辞書キー存在: { // @辞書型変数AのキーKEYが存在するか確認 // @じしょきーそんざい
    type: 'func',
    josi: [['の', 'に'], ['が']],
    pure: true,
    fn: function (a, key) {
      return key in a
    }
  },
  // @ハッシュ
  ハッシュキー列挙: { // @ハッシュAのキー一覧を配列で返す。 // @はっしゅきーれっきょ
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (a, sys) {
      return sys.__exec('辞書キー列挙', [a, sys])
    }
  },
  ハッシュ内容列挙: { // @ハッシュAの内容一覧を配列で返す。 // @はっしゅないようれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      const body = []
      if (a instanceof Object) { // オブジェクトのキーを返す
        for (const key in a) { body.push(a[key]) }
        return body
      }
      throw new Error('『ハッシュ内容列挙』でハッシュ以外が与えられました。')
    }
  },
  ハッシュキー削除: { // @ハッシュAからキーKEYを削除して返す。 // @はっしゅきーさくじょ
    type: 'func',
    josi: [['から', 'の'], ['を']],
    pure: false,
    fn: function (a, key, sys) {
      return sys.__exec('辞書キー削除', [a, key, sys])
    }
  },
  ハッシュキー存在: { // @ハッシュAのキーKEYが存在するか確認 // @はっしゅきーそんざい
    type: 'func',
    josi: [['の', 'に'], ['が']],
    pure: true,
    fn: function (a, key) {
      return key in a
    }
  },
  // @タイマー
  秒待機: { // @ 「!非同期モード」または「逐次実行構文」にて、N秒の間待機する // @びょうたいき
    type: 'func',
    josi: [['']],
    pure: false,
    fn: function (n, sys) {
      if (sys.__genMode === '非同期モード') {
        sys.async = true
        setTimeout(() => {
          sys.nextAsync(sys)
        }, n * 1000)
      } else {
        sys.__exec('秒逐次待機', [n, sys])
      }
    },
    return_none: true
  },
  秒逐次待機: { // @ 逐次実行構文にて、N秒の間待機する // @びょうちくじたいき
    type: 'func',
    josi: [['']],
    pure: true,
    fn: function (n, sys) {
      if (sys.resolve === undefined) { throw new Error('『秒逐次待機』命令は『逐次実行』構文と一緒に使ってください。') }
      const resolve = sys.resolve
      // const reject = sys.reject
      sys.resolveCount++
      const timerId = setTimeout(function () {
        const idx = sys.__timeout.indexOf(timerId)
        if (idx >= 0) { sys.__timeout.splice(idx, 1) }
        resolve()
      }, n * 1000)
      sys.__timeout.unshift(timerId)
    },
    return_none: true
  },
  秒後: { // @無名関数（あるいは、文字列で関数名を指定）FをN秒後に実行する。変数『対象』にタイマーIDを代入する。 // @びょうご
    type: 'func',
    josi: [['を'], ['']],
    pure: false,
    fn: function (f, n, sys) {
      // 文字列で指定された関数をオブジェクトに変換
      if (typeof f === 'string') { f = sys.__findFunc(f, '秒後') }
      // 1回限りのタイマーをセット
      const timerId = setTimeout(() => {
        // 使用中リストに追加したIDを削除
        const i = sys.__timeout.indexOf(timerId)
        if (i >= 0) { sys.__timeout.splice(i, 1) }
        try {
          f(timerId, sys)
        } catch (e) {
          let err = e
          if (!(e instanceof NakoRuntimeError)) {
            err = new NakoRuntimeError(e, sys.__varslist[0].line)
          }
          sys.logger.error(err)
        }
      }, parseFloat(n) * 1000)
      sys.__timeout.unshift(timerId)
      sys.__v0['対象'] = timerId
      return timerId
    }
  },
  秒毎: { // @無名関数（あるいは、文字列で関数名を指定）FをN秒ごとに実行する(『タイマー停止』で停止できる)。変数『対象』にタイマーIDを代入する。 // @びょうごと
    type: 'func',
    josi: [['を'], ['']],
    pure: false,
    fn: function (f, n, sys) {
      // 文字列で指定された関数をオブジェクトに変換
      if (typeof f === 'string') { f = sys.__findFunc(f, '秒毎') }
      // タイマーをセット
      const timerId = setInterval(() => {
        f(timerId, sys)
      }, parseFloat(n) * 1000)
      // タイマーIDを追加
      sys.__interval.unshift(timerId)
      sys.__v0['対象'] = timerId
      return timerId
    }
  },
  秒タイマー開始時: { // @無名関数（あるいは、文字列で関数名を指定）FをN秒ごとに実行する(『秒毎』と同じ) // @びょうたいまーかいししたとき
    type: 'func',
    josi: [['を'], ['']],
    pure: false,
    fn: function (f, n, sys) {
      return sys.__exec('秒毎', [f, n, sys])
    }
  },
  タイマー停止: { // @『秒毎』『秒後』や『秒タイマー開始』で開始したタイマーを停止する // @たいまーていし
    type: 'func',
    josi: [['の', 'で']],
    pure: true,
    fn: function (timerId, sys) {
      const i = sys.__interval.indexOf(timerId)
      if (i >= 0) {
        sys.__interval.splice(i, 1)
        clearInterval(timerId)
        return true
      }
      const j = sys.__timeout.indexOf(timerId)
      if (j >= 0) {
        sys.__timeout.splice(j, 1)
        clearTimeout(timerId)
        return true
      }
      return false
    },
    return_none: false
  },
  全タイマー停止: { // @『秒毎』『秒後』や『秒タイマー開始』で開始したタイマーを全部停止する // @ぜんたいまーていし
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      // clearInterval
      for (let i = 0; i < sys.__interval.length; i++) {
        const timerId = sys.__interval[i]
        clearInterval(timerId)
      }
      sys.__interval = []
      // clearTimeout
      for (let i = 0; i < sys.__timeout.length; i++) {
        const timerId = sys.__timeout[i]
        clearTimeout(timerId)
      }
      sys.__timeout = []
    },
    return_none: true
  },
  // @日時処理(簡易)
  今: { // @現在時刻を「HH:mm:ss」の形式で返す // @いま
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const z2 = (n) => {
        n = '00' + n
        return n.substr(n.length - 2, 2)
      }
      const t = new Date()
      return z2(t.getHours()) + ':' + z2(t.getMinutes()) + ':' + z2(t.getSeconds())
    }
  },
  システム時間: { // @現在のUNIX時間 (UTC(1970/1/1)からの経過秒数) を返す // @しすてむじかん
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const now = new Date()
      return now.getTime() / 1000
    }
  },
  今日: { // @今日の日付を「YYYY/MM/DD」の形式で返す // @きょう
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const z2 = (n) => {
        n = '00' + n
        return n.substr(n.length - 2, 2)
      }
      const t = new Date()
      return t.getFullYear() + '/' + z2(t.getMonth() + 1) + '/' + z2(t.getDate())
    }
  },
  曜日番号取得: { // @Sに指定した日付の曜日番号をで返す。不正な日付の場合は今日の曜日番号を返す。(0=日/1=月/2=火/3=水/4=木/5=金/6=土) // @ようびばんごうしゅとく
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (s) {
      const a = s.split('/')
      const t = new Date(a[0], a[1] - 1, a[2])
      return t.getDay()
    }
  },
  時間ミリ秒取得: { // @ミリ秒単位の時間を数値で返す。結果は実装に依存する。 // @じかんみりびょうしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      if (performance && performance.now) {
        return performance.now()
      } else if (Date.now) {
        return Date.now()
      } else {
        const now = new Date()
        return now.getTime()
      }
    }
  },
  // @デバッグ支援
  エラー発生: { // @故意にエラーSを発生させる // @えらーはっせい
    type: 'func',
    josi: [['の', 'で']],
    pure: true,
    fn: function (s) {
      throw new Error(s)
    }
  },
  システム関数一覧取得: { // @システム関数の一覧を取得 // @しすてむかんすういちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const f = []
      for (const key in sys.__v0) {
        const ff = sys.__v0[key]
        if (typeof ff === 'function') { f.push(key) }
      }
      return f
    }
  },
  システム関数存在: { // @文字列で関数名を指定してシステム関数が存在するかを調べる // @しすてむかんすうそんざい
    type: 'func',
    josi: [['が', 'の']],
    pure: true,
    fn: function (fname, sys) {
      return (typeof sys.__v0[fname] !== 'undefined')
    }
  },
  プラグイン一覧取得: { // @利用中のプラグイン一覧を得る // @ぷらぐいんいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const a = []
      for (const f in sys.pluginfiles) { a.push(f) }

      return a
    }
  },
  モジュール一覧取得: { // @取り込んだモジュール一覧を得る // @もじゅーるいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const a = []
      for (const f in sys.__module) { a.push(f) }

      return a
    }
  },
  助詞一覧取得: { // @文法として定義されている助詞の一覧を取得する // @じょしいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const josi = require('./nako_josi_list.js')
      return josi.josiList
    }
  },
  予約語一覧取得: { // @文法として定義されている予約語の一覧を取得する // @よやくごいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const words = require('./nako_reserved_words.js')
      const w = []
      for (const key in words) {
        w.push(key)
      }
      return w
    }
  },
  // @プラグイン管理
  プラグイン名: { type: 'const', value: 'メイン' }, // @ぷらぐいんめい
  プラグイン名設定: { // @プラグイン名をSに変更する // @プラグインめいせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: false,
    fn: function (s, sys) {
      sys.__v0['プラグイン名'] = s
    },
    return_none: true
  },

  // @URLエンコードとパラメータ
  URLエンコード: { // @URLエンコードして返す // @URLえんこーど
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function (text) {
      return encodeURIComponent(text)
    }
  },
  URLデコード: { // @URLデコードして返す // @URLでこーど
    type: 'func',
    josi: [['を', 'へ', 'に']],
    pure: true,
    fn: function (text) {
      return decodeURIComponent(text)
    }
  },
  URLパラメータ解析: { // @URLパラメータを解析してハッシュで返す // @URLぱらめーたかいせき
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: false,
    fn: function (url, sys) {
      const res = {}
      if (typeof url !== 'string') {
        return res
      }
      const p = url.split('?')
      if (p.length <= 1) {
        return res
      }
      const params = p[1].split('&')
      for (const line of params) {
        const line2 = line + '='
        const kv = line2.split('=')
        const k = sys.__exec('URLデコード', [kv[0]])
        res[k] = sys.__exec('URLデコード', [kv[1]])
      }
      return res
    }
  }
}

module.exports = PluginSystem
