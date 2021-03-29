// plugin_browser.js
const PartBrowserColor = require('./plugin_browser_color.js')
const PartBrowserSystem = require('./plugin_browser_system.js')
const PartBrowserDialog = require('./plugin_browser_dialog.js')
const PartBrowserLocation = require('./plugin_browser_location.js')
const PartBrowserAjax = require('./plugin_browser_ajax.js')
const PartBrowserDomBasic = require('./plugin_browser_dom_basic.js')
const PartBrowserDomEvent = require('./plugin_browser_dom_event.js')
const PartBrowserDomParts = require('./plugin_browser_dom_parts.js')
const PartBrowserHtml = require('./plugin_browser_html.js')
const PartBrowserStorage = require('./plugin_browser_storage.js')
const PartBrowserCanvas = require('./plugin_browser_canvas.js')
const PartBrowserGeolocation = require('./plugin_browser_geolocation.js')
const PartBrowserSpeech = require('./plugin_browser_speech.js')
const PartBrowserWebsocket = require('./plugin_browser_websocket.js')
const PartBrowserAudio = require('./plugin_browser_audio.js')
const PartBrowserHotkey = require('./plugin_browser_hotkey.js')
const PartBrowserChart = require('./plugin_browser_chart.js')

const BrowserParts = [
  PartBrowserColor,
  PartBrowserSystem,
  PartBrowserDialog,
  PartBrowserLocation,
  PartBrowserAjax,
  PartBrowserDomBasic,
  PartBrowserDomEvent,
  PartBrowserDomParts,
  PartBrowserHtml,
  PartBrowserStorage,
  PartBrowserCanvas,
  PartBrowserGeolocation,
  PartBrowserSpeech,
  PartBrowserWebsocket,
  PartBrowserAudio,
  PartBrowserHotkey,
  PartBrowserChart
]

const PluginBrowser = {
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      /* eslint no-global-assign: 0 */
      if (typeof document === 'undefined') {document = {'body': {}}}
      if (typeof window === 'undefined') {window = {'location':{'href':''}}}
      if (typeof navigator === 'undefined') {navigator = {}}

      // 定数を初期化
      sys.__v0['AJAX:ONERROR'] = (err) => { console.log(err) }
      // オブジェクトを初期化
      sys.__v0['DOCUMENT'] = document
      sys.__v0['WINDOW'] = window
      sys.__v0['NAVIGATOR'] = navigator
      sys.__v0['DOM親要素'] = document.body
      sys.__v0['ブラウザURL'] = window.location.href
    }
  }
}

BrowserParts.forEach((a) => {
  const b = {}
  Object.assign(b, a)
  // 各モジュールでの初期化処理は認めない
  if (typeof b['初期化'] !== 'undefined') {
    delete b['初期化']
  }
  Object.assign(PluginBrowser, b)
})

module.exports = PluginBrowser
