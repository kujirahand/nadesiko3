import * as td from 'testdouble'
import { assert } from 'chai'
import { NakoCompiler } from 'nadesiko3core/src/nako3.mjs'
import PluginBrowser from 'nako3/plugin_browser.mjs'

describe('plugin_browser_smoke_test', () => {
  let nako = null

  beforeEach(() => {
    nako = new NakoCompiler()
    nako.addPluginFile('PluginBrowser', 'plugin_browser.js', PluginBrowser)
  })

  afterEach(() => {
    td.reset()
  })

  it('言う', () => {
    const windowalert = td.replace(window, 'alert')
    td.when(windowalert('あいうえお')).thenReturn(undefined)
    nako.run('「あいうえお」を言う')
    td.verify(windowalert(td.matchers.anything()), { times: 1 })
  })

  it('尋ねる', () => {
    const windowprompt = td.replace(window, 'prompt')
    td.when(windowprompt('かきくけこ')).thenReturn('abc')
    assert.strictEqual(nako.run('A=「かきくけこ」を尋ねる;AをJSONエンコードして表示').log, '"abc"')
    td.verify(windowprompt(td.matchers.anything()), { times: 1 })
  })

  it('二択', () => {
    const windowconfirm = td.replace(window, 'confirm')
    td.when(windowconfirm('これ')).thenReturn(true)
    assert.strictEqual(nako.run('A=「これ」で二択;AをJSONエンコードして表示').log, 'true')
    td.verify(windowconfirm(td.matchers.anything()), { times: 1 })
  })
})
