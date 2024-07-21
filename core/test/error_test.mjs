/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('error_test', () => {
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  // --- test ---
  it('エラー処理 - 基本', async () => {
    await cmp('123を表示', '123')
    await cmp('エラー監視;「hoge」のエラー発生;エラーならば;「ERR」と表示;ここまで', 'ERR')
  })
})
