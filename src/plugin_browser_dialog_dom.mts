/**
 * @fileOverview ブラウザ用のDOMダイアログ (#2548)
 * 「言」「尋」「二択」「ボタン選択」「リスト選択」「カスタムダイアログ表示」で使う
 */

/** ダイアログの表示オプション */
export interface NakoDialogOptions {
  /** 上部に表示するラベル(テキスト) */
  label?: string
  /** 本文(信頼できるHTML) */
  html?: string
  /** 入力ボックスを表示する場合、その初期値 */
  input?: string
  /** リストの候補 */
  list?: string[]
  /** 並べるボタンのラベル */
  buttons: string[]
  /** Enterキーや既定で選択されるボタンの番号 */
  defaultButton?: number
}

/** ダイアログの結果 */
export interface NakoDialogResult {
  /** 押されたボタンのラベル。[x]やEscで閉じた時はnull */
  button: string | null
  /** 入力ボックスの値 */
  input?: string
  /** リストで選択中の値 */
  list?: string
}

const STYLE_ID = 'nako3dialog-style'
const STYLE_TEXT = `
.nako3dialog:not(:where(.nako3dialog-skinned)), :where(.nako3dialog-skinned) {
  box-sizing: border-box; min-width: 280px; max-width: min(90vw, 560px);
  padding: 20px 20px 16px; border: 1px solid #ccc; border-radius: 8px;
  background: #fff; color: #222; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.5;
}
.nako3dialog:not(:where(.nako3dialog-skinned))::backdrop, :where(.nako3dialog-skinned)::backdrop { background: rgba(0,0,0,0.35); }
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-close, :where(.nako3dialog-skinned .nako3dialog-close) {
  position: absolute; top: 4px; right: 6px; width: 28px; height: 28px; padding: 0;
  border: none; background: transparent; color: #666; font-size: 20px; line-height: 28px; cursor: pointer;
}
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-close:hover, :where(.nako3dialog-skinned .nako3dialog-close:hover) { color: #000; }
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-label, :where(.nako3dialog-skinned .nako3dialog-label) { margin: 0 24px 12px 0; white-space: pre-wrap; word-break: break-word; }
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-body, :where(.nako3dialog-skinned .nako3dialog-body) { margin: 0 24px 12px 0; overflow: auto; max-height: 60vh; }
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-input, :where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-list, :where(.nako3dialog-skinned .nako3dialog-input), :where(.nako3dialog-skinned .nako3dialog-list) {
  box-sizing: border-box; width: 100%; margin: 0 0 12px; padding: 6px;
  border: 1px solid #aaa; border-radius: 4px; font-size: 15px;
}
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-buttons, :where(.nako3dialog-skinned .nako3dialog-buttons) { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-button, :where(.nako3dialog-skinned .nako3dialog-button) {
  min-width: 80px; padding: 6px 16px; border: 1px solid #999; border-radius: 4px;
  background: #f4f4f4; color: #222; font-size: 15px; cursor: pointer;
}
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-button:hover, :where(.nako3dialog-skinned .nako3dialog-button:hover) { background: #e8e8e8; }
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-button-primary, :where(.nako3dialog-skinned .nako3dialog-button-primary) { border-color: #2563eb; background: #2563eb; color: #fff; }
:where(.nako3dialog:not(.nako3dialog-skinned)) .nako3dialog-button-primary:hover, :where(.nako3dialog-skinned .nako3dialog-button-primary:hover) { background: #1d4ed8; }
`

/** 候補リストの要素0が「#」で始まる場合、それをラベルとして分離する */
export function parseDialogChoices (items: unknown): { label: string, choices: string[] } {
  const a = Array.isArray(items) ? items.map(v => String(v)) : [String(items)]
  if (a.length > 0 && a[0].startsWith('#')) {
    return { label: a[0].substring(1).trim(), choices: a.slice(1) }
  }
  return { label: '', choices: a }
}

/** 「尋」の入力値を、数値に見えるなら数値に変換する(全角数字も対応) */
export function convertAnswer (r: string): string | number {
  if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(r)) {
    return parseFloat(r)
  }
  if (/^[-+－＋]?[0-9０-９]+([.．][0-9０-９]+)?$/.test(r)) {
    return parseFloat(r.replace(/[－＋０-９．]/g, c => {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    }))
  }
  return r
}

/** DOMダイアログが使える環境か */
export function canUseDomDialog (doc: any): boolean {
  return !!(doc && typeof doc.createElement === 'function' && doc.body && typeof doc.body.appendChild === 'function')
}

/** スタイルを一度だけ追加する */
function installStyle (doc: any): void {
  if (typeof doc.getElementById === 'function' && doc.getElementById(STYLE_ID)) { return }
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = STYLE_TEXT
  const parent = doc.head || doc.body
  parent.appendChild(style)
}

/** 表示中のダイアログを破棄する関数の一覧(実行環境ごとに管理する) */
export type NakoDialogRegistry = Set<() => void>
export type NakoDialogSkin = (type: string, element: any) => void

/** 表示中のダイアログをすべて破棄する。待機中の命令は再開しない(再実行時に前回の続きが動かないように) */
export function abortAllDomDialogs (registry: NakoDialogRegistry | undefined): void {
  if (!registry) { return }
  for (const abort of Array.from(registry)) { abort() }
  registry.clear()
}

/**
 * DOMダイアログを表示して、ユーザーが操作するまで待機する
 * @param registry 指定すると、表示中のダイアログを登録し、abortAllDomDialogsで破棄できるようにする
 */
export function showDomDialog (doc: any, opt: NakoDialogOptions, registry?: NakoDialogRegistry, skin?: NakoDialogSkin): Promise<NakoDialogResult> {
  return new Promise((resolve) => {
    installStyle(doc)
    // 既存のスキン関数がclassNameを置き換えても、操作に必要な標準クラスを残す
    const applySkin = (type: string, element: any) => {
      if (!skin) { return }
      const baseClasses = String(element.className || '').split(/\s+/).filter(Boolean)
      skin(type, element)
      const classes = new Set([...String(element.className || '').split(/\s+/).filter(Boolean), ...baseClasses])
      element.className = [...classes].join(' ')
    }
    const dlg = doc.createElement('dialog')
    dlg.className = 'nako3dialog' + (skin ? ' nako3dialog-skinned' : '')
    dlg.setAttribute('aria-modal', 'true')
    applySkin('dialog', dlg)

    let input: any = null
    let list: any = null
    let finished = false
    // ダイアログを閉じてDOMから取り除く
    const dispose = () => {
      finished = true
      if (registry) { registry.delete(abort) }
      if (dlg.open && typeof dlg.close === 'function') { dlg.close() }
      if (dlg.parentNode) { dlg.parentNode.removeChild(dlg) }
    }
    // 結果を返さずに破棄する(「!クリア」用)
    const abort = () => {
      if (finished) { return }
      dispose()
    }
    const finish = (button: string | null) => {
      if (finished) { return }
      const result: NakoDialogResult = { button }
      if (input) { result.input = String(input.value) }
      if (list) { result.list = String(list.value) }
      dispose()
      resolve(result)
    }
    if (registry) { registry.add(abort) }
    const defaultIndex = opt.defaultButton ?? 0
    const pushDefault = () => {
      finish(opt.buttons.length > defaultIndex ? opt.buttons[defaultIndex] : null)
    }

    // 右上の[x]ボタン
    const closeBtn = doc.createElement('button')
    closeBtn.className = 'nako3dialog-close'
    closeBtn.setAttribute('type', 'button')
    closeBtn.setAttribute('aria-label', '閉じる')
    closeBtn.textContent = '×'
    closeBtn.addEventListener('click', () => finish(null))
    applySkin('button', closeBtn)
    dlg.appendChild(closeBtn)

    // ラベル
    if (opt.label) {
      const label = doc.createElement('div')
      label.className = 'nako3dialog-label'
      label.textContent = opt.label
      applySkin('div', label)
      dlg.appendChild(label)
    }
    // 本文(HTML)
    if (opt.html !== undefined) {
      const body = doc.createElement('div')
      body.className = 'nako3dialog-body'
      body.innerHTML = opt.html
      applySkin('div', body)
      dlg.appendChild(body)
    }
    // 入力ボックス
    if (opt.input !== undefined) {
      input = doc.createElement('input')
      input.className = 'nako3dialog-input'
      input.setAttribute('type', 'text')
      input.value = opt.input
      input.addEventListener('keydown', (e: any) => {
        if (e.key === 'Enter' && !e.isComposing) {
          e.preventDefault()
          pushDefault()
        }
      })
      applySkin('input', input)
      dlg.appendChild(input)
    }
    // リスト
    if (opt.list !== undefined) {
      list = doc.createElement('select')
      list.className = 'nako3dialog-list'
      list.setAttribute('size', String(Math.max(2, Math.min(opt.list.length, 10))))
      for (const item of opt.list) {
        const o = doc.createElement('option')
        o.value = item
        o.textContent = item
        applySkin('option', o)
        list.appendChild(o)
      }
      if (opt.list.length > 0) { list.value = opt.list[0] }
      list.addEventListener('dblclick', () => pushDefault())
      list.addEventListener('keydown', (e: any) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          pushDefault()
        }
      })
      applySkin('select', list)
      dlg.appendChild(list)
    }
    // ボタン
    const buttonBox = doc.createElement('div')
    buttonBox.className = 'nako3dialog-buttons'
    const buttons: any[] = []
    opt.buttons.forEach((caption, i) => {
      const b = doc.createElement('button')
      b.className = 'nako3dialog-button' + (i === defaultIndex ? ' nako3dialog-button-primary' : '')
      b.setAttribute('type', 'button')
      b.textContent = caption
      b.addEventListener('click', () => finish(caption))
      applySkin('button', b)
      buttonBox.appendChild(b)
      buttons.push(b)
    })
    applySkin('div', buttonBox)
    dlg.appendChild(buttonBox)

    // Escキーで閉じた場合は[x]と同じ扱い
    dlg.addEventListener('cancel', (e: any) => {
      if (e && typeof e.preventDefault === 'function') { e.preventDefault() }
      finish(null)
    })
    // カスタムHTML内の<form method="dialog">などで閉じられた場合も[x]と同じ扱い
    dlg.addEventListener('close', () => finish(null))

    doc.body.appendChild(dlg)
    if (typeof dlg.showModal === 'function') {
      dlg.showModal()
    } else {
      dlg.setAttribute('open', '')
    }
    // フォーカスを設定
    const focusTarget = input || list || buttons[defaultIndex] || closeBtn
    if (focusTarget && typeof focusTarget.focus === 'function') { focusTarget.focus() }
  })
}
