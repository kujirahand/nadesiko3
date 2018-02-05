const assert = require('assert')
const CNako3 = require('../src/cnako3')

describe('plugin_test', () => {
  const nako = new CNako3()
  nako.debug = false
  nako.silent = true
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    const ret = nako.runReset(code)
    assert.equal(ret.log, res)
  }
  // TODO: うまく動かない (ただし単体でテストすると動くので、原因を追及する)
  it('「取り込む」', () => {
     cmp('!「nadesiko3-hoge」を取り込む。\n3と5をHOGE足して、表示。', '8')
  })
})
