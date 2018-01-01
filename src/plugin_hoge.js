/**
 * file: plugin_hoge.js
 * プラグインをテストするためのプラグイン
 */
const PluginHoge = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
    }
  },
  // @HOGEテスト
  'HOGE足': { // @足し算を行う // @HOGEたす
    type: 'func',
    josi: [['と'], ['を']],
    fn: function (a, b) {
      return a + b
    }
  }
}
module.exports = PluginHoge
