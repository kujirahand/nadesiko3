/**
 * file: plugin_markup.js
 * マークアップ言語関連のプラグイン
 */
const PluginMarkup = {
  // @マークアップ
  'マークダウンHTML変換': { // @マークダウン形式で記述された文字列SをHTML形式に変換する // @まーくだうんえいちてぃーえむえるへんかん
    type: 'func',
    josi: [['を']],
    fn: function (s) {
      const markdown = require('markdown')
      return markdown.parse(s)
    }
  },
  'HTML整形': { // @HTML形式で記述された文字列Sを整形する // @えいちてぃーえむえるせいけい
    type: 'func',
    josi: [['を']],
    fn: function (s) {
      const html = require('html')
      return html.prettyPrint(s, {indent_size: 2})
    }
  }
}

module.exports = PluginMarkup

// scriptタグで取り込んだ時、自動で登録する
if (typeof (navigator) === 'object')
  {navigator.nako3.addPluginObject('PluginMarkup', PluginMarkup)}
