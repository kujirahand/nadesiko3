/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginBrowser from '../../src/plugin_browser.mjs'
import { parseDialogChoices, convertAnswer } from '../../src/plugin_browser_dialog_dom.mjs'

// --- テスト用の簡易フェイクDOM (#2548) ---
class FakeElement {
  constructor (tagName, doc) {
    this.tagName = tagName.toUpperCase()
    this.ownerDocument = doc
    this.children = []
    this.parentNode = null
    this.attributes = {}
    this.listeners = {}
    this.className = ''
    this.textContent = ''
    this.innerHTML = ''
    this.value = ''
    this.id = ''
    this.open = false
  }

  appendChild (el) {
    el.parentNode = this
    this.children.push(el)
    return el
  }

  removeChild (el) {
    this.children = this.children.filter(c => c !== el)
    el.parentNode = null
    return el
  }

  setAttribute (name, value) { this.attributes[name] = String(value) }
  getAttribute (name) { return this.attributes[name] }
  addEventListener (event, f) { (this.listeners[event] ||= []).push(f) }
  dispatch (event, e = {}) {
    const ev = { preventDefault: () => {}, ...e }
    for (const f of (this.listeners[event] || [])) { f(ev) }
  }

  click () { this.dispatch('click') }
  focus () { this.ownerDocument.activeElement = this }
  showModal () { this.open = true }
  close () {
    // 実際のブラウザと同じく、閉じたときにcloseイベントを発火する
    if (!this.open) { return }
    this.open = false
    this.dispatch('close')
  }

  // 子孫要素を検索する
  findAll (pred) {
    const res = []
    for (const c of this.children) {
      if (pred(c)) { res.push(c) }
      res.push(...c.findAll(pred))
    }
    return res
  }

  findByClass (cls) {
    return this.findAll(el => el.className.split(' ').includes(cls))
  }
}

class FakeDocument {
  constructor () {
    this.head = new FakeElement('head', this)
    this.body = new FakeElement('body', this)
    this.activeElement = null
  }

  createElement (tag) { return new FakeElement(tag, this) }
  getElementById (id) {
    return [this.head, this.body].flatMap(p => p.findAll(el => el.id === id))[0] || null
  }
}

// 表示中のダイアログを取得する
function getDialog (doc) {
  return doc.body.findByClass('nako3dialog')[0]
}
function getButton (doc, caption) {
  return getDialog(doc).findByClass('nako3dialog-button').find(b => b.textContent === caption)
}
function getButtonIn (dlg, caption) {
  return dlg.findByClass('nako3dialog-button').find(b => b.textContent === caption)
}
// ダイアログが表示されるまで待つ
async function waitDialog (doc) {
  for (let i = 0; i < 100; i++) {
    const dlg = getDialog(doc)
    if (dlg) { return dlg }
    await new Promise(resolve => setTimeout(resolve, 1))
  }
  throw new Error('ダイアログが表示されませんでした')
}

describe('plugin_browser_dialog_test', () => {
  let prevDocument
  let prevWindow
  let doc
  let nativeCalls

  beforeEach(() => {
    prevDocument = globalThis.document
    prevWindow = globalThis.window
    doc = new FakeDocument()
    nativeCalls = []
    globalThis.document = doc
    globalThis.window = {
      location: { href: 'http://localhost/' },
      alert: (s) => { nativeCalls.push(['alert', s]) },
      prompt: (s) => { nativeCalls.push(['prompt', s]); return '123' },
      confirm: (s) => { nativeCalls.push(['confirm', s]); return true }
    }
  })

  afterEach(() => {
    if (prevDocument === undefined) { delete globalThis.document } else { globalThis.document = prevDocument }
    if (prevWindow === undefined) { delete globalThis.window } else { globalThis.window = prevWindow }
  })

  // なでしこのプログラムを実行し、表示されたダイアログを操作する
  async function run (code, operate, setup) {
    const nako = new NakoCompiler()
    nako.addPluginObject('PluginBrowser', PluginBrowser)
    if (setup) { setup(nako) }
    let log = ''
    nako.getLogger().addListener('stdout', (data) => { log += data.noColor })
    const p = nako.runAsync(code, 'main.nako3')
    if (operate) {
      const dlg = await waitDialog(doc)
      await operate(dlg)
    }
    await p
    // 閉じた後はダイアログが残らない
    assert.strictEqual(getDialog(doc), undefined)
    return log.replace(/\n$/, '')
  }

  it('候補リストのラベル解析', () => {
    assert.deepStrictEqual(parseDialogChoices(['# 何を食べたいですか？', '寿司', 'ラーメン']),
      { label: '何を食べたいですか？', choices: ['寿司', 'ラーメン'] })
    assert.deepStrictEqual(parseDialogChoices(['OK', 'Cancel']), { label: '', choices: ['OK', 'Cancel'] })
  })

  it('尋の数値変換', () => {
    assert.strictEqual(convertAnswer('123'), 123)
    assert.strictEqual(convertAnswer('－１２．５'), -12.5)
    assert.strictEqual(convertAnswer('abc'), 'abc')
  })

  it('言 - OKを押すまで待機する', async () => {
    const log = await run('「こんにちは」と言う。「終わり」を表示', (dlg) => {
      assert.strictEqual(dlg.open, true)
      assert.strictEqual(dlg.findByClass('nako3dialog-label')[0].textContent, 'こんにちは')
      getButton(doc, 'OK').click()
    })
    assert.strictEqual(log, '終わり')
    // スタイルが追加されている
    assert.ok(doc.getElementById('nako3dialog-style'))
  })

  it('DOMスキン設定をダイアログと各部品に適用し、標準クラスと戻り値を保つ #2552', async () => {
    const calls = []
    const setup = (nako) => {
      nako.__varslist[0].get('DOMスキン辞書').夜空 = (type, element, sys) => {
        calls.push([type, element.tagName, sys.__getSysVar('DOMスキン') === '夜空'])
        element.className = 'theme-night'
      }
    }
    const log = await run('「夜空」のDOMスキン設定。A=["# 色は？", "赤", "青"]のリスト選択。Aを表示', (dlg) => {
      assert.ok(dlg.findByClass('theme-night').length >= 7)
      assert.ok(dlg.findByClass('nako3dialog-close')[0])
      assert.ok(dlg.findByClass('nako3dialog-label')[0])
      assert.ok(dlg.findByClass('nako3dialog-list')[0])
      assert.ok(dlg.findByClass('nako3dialog-button-primary')[0])
      dlg.findByClass('nako3dialog-list')[0].value = '青'
      getButton(doc, 'OK').click()
    }, setup)
    assert.strictEqual(log, '青')
    assert.ok(calls.some(([type, tag]) => type === 'dialog' && tag === 'DIALOG'))
    assert.ok(calls.some(([type, tag]) => type === 'select' && tag === 'SELECT'))
    assert.ok(calls.some(([type, tag]) => type === 'option' && tag === 'OPTION'))
    assert.ok(calls.some(([type, tag]) => type === 'button' && tag === 'BUTTON'))
    assert.ok(calls.every(([, , sameSys]) => sameSys))
  })

  it('スキンの切替と未登録名を次のダイアログに反映する #2552', async () => {
    const setup = (nako) => {
      const skins = nako.__varslist[0].get('DOMスキン辞書')
      skins.赤 = (_type, element) => { element.className += ' theme-red' }
      skins.青 = (_type, element) => { element.className += ' theme-blue' }
    }
    await run('「赤」のDOMスキン設定。「一番」と言う', (dlg) => {
      assert.ok(dlg.findByClass('theme-red').length > 0)
      assert.strictEqual(dlg.findByClass('theme-blue').length, 0)
      getButton(doc, 'OK').click()
    }, setup)
    await run('「青」のDOMスキン設定。「二番」と言う', (dlg) => {
      assert.ok(dlg.findByClass('theme-blue').length > 0)
      assert.strictEqual(dlg.findByClass('theme-red').length, 0)
      getButton(doc, 'OK').click()
    }, setup)
    await run('「未登録」のDOMスキン設定。「三番」と言う', (dlg) => {
      assert.strictEqual(dlg.findByClass('theme-red').length, 0)
      assert.strictEqual(dlg.findByClass('theme-blue').length, 0)
      getButton(doc, 'OK').click()
    }, setup)
  })

  it('入力ダイアログでもinputにスキンを適用する #2552', async () => {
    const setup = (nako) => {
      nako.__varslist[0].get('DOMスキン辞書').入力 = (type, element) => {
        if (type === 'input') { element.className += ' theme-input' }
      }
    }
    const log = await run('「入力」のDOMスキン設定。「名前は？」と文字尋ねる。それを表示', (dlg) => {
      const input = dlg.findByClass('theme-input')[0]
      assert.ok(input)
      input.value = 'なでしこ'
      getButton(doc, 'OK').click()
    }, setup)
    assert.strictEqual(log, 'なでしこ')
  })

  it('なでしこで定義した同じスキンを通常の部品とダイアログに適用する #2552', async () => {
    const code = `
DOMスキン辞書@「共通」=関数(TYPE,OBJ)
　OBJの「className」に「shared-skin」をDOM属性設定。
ここまで。
「共通」のDOMスキン設定。
「通常のボタン」のボタン作成。
「確認」と言う。
`
    await run(code, (dlg) => {
      const plainButton = doc.body.findByClass('shared-skin').find(el => el.tagName === 'BUTTON' && el.parentNode === doc.body)
      assert.ok(plainButton)
      assert.ok(dlg.findByClass('shared-skin').includes(dlg.findByClass('nako3dialog-button')[0]))
      getButton(doc, 'OK').click()
    })
  })

  it('尋 - 入力値を数値に変換して返す', async () => {
    const log = await run('「年齢は？」と尋ねる。(それ+1)を表示', (dlg) => {
      dlg.findByClass('nako3dialog-input')[0].value = '２０'
      getButton(doc, 'OK').click()
    })
    assert.strictEqual(log, '21')
  })

  it('尋 - Enterキーで確定する', async () => {
    const log = await run('「名前は？」と尋ねる。それを表示', (dlg) => {
      const input = dlg.findByClass('nako3dialog-input')[0]
      input.value = 'くじら'
      input.dispatch('keydown', { key: 'Enter' })
    })
    assert.strictEqual(log, 'くじら')
  })

  it('文字尋 - キャンセルでダイアログキャンセル値を返す', async () => {
    const log = await run('ダイアログキャンセル値=「CANCEL」。「名前は？」と文字尋ねる。それを表示', () => {
      getButton(doc, 'キャンセル').click()
    })
    assert.strictEqual(log, 'CANCEL')
  })

  it('文字尋 - [x]でダイアログキャンセル値を返す', async () => {
    const log = await run('ダイアログキャンセル値=「CANCEL」。「数字は？」と文字尋ねる。それを表示', (dlg) => {
      dlg.findByClass('nako3dialog-close')[0].click()
    })
    assert.strictEqual(log, 'CANCEL')
  })

  it('二択 - OKとキャンセルと[x]', async () => {
    assert.strictEqual(await run('「続けますか」で二択。それを表示', () => getButton(doc, 'OK').click()), 'true')
    assert.strictEqual(await run('「続けますか」で二択。それを表示', () => getButton(doc, 'キャンセル').click()), 'false')
    assert.strictEqual(await run('「続けますか」で二択。それを表示', (dlg) => dlg.findByClass('nako3dialog-close')[0].click()), 'false')
  })

  it('二択 - Escキー(cancelイベント)はfalse', async () => {
    const log = await run('「続けますか」で二択。それを表示', (dlg) => dlg.dispatch('cancel'))
    assert.strictEqual(log, 'false')
  })

  it('ボタン選択 - ラベル付きで選んだボタンを返す', async () => {
    const log = await run('F=["# 何を食べたいですか？", "寿司", "ラーメン"]のボタン選択。Fを表示', (dlg) => {
      assert.strictEqual(dlg.findByClass('nako3dialog-label')[0].textContent, '何を食べたいですか？')
      assert.deepStrictEqual(dlg.findByClass('nako3dialog-button').map(b => b.textContent), ['寿司', 'ラーメン'])
      getButton(doc, 'ラーメン').click()
    })
    assert.strictEqual(log, 'ラーメン')
  })

  it('ボタン選択 - [x]で空文字列を返す', async () => {
    const log = await run('F=["OK", "Cancel"]のボタン選択。「[{F}]」を表示', (dlg) => {
      dlg.findByClass('nako3dialog-close')[0].click()
    })
    assert.strictEqual(log, '[]')
  })

  it('リスト選択 - OKで選択中の項目を返す', async () => {
    const log = await run('F=["# 好きな色は？", "赤", "青", "緑"]のリスト選択。Fを表示', (dlg) => {
      const list = dlg.findByClass('nako3dialog-list')[0]
      assert.strictEqual(list.value, '赤') // 初期値は先頭
      assert.deepStrictEqual(list.children.map(o => o.textContent), ['赤', '青', '緑'])
      list.value = '青'
      getButton(doc, 'OK').click()
    })
    assert.strictEqual(log, '青')
  })

  it('リスト選択 - キャンセルと[x]で空文字列を返す', async () => {
    assert.strictEqual(await run('F=["赤", "青"]のリスト選択。「[{F}]」を表示', () => getButton(doc, 'キャンセル').click()), '[]')
    assert.strictEqual(await run('F=["赤", "青"]のリスト選択。「[{F}]」を表示', (dlg) => dlg.findByClass('nako3dialog-close')[0].click()), '[]')
  })

  it('リスト選択 - ダブルクリックで確定する', async () => {
    const log = await run('F=["赤", "青"]のリスト選択。Fを表示', (dlg) => {
      const list = dlg.findByClass('nako3dialog-list')[0]
      list.value = '青'
      list.dispatch('dblclick')
    })
    assert.strictEqual(log, '青')
  })

  it('カスタムダイアログ表示 - HTMLを描画して押したボタンを返す', async () => {
    const code = '選択=「<h1>続けますか？</h1>」で["続ける","やめる"]をカスタムダイアログ表示。選択を表示'
    const log = await run(code, (dlg) => {
      assert.strictEqual(dlg.findByClass('nako3dialog-body')[0].innerHTML, '<h1>続けますか？</h1>')
      getButton(doc, 'やめる').click()
    })
    assert.strictEqual(log, 'やめる')
    const log2 = await run(code, (dlg) => dlg.findByClass('nako3dialog-close')[0].click())
    assert.strictEqual(log2, '')
  })

  it('ダイアログ方式がブラウザなら標準ダイアログを使う', async () => {
    const log = await run('ダイアログ方式=「ブラウザ」。「こんにちは」と言う。「数は？」と尋ねる。それ+1を表示。「OK?」で二択。それを表示')
    assert.strictEqual(log, '124true')
    assert.deepStrictEqual(nativeCalls, [['alert', 'こんにちは'], ['prompt', '数は？'], ['confirm', 'OK?']])
    assert.strictEqual(getDialog(doc), undefined)
  })

  it('ユーザー関数の中からでもダイアログの結果を待機する', async () => {
    const code = '●(Sを)聞くとは\n　Sと尋ねる\nここまで\n「名前は？」を聞いて表示'
    const log = await run(code, (dlg) => {
      dlg.findByClass('nako3dialog-input')[0].value = 'なでしこ'
      getButton(doc, 'OK').click()
    })
    assert.strictEqual(log, 'なでしこ')
  })

  it('カスタムダイアログ表示 - <form method="dialog">などで閉じた場合は空文字列を返す', async () => {
    const code = '選択=「<form method=\'dialog\'><button>閉じる</button></form>」で["OK"]をカスタムダイアログ表示。「[{選択}]」を表示'
    const log = await run(code, (dlg) => dlg.close())
    assert.strictEqual(log, '[]')
  })

  it('!クリアで表示中のダイアログを破棄し、前回の続きは実行しない', async () => {
    const nako = new NakoCompiler()
    nako.addPluginObject('PluginBrowser', PluginBrowser)
    let log = ''
    nako.getLogger().addListener('stdout', (data) => { log += data.noColor })
    nako.runAsync('「名前は？」と尋ねる。「続き」を表示', 'main.nako3')
    const dlg = await waitDialog(doc)
    nako.clearPlugins()
    assert.strictEqual(getDialog(doc), undefined)
    assert.strictEqual(dlg.open, false)
    // 破棄したダイアログを操作しても前回の続きは動かない
    getButtonIn(dlg, 'OK').click()
    await new Promise(resolve => setTimeout(resolve, 10))
    assert.strictEqual(log, '')
  })
})
