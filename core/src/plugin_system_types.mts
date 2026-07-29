/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * 型変換の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
export default {
  // @型変換
  '変数型確認': { // @変数Vの型を返す // @へんすうかたかくにん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any) {
      return (typeof v)
    }
  },
  'TYPEOF': { // @変数Vの型を返す // @TYPEOF
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any) {
      return (typeof v)
    }
  },
  '文字列変換': { // @値Vを文字列に変換 // @もじれつへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): string {
      return String(v)
    }
  },
  'TOSTR': { // @値Vを文字列に変換 // @TOSTR
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): string {
      return String(v)
    }
  },
  '整数変換': { // @値Vを整数に変換 // @せいすうへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): number {
      return parseInt(v)
    }
  },
  'TOINT': { // @値Vを整数に変換 // @TOINT
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): number {
      return parseInt(v)
    }
  },
  '実数変換': { // @値Vを実数に変換 // @じっすうへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): number {
      return parseFloat(v)
    }
  },
  'TOFLOAT': { // @値Vを実数に変換 // @TOFLOAT
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): number {
      return parseFloat(v)
    }
  },
  'INT': { // @値Vを整数に変換 // @INT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any): number {
      return parseInt(v)
    }
  },
  'FLOAT': { // @値Vを実数に変換 // @FLOAT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any): number {
      return parseFloat(v)
    }
  },
  'NAN判定': { // @値VがNaNかどうかを判定(命令『非数判定』を使う事を推奨) // @NANはんてい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): boolean {
      return isNaN(v)
    }
  },
  '非数判定': { // @値Vが非数かどうかを判定(NAN判定より堅牢) // @ひすうはんてい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): boolean {
      // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
      return Number.isNaN(v)
    }
  },
  'HEX': { // @値Vを16進数に変換 // @HEX
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any): string {
      return parseInt(a).toString(16)
    }
  },
  '進数変換': { // @値VをN進数に変換 // @しんすうへんかん
    type: 'func',
    josi: [['を', 'の'], ['']],
    pure: true,
    fn: function(v: any, n: number): string {
      return parseInt(v).toString(n)
    }
  },
  '二進': { // @値Vを2進数に変換 // @にしん
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(v: any): string {
      return parseInt(v).toString(2)
    }
  },
  '二進表示': { // @値Vを2進数に変換して表示 // @にしんひょうじ
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(v: any, sys: any) {
      const s = parseInt(v).toString(2)
      sys.__exec('表示', [s, sys])
    }
  },
  'RGB': { // @HTML用のカラーコードを返すRGB(R,G,B)で各値は0-255 // @RGB
    type: 'func',
    josi: [['と'], ['の'], ['で']],
    pure: true,
    fn: function(r: any, g: any, b: any): string {
      const z2 = (v: any): string => {
        const v2: string = '00' + (parseInt(String(v)).toString(16))
        return v2.substring(v2.length - 2, v2.length)
      }
      return '#' + z2(r) + z2(g) + z2(b)
    }
  },
}
