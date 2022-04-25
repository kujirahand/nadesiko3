import assert from 'assert'
import { NakoCompiler } from '../../src/nako3.mjs'
import PluginMarkup from '../../src/plugin_markup.mjs'
import { CNako3 } from '../../src/cnako3mod.mjs'

describe('plugin_markup_test', () => {
  const wnako = new NakoCompiler()
  // wnako.logger.addListener('trace', ({ nodeConsole }) => { console.log(nodeConsole) })
  wnako.addPluginFile('PluginMarkup', 'plugin_markup.js', PluginMarkup)

  const cnako = new CNako3()
  cnako.silent = true

  const cmp = async (code, res) => {
    for (let nako of [cnako, wnako]) {
      let c = code

      if (nako === cnako) {
        c = '!「plugin_markup.js」を取り込む。\n' + c
      }

      nako.logger.debug('code=' + code)
      assert.strictEqual( (await nako.run(c)).log, res )
    }
  }

  // --- test ---
  it('マークダウンHTML変換', () => {
    cmp('「# test\n* 1234\n\t* ABCD」をマークダウンHTML変換して表示', '<h1 id="test">test</h1>\n<ul>\n<li>1234<ul>\n<li>ABCD</li>\n</ul>\n</li>\n</ul>')
  })
  it('HTML整形', () => {
    cmp('「<h1>test</h1>\n\n<ul><li>1234<ul><li>ABCD</li></ul></li></ul>」をHTML整形して表示',
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
