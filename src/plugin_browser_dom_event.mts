/* eslint-disable @typescript-eslint/unbound-method */
import { NakoCallback, NakoCallbackEvent } from '../core/src/plugin_api.mjs'
import { NakoBrowsesrSystem, NakoDom } from './plugin_browser_api.mjs'
export default {
  // @DOM操作とイベント
  '対象イベント': { type: 'const', value: '' }, // @たいしょういべんと
  'DOMイベント追加': { // @DOMのEVENTになでしこ関数名funcStrのイベントを追加// @DOMいべんとついか
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (dom: NakoDom, event: string, funcStr: string, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, event, funcStr, null)
    },
    return_none: true
  },
  'DOMイベント削除': { // @DOMのEVENTからなでしこ関数名funcStrのイベントを削除// @DOMいべんとさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    pure: true,
    fn: function (dom: NakoDom, event: string, funcStr: NakoCallback, sys: NakoBrowsesrSystem) {
      sys.__removeEvent(dom, event, funcStr)
    },
    return_none: true
  },
  'DOMイベント発火時': { // @DOMのEVENTが発火した時にCALLBACKを実行するように設定 // @DOMいべんとはっかしたとき
    type: 'func',
    josi: [['で'], ['の'], ['が']],
    pure: true,
    fn: function (callback: NakoCallback, dom: NakoDom, event: string, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, event, callback, null)
    },
    return_none: true
  },
  'DOMイベント処理停止': { // @キーイベントやマウスイベントで、元々ブラウザが行う処理を中止する // @DOMいべんとしょりていし
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (event: unknown, sys: NakoBrowsesrSystem) {
      if (event !== null && typeof event === 'object' && 'preventDefault' in event) {
        const objWithFn = event as { preventDefault: () => void }
        if (typeof objWithFn.preventDefault === 'function') {
          objWithFn.preventDefault()
        }
      }
    },
    return_none: true
  },
  'クリック時': { // @無名関数FでDOMをクリックした時に実行するイベントを設定 // @くりっくしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'click', func, sys.__mouseHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'ダブルクリック時': { // @無名関数FでDOMをダブルクリックした時に実行するイベントを設定 // @だぶるくりっくしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'dblclick', func, sys.__mouseHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  '右クリック時': { // @無名関数FでDOMを右クリックした時に実行するイベント(contextmenu)を設定 // @みぎくりっくしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'contextmenu', func, sys.__mouseHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  '変更時': { // @無名関数FでDOMを変更した時に実行するイベントを設定 // @へんこうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'change', func, null)
    },
    return_none: true
  },
  '読込時': { // @無名関数FでDOMを読み込んだ時に実行するイベントを設定 // @よみこんだとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'load', func, null)
    },
    return_none: true
  },
  'フォーム送信時': { // @無名関数Fでフォームを送信した時に実行するイベントを設定 // @ふぉーむそうしんしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'submit', func, null)
    },
    return_none: true
  },
  '押キー': { type: 'const', value: '' }, // @おされたきー
  'キー押時': { // @無名関数FでDOMに対してキーを押した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーおしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'keydown', func, sys.__keyHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'キー離時': { // @無名関数FでDOMに対してキーを離した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーはなしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'keyup', func, sys.__keyHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'キータイピング時': { // @無名関数FでDOMに対してキーをプレスした時に実行するイベントを設定。『押されたキー』が設定される。 // @きーたいぴんぐしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'keypress', func, sys.__keyHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'マウスX': { type: 'const', value: 0 }, // @まうすX
  'マウスY': { type: 'const', value: 0 }, // @まうすY
  '押ボタン': { type: 'const', value: 0 }, // @おされたぼたん
  'マウス押時': { // @無名関数FでDOMに対してマウスボタンを押した時に実行するイベントを設定。『マウスX』『マウスY』に座標が、『押したボタン』に押したボタン(左,中央,右)が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすおしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'mousedown', func, sys.__mouseHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'マウス移動時': { // @無名関数FでDOMに対してマウスカーソルが移動した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすいどうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の', 'へ', 'に']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'mousemove', func, sys.__mouseHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'マウス離時': { // @無名関数FでDOMに対してマウスボタンを離した時に実行するイベントを設定。『マウスX』『マウスY』に座標が、『押したボタン』に押したボタン(左,中央,右)が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすはなしたとき
    type: 'func',
    josi: [['で'], ['を', 'の', 'から']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'mouseup', func, sys.__mouseHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'マウス入時': { // @無名関数FでDOMに対してマウスカーソルが入った時のイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすはいったとき
    type: 'func',
    josi: [['で'], ['を', 'の', 'に', 'へ']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'mouseover', func, sys.__mouseHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'マウス出時': { // @無名関数FでDOMに対してマウスカーソルが出た時のイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすでたとき
    type: 'func',
    josi: [['で'], ['を', 'の', 'から']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'mouseout', func, sys.__mouseHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'マウスホイール値': { type: 'const', value: 0 }, // @まうすほいーるち
  'マウスホイール時': { // @無名関数FでDOMに対してマウスホイールを回した時のイベントを設定。『マウスホイール値』に値が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすほいーるしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'wheel', func, ((e: object) => {
        const objWithDeltaY = e as { deltaY: number }
        if (typeof objWithDeltaY.deltaY === 'number') {
          sys.__setSysVar('マウスホイール値', objWithDeltaY.deltaY)
        }
      }) as NakoCallbackEvent)
    },
    return_none: true
  },
  'タッチX': { type: 'const', value: 0 }, // @たっちX
  'タッチY': { type: 'const', value: 0 }, // @たっちY
  'タッチ配列': { type: 'const', value: [] }, // @たっちはいれつ
  'タッチイベント計算': { // @タッチイベントで座標計算を行う。『タッチX』『タッチY』『タッチ配列』『対象』『対象イベント』が設定される。『タッチ配列』の内容が返る // @たっちいべんとけいさん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (e: TouchEvent, sys: NakoBrowsesrSystem) {
      return sys.__touchHandler(e, sys)
    }
  },
  'タッチ開始時': { // @無名関数FでDOMに対してタッチを開始した時に実行するイベントを設定。// @たっちかいししたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'touchstart', func, sys.__touchHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'タッチ時': { // @無名関数FでDOMに対してタッチして指を動かした時に実行するイベントを設定。// @たっちしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'touchmove', func, sys.__touchHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'タッチ終了時': { // @無名関数FでDOMに対してタッチして指を離した時のイベントを設定。// @たっちしゅうりょうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'touchend', func, sys.__touchHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  'タッチキャンセル時': { // @無名関数FでDOMに対してタッチイベントをキャンセルした時の動作を設定。// @たっちきゃんせるしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: NakoCallback, dom: NakoDom, sys: NakoBrowsesrSystem) {
      sys.__addEvent(dom, 'touchcancel', func, sys.__touchHandler as NakoCallbackEvent)
    },
    return_none: true
  },
  '画面更新時実行': { // @画面描画タイミングで関数F(文字列指定も可)を実行する。識別IDを返す。// @がめんこうしんじじっこう
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (func: unknown, sys: NakoBrowsesrSystem) {
      func = sys.__findVar(func as NakoCallback, null) // 文字列指定なら関数に変換
      if (!func) { throw new Error('『画面更新時実行』で関数の取得に失敗しました。') }
      sys.__requestAnimationFrameLastId = window.requestAnimationFrame(func as unknown as FrameRequestCallback)
      return sys.__requestAnimationFrameLastId
    }
  },
  '画面更新処理取消': { // @識別IDを指定して『画面更新時実行』を取り消す// @がめんこうしんしょりとりけし
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (id: number, sys: NakoBrowsesrSystem) {
      window.cancelAnimationFrame(id)
      if (sys.__requestAnimationFrameLastId === id) { sys.__requestAnimationFrameLastId = 0 }
    },
    return_none: true
  }
}
