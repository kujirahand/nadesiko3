const assert = require('assert')
const path = require('path')
const NakoCompiler = require('../src/nako3')
const PluginNode = require('../src/plugin_node')

describe('plugin_node_test', () => {
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginNode', 'plugin_node.js', PluginNode)
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
    cmp('3を表示', '3')
    cmp('1+2*3を表示', '7')
    cmp('A=30;「--{A}--」を表示', '--30--')
  })
  it('存在1', () => {
    cmp('「/xxx/xxx/xxx/xxx」が存在;もしそうならば;「NG」と表示。違えば「OK」と表示。', 'OK')
  })
  it('存在2', () => {
    const fname = path.join(__dirname, 'plugin_node_test.js')
    cmp('「' + fname + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('フォルダ存在', () => {
    cmp('「' + __dirname + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
    cmp('「' + __dirname + '/xxx」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'NG')
  })
  it('ASSERT', () => {
    cmd('3と3がASSERT等')
  })
  it('環境変数取得', () => {
    const path = process.env['PATH']
    cmp('「PATH」の環境変数取得して表示。', path)
  })
  it('圧縮解凍', () => {
    const me = path.join(__dirname, 'plugin_node_test.js')
    cmp('FIN=「'+me+'」;'+
      'HOME=ホームディレクトリ取得;'+
      'TMP=HOME&"/temp";'+
      'もし、TMPが存在しないならば、TMPのフォルダ作成。'+
      'FZIP=「{TMP}test.zip」;\n' +
      'FINをFZIPへ圧縮。0.3秒待つ。FZIPを「{TMP}/」に解凍。0.3秒待つ。\n'+
      'S1=「{TMP}/plugin_node_test.js」を読む。\n'+
      'S2=FINを読む。\n' +
      'もし(S1＝S2)ならば,"OK"と表示。\n', 'OK')
  })
})
