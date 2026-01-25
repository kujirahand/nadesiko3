// @ts-nocheck
export default {
  // @ダイアログ
  '言': { // @メッセージダイアログにSを表示 // @いう
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    fn: function(s: any) {
      window.alert(s)
    },
    return_none: true
  },
  'ダイアログキャンセル値': { type: 'var', value: '' }, // @だいあろぐきゃんせるち
  '尋': { // @メッセージSと入力ボックスを出して尋ねる // @たずねる
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    fn: function(s: any, sys: any) {
      const r = window.prompt(s)
      if (r === null) {
        return sys.__getSysVar('ダイアログキャンセル値')
      }
      if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(r)) {
        return parseFloat(r)
      }
      if (/^[-+－＋]?[0-9０-９]+([.．][0-9０-９]+)?$/.test(r)) {
        return parseFloat(r.replace(/[－＋０-９．]/g, c => {
          return String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
        }))
      }
      return r
    }
  },
  '文字尋': { // @メッセージSと入力ボックスを出して尋ねる。返り値は常に入力されたままの文字列となる // @もじたずねる
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    fn: function(s: any, sys: any) {
      const r = window.prompt(s)
      if (r === null) {
        return sys.__getSysVar('ダイアログキャンセル値')
      }
      return r
    }
  },
  '二択': { // @メッセージSと[OK][キャンセル]のダイアログを出して尋ねる。戻り値はtrueかfalseのどちらかになる。 // @にたく
    type: 'func',
    josi: [['で', 'の', 'と', 'を']],
    pure: true,
    fn: function(s: any) {
      return window.confirm(s)
    }
  }
}
