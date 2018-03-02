// plugin_browser.js
import 'whatwg-fetch'
const errMsgCanvasInit = '描画を行うためには、HTML内にcanvasを配置し、idを振って『描画開始』命令に指定します。'

const PluginBrowser = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      // 定数を初期化
      sys.__v0['AJAX:ONERROR'] = (err) => { console.log(err) }
      // オブジェクトを初期化
      sys.__v0['DOCUMENT'] = document
      sys.__v0['WINDOW'] = window
      sys.__v0['NAVIGATOR'] = navigator
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
      const r = window.confirm(s)
      return r
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
      for (var key in params) {
        fd.set(key, params[key])
      }
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
  'AJAXオプション': { type: 'const', value: '' }, // @Ajax関連のオプションを指定 // @AJAXおぷしょん
  'AJAXオプション設定': { // @Ajax命令でオプションを設定 // @AJAXおぷしょんせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    fn: function (option, sys) {
      sys.__v0['AJAXオプション'] = option
    },
    return_none: true
  },

  // @DOM操作
  'DOCUMENT': { type: 'const', value: '' }, // @ブラウザdocumentオブジェクト // @DOCUMENT
  'WINDOW': { type: 'const', value: '' }, // @ブラウザwindowオブジェクト // @WINDOW
  'NAVIGATOR': { type: 'const', value: '' }, // @ブラウザnavigatorオブジェクト // @NAVIGATOR
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
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      dom[event] = sys.__findVar(funcStr, null)
    },
    return_none: true
  },
  'DOMイベント追加': { // @DOMのEVENTになでしこ関数名funcStrのイベントを追加// @DOMいべんとついか
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom, event, funcStr, sys) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      dom.addEventListener(event, sys.__findVar(funcStr, null))
    },
    return_none: true
  },
  'DOMイベント削除': { // @DOMのEVENTからなでしこ関数名funcStrのイベントを削除// @DOMいべんとさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    fn: function (dom, event, funcStr, sys) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      dom.removeEventListener(event, sys.__findVar(funcStr, null))
    },
    return_none: true
  },
  'DOMイベント発火時': { // @DOMのEVENTが発火した時にCALLBACKを実行するように設定 // @DOMいべんとはっかしたとき
    type: 'func',
    josi: [['で'], ['の'], ['が']],
    fn: function (callback, dom, event, sys) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      dom.addEventListener(event, callback)
    },
    return_none: true
  },
  'クリック時': { // 無名関数FでDOMをクリックした時に実行するイベントを設定 // @くりっくしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom.onclick = func
    },
    return_none: true
  },
  '読込時': { // 無名関数FでDOMを読み個だ時に実行するイベントを設定 // @よみこんだとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onload'] = func
    },
    return_none: true
  },
  'フォーム送信時': { // 無名関数Fでフォームを送信した時に実行するイベントを設定 // @ふぉーむそうしんしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onsubmit'] = func
    },
    return_none: true
  },
  'キー押時': { // 無名関数FでDOMに対してキーを押した時に実行するイベントを設定 // @きーおしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onkeydown'] = func
    },
    return_none: true
  },
  'キー離時': { // 無名関数FでDOMに対してキーを離した時に実行するイベントを設定 // @きーはなしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onkeyup'] = func
    },
    return_none: true
  },
  'マウス押時': { // 無名関数FでDOMに対してキーを押した時に実行するイベントを設定 // @まうすおしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onmousedown'] = func
    },
    return_none: true
  },
  'マウス移動時': { // 無名関数FでDOMに対してキーを押した時に実行するイベントを設定 // @まうすいどうしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onmousemove'] = func
    },
    return_none: true
  },
  'マウス離時': { // 無名関数FでDOMに対してキーを離した時に実行するイベントを設定 // @まうすはなしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (func, dom, sys) {
      if (typeof (dom) === 'string') dom = document.querySelector(dom)
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      dom['onmouseup'] = func
    },
    return_none: true
  },
  'DOMテキスト設定': { // @DOMにテキストを設定 // @DOMてきすとせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: function (dom, text) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      const tag = dom.tagName.toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        dom.value = text
      } else {
        dom.innerHTML = text
      }
    },
    return_none: true
  },
  'DOMテキスト取得': { // @DOMのテキストを取得 // @DOMてきすとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      const tag = dom.tagName.toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return dom.value
      }
      return dom.innerHTML
    }
  },
  'DOM_HTML設定': { // @DOMにHTML文字列を設定 // @DOM_HTMLせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    fn: function (dom, text) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      dom.innerHTML = text
    },
    return_none: true
  },
  'DOM_HTML取得': { // @DOMのHTML文字列を取得 // @DOM_HTMLしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      return dom.innerHTML
    }
  },
  'DOM属性設定': { // @DOMの属性Sに値Vを設定 // @DOMぞくせいせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom, s, v) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      dom[s] = v
    },
    return_none: true
  },
  'DOM属性取得': { // @DOMの属性Sを取得 // @DOMぞくせいしゅとく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    fn: function (dom, s) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      return dom[s]
    }
  },
  'DOMスタイル設定': { // @DOMのスタイルAに値Bを設定 // @DOMすたいるせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom, s, v) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      dom.style[s] = v
    },
    return_none: true
  },
  'DOMスタイル一括設定': { // @DOMに(辞書型で)STYLEを一括設定 // @DOMすたいるいっかつせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (dom, v) {
      if (typeof dom === 'string') {
        dom = document.querySelectorAll(dom)
      }
      if (!dom) return
      if (dom instanceof window.HTMLElement) dom = [dom]
      for (let i = 0; i < dom.length; i++) {
        const e = dom[i]
        for (const key in v) {
          e.style[key] = v[key]
        }
      }
    },
    return_none: true
  },
  'DOMスタイル取得': { // @DOMのSTYLEの値を取得 // @DOMすたいるしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    fn: function (dom, style) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      if (!dom) return ''
      return dom.style[style]
    }
  },
  'DOMスタイル一括取得': { // @DOMのSTYLE(配列で複数指定)の値を取得 // @DOMすたいるいっかつしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    fn: function (dom, style) {
      const res = {}
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      if (!dom) return res
      if (style instanceof String) {
        style = [style]
      }
      if (style instanceof Array) {
        for (let i = 0; i < style.length; i++) {
          const key = style[i]
          res[key] = dom.style[key]
        }
        return res
      }
      if (style instanceof Object) {
        for (let key in style) {
          res[key] = dom.style[key]
        }
      }
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
      if (p.length === 0) return res
      const params = p[1].split('&')
      for (const line of params) {
        const line2 = line + '='
        const kv = line2.split('=')
        const k = decodeURIComponent(kv[0])
        const v = decodeURIComponent(kv[1])
        res[k] = v
      }
      return res
    }
  },

  // @ローカルストレージ
  '保存': { // @ブラウザのlocalStorageのKにVを保存 // @ほぞん
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (key, v) {
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
      for (const key in window.localStorage) {
        keys.push(key)
      }
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
      if (typeof cv === 'string') {
        cv = document.querySelector(cv)
        if (!cv) cv = document.getElementById(cv)
      }
      if (!cv) throw new Error(errMsgCanvasInit)
      sys.__canvas = cv
      sys.__ctx = cv.getContext('2d')
    },
    return_none: true
  },
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
        if (xy.length === 2) {
          ctx.drawImage(im, xy[0], xy[1])
        } else if (xy.length === 4) {
          ctx.drawImage(im, xy[0], xy[1], xy[2], xy[3])
        } else if (xy.length === 6) {
          ctx.drawImage(im, xy[0], xy[1], xy[2], xy[3], xy[4], xy[5])
        }
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
  }
}

module.exports = PluginBrowser
