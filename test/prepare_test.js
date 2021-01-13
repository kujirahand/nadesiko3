const assert = require('assert')
const NakoPrepare = require('../src/nako_prepare')

describe('prepare', () => {
  const p = new NakoPrepare()
  // --- test ---
  it('simple', () => {
    const a = p.convert('abc')
    assert.strictEqual(a, 'abc')
    const b = p.convert('SRSR')
    assert.strictEqual(b, 'SRSR')
  })
  it('simple-multibytes', () => {
    const a_ = '単語'
    const a = p.convert(a_)
    assert.strictEqual(a, a_)
    const b_ = '牛乳|美貌|麦油|破棄'
    const b = p.convert(b_)
    assert.strictEqual(b, b_)
    const c_ = 'A=50 #hogehoge\nAを表示'
    const c = p.convert(c_)
    assert.strictEqual(c, c_)
  })
  it('convert num flag', () => {
    const a = p.convert('１２３')
    assert.strictEqual(a, '123')
    const b = p.convert('あｂｃ')
    assert.strictEqual(b, 'あbc')
  })
  it('str', () => {
    const a = p.convert('１２３「１２３」')
    assert.strictEqual(a, '123「１２３」')
    const b = p.convert('１２３『１２３』１２３')
    assert.strictEqual(b, '123『１２３』123')
    const c = p.convert('１２３“あいう”')
    assert.strictEqual(c, '123“あいう”')
    const d = p.convert('１２３“１２３”１２３')
    assert.strictEqual(d, '123“１２３”123')
  })
  it('str2', () => {
    const a = p.convert('１２３"１２３"１２３')
    assert.strictEqual(a, '123"１２３"123')
    const b = p.convert('１２３\'１２３\'１２３')
    assert.strictEqual(b, '123\'１２３\'123')
  })
  it('str3 - 全角を半角自動変換', () => {
    const d = p.convert('１２３"１２３"１２３')
    assert.strictEqual(d, '123"１２３"123')
    const c = p.convert('１２３\'１２３\'１２３')
    assert.strictEqual(c, '123\'１２３\'123')
  })
  it('str4 - 絵文字文字列 - 全角を半角自動変換', () => {
    const a = p.convert('１２３🌴１２３🌴１２３')
    assert.strictEqual(a, '123🌴１２３🌴123')
    const b = p.convert('１２３🌿１２３🌿１２３')
    assert.strictEqual(b, '123🌿１２３🌿123')
  })
  it('CR+LF1', () => {
    const a = p.convert('123\r\n456\r789')
    assert.strictEqual(a, '123\n456\n789')
    const b = p.convert('123_ \r\n456 \n789')
    assert.strictEqual(b, '123_ \n456 \n789')
  })
  it('CR+LF2', () => {    const a = p.convert('A= 1 + _ \r\n1 + 2  \nAを表示')
    assert.strictEqual(a, 'A= 1 + _ \n1 + 2  \nAを表示')
  })
  it('Multibyte Flag to Singlebyte Flag', () => {
    const a = p.convert('！＄１２３４５＃')
    assert.strictEqual(a, '!$12345#\n')
  })
  it('convertTable', () => {
    const a = p.convert('123※456')
    assert.strictEqual(a, '123#456\n') // #はコメント扱い
    const b = p.convert('123、456。') // 読点は変換しない方針に (#276)
    assert.strictEqual(b, '123、456;')
  })
  it('「，．」を「、。」として扱う(#735)', () => {
    const a = p.convert('，．')
    assert.strictEqual(a, '、;')
  })
  it('リンゴの値段→__リンゴ_的_値段__', () => {
    // 「AのB=C」のような場合置換する (#631)
    const a = p.convert('リンゴの値段は300')
    assert.strictEqual(a, '__リンゴ_的_値段__は300')
    // 文字列の中は置換しない
    const b = p.convert('S=「リンゴの値段」')
    assert.strictEqual(b, 'S=「リンゴの値段」')
    // 「定数のN=30」のような場合は置換しない
    const c = p.convert('定数のN=30')
    assert.strictEqual(c, '定数のN=30')
  })
})
