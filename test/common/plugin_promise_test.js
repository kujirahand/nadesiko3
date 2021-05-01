const assert = require('assert')
const NakoCompiler = require('../../src/nako3')

describe('plugin_promise_test', () => {
  const nako = new NakoCompiler()
  const cmp = async (code, res, time) => {
    nako.logger.debug('code=' + code)
    const r = nako.run(code)
    setTimeout(() => {
      assert.strictEqual(r.log, res)
    }, time)
  }
  // --- test ---
  it('Promise', async () => {
    cmp('Fは動いた時には(成功,失敗)\n成功(9)\nここまで\nFの成功した時には\n対象を表示\nここまで\nその失敗した時には\n"NG"を表示\nここまで', '9', 50)
    cmp('Fは動いた時には(成功,失敗)\n失敗(5)\nここまで\nFの成功した時には\n"NG"を表示\nここまで\nその失敗した時には\n対象を表示\nここまで', '5', 50)
  })
})
