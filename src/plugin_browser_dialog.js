module.exports = {
  // @ダイアログ
  '言': { // @メッセージダイアログにSを表示 // @いう
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    fn: function (s) {
      window.alert(s)
    },
    return_none: true
  },
  '尋': { // @メッセージSと入力ボックスを出して尋ねる // @たずねる
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    fn: function (s, sys) {
      const r = window.prompt(s)
      if (!r) {
        return sys.__v0['空']
      }
      if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(r)) {
        return parseFloat(r)
      }
      if (/^[-+－＋]?[0-9０-９]+([\.．][0-9０-９]+)?$/.test(r)) {
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
    fn: function (s, sys) {
      const r = window.prompt(s)
      if (!r) {
        return sys.__v0['空']
      }
      return r
    }
  },
  '二択': { // @メッセージSと[OK]と[キャンセル]のダイアログを出して尋ねる // @にたく
    type: 'func',
    josi: [['で', 'の', 'と', 'を']],
    pure: true,
    fn: function (s) {
      return window.confirm(s)
    }
  }
}
