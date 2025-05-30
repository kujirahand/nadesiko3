/* eslint-disable @typescript-eslint/no-explicit-any */
import { NakoSystem } from '../core/src/plugin_api.mjs'
export default {
  // @DOM操作
  'DOCUMENT': { type: 'const', value: '' }, // @DOCUMENT
  'WINDOW': { type: 'const', value: '' }, // @WINDOW
  'NAVIGATOR': { type: 'const', value: '' }, // @NAVIGATOR
  'DOM要素ID取得': { // @DOMの要素をIDを指定して取得 // @DOMようそIDしゅとく
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (id: string, sys: any) {
      const dom = document.getElementById(id)
      sys.__addPropMethod(dom)
      return dom
    }
  },
  'DOM要素取得': { // @DOMの要素をクエリqで取得して返す // @DOMようそしゅとく
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (q: any, sys: any) {
      if (typeof q === 'string') {
        const dom = document.querySelector(q)
        sys.__addPropMethod(dom)
        return dom
      }
      return q
    }
  },
  'DOM要素全取得': { // @DOMの要素をクエリqで全部取得して返す // @DOMようそぜんしゅとく
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (q: any, sys: NakoSystem) {
      const domList = Array.from(document.querySelectorAll(q))
      if (!domList) { return [] }
      for (const dom of domList) {
        (sys as any).__addPropMethod(dom)
      }
      return domList
    }
  },
  'タグ一覧取得': { // @任意のタグの一覧を取得して返す // @たぐいちらんしゅとく
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (tag: any) {
      return Array.from(document.getElementsByTagName(tag))
    }
  },
  'DOM子要素取得': { // @DOMの要素PAの子要素をクエリqを指定して結果を一つ取得して返す // @DOMこようそしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (pa: any, q: any, sys: any) {
      pa = sys.__query(pa, 'DOM子要素取得', true)
      if (!pa.querySelector) {
        throw new Error('『DOM子要素取得』で親要素がDOMではありません。')
      }
      const dom = pa.querySelector(q)
      sys.__addPropMethod(dom)
      return dom
    }
  },
  'DOM子要素全取得': { // @DOMの要素PAの子要素をクエリqを指定して結果を複数取得して返す // @DOMこようそぜんしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (pa: any, q: any, sys: any) {
      pa = sys.__query(pa, 'DOM子要素全取得', true)
      if (!pa.querySelectorAll) {
        throw new Error('『DOM子要素全取得』で親要素がDOMではありません。')
      }
      const domList = Array.from(pa.querySelectorAll(q))
      if (!domList) { return [] }
      for (const dom of domList) {
        sys.__addPropMethod(dom)
      }
      return domList
    }
  },
  'DOMイベント設定': { // @DOMのEVENTになでしこ関数名funcStrのイベントを設定 // @DOMいべんとせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (dom: any, event: any, funcStr: any, sys: any) {
      dom = sys.__query(dom, 'DOMイベント設定', false)
      dom[event] = sys.__findVar(funcStr, null)
    },
    return_none: true
  },
  'DOMテキスト設定': { // @DOMにテキストを設定 // @DOMてきすとせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    pure: true,
    fn: function (dom: any, text: any, sys: any) {
      dom = sys.__query(dom, 'DOMテキスト設定', false)
      const tag = dom.tagName.toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA') { dom.value = text } else if (tag === 'SELECT') {
        for (let i = 0; i < dom.options.length; i++) {
          const v = dom.options[i].value
          if (String(v) === text) {
            dom.selectedIndex = i
            break
          }
        }
      } else { dom.innerHTML = text }
    },
    return_none: true
  },
  'DOMテキスト取得': { // @DOMのテキストを取得 // @DOMてきすとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (dom: any, sys: any) {
      dom = sys.__query(dom, 'DOMテキスト取得', true)
      if (!dom) { return '' }
      const tag = dom.tagName.toUpperCase()
      // input or textarea
      if (tag === 'INPUT' || tag === 'TEXTAREA') { return dom.value }
      // select
      if (tag === 'SELECT') {
        const idx = dom.selectedIndex
        if (idx < 0) { return null }
        return dom.options[idx].value
      }
      return dom.innerHTML
    }
  },
  'DOM_HTML設定': { // @DOMにHTML文字列を設定 // @DOM_HTMLせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    pure: true,
    fn: function (dom: any, text: any, sys: any) {
      dom = sys.__query(dom, 'DOM_HTML設定', false)
      dom.innerHTML = text
    },
    return_none: true
  },
  'DOM_HTML取得': { // @DOMのHTML文字列を取得 // @DOM_HTMLしゅとく
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (dom: any, sys: any) {
      dom = sys.__query(dom, 'DOM_HTML取得', true)
      if (!dom) { return '' }
      return dom.innerHTML
    }
  },
  'テキスト設定': { // @DOMのテキストにVを設定 // @てきすとせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    pure: true,
    fn: function (dom: any, v: any, sys: any) {
      return sys.__exec('DOMテキスト設定', [dom, v, sys])
    },
    return_none: true
  },
  'テキスト取得': { // @DOMのテキストを取得 // @てきすとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (dom: any, sys: any) {
      return sys.__exec('DOMテキスト取得', [dom, sys])
    }
  },
  'HTML設定': { // @DOMのHTMLにVを設定 // @HTMLせってい
    type: 'func',
    josi: [['に', 'の', 'へ'], ['を']],
    pure: true,
    fn: function (dom: any, v: any, sys: any) {
      return sys.__exec('DOM_HTML設定', [dom, v, sys])
    },
    return_none: true
  },
  'HTML取得': { // @DOMのテキストを取得 // @HTMLしゅとく
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (dom: any, sys: any) {
      return sys.__exec('DOM_HTML取得', [dom, sys])
    }
  },
  'DOM属性設定': { // @DOMの属性Sに値Vを設定(属性Sには『DOM和属性』も適用される) // @DOMぞくせいせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    uses: ['DOM和属性'],
    pure: true,
    fn: function (dom: any, s: any, v: any, sys: any) {
      dom = sys.__query(dom, 'DOM属性設定', false)
      const wa = sys.__getSysVar('DOM和属性')
      if (wa[s]) { s = wa[s] }
      // domのプロパティを確認して存在すればその値を設定する #1392
      if (s in dom) {
        dom[s] = v
      } else {
        dom.setAttribute(s, v)
      }
    },
    return_none: true
  },
  'DOM属性取得': { // @DOMの属性Sを取得(属性Sには『DOM和属性』も適用される) // @DOMぞくせいしゅとく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    uses: ['DOM和属性'],
    pure: true,
    fn: function (dom: any, s: any, sys: any) {
      dom = sys.__query(dom, 'DOM属性取得', true)
      if (!dom) { return '' }
      const wa = sys.__getSysVar('DOM和属性')
      if (wa[s]) { s = wa[s] }
      // domのプロパティを確認して存在すればその値を取得する #1392
      if (s in dom) {
        return dom[s]
      }
      return dom.getAttribute(s)
    }
  },
  'DOM和属性': { // 'const' // @DOMわぞくせい
    type: 'const',
    value: { // (ref) https://developer.mozilla.org/ja/docs/Web/API/Element
      '幅': 'width',
      '高さ': 'height',
      '高': 'height',
      '幅属性': 'width',
      '高属性': 'height',
      'タイプ': 'type',
      'データ': 'data',
      '名前': 'name',
      'ID': 'id',
      'クラス': 'className',
      '読取専用': 'readOnly', // エディタ・テキストエリア用 (#1822)
      '読み取り専用': 'readOnly',
      '無効化': 'disabled',
      '非表示': 'hidden',
      '値': 'value',
      'テキスト': 'innerText',
      'HTML': 'innerHTML',
      'ステップ': 'step',
      '最小値': 'min',
      '最大値': 'max',
      '必須項目': 'required',
      '選択状態': 'checked',
      '入力ヒント': 'placeholder',
      '文字幅': 'size',
      'スタイル': 'style',
      '行数': 'rows', // テキストエリア用
      '列数': 'cols', // テキストエリア用
      '自動入力': 'autocomplete', // 'on' or 'off'
      '自動フォーカス': 'autofocus',
      '最大文字数': 'maxlength',
      '最小文字数': 'minlength'
    }
  },
  'DOM和スタイル': { // 'const' // @DOMわすたいる
    type: 'const',
    value: {
      '幅': 'width',
      '高さ': 'height',
      '高': 'height',
      '背景色': 'background-color',
      '色': 'color',
      'マージン': 'margin',
      '余白': 'padding',
      '文字サイズ': 'font-size',
      '行揃え': 'text-align', // 送り仮名の省略により、うまくアクセスできない #1859
      '行揃': 'text-align',
      '上': 'top',
      '左': 'left',
      '右': 'right',
      '中央': 'center',
      'ボーダー': 'border',
      'ボックス表示': 'display',
      'なし': 'none',
      'ブロック': 'block',
      '表示位置': 'float',
      '重なり': 'z-index',
      '重': 'z-index',
      '読取専用': 'readOnly',
      '読み取り専用': 'readOnly',
      'readonly': 'readOnly'
    }
  },
  'DOMプロパティ情報': { // 'const' // @DOMぷろぱてぃじょうほう
    type: 'const',
    value: { // 「DOM和属性」(attribute)「DOM和スタイル」(style)「関数フック」(hook)のどれかを指定する (#1822)
      '幅': 'style',
      '高': 'style',
      '読取専用': 'attribute',
      '幅属性': 'attribute',
      '高属性': 'attribute',
      '有効': 'hook', // 「DOM有効設定」「DOM有効取得」を呼び出す
      '可視': 'hook', // 「DOM可視設定」「DOM可視取得」を呼び出す
      'ポケット': 'hook', // 「DOMポケット設定」「DOMポケット取得」を呼び出す
      'ヒント': 'hook', // 「DOMヒント設定」「DOMヒント取得」を呼び出す
      'テキスト': 'hook' // 「DOMテキスト設定」「DOMテキスト取得」を呼び出す
    }
  },
  'DOMスタイル設定': { // @DOMのスタイルAに値Bを設定 // @DOMすたいるせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    uses: ['DOM和スタイル'],
    pure: true,
    fn: function (dom: any, s: any, v: any, sys: any) {
      dom = sys.__query(dom, 'DOMスタイル設定', false)
      const wa = sys.__getSysVar('DOM和スタイル')
      if (wa[s] !== undefined) { s = wa[s] }
      if (wa[v] !== undefined) { v = wa[v] }
      dom.style[s] = v
    },
    return_none: true
  },
  'DOMスタイル一括設定': { // @DOMに(オブジェクト型で)スタイル情報を一括設定 // @DOMすたいるいっかつせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    uses: ['DOM和スタイル'],
    pure: true,
    fn: function (dom: any, values: any, sys: any) {
      if (typeof dom === 'string') {
        const domList = document.querySelectorAll(dom)
        if (domList === undefined || domList === null || domList.length === 0) {
          throw new Error(`『DOMスタイル一括設定』で『${dom}』が見つかりません。`)
        }
        dom = domList
      }
      if (dom instanceof window.HTMLElement) { dom = [dom] }
      const wa = sys.__getSysVar('DOM和スタイル')
      // 列挙したDOM一覧を全てスタイル変更する
      for (let i = 0; i < dom.length; i++) {
        const e = dom[i]
        sys.__addPropMethod(e)
        for (const key in values) {
          let s = key
          let v = values[key]
          if (wa[s] !== undefined) { s = wa[s] }
          if (wa[v] !== undefined) { v = wa[v] }
          e.style[s] = v
        }
      }
    },
    return_none: true
  },
  'DOMスタイル取得': { // @DOMのSTYLEの値を取得 // @DOMすたいるしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    uses: ['DOM和スタイル'],
    pure: true,
    fn: function (dom: any, style: any, sys: any) {
      dom = sys.__query(dom, 'DOMスタイル取得', true)
      if (!dom) { return '' }
      const wa = sys.__getSysVar('DOM和スタイル')
      if (wa[style]) { style = wa[style] }
      return dom.style[style]
    }
  },
  'DOMスタイル一括取得': { // @DOMのSTYLE(配列で複数指定)の値を取得 // @DOMすたいるいっかつしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    uses: ['DOM和スタイル'],
    pure: true,
    fn: function (dom: any, style: any, sys: any) {
      const res: any = {}
      dom = sys.__query(dom, 'DOMスタイル一括取得', true)
      if (!dom) { return res }
      if (style instanceof String) { style = [style] }

      const wa = sys.__getSysVar('DOM和スタイル')
      if (style instanceof Array) {
        style.forEach((key) => {
          if (wa[key]) { key = wa[key] }
          res[key] = dom.style[key]
        })
        return res
      }
      if (style instanceof Object) {
        for (let key in style) {
          if (wa[key]) { key = wa[key] }
          res[key] = dom.style[key]
        }
        return res
      }
      return dom.style[style]
    }
  },
  'データ属性取得': { // @DOMのdata-PROPの値を取得 // @でーたぞくせいしゅとく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    fn: function (dom: any, prop: any, sys: any) {
      dom = sys.__query(dom, 'データ属性取得', true)
      if (!dom) { return '' }
      return dom.dataset[prop] // dom.getAttribute('data-' + prop) と同じ
    }
  },
  'データ属性設定': { // @DOMのdata-PROPに値Vを設定 // @でーたぞくせいせってい
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom: any, prop: any, val: any, sys: any) {
      dom = sys.__query(dom, 'データ属性設定', true)
      if (!dom) { return '' }
      dom.dataset[prop] = val // dom.setAttribute('data-' + prop, val) と同じ
    },
    return_none: true
  },
  'DOM設定変更': { // @DOMの属性とスタイルPROP(配列で指定可能)を適当にVALUEに設定 // @DOMせっていへんこう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    fn: function (dom: any, prop: string|string[], value:any, sys: any) {
      dom = sys.__query(dom, 'DOM設定変更', false)
      const waStyle = sys.__getSysVar('DOM和スタイル')
      const waAttr = sys.__getSysVar('DOM和属性')
      const waPriority = sys.__getSysVar('DOMプロパティ情報')
      if (waStyle[value] !== undefined) { // 値がDOM和スタイルの場合
        value = waStyle[value]
      }
      // check prop is array --- 配列で指定された場合、曖昧ルールは適用しない
      if (prop instanceof Array) {
        for (let i = 0; i < prop.length; i++) {
          let propName = prop[i]
          if (waStyle[propName] !== undefined) { // DOM和スタイル
            propName = waStyle[propName]
          } else if (waAttr[propName] !== undefined) { // dom和スタイル
            propName = waAttr[propName]
            if (waAttr[value] !== undefined) { // 値がDOM和属性の場合
              value = waAttr[value]
            }
          }
          if (i < prop.length - 1) {
            dom = dom[propName]
          } else {
            dom[propName] = value
          }
        }
      } else {
        let propStr: string = prop
        // 優先ルールに従って適用する (#1822)
        if (waPriority[propStr] !== undefined) {
          const p = waPriority[propStr]
          if (p === 'style') {
            propStr = waStyle[propStr]
            dom.style[propStr] = value
            return
          } else if (p === 'attribute') {
            propStr = waAttr[propStr]
            if (waAttr[value] !== undefined) { // 値がDOM和属性の場合
              value = waAttr[value]
            }
            dom[propStr] = value
            return
          } else if (p === 'hook') { // フック関数を実行する (#1823)
            const hookName = `DOM${propStr}設定`
            sys.__exec(hookName, [dom, value, sys])
            return
          }
        }
        // 単位付きスタイルの優先ルール --- valueが単位付き数値ならスタイルに適用
        if (waStyle[propStr] !== undefined && (typeof value === 'string') && (value.match(/^[0-9.]+([a-z]{2,5})$/))) {
          // 例えば 3px や 6em などの値が指定されたらスタイルに対する適用
          propStr = waStyle[propStr]
          dom.style[propStr] = value
          // console.log('waStyle', prop, value)
          return
        }
        // check DOM和属性
        if (waAttr[propStr] !== undefined) {
          propStr = waAttr[propStr]
          if (waAttr[value] !== undefined) { // 値がDOM和属性の場合
            value = waAttr[value]
          }
          dom[propStr] = value
          return
        }
        // check DOM和スタイル
        if (waStyle[propStr] !== undefined) {
          propStr = waStyle[propStr]
          dom.style[propStr] = value
          return
        }
        // DOM和スタイルでなくてもよくある単位が指定されているなら直接スタイルに適用。(ただしDOM和属性に存在しないものに限る=判定後に適用)
        if (typeof value === 'string' && value.match(/^[0-9.]+(px|em|ex|rem|vw|vh)$/)) {
          dom.style[propStr] = value
          return
        }
        // others
        dom[propStr] = value
      }
    },
    return_none: true
  },
  'DOM設定取得': { // @DOMの属性とスタイルPROP(配列で指定可能)の値を適当に取得 // @DOMせっていしゅとく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    fn: function (dom: any, prop: string|string[], sys: any) {
      dom = sys.__query(dom, 'DOM設定取得', true)
      const waStyle = sys.__getSysVar('DOM和スタイル')
      const waAttr = sys.__getSysVar('DOM和属性')
      const waPriority = sys.__getSysVar('DOMプロパティ情報')
      // prop is array:
      if (prop instanceof Array) {
        for (let i = 0; i < prop.length; i++) {
          let propName = prop[i]
          if (waStyle[propName] !== undefined) { // DOM和スタイル
            propName = waStyle[propName]
          } else if (waAttr[propName] !== undefined) { // dom和属性
            propName = waAttr[propName]
          }
          if (i < prop.length - 1) {
            dom = dom[propName]
          } else {
            return dom[propName]
          }
        }
      } else {
        // prop is string:
        let propStr: string = prop
        // 優先ルールに従って適用する (#1822)
        if (waPriority[propStr] !== undefined) {
          const p = waPriority[propStr]
          if (p === 'style') {
            propStr = waStyle[propStr]
            return dom.style[propStr]
          } else if (p === 'attribute') {
            propStr = waAttr[propStr]
            return dom[propStr]
          } else if (p === 'hook') { // フック関数を実行する (#1823)
            const hookName = `DOM${propStr}取得`
            return sys.__exec(hookName, [dom, sys])
          }
        }
        // check DOM和属性
        if (waAttr[propStr] !== undefined) {
          propStr = waAttr[propStr]
          const val = dom[propStr]
          if (val !== undefined) { return val }
        }
        // check DOM和スタイル
        if (waStyle[propStr] !== undefined) {
          propStr = waStyle[propStr]
          const valStyle = dom.style[propStr]
          if (valStyle !== undefined) { return valStyle }
          const val = dom[propStr]
          if (val !== undefined) { return val }
        }
        // others
        return dom[propStr]
      }
    }
  },
  'DOM有効設定': { // @DOMのdata-有効の値を設定 // @DOMゆうこうせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (dom: any, value: string, sys: any) {
      dom = sys.__query(dom, 'DOM有効設定', true)
      if (!dom) { return '' }
      dom.dataset['有効'] = value
      dom.disabled = !(value)
    }
  },
  'DOM有効取得': { // @DOMのdata-有効の値を取得 // @DOMゆうこうしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom: any, sys: any) {
      dom = sys.__query(dom, 'DOM有効取得', true)
      if (!dom) { return '' }
      return dom.dataset['有効']
    }
  },
  'DOM可視設定': { // @DOMのdata-可視の値を設定 // @DOMかしせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (dom: any, value: string, sys: any) {
      dom = sys.__query(dom, 'DOM可視設定', true)
      if (!dom) { return '' }
      dom.dataset['可視'] = value
      dom.style.visibility = (value) ? 'visible' : 'hidden'
    }
  },
  'DOM可視取得': { // @DOMのdata-可視の値を取得 // @DOMかししゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom: any, sys: any) {
      dom = sys.__query(dom, 'DOM可視取得', true)
      if (!dom) { return '' }
      return dom.dataset['可視']
    }
  },
  'ポケット取得': { // @DOMのポケット(data-pocket属性)の値を取得(エンコードされるので辞書型や配列も取得できる) // @ぽけっとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom: any, sys: any) {
      dom = sys.__query(dom, 'ポケット取得', true)
      if (!dom) { return '' }
      try {
        return JSON.parse(dom.dataset.pocket)
      } catch (e) {
        console.log('[なでしこ] ポケット取得のJSONデータの不正:', e)
        return dom.dataset.pocket
      }
    }
  },
  'DOMポケット取得': { // @DOMのポケット(data-pocket属性)の値を取得(エンコードされるので辞書型や配列も取得できる) // @DOMぽけっとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom: any, sys: any) {
      return sys.__exec('ポケット取得', [dom, sys])
    }
  },
  'ポケット設定': { // @DOMのポケット(data-pocket属性)に値Vを設定(エンコードされるので辞書型や配列も設定できる) // @ぽけっとせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (dom: any, val: any, sys: any) {
      dom = sys.__query(dom, 'ポケット設定', true)
      if (!dom) { return '' }
      dom.dataset.pocket = JSON.stringify(val)
    },
    return_none: true
  },
  'DOMポケット設定': { // @DOMのポケット(data-pocket属性)に値Vを設定(エンコードされるので辞書型や配列も設定できる) // @DOMぽけっとせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (dom: any, val: any, sys: any) {
      return sys.__exec('ポケット設定', [dom, val, sys])
    },
    return_none: true
  },
  'ヒント取得': { // @DOMのヒント(title属性)の値を取得 // @ひんとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom: any, sys: any) {
      dom = sys.__query(dom, 'ヒント取得', true)
      if (!dom) { return '' }
      return dom.getAttribute('title')
    }
  },
  'DOMヒント取得': { // @DOMのヒント(title属性)の値を取得 // @ひんとしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (dom: any, sys: any) {
      return sys.__exec('ヒント取得', [dom, sys])
    }
  },
  'ヒント設定': { // @DOMのヒント(title属性)に値Vを設定 // @ひんとせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (dom: any, val: string, sys: any) {
      dom = sys.__query(dom, 'ヒント設定', true)
      if (!dom) { return '' }
      dom.setAttribute('title', val)
    },
    return_none: true
  },
  'DOMヒント設定': { // @DOMのヒント(title属性)に値Vを設定 // @ひんとせってい
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    fn: function (dom: any, val: string, sys: any) {
      return sys.__exec('ヒント設定', [dom, val, sys])
    },
    return_none: true
  },
  'DOM要素作成': { // @DOMにTAGの新規要素を作成 // @DOMようそさくせい
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (tag: any) {
      return document.createElement(tag)
    }
  },
  'DOM子要素追加': { // @DOMの要素PAの子へ要素ELを追加してPAを返す // @DOMこようそついか
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    pure: true,
    fn: function (pa: any, el: any, sys: any) {
      pa = sys.__query(pa, 'DOM子要素追加', false)
      el = sys.__query(el, 'DOM子要素追加', false)
      pa.appendChild(el)
    }
  },
  'DOM子要素削除': { // @DOMの要素PAの子から要素ELを削除してPAを返す // @DOMこようそさくじょ
    type: 'func',
    josi: [['から'], ['を']],
    pure: true,
    fn: function (pa: any, el: any, sys: any) {
      pa = sys.__query(pa, 'DOM子要素削除', false)
      el = sys.__query(el, 'DOM子要素削除', false)
      pa.removeChild(el)
    }
  },
  '注目': { // @要素DOMにフォーカスする(カーソルを移動する) // @ちゅうもく
    type: 'func',
    josi: [['を', 'へ', 'に']],
    pure: true,
    fn: function (dom: any, sys: any) {
      dom = sys.__query(dom, '注目', true)
      if (dom && dom.focus) { dom.focus() }
    },
    return_none: true
  }
}
