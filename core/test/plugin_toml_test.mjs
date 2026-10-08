/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

// eslint-disable-next-line no-undef
describe('plugin_toml_test', () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    const g = await nako.runAsync(code)
    assert.strictEqual(g.log, res)
  }

  // --- test ---
  it('TOML取得', async () => {
    await cmp('a=「[a]\nb=3」のTOML取得。aをJSONエンコードして表示', '{"a":{"b":3}}')
  })
  it('TOML変換', async () => {
    await cmp('a={"a":{"b": 3}};aのTOML変換して表示', '[a]\nb = 3')
  })
  it('TOML取得 - 配列とテーブル配列', async () => {
    await cmp('a=「x = [1, 2, 3]\n[[t]]\nn = 1\n[[t]]\nn = 2」のTOML取得。aをJSONエンコードして表示', '{"x":[1,2,3],"t":[{"n":1},{"n":2}]}')
  })
  it('TOML取得 - 不正なTOMLはエラー', async () => {
    const nako = new NakoCompiler()
    await assert.rejects(async () => { await nako.runAsync('a=「x = 」のTOML取得。') })
  })
  it('TOML取得 - 大量のコメント行でも短時間で処理できる (#2594)', async () => {
    const nako = new NakoCompiler()
    nako.addFunc('巨大TOML', [], () => '# comment\n'.repeat(50000) + 'a = 1\n', true)
    const t = Date.now()
    const g = await nako.runAsync('a=巨大TOMLのTOML取得。a["a"]を表示')
    assert.strictEqual(g.log, '1')
    assert.ok(Date.now() - t < 5000)
  })
  it('TOML取得 - 大量のキー行でも短時間で処理できる (#2594)', async () => {
    const nako = new NakoCompiler()
    let src = ''
    for (let i = 0; i < 20000; i++) { src += `k${i} = ${i}\n` }
    nako.addFunc('巨大TOML', [], () => src, true)
    const t = Date.now()
    const g = await nako.runAsync('a=巨大TOMLのTOML取得。a["k19999"]を表示')
    assert.strictEqual(g.log, '19999')
    assert.ok(Date.now() - t < 5000)
  })
})
