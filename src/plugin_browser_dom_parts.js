// @ts-nocheck
module.exports = {
  // @DOM部品操作
  DOM親要素: { type: 'const', value: '' }, // @DOMおやようそ
  DOM生成個数: { type: 'const', value: 0 }, // @DOMせいせいこすう
  DOM親要素設定: { // @「ボタン作成」「エディタ作成」などのDOM要素を追加する対象を指定(デフォルトはdocument)して親要素のDOMオブジェクトを返す // @DOMおやようそせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: false,
    fn: function (el, sys) {
      if (typeof el === 'string') { el = document.querySelector(el) || document.getElementById(el) }
      sys.__v0['DOM親要素'] = el
      return el
    }
  },
  DOMスキン: { type: 'const', value: '' }, // @DOMすきん
  DOMスキン辞書: { type: 'const', value: {} }, // @DOMすきんじしょ
  ボタン作成: { // @ラベルlabelを持つbutton要素を追加しDOMオブジェクトを返す // @ぼたんさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (label, sys) {
      const parent = sys.__v0['DOM親要素']
      const btn = document.createElement('button')
      btn.innerHTML = label
      btn.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      // スキン適用
      const func = sys.__v0['DOMスキン辞書'][sys.__v0['DOMスキン']]
      if (typeof (func) === 'function') { func('ボタン作成', btn, sys) }
      // DOM追加
      parent.appendChild(btn)
      sys.__v0['DOM生成個数']++
      return btn
    }
  },
  エディタ作成: { // @textの値を持つテキストボックス(input[type='text'])の要素を追加しDOMオブジェクトを返す // @えでぃたさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (text, sys) {
      const parent = sys.__v0['DOM親要素']
      const inp = document.createElement('input')
      inp.type = 'text'
      inp.value = text
      inp.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      // スキン適用
      const func = sys.__v0['DOMスキン辞書'][sys.__v0['DOMスキン']]
      if (typeof (func) === 'function') { func('エディタ作成', inp, sys) }
      // DOM追加
      parent.appendChild(inp)
      sys.__v0['DOM生成個数']++
      return inp
    }
  },
  テキストエリア作成: { // @textの値を持つtextarea要素を追加しDOMオブジェクトを返す // @てきすとえりあさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (text, sys) {
      const parent = sys.__v0['DOM親要素']
      const te = document.createElement('textarea')
      te.value = text
      te.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      // スキン適用
      const func = sys.__v0['DOMスキン辞書'][sys.__v0['DOMスキン']]
      if (typeof (func) === 'function') { func('テキストエリア作成', te, sys) }
      // DOM追加
      parent.appendChild(te)
      sys.__v0['DOM生成個数']++
      return te
    }
  },
  ラベル作成: { // @textの値を持つラベル(span要素)を追加しDOMオブジェクトを返す // @らべるさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (text, sys) {
      const parent = sys.__v0['DOM親要素']
      const te = document.createElement('span')
      te.innerHTML = text
      te.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      // スキン適用
      const func = sys.__v0['DOMスキン辞書'][sys.__v0['DOMスキン']]
      if (typeof (func) === 'function') { func('ラベル作成', te, sys) }
      // DOM追加
      parent.appendChild(te)
      sys.__v0['DOM生成個数']++
      return te
    }
  },
  改行作成: { // @改行(br要素)を追加しDOMオブジェクトを返す // @かいぎょうさくせい
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      const parent = sys.__v0['DOM親要素']
      const te = document.createElement('br')
      te.id = 'nadesi-dom-' + sys.__v0['DOM生成個数']
      // スキン適用
      const func = sys.__v0['DOMスキン辞書'][sys.__v0['DOMスキン']]
      if (typeof (func) === 'function') { func('改行作成', te, sys) }
      // DOM追加
      parent.appendChild(te)
      sys.__v0['DOM生成個数']++
      return te
    }
  },
  チェックボックス作成: { // @textのラベルを持つチェックボックス(input[type='checkbox'])要素を追加しDOMオブジェクトを返す // @ちぇっくぼっくすさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
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
      // スキン適用
      const func = sys.__v0['DOMスキン辞書'][sys.__v0['DOMスキン']]
      if (typeof (func) === 'function') { func('チェックボックス作成', span, sys) }
      // DOM追加
      parent.appendChild(span)
      sys.__v0['DOM生成個数']++
      return inp
    }
  },
  セレクトボックス作成: { // @配列optionsの選択肢を持つselect要素を追加しDOMオブジェクトを返す // @せれくとぼっくすさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
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
      // スキン適用
      const func = sys.__v0['DOMスキン辞書'][sys.__v0['DOMスキン']]
      if (typeof (func) === 'function') { func('セレクトボックス作成', dom, sys) }
      // DOM追加
      parent.appendChild(dom)
      return dom
    }
  },
  DOMスキン設定: { // @「ボタン作成」「エディタ作成」などで適用するスキンを指定する(#1033) // @DOMすきんせってい
    type: 'func',
    josi: [['を', 'に', 'の']],
    pure: false,
    fn: function (skin, sys) {
      sys.__v0['DOMスキン'] = skin
    },
    return_none: true
  }
}
