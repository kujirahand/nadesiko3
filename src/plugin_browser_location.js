module.exports = {
  // @ブラウザ操作
  'ブラウザ移動': { // @任意のURLにブラウザ移動(ただし移動後スクリプトの実行は停止する) // @ぶらうざいどう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (url, sys) {
      window.location.href = url
    }
  },
  'ブラウザ戻': { // @任意のURLにブラウザ移動(ただし移動後スクリプトの実行は停止する) // @ぶらうざもどる
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      window.history.back(-1)
    }
  },
  'ブラウザURL': {type: 'const', value: ''}, // @NぶらうざURL
}
