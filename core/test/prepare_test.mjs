/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoPrepare } from '../src/nako_prepare.mjs'

// eslint-disable-next-line no-undef
describe('prepare', () => {
  const p = NakoPrepare.getInstance()

  const convert = (/** @type {string} */ code) => {
    // 変換してからソースマップを除く
    return p.convert(code).map((v) => v.text).join('')
  }

  // --- test ---
  it('simple', () => {
    const a = convert('abc')
    assert.strictEqual(a, 'abc')
    const b = convert('SRSR')
    assert.strictEqual(b, 'SRSR')
  })
  it('simple-multibytes', () => {
    const a_ = '単語'
    const a = convert(a_)
    assert.strictEqual(a, a_)
    const b_ = '牛乳|美貌|麦油|破棄'
    const b = convert(b_)
    assert.strictEqual(b, b_)
    const c_ = 'A=50 #hogehoge\nAを表示'
    const c = convert(c_)
    assert.strictEqual(c, c_)
  })
  it('convert num flag', () => {
    const a = convert('１２３')
    assert.strictEqual(a, '123')
    const b = convert('あｂｃ')
    assert.strictEqual(b, 'あbc')
  })
  it('str', () => {
    const a = convert('１２３「１２３」')
    assert.strictEqual(a, '123「１２３」')
    const b = convert('１２３『１２３』１２３')
    assert.strictEqual(b, '123『１２３』123')
    const c = convert('１２３“あいう”')
    assert.strictEqual(c, '123“あいう”')
    const d = convert('１２３“１２３”１２３')
    assert.strictEqual(d, '123“１２３”123')
  })
  it('str2', () => {
    const a = convert('１２３"１２３"１２３')
    assert.strictEqual(a, '123"１２３"123')
    const b = convert('１２３\'１２３\'１２３')
    assert.strictEqual(b, '123\'１２３\'123')
  })
  it('str3 - 全角を半角自動変換', () => {
    const d = convert('１２３"１２３"１２３')
    assert.strictEqual(d, '123"１２３"123')
    const c = convert('１２３\'１２３\'１２３')
    assert.strictEqual(c, '123\'１２３\'123')
  })
  it('str4 - 絵文字文字列 - 全角を半角自動変換', () => {
    const a = convert('１２３🌴１２３🌴１２３')
    assert.strictEqual(a, '123🌴１２３🌴123')
    const b = convert('１２３🌿１２３🌿１２３')
    assert.strictEqual(b, '123🌿１２３🌿123')
  })
  it('CR+LF1', () => {
    const a = convert('123\r\n456\r789')
    assert.strictEqual(a, '123\n456\n789')
    const b = convert('123_ \r\n456 \n789')
    assert.strictEqual(b, '123_ \n456 \n789')
  })
  it('CR+LF2', () => {
    const a = convert('A= 1 + _ \r\n1 + 2  \nAを表示')
    assert.strictEqual(a, 'A= 1 + _ \n1 + 2  \nAを表示')
  })
  it('Multibyte Flag to Singlebyte Flag', () => {
    const a = convert('！＄１２３４５＃')
    assert.strictEqual(a, '!$12345#\n')
  })
  it('convertTable', () => {
    const a = convert('123※456')
    assert.strictEqual(a, '123#456\n') // #はコメント扱い
    const b = convert('123、456。') // 読点はカンマに変換 (#276)あらため(#877)
    assert.strictEqual(b, '123,456;')
  })
  it('「，．」を「、。」として扱う(#735)', () => {
    const a = convert('３．１４')
    assert.strictEqual(a, '3.14')
    const b = convert('，')
    assert.strictEqual(b, ',')
  })
  it('複数行コメント内にある文字列記号でエラーになる問題(#731)', () => {
    const a = convert('/* " */')
    assert.strictEqual(a, '/* " */')
  })
})
