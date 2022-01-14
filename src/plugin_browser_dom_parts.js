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
  'DOMスキン設定': { // @「ボタン作成」「エディタ作成」などで適用するスキンを指定する(#1033) // @DOMすきんせってい
    type: 'func',
    josi: [['を', 'に', 'の']],
    pure: false,
    fn: function (skin, sys) {
      sys.__v0['DOMスキン'] = skin
    },
    return_none: true
  },
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
  'パスワード入力エディタ作成': { // @パスワード入力エディタ(input[type='password'])を作成し初期値Sを設定し、DOMオブジェクトを返す // @ぱすわーどにゅうりょくさくせい
    type: 'func',
    josi: [['の','で']],
    pure: false,
    fn: function (s, sys) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'password'
      inp.value = s
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
  'フォーム作成': { // @属性OBJ{method:"GET",action:"..."}で項目一覧S「a=初期値{改行}b=初期値{改行}色=?c#fff0f0{改行}=?送信」を送信フォームを作成しDOMオブジェクトを返す // @ふぉーむさくせい
    type: 'func',
    josi: [['で','の'],['を']],
    pure: false,
    fn: function (obj, s, sys) {
      const frm = sys.__exec('DOM部品作成', ['form', sys])
      // 可能ならformにobjの値を移し替える
      if (obj instanceof Object) {
        for (let key in obj) {
          if (frm[key]) { frm[key] = obj[key] }
        }
      }
      // 入力項目をtableで作る
      const rows = s.split('\n')
      const table = document.createElement('table')
      for (let rowIndex in rows) {
        let row = '' + (rows[rowIndex])
        if (row === '') {continue}
        if (row.indexOf('=') < 0) { row += '=' }
        const cols = row.split('=')
        const key = cols[0]
        const val = cols[1]
        // key
        const th = document.createElement('th')
        th.innerHTML = sys.__tohtmlQ(key)
        // val
        const td = document.createElement('td')
        if (val.substring(0, 2) === '?(') {
          // select box
          const it = val.substring(2) + ')'
          const ita = it.split(')')
          const its = ita[0]
          const def = ita[1]
          const items = its.split('|')
          const select = document.createElement('select')
          select.name = key
          for (let it of items) {
            const option = document.createElement('option')
            option.value = it
            option.text = it
            select.appendChild(option)
          }
          const idx = items.indexOf(def)
          if (idx >= 0) { select.selectedIndex = idx }
          td.appendChild(select)
        } else {
          // input element
          const inp = document.createElement('input')
          td.appendChild(inp)
          inp.id = 'nako3form_' + key
          if (val === '?送信' || val === '?submit') {
            inp.type = 'submit'
            inp.value = val.substring(1)
            if (key != '') { inp.name = key }
          } else if (val.substring(0, 2) === '?c') {
            inp.type = 'color'
            inp.value = val.substring(2)
            inp.name = key
          } else {
            inp.type = 'text'
            inp.value = val
            inp.name = key
          }    
        }
        const tr = document.createElement('tr')
        tr.appendChild(th)
        tr.appendChild(td)
        table.appendChild(tr)
      }
      frm.appendChild(table)
      return frm
    }
  },
  'フォーム入力一括取得': { // @DOMのフォームを取得し、そのフォーム以下にある入力項目のnameとvalueを辞書形式で返す // @ふぉーむにゅうりょくいっかつしゅとく
    type: 'func',
    josi: [['の','から']],
    pure: true,
    fn: function (dom) {
      if (typeof(dom) === 'string') { dom = document.querySelector(dom) }
      const res = {}
      const getChildren = (pa) => {
        if (!pa || !pa.childNodes) {return}
        for (let i = 0; i < pa.childNodes.length; i++) {
          const el = pa.childNodes[i]
          if (!el.tagName) {return}
          const tag = el.tagName.toLowerCase()
          if (tag === 'input') {
            if (el.type === 'checkbox') {
              res[el.name] = el.checked ? el.value : ''
              continue
            }
            res[el.name] = el.value
            continue
          }
          else if (tag === 'textarea') {
            res[el.name] = el.value
          }
          else if (tag === 'select') {
            if (el.selectedIndex >= 0) {
              res[el.name] = el.options[el.selectedIndex].value
            } else {
              res[el.name] = ''
            }
          }
          getChildren(el)
        }
      }
      getChildren(dom)
      return res
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
        for (let row of rows) { rr.push(row.split(',')) }
        aa = rr
      }
      const bgColor = JSON.parse(JSON.stringify(sys.__v0['DOM部品オプション']['テーブル背景色']))
      for (let i = 0; i < 3; i++) {bgColor.push('')}
      const bgHead = bgColor.shift()
      const table = sys.__exec('DOM部品作成', ['table', sys])
      for (let rowNo in aa) {
        const row = aa[rowNo]
        const tr = document.createElement('tr')
        for (let col of row) {
          col = '' + col
          const td = document.createElement((rowNo == 0) ? 'th' : 'td')
          td.innerHTML = sys.__tohtml(col)
          // 色指定
          if (bgHead != '') {
            td.style.backgroundColor = (rowNo == 0) ? bgHead : bgColor[rowNo % 2]
            td.style.color = (rowNo == 0) ? 'white' : 'black'
          }
          if (col.match(/^\d+$/)) { // number?
            td.style.textAlign = 'right'
          }
          tr.appendChild(td)
        }
        table.appendChild(tr)
      }
      sys.__exec('DOM親要素設定', [table, sys])
      return table
    }
  }
}
