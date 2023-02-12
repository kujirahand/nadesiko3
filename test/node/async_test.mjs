// @ts-nocheck
/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'

const PluginMyTest = {
  'テスト': {
    type: 'func',
    josi: [['と'], ['で']],
    fn: (a, b) => {
      assert.strictEqual(a, b)
    }
  }
}

// eslint-disable-next-line no-undef
describe('async_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ exRes) => {
    const nako3 = new NakoCompiler()
    nako3.addPluginObject('PluginMyTest', PluginMyTest)
    const result = await nako3.runAsync(code)
    assert.strictEqual(result.log, exRes)
  }
  const exe = async (/** @type {string} */ code) => {
    const nako3 = new NakoCompiler()
    nako3.addPluginObject('PluginMyTest', PluginMyTest)
    await nako3.runAsync(code)
  }

  // assert test
  it('アサート自体のテスト', async () => {
    await exe('3と3でテスト。')
    await cmp('3を表示', '3')
  })

  // --- async ---
  it('async_simple', async () => {
    await exe(
      '逐次実行\n' +
      '先に、1と表示\n' +
      '次に、2と表示\n' +
      '次に、表示ログと「1\n2\n」でテスト。\n' +
      'ここまで。\n'
    )
  })
  it('async_multiple', async () => {
    await exe(
      '逐次実行\n' +
      '先に\n' +
      '  1と表示\n' +
      '  2と表示\n' +
      'ここまで\n' +
      '次に、3と表示\n' +
      '次に、表示ログと「1\n2\n3\n」でテスト。\n' +
      'ここまで。\n'
    )
  })
  it('戻り値を使う', async () => {
    await exe(
      '逐次実行\n' +
      '先に、それは30\n' +
      '次に、それを表示\n' +
      '次に、表示ログと「30\n」でテスト。\n' +
      'ここまで。\n'
    )
  })
  it('同期タイマー', async () => {
    await exe(
      '逐次実行\n' +
      '先に、0.01秒待機\n' +
      '次に、30を表示\n' +
      '次に、表示ログと「30\n」でテスト。\n' +
      'ここまで。\n'
    )
  })
  it('連文 #373', async () => {
    await exe(
      '逐次実行\n' +
      '先に、30に5を足して表示\n' +
      '次に、表示ログと「35\n」でテスト。\n' +
      'ここまで。\n'
    )
  })
})
