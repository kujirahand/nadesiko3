// @ts-nocheck
module.exports = {
  // @DOM部品操作
  'DOM親要素': { type: 'const', value: '' }, // @DOMおやようそ
  'DOM部品個数': { type: 'const', value: 0 }, // @DOMせいせいこすう
  'DOM部品オプション': { type: 'const', value: {'自動改行': false} }, // @DOMぶひんおぷしょん
  'DOM親要素設定': { // @「ボタン作成」「エディタ作成」などのDOM要素を追加する対象を指定(デフォルトはdocument)して親要素のDOMオブジェクトを返す // @DOMおやようそせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: false,
    fn: function (el, sys) {
      if (typeof el === 'string') { el = document.querySelector(el) || document.getElementById(el) }
      sys.__v0['DOM親要素'] = el
      return el
    }
  },
  'DOM親部品設定': { // @「ボタン作成」「エディタ作成」などのDOM要素を追加する対象を指定。『DOM親要素設定』と同じ。// @DOMおやぶひんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: false,
    fn: function (el, sys) {
      return sys.__exec('DOM親要素設定', [el, sys])
    }
  },
  'DOMスキン': { type: 'const', value: '' }, // @DOMすきん
  'DOMスキン辞書': { type: 'const', value: {} }, // @DOMすきんじしょ
  'DOM部品作成': { // @elmの要素を作成して『DOM親要素設定』で指定した要素に追加して、DOMオブジェクトを返す。(elmがDOM要素なら追加する) // @DOMぶひんさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (elm, sys) {
      const parent = sys.__v0['DOM親要素']
      const btn = (typeof(elm) === 'string') ? document.createElement(elm) : elm
      btn.id = 'nadesi-dom-' + sys.__v0['DOM部品個数']
      // スキン適用
      const func = sys.__v0['DOMスキン辞書'][sys.__v0['DOMスキン']]
      if (typeof (func) === 'function') { func(elm, btn, sys) }
      // DOM追加
      parent.appendChild(btn)
      sys.__v0['DOM部品個数']++
      return btn
    }
  },
  'ボタン作成': { // @ラベルlabelを持つbutton要素を追加しDOMオブジェクトを返す // @ぼたんさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (label, sys) {
      const btn = sys.__exec('DOM部品作成', ['button', sys])
      btn.innerHTML = label
      return btn
    }
  },
  'エディタ作成': { // @textの値を持つテキストボックス(input[type='text'])の要素を追加しDOMオブジェクトを返す // @えでぃたさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (text, sys) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'text'
      inp.value = text
      return inp
    }
  },
  'テキストエリア作成': { // @textの値を持つtextarea要素を追加しDOMオブジェクトを返す // @てきすとえりあさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (text, sys) {
      const te = sys.__exec('DOM部品作成', ['textarea', sys])
      te.value = text
      return te
    }
  },
  'ラベル作成': { // @textの値を持つラベル(span要素)を追加しDOMオブジェクトを返す // @らべるさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (text, sys) {
      const lbl = sys.__exec('DOM部品作成', ['span', sys])
      lbl.innerHTML = text
      return lbl
    }
  },
  'キャンバス作成': { // @大きさ[幅, 高]のcanvas要素を追加しDOMオブジェクトを返す // @きゃんばすさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (size, sys) {
      const cv = sys.__exec('DOM部品作成', ['canvas', sys])
      cv.width = size[0]
      cv.height = size[1]
      cv.style.width = size[0]
      cv.style.height = size[1]
      // 描画中キャンバスを移動する
      sys.__exec('描画開始', [cv, sys])
      return cv
    }
  },
  '改行作成': { // @改行(br要素)を追加しDOMオブジェクトを返す // @かいぎょうさくせい
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      const br = sys.__exec('DOM部品作成', ['br', sys])
      return br
    }
  },
  'チェックボックス作成': { // @textのラベルを持つチェックボックス(input[type='checkbox'])要素を追加しDOMオブジェクトを返す // @ちぇっくぼっくすさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (text, sys) {
      // チェックボックスは、<span><input><label></span>で成り立つように構築
      const span = document.createElement('span')
      const inp = document.createElement('input')
      inp.type = 'checkbox'
      inp.id = 'nadesi-dom-' + sys.__v0['DOM部品個数']
      sys.__v0['DOM部品個数']++
      const label = document.createElement('label')
      label.innerHTML = text
      label.htmlFor = inp.id
      span.appendChild(inp)
      span.appendChild(label)
      // 親部品に追加
      sys.__exec('DOM部品作成', [span, sys])
      return inp
    }
  },
  'セレクトボックス作成': { // @配列optionsの選択肢を持つselect要素を追加しDOMオブジェクトを返す // @せれくとぼっくすさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (options, sys) {
      const dom = document.createElement('select')
      for (let i = 0; i < options.length; i++) {
        const item = document.createElement('option')
        item.value = options[i]
        item.appendChild(document.createTextNode(options[i]))
        dom.appendChild(item)
      }
      // 親部品に追加
      const obj = sys.__exec('DOM部品作成', [dom, sys])
      return dom
    }
  },
  'DOMスキン設定': { // @「ボタン作成」「エディタ作成」などで適用するスキンを指定する(#1033) // @DOMすきんせってい
    type: 'func',
    josi: [['を', 'に', 'の']],
    pure: false,
    fn: function (skin, sys) {
      sys.__v0['DOMスキン'] = skin
    },
    return_none: true
  }
}
