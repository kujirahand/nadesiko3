// plugin_browser.js
const errMsgCanvasInit = '描画を行うためには、HTML内にcanvasを配置し、idを振って『CANVAS描画開始』命令に指定します。'

const PluginBrowser = {
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
    fn: function (s) {
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

  // @DOM操作
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
    fn: function (dom, s, v) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      dom[s] = v
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
  'DOMスタイル取得': { // @DOMのスタイルAの値を取得 // @DOMすたいるしゅとく
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom, s, v) {
      if (typeof (dom) === 'string') {
        dom = document.querySelector(dom)
      }
      return dom.style[s]
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
  // @ローカルストレージ
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
    fn: function (key) {
      window.localStorage.clear()
    },
    return_none: true
  },
  // @ ブラウザ上での描画 Canvas API
  '描画開始': { // @描画先にCanvasを指定して描画API(2D)の利用準備する // @びょうがAPIしょきか
    type: 'func',
    josi: [['の', 'へ']],
    fn: function (cv, sys) {
      if (typeof cv === 'string') cv = document.getElementById(cv)
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
    josi: [['で', 'の', 'を']],
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
        sys.lineTo(t[0], t[1])
      }
      sys.__ctx.lineTo(p[0], p[1])
      sys.__ctx.fill()
      sys.__ctx.stroke()
    },
    return_none: true
  },
  '画像描画': { // @ [x, y, w, h]へ(img要素)idの画像を描画する // @ がぞうびょうが
    type: 'func',
    josi: [['へ', 'に'], ['の']],
    fn: function (xy, id, sys) {
      if (!sys.__ctx) throw new Error(errMsgCanvasInit)
      if (typeof id === 'string') id = document.getElementById(id)
      if (xy.length === 2) {
        sys.__ctx.drawImage(id, xy[0], xy[1])
      } else if (xy.length === 4) {
        sys.__ctx.drawImage(id, xy[0], xy[1], xy[2], xy[3])
      } else if (xy.length === 6) {
        sys.__ctx.drawImage(id, xy[0], xy[1], xy[2], xy[3], xy[4], xy[5])
      }
    },
    return_none: true
  }
}

module.exports = PluginBrowser
