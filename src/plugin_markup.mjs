// @ts-nocheck
/**
 * file: plugin_markup.js
 * マークアップ言語関連のプラグイン
 */

import { parse as parseMD } from 'marked'
import html from 'html'

const PluginMarkup = {
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
