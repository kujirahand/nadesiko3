const assert = require('assert')
const NakoCompiler = require('../src/nako3')
const PluginMarkup = require('../src/plugin_markup')
const CNako3 = require('../src/cnako3')

describe('plugin_markup_test', () => {
  const wnako = new NakoCompiler()
  // wnako.logger.addSimpleLogger('trace', 'node')
  wnako.addPluginFile('PluginMarkup', 'plugin_markup.js', PluginMarkup)

  const cnako = new CNako3()
  cnako.silent = true

  const cmp = (code, res) => {
    for (let nako of [cnako, wnako]) {
      let c = code

      if (nako === cnako) {
        c = '!「plugin_markup.js」を取り込む。\n' + c
      }

      nako.logger.debug('code=' + code)

      assert.strictEqual(nako.runReset(c).log, res)
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
