module.exports = {
  // @ブラウザ操作
  'ブラウザ移動': { // @任意のURLにブラウザ移動(ただし移動後スクリプトの実行は停止する) // @ぶらうざいどう
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (url) {
      window.location.href = url
    }
  },
  'ブラウザ戻': { // @任意のURLにブラウザ移動(ただし移動後スクリプトの実行は停止する) // @ぶらうざもどる
    type: 'func',
    josi: [],
    fn: function () {
      window.history.back(-1)
    }
  }
}
