import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginBrowser from '../../src/plugin_browser.mjs'

describe('plugin_browser_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler({ useBasicPlugin: true })
    nako.addPluginFile('PluginBrowser', 'plugin_browser.mjs', PluginBrowser)
    const g = await nako.runAsync(code, 'main')
    assert.strictEqual(g.log, res)
  }
  // --- test ---
  it('RGB', async () => {
    await cmp('CODE=RGB(255,255,255);CODEを大文字変換して表示', '#FFFFFF')
    await cmp('CODE=RGB(0,255,255);CODEを大文字変換して表示', '#00FFFF')
    await cmp('CODE=RGB(0,0,0);CODEを大文字変換して表示', '#000000')
    await cmp('CODE=22と25と255のRGB;CODEを大文字変換して表示', '#1619FF')
    await cmp('22と25と255のRGBを大文字変換して表示', '#1619FF')
  })
  it('色混ぜる', async () => {
    await cmp('[255,255,255]の色混ぜして大文字変換して表示', '#FFFFFF')
  })
})
