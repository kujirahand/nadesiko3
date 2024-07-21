/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

// eslint-disable-next-line no-undef
describe('re_test', () => {
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  // --- test ---
  it('正規表現マッチ - 基本', async () => {
    await cmp('『abc123abc456』を『/[0-9]+/』で正規表現マッチして表示', '123')
    await cmp('『aaa:bbb:ccc』を『/[a-z]+/g』で正規表現マッチ;それ@1を表示', 'bbb')
  })
  it('正規表現マッチ - 抽出文字列', async () => {
    await cmp('『abc123abc456』を『/([0-9]+)([a-z]+)/』で正規表現マッチ;抽出文字列[1]を表示', 'abc')
    await cmp('『// hoge』を『///\\s*(.+)/』で正規表現マッチ;抽出文字列[0]を表示', 'hoge')
  })
})
