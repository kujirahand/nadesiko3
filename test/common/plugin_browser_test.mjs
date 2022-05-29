import assert from 'assert'
import { NakoCompiler } from 'nadesiko3core/src/nako3.mjs'
import PluginBrowser from '../../src/plugin_browser.mjs'

describe('plugin_browser_test', () => {
  const cmp = (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler({ useBasicPlugin: true })
    nako.addPluginFile('PluginBrowser', 'plugin_browser.js', PluginBrowser)
    assert.strictEqual(nako.run(code).log, res)
  }
  // --- test ---
  it('RGB', () => {
    cmp('CODE=RGB(255,255,255);CODEを大文字変換して表示', '#FFFFFF')
    cmp('CODE=RGB(0,255,255);CODEを大文字変換して表示', '#00FFFF')
    cmp('CODE=RGB(0,0,0);CODEを大文字変換して表示', '#000000')
    cmp('CODE=22と25と255のRGB;CODEを大文字変換して表示', '#1619FF')
    cmp('22と25と255のRGBを大文字変換して表示', '#1619FF')
  })
  it('色混ぜる', () => {
    cmp('[255,255,255]の色混ぜして大文字変換して表示', '#FFFFFF')
  })
})
