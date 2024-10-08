// @ts-nocheck
export default {
  // @DOM操作とイベント
  '対象イベント': { type: 'const', value: '' }, // @たいしょういべんと
  'DOMイベント追加': { // @DOMのEVENTになでしこ関数名funcStrのイベントを追加// @DOMいべんとついか
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (dom: any, event: any, funcStr: any, sys: any) {
      sys.__addEvent(dom, event, funcStr, null)
    },
    return_none: true
  },
  'DOMイベント削除': { // @DOMのEVENTからなでしこ関数名funcStrのイベントを削除// @DOMいべんとさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    pure: true,
    fn: function (dom: any, event: any, funcStr: any, sys: any) {
      sys.__removeEvent(dom, event, funcStr)
    },
    return_none: true
  },
  'DOMイベント発火時': { // @DOMのEVENTが発火した時にCALLBACKを実行するように設定 // @DOMいべんとはっかしたとき
    type: 'func',
    josi: [['で'], ['の'], ['が']],
    pure: true,
    fn: function (callback: any, dom: any, event: any, sys: any) {
      sys.__addEvent(dom, event, callback, null)
    },
    return_none: true
  },
  'DOMイベント処理停止': { // @キーイベントやマウスイベントで、元々ブラウザが行う処理を中止する // @DOMいべんとしょりていし
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (event: any, sys: any) {
      event.preventDefault()
    },
    return_none: true
  },
  'クリック時': { // @無名関数FでDOMをクリックした時に実行するイベントを設定 // @くりっくしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'click', func, null)
    },
    return_none: true
  },
  '変更時': { // @無名関数FでDOMを変更した時に実行するイベントを設定 // @へんこうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'click', func, null)
    },
    return_none: true
  },
  '読込時': { // @無名関数FでDOMを読み込んだ時に実行するイベントを設定 // @よみこんだとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'load', func, null)
    },
    return_none: true
  },
  'フォーム送信時': { // @無名関数Fでフォームを送信した時に実行するイベントを設定 // @ふぉーむそうしんしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'submit', func, null)
    },
    return_none: true
  },
  '押キー': { type: 'const', value: '' }, // @おされたきー
  'キー押時': { // @無名関数FでDOMに対してキーを押した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーおしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'keydown', func, sys.__keyHandler)
    },
    return_none: true
  },
  'キー離時': { // @無名関数FでDOMに対してキーを離した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーはなしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'keyup', func, sys.__keyHandler)
    },
    return_none: true
  },
  'キータイピング時': { // @無名関数FでDOMに対してキーをプレスした時に実行するイベントを設定。『押されたキー』が設定される。 // @きーたいぴんぐしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'keypress', func, sys.__keyHandler)
    },
    return_none: true
  },
  'マウスX': { type: 'const', value: 0 }, // @まうすX
  'マウスY': { type: 'const', value: 0 }, // @まうすY
  'マウス押時': { // @無名関数FでDOMに対してマウスボタンを押した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすおしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'mousedown', func, sys.__mouseHandler)
    },
    return_none: true
  },
  'マウス移動時': { // @無名関数FでDOMに対してマウスカーソルが移動した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすいどうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'mousemove', func, sys.__mouseHandler)
    },
    return_none: true
  },
  'マウス離時': { // @無名関数FでDOMに対してマウスボタンを離した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすはなしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'mouseup', func, sys.__mouseHandler)
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
    fn: function (e: any, sys: any) {
      return sys.__touchHandler(e, sys)
    }
  },
  'タッチ開始時': { // @無名関数FでDOMに対してタッチを開始した時に実行するイベントを設定。// @たっちかいししたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'touchstart', func, sys.__touchHandler)
    },
    return_none: true
  },
  'タッチ時': { // @無名関数FでDOMに対してタッチして指を動かした時に実行するイベントを設定。// @たっちしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'touchmove', func, sys.__touchHandler)
    },
    return_none: true
  },
  'タッチ終了時': { // @無名関数FでDOMに対してタッチして指を離した時のイベントを設定。// @たっちしゅうりょうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'touchend', func, sys.__touchHandler)
    },
    return_none: true
  },
  'タッチキャンセル時': { // @無名関数FでDOMに対してタッチイベントをキャンセルした時の動作を設定。// @たっちきゃんせるしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    fn: function (func: any, dom: any, sys: any) {
      sys.__addEvent(dom, 'touchcancel', func, sys.__touchHandler)
    },
    return_none: true
  },
  '画面更新時実行': { // @画面描画タイミングで関数F(文字列指定も可)を実行する。識別IDを返す。// @がめんこうしんじじっこう
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (func: any, sys: any) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      if (!func) { throw new Error('『画面更新時実行』で関数の取得に失敗しました。') }
      sys.__requestAnimationFrameLastId = window.requestAnimationFrame(func)
      return sys.__requestAnimationFrameLastId
    }
  },
  '画面更新処理取消': { // @識別IDを指定して『画面更新時実行』を取り消す// @がめんこうしんしょりとりけし
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (id: any, sys: any) {
      window.cancelAnimationFrame(id)
      if (sys.__requestAnimationFrameLastId === id) { sys.__requestAnimationFrameLastId = 0 }
    },
    return_none: true
  }
}
