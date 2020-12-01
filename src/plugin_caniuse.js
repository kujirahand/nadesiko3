const PluginCaniuse = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
    }
  },
  // @ブラウザサポート
  'ブラウザ名変換表': {type: 'const', value: require('caniuse-db/data.json').agents}, // @ぶらうざめいへんかんひょう
}
module.exports = PluginCaniuse
// scriptタグで取り込んだ時、自動で登録する
/* istanbul ignore else */
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) 
  {navigator.nako3.addPluginObject('PluginCaniuse', PluginCaniuse)}


