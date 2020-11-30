const PluginBrowser = require('../src/plugin_browser')
const { PluginUtHelper } = require('../utils/plugin_ut_helper')

describe('plugin_browser_html', () => {
  const cu = new PluginUtHelper(PluginBrowser)

  it('HTML変換', () => {
    cu.cmpfn('HTML変換', ['texT'], 'texT')
    cu.cmpifn('HTML変換', ['<?!==?>'], '&lt;?!==?&gt;')
    cu.cmpifn('HTML変換', ['2&3'], '2&amp;3')
    cu.cmpifn('HTML変換', ['&lt;&gt;&amp;'], '&amp;lt;&amp;gt;&amp;amp;')
  })
})
