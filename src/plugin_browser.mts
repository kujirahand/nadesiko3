/**
 * @fileOverview ブラウザプラグイン
 */
import { NakoValue, NakoCallback, NakoCallbackEvent, NakoSystem } from '../core/src/plugin_api.mjs'
import { NakoBrowsesrSystem, IBrowserDocument, IBrowserWindow, IBrowserLocation } from './plugin_browser_api.mjs'
import { parsePosition } from '../core/src/nako_logger.mjs'

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
import PartBrowserCamera from './plugin_browser_camera.mjs'
import { NakoRuntimeError } from '../core/src/nako_errors.mjs'

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
  PartBrowserCrypto,
  PartBrowserCamera
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
    fn: function (sys: NakoBrowsesrSystem) {
      /* eslint no-global-assign: 0 */
      const doc: IBrowserDocument = (typeof document === 'undefined') ? { 'body': {}, 'querySelector': () => null } : document
      const win: IBrowserWindow = (typeof window === 'undefined') ? { 'location': { 'href': 'http://localhost/' } } : window
      const nav: object = (typeof navigator === 'undefined') ? {} : navigator
      const loc: IBrowserLocation = (typeof win.location === 'undefined') ? { 'href': 'http://localhost/' } : win.location

      // 定数を初期化
      sys.__setSysVar('AJAX:ONERROR', (err: unknown) => { console.log(err) })
      // オブジェクトを初期化
      sys.__setSysVar('DOCUMENT', doc as unknown as NakoValue)
      sys.__setSysVar('WINDOW', win as unknown as NakoValue)
      sys.__setSysVar('NAVIGATOR', nav as unknown as NakoValue)
      sys.__setSysVar('DOM親要素', doc.body as NakoValue)
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
      sys.__addEvent = (dom: HTMLElement|string, event: string, func: NakoCallback, setHandler: NakoCallbackEvent) => {
        // dom element
        let domElement: HTMLElement|null = null
        if (typeof (dom) === 'string') {
          domElement = doc.querySelector(dom)
          if (!domElement) { throw new Error('DOMイベントが追加できません。要素が見当たりません。') }
        } else {
          domElement = dom
        }
        // func
        if (typeof (func) === 'string') {
          func = sys.__findVar(func, null) as NakoCallback
          if (!func) { throw new Error('DOMイベントが追加できません。関数が見当たりません。') }
        }
        // make wrapper func
        const wrapperFunc = (e: Event) => {
          sys.__setSysVar('対象', e.target)
          sys.__setSysVar('対象イベント', e)
          // 追加データが得られる場合
          if (setHandler) { setHandler(e, sys) }
          if (typeof func === 'function') {
            try {
              return func(e, sys)
            } catch (err) {
              // event error reporter
              const sys0: any = sys as any
              if (sys0 && sys0.__v0) {
                const line0 = sys0.__v0.get('__line')
                const pos = parsePosition(line0)
                sys.logger.error(err, pos)
                console.error(`[DOMイベントのエラー](${line0}) 対象:`, e.target, 'エラー:', err)
              } else {
                console.error('[DOMイベントのエラー] 対象:', e.target, 'エラー:', err)
              }
              return false
            }
          }
          return false
        }
        // add
        sys.__dom_events.push({ dom: domElement, event, func: wrapperFunc, rawFunc: func })
        const domWithEventListenr = domElement as { addEventListener: (event: string, func: (e: Event) => void) => void }
        if (typeof domWithEventListenr.addEventListener === 'function') {
          domWithEventListenr.addEventListener(event, wrapperFunc)
        }
      }
      // キーイベントハンドラ
      sys.__keyHandler = (e: KeyboardEvent, sys: NakoBrowsesrSystem) => {
        sys.__setSysVar('押キー', e.key)
      }
      // マウスイベントハンドラ
      sys.__mouseHandler = (e: MouseEvent, sys: NakoBrowsesrSystem) => {
        const target = e.target as HTMLElement
        if (target && target instanceof HTMLElement) {
          const box = target.getBoundingClientRect()
          sys.__setSysVar('マウスX', e.clientX - box.left)
          sys.__setSysVar('マウスY', e.clientY - box.top)
          if (e.buttons !== undefined) {
            // (ref) https://developer.mozilla.org/ja/docs/Web/API/MouseEvent/buttons
            const buttonLabels = ['', '左', '右', '', '中央']
            sys.__setSysVar('押ボタン', buttonLabels[e.buttons])
          }
        }
      }
      // タッチイベントハンドラ
      sys.__touchHandler = (e: TouchEvent, sys: NakoBrowsesrSystem) => {
        const target = e.target as HTMLElement
        if (target && target instanceof HTMLElement) {
          const box = target.getBoundingClientRect()
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
      }
      // DOMイベント削除 (探して削除)
      sys.__removeEvent = (dom, event, func) => {
        // dom
        let domElement: HTMLElement|null = null
        if (typeof (dom) === 'string') {
          domElement = doc.querySelector(dom)
          if (!domElement) { throw new Error('DOMイベントが削除できません。要素が見当たりません。') }
        } else {
          domElement = dom
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
      sys.__removeAllDomEvents = () => {
        sys.__dom_events.forEach(e => {
          e.dom.removeEventListener(e.event, e.func)
        })
        sys.__dom_events = []
        // requestAnimationFrame
        if (sys.__requestAnimationFrameLastId > 0) {
          (win as Window).cancelAnimationFrame(sys.__requestAnimationFrameLastId)
          sys.__requestAnimationFrameLastId = 0
        }
      }
      // DOMに動的プロパティの取得と設定を追加する
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sys.__addPropMethod = (obj: any) => {
        if (!obj) { return }
        if (obj.__setProp === undefined) {
          obj.__setProp = (prop: string|string[], value: object, sys: NakoBrowsesrSystem) => {
            sys.__exec('DOM設定変更', [obj, prop, value, sys])
          }
          obj.__getProp = (prop: string|string[], sys: NakoBrowsesrSystem) => {
            return sys.__exec('DOM設定取得', [obj, prop, sys])
          }
        }
      }
      // Elementのクラスに対してDOMに動的プロパティの取得と設定を適用するよう登録する #1863
      if (sys.__registPropAccessor && globalThis.Element) {
        sys.__registPropAccessor(
          Element,
          function (prop: string|string[], sys: NakoSystem): unknown {
            // @ts-expect-error: use this
            return sys.__exec('DOM設定取得', [(this as Element), prop, sys as NakoBrowsesrSystem])
          },
          function (prop: string|string[], value: object, sys: NakoSystem): void {
            // @ts-expect-error: use this
            sys.__exec('DOM設定変更', [(this as Element), prop, value, sys as NakoBrowsesrSystem])
          }
        )
      }
      // DOM取得のために使う
      sys.__query = (dom: object|string, commandName: string, isGetFunc: boolean) => {
        // get element
        let elm: HTMLElement|null = null
        if (typeof dom === 'string') { // string to HTMLElement
          elm = document.querySelector(dom)
          if (!elm) {
            elm = document.getElementById(dom)
          }
        } else {
          elm = dom as HTMLElement
        }
        // check element
        if (!elm) {
          if (isGetFunc) {
            // 取得イベントではコンソールにヒントを出す
            console.warn(`[ヒント](${sys.__getSysVar('__line')})『${commandName}』でDOM取得に失敗しています。DOM=`, dom)
          } else {
            // 設定イベントでは実行時エラーにする
            const desc = (typeof dom === 'string') ? dom : JSON.stringify(dom, null, 2)
            throw new Error(`『${commandName}』でクエリ『${desc}』でDOM取得に失敗しました。`)
          }
        }
        sys.__addPropMethod(elm)
        return elm
      }
      // 動的にJSライブラリを取り込む
      sys.__loadScript = (url) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.type = 'text/javascript'
          script.src = url
          script.onload = () => { resolve() }
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
    fn: function (sys: NakoBrowsesrSystem) {
      // chart.jsを破棄
      if (sys.__chartjs) {
        const chartjs = sys.__chartjs as { destroy: () => void }
        if (typeof chartjs.destroy === 'function') {
          chartjs.destroy()
        }
      }
      // 正しく「カメラ終了」を呼んだかチェック (#2142)
      if (sys.tags.usingCamera) {
        sys.__exec('カメラ終了', [sys.tags.video, sys])
      }
      // 全DOMイベントをクリア
      sys.__removeAllDomEvents()
    }
  }
}

BrowserParts.forEach((a) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {}
  Object.assign(b, a)
  // 各モジュールでの初期化処理は認めない
  if (typeof b['初期化'] !== 'undefined') {
    delete b['初期化']
  }
  Object.assign(PluginBrowser, b)
})

export default PluginBrowser
