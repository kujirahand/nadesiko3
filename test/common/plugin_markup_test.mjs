/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginMarkup from '../../src/plugin_markup.mjs'

// eslint-disable-next-line no-undef
describe('plugin_markup_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.addPluginObject('PluginMarkup', PluginMarkup)
    assert.strictEqual((await nako.runAsync(code, 'main.nako3')).log, res)
  }
  // --- test ---
  it('マークダウンHTML変換', async () => {
    await cmp('「test `test` test」をマークダウンHTML変換して表示', '<p>test <code>test</code> test</p>')
  })
  it('HTML整形', async () => {
    await cmp('「<p><h1>hoge</h1></p>」をHTML整形して表示', '<p>\n  <h1>hoge</h1>\n</p>')
  })
})
