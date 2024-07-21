/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('debug', () => {
  const nako = new NakoCompiler()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    nako.logger.debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  // --- test ---
  it('print simple', async () => {
    await cmp('/* aaa */\n3を表示\n2*3を表示', '3\n6')
    // cmp("/* a\n */\n3を表示\n「テスト」でエラー発生。", "3\n6");
  })
})
