module.exports = {
  // @DOM操作/イベント
  'DOMイベント追加': { // @DOMのEVENTになでしこ関数名funcStrのイベントを追加// @DOMいべんとついか
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: false,
    fn: function (dom, event, funcStr, sys) {
      if (typeof (dom) === 'string')
        {dom = document.querySelector(dom)}

      dom.addEventListener(event, sys.__findVar(funcStr, null))
    },
    return_none: true
  },
  'DOMイベント削除': { // @DOMのEVENTからなでしこ関数名funcStrのイベントを削除// @DOMいべんとさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    pure: false,
    fn: function (dom, event, funcStr, sys) {
      if (typeof (dom) === 'string')
        {dom = document.querySelector(dom)}

      dom.removeEventListener(event, sys.__findVar(funcStr, null))
    },
    return_none: true
  },
  'DOMイベント発火時': { // @DOMのEVENTが発火した時にCALLBACKを実行するように設定 // @DOMいべんとはっかしたとき
    type: 'func',
    josi: [['で'], ['の'], ['が']],
    pure: true,
    fn: function (callback, dom, event, sys) {
      if (typeof (dom) === 'string')
        {dom = document.querySelector(dom)}

      dom.addEventListener(event, callback)
    },
    return_none: true
  },
  '対象イベント': {type:'const', value: ''}, // @たいしょういべんと
  'DOMイベント処理停止': { // @キーイベントやマウスイベントで、元々ブラウザが行う処理を中止する // @DOMいべんとしょりていし
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (event, sys) {
      event.preventDefault()
    },
    return_none: true
  },
  'クリック時': { // @無名関数FでDOMをクリックした時に実行するイベントを設定 // @くりっくしたとき
    type: 'func',
    josi: [['で'], ['を']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom.onclick = (e) => {
        sys.__v0['対象'] = e.target
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  '読込時': { // @無名関数FでDOMを読み込んだ時に実行するイベントを設定 // @よみこんだとき
    type: 'func',
    josi: [['で'], ['を']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom.onload = (e) => {
        sys.__v0['対象'] = e.target
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'フォーム送信時': { // @無名関数Fでフォームを送信した時に実行するイベントを設定 // @ふぉーむそうしんしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom.onsubmit = (e) => {
        sys.__v0['対象'] = e.target
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  '押キー': {type: 'const', value: ''}, // @おされたきー
  'キー押時': { // @無名関数FでDOMに対してキーを押した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーおしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onkeydown'] = (e) => {
        sys.__v0['対象'] = e.target
        sys.__v0['押キー'] = e.key
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'キー離時': { // @無名関数FでDOMに対してキーを離した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーはなしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onkeyup'] = (e) => {
        sys.__v0['対象'] = e.target
        sys.__v0['押キー'] = e.key
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'キータイピング時': { // @無名関数FでDOMに対してキーをプレスした時に実行するイベントを設定。『押されたキー』が設定される。 // @きーたいぴんぐしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onkeypress'] = (e) => {
        sys.__v0['対象'] = e.target
        sys.__v0['押キー'] = e.key
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'マウスX': {type: 'const', value: 0}, // @まうすX
  'マウスY': {type: 'const', value: 0}, // @まうすY
  'マウス押時': { // @無名関数FでDOMに対してマウスボタンを押した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすおしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      // 左上座標を求める
      dom['onmousedown'] = (e) => {
        const box = e.target.getBoundingClientRect()
        sys.__v0['マウスX'] = e.clientX - box.left
        sys.__v0['マウスY'] = e.clientY - box.top
        sys.__v0['対象'] = e.target
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'マウス移動時': { // @無名関数FでDOMに対してマウスカーソルが移動した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすいどうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onmousemove'] = (e) => {
        const box = e.target.getBoundingClientRect()
        sys.__v0['マウスX'] = e.clientX - box.left
        sys.__v0['マウスY'] = e.clientY - box.top
        sys.__v0['対象'] = e.target
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'マウス離時': { // @無名関数FでDOMに対してマウスボタンを離した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。『対象』にイベントDOM。『対象イベント』にイベント引数。 // @まうすはなしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onmouseup'] = (e) => {
        const box = e.target.getBoundingClientRect()
        sys.__v0['マウスX'] = e.clientX - box.left
        sys.__v0['マウスY'] = e.clientY - box.top
        sys.__v0['対象'] = e.target
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'タッチX': {type: 'const', value: 0}, // @たっちX
  'タッチY': {type: 'const', value: 0}, // @たっちY
  'タッチ配列': {type: 'const', value: []}, // @たっちはいれつ
  'タッチイベント計算': { // @タッチイベントで座標計算を行う。『タッチX』『タッチY』『対象』『対象イベント』が設定される。 // @たっちいべんとけいさん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (e, sys) {
      const box = e.target.getBoundingClientRect()
      const touches = e.changedTouches
      if (touches.length <= 0) return
      const ts = []
      for (let i = 0; i < touches.length; i++) {
        const t = touches[i]
        const tx = t.clientX - box.left
        const ty = t.clientY - box.top
        if (i == 0) {
          sys.__v0['タッチX'] = tx
          sys.__v0['タッチY'] = ty
        }
        ts.push([tx, ty])
      }
      sys.__v0['タッチ配列'] = ts
      sys.__v0['対象'] = e.target
      sys.__v0['対象イベント'] = e
    }
  },
  'タッチ開始時': { // @無名関数FでDOMに対してタッチを開始した時に実行するイベントを設定。// @たっちかいししたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['ontouchstart'] = (e) => {
        sys.__exec('タッチイベント計算', [e, sys])
        return func(e, sys)
      }
    },
    return_none: true
  },
  'タッチ時': { // @無名関数FでDOMに対してタッチして指を動かした時に実行するイベントを設定。// @たっちしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['ontouchmove'] = (e) => {
        sys.__exec('タッチイベント計算', [e, sys])
        return func(e, sys)
      }
    },
    return_none: true
  },
  'タッチ終了時': { // @無名関数FでDOMに対してタッチして指を離した時のイベントを設定。// @たっちしゅうりょうしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['ontouchend'] = (e) => {
        sys.__exec('タッチイベント計算', [e, sys])
        return func(e, sys)
      }
    },
    return_none: true
  },
  'タッチキャンセル時': { // @無名関数FでDOMに対してタッチイベントをキャンセルした時の動作を設定。// @たっちきゃんせるしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: false,
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') {dom = document.querySelector(dom)}
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['ontouchcancel'] = (e) => {
        sys.__exec('タッチイベント計算', [e, sys])
        return func(e, sys)
      }
    },
    return_none: true
  },
  '画面更新時実行': { // @画面描画タイミングで関数F(文字列指定も可)を実行する。識別IDを返す。// @がめんこうしんじじっこう
    type: 'func',
    josi: [['を']],
    pure: false,
    fn: function (func, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      return window.requestAnimationFrame(func)
    }
  },
  '画面更新処理取消': { // @識別IDを指定して『画面更新時実行』を取り消す// @がめんこうしんしょりとりけし
    type: 'func',
    josi: [['の', 'を']],
    pure: false,
    fn: function (id, sys) {
      window.cancelAnimationFrame(id)
    },
    return_none: true
  }
}
