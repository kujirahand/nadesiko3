const assert = require('assert')
const NakoPrepare = require('../src/nako_prepare')

describe('prepare', () => {
  const p = new NakoPrepare()

  const convert = (code) => {
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
  it('CR+LF2', () => {    const a = convert('A= 1 + _ \r\n1 + 2  \nAを表示')
    assert.strictEqual(a, 'A= 1 + _ \n1 + 2  \nAを表示')
  })
  it('Multibyte Flag to Singlebyte Flag', () => {
    const a = convert('！＄１２３４５＃')
    assert.strictEqual(a, '!$12345#\n')
  })
  it('convertTable', () => {
    const a = convert('123※456')
    assert.strictEqual(a, '123#456\n') // #はコメント扱い
    const b = convert('123、456。') // 読点は変換しない方針に (#276)
    assert.strictEqual(b, '123、456;')
  })
  it('「，．」を「、。」として扱う(#735)', () => {
    const a = convert('３．１４')
    assert.strictEqual(a, '3.14')
    const b = convert('，')
    assert.strictEqual(b, '、')
  })
  it('リンゴの値段→__リンゴ_的_値段__', () => {
    // 「AのB=C」のような場合置換する (#631)
    const a = convert('リンゴの値段は300')
    assert.strictEqual(a, '__リンゴ_的_値段__は300')
    // 文字列の中は置換しない
    const b = convert('S=「リンゴの値段」')
    assert.strictEqual(b, 'S=「リンゴの値段」')
    // 「定数のN=30」のような場合は置換しない
    const c = convert('定数のN=30')
    assert.strictEqual(c, '定数のN=30')
  })
  it('複数行コメント内にある文字列記号でエラーになる問題(#731)', () => {
    const a = convert('/* " */')
    assert.strictEqual(a, '/* " */')
  })
  it('ソースマップ - 置換によって文字数が増える場合', () => {
    // 「リンゴの値段は30」 -> 「__リンゴ_的_値段__は30」
    // 出力の文字数は15文字だから、15要素の配列が出力される。（各文字の左端の位置を表す。）
    // 入力の文字数は9だから、最後の要素は8。（1文字目の左端は0、2文字目の左端は1、...となるため。）
    // 置換された文字列は、最後の文字以外を左端、それ以外を (最後の文字 - 1) へマップする。
    assert.deepStrictEqual(
      p.convert('リンゴの値段は30').map((v) => v.sourcePosition),
      [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, // __リンゴ_的_値段__
        6, // は
        7, // 3
        8, // 0
      ],
    )
  })
})
