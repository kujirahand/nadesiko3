/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('or_test.js', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  it('『または』がうまく動いてない #1379', async () => {
    await cmp('(0||0)を表示', '0')
    await cmp('(0または0)を表示', '0')
    await cmp('(0または1)を表示', '1')
    await cmp('ゼロ=0;(ゼロ||ゼロ)を表示', '0')
    await cmp('ゼロ=0;(ゼロまたはゼロ)を表示', '0')
    await cmp('ゼロ=0;イチ=1;(ゼロまたはイチ)を表示', '1')
  })
  it('『かつ』がうまく動いてない #1379', async () => {
    await cmp('(0かつ0)を表示', '0')
    await cmp('(1かつ1)を表示', '1')
    await cmp('ゼロ=0;イチ=1;(ゼロかつゼロ)を表示', '0')
    await cmp('ゼロ=0;イチ=1;(ゼロかつイチ)を表示', '0')
    await cmp('ゼロ=0;イチ=1;(ゼロかつゼロ)を表示', '0')
    await cmp('ゼロ=0;イチ=1;(イチかつイチ)を表示', '1')
  })
  it('『または』が動かない #1379', async () => {
    await cmp('条件イははい。条件ロはいいえ。もし、条件イまたは条件ロならば「AAA」と表示。', 'AAA')
    await cmp('条件イははい。条件ロははい。もし、条件イかつ条件ロならば「BBB」と表示。', 'BBB')
  })
})
