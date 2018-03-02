const PluginSystem = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__varslist[0]['ナデシコバージョン'] = '3.0.34'
      // システム関数を探す
      sys.__getSysValue = function (name, def) {
        if (sys.__varslist[0][name] === undefined) return def
        return sys.__varslist[0][name]
      }
      // 全ての関数・変数を見つけて返す
      sys.__findVar = function (nameStr, def) {
        if (typeof nameStr === 'function') return nameStr
        for (let i = sys.__varslist.length - 1; i >= 0; i--) {
          let scope = sys.__varslist[i]
          if (scope[nameStr]) return scope[nameStr]
        }
        return def
      }
      // システム関数を実行する(エイリアスを実装するのに使う)
      sys.__exec = function (func, params) {
        const f = sys.__findVar(func)
        if (!f) throw new Error('システム関数でエイリアスの指定ミス:' + func)
        return f.apply(this, params)
      }
    }
  },

  // @システム定数
  'ナデシコバージョン': {type: 'const', value: '?'}, // @なでしこばーじょん
  'ナデシコエンジン': {type: 'const', value: 'nadesi.com/v3'}, // @なでしこえんじん
  'ナデシコ種類': {type: 'const', value: 'wnako3/cnako3'}, // @なでしこしゅるい
  'はい': {type: 'const', value: 1}, // @はい
  'いいえ': {type: 'const', value: 0}, // @いいえ
  'オン': {type: 'const', value: 1}, // @おん
  'オフ': {type: 'const', value: 0}, // @おふ
  '改行': {type: 'const', value: '\n'}, // @かいぎょう
  'タブ': {type: 'const', value: '\t'}, // @たぶ
  'カッコ': {type: 'const', value: '「'}, // @かっこ
  'カッコ閉': {type: 'const', value: '」'}, // @かっことじ
  '波カッコ': {type: 'const', value: '{'}, // @なみかっこ
  '波カッコ閉': {type: 'const', value: '}'}, // @なみかっことじ
  'OK': {type: 'const', value: 1}, // @OK
  'NG': {type: 'const', value: 0}, // @NG
  'PI': {type: 'const', value: Math.PI}, // @PI
  '空': {type: 'const', value: ''}, // @から
  'NULL': {type: 'const', value: null}, // @NULL
  'undefined': {type: 'const', value: undefined}, // @undefined
  'エラーメッセージ': {type: 'const', value: ''}, // @えらーめっせーじ
  '対象': {type: 'const', value: ''}, // @たいしょう
  '対象キー': {type: 'const', value: ''}, // @たいしょうきー
  '回数': {type: 'const', value: ''}, // @かいすう
  '空配列': { // @空の配列を返す // @からはいれつ
    type: 'func',
    josi: [],
    fn: function (sys) {
      return []
    }
  },

  // @標準出力
  '表示': { // @Sを表示 // @ひょうじ
    type: 'func',
    josi: [['を', 'と']],
    fn: function (s, sys) {
      if (!sys.silent) {
        console.log(s)
      }
      sys.__varslist[0]['表示ログ'] += (s + '\n')
    },
    return_none: true
  },
  '表示ログ': {type: 'const', value: ''}, // @ひょうじろぐ
  '表示ログクリア': { // @表示ログを空にする // @ひょうじろぐくりあ
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__varslist[0]['表示ログ'] = ''
    },
    return_none: true
  },
  '言': { // @Sを表示 // @いう
    type: 'func',
    josi: [['を', 'と']],
    fn: function (s) {
      console.log(s)
    },
    return_none: true
  },

  // @四則演算
  '足': { // @AとBを足す // @たす
    type: 'func',
    josi: [['に', 'と'], ['を']],
    fn: function (a, b) {
      return a + b
    }
  },
  '引': { // @AからBを引く // @ひく
    type: 'func',
    josi: [['から'], ['を']],
    fn: function (a, b) {
      return a - b
    }
  },
  '掛': { // @AにBを掛ける // @かける
    type: 'func',
    josi: [['に', 'と'], ['を']],
    fn: function (a, b) {
      return a * b
    }
  },
  '倍': { // @AのB倍を求める // @ばい
    type: 'func',
    josi: [['の'], ['を']],
    fn: function (a, b) {
      return a * b
    }
  },
  '割': { // @AをBで割る // @わる
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (a, b) {
      return a / b
    }
  },
  '割余': { // @AをBで割った余りを求める // @わったあまり
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (a, b) {
      return a % b
    }
  },
  '以上': { // @AがB以上か // @いじょう
    type: 'func',
    josi: [['が'], []],
    fn: function (a, b) {
      return a >= b
    }
  },
  '以下': { // @AがB以下か // @いか
    type: 'func',
    josi: [['が'], []],
    fn: function (a, b) {
      return a <= b
    }
  },
  '未満': { // @AがB未満か // @みまん
    type: 'func',
    josi: [['が'], []],
    fn: function (a, b) {
      return a < b
    }
  },
  '超': { // @AがB超か // @ちょう
    type: 'func',
    josi: [['が'], []],
    fn: function (a, b) {
      return a > b
    }
  },
  '等': { // @AがBと等しいか // @ひとしい
    type: 'func',
    josi: [['が'], ['と']],
    fn: function (a, b) {
      return a === b
    }
  },

  // @特殊命令
  'JS実行': { // @JavaScriptのコードSRCを実行する(変数sysでなでしこシステムを参照できる) // @JSじっこう
    type: 'func',
    josi: [['を', 'で']],
    fn: function (src, sys) {
      return eval(src) // eslint-disable-line
    }
  },
  'JSオブジェクト取得': { // @なでしこで定義した関数や変数nameのJavaScriptオブジェクトを取得する // @JSおぶじぇくとしゅとく
    type: 'func',
    josi: [['の']],
    fn: function (name, sys) {
      return sys.__findVar(name, null)
    }
  },

  'ナデシコ': { // @なでしこのコードSを実行する // @なでしこする
    type: 'func',
    josi: [['を', 'で']],
    fn: function (code, sys) {
      sys.__varslist[0]['表示ログ'] = ''
      sys.__self.run(code, true)
      return sys.__varslist[0]['表示ログ']
    }
  },
  'ナデシコ続': { // @なでしこのコードSを実行する // @なでしこつづける
    type: 'func',
    josi: [['を', 'で']],
    fn: function (code, sys) {
      sys.__self.run(code, false)
      return sys.__varslist[0]['表示ログ']
    }
  },

  // @型変換
  '変数型確認': { // @変数Vの型を返す // @へんすうかたかくにん
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return typeof (v)
    }
  },
  'TYPEOF': {// @変数Vの型を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return typeof (v)
    }
  },
  '文字列変換': {// @値Vを文字列に変換 // @もじれつへんかん
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return String(v)
    }
  },
  'TOSTR': { // @値Vを文字列に変換 // @とぅーすとりんぐ
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return String(v)
    }
  },
  '整数変換': { // @値Vを整数に変換 // @せいすうへんかん
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return parseInt(v)
    }
  },
  'TOINT': {// @値Vを整数に変換 // @
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return parseInt(v)
    }
  },
  '実数変換': {// @値Vを実数に変換 // @じっすうへんかん
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return parseFloat(v)
    }
  },
  'TOFLOAT': {// @値Vを実数に変換 // @
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return parseFloat(v)
    }
  },
  'INT': {// @値Vを整数に変換 // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return parseInt(v)
    }
  },
  'FLOAT': {// @値Vを実数に変換 // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return parseFloat(v)
    }
  },
  'HEX': {// @値Vを16進数に変換 // @
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      return parseInt(a).toString(16)
    }
  },

  // @三角関数
  'SIN': {// @ラジアン単位VのSINを求める // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return Math.sin(v)
    }
  },
  'COS': {// @ラジアン単位VのCOSを求める // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return Math.cos(v)
    }
  },
  'TAN': {// @ラジアン単位VのTANを求める // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return Math.tan(v)
    }
  },
  'ARCSIN': {// @ラジアン単位VのARCSINを求める // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return Math.asin(v)
    }
  },
  'ARCCOS': {// @ラジアン単位VのARCCOSを求める // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return Math.acos(v)
    }
  },
  'ARCTAN': {// @ラジアン単位VのARCTANを求める // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return Math.atan(v)
    }
  },
  'RAD2DEG': {// @ラジアンから度に変換 // @
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return v / Math.PI * 180
    }
  },
  'DEG2RAD': { // @度からラジアンに変換 // @
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return (v / 180) * Math.PI
    }
  },
  '度変換': { // @ラジアンから度に変換 // @どへんかん
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return v / Math.PI * 180
    }
  },
  'ラジアン変換': { // @度からラジアンに変換 // @らじあんへんかん
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return (v / 180) * Math.PI
    }
  },

  // @算術関数
  'SIGN': { // @Vが0なら0を、0超なら1を、0未満なら-1を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return (parseFloat(v) === 0) ? 0 : (v > 0) ? 1 : -1
    }
  },
  'ABS': { // @Vの絶対値を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      return Math.abs(a)
    }
  },
  'EXP': { // @e（自然対数の底）の A 乗の値を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      return Math.exp(a)
    }
  },
  'HYPOT': { // @直角三角形の二辺の長さA,Bから斜辺を求めて返す。 // @
    type: 'func',
    josi: [['と'], ['の']],
    fn: function (a, b) {
      return Math.sqrt(a * b)
    }
  },
  'LN': { // @実数式 A の自然対数（Ln(A) = 1）を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      return Math.log(a)
    }
  },
  'LOG': { // @Aの自然対数（底はE）を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      return Math.log(a)
    }
  },
  'LOGN': { // @指定された底AでBの対数を計算して返す // @
    type: 'func',
    josi: [['で'], ['の']],
    fn: function (a, b) {
      if (a === 2) return Math.LOG2E * Math.log(b)
      if (a === 10) return Math.LOG10E * Math.log(b)
      return Math.log(b) / Math.log(a)
    }
  },
  'FRAC': { // @実数Aの小数部分を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      return a % 1
    }
  },
  '乱数': { // @0から(A-1)までの乱数を返す // @らんすう
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      return Math.floor(Math.random() * a)
    }
  },
  'SQRT': { // @Aの平方根を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      return Math.sqrt(a)
    }
  },
  '平方根': { // @Aの平方根を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      return Math.sqrt(a)
    }
  },
  'RGB': { // @HTML用のカラーコードを返すRGB(R,G,B)で各値は0-255 // @
    type: 'func',
    josi: [['と'], ['の'], ['で']],
    fn: function (r, g, b) {
      const z2 = (v) => {
        const v2 = '00' + parseInt(v).toString(16)
        return v2.substr(v2.length - 2, 2)
      }
      return '#' + z2(r) + z2(g) + z2(b)
    }
  },
  'ROUND': { // @実数型の値Vを丸めてもっとも近い整数値を返す // @
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return Math.round(v)
    }
  },
  '四捨五入': { // @実数型の値Vを丸めてもっとも近い整数値を返す // @ししゃごにゅう
    type: 'func',
    josi: [['を', 'の']],
    fn: function (v) {
      return Math.round(v)
    }
  },
  'CEIL': { // @数値を正の無限大方向へ切り上げて返す。 // @
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return Math.ceil(v)
    }
  },
  '切上': { // @数値を正の無限大方向へ切り上げて返す。 // @きりあげ
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return Math.ceil(v)
    }
  },
  'FLOOR': { // @数値を負の無限大方向へ切り下げて返す。 // @
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return Math.floor(v)
    }
  },
  '切捨': { // @数値を負の無限大方向へ切り下げて返す。// @きりすて
    type: 'func',
    josi: [['を']],
    fn: function (v) {
      return Math.floor(v)
    }
  },

  // @論理演算
  '論理OR': { // @(ビット演算で)AとBの論理和を返す(v1非互換)。 // @
    type: 'func',
    josi: [['と'], ['の']],
    fn: function (a, b) {
      return (a || b)
    }
  },
  '論理AND': { // @(ビット演算で)AとBの論理積を返す(v1非互換)。日本語の「AかつB」に相当する // @
    type: 'func',
    josi: [['と'], ['の']],
    fn: function (a, b) {
      return (a && b)
    }
  },
  '論理NOT': { // @値Vが0ならば1、それ以外ならば0を返す(v1非互換) // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return (!v) ? 1 : 0
    }
  },

  // @ビット演算
  'OR': { // @(ビット演算で)AとBの論理和を返す。 // @
    type: 'func',
    josi: [['と'], ['の']],
    fn: function (a, b) {
      return (a | b)
    }
  },
  'AND': { // @(ビット演算で)AとBの論理積を返す。日本語の「AかつB」に相当する // @
    type: 'func',
    josi: [['と'], ['の']],
    fn: function (a, b) {
      return (a & b)
    }
  },
  'XOR': {// @(ビット演算で)AとBの排他的論理和を返す。// @
    type: 'func',
    josi: [['と'], ['の']],
    fn: function (a, b) {
      return (a ^ b)
    }
  },
  'NOT': {// @(ビット演算で)vの各ビットを反転して返す。// @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      return (~v)
    }
  },
  'SHIFT_L': { // @VをAビット左へシフトして返す // @
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (a, b) {
      return (a << b)
    }
  },
  'SHIFT_R': { // @VをAビット右へシフトして返す(符号を維持する) // @
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (a, b) {
      return (a >> b)
    }
  },
  'SHIFT_UR': { // @VをAビット右へシフトして返す(符号を維持しない、0で埋める) // @
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (a, b) {
      return (a >>> b)
    }
  },

  // @文字列処理
  '文字数': { // @文字列Vの文字数を返す // @もじすう
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      if (!Array.from) return String(v).length
      return Array.from(v).length
    }
  },
  '何文字目': { // @文字列SでAが何文字目にあるか調べて返す // @なんもじめ
    type: 'func',
    josi: [['で', 'の'], ['が']],
    fn: function (s, a) {
      return String(s).indexOf(a) + 1
    }
  },
  'CHR': { // @文字コードから文字を返す // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      if (!String.fromCodePoint) return String.fromCharCode(v)
      return String.fromCodePoint(v)
    }
  },
  'ASC': { // @文字列Vの最初の文字の文字コードを返す // @
    type: 'func',
    josi: [['の']],
    fn: function (v) {
      if (!String.prototype.codePointAt) return String(v).charCodeAt(0)
      return String(v).codePointAt(0)
    }
  },
  '文字挿入': { // @文字列SのI文字目に文字列Aを挿入する // @もじそうにゅう
    type: 'func',
    josi: [['で', 'の'], ['に', 'へ'], ['を']],
    fn: function (s, i, a) {
      if (i <= 0) i = 1
      const ss = String(s)
      const mae = ss.substr(0, i - 1)
      const usi = ss.substr(i - 1)
      return mae + a + usi
    }
  },
  '文字検索': { // @文字列Sで文字列Aが何文字目にあるか調べて返す // @もじけんさく
    type: 'func',
    josi: [['で', 'の'], ['を']],
    fn: function (s, a) {
      return String(s).indexOf(a) + 1
    }
  },
  '追加': { // @文字列SにAを追加して返す(v1非互換) // @ついか
    type: 'func',
    josi: [['で', 'に', 'へ'], ['を']],
    fn: function (s, a) {
      return String(s) + String(a)
    }
  },
  '一行追加': { // @文字列SにAと改行を追加して返す(v1非互換) // @いちぎょうついか
    type: 'func',
    josi: [['で', 'に', 'へ'], ['を']],
    fn: function (s, a) {
      return String(s) + String(a) + '\n'
    }
  },
  '文字列分解': {// @文字列Vを一文字ずつに分解して返す // @もじれつぶんかい
    type: 'func',
    josi: [['を', 'の', 'で']],
    fn: function (v) {
      if (!Array.from) return String(v).split('')
      return Array.from(v)
    }
  },
  'リフレイン': { // @文字列VをCNT回繰り返す(v1非互換) // @りふれいん
    type: 'func',
    josi: [['を', 'の'], ['で']],
    fn: function (v, cnt) {
      let s = ''
      for (let i = 0; i < cnt; i++) s += String(v)
      return s
    }
  },
  '出現回数': {// @文字列SにAが何回出現するか数える // @しゅつげんかいすう
    type: 'func',
    josi: [['で'], ['の']],
    fn: function (s, a) {
      let cnt = 0
      const re = new RegExp(a.replace(/(.)/g, '\\$1'), 'g')
      String(s).replace(re, m => {
        cnt++
      })
      return cnt
    }
  },
  'MID': {// @文字列SのA文字目からCNT文字を抽出する // @
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を']],
    fn: function (s, a, cnt) {
      return (String(s).substr(a - 1, cnt))
    }
  },
  '文字抜出': { // @文字列SのA文字目からCNT文字を抽出する // @もじぬきだす
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を', '']],
    fn: function (s, a, cnt) {
      return (String(s).substr(a - 1, cnt))
    }
  },
  'LEFT': {// @文字列Sの左端からCNT文字を抽出する // @
    type: 'func',
    josi: [['の', 'で'], ['だけ']],
    fn: function (s, cnt) {
      return (String(s).substr(0, cnt))
    }
  },
  '文字左部分': { // @文字列Sの左端からCNT文字を抽出する // @もじひだりぶぶん
    type: 'func',
    josi: [['の', 'で'], ['だけ', '']],
    fn: function (s, cnt) {
      return (String(s).substr(0, cnt))
    }
  },
  'RIGHT': {// @文字列Sの右端からCNT文字を抽出する // @
    type: 'func',
    josi: [['の', 'で'], ['だけ']],
    fn: function (s, cnt) {
      s = '' + s
      return (s.substr(s.length - cnt, cnt))
    }
  },
  '文字右部分': {// @文字列Sの右端からCNT文字を抽出する // @もじみぎぶぶん
    type: 'func',
    josi: [['の', 'で'], ['だけ', '']],
    fn: function (s, cnt) {
      s = '' + s
      return (s.substr(s.length - cnt, cnt))
    }
  },
  '区切': {// @文字列Sを区切り文字Aで区切って配列で返す // @くぎる
    type: 'func',
    josi: [['の', 'を'], ['で']],
    fn: function (s, a) {
      return ('' + s).split('' + a)
    }
  },
  '切取': { // @文字列Sから文字列Aまでの部分を抽出する(v1非互換) // @きりとる
    type: 'func',
    josi: [['から', 'の'], ['まで', 'を']],
    fn: function (s, a) {
      s = String(s)
      const i = s.indexOf(a)
      if (i < 0) return s
      return s.substr(0, i)
    }
  },
  '文字削除': { // @文字列SのA文字目からB文字分を削除して返す // @もじさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['だけ', 'を', '']],
    fn: function (s, a, b) {
      s = '' + s
      const mae = s.substr(0, a - 1)
      const usi = s.substr((a - 1 + b))
      return mae + usi
    }
  },

  // @置換・トリム
  '置換': {// @文字列Sのうち文字列AをBに全部置換して返す // @ちかん
    type: 'func',
    josi: [['の', 'で'], ['を', 'から'], ['に', 'へ']],
    fn: function (s, a, b) {
      return String(s).split(a).join(b)
    }
  },
  '単置換': { // @文字列Sのうち、最初に出現するAだけをBに置換して返す // @たんちかん
    type: 'func',
    josi: [['の', 'で'], ['を'], ['に', 'へ']],
    fn: function (s, a, b) {
      s = String(s)
      const re = new RegExp(a.replace(/(.)/g, '\\$1'), '')
      return s.replace(re, b)
    }
  },
  'トリム': { // @文字列Sの前後にある空白を削除する // @とりむ
    type: 'func',
    josi: [['の', 'を']],
    fn: function (s) {
      s = String(s).replace(/^\s+/, '').replace(/\s+$/, '')
      return s
    }
  },
  '空白除去': {// @文字列Sの前後にある空白を削除する // @くうはくじょきょ
    type: 'func',
    josi: [['の', 'を']],
    fn: function (s) {
      s = String(s).replace(/^\s+/, '').replace(/\s+$/, '')
      return s
    }
  },

  // @文字変換
  '大文字変換': {// @アルファベットの文字列Sを大文字に変換 // @おおもじへんかん
    type: 'func',
    josi: [['の', 'を']],
    fn: function (s) {
      return String(s).toUpperCase()
    }
  },
  '小文字変換': {// @アルファベットの文字列Sを小文字に変換 // @こもじへんかん
    type: 'func',
    josi: [['の', 'を']],
    fn: function (s) {
      return String(s).toLowerCase()
    }
  },
  '平仮名変換': {// @文字列Sのひらがなをカタカナに変換 // @ひらがなへんかん
    type: 'func',
    josi: [['の', 'を']],
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
  'カタカナ変換': {// @文字列Sのひらがなをカタカナに変換 // @かたかなへんかん
    type: 'func',
    josi: [['の', 'を']],
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

  // @JSON
  'JSONエンコード': { // @オブジェクトVをJSON形式にエンコードして返す // @JSONえんこーど
    type: 'func',
    josi: [['を', 'の']],
    fn: function (v) {
      return JSON.stringify(v)
    }
  },
  'JSONエンコード整形': { // @オブジェクトVをJSON形式にエンコードして整形して返す // @JSONえんこーどせいけい
    type: 'func',
    josi: [['を', 'の']],
    fn: function (v) {
      return JSON.stringify(v, null, 2)
    }
  },
  'JSONデコード': { // @JSON文字列Sをオブジェクトにデコードして返す // @JSONでこーど
    type: 'func',
    josi: [['を', 'の', 'から']],
    fn: function (s) {
      return JSON.parse(s)
    }
  },

  // @正規表現
  '正規表現マッチ': {// @文字列Aを正規表現パターンBでマッチして結果を返す(パターンBは「/pat/opt」の形式で指定。optにgの指定がなければ部分マッチが『抽出文字列』に入る) // @せいきひょうげんまっち
    type: 'func',
    josi: [['を', 'が'], ['で', 'に']],
    fn: function (a, b, sys) {
      let re
      let f = b.match(/^\/(.+)\/([a-zA-Z]*)$/)
      if (f === null) { // パターンがない場合
        re = new RegExp(b, 'g')
      } else {
        re = new RegExp(f[1], f[2])
      }
      const sa = sys.__varslist[0]['抽出文字列'] = []
      const m = String(a).match(re)
      let result = m
      if (re.global) {
        // no groups
      } else {
        if (m) {
          // has group?
          if (m.length > 0) {
            result = m[0]
            for (let i = 1; i < m.length; i++) sa[i - 1] = m[i]
          }
        }
      }
      return result
    }
  },
  '抽出文字列': {type: 'const', value: []}, // @ちゅうしゅつもじれつ
  '正規表現置換': {// @文字列Sの正規表現パターンAをBに置換して結果を返す(パターンAは/pat/optで指定) // @せいきひょうげんちかん
    type: 'func',
    josi: [['の'], ['を', 'から'], ['で', 'に', 'へ']],
    fn: function (s, a, b) {
      let re
      let f = a.match(/^\/(.+)\/([a-zA-Z]*)/)
      if (f === null) {
        re = new RegExp(a, 'g')
      } else {
        re = new RegExp(f[1], f[2])
      }
      return String(s).replace(re, b)
    }
  },
  '正規表現区切': {// @文字列Sを正規表現パターンAで区切って配列で返す(パターンAは/pat/optで指定) // @せいきひょうげんくぎる
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (s, a) {
      let re
      let f = a.match(/^\/(.+)\/([a-zA-Z]*)/)
      if (f === null) {
        re = new RegExp(a, 'g')
      } else {
        re = new RegExp(f[1], f[2])
      }
      return String(s).split(re)
    }
  },

  // @指定形式
  '通貨形式': { // @数値Vを三桁ごとにカンマで区切る // @つうかけいしき
    type: 'func',
    josi: [['を', 'の']],
    fn: function (v) {
      return String(v).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
    }
  },
  'ゼロ埋': { // @数値VをA桁の0で埋める // @ぜろうめ
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (v, a) {
      v = String(v)
      let z = '0'
      for (let i = 0; i < a; i++) z += '0'
      a = parseInt(a)
      if (a < v.length) a = v.length
      const s = z + String(v)
      return s.substr(s.length - a, a)
    }
  },
  '空白埋': { // @文字列VをA桁の空白で埋める // @くうはくうめ
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (v, a) {
      v = String(v)
      let z = ' '
      for (let i = 0; i < a; i++) z += ' '
      a = parseInt(a)
      if (a < v.length) a = v.length
      const s = z + String(v)
      return s.substr(s.length - a, a)
    }
  },

  // @文字種類
  'かなか判定': { // @文字列Sの1文字目がひらがなか判定 // @かなかはんてい
    type: 'func',
    josi: [['を', 'の', 'が']],
    fn: function (s) {
      const c = String(s).charCodeAt(0)
      return (c >= 0x3041 && c <= 0x309F)
    }
  },
  'カタカナ判定': { // @文字列Sの1文字目がカタカナか判定 // @かたかなかはんてい
    type: 'func',
    josi: [['を', 'の', 'が']],
    fn: function (s) {
      const c = String(s).charCodeAt(0)
      return (c >= 0x30A1 && c <= 0x30FA)
    }
  },
  '数字判定': { // @文字列Sの1文字目が数字か判定 // @すうじかはんてい
    type: 'func',
    josi: [['を', 'が']],
    fn: function (s) {
      const c = String(s).charAt(0)
      return ((c >= '0' && c <= '9') || (c >= '０' && c <= '９'))
    }
  },
  '数列判定': { // @文字列S全部が数字か判定 // @すうれつかはんてい
    type: 'func',
    josi: [['を', 'が']],
    fn: function (s) {
      return (String(s).match(/^[0-9.]+$/) !== null)
    }
  },

  // @配列操作
  '配列結合': { // @配列Aを文字列Sでつなげて文字列で返す // @はいれつけつごう
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (a, s) {
      if (a instanceof Array) { // 配列ならOK
        return a.join('' + s)
      }
      const a2 = String(a).split('\n') // 配列でなければ無理矢理改行で区切ってみる
      return a2.join('' + s)
    }
  },
  '配列検索': { // @配列Aから文字列Sを探してインデックス番号(0起点)を返す。見つからなければ-1を返す。 // @はいれつけんさく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    fn: function (a, s) {
      if (a instanceof Array) { // 配列ならOK
        return a.indexOf(s)
      }
      return -1
    }
  },
  '配列要素数': { // @配列Aの要素数を返す // @はいれつようそすう
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      if (a instanceof Array) { // 配列ならOK
        return a.length
      }
      if (a instanceof Object) {
        return Object.keys(a).length
      }
      return 1
    }
  },
  '要素数': { // @配列Aの要素数を返す // @ようそすう
    type: 'func',
    josi: [['の']],
    fn: function (a, sys) {
      return sys.__exec('配列要素数', [a])
    }
  },
  '配列挿入': { // @配列AのI番目(0起点)に要素Sを追加して返す(v1非互換) // @はいれつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (a, i, s) {
      if (a instanceof Array) { // 配列ならOK
        return a.splice(i, 0, s)
      }
      throw new Error('『配列挿入』で配列以外の要素への挿入。')
    }
  },
  '配列一括挿入': { // @配列AのI番目(0起点)に配列bを追加して返す(v1非互換) // @はいれついっかつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (a, i, b) {
      if (a instanceof Array && b instanceof Array) { // 配列ならOK
        for (let j = 0; j < b.length; j++) {
          a.splice(i + j, 0, b[j])
        }
        return a
      }
      throw new Error('『配列一括挿入』で配列以外の要素への挿入。')
    }
  },
  '配列ソート': { // @配列Aをソートして返す(A自体を変更) // @はいれつそーと
    type: 'func',
    josi: [['の', 'を']],
    fn: function (a) {
      if (a instanceof Array) { // 配列ならOK
        return a.sort()
      }
      throw new Error('『配列ソート』で配列以外が指定されました。')
    }
  },
  '配列数値ソート': { // @配列Aをソートして返す(A自体を変更) // @はいれつすうちそーと
    type: 'func',
    josi: [['の', 'を']],
    fn: function (a) {
      if (a instanceof Array) { // 配列ならOK
        return a.sort((a, b) => {
          return parseFloat(a) - parseFloat(b)
        })
      }
      throw new Error('『配列数値ソート』で配列以外が指定されました。')
    }
  },
  '配列カスタムソート': { // @関数Fで配列Aをソートして返す(引数A自体を変更) // @はいれつかすたむそーと
    type: 'func',
    josi: [['で'], ['の', 'を']],
    fn: function (f, a, sys) {
      let ufunc = f
      if (typeof f === 'string') {
        ufunc = sys.__varslist[1][f]
        if (ufunc === undefined) {
          ufunc = sys.__varslist[1][f]
        }
        if (!ufunc) throw new Error('関数『' + f + '』が見当たりません。')
      }
      if (a instanceof Array) { // 配列ならOK
        return a.sort(ufunc)
      }
      throw new Error('『配列カスタムソート』で配列以外が指定されました。')
    }
  },
  '配列逆順': { // @配列Aを逆にして返す。Aを書き換える(A自体を変更)。 // @はいれつぎゃくじゅん
    type: 'func',
    josi: [['の', 'を']],
    fn: function (a) {
      if (a instanceof Array) { // 配列ならOK
        return a.reverse()
      }
      throw new Error('『配列ソート』で配列以外が指定されました。')
    }
  },
  '配列シャッフル': { // @配列Aをシャッフルして返す。Aを書き換える // @はいれつしゃっふる
    type: 'func',
    josi: [['の', 'を']],
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
  '配列切取': { // @配列AのI番目(0起点)の要素を切り取って返す。Aの内容を書き換える。 // @はいれつきりとる
    type: 'func',
    josi: [['の'], ['を']],
    fn: function (a, i) {
      if (a instanceof Array) { // 配列ならOK
        const b = a.splice(i, 1)
        if (b instanceof Array) return b[0]
        return null
      }
      throw new Error('『配列切取』で配列以外を指定。')
    }
  },
  '配列取出': { // @配列AのI番目(0起点)からCNT個の応訴を取り出して返す。Aの内容を書き換える // @はいれつとりだし
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    fn: function (a, i, cnt) {
      if (a instanceof Array) { // 配列ならOK
        return a.splice(i, cnt)
      }
      throw new Error('『配列取出』で配列以外を指定。')
    }
  },
  '配列ポップ': { // @配列Aの末尾を取り出して返す。Aの内容を書き換える。 // @はいれつぽっぷ
    type: 'func',
    josi: [['の', 'から']],
    fn: function (a) {
      if (a instanceof Array) { // 配列ならOK
        return a.pop()
      }
      throw new Error('『配列ポップ』で配列以外の処理。')
    }
  },
  '配列追加': { // @配列Aの末尾にBを追加して返す。Aの内容を書き換える。 // @はいれつついか
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (a, b) {
      if (a instanceof Array) { // 配列ならOK
        a.push(b)
        return a
      }
      throw new Error('『配列追加』で配列以外の処理。')
    }
  },

  // @ハッシュ
  'ハッシュキー列挙': { // @ハッシュAのキー一覧を配列で返す。 // @はっしゅきーれっきょ
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      const keys = []
      if (a instanceof Array) { // 配列なら数字を返す
        for (let i = 0; i < a.length; i++) keys.push(i)
        return keys
      }
      if (a instanceof Object) { // オブジェクトのキーを返す
        for (const key in a) keys.push(key)
        return keys
      }
      throw new Error('『ハッシュキー列挙』でハッシュ以外が与えられました。')
    }
  },
  'ハッシュ内容列挙': { // @ハッシュAの内容一覧を配列で返す。 // @はっしゅないようれっきょ
    type: 'func',
    josi: [['の']],
    fn: function (a) {
      const body = []
      if (a instanceof Object) { // オブジェクトのキーを返す
        for (const key in a) body.push(a[key])
        return body
      }
      throw new Error('『ハッシュ内容列挙』でハッシュ以外が与えられました。')
    }
  },
  'ハッシュキー削除': { // @ハッシュAからキーKEYを削除して返す。 // @はっしゅきーさくじょ
    type: 'func',
    josi: [['から', 'の'], ['を']],
    fn: function (a, key) {
      if (a instanceof Object) { // オブジェクトのキーを返す
        if (a[key]) delete a[key]
        return a
      }
      throw new Error('『ハッシュキー削除』でハッシュ以外が与えられました。')
    }
  },

  // @日時処理
  '今': { // @現在時刻を「HH:mm:ss」の形式で返す // @いま
    type: 'func',
    josi: [],
    fn: function () {
      const moment = require('moment-timezone')
      return moment().format('HH:mm:ss')
    }
  },
  'システム時間': { // @現在のUNIX時間 (UTC(1970/1/1)からの経過秒数) を返す // @しすてむじかん
    type: 'func',
    josi: [],
    fn: function () {
      const moment = require('moment-timezone')
      return moment().unix()
    }
  },
  '今日': { // @今日の日付を「YYYY/MM/DD」の形式で返す // @きょう
    type: 'func',
    josi: [],
    fn: function () {
      const moment = require('moment-timezone')
      return moment().format('YYYY/MM/DD')
    }
  },
  '今年': { // @今年の西暦を返す // @ことし
    type: 'func',
    josi: [],
    fn: function () {
      const moment = require('moment-timezone')
      return moment().year()
    }
  },
  '今月': { // @今月を返す(v1非互換) // @こんげつ
    type: 'func',
    josi: [],
    fn: function () {
      const moment = require('moment-timezone')
      return moment().month() + 1
    }
  },
  '曜日': { // @日付Sの曜日を返す // @ようび
    type: 'func',
    josi: [['の']],
    fn: function (s) {
      const moment = require('moment-timezone')
      return moment(s, 'YYYY/MM/DD').locale('ja').format('ddd')
    }
  },
  'UNIX時間変換': { // @日時SをUNIX時間 (UTC(1970/1/1)からの経過秒数) に変換して返す(v1非互換) // @UNIXじかんへんかん
    type: 'func',
    josi: [['の', 'を', 'から']],
    fn: function (s, sys) {
      return sys.__exec('UNIXTIME変換', [s])
    }
  },
  'UNIXTIME変換': { // @日時SをUNIX時間 (UTC(1970/1/1)からの経過秒数) に変換して返す // @UNIXTIMEへんかん
    type: 'func',
    josi: [['の', 'を', 'から']],
    fn: function (s) {
      const moment = require('moment-timezone')
      return moment(s, 'YYYY/MM/DD HH:mm:ss').unix()
    }
  },
  '日時変換': { // @UNIX時間 (UTC(1970/1/1)からの経過秒数) を「YYYY/MM/DD HH:mm:ss」の形式に変換 // @にちじへんかん
    type: 'func',
    josi: [['を', 'から']],
    fn: function (tm) {
      const moment = require('moment-timezone')
      return moment.unix(tm).format('YYYY/MM/DD HH:mm:ss')
    }
  },
  '実行': { // @ 無名関数（あるいは、文字列で関数名を指定）Fを実行する(Fが関数でなければ無視する) // @じっこう
    type: 'func',
    josi: [['を', 'に', 'で']],
    fn: function (f, sys) {
      if (typeof f === 'string') f = sys.__findVar(f)
      if (typeof f === 'function') return f(sys)
    }
  },
  '秒後': { // @無名関数（あるいは、文字列で関数名を指定）FをN秒後に実行する // @びょうご
    type: 'func',
    josi: [['を'], []],
    fn: function (f, n, sys) {
      if (typeof f === 'string') f = sys.__findVar(f)
      setTimeout(f, parseFloat(n) * 1000)
    }
  },
  '秒毎': { // @無名関数（あるいは、文字列で関数名を指定）FをN秒ごとに実行する // @びょうごと
    type: 'func',
    josi: [['を'], []],
    fn: function (f, n, sys) {
      if (typeof f === 'string') f = sys.__findVar(f)
      setInterval(f, parseFloat(n) * 1000)
    }
  },

  // @デバッグ支援
  'エラー発生': { // @故意にエラーSを発生させる // @えらーはっせい
    type: 'func',
    josi: [['の', 'で']],
    fn: function (s) {
      throw new Error(s)
    }
  },
  'システム関数一覧取得': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      const f = []
      for (const key in sys.__varslist[0]) {
        const ff = sys.__varslist[0][key]
        if (typeof ff === 'function') {
          f.push(key)
        }
      }
      return f
    }
  },
  'プラグイン一覧取得': { // @利用中のプラグイン一覧を得る // @ぷらぐいんいちらんしゅとく
    type: 'func',
    josi: [],
    fn: function (sys) {
      const a = []
      for (const f in sys.pluginfiles) {
        a.push(f)
      }
      return a
    }
  },
  'モジュール一覧取得': { // @取り込んだモジュール一覧を得る // @もじゅーるいちらんしゅとく
    type: 'func',
    josi: [],
    fn: function (sys) {
      const a = []
      for (const f in sys.__module) {
        a.push(f)
      }
      return a
    }
  },
  'タイムゾーン設定': { // @タイムゾーンTをセットする(v1非互換)(タイムゾーンの一覧は https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List 参照) // @たいむぞーんせってい
    type: 'func',
    josi: [['で']],
    fn: function (tz) {
      const moment = require('moment-timezone')
      moment.tz.setDefault(tz)
    }
  }
}

module.exports = PluginSystem
