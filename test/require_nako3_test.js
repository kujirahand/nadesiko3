const assert = require('assert')
const CNako3 = require('../src/cnako3')

describe('require_nako3_test', () => {
  const nako = new CNako3()
  nako.debug = false
  nako.silent = true
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    const ret = nako.runReset(code, 'main.nako3')
    assert.strictEqual(ret.log, res)
  }
  it('「ファイルを取り込む」', () => {
    cmp('!「test/requiretest.nako3」を取り込む。\n痕跡を表示。3と5を痕跡演算して、表示。', '5\n8')
  })
})
