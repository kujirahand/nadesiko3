import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

// eslint-disable-next-line no-undef
describe('plugin_promise_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    const g = await nako.runAsync(code)
    assert.strictEqual(g.log, res)
  }
  // --- test ---
  // eslint-disable-next-line no-undef
  it('Promise', async () => {
    await cmp('動いた時には(成功,失敗)\n成功(9)\nここまで\nFはそれ\nFの成功した時には\n対象を表示\nここまで\nその失敗した時には\n"NG"を表示\nここまで', '9')
    await cmp('動いた時には(成功,失敗)\n失敗(5)\nここまで\nFはそれ\nFの成功した時には\n"NG"を表示\nここまで\nFの失敗した時には\n対象を表示\nここまで', '5')
  })
})
