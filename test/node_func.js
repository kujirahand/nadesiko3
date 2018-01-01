const assert = require('assert')
const path = require('path')
const NakoCompiler = require('../src/nako3')
const PluginNode = require('../src/plugin_node')

describe('node_func__test', () => {
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginNode', 'plugin_node.js', PluginNode)
  // nako.debug = true
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
    cmp('3を表示', '3')
    cmp('1+2*3を表示', '7')
    cmp('A=30;「--{A}--」を表示', '--30--')
  })
  it('存在', () => {
    cmp('「/xxx/xxx/xxx/xxx」が存在;もしそうならば;「NG」と表示。違えば「OK」と表示。', 'OK')
    const fname = path.join(__dirname, 'node_func.js')
    cmp('「' + fname + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('ASSERT', () => {
    cmd('3と3がASSERT等')
  })
  it('プラグインテスト', () => {
    // TODO: このテストファイルを単体でテストするとOKだが、テスト全体をテストするとNGになる
    // cmp('!「../src/plugin_hoge.js」を取り込む。3と5をHOGE足。表示。', '8')
  })
})
