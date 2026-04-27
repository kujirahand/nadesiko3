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
})
