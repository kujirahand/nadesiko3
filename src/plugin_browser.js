// plugin_browser.js
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
  }
}

module.exports = PluginBrowser
