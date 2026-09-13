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
})
