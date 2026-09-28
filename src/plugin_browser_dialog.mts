// @ts-nocheck
import { showDomDialog, canUseDomDialog, parseDialogChoices, convertAnswer } from './plugin_browser_dialog_dom.mjs'

// DOMダイアログを使うかどうか (#2548)
function useDomDialog (sys: any): boolean {
  if (sys.__getSysVar('ダイアログ方式') === 'ブラウザ') { return false }
  return canUseDomDialog(getDocument())
}
function getDocument (): any {
  return (typeof document === 'undefined') ? null : document
}
// ブラウザ標準のダイアログ(alert/prompt/confirm)を取得
function getWindow (): any {
  return (typeof window === 'undefined') ? {} : window
}
// 入力ボックスで文字列を尋ねる。キャンセル時はnullを返す
async function askText (s: any, sys: any): Promise<string | null> {
  if (useDomDialog(sys)) {
    const res = await showDomDialog(getDocument(), { label: String(s), input: '', buttons: ['OK', 'キャンセル'] })
    return (res.button === 'OK') ? res.input : null
  }
  const win = getWindow()
  const r = (typeof win.prompt === 'function') ? win.prompt(s) : null
  return (r === undefined) ? null : r
}

export default {
  // @ダイアログ
  'ダイアログ方式': { type: 'var', value: 'DOM' }, // @だいあろぐほうしき
  '言': { // @メッセージダイアログにSを表示 // @いう
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    asyncFn: true,
    fn: async function(s: any, sys: any) {
      if (useDomDialog(sys)) {
        await showDomDialog(getDocument(), { label: String(s), buttons: ['OK'] })
        return
      }
      const win = getWindow()
      if (typeof win.alert === 'function') { win.alert(s) }
    },
    return_none: true
  },
  'ダイアログキャンセル値': { type: 'var', value: '' }, // @だいあろぐきゃんせるち
  '尋': { // @メッセージSと入力ボックスを出して尋ねる // @たずねる
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    asyncFn: true,
    fn: async function(s: any, sys: any) {
      const r = await askText(s, sys)
      if (r === null) {
        return sys.__getSysVar('ダイアログキャンセル値')
      }
      return convertAnswer(r)
    }
  },
  '文字尋': { // @メッセージSと入力ボックスを出して尋ねる。返り値は常に入力されたままの文字列となる // @もじたずねる
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    asyncFn: true,
    fn: async function(s: any, sys: any) {
      const r = await askText(s, sys)
      if (r === null) {
        return sys.__getSysVar('ダイアログキャンセル値')
      }
      return r
    }
  },
  '二択': { // @メッセージSと[OK][キャンセル]のダイアログを出して尋ねる。戻り値はtrueかfalseのどちらかになる。 // @にたく
    type: 'func',
    josi: [['で', 'の', 'と', 'を']],
    pure: true,
    asyncFn: true,
    fn: async function(s: any, sys: any) {
      if (useDomDialog(sys)) {
        const res = await showDomDialog(getDocument(), { label: String(s), buttons: ['OK', 'キャンセル'] })
        return res.button === 'OK'
      }
      const win = getWindow()
      if (typeof win.confirm === 'function') { return win.confirm(s) }
      return false
    }
  },
  'ボタン選択': { // @候補リストSからボタンを選ばせて選んだ文字列を返す。要素0が「#」で始まればラベルとして表示。[x]で閉じると空文字列を返す // @ぼたんせんたく
    type: 'func',
    josi: [['の']],
    pure: true,
    asyncFn: true,
    fn: async function(items: any) {
      const doc = getDocument()
      if (!canUseDomDialog(doc)) { return '' }
      const { label, choices } = parseDialogChoices(items)
      const res = await showDomDialog(doc, { label, buttons: choices })
      return res.button === null ? '' : res.button
    }
  },
  'リスト選択': { // @候補リストSからリストで選ばせて選んだ文字列を返す。要素0が「#」で始まればラベルとして表示。[キャンセル]か[x]で閉じると空文字列を返す // @りすとせんたく
    type: 'func',
    josi: [['の']],
    pure: true,
    asyncFn: true,
    fn: async function(items: any) {
      const doc = getDocument()
      if (!canUseDomDialog(doc)) { return '' }
      const { label, choices } = parseDialogChoices(items)
      const res = await showDomDialog(doc, { label, list: choices, buttons: ['OK', 'キャンセル'] })
      return (res.button === 'OK' && res.list !== undefined) ? res.list : ''
    }
  },
  'カスタムダイアログ表示': { // @信頼できるHTML文字列Sと、ボタン一覧Bでダイアログを表示し、押したボタンのラベルを返す。[x]で閉じると空文字列を返す // @かすたむだいあろぐひょうじ
    type: 'func',
    josi: [['で'], ['を', 'の']],
    pure: true,
    asyncFn: true,
    fn: async function(html: any, buttons: any) {
      const doc = getDocument()
      if (!canUseDomDialog(doc)) { return '' }
      const list = Array.isArray(buttons) ? buttons.map(v => String(v)) : [String(buttons)]
      const res = await showDomDialog(doc, { html: String(html), buttons: list })
      return res.button === null ? '' : res.button
    }
  }
}
