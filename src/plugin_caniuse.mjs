// @ts-nocheck
// (memo) require('caniuse-db/data.json').agents を確認
// `npm run build:browsers` を実行すると browsers.mjs が生成される

import browsers from './browsers.mjs'
import agents from './browsers_agents.mjs'

const PluginCaniuse = {
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
    }
  },
  // @ブラウザサポート
  'ブラウザ名変換表': { type: 'const', value: agents }, // @ぶらうざめいへんかんひょう
  '対応ブラウザ一覧取得': { // @対応しているブラウザの一覧を取得する // @たいおうぶらうざいちらんしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      return browsers
    }
  }
}
export default PluginCaniuse
// scriptタグで取り込んだ時、自動で登録する
/* istanbul ignore else */
if (typeof (navigator) === 'object' && typeof (navigator.nako3)) { navigator.nako3.addPluginObject('PluginCaniuse', PluginCaniuse) }
