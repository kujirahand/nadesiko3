const assert = require('assert')
const CNako3 = require('../src/cnako3')

describe('require_nako3_test', () => {
  const nako = new CNako3()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  nako.silent = true
  const cmp = (code, res) => {
    nako.logger.debug('code=' + code)
    const ret = nako.run(code, 'main.nako3')
    assert.strictEqual(ret.log, res)
  }
  it('「ファイルを取り込む」', () => {
    cmp('!「test/requiretest.nako3」を取り込む。\n痕跡を表示。3と5を痕跡演算して、表示。', '5\n8')
  })
  it('CNakoの相対インポート', () => {
    cmp('!「test/relative_import_test_2.nako3」を取り込む。', '1\n2')
  })
  it('「回」が1回だけ分割されることを確認する', () => {
    cmp('！「test/kai_test.nako3」を取り込む', '')
  })
})
