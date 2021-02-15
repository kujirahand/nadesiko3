const PluginCaniuse = {
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
    }
  },
  // @ブラウザサポート
  'ブラウザ名変換表': {type: 'const', value: require('caniuse-db/data.json').agents}, // @ぶらうざめいへんかんひょう
  '対応ブラウザ一覧取得': { // @対応しているブラウザの一覧を取得する // @たいおうぶらうざいちらんしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      const browserslist = require('browserslist')
      return browserslist()
    }
  },
}
module.exports = PluginCaniuse
// scriptタグで取り込んだ時、自動で登録する
/* istanbul ignore else */
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) 
  {navigator.nako3.addPluginObject('PluginCaniuse', PluginCaniuse)}


