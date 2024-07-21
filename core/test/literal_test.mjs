/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('literal_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  const err = async (/** @type {string} */ code) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    try {
      await nako.runAsync(code)
    } catch (error) {
      assert.ok(error)
      return
    }
    assert.fail()
  }
  // --- test ---
  it('非数', async () => {
    await cmp('0/0を表示', 'NaN')
    await cmp('非数を表示', 'NaN')
  })
  it('無限大', async () => {
    await cmp('3/無限大を表示', '0')
  })
  describe('十進法のテスト', async () => {
    // 基本的に（整数部）（小数部）（指数部）です
    it('0', async () => {
      await cmp('０の変数型確認して表示', 'number')
      await cmp('013+014を表示', '27') // javascriptとは違い0から始まる7以下の数字だけで構成される数は八進数ではなく十進数として解釈されます
    })
    it('小数点', async () => {
      await cmp('.11の変数型確認して表示', 'number') // 小数点から始まっても数として解釈
      await cmp('222.の変数型確認して表示', 'number') // 逆に小数点で終わっても数として解釈
      err('123.$の変数型確認して表示') // しかしドットの後に定義されていない文字列をくっつけるとエラー
    })
    it('指数表記', async () => {
      await cmp('7e+8=7e8を表示', 'true') // 指数表記の+は省略可能
      await cmp('7.5e8の変数型確認して表示', 'number') // 小数と組み合わせることもできる
      await cmp('7.e8の変数型確認して表示', 'number') // もちろん小数部を省略しても数として解釈
    })
  })
  it('十六進法のテスト', async () => {
    await cmp('０ｘ１ｄｆの変数型確認して表示', 'number')
  })
  it('八進法のテスト', async () => {
    await cmp('0o157の変数型確認して表示', 'number')
  })
  it('二進法のテスト', async () => {
    await cmp('０ｂ１０１の変数型確認して表示', 'number')
  })
  it('数値区切文字', async () => {
    await cmp('12345_00=123_4500を表示', 'true') // 区切り文字として「_」が使用できます
    await cmp('12345_00=1_23_4500を表示', 'true') // 数字の中でのどこでも使用できます
    err('1____23_4500を表示') // 連続して使うことはできません
    await cmp('_123を表示', 'undefined') // 区切り文字で始めることはできません（定義されていない変数「_123」の参照）
    err('123_を表示') // 区切り文字で終わらせることはできません
    await cmp('0xCAFE_F00Dの変数型確認して表示', 'number') // 十六進数でも
    await cmp('0o123456_777の変数型確認して表示', 'number') // 八進数でも
    await cmp('0b1111_0000の変数型確認して表示', 'number') // 二進数でも
    await cmp('101_475_938.322_8の変数型確認して表示', 'number') // 小数でも
    err('3_.1415の変数型確認して表示') // 小数点等の標識の前後では区切り文字は使えません
    err('3e_1415の変数型確認して表示')
  })
  it('単位のテスト #994', async () => {
    await cmp('30kgを表示', '30')
    await cmp('A=100円;Aを表示', '100')
    await cmp('B=300㎡;B=B+1㎡;Bを表示', '301')
  })
  it('bigintのテスト', async () => {
    await cmp('123456789nの変数型確認して表示', 'bigint')
    await cmp('-123456789nの変数型確認して表示', 'bigint')
    await cmp('0x123456789ABCDEFnの変数型確認して表示', 'bigint')
    await cmp('-0x123456789ABCDEFnの変数型確認して表示', 'bigint')
    await cmp('0x123456789nの変数型確認して表示', 'bigint')
    await cmp('-0x123456789nの変数型確認して表示', 'bigint')
    await cmp('0o1234567nの変数型確認して表示', 'bigint')
    await cmp('-0o1234567nの変数型確認して表示', 'bigint')
    await cmp('0b10111010110nの変数型確認して表示', 'bigint')
    await cmp('-0b10111010110nの変数型確認して表示', 'bigint')
    await cmp('123_456_789nの変数型確認して表示', 'bigint')
  })
})
