const assert = require('assert')
const CNako3 = require('../src/cnako3')

describe('plugin_test', () => {
  const nako = new CNako3()
  // nako.logger.addSimpleLogger('trace')
  nako.silent = true
  const cmp = (code, res) => {
    nako.logger.debug('code=' + code)
    const ret = nako.runReset(code)
    assert.strictEqual(ret.log, res)
  }
  it('「取り込む」', () => {
    cmp('!「nadesiko3-hoge」を取り込む。\n3と5をHOGE足して、表示。', '8')
  })
})
