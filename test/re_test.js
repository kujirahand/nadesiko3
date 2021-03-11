const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('re_test', () => {
  const nako = new NakoCompiler()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = (code, res) => {
    nako.logger.debug('code=' + code)
    assert.strictEqual(nako.run(code).log, res)
  }
  // --- test ---
  it('正規表現マッチ - 基本', () => {
    cmp('『abc123abc456』を『/[0-9]+/』で正規表現マッチして表示', '123')
    cmp('『aaa:bbb:ccc』を『/[a-z]+/g』で正規表現マッチ;それ@1を表示', 'bbb')
  })
  it('正規表現マッチ - 抽出文字列', () => {
    cmp('『abc123abc456』を『/([0-9]+)([a-z]+)/』で正規表現マッチ;抽出文字列[1]を表示', 'abc')
    cmp('『// hoge』を『/\/\/\\s*(.+)/』で正規表現マッチ;抽出文字列[0]を表示', 'hoge')
  })
})
