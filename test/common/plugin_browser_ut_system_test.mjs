import PluginBrowser from '../../src/plugin_browser.mjs'
import { PluginUtHelper } from '../../utils/plugin_ut_helper.js'

describe('plugin_browser_system', () => {
  const cu = new PluginUtHelper(PluginBrowser)

  it('終わる', () => {
    cu.cmpfnex('終', [], 'Error', '__終わる__')
  })
})
