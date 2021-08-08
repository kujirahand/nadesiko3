// @ts-nocheck
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
const PartBrowserCrypto = require('./plugin_browser_crypto.js')

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
  PartBrowserChart,
  PartBrowserCrypto
]

const PluginBrowser = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_browser', // プラグインの名前
      pluginVersion: '3.2.24', // プラグインのバージョン
      nakoRuntime: ['wnako'], // 対象ランタイム
      nakoVersion: '^3.2.24' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      /* eslint no-global-assign: 0 */
      if (typeof document === 'undefined') { document = { 'body': {} } }
      if (typeof window === 'undefined') { window = { 'location': { 'href': '' } } }
      if (typeof navigator === 'undefined') { navigator = {} }

      // 定数を初期化
      sys.__v0['AJAX:ONERROR'] = (err) => { console.log(err) }
      // オブジェクトを初期化
      sys.__v0.DOCUMENT = document
      sys.__v0.WINDOW = window
      sys.__v0.NAVIGATOR = navigator
      sys.__v0['DOM親要素'] = document.body
      sys.__v0['ブラウザURL'] = window.location.href

      // 「!クリア」でDOMイベントを削除するため
      sys.__dom_events = [] // [{}, {}, {} ...]
      // DOM追加イベント
      sys.__addEvent = (dom, event, func, setHandler) => {
        // dom
        if (typeof (dom) === 'string') {
          dom = document.querySelector(dom)
          if (!dom) { throw new Error('DOMイベントが追加できません。要素が見当たりません。') }
        }
        // func
        if (typeof (func) === 'string') {
          func = sys.__findVar(func, null)
          if (!func) { throw new Error('DOMイベントが追加できません。関数が見当たりません。') }
        }
        // make wrapper func
        const wrapperFunc = (e) => {
          sys.__v0['対象'] = e.target
          sys.__v0['対象イベント'] = e
          // 追加データが得られる場合
          if (setHandler) { setHandler(e, sys) }
          return func(e, sys)
        }
        // add
        sys.__dom_events.push({ dom, event, func: wrapperFunc, rawFunc: func })
        dom.addEventListener(event, wrapperFunc)
      }
      // キーイベントハンドラ
      sys.__keyHandler = (e, sys) => {
        sys.__v0['押キー'] = e.key
      }
      // マウスイベントハンドラ
      sys.__mouseHandler = (e, sys) => {
        const box = e.target.getBoundingClientRect()
        sys.__v0['マウスX'] = e.clientX - box.left
        sys.__v0['マウスY'] = e.clientY - box.top
      }
      // タッチイベントハンドラ
      sys.__touchHandler = (e, sys) => {
        const box = e.target.getBoundingClientRect()
        const touches = e.changedTouches
        if (touches.length <= 0) { return }
        const ts = []
        for (let i = 0; i < touches.length; i++) {
          const t = touches[i]
          const tx = t.clientX - box.left
          const ty = t.clientY - box.top
          if (i === 0) {
            sys.__v0['タッチX'] = tx
            sys.__v0['タッチY'] = ty
          }
          ts.push([tx, ty])
        }
        sys.__v0['タッチ配列'] = ts
        return ts
      }
      // DOMイベント削除 (探して削除)
      sys.__removeEvent = (dom, event, func) => {
        // dom
        if (typeof (dom) === 'string') {
          dom = document.querySelector(dom)
          if (!dom) { throw new Error('DOMイベントが削除できません。要素が見当たりません。') }
        }
        // func
        if (typeof (func) === 'string') {
          func = sys.__findVar(func, null)
          if (!func) { throw new Error('DOMイベントが削除できません。関数が見当たりません。') }
        }
        // find
        for (let i = 0; i < sys.__dom_events.length; i++) {
          const e = sys.__dom_events[i]
          if (e.dom === dom && e.event === event && e.rawFunc === func) {
            e.dom.removeEventListener(e.event, e.func)
            sys.__dom_events.splice(i, 1)
            break
          }
        }
      }
      // requestAnimationFrame のためのid
      sys.__requestAnimationFrameLastId = 0
      // DOMイベント全クリア
      sys.__removeAllDomEvent = () => {
        sys.__dom_events.forEach(e => {
          console.log(e.event, e.dom, e)
          e.dom.removeEventListener(e.event, e.func)
        })
        sys.__dom_events = []
        // requestAnimationFrame
        if (sys.__requestAnimationFrameLastId > 0) {
          window.cancelAnimationFrame(sys.__requestAnimationFrameLastId)
          sys.__requestAnimationFrameLastId = 0
        }
      }
    }
  },
  '!クリア': {
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      // chart.jsを破棄
      if (sys.__chartjs) {
        sys.__chartjs.destroy()
      }
      // 全DOMイベントをクリア
      sys.__removeAllDomEvent()
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
