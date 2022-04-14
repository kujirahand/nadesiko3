const assert = require('assert')
const CNako3 = require('../../src/cnako3')
const path = require('path')
describe('plugin_test', () => {
  const nako = new CNako3()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  nako.silent = true
  const cmp = (code, res) => {
    nako.logger.debug('code=' + code)
    const ret = nako.run(code)
    assert.strictEqual(ret.log, res)
  }
  it('「取り込む」', () => {
    const plug = path.join(__dirname, '..', '..', 'src', 'plugin_keigo.js')
    cmp(`!「${plug}」を取り込む。\n拝啓。お世話になっております。礼節レベル取得して表示。`, '1')
  })
})

