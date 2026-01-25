// @ts-nocheck
// plugin_browser_in_worker.js

import PartBrowserColor from './plugin_browser_color.mjs'
import PartBrowserAjax from './plugin_browser_ajax.mjs'
import PartBrowserHtml from './plugin_browser_html.mjs'
import PartBrowserWebsocket from './plugin_browser_websocket.mjs'

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
    fn: function(sys: any) {
      /* eslint no-global-assign: 0 */
      if (typeof self === 'undefined') { self = {} }
      if (typeof navigator === 'undefined') { navigator = {} }

      // 定数を初期化
      sys.__setSysVar('AJAX:ONERROR', (err) => { console.log(err) })
      // オブジェクトを初期化
      sys.__v0.SELF = self
      sys.__v0.NAVIGATOR = navigator
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

export default PluginBrowserInWorker
