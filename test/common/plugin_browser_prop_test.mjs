import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginBrowser from '../../src/plugin_browser.mjs'

// DOMの日本語プロパティ(プロパティ構文)のテスト (#2194)
// 実際のブラウザを使わず、最低限のDOM風オブジェクトで動作を確認する
describe('plugin_browser_prop_test', async () => {
  /** テスト用の簡易DOM要素を作る */
  const createFakeElement = (tagName) => {
    return {
      tagName: tagName.toUpperCase(),
      style: {},
      setAttribute (key, value) { this[key] = value },
      getAttribute (key) { return this[key] }
    }
  }

  let elements = []
  let createdElements = []
  const originalDocument = globalThis.document

  beforeEach(() => {
    elements = []
    createdElements = []
    globalThis.document = {
      body: createFakeElement('body'),
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      getElementsByTagName: () => elements,
      createElement: (tag) => {
        const el = createFakeElement(tag)
        createdElements.push(el)
        return el
      }
    }
  })

  afterEach(() => {
    if (originalDocument === undefined) {
      delete globalThis.document
    } else {
      globalThis.document = originalDocument
    }
  })

  /** なでしこを実行して結果(表示内容)とグローバル変数を返す */
  const run = async (code) => {
    const nako = new NakoCompiler({ useBasicPlugin: true })
    nako.addPluginFile('PluginBrowser', 'plugin_browser.mjs', PluginBrowser)
    return await nako.runAsync(code, 'main')
  }

  // --- test ---
  it('タグ一覧取得で得た要素に日本語プロパティが使えること', async () => {
    const div = createFakeElement('div')
    elements = [div]
    const g = await run('A=タグ一覧取得("div");A[0]$幅="100px";A[0]$幅を表示')
    assert.strictEqual(g.log, '100px')
    // 内部的にはstyle.widthへ設定される
    assert.strictEqual(div.style.width, '100px')
  })

  it('DOM要素作成で得た要素に日本語プロパティが使えること', async () => {
    const g = await run('E="div"のDOM要素作成;E$幅="50px";E$幅を表示')
    assert.strictEqual(g.log, '50px')
    // 内部的にはstyle.widthへ設定される
    assert.strictEqual(createdElements.length, 1)
    assert.strictEqual(createdElements[0].style.width, '50px')
  })

  it('ネストしたスタイルのプロパティ(E$スタイル$色)を設定・取得できること', async () => {
    const div = createFakeElement('div')
    elements = [div]
    const g = await run('A=タグ一覧取得("div");A[0]$スタイル$色="red";A[0]$スタイル$色を表示')
    assert.strictEqual(g.log, 'red')
    // 内部的にはstyle.colorへ設定される
    assert.strictEqual(div.style.color, 'red')
  })

  it('ネストしたスタイルのプロパティで英語名も使えること', async () => {
    const div = createFakeElement('div')
    elements = [div]
    const g = await run('A=タグ一覧取得("div");A[0]$スタイル$色="blue";A[0]$スタイル$colorを表示')
    assert.strictEqual(g.log, 'blue')
  })

  it('日本語プロパティを持たない通常のオブジェクトは影響を受けないこと', async () => {
    const g = await run('A={"幅":30};A$幅=50;A$幅を表示')
    assert.strictEqual(g.log, '50')
  })
})
