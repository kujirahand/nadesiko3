/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * 文字列処理・置換・トリム・文字変換・指定形式・文字種類の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
import { NakoSystem } from './plugin_api.mjs'

export default {
  // @文字列処理
  '文字数': { // @文字列Vの文字数を返す // @もじすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any): number {
      if (!Array.from) { return String(v).length }
      if (typeof v !== 'string') { v = String(v) }
      // Unicodeのサロゲートペアを考慮して文字数をカウント #1954 を参照
      return Array.from(v).length
    }
  },
  '何文字目': { // @文字列SでAが何文字目にあるか調べて返す。見つからなければ0を返す。 // @なんもじめ
    type: 'func',
    josi: [['で', 'の'], ['が']],
    pure: true,
    fn: function(s: string, a: string): number {
      // Unicodeのサロゲートペアを考慮して、文字列を検索 #1954 を参照
      // return String(s).indexOf(a) + 1 // サロゲートペアを無視した場合
      const strArray = Array.from(s)
      const searchArray = Array.from(a)
      for (let i = 0; i < strArray.length; i++) {
        if (strArray.slice(i, i + searchArray.length).join('') === searchArray.join('')) {
          return i + 1
        }
      }
      return 0
    }
  },
  'CHR': { // @文字コードV(あるいは文字列配列)から文字を返す // @CHR
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: number|number[]): string|string[] {
      // 数値のとき
      if (typeof v === 'number') {
        if (!String.fromCodePoint) { return String.fromCharCode(v) }
        return String.fromCodePoint(v)
      }
      // 配列のとき
      const res: string[] = []
      for (const s of v) {
        if (!String.fromCodePoint) {
          res.push(String.fromCharCode(s))
        } else {
          res.push(String.fromCodePoint(s))
        }
      }
      return res
    }
  },
  'ASC': { // @文字列V(あるいは文字列配列)の最初の文字の文字コードを返す // @ASC
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: string|string[]): number|number[] {
      if (typeof v === 'string') {
        if (!String.prototype.codePointAt) { return String(v).charCodeAt(0) }
        return String(v).codePointAt(0) || 0
      }
      const res: number[] = []
      for (const s of v) {
        if (!String.prototype.codePointAt) {
          res.push(String(s).charCodeAt(0))
        } else {
          res.push(String(s).codePointAt(0) || 0)
        }
      }
      return res
    }
  },
  '文字挿入': { // @文字列SのI文字目に文字列Aを挿入する // @もじそうにゅう
    type: 'func',
    josi: [['で', 'の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function(s: string, i: number, a: string): string {
      if (i <= 0) { i = 1 }
      const strArray = Array.from(s)
      strArray.splice(i - 1, 0, a)
      return strArray.join('')
    }
  },
  '文字検索': { // @文字列SでA文字目から文字列Bを検索。見つからなければ0を返す。(類似命令に『何文字目』がある)(v1非互換) // @もじけんさく
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を']],
    pure: true,
    fn: function(s: string, a: number, b: string): number {
      // サロゲートペアを考慮して文字列を検索する
      // return String(s).indexOf(b, a - 1) + 1
      if (a <= 0) { a = 1 }
      const strArray = Array.from(s)
      const searchArray = Array.from(b)
      // Unicode単位で検索
      for (let i = a - 1; i < strArray.length; i++) {
        if (strArray.slice(i, i + searchArray.length).join('') === searchArray.join('')) {
          // 合致した
          return i + 1
        }
      }
      return 0
    }
  },
  '追加': { // @文字列または配列SにAを追加して返す(v1非互換) // @ついか
    type: 'func',
    josi: [['で', 'に', 'へ'], ['を']],
    pure: true,
    fn: function(s: any, a: any): any {
      if (s instanceof Array) {
        s.push(a)
        return s
      }
      return String(s) + String(a)
    }
  },
  '一行追加': { // @文字列または配列SにAと改行を追加して返す(v1非互換) // @いちぎょうついか
    type: 'func',
    josi: [['で', 'に', 'へ'], ['を']],
    pure: true,
    fn: function(s: any, a: any): any {
      if (s instanceof Array) {
        s.push(a)
        return s
      }
      return String(s) + String(a) + '\n'
    }
  },
  '連結': { // @引数(可変)に指定した文字列を連結して文字列を返す // @れんけつ
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    isVariableJosi: true,
    fn: function(...a: any) {
      a.pop() // NakoSystemを取り除く
      return a.join('')
    }
  },
  '文字列連結': { // @引数(可変)に指定した文字列を連結して文字列を返す // @もじれつれんけつ
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    isVariableJosi: true,
    fn: function(...a: any) {
      a.pop() // NakoSystemを取り除く
      return a.join('')
    }
  },
  '文字列分解': { // @文字列Vを一文字ずつに分解して返す // @もじれつぶんかい
    type: 'func',
    josi: [['を', 'の', 'で']],
    pure: true,
    fn: function(v: any) {
      if (!Array.from) { return String(v).split('') }
      return Array.from(v)
    }
  },
  'リフレイン': { // @文字列VをCNT回繰り返す(v1非互換) // @りふれいん
    type: 'func',
    josi: [['を', 'の'], ['で']],
    pure: true,
    fn: function(v: any, cnt: number): string {
      let s = ''
      for (let i = 0; i < cnt; i++) { s += String(v) }
      return s
    }
  },
  '出現回数': { // @文字列SにAが何回出現するか数える // @しゅつげんかいすう
    type: 'func',
    josi: [['で'], ['の']],
    pure: true,
    fn: function(s: string, a: string) {
      s = '' + s
      a = '' + a
      return s.split(a).length - 1
    }
  },
  'MID': { // @文字列SのA文字目からCNT文字を抽出する(『文字抜出』と同じ) // @MID
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を']],
    pure: true,
    fn: function(s: any, a: any, cnt: number, sys: NakoSystem) {
      return sys.__exec('文字抜出', [s, a, cnt])
    }
  },
  '文字抜出': { // @文字列SのA文字目からCNT文字を抽出する(Aが0未満の時は後ろからA文字目からCNT文字を抽出) // @もじぬきだす
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を', '']],
    pure: true,
    fn: function(s: any, a: number, cnt: number) {
      // 引数の型チェック #1995
      if (typeof a === 'string') { a = parseInt(a) }
      if (typeof cnt === 'string') { cnt = parseInt(cnt) }
      // もし、cntが0以下なら空文字を返す
      if (cnt <= 0) { return '' }
      // サロゲートペアを考慮した処理を行う
      const strArray = Array.from(s)
      // もし、aの値が0未満の時は後ろからa文字目からcnt文字を抽出
      if (a < 0) {
        a = strArray.length + a + 1
        if (a < 0) { a = 1 }
      }
      return strArray.slice(a - 1, a + cnt - 1).join('')
    }
  },
  'LEFT': { // @文字列Sの左端からCNT文字を抽出する // @LEFT
    type: 'func',
    josi: [['の', 'で'], ['だけ']],
    pure: true,
    fn: function(s: string, cnt: number, sys: NakoSystem): string {
      return sys.__exec('文字左部分', [s, cnt])
    }
  },
  '文字左部分': { // @文字列Sの左端からCNT文字を抽出する // @もじひだりぶぶん
    type: 'func',
    josi: [['の', 'で'], ['だけ', '']],
    pure: true,
    fn: function(s: string, cnt: number): string {
      // return (String(s).substring(0, cnt))
      // サロゲートペアを考慮
      const strArray = Array.from(s)
      return strArray.slice(0, cnt).join('')
    }
  },
  'RIGHT': { // @文字列Sの右端からCNT文字を抽出する(『文字右部分』と同じ) // @RIGHT
    type: 'func',
    josi: [['の', 'で'], ['だけ']],
    pure: true,
    fn: function(s: string, cnt: number, sys: NakoSystem): string {
      return sys.__exec('文字右部分', [s, cnt])
    }
  },
  '文字右部分': { // @文字列Sの右端からCNT文字を抽出する // @もじみぎぶぶん
    type: 'func',
    josi: [['の', 'で'], ['だけ', '']],
    pure: true,
    fn: function(s: string, cnt: number): string {
      // return (s.substring(s.length - cnt, s.length))
      // サロゲートペアを考慮
      const strArray = Array.from(s)
      let index = strArray.length - cnt
      if (index < 0) { index = 0 }
      return strArray.slice(index, strArray.length).join('')
    }
  },
  '区切': { // @文字列Sを区切り文字Aで区切って配列で返す // @くぎる
    type: 'func',
    josi: [['の', 'を'], ['で']],
    pure: true,
    fn: function(s: string, a: string) {
      return ('' + s).split('' + a)
    }
  },
  '文字列分割': { // @文字列Sを区切り文字Aで分割して配列で返す // @もじれつぶんかつ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(s: string, a: string) {
      s = '' + s
      a = '' + a
      const i = s.indexOf(a)
      if (i < 0) {
        return [s]
      }
      return [s.substring(0, i), s.substring(i + a.length)]
    }
  },
  '切取': { // @文字列Sから文字列Aまでの部分を抽出する。切り取った残りは特殊変数『対象』に代入される。(v1非互換) // @きりとる
    type: 'func',
    josi: [['から', 'の'], ['まで', 'を']],
    pure: true,
    fn: function(s: string, a: string, sys: any) {
      s = String(s)
      const i = s.indexOf(a)
      if (i < 0) {
        sys.__setSysVar('対象', '')
        return s
      }
      sys.__setSysVar('対象', s.substring(i + a.length))
      return s.substring(0, i)
    }
  },
  '範囲切取': { // @文字列Sで文字列AからBまでの部分を抽出して返す。切り取った残りは特殊変数『対象』に代入される。(v1非互換) // @はんいきりとる
    type: 'func',
    josi: [['で', 'の'], ['から'], ['まで', 'を']],
    pure: true,
    fn: function(s: string, a: string, b: string, sys: any) {
      s = String(s)
      let mae = ''
      let usiro = ''
      const i = s.indexOf(a)
      if (i < 0) {
        sys.__setSysVar('対象', s)
        return ''
      }
      mae = s.substring(0, i)
      const subS = s.substring(i + a.length)
      const j = subS.indexOf(b)
      if (j < 0) {
        sys.__setSysVar('対象', mae)
        return subS
      }
      const result = subS.substring(0, j)
      usiro = subS.substring(j + b.length)
      sys.__setSysVar('対象', mae + usiro)
      return result
    }
  },
  '文字削除': { // @文字列SのA文字目からB文字分を削除して返す // @もじさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['だけ', 'を', '']],
    pure: true,
    fn: function(s: string, a: number, b: number): string {
      // サロゲートペアを考慮
      const strArray = Array.from(s)
      strArray.splice(a - 1, b)
      return strArray.join('')
    }
  },
  '文字始': { // @文字列SがAから始まるならば真を返す // @もじはじまる
    type: 'func',
    josi: [['が'], ['で', 'から']],
    pure: true,
    fn: function(s: string, a: string): boolean {
      return s.startsWith(a)
    }
  },
  '文字終': { // @文字列SがAで終わるならば真を返す // @もじおわる
    type: 'func',
    josi: [['が'], ['で']],
    pure: true,
    fn: function(s: string, a: string): boolean {
      return s.endsWith(a)
    }
  },
  '出現': { // @文字列(配列)SにAが出現する場合に真を返す // @しゅつげん
    type: 'func',
    josi: [['に','で'], ['が']],
    pure: true,
    fn: function(s: any, a: string): boolean {
      if (typeof(s) === 'string') {
        return s.includes(a)
      }
      if (s instanceof Array) {
        return s.includes(a)
      }
      const ss = String(s)
      return ss.includes(a)
    }
  },

  // @置換・トリム
  '置換': { // @文字列Sのうち文字列AをBに全部置換して返す // @ちかん
    type: 'func',
    josi: [['の', 'で'], ['を', 'から'], ['に', 'へ']],
    pure: true,
    fn: function(s: string, a: string, b: string) {
      return String(s).split(a).join(b)
    }
  },
  '単置換': { // @文字列Sのうち、最初に出現するAだけをBに置換して返す // @たんちかん
    type: 'func',
    josi: [['の', 'で'], ['を'], ['に', 'へ']],
    pure: true,
    fn: function(s: string, a: string, b: string) {
      // replaceは最初の一度だけ置換する
      return String(s).replace(a, b)
    }
  },
  'トリム': { // @文字列Sの前後にある空白を削除する // @とりむ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).replace(/^\s+/, '').replace(/\s+$/, '')
    }
  },
  '空白除去': { // @文字列Sの前後にある空白を削除する // @くうはくじょきょ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).replace(/^\s+/, '').replace(/\s+$/, '')
    }
  },
  '右トリム': { // @文字列Sの末尾にある空白を削除する // @みぎとりむ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).replace(/\s+$/, '')
    }
  },
  '左トリム': { // @文字列Sの先頭にある空白を削除する // @ひだりとりむ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).replace(/^\s+/, '')
    }
  },
  '末尾空白除去': { // @文字列Sの末尾にある空白を削除する // @まつびくうはくじょきょ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).replace(/\s+$/, '')
    }
  },

  // @文字変換
  '大文字変換': { // @アルファベットの文字列Sを大文字に変換 // @おおもじへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).toUpperCase()
    }
  },
  '小文字変換': { // @アルファベットの文字列Sを小文字に変換 // @こもじへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).toLowerCase()
    }
  },
  '平仮名変換': { // @文字列Sのカタカナをひらがなに変換 // @ひらがなへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      const kanaToHira = (str: string) => {
        return String(str).replace(/[\u30a1-\u30f6]/g, function(m: string) {
          const chr = m.charCodeAt(0) - 0x60
          return String.fromCharCode(chr)
        })
      }
      return kanaToHira('' + s)
    }
  },
  'カタカナ変換': { // @文字列Sのひらがなをカタカナに変換 // @かたかなへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      const hiraToKana = (str: string) => {
        return String(str).replace(/[\u3041-\u3096]/g, function(m: string) {
          const chr = m.charCodeAt(0) + 0x60
          return String.fromCharCode(chr)
        })
      }
      return hiraToKana('' + s)
    }
  },
  '英数全角変換': { // @文字列Sの半角英数文字を全角に変換 // @えいすうぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).replace(/[A-Za-z0-9]/g, function(v: string) {
        return String.fromCharCode(v.charCodeAt(0) + 0xFEE0)
      })
    }
  },
  '英数半角変換': { // @文字列Sの全角英数文字を半角に変換 // @えいすうはんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(v: string) {
        return String.fromCharCode(v.charCodeAt(0) - 0xFEE0)
      })
    }
  },
  '英数記号全角変換': { // @文字列Sの半角英数記号文字を全角に変換 // @えいすうきごうぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).replace(/[\x20-\x7E]/g, function(v: string) {
        if (v === ' ') { return '　' } // 半角スペース(0x20)を全角スペース(U+3000)に
        return String.fromCharCode(v.charCodeAt(0) + 0xFEE0)
      })
    }
  },
  '英数記号半角変換': { // @文字列Sの記号文字を半角に変換 // @えいすうきごうはんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string): string {
      return String(s).replace(/[\u3000\uFF00-\uFF5F]/g, function(v: string) {
        if (v === '　') { return ' ' } // 全角スペース(U+3000)を半角スペース(U+0020)
        return String.fromCharCode(v.charCodeAt(0) - 0xFEE0)
      })
    }
  },
  'カタカナ全角変換': { // @文字列Sの半角カタカナを全角に変換 // @かたかなぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string, sys: any) {
      // 半角カタカナ
      const zen1 = sys.__getSysVar('全角カナ一覧')
      const han1 = sys.__getSysVar('半角カナ一覧')
      const zen2 = sys.__getSysVar('全角カナ濁音一覧')
      const han2 = sys.__getSysVar('半角カナ濁音一覧')
      let str = ''
      let i = 0
      while (i < s.length) {
        // 濁点の変換
        const c2 = s.substring(i, i + 2)
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
  'カタカナ半角変換': { // @文字列Sの全角カタカナを半角に変換 // @かたかなはんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(s: string, sys: any) {
      // 半角カタカナ
      const zen1 = sys.__getSysVar('全角カナ一覧')
      const han1 = sys.__getSysVar('半角カナ一覧')
      const zen2 = sys.__getSysVar('全角カナ濁音一覧')
      const han2 = sys.__getSysVar('半角カナ濁音一覧')
      return s.split('').map((c) => {
        const i = zen1.indexOf(c)
        if (i >= 0) {
          return han1.charAt(i)
        }
        const j = zen2.indexOf(c)
        if (j >= 0) {
          return han2.substring(j * 2, j * 2 + 2)
        }
        return c
      }).join('')
    }
  },
  '全角変換': { // @文字列Sの半角文字を全角に変換 // @ぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: false,
    fn: function(s: string, sys: any) {
      let result = s
      result = sys.__exec('カタカナ全角変換', [result, sys])
      result = sys.__exec('英数記号全角変換', [result, sys])
      return result
    }
  },
  '半角変換': { // @文字列Sの全角文字を半角に変換 // @はんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: false,
    fn: function(s: string, sys: any) {
      let result = s
      result = sys.__exec('カタカナ半角変換', [result, sys])
      result = sys.__exec('英数記号半角変換', [result, sys])
      return result
    }
  },
  '全角カナ一覧': { type: 'const', value: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッ、。ー「」' }, // @ぜんかくかないちらん
  '全角カナ濁音一覧': { type: 'const', value: 'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ' }, // @ぜんかくかなだくおんいちらん
  '半角カナ一覧': { type: 'const', value: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｧｨｩｪｫｬｭｮｯ､｡ｰ｢｣ﾞﾟ' }, // @はんかくかないちらん
  '半角カナ濁音一覧': { type: 'const', value: 'ｶﾞｷﾞｸﾞｹﾞｺﾞｻﾞｼﾞｽﾞｾﾞｿﾞﾀﾞﾁﾞﾂﾞﾃﾞﾄﾞﾊﾞﾋﾞﾌﾞﾍﾞﾎﾞﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ' }, // @はんかくかなだくおんいちらん

  // @指定形式
  '通貨形式': { // @数値Vを三桁ごとにカンマで区切る // @つうかけいしき
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(v: any) {
      return String(v).replace(/(?<!\.\d*?)(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
    }
  },
  'ゼロ埋': { // @数値VをA桁の0で埋める // @ぜろうめ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(v: any, a: any): string {
      v = String(v)
      let z = '0'
      for (let i = 0; i < a; i++) { z += '0' }
      a = parseInt(a)
      const vLength = Array.from(v).length
      if (a < vLength) { a = vLength }
      const s = z + String(v)
      const chars = Array.from(s)
      return chars.slice(chars.length - a).join('')
    }
  },
  '空白埋': { // @文字列VをA桁の空白で埋める // @くうはくうめ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(v: any, a: any): string {
      v = String(v)
      let z = ' '
      for (let i = 0; i < a; i++) { z += ' ' }
      a = parseInt(a)
      const vLength = Array.from(v).length
      if (a < vLength) { a = vLength }
      const s = z + String(v)
      const chars = Array.from(s)
      return chars.slice(chars.length - a).join('')
    }
  },

  // @文字種類
  'かなか判定': { // @文字列Sの1文字目がひらがなか判定 // @かなかはんてい
    type: 'func',
    josi: [['を', 'の', 'が']],
    pure: true,
    fn: function(s: any): boolean {
      const c = String(s).charCodeAt(0)
      return (c >= 0x3041 && c <= 0x309F)
    }
  },
  'カタカナ判定': { // @文字列Sの1文字目がカタカナか判定 // @かたかなかはんてい
    type: 'func',
    josi: [['を', 'の', 'が']],
    pure: true,
    fn: function(s: any): boolean {
      const c = String(s).charCodeAt(0)
      return (c >= 0x30A1 && c <= 0x30FA)
    }
  },
  '数字判定': { // @文字列Sの1文字目が数字か判定 // @すうじかはんてい
    type: 'func',
    josi: [['を', 'が']],
    pure: true,
    fn: function(s: any): boolean {
      const c = String(s).charAt(0)
      return ((c >= '0' && c <= '9') || (c >= '０' && c <= '９'))
    }
  },
  '数列判定': { // @文字列S全部が数字か判定 // @すうれつかはんてい
    type: 'func',
    josi: [['を', 'が']],
    pure: true,
    fn: function(s: any): boolean {
      const checkerRE = /^[+\-＋－]?([0-9０-９]*)(([.．][0-9０-９]+)?|([.．][0-9０-９]+[eEｅＥ][+\-＋－]?[0-9０-９]+)?)$/
      if (s === '') { return false } // 空文字列はfalse
      return String(s).match(checkerRE) !== null
    }
  },
}
