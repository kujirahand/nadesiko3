const PluginBrowser = require('nako3/plugin_browser')
const { PluginUtHelper } = require('utils/plugin_ut_helper')

describe('plugin_browser_system', () => {
  const cu = new PluginUtHelper(PluginBrowser)

  it('終わる', () => {
    cu.cmpfnex('終', [], 'Error', '__終わる__')
  })
})
