const assert = require('assert')
const path = require('path')
const NakoCompiler = require('../src/nako3')
const PluginNode = require('../src/plugin_node')

const testFileMe = path.join(__dirname, 'plugin_node_test.js')

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
    cmp('「' + testFileMe + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('フォルダ存在', () => {
    const dir = __dirname
    cmp('「' + dir + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
    cmp('「' + dir + '/xxx」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'NG')
  })
  it('ASSERT', () => {
    cmd('3と3がASSERT等')
  })
  it('環境変数取得', () => {
    const path = process.env['PATH']
    cmp('「PATH」の環境変数取得して表示。', path)
  })
  it('圧縮解凍', () => {
    let path7z = '7z'
    if (process.platform === 'win32') {
      path7z = path.join(path.dirname(__dirname), 'bin/7z.exe')
    }
    cmp('FIN=「' + testFileMe + '」;' +
      'HOME=ホームディレクトリ取得;' +
      'TMP=HOME&"/.temp";' +
      '「' + path7z + '」に圧縮解凍ツールパス変更;' +
      'もし、!(TMPが存在する)ならば、TMPのフォルダ作成。' +
      'FZIP=「{TMP}/test.zip」;\n' +
      'FINをFZIPへ圧縮。FZIPを「{TMP}/」に解凍。\n' +
      'S1=「{TMP}/plugin_node_test.js」を読む。\n' +
      'S2=FINを読む。\n' +
      'もし(S1＝S2)ならば、"OK"と表示。\n', 'OK')
  })
  it('ファイルサイズ取得', () => {
    cmp('「' + testFileMe + '」のファイルサイズ取得;もし、それが2000以上ならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('ファイル情報取得', () => {
    cmp('「' + testFileMe + '」のファイル情報取得;もし、それ["size"]が2000以上ならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('クリップボード', () => {
    try {
      const tmp = nako.runReset('クリップボードを表示').log 
      const rnd = 'a' + Math.random()
      cmp('クリップボード="' + rnd + '";クリップボードを表示。', rnd)
      nako.runReset(`クリップボード=${tmp}`)
    } catch (err) {
      // テストは必須ではない(Linuxコンソール環境に配慮)
    }
  })
})
