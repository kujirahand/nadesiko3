const assert = require('assert')
const path = require('path')
const index = require('../src/index.js')

describe('index_test', () => {
  const nako = new index.compiler()
  nako.addPluginObject('PluginNode', index.PluginNode)
  nako.debug = false
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    assert.equal(nako.runReset(code).log, res)
  }
  const cmd = (code) => {
    if (nako.debug) console.log('code=' + code)
    nako.runReset(code)
  }
  // --- test ---
  it('表示', () => {
    cmp('1+2*3を表示', '7')
  })
  it('存在', () => {
    cmp('「/xxx/xxx/xxx/xxx」が存在;もしそうならば;「NG」と表示。違えば「OK」と表示。', 'OK')
    const fname = path.join(__dirname, 'node_func.js')
    cmp('「' + fname + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('ASSERT', () => {
    cmd('3と3がASSERT等')
  })
})
