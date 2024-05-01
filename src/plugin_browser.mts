// plugin_browser
// @ts-nocheck
import PartBrowserColor from './plugin_browser_color.mjs'
import PartBrowserSystem from './plugin_browser_system.mjs'
import PartBrowserDialog from './plugin_browser_dialog.mjs'
import PartBrowserLocation from './plugin_browser_location.mjs'
import PartBrowserAjax from './plugin_browser_ajax.mjs'
import PartBrowserDomBasic from './plugin_browser_dom_basic.mjs'
import PartBrowserDomEvent from './plugin_browser_dom_event.mjs'
import PartBrowserDomParts from './plugin_browser_dom_parts.mjs'
import PartBrowserHtml from './plugin_browser_html.mjs'
import PartBrowserStorage from './plugin_browser_storage.mjs'
import PartBrowserCanvas from './plugin_browser_canvas.mjs'
import PartBrowserGeolocation from './plugin_browser_geolocation.mjs'
import PartBrowserSpeech from './plugin_browser_speech.mjs'
import PartBrowserWebsocket from './plugin_browser_websocket.mjs'
import PartBrowserAudio from './plugin_browser_audio.mjs'
import PartBrowserHotkey from './plugin_browser_hotkey.mjs'
import PartBrowserChart from './plugin_browser_chart.mjs'
import PartBrowserCrypto from './plugin_browser_crypto.mjs'

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
      description: 'ブラウザ用のプラグイン', // 説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
      /* eslint no-global-assign: 0 */
      const doc: any = (typeof document === 'undefined') ? { 'body': {} } : document
      const win: any = (typeof window === 'undefined') ? { 'location': { 'href': 'http://localhost/' } } : window
      const nav: any = (typeof navigator === 'undefined') ? {} : navigator
      const loc: any = (typeof win.location === 'undefined') ? { 'href': 'http://localhost/' } : win.location

      // 定数を初期化
      sys.__setSysVar('AJAX:ONERROR', (err: any) => { console.log(err) })
      // オブジェクトを初期化
      sys.__setSysVar('DOCUMENT', doc)
      sys.__setSysVar('WINDOW', win)
      sys.__setSysVar('NAVIGATOR', nav)
      sys.__setSysVar('DOM親要素', doc.body)
      sys.__setSysVar('ブラウザURL', loc.href)

      // 便利なメソッドを定義
      sys.__tohtml = (text: string): string => {
        return ('' + text)
          .replace(/&/g, '&amp;')
          .replace(/>/g, '&gt;')
          .replace(/</g, '&lt;')
      }
      sys.__tohtmlQ = (text: string): string => {
        return sys.__tohtml(text)
          .replace(/"/g, '&#34;')
          .replace(/'/g, '&#39;')
      }

      // 「!クリア」でDOMイベントを削除するため
      sys.__dom_events = [] // [{}, {}, {} ...]
      // DOM追加イベント
      sys.__addEvent = (dom: any, event: any, func: any, setHandler: any) => {
        // dom
        if (typeof (dom) === 'string') {
          dom = doc.querySelector(dom)
          if (!dom) { throw new Error('DOMイベントが追加できません。要素が見当たりません。') }
        }
        // func
        if (typeof (func) === 'string') {
          func = sys.__findVar(func, null)
          if (!func) { throw new Error('DOMイベントが追加できません。関数が見当たりません。') }
        }
        // make wrapper func
        const wrapperFunc = (e: any) => {
          sys.__setSysVar('対象', e.target)
          sys.__setSysVar('対象イベント', e)
          // 追加データが得られる場合
          if (setHandler) { setHandler(e, sys) }
          if (sys.__genMode === '非同期モード') { sys.newenv = true }
          return func(e, sys)
        }
        // add
        sys.__dom_events.push({ dom, event, func: wrapperFunc, rawFunc: func })
        dom.addEventListener(event, wrapperFunc)
      }
      // キーイベントハンドラ
      sys.__keyHandler = (e: any, sys: any) => {
        sys.__setSysVar('押キー', e.key)
      }
      // マウスイベントハンドラ
      sys.__mouseHandler = (e, sys) => {
        const box = e.target.getBoundingClientRect()
        sys.__setSysVar('マウスX', e.clientX - box.left)
        sys.__setSysVar('マウスY', e.clientY - box.top)
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
            sys.__setSysVar('タッチX', tx)
            sys.__setSysVar('タッチY', ty)
          }
          ts.push([tx, ty])
        }
        sys.__setSysVar('タッチ配列', ts)
        return ts
      }
      // DOMイベント削除 (探して削除)
      sys.__removeEvent = (dom, event, func) => {
        // dom
        if (typeof (dom) === 'string') {
          dom = doc.querySelector(dom)
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
          e.dom.removeEventListener(e.event, e.func)
        })
        sys.__dom_events = []
        // requestAnimationFrame
        if (sys.__requestAnimationFrameLastId > 0) {
          win.cancelAnimationFrame(sys.__requestAnimationFrameLastId)
          sys.__requestAnimationFrameLastId = 0
        }
      }
      // DOM取得のために使う
      sys.__query = (dom, commandName, isGetFunc) => {
        const elm = (typeof dom === 'string') ? document.querySelector(dom) : dom
        if (!elm) {
          if (isGetFunc) {
            // 取得イベントではコンソールにヒントを出す
            console.warn(`[ヒント](${sys.__getSysVar('__line')})『${commandName}』でDOM取得に失敗しています。DOM=`, dom)
          } else {
            // 設定イベントでは実行時エラーにする
            const desc = (typeof dom === 'string') ? dom : String(dom)
            throw new Error(`『${commandName}』でクエリ『${desc}』でDOM取得に失敗しました。`)
          }
        }
        return elm
      }
      // 動的にJSライブラリを取り込む
      sys.__loadScript = (url) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.type = 'text/javascript'
          script.src = url
          script.onload = resolve
          script.onerror = () => {
            reject(new Error(`Failed to load script at url: ${url}`))
          }
          document.getElementsByTagName('head')[0].appendChild(script)
        })
      }
    }
  },
  '!クリア': {
    type: 'func',
    josi: [],
    pure: true,
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
  const b: any = {}
  Object.assign(b, a)
  // 各モジュールでの初期化処理は認めない
  if (typeof b['初期化'] !== 'undefined') {
    delete b['初期化']
  }
  Object.assign(PluginBrowser, b)
})

export default PluginBrowser
