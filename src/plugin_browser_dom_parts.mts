/* eslint-disable @typescript-eslint/no-explicit-any */
export default {
  // @DOM部品操作
  'DOM親要素': { type: 'const', value: '' }, // @DOMおやようそ
  'DOM部品個数': { type: 'const', value: 0 }, // @DOMせいせいこすう
  'DOM部品オプション': { type: 'const', value: { '自動改行': false, 'テーブルヘッダ': true, 'テーブル背景色': ['#AA4040', '#ffffff', '#fff0f0'], 'テーブル数値右寄せ': true } }, // @DOMぶひんおぷしょん
  'DOM親要素設定': { // @「ボタン作成」「エディタ作成」など『DOM部品作成』で追加する要素の親要素を指定(デフォルトはdocument)して要素を返す。 // @DOMおやようそせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (el: any, sys: any) {
      if (typeof el === 'string') { el = document.querySelector(el) || document.getElementById(el) }
      sys.__setSysVar('DOM親要素', el)
      sys.__addPropMethod(el)
      return el
    }
  },
  'DOM親部品設定': { // @ DOM部品作成でDOM要素を追加する親の対象を指定。『DOM親要素設定』と同じ。// @DOMおやぶひんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (el: any, sys: any) {
      return sys.__exec('DOM親要素設定', [el, sys])
    }
  },
  'DOMスキン': { type: 'const', value: '' }, // @DOMすきん
  'DOMスキン辞書': { type: 'const', value: {} }, // @DOMすきんじしょ
  'DOMスキン設定': { // @「ボタン作成」「エディタ作成」などで適用するスキンを指定する(#1033) // @DOMすきんせってい
    type: 'func',
    josi: [['を', 'に', 'の']],
    pure: true,
    fn: function (skin: any, sys: any) {
      sys.__setSysVar('DOMスキン', skin)
    },
    
    return_none: true
  },
  'DOM部品作成': { // @elmの要素を作成して『DOM親要素設定』で指定した要素に追加して、DOMオブジェクトを返す。(elmがDOM要素なら追加する) // @DOMぶひんさくせい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (elm: any, sys: any) {
      const parent = sys.__getSysVar('DOM親要素')
      const btn = (typeof (elm) === 'string') ? document.createElement(elm) : elm
      btn.id = 'nadesi-dom-' + sys.__getSysVar('DOM部品個数')
      sys.__addPropMethod(btn)
      // スキン適用
      const func = sys.__getSysVar('DOMスキン辞書')[sys.__getSysVar('DOMスキン')]
      if (typeof (func) === 'function') { func(elm, btn, sys) }
      // DOM追加
      parent.appendChild(btn)
      sys.__setSysVar('DOM部品個数', sys.__getSysVar('DOM部品個数', 0) + 1)
      // オプションを適用
      const opt = sys.__getSysVar('DOM部品オプション')
      if (opt['自動改行']) {
        parent.appendChild(document.createElement('br'))
      }
      // 「その」を設定
      sys.__setSysVar('そ', btn)
      return btn
    }
  },
  'DOM部品削除': { // @elmの要素を削除する // @DOMぶひんさくじょ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (elm: any) {
      if (typeof elm === 'string') { elm = document.querySelector(elm) }
      if (elm) { elm.parentNode.removeChild(elm) }
    },
    return_none: true
  },
  'ボタン作成': { // @ラベルlabelを持つbutton要素を追加しDOMオブジェクトを返す // @ぼたんさくせい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (label: any, sys: any) {
      const btn = sys.__exec('DOM部品作成', ['button', sys])
      btn.innerHTML = label
      return btn
    }
  },
  'エディタ作成': { // @textの値を持つテキストボックス(input[type='text'])の要素を追加しDOMオブジェクトを返す // @えでぃたさくせい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (text: any, sys: any) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'text'
      inp.value = text
      return inp
    }
  },
  'テキストエリア作成': { // @textの値を持つtextarea要素を追加しDOMオブジェクトを返す // @てきすとえりあさくせい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (text: any, sys: any) {
      const te = sys.__exec('DOM部品作成', ['textarea', sys])
      te.value = text
      return te
    }
  },
  'ラベル作成': { // @textの値を持つラベル(span要素)を追加しDOMオブジェクトを返す // @らべるさくせい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (text: any, sys: any) {
      const lbl = sys.__exec('DOM部品作成', ['span', sys])
      lbl.innerHTML = text
      return lbl
    }
  },
  'キャンバス作成': { // @大きさ[幅, 高]のcanvas要素を追加しDOMオブジェクトを返す // @きゃんばすさくせい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (size: any, sys: any) {
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
    pure: true,
    fn: function (url: any, sys: any) {
      const img = sys.__exec('DOM部品作成', ['img', sys])
      img.src = url
      return img
    }
  },
  '改行作成': { // @改行(br要素)を追加しDOMオブジェクトを返す // @かいぎょうさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
      const br = sys.__exec('DOM部品作成', ['br', sys])
      return br
    }
  },
  'チェックボックス作成': { // @textのラベルを持つチェックボックス(input[type='checkbox'])要素を追加しDOMオブジェクトを返す // @ちぇっくぼっくすさくせい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (text: any, sys: any) {
      // チェックボックスは、<span><input><label></span>で成り立つように構築
      const span = document.createElement('span')
      const inp = document.createElement('input')
      inp.type = 'checkbox'
      inp.id = 'nadesi-dom-' + sys.__getSysVar('DOM部品個数', 0)
      sys.__setSysVar('DOM部品個数', sys.__getSysVar('DOM部品個数', 0) + 1)
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
    pure: true,
    fn: function (options: any, sys: any) {
      const dom = document.createElement('select')
      for (let i = 0; i < options.length; i++) {
        const item = document.createElement('option')
        item.value = options[i]
        item.appendChild(document.createTextNode(options[i]))
        dom.appendChild(item)
      }
      // 親部品に追加
      sys.__exec('DOM部品作成', [dom, sys])
      return dom
    }
  },
  'セレクトボックスアイテム設定': { // @配列データをセレクトボックスdomのアイテムに差し替える // @せれくとぼっくすあいてむせってい
    type: 'func',
    josi: [['を'], ['へ', 'に']],
    pure: true,
    fn: function (options: any, dom: any) {
      if (typeof dom === 'string') { dom = document.querySelector(dom) }
      // 既存のoptionsをクリア
      dom.options.length = 0
      // アイテムを追加
      for (let i = 0; i < options.length; i++) {
        const item = document.createElement('option')
        item.value = options[i]
        item.appendChild(document.createTextNode(options[i]))
        dom.appendChild(item)
      }
    },
    return_none: true
  },
  '色選択ボックス作成': { // @色選択ボックス(input[type='color'])を作成しDOMオブジェクトを返す // @いろせんたくぼっくすさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'color'
      return inp
    }
  },
  '日付選択ボックス作成': { // @日付選択ボックス(input[type='date'])を作成しDOMオブジェクトを返す // @ひづけせんたくぼっくすさくせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'date'
      return inp
    }
  },
  'パスワード入力エディタ作成': { // @パスワード入力エディタ(input[type='password'])を作成し初期値Sを設定し、DOMオブジェクトを返す // @ぱすわーどにゅうりょくさくせい
    type: 'func',
    josi: [['の', 'で']],
    pure: true,
    fn: function (s: any, sys: any) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'password'
      inp.value = s
      return inp
    }
  },
  '値指定バー作成': { // @範囲RANGE(配列で[最小,最大[,値]])を指定するバー(input[type='range'])を作成しDOMオブジェクトを返す // @ぱすわーどにゅうりょくさくせい
    type: 'func',
    josi: [['の', 'で']],
    pure: true,
    fn: function (range: any, sys: any) {
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
    pure: true,
    fn: function (label: any, sys: any) {
      const inp = sys.__exec('DOM部品作成', ['input', sys])
      inp.type = 'submit'
      inp.value = label
      return inp
    }
  },
  'フォーム作成': { // @属性OBJ{method:"GET",action:"..."}で項目一覧S「項目1=初期値1{改行}項目2=初期値2{改行}…」を送信フォームを作成しDOMオブジェクトを返す。「=?」でオプションの指定が可能 // @ふぉーむさくせい
    type: 'func',
    josi: [['で', 'の'], ['を']],
    pure: true,
    fn: function (obj: any, s: string|Array<string>|Array<Array<string>>, sys: any) {
      const frm = sys.__exec('DOM部品作成', ['form', sys])
      // 可能ならformにobjの値を移し替える
      if (obj instanceof Object) {
        for (const key in obj) {
          if (frm[key]) { frm[key] = obj[key] }
        }
      }
      // 入力項目をtableで作る
      const table = document.createElement('table')
      // 入力項目がstringの場合、改行で分割
      let rows: Array<string>|Array<Array<string>>
      if (typeof s === 'string') {
        rows = s.split('\n')
      } else {
        rows = s
      }
      // 入力項目に合わせて行を追加
      for (const rowIndex in rows) {
        const row: Array<string>|string = rows[rowIndex]
        let cols: Array<string>
        if (typeof row === 'string') {
          cols = row.split('=')
        } else {
          cols = row
        }
        while (cols.length < 4) { cols.push('') }
        const key = cols[0]
        const val = cols[1]
        const opt1 = cols[2]
        const opt2 = cols[3]
        let isHidden = false
        if (key === '' && val === '') { continue } // 空行は無視
        // key
        const th = document.createElement('th')
        const lbl = document.createElement('label')
        lbl.innerHTML = sys.__tohtmlQ(key)
        th.appendChild(lbl)
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
          for (const it of items) {
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
          const lbl2 = document.createElement('label')
          td.appendChild(lbl2)
          inp.id = 'nako3form_' + key
          lbl.htmlFor = inp.id
          // check type v3.6.37
          if (val === '?text') {
            inp.type = 'text'
            inp.value = opt1
            inp.placeholder = opt2
            inp.name = key
          }
          else if (val === '?password') {
            inp.type = 'password'
            inp.value = opt1
            inp.placeholder = opt2
            inp.name = key
          }
          else if (val === '?number') {
            inp.type = 'number'
            inp.value = opt1
            inp.placeholder = opt2
            inp.name = key
          }
          else if (val === '?email') {
            inp.type = 'email'
            inp.value = opt1
            inp.placeholder = opt2
            inp.name = key
          }
          else if (val === '?tel') {
            inp.type = 'tel'
            inp.value = opt1
            inp.placeholder = opt2
            inp.name = key
          }
          else if (val === '?file') {
            inp.type = 'file'
            inp.name = key
          }
          else if (val === '?date') {
            inp.type = 'date'
            inp.value = opt1.replace(/\//g, '-')
            inp.name = key
          }
          else if (val === '?month') {
            inp.type = 'month'
            inp.value = opt1.replace(/\//g, '-')
            inp.name = key
          }
          else if (val === '?time') {
            inp.type = 'time'
            inp.value = opt1
            inp.name = key
          }
          else if (val === '?color') {
            inp.type = 'color'
            inp.value = opt1
            inp.name = key
          }
          else if (val === '?hidden') {
            inp.type = 'hidden'
            inp.value = opt1
            inp.name = key
            isHidden = true
            frm.appendChild(inp)
          }
          else if (val === '?checkbox') {
            inp.type = 'checkbox'
            inp.value = opt1
            inp.name = key
            lbl2.innerHTML = ' ' + sys.__tohtmlQ(opt2)
            lbl2.htmlFor = inp.id
          }
          // v3.2.33での拡張
          else if (val === '?送信' || val === '?submit') {
            inp.type = 'submit'
            inp.value = val.substring(1)
            if (key !== '') { inp.name = key }
          }
          else if (val.substring(0, 3) === '?c#') {
            inp.type = 'color'
            inp.value = val.substring(2)
            inp.name = key
          } else {
            inp.type = 'text'
            inp.value = val
            inp.name = key
          }
        }
        if (isHidden) { continue }
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
    josi: [['の', 'から']],
    pure: true,
    fn: function (dom: any) {
      if (typeof (dom) === 'string') { dom = document.querySelector(dom) }
      const res: any = {}
      const getChildren = (pa: any) => {
        if (!pa || !pa.childNodes) { return }
        for (let i = 0; i < pa.childNodes.length; i++) {
          const el = pa.childNodes[i]
          if (!el.tagName) { return }
          const tag = el.tagName.toLowerCase()
          if (tag === 'input') {
            if (el.type === 'checkbox') {
              res[el.name] = el.checked ? el.value : ''
              continue
            }
            res[el.name] = el.value
            continue
          } else if (tag === 'textarea') {
            res[el.name] = el.value
          } else if (tag === 'select') {
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
    pure: true,
    fn: function (aa: any, sys: any) {
      const table = sys.__exec('DOM部品作成', ['table', sys])
      return sys.__exec('テーブル更新', [table, aa, sys])
    }
  },
  'ヘッダ無テーブル作成': { // @二次元配列AA(あるいは文字列の簡易CSVデータ)からヘッダ無しのTABLE要素を作成し、DOMオブジェクトを返す // @へっだなしてーぶるさくせい
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (aa: any, sys: any) {
      const domOption = sys.__getSysVar('DOM部品オプション')
      domOption['テーブルヘッダ'] = false
      return sys.__exec('テーブル作成', [aa, sys])
    }
  },
  'テーブル更新': { // @既に作成したテーブルTBLを二次元配列AA(あるいは文字列の簡易CSVデータ)で更新する // @てーぶるこうしん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    pure: true,
    fn: function (tbl: any, aa: any, sys: any) {
      // 既存のテーブルを取得
      if (typeof tbl === 'string') {
        tbl = sys.__query(tbl, 'テーブル更新', false);
      }
      tbl.innerHTML = ''; // 初期化
      // テーブルに差し込むデータを確認
      if (typeof aa === 'string') {
        const rr = [];
        const rows = aa.split('\n');
        for (const row of rows) {
          rr.push(row.split(","));
        }
        aa = rr;
      }
      const domOption = sys.__getSysVar("DOM部品オプション");
      const bgColor: Array<string> = JSON.parse(
        JSON.stringify(domOption["テーブル背景色"]),
      ); // 複製して使う
      const hasHeader: boolean = domOption["テーブルヘッダ"];
      const isNumRight: boolean = domOption["テーブル数値右寄せ"];
      for (let i = 0; i < 3; i++) {
        bgColor.push("");
      }
      const bgHead = bgColor.shift() || "";
      const table = tbl
      for (let i = 0; i < aa.length; i++) {
        const rowNo = i;
        const row = aa[rowNo];
        const tr = document.createElement("tr");
        // 色指定
        if (bgHead !== "") {
          const no = hasHeader ? rowNo : rowNo + 1;
          tr.style.backgroundColor = no === 0 ? bgHead : bgColor[no % 2];
          tr.style.color = no === 0 ? "white" : "black";
        }
        for (let col of row) {
          col = "" + col;
          const td = document.createElement(
            rowNo === 0 && hasHeader ? "th" : "td",
          );
          td.innerHTML = sys.__tohtml(col);
          if (isNumRight && col.match(/^(\+|-)?\d+(\.\d+)?$/)) {
            // number?
            td.style.textAlign = "right";
          }
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      return table;
    },
  },
  'テーブルセル変更': { // @TABLE要素のセル[行,列]をVへ変更する。Vが二次元配列変数であれば複数のセルを一括変更する // @てーぶるせるへんこう
    type: 'func',
    josi: [['の'], ['を'], ['に', 'へ']],
    pure: true,
    fn: function (t: any, cell: any, v: string|Array<Array<string>>, sys: any) {
      if (typeof (t) === 'string') { t = document.querySelector(t) }
      if (typeof (cell) === 'string') { cell = cell.split(',') }
      if (cell.length !== 2) {
        throw new Error('『テーブルセル変更』の引数「を」は[行,列]の形式で指定してください。')
      }
      const row = cell[0]
      const col = cell[1]
      if (!(v instanceof Array)) {
        v = [[v]]
      }
      // オプションを取得
      const domOption = sys.__getSysVar('DOM部品オプション')
      const bgColor = JSON.parse(JSON.stringify(domOption['テーブル背景色'])) // 複製して使う
      const isNumRight: boolean = domOption['テーブル数値右寄せ']
      while (bgColor.length < 3) { // オプションが壊れていた時のための補完
        bgColor.push("white")
      }
      // 複数の範囲を一気に変更
      for (let y = 0; y < v.length; y++) {
        const vRow = v[y]
        for (let x = 0; x < vRow.length; x++) {
          const yy = row + y
          let domTR = t.childNodes[yy]
          while (!domTR) {
            const newTR = document.createElement('tr')
            t.appendChild(newTR)
            domTR = t.childNodes[yy]
            domTR.style.backgroundColor = bgColor[yy % 2 + 1]
          }
          let td = domTR.childNodes[col + x]
          while (!td) {
            const newTD = document.createElement('td')
            domTR.appendChild(newTD)
            td = domTR.childNodes[col + x]
          }
          const v = String(vRow[x])
          td.innerHTML = sys.__tohtml(v)
          if (isNumRight && v.match(/^(\+|-)?\d+(\.\d+)?$/)) { // number?
            td.style.textAlign = 'right'
          }
        }
      }
    },
    return_none: true
  },
  'マーメイド作成': { // @ Mermaid記法を使ってSRCのチャートを作成する // @ まーめいどさくせい
    type: 'func',
    josi: [['の']],
    pure: true,
    asyncFn: true,
    fn: async function (src: string, sys: any) {
      const div = sys.__exec('DOM部品作成', ['div', sys])
      div.classList.add('mermaid')
      div.innerHTML = src
      // ライブラリを読み込む
      const win = sys.__getSysVar('WINDOW')
      if (typeof win.mermaid === 'undefined') {
        console.log('try to load mermaid')
        await sys.__loadScript('https://cdn.jsdelivr.net/npm/mermaid@10.5.0/dist/mermaid.min.js')
        console.log('mermaid.jsを読み込みました')
      }
      await win.mermaid.run()
      return div
    }
  }
}
