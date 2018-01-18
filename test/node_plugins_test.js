const assert = require('assert')
const NakoCompiler = require('../src/nako3')
const PluginNode = require('../src/plugin_node')

describe('node_plugins_test', () => {
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginNode', 'PluginNode', PluginNode)
  // nako.debug = true
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    const ret = nako.runReset(code)
    assert.equal(ret.log, res)
  }
  // TODO: うまく動かない (ただし単体でテストすると動くので、原因を追及する)
  it('「取り込む」', () => {
     //cmp('!「nadesiko3-hoge」を取り込む。3と5をHOGE足して、表示。', '8')
  })
})
