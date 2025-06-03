/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('debug', () => {
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  // --- test ---
  it('print simple', async () => {
    await cmp('/* aaa */\n3を表示\n2*3を表示', '3\n6')
  })
  it('インデント構文のブロックの直後の行が正しくない #2037', async () => {
    await cmp(
      '1回:\n' +
      '　　// test\n' +
      '333をデバッグ表示;' +
      '',
      'main.nako3(3): 333')
  })
})
