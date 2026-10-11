/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginBrowser from '../../src/plugin_browser.mjs'

// plugin_browser はブラウザプラグインだが、document/window をスタブ化すれば
// Node でも __addEvent/__removeEvent のロジックを検証できる (#2500)
describe('plugin_browser_test', () => {
  let prevDocument
  let prevWindow
  let stubEl
  const removed = []
  const added = []

  beforeEach(() => {
    prevDocument = globalThis.document
    prevWindow = globalThis.window
    removed.length = 0
    added.length = 0
    stubEl = {
      addEventListener: (event, f) => { added.push([event, f]) },
      removeEventListener: (event, f) => { removed.push([event, f]) }
    }
    globalThis.document = {
      body: {},
      querySelector: (sel) => (sel === '#btn' ? stubEl : null)
    }
    globalThis.window = { location: { href: 'http://localhost/' } }
  })

  afterEach(() => {
    if (prevDocument === undefined) { delete globalThis.document } else { globalThis.document = prevDocument }
    if (prevWindow === undefined) { delete globalThis.window } else { globalThis.window = prevWindow }
  })

  it('セレクタ文字列で登録したDOMイベントが削除できる #2500', async () => {
    // __dom_events には解決済みの要素が格納されるため、
    // 削除時も解決済み要素と比較しないとセレクタ文字列での削除が常に失敗する
    const nako = new NakoCompiler()
    const g = await nako.runAsync('', 'main.nako3')
    PluginBrowser['初期化'].fn(g)
    const fn = () => {}
    g.__addEvent('#btn', 'click', fn, null, 'クリック時')
    assert.strictEqual(g.__dom_events.length, 1)
    assert.strictEqual(added.length, 1)
    g.__removeEvent('#btn', 'click', fn, 'クリック時解除')
    assert.strictEqual(g.__dom_events.length, 0)
    assert.strictEqual(removed.length, 1)
    assert.strictEqual(removed[0][0], 'click')
    assert.strictEqual(removed[0][1], added[0][1]) // 登録したラッパーと同じ関数が除去される
  })

  it('DOMイベント追加に非関数を指定すると命令名入りの登録時エラーになる #2500', async () => {
    const nako = new NakoCompiler()
    const g = await nako.runAsync('', 'main.nako3')
    PluginBrowser['初期化'].fn(g)
    assert.throws(
      () => g.__addEvent('#btn', 'click', 0, null, 'クリック時'),
      /『クリック時』に実行できない関数が指定されました/)
    // エラー時はイベントも __dom_events も登録されない
    assert.strictEqual(g.__dom_events.length, 0)
    assert.strictEqual(added.length, 0)
  })

  it('DOM属性一括設定で複数の属性をまとめて設定できる #2606', async () => {
    class StubElement {
      constructor () { this.width = 0; this.attrs = {} }
      setAttribute (k, v) { this.attrs[k] = v }
    }
    globalThis.window.Element = StubElement
    const el = new StubElement()
    const nako = new NakoCompiler()
    const g = await nako.runAsync('', 'main.nako3')
    PluginBrowser['初期化'].fn(g)
    g.__addPropMethod = () => {}
    const wa = { 幅: 'width', 読取専用: 'readOnly' }
    g.__getSysVar = (name) => (name === 'DOM和属性' ? wa : undefined)
    PluginBrowser['DOM属性一括設定'].fn(el, { 幅: 40, 読取専用: 1, 'data-x': 'a' }, g)
    assert.strictEqual(el.width, 40) // プロパティが存在すればプロパティに設定
    assert.strictEqual(el.attrs.readOnly, 1) // 存在しなければ setAttribute
    assert.strictEqual(el.attrs['data-x'], 'a')
  })

  it('DOM属性一括設定はSVG要素を直接渡しても、セレクタで渡しても設定できる #2606', async () => {
    // SVGElement は HTMLElement ではなく Element を継承する
    class StubElement {
      constructor () { this.attrs = {} }
      setAttribute (k, v) { this.attrs[k] = v }
    }
    class StubSVGElement extends StubElement {}
    globalThis.window.Element = StubElement
    const circle = new StubSVGElement()
    globalThis.document.querySelectorAll = (sel) => (sel === '#c' ? [circle] : [])
    const nako = new NakoCompiler()
    const g = await nako.runAsync('', 'main.nako3')
    PluginBrowser['初期化'].fn(g)
    g.__addPropMethod = () => {}
    g.__getSysVar = () => ({})
    PluginBrowser['DOM属性一括設定'].fn(circle, { fill: 'red' }, g)
    assert.strictEqual(circle.attrs.fill, 'red')
    PluginBrowser['DOM属性一括設定'].fn('#c', { fill: 'blue' }, g)
    assert.strictEqual(circle.attrs.fill, 'blue')
  })

  it('DOMスタイル一括設定はSVG要素を直接渡しても、セレクタで渡しても設定できる #2609', async () => {
    // SVGElement は HTMLElement ではなく Element を継承する
    class StubElement { constructor () { this.style = {} } }
    class StubSVGElement extends StubElement {}
    globalThis.window.Element = StubElement
    const circle = new StubSVGElement()
    globalThis.document.querySelectorAll = (sel) => (sel === '#c' ? [circle] : [])
    const nako = new NakoCompiler()
    const g = await nako.runAsync('', 'main.nako3')
    PluginBrowser['初期化'].fn(g)
    g.__addPropMethod = () => {}
    g.__getSysVar = () => ({})
    PluginBrowser['DOMスタイル一括設定'].fn(circle, { fill: 'red' }, g)
    assert.strictEqual(circle.style.fill, 'red')
    PluginBrowser['DOMスタイル一括設定'].fn('#c', { fill: 'blue' }, g)
    assert.strictEqual(circle.style.fill, 'blue')
  })
})
