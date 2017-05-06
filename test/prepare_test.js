const assert = require('assert')
const NakoPrepare = require('../src/nako_prepare')

describe('prepare', () => {
  const p = new NakoPrepare()
  // --- test ---
  it('simple', () => {
    const a = p.convert('abc')
    assert.equal(a, 'abc')
    const b = p.convert('SRSR')
    assert.equal(b, 'SRSR')
  })
  it('simple-multibytes', () => {
    const a_ = '単語'
    const a = p.convert(a_)
    assert.equal(a, a_)
    const b_ = 'イカリ光'
    const b = p.convert(b_)
    assert.equal(b, b_)
    const c_ = 'A=50 ※ hogehoge\nAを表示'
    const c = p.convert(c_)
    assert.equal(c, c_)
  })
  it('convert num flag', () => {
    const a = p.convert('１２３')
    assert.equal(a, '123')
    const b = p.convert('あｂｃ')
    assert.equal(b, 'あbc')
  })
  it('str', () => {
    const a = p.convert('１２３「１２３」')
    assert.equal(a, '123「１２３」')
    const b = p.convert('１２３『１２３』１２３')
    assert.equal(b, '123『１２３』123')
  })
  it('str2', () => {
    const a = p.convert('１２３"１２３"１２３')
    assert.equal(a, '123"１２３"123')
    const b = p.convert('１２３\'１２３\'１２３')
    assert.equal(b, '123\'１２３\'123')
  })
  it('str3', () => {
    const a = p.convert('１２３S{{{１２３}}}１２３')
    assert.equal(a, '123S{{{１２３}}}123')
    const b = p.convert('１２３S{{{{{１２３}}}}}１２３')
    assert.equal(b, '123S{{{{{１２３}}}}}123')
  })
})
