// plugin_browser.js
require('es6-promise').polyfill()
require('isomorphic-fetch')

const errMsgCanvasInit = '描画を行うためには、HTML内にcanvasを配置し、idを振って『描画開始』命令に指定します。'

const PluginBrowser = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      /* eslint no-global-assign: 0 */
      if (typeof document === 'undefined') document = {'body': {}}
      if (typeof window === 'undefined') window = {}
      if (typeof navigator === 'undefined') navigator = {}

      // 定数を初期化
      sys.__v0['AJAX:ONERROR'] = (err) => { console.log(err) }
      // オブジェクトを初期化
      sys.__v0['DOCUMENT'] = document
      sys.__v0['WINDOW'] = window
      sys.__v0['NAVIGATOR'] = navigator
      sys.__v0['DOM親要素'] = document.body
    }
  },

  // @色定数
  '水色': {type: 'const', value: 'aqua'}, // @みずいろ
  '紫色': {type: 'const', value: 'fuchsia'}, // @むらさきいろ
  '緑色': {type: 'const', value: 'lime'}, // @みどりいろ
  '青色': {type: 'const', value: 'blue'}, // @あおいろ
  '赤色': {type: 'const', value: 'red'}, // @あかいろ
  '黄色': {type: 'const', value: 'yellow'}, // @きいろ
  '黒色': {type: 'const', value: 'black'}, // @くろいろ
  '白色': {type: 'const', value: 'white'}, // @しろいろ
  '茶色': {type: 'const', value: 'maroon'}, // @ちゃいろ
  '灰色': {type: 'const', value: 'gray'}, // @はいいろ
  '金色': {type: 'const', value: 'gold'}, // @きんいろ
  '黄金色': {type: 'const', value: 'gold'}, // @こがねいろ
  '銀色': {type: 'const', value: 'silver'}, // @ぎんいろ
  '白金色': {type: 'const', value: 'silver'}, // @しろがねいろ
  'オリーブ色': {type: 'const', value: 'olive'}, // @おりーぶいろ
  'ベージュ色': {type: 'const', value: 'beige'}, // @べーじゅいろ
  'アリスブルー色': {type: 'const', value: 'aliceblue'}, // @ありすぶるーいろ
  'RGB': { // @赤緑青を256段階でそれぞれ指定して、#RRGGBB形式の値を返す // @RGB
    type: 'func',
    josi: [['と'], ['と'], ['で', 'の']],
    fn: function (r, g, b) {
      const z2 = (v) => {
        const v2 = '00' + v.toString(16)
        return v2.substr(v2.length - 2, 2)
      }
      return '#' + z2(r) + z2(g) + z2(b)
    },
    return_none: true
  },

  // @システム
  '終': { // @ブラウザでプログラムの実行を強制終了する // @おわる
    type: 'func',
    josi: [],
    fn: function () {
      throw new Error('__終わる__')
    },
    return_none: true
  },

  // @ダイアログ
  '言': { // @メッセージダイアログにSを表示 // @いう
    type: 'func',
    josi: [['と', 'を']],
    fn: function (s) {
      window.alert(s)
    },
    return_none: true
  },
  '尋': { // @メッセージSと入力ボックスを出して尋ねる // @たずねる
    type: 'func',
    josi: [['と', 'を']],
    fn: function (s) {
      const r = window.prompt(s)
      if (r.match(/^[0-9.]+$/)) return parseFloat(r)
      return r
    }
  },
  '二択': { // @メッセージSと[OK]と[キャンセル]のダイアログを出して尋ねる // @にたく
    type: 'func',
    josi: [['で', 'の', 'と', 'を']],
    fn: function (s) {
      return window.confirm(s)
    }
  },

  // @Ajax
  'AJAX送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @AJAXそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    fn: function (callback, url, sys) {
      let options = sys.__v0['AJAXオプション']
      if (options === '') options = {method: 'GET'}
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        callback(text)
      }).catch(err => {
        console.log('[fetch.error]', err)
        sys.__v0['AJAX:ONERROR'](err)
      })
    },
    return_none: true
  },
  'GET送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @GETそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    fn: function (callback, url, sys) {
      sys.__exec('AJAX送信時', [callback, url, sys])
    },
    return_none: true
  },
  'POST送信時': { // @AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定 // @POSTそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    fn: function (callback, url, params, sys) {
      let flist = []
      for (let key in params) {
        const v = params[key]
        const kv = encodeURIComponent(key) + '=' + encodeURIComponent(v)
        flist.push(kv)
      }
      const bodyData = flist.join('&')
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData
      }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        callback(text)
      }).catch(err => {
        sys.__v0['AJAX:ONERROR'](err)
      })
    }
  },
  'POSTフォーム送信時': { // @AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定 // @POSTふぉーむそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    fn: function (callback, url, params, sys) {
      const fd = new FormData()
      for (let key in params) 
        fd.set(key, params[key])
      
      let options = {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: fd
      }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        callback(text)
      }).catch(err => {
        sys.__v0['AJAX:ONERROR'](err)
      })
    }
  },
  'AJAX失敗時': { // @Ajax命令でエラーが起きたとき // @AJAXえらーしっぱいしたとき
    type: 'func',
    josi: [['の']],
    fn: function (callback, sys) {
      sys.__v0['AJAX:ONERROR'] = callback
    }
  },
  'AJAXオプション': {type: 'const', value: ''}, // @AJAXおぷしょん
  'AJAXオプション設定': { // @Ajax命令でオプションを設定 // @AJAXおぷしょんせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    fn: function (option, sys) {
      sys.__v0['AJAXオプション'] = option
    },
    return_none: true
  },

  // @DOM操作
  'DOCUMENT': {type: 'const', value: ''}, // @DOCUMENT
  'WINDOW': {type: 'const', value: ''}, // @WINDOW
  'NAVIGATOR': {type: 'const', value: ''}, // @NAVIGATOR
  'DOM要素ID取得': { // @DOMの要素をIDを指定して取得 // @DOMようそIDしゅとく
    type: 'func',
    josi: [['の', 'を']],
    fn: function (id) {
      return document.getElementById(id)
    }
  },
  'DOM要素取得': { // @DOMの要素をクエリqで取得して返す // @DOMようそしゅとく
    type: 'func',
    josi: [['の', 'を']],
    fn: function (q) {
      return document.querySelector(q)
    }
  },
  'DOM要素全取得': { // @DOMの要素をクエリqで全部取得して返す // @DOMようそぜんしゅとく
    type: 'func',
    josi: [['の', 'を']],
    fn: function (q) {
      return Array.from(document.querySelectorAll(q))
    }
  },
  'タグ一覧取得': { // @任意のタグの一覧を取得して返す // @たぐいちらんしゅとく
    type: 'func',
    josi: [['の', 'を']],
    fn: function (tag) {
      return document.getElementsByTagName(tag)
    }
  },
  'DOMイベント設定': { // @DOMのEVENTになでしこ関数名funcStrのイベントを設定 // @DOMいべんとせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom, event, funcStr, sys) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      dom[event] = sys.__findVar(funcStr, null)
    },
    return_none: true
  },
  'DOMイベント追加': { // @DOMのEVENTになでしこ関数名funcStrのイベントを追加// @DOMいべんとついか
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom, event, funcStr, sys) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      dom.addEventListener(event, sys.__findVar(funcStr, null))
    },
    return_none: true
  },
  'DOMイベント削除': { // @DOMのEVENTからなでしこ関数名funcStrのイベントを削除// @DOMいべんとさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    fn: function (dom, event, funcStr, sys) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      dom.removeEventListener(event, sys.__findVar(funcStr, null))
    },
    return_none: true
  },
  'DOMイベント発火時': { // @DOMのEVENTが発火した時にCALLBACKを実行するように設定 // @DOMいべんとはっかしたとき
    type: 'func',
    josi: [['で'], ['の'], ['が']],
    fn: function (callback, dom, event, sys) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      dom.addEventListener(event, callback)
    },
    return_none: true
  },
  'クリック時': { // @無名関数FでDOMをクリックした時に実行するイベントを設定 // @くりっくしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom.onclick = (e) => {
        sys.__v0['対象'] = e.target
        return func(e, sys)
      }
    },
    return_none: true
  },
  '読込時': { // @無名関数FでDOMを読み個だ時に実行するイベントを設定 // @よみこんだとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom.onload = (e) => {
        sys.__v0['対象'] = e.target
        return func(e, sys)
      }
    },
    return_none: true
  },
  'フォーム送信時': { // @無名関数Fでフォームを送信した時に実行するイベントを設定 // @ふぉーむそうしんしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom.onsubmit = (e) => {
        sys.__v0['対象'] = e.target
        return func(e, sys)
      }
    },
    return_none: true
  },
  '押キー': {type: 'const', value: ''}, // @おされたきー
  'キー押時': { // @無名関数FでDOMに対してキーを押した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーおしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onkeydown'] = (e) => {
        sys.__v0['対象'] = e.target
        sys.__v0['押キー'] = e.key
        return func(e, sys)
      }
    },
    return_none: true
  },
  'キー離時': { // @無名関数FでDOMに対してキーを離した時に実行するイベントを設定。『押されたキー』が設定される。 // @きーはなしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onkeyup'] = (e) => {
        sys.__v0['対象'] = e.target
        sys.__v0['押キー'] = e.key
        return func(e, sys)
      }
    },
    return_none: true
  },
  'キータイピング時': { // @無名関数FでDOMに対してキーをプレスした時に実行するイベントを設定。『押されたキー』が設定される。 // @きーたいぴんぐしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onkeypress'] = (e) => {
        sys.__v0['対象'] = e.target
        sys.__v0['押キー'] = e.key
        return func(e, sys)
      }
    },
    return_none: true
  },
  'マウスX': {type: 'const', value: 0}, // @まうすX
  'マウスY': {type: 'const', value: 0}, // @まうすY
  'マウス押時': { // @無名関数FでDOMに対してキーを押した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。 // @まうすおしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      // 左上座標を求める
      dom['onmousedown'] = (e) => {
        const box = e.target.getBoundingClientRect()
        sys.__v0['マウスX'] = e.clientX - box.left
        sys.__v0['マウスY'] = e.clientY - box.top
        sys.__v0['対象'] = e.target
        return func(e, sys)
      }
    },
    return_none: true
  },
  'マウス移動時': { // @無名関数FでDOMに対してキーを押した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。 // @まうすいどうしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onmousemove'] = (e) => {
        const box = e.target.getBoundingClientRect()
        sys.__v0['マウスX'] = e.clientX - box.left
        sys.__v0['マウスY'] = e.clientY - box.top
        sys.__v0['対象'] = e.target
        return func(e, sys)
      }
    },
    return_none: true
  },
  'マウス離時': { // @無名関数FでDOMに対してキーを離した時に実行するイベントを設定。『マウスX』『マウスY』に座標が設定される。 // @まうすはなしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onmouseup'] = (e) => {
        const box = e.target.getBoundingClientRect()
        sys.__v0['マウスX'] = e.clientX - box.left
        sys.__v0['マウスY'] = e.clientY - box.top
        sys.__v0['対象'] = e.target
        return func(e, sys)
      }
    },
    return_none: true
  },
  'DOMテキスト設定': { // @DOMにテキストを設定 // @DOMてきすとせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: function (dom, text) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      const tag = dom.tagName.toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA') 
        dom.value = text
       else if (tag === 'SELECT') 
        for (let i = 0; i < dom.options.length; i++) {
          const v = dom.options[i].value
          if (String(v) === text) {
            dom.selectedIndex = i
            break
          }
        }
       else 
        dom.innerHTML = text
      
    },
    return_none: true
  },
  'DOMテキスト取得': { // @DOMのテキストを取得 // @DOMてきすとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      const tag = dom.tagName.toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA') 
        return dom.value
       else if (tag === 'SELECT') {
        const idx = dom.selectedIndex
        if (idx < 0) return null
        return dom.options[idx].value
      }
      return dom.innerHTML
    }
  },
  'DOM_HTML設定': { // @DOMにHTML文字列を設定 // @DOM_HTMLせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: function (dom, text) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      dom.innerHTML = text
    },
    return_none: true
  },
  'DOM_HTML取得': { // @DOMのHTML文字列を取得 // @DOM_HTMLしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      return dom.innerHTML
    }
  },
  'テキスト設定': { // @DOMのテキストにVを設定 // @てきすとせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: function (dom, v, sys) {
      return sys.__exec('DOMテキスト設定', [dom, v, sys])
    }
  },
  'テキスト取得': { // @DOMのテキストを取得 // @てきすとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom, sys) {
      console.log(dom)
      console.log(sys)
      return sys.__exec('DOMテキスト取得', [dom, sys])
    }
  },
  'HTML設定': { // @DOMのHTMLにVを設定 // @HTMLせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: function (dom, v, sys) {
      return sys.__exec('DOM_HTML設定', [dom, v, sys])
    }
  },
  'HTML取得': { // @DOMのテキストを取得 // @HTMLしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom, sys) {
      return sys.__exec('DOM_HTML取得', [dom, sys])
    }
  },
  'DOM属性設定': { // @DOMの属性Sに値Vを設定 // @DOMぞくせいせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom, s, v) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      dom[s] = v
    },
    return_none: true
  },
  'DOM属性取得': { // @DOMの属性Sを取得 // @DOMぞくせいしゅとく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    fn: function (dom, s) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      return dom[s]
    }
  },
  'DOM和スタイル': {
    type: 'const', // @DOMわすたいる
    value: {
      '幅': 'width',
      '高さ': 'height',
      '背景色': 'background-color',
      '色': 'color',
      'マージン': 'margin',
      '余白': 'padding',
      '文字サイズ': 'font-size',
      '行揃え': 'text-align',
      '左': 'left',
      '右': 'right',
      '中央': 'center',
      'ボーダー': 'border',
      'ボックス表示': 'display',
      'なし': 'none',
      'ブロック': 'block',
      '表示位置': 'float',
      '重なり': 'z-index'
    }
  },
  'DOMスタイル設定': { // @DOMのスタイルAに値Bを設定 // @DOMすたいるせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom, s, v, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      const wa = sys.__v0['DOM和スタイル']
      if (wa[s] !== undefined) s = wa[s]
      if (wa[v] !== undefined) v = wa[v]
      dom.style[s] = v
    },
    return_none: true
  },
  'DOMスタイル一括設定': { // @DOMに(オブジェクト型で)スタイル情報を一括設定 // @DOMすたいるいっかつせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    uses: ['DOM和スタイル'],
    fn: function (dom, values, sys) {
      if (typeof dom === 'string') dom = document.querySelectorAll(dom)
      if (!dom) return
      if (dom instanceof window.HTMLElement) dom = [dom]
      const wa = sys.__v0['DOM和スタイル']
      // 列挙したDOM一覧を全てスタイル変更する
      for (let i = 0; i < dom.length; i++) {
        const e = dom[i]
        for (const key in values) {
          let s = key
          let v = values[key]
          if (wa[s] !== undefined) s = wa[s]
          if (wa[v] !== undefined) v = wa[v]
          e.style[s] = v
        }
      }
    },
    return_none: true
  },
  'DOMスタイル取得': { // @DOMのSTYLEの値を取得 // @DOMすたいるしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    fn: function (dom, style) {
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      if (!dom) return ''
      return dom.style[style]
    }
  },
  'DOMスタイル一括取得': { // @DOMのSTYLE(配列で複数指定)の値を取得 // @DOMすたいるいっかつしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    fn: function (dom, style) {
      const res = {}
      if (typeof (dom) === 'string') 
        dom = document.querySelector(dom)
      
      if (!dom) return res
      if (style instanceof String) 
        style = [style]
      
      if (style instanceof Array) {
        for (let i = 0; i < style.length; i++) {
          const key = style[i]
          res[key] = dom.style[key]
        }
        return res
      }
      if (style instanceof Object) 
        for (let key in style) 
          res[key] = dom.style[key]
        
      
      return dom.style[style]
    }
  },
  'DOM要素作成': { // @DOMにTAGの新規要素を作成 // @DOMようそさくせい
    type: 'func',
    josi: [['の', 'を']],
    fn: function (tag) {
      return document.createElement(tag)
    }
  },
  'DOM子要素追加': { // @DOMの要素PAの子へ要素ELを追加してPAを返す // @DOMこようそついか
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (pa, el) {
      if (typeof el === 'string') el = document.querySelector(el)
      if (typeof pa === 'string') pa = document.querySelector(pa)
      pa.appendChild(el)
    }
  },
  'DOM子要素削除': { // @DOMの要素PAの子から要素ELを削除してPAを返す // @DOMこようそさくじょ
    type: 'func',
    josi: [['から'], ['を']],
    fn: function (pa, el) {
      if (typeof el === 'string') el = document.querySelector(el)
      if (typeof pa === 'string') pa = document.querySelector(pa)
      pa.removeChild(el)
    }
  },
  // @DOM部品操作
  'DOM親要素': {type: 'const', value: ''}, // @DOMおやようそ
  'DOM生成個数': {type: 'const', value: 0}, // @DOMせいせいこすう
  'DOM親要素設定': { // @「ボタン作成」「エディタ作成」などのDOM要素を追加する対象を指定(デフォルトはdocument)して親要素のDOMオブジェクトを返す // @DOMおやようそせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (el, sys) {
      if (typeof el === 'string') el = document.querySelector(el) || document.getElementById(el)
      sys.__v0['DOM親要素'] = el
      return el
    }
  },
  'ボタン作成': { // @ラベルlabelを持つbutton要素を追加しDOMオブジェクトを返す // @ぼたんさくせい
    type: 'func',
    josi: [['の']],
    fn: function (label, sys) {
      const parent = sys.__v0['DOM親要素']
      const btn = document.createElement('button')
      btn.innerHTML = label
      btn.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      parent.appendChild(btn)
      sys.__v0['DOM生成個数']++
      return btn
    }
  },
  'エディタ作成': { // @textの値を持つテキストボックス(input[type='text'])の要素を追加しDOMオブジェクトを返す // @えでぃたさくせい
    type: 'func',
    josi: [['の']],
    fn: function (text, sys) {
      const parent = sys.__v0['DOM親要素']
      const inp = document.createElement('input')
      inp.type = 'text'
      inp.value = text
      inp.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      parent.appendChild(inp)
      sys.__v0['DOM生成個数']++
      return inp
    }
  },
  'テキストエリア作成': { // @textの値を持つtextarea要素を追加しDOMオブジェクトを返す // @てきすとえりあさくせい
    type: 'func',
    josi: [['の']],
    fn: function (text, sys) {
      const parent = sys.__v0['DOM親要素']
      const te = document.createElement('textarea')
      te.value = text
      te.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      parent.appendChild(te)
      sys.__v0['DOM生成個数']++
      return te
    }
  },
  'ラベル作成': { // @textの値を持つラベル(span要素)を追加しDOMオブジェクトを返す // @らべるさくせい
    type: 'func',
    josi: [['の']],
    fn: function (text, sys) {
      const parent = sys.__v0['DOM親要素']
      const te = document.createElement('span')
      te.innerHTML = text
      te.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      parent.appendChild(te)
      sys.__v0['DOM生成個数']++
      return te
    }
  },
  '改行作成': { // @改行(br要素)を追加しDOMオブジェクトを返す // @かいぎょうさくせい
    type: 'func',
    josi: [],
    fn: function (sys) {
      const parent = sys.__v0['DOM親要素']
      const te = document.createElement('br')
      te.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      parent.appendChild(te)
      sys.__v0['DOM生成個数']++
      return te
    }
  },
  'チェックボックス作成': { // @textのラベルを持つチェックボックス(input[type='checkbox'])要素を追加しDOMオブジェクトを返す // @ちぇっくぼっくすさくせい
    type: 'func',
    josi: [['の']],
    fn: function (text, sys) {
      const parent = sys.__v0['DOM親要素']
      const span = document.createElement('span')
      const inp = document.createElement('input')
      inp.type = 'checkbox'
      inp.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      const label = document.createElement('label')
      label.innerHTML = text
      label.htmlFor = inp.id
      span.appendChild(inp)
      span.appendChild(label)
      parent.appendChild(span)
      sys.__v0['DOM生成個数']++
      return inp
    }
  },
  'セレクトボックス作成': { // @配列optionsの選択肢を持つselect要素を追加しDOMオブジェクトを返す // @せれくとぼっくすさくせい
    type: 'func',
    josi: [['の']],
    fn: function (options, sys) {
      const parent = sys.__v0['DOM親要素']
      const dom = document.createElement('select')
      dom.id = 'nadesi-dom-' + (sys.__v0['DOM生成個数']++)
      for (let i = 0; i < options.length; i++) {
        const item = document.createElement('option')
        item.value = options[i]
        item.appendChild(document.createTextNode(options[i]))
        dom.appendChild(item)
      }
      parent.appendChild(dom)
      return dom
    }
  },

  // @HTML操作
  'HTML変換': { // @文字列をHTMLに変換して返す // @HTMLへんかん
    type: 'func',
    josi: [['を']],
    fn: function (text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/>/g, '&gt;')
        .replace(/</g, '&lt;')
    }
  },

  // @URLエンコード
  'URLエンコード': { // @URLエンコードして返す // @URLえんこーど
    type: 'func',
    josi: [['を', 'から']],
    fn: function (text) {
      return encodeURIComponent(text)
    }
  },
  'URLデコード': { // @URLデコードして返す // @URLでこーど
    type: 'func',
    josi: [['を', 'へ', 'に']],
    fn: function (text) {
      return decodeURIComponent(text)
    }
  },
  'URLパラメータ解析': { // @URLパラメータを解析してハッシュで返す // @URLぱらめーたかいせき
    type: 'func',
    josi: [['を', 'の', 'から']],
    fn: function (url) {
      const res = {}
      if (typeof url !== 'string') return res
      const p = url.split('?')
      if (p.length <= 1) return res
      const params = p[1].split('&')
      for (const line of params) {
        const line2 = line + '='
        const kv = line2.split('=')
        const k = decodeURIComponent(kv[0])
        res[k] = decodeURIComponent(kv[1])
      }
      return res
    }
  },

  // @ローカルストレージ
  '保存': { // @ブラウザのlocalStorageのキーKに文字列Vを保存 // @ほぞん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: function (v, key) {
      window.localStorage[key] = JSON.stringify(v)
    },
    return_none: true
  },
  '開': { // @ブラウザのlocalStorageからVを読む // @ひらく
    type: 'func',
    josi: [['を', 'から', 'の']],
    fn: function (key) {
      const v = window.localStorage[key]
      try {
        return JSON.parse(v)
      } catch (e) {
        console.log('ローカルストレージ『' + key + '』の読み込みに失敗')
      }
      return v
    },
    return_none: false
  },
  '存在': { // @ブラウザのlocalStorageにKEYが存在しているか調べる // @そんざい
    type: 'func',
    josi: [['が']],
    fn: function (key) {
      const s = window.localStorage.getItem(key)
      return (s !== null)
    },
    return_none: false
  },
  'ローカルストレージ保存': { // @ブラウザのlocalStorageのKにVを保存 // @ろーかるすとれーじほぞん
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (key, v) {
      window.localStorage[key] = JSON.stringify(v)
    },
    return_none: true
  },
  'ローカルストレージ読': { // @ブラウザのlocalStorageからVを読む // @ろーかるすとれーじよむ
    type: 'func',
    josi: [['を', 'から', 'の']],
    fn: function (key) {
      const v = window.localStorage[key]
      try {
        return JSON.parse(v)
      } catch (e) {
        console.log('ローカルストレージ『' + key + '』の読み込みに失敗')
      }
      return v
    },
    return_none: false
  },
  'ローカルストレージキー列挙': { // @ブラウザのlocalStorageのキー一覧を返す // @ろーかるすとれーじきーれっきょ
    type: 'func',
    josi: [[]],
    fn: function (key) {
      const keys = []
      for (const key in window.localStorage) 
        keys.push(key)
      
      return keys
    },
    return_none: false
  },
  'ローカルストレージキー削除': { // @ブラウザのlocalStorageのkeyを削除 // @ろーかるすとれーじきーさくじょ
    type: 'func',
    josi: [['を', 'の']],
    fn: function (key) {
      window.localStorage.removeItem(key)
    },
    return_none: true
  },
  'ローカルストレージ全削除': { // @ブラウザのlocalStorageのデータを全部削除する // @ろーかるすとれーじぜんさくじょ
    type: 'func',
    josi: [],
    fn: function () {
      window.localStorage.clear()
    },
    return_none: true
  },
  // @描画
  '描画開始': { // @描画先にCanvas(文字列でクエリの指定も可)を指定して描画API(2D)の利用準備する // @びょうがかいし
    type: 'func',
    josi: [['の', 'へ', 'で']],
    fn: function (cv, sys) {
      if (typeof cv === 'string') 
        cv = document.querySelector(cv) || document.getElementById(cv)
      
      if (!cv) throw new Error('『描画開始』でCanvasを取得できませんでした。')
      sys.__canvas = cv
      sys.__ctx = cv.getContext('2d')
      sys.__v0['描画中キャンバス'] = cv
    },
    return_none: true
  },
  '描画中キャンバス': {type: 'const', value: null}, // @ びょうがちゅうきゃんばす
  '線色設定': { // @Canvasの線の描画色(lineStyle)を指定する   // @ せんいろしてい
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (v, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      sys.__ctx.strokeStyle = v
    },
    return_none: true
  },
  '塗色設定': { // @Canvasへの描画色(fillStyle)を指定する   // @ ぬりいろしてい
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (v, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      sys.__ctx.fillStyle = v
    },
    return_none: true
  },
  '線描画': { // @ [x1, y1]から[x2, y2]まで線を描画する // @ せんびょうが
    type: 'func',
    josi: [['から'], ['へ', 'まで']],
    fn: function (a, b, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      sys.__ctx.beginPath()
      sys.__ctx.moveTo(a[0], a[1])
      sys.__ctx.lineTo(b[0], b[1])
      sys.__ctx.stroke()
    },
    return_none: true
  },
  '線太設定': { // @ vに線の太さ設定 // @ せんふとさせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (v, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      sys.__ctx.lineWidth = v
    },
    return_none: true
  },
  '四角描画': { // @ [x, y, w, h]で矩形を描画する // @ しかくびょうが
    type: 'func',
    josi: [['の', 'へ', 'に']],
    fn: function (b, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      sys.__ctx.beginPath()
      sys.__ctx.rect(b[0], b[1], b[2], b[3])
      sys.__ctx.fill()
      sys.__ctx.stroke()
    },
    return_none: true
  },
  '描画クリア': { // @ [x, y, w, h]の範囲を描画クリア // @ びょうがくりあ
    type: 'func',
    josi: [['の', 'へ', 'に']],
    fn: function (b, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      sys.__ctx.clearRect(b[0], b[1], b[2], b[3])
    },
    return_none: true
  },
  '円描画': { // @ [x, y]へrの円を描画する // @ えんびょうが
    type: 'func',
    josi: [['へ', 'に'], ['の']],
    fn: function (xy, r, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      sys.__ctx.beginPath()
      sys.__ctx.arc(xy[0], xy[1], r, 0, 2 * Math.PI, false)
      sys.__ctx.fill()
      sys.__ctx.stroke()
    },
    return_none: true
  },
  '楕円描画': { // @ [x, y, x幅, y幅, 回転, 開始角, 終了角, 左回転か]に楕円を描画する // @ だえんびょうが
    type: 'func',
    josi: [['へ', 'に', 'の']],
    fn: function (args, sys) {
      console.log(args)
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      if (!args) throw new Error('楕円描画の引数配列が無効です')
      if (args.length < 4) throw new Error('楕円描画の引数配列が不足しています')
      if (args.length < 7) {
        if (!args[4]) args[4] = 0
        if (!args[5]) args[5] = 0
        if (!args[6]) args[6] = Math.PI * 2
        if (!args[7]) args[7] = true
      }
      sys.__ctx.beginPath()
      sys.__ctx.ellipse.apply(sys.__ctx, args)
      sys.__ctx.fill()
      sys.__ctx.stroke()
    },
    return_none: true
  },
  '多角形描画': { // @ 座標配列vを指定して多角形を描画する // @ たかっけいびょうが
    type: 'func',
    josi: [['で', 'の', 'を']],
    fn: function (a, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      sys.__ctx.beginPath()
      const p = a.shift()
      sys.__ctx.moveTo(p[0], p[1])
      while (a.length > 0) {
        const t = a.shift()
        sys.__ctx.lineTo(t[0], t[1])
      }
      sys.__ctx.lineTo(p[0], p[1])
      sys.__ctx.fill()
      sys.__ctx.stroke()
    },
    return_none: true
  },
  '画像描画': { // @ [x, y, w, h]へファイル名F(またはImage)の画像を描画し、Imageを返す // @ がぞうびょうが
    type: 'func',
    josi: [['へ', 'に'], ['の', 'を']],
    fn: function (xy, img, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      const drawFunc = (im, ctx) => {
        if (xy.length === 2) 
          ctx.drawImage(im, xy[0], xy[1])
         else if (xy.length === 4) 
          ctx.drawImage(im, xy[0], xy[1], xy[2], xy[3])
         else if (xy.length === 6) 
          ctx.drawImage(im, xy[0], xy[1], xy[2], xy[3], xy[4], xy[5])
        
      }
      if (typeof img === 'string') {
        const image = new window.Image()
        image.src = img
        image.onload = () => {
          drawFunc(image, sys.__ctx)
        }
        return image
      } else {
        drawFunc(img, sys.__ctx)
        return img
      }
    },
    return_none: false
  },
  '描画フォント設定': { // @ 描画フォントを指定する(CSSのフォント設定と同じ 例「36px Aria」) // @ びょうがふぉんとせってい
    type: 'func',
    josi: [['を', 'の', 'で', 'に']],
    fn: function (n, sys) {
      sys.__ctx.font = n
    },
    return_none: true
  },
  '文字描画': { // @ [x, y]へテキストSを描画する(描画フォント設定でサイズなど指定) // @ がぞうびょうが
    type: 'func',
    josi: [['へ', 'に'], ['の', 'を']],
    fn: function (xy, s, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      sys.__ctx.fillText(s, xy[0], xy[1])
    },
    return_none: true
  },

  // @位置情報
  '位置情報取得時': { // @位置情報を取得してコールバック関数内で変数「対象」に配列で[緯度,経度]を返す // @いちじょうほうしゅとくしたとき
    type: 'func',
    josi: [['の', 'に', 'へ']],
    fn: function (func, sys) {
      let cb = func
      if (typeof cb === 'string') cb = sys.__findVar(cb)
      if (!('geolocation' in navigator)) 
        throw new Error('関数『位置情報取得時』は使えません。')
      
      navigator.geolocation.getCurrentPosition((position) => {
        sys.__v0['対象'] = [
          position.coords.latitude,
          position.coords.longitude
        ]
        cb(position)
      })
    },
    return_none: true
  },
  '位置情報監視時': { // @位置情報を監視してIDを返す。引数に指定したコールバック関数内で変数「対象」に配列で[緯度,経度]を返す // @いちじょうほうかんししたとき
    type: 'func',
    josi: [['の', 'に', 'へ']],
    fn: function (func, sys) {
      let cb = func
      if (typeof cb === 'string') cb = sys.__findVar(cb)
      if (!('geolocation' in navigator)) 
        throw new Error('関数『位置情報監視時』は使えません。')
      
      return navigator.geolocation.watchPosition((position) => {
        sys.__v0['対象'] = [
          position.coords.latitude,
          position.coords.longitude
        ]
        cb(position)
      })
    },
    return_none: false
  },
  '位置情報監視停止': { // @『位置情報監視時』で開始した監視を停止する // @いちじょうほうかんしていし
    type: 'func',
    josi: [['の']],
    fn: function (wid, sys) {
      navigator.geolocation.clearWatch(wid)
    },
    return_none: true
  },
  // @音声合成
  '話': { // @音声合成APIを使って、Sを発話する // @はなす
    type: 'func',
    josi: [['と', 'を', 'の']],
    fn: function (s, sys) {
      // 話者の特定
      let voice = sys.__v0['話:話者']
      if (!voice) voice = sys.__exec('話者設定', ['ja', sys])
      // インスタンス作成
      const msg = new SpeechSynthesisUtterance(s)
      msg.voice = voice
      if (voice) msg.lang = voice.lang // 必ず話者の特定に成功している訳ではない
      msg.rate = sys.__v0['話者速度']
      msg.pitch = sys.__v0['話者声高']
      msg.volume = sys.__v0['話者音量']
      window.speechSynthesis.speak(msg)
      console.log('#話す:', s)
      return s
    }
  },
  '話終時': { // @音声合成APIを使って、Sを発話し発話した後でcallbackを実行 // @はなしおわったとき
    type: 'func',
    josi: [['で'], ['と', 'を', 'の']],
    fn: function (callback, s, sys) {
      // 話者の特定
      let voice = sys.__v0['話:話者']
      if (!voice) voice = sys.__exec('話者設定', ['ja', sys])
      // インスタンス作成
      const msg = new SpeechSynthesisUtterance(s)
      msg.voice = voice
      if (voice) msg.lang = voice.lang // 必ず話者の特定に成功している訳ではない
      msg.rate = sys.__v0['話者速度']
      msg.pitch = sys.__v0['話者声高']
      msg.volume = sys.__v0['話者音量']
      msg.onend = (e) => {
        console.log('#話終時')
        callback(sys)
      }
      window.speechSynthesis.speak(msg)
      console.log('#話す:', s)
      return s
    }
  },
  '話者一覧取得': { // @音声合成APIの話者一覧を得る // @わしゃいちらんしゅとく
    type: 'func',
    josi: [],
    fn: function (sys) {
      // 対応している？
      if (!('SpeechSynthesisUtterance' in window)) 
        throw new Error('音声合成APIに対応していません')
      
      return window.speechSynthesis.getVoices()
    }
  },
  '話者設定': { // @音声合成APIの話者を指定する // @わしゃせってい
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (v, sys) {
      // 対応している？
      if (!('SpeechSynthesisUtterance' in window)) 
        throw new Error('音声合成APIに対応していません')
      
      // 文字列で値を指定
      if (typeof v === 'string') {
        // 話者を特定する
        const voices = window.speechSynthesis.getVoices()
        for (const i of voices) 
          if (i.lang.indexOf(v) >= 0 || i.name === v) {
            const msg = new SpeechSynthesisUtterance()
            msg.voice = i
            msg.lang = i.lang
            sys.__v0['話:話者'] = i
            console.log('#話者:', i.name)
            return i
          }
        
      }
      // 話者一覧取得で得たオブジェクトを直接指定した場合
      if (typeof v === 'object') {
        sys.__v0['話:話者'] = v
        return v
      }
      return undefined
    }
  },
  '話者速度': {type: 'const', value: 1.0}, // @わしゃそくど
  '話者声高': {type: 'const', value: 1.0}, // @わしゃこわだか
  '話者音量': {type: 'const', value: 1.0}, // @わしゃこおんりょう
  '話者詳細設定': { // @音声合成APIの話者の設定をオブジェクト形式で設定する。『速度,声高,ピッチ,音量』を指定 // @わしゃしょうさいせってい
    type: 'func',
    josi: [['で', 'に', 'へ']],
    fn: function (obj, sys) {
      const changeFunc = (key, v) => {
        if (key === '速度') sys.__v0['話者速度'] = v
        if (key === '声高' || key === 'ピッチ') sys.__v0['話者声高'] = v
        if (key === '音量') sys.__v0['話者音量'] = v
      }
      // 一括変更
      for (const key in obj) {
        const v = obj[key]
        changeFunc(key, v)
      }
    }
  },
  // @WebSocket
  'WS接続完了時': { // @WebSocketでサーバに接続完了した時に実行されるイベントを指定 // @WSせつぞくかんりょうしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WS:ONOPEN'] = callback
    },
    return_none: true
  },
  'WS受信時': { // @WebSocketでサーバからメッセージを受信した時に実行されるイベントを指定 // @WSじゅしんしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WS:ONMESSAGE'] = callback
    },
    return_none: true
  },
  'WSエラー発生時': { // @WebSocketでエラーが発生した時に実行されるイベントを指定 // @WSえらーはっせいじ
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WS:ONERROR'] = callback
    },
    return_none: true
  },
  'WS接続': { // @WebSocketサーバsに接続する // @WSせつぞく
    type: 'func',
    josi: [['に', 'へ', 'の']],
    fn: function (s, sys) {
      const ws = new WebSocket(s)
      ws.onopen = () => {
        const cbOpen = sys.__v0['WS:ONOPEN']
        if (cbOpen) cbOpen(sys)
      }
      ws.onerror = (err) => {
        const cbError = sys.__v0['WS:ONERROR']
        if (cbError) cbError(err, sys)
        console.log('WSエラー', err)
      }
      ws.onmessage = (e) => {
        console.log(e.data)
        sys.__v0['対象'] = e.data
        const cbMsg = sys.__v0['WS:ONMESSAGE']
        if (cbMsg) cbMsg(sys)
      }
      sys.__v0['WS:SOCKET'] = ws
      return ws
    }
  },
  'WS送信': { // @アクティブなWebSocketへsを送信する // @WSそうしん
    type: 'func',
    josi: [['を', 'と']],
    fn: function (s, sys) {
      const ws = sys.__v0['WS:SOCKET']
      ws.send(s)
    }
  },
  'WS切断': { // @アクティブなWebSocketを閉じる // @WSせつだん
    type: 'func',
    josi: [],
    fn: function (sys) {
      const ws = sys.__v0['WS:SOCKET']
      ws.close()
    }
  }
}

module.exports = PluginBrowser
