// @ts-nocheck
/**
 * file: plugin_markup.js
 * マークアップ言語関連のプラグイン
 */

import { parse as parseMD } from 'marked'
import html from 'html'

const PluginMarkup = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_markup', // プラグインの名前
      description: 'HTML整形やマークダウン変換などの命令を提供するプラグイン', // プラグインの説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako', 'cnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },
  // @マークアップ
  'マークダウンHTML変換': { // @マークダウン形式で記述された文字列SをHTML形式に変換する // @まーくだうんHTMLへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (s) {
      const html = parseMD(s)
      return html
    }
  },
  'HTML整形': { // @HTML形式で記述された文字列Sを整形する // @HTMLせいけい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (s) {
      return html.prettyPrint(s, { indent_size: 2 })
    }
  }
}
export default PluginMarkup
// scriptタグで取り込んだ時、自動で登録する
if (typeof (navigator) === 'object') { navigator.nako3.addPluginObject('PluginMarkup', PluginMarkup) }
