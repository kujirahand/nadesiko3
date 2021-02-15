// plugin_browser_in_worker.js

const PartBrowserColor = require('./plugin_browser_color.js')
const PartBrowserAjax = require('./plugin_browser_ajax.js')
const PartBrowserHtml = require('./plugin_browser_html.js')
const PartBrowserWebsocket = require('./plugin_browser_websocket.js')

const BrowserParts = [
  PartBrowserColor,
  PartBrowserAjax,
  PartBrowserHtml,
  PartBrowserWebsocket
]

const PluginBrowserInWorker = {
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      /* eslint no-global-assign: 0 */
      if (typeof self === 'undefined') {self = {}}
      if (typeof navigator === 'undefined') {navigator = {}}

      // 定数を初期化
      sys.__v0['AJAX:ONERROR'] = (err) => { console.log(err) }
      // オブジェクトを初期化
      sys.__v0['SELF'] = self
      sys.__v0['NAVIGATOR'] = navigator
    }
  }
}

BrowserParts.forEach((a) => {
  const b = {}
  Object.assign(b, a)
  if (typeof b['初期化'] !== 'undefined') {
    delete b['初期化']
  }
  Object.assign(PluginBrowserInWorker, b)
})

module.exports = PluginBrowserInWorker
