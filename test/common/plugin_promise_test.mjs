import assert from 'assert'
import { NakoCompiler } from '../../src/nako3.mjs'

// eslint-disable-next-line no-undef
describe('plugin_promise_test', () => {
  const nako = new NakoCompiler()
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res, /** @type {number | undefined} */ time) => {
    nako.logger.debug('code=' + code)
    const r = nako.run(code)
    setTimeout(() => {
      assert.strictEqual(r.log, res)
    }, time)
  }
  // --- test ---
  // eslint-disable-next-line no-undef
  it('Promise', async () => {
    cmp('Fは動いた時には(成功,失敗)\n成功(9)\nここまで\nFの成功した時には\n対象を表示\nここまで\nその失敗した時には\n"NG"を表示\nここまで', '9', 50)
    cmp('Fは動いた時には(成功,失敗)\n失敗(5)\nここまで\nFの成功した時には\n"NG"を表示\nここまで\nその失敗した時には\n対象を表示\nここまで', '5', 50)
  })
})
