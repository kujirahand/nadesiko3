import PluginBrowser from '../../src/plugin_browser.mjs'
import { PluginUtHelper } from '../../utils/plugin_ut_helper.mjs'

describe('plugin_browser_html', () => {
  const cu = new PluginUtHelper(PluginBrowser)

  it('HTML変換', () => {
    cu.cmpfn('HTML変換', ['texT'], 'texT')
    cu.cmpifn('HTML変換', ['<?!==?>'], '&lt;?!==?&gt;')
    cu.cmpifn('HTML変換', ['2&3'], '2&amp;3')
    cu.cmpifn('HTML変換', ['&lt;&gt;&amp;'], '&amp;lt;&amp;gt;&amp;amp;')
  })
})
