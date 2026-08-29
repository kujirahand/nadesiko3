import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginMarkup from '../../src/plugin_markup.mjs'
import { CNako3 } from '../../src/cnako3mod.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// eslint-disable-next-line no-undef
describe('plugin_markup_test', () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const wnako = new NakoCompiler()
    wnako.addPluginFile('PluginMarkup', 'plugin_markup.js', PluginMarkup)
    const cnako = new CNako3()
    cnako.silent = true

    for (const nako of [cnako, wnako]) {
      let c = code

      if (nako === cnako) {
        const pluginPath = path.join(__dirname, '../../src/plugin_markup.mjs')
        c = `!「${pluginPath}」を取り込む。\n` + c
      }

      nako.logger.debug('code=' + code)
      assert.strictEqual((await nako.runAsync(c, 'main.nako3')).log, res)
    }
  }

  // --- test ---
  // eslint-disable-next-line no-undef
  it('マークダウンHTML変換', async () => {
    await cmp('「# test\n* 1234\n\t* ABCD」をマークダウンHTML変換して表示', '<h1>test</h1>\n<ul>\n<li>1234<ul>\n<li>ABCD</li>\n</ul>\n</li>\n</ul>')
  })
  // eslint-disable-next-line no-undef
  it('HTML整形', async () => {
    await cmp('「<h1>test</h1>\n\n<ul><li>1234<ul><li>ABCD</li></ul></li></ul>」をHTML整形して表示',
      '<h1>test</h1>\n' +
      '\n' +
      '<ul>\n' +
      '  <li>1234\n' +
      '    <ul>\n' +
      '      <li>ABCD</li>\n' +
      '    </ul>\n' +
      '  </li>\n' +
      '</ul>')
  })
})
