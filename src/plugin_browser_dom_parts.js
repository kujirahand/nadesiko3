// @ts-nocheck
module.exports = {
  // @DOM部品操作
  'DOM親要素': { type: 'const', value: '' }, // @DOMおやようそ
  'DOM部品個数': { type: 'const', value: 0 }, // @DOMせいせいこすう
  'DOM部品オプション': { type: 'const', value: {'自動改行': false, 'テーブル背景色': ['#AA4040', '#ffffff','#fff0f0']} }, // @DOMぶひんおぷしょん
  'DOM親要素設定': { // @「ボタン作成」「エディタ作成」など『DOM部品作成』で追加する要素の親要素を指定(デフォルトはdocument)して要素を返す。 // @DOMおやようそせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: false,
    fn: function (el, sys) {
      if (typeof el === 'string') { el = document.querySelector(el) || document.getElementById(el) }
      sys.__v0['DOM親要素'] = el
      return el
    }
  },
  'DOM親部品設定': { // @ DOM部品作成でDOM要素を追加する親の対象を指定。『DOM親要素設定』と同じ。// @DOMおやぶひんせってい
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
      // オプションを適用
      const opt = sys.__v0['DOM部品オプション']
      if (opt['自動改行']) {
        parent.appendChild(document.createElement('br'));
      }
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
  '画像作成': { // @URLを指定してimg要素を追加しDOMオブジェクトを返す // @がぞうさくせい
    type: 'func',
    josi: [['の', 'から']],
    pure: false,
    fn: function (url, sys) {
      const img = sys.__exec('DOM部品作成', ['img', sys])
      img.src = url
      return img
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
  '色選択ボックス作成': { // @色選択ボックス(input[type='color'])を作成しDOMオブジェクトを返す // @いろせんたくぼっくすさくせい
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'color'
      return inp
    }
  },
  '日付選択ボックス作成': { // @日付選択ボックス(input[type='date'])を作成しDOMオブジェクトを返す // @ひづけせんたくぼっくすさくせい
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'date'
      return inp
    }
  },
  'パスワード入力エディタ作成': { // @パスワード入力エディタ(input[type='password'])を作成しDOMオブジェクトを返す // @ぱすわーどにゅうりょくさくせい
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'date'
      return inp
    }
  },
  '値指定バー作成': { // @範囲RANGE(配列で[最小,最大[,値]])を指定するバー(input[type='range'])を作成しDOMオブジェクトを返す // @ぱすわーどにゅうりょくさくせい
    type: 'func',
    josi: [['の','で']],
    pure: false,
    fn: function (range, sys) {
      if (!(range instanceof Array) || range.length < 2) {
        range = [0, 100, 50]
      }
      if (range.length <= 2) { // 3つ目を省略したとき
        range.push(Math.floor((range[1] - range[0]) / 2))
      }
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'range'
      inp.min = range[0]
      inp.max = range[1]
      inp.value = range[2]
      return inp
    }
  },
  '送信ボタン作成': { // @ラベルSの送信ボタン(input[type='submit'])を作成しDOMオブジェクトを返す // @そうしんぼたんさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (label, sys) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'submit'
      inp.value = label
      return inp
    }
  },
  'フォーム作成': { // @属性OBJ{method:"GET",action:"..."}の送信フォームを作成し、DOM親部品を変更し、DOMオブジェクトを返す // @ふぉーむさくせい
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (obj, sys) {
      const frm = sys.__exec('DOM部品作成', ['form', sys])
      for (let key in obj) {
        if (frm[key]) { frm[key] = obj[key] }
      }
      sys.__exec('DOM親要素設定', [frm, sys])
      return frm
    }
  },
  'テーブル作成': { // @二次元配列AA(あるいは文字列の簡易CSVデータ)からTABLE要素を作成し、DOMオブジェクトを返す // @てーぶるさくせい
    type: 'func',
    josi: [['の', 'から']],
    pure: false,
    fn: function (aa, sys) {
      if (typeof(aa) === 'string') {
        const rr = []
        const rows = aa.split('\n')
        for (let row of rows) {
          const r = row.split(',')
          rr.push(r)
        }
        aa = rr
      }
      const bgColor = JSON.parse(JSON.stringify(sys.__v0['DOM部品オプション']['テーブル背景色']))
      const bgHead = bgColor.shift()
      let rowNo = 0
      const table = sys.__exec('DOM部品作成', ['table', sys])
      for (let row of aa) {
        const tr = document.createElement('tr')
        tr.style.backgroundColor = (rowNo === 0) ? bgHead : bgColor[rowNo % 2]
        tr.style.color = (rowNo === 0) ? 'white' : 'black'
        for (let col of row) {
          col = '' + col
          const td = document.createElement((rowNo === 0) ? 'th' : 'td')
          td.innerHTML = col.replace(/\&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          if (col.match(/^\d+$/)) { // number?
            td.style.textAlign = 'right'
          }
          tr.appendChild(td)
        }
        table.appendChild(tr)
        rowNo++
      }
      sys.__exec('DOM親要素設定', [table, sys])
      return table
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
