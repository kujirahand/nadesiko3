const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('calc_test.js', () => {
  const nako = new NakoCompiler()
  // nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    assert.equal(nako.runReset(code).log, res)
  }

  it('basic', () => {
    cmp('3を表示', '3')
  })
  it('足し算', () => {
    cmp('3+5を表示', '8')
  })
  it('引き算', () => {
    cmp('10-5を表示。', '5')
    cmp('１０－５を表示。', '5')
  })
  it('掛け算', () => {
    cmp('1+2*3を表示', '7')
  })
  it('連続演算：して', () => {
    cmp('3に5を足して表示', '8')
  })
  it('連続演算：て-3に5を掛けて表示', () => {
    cmp('3に5を掛けて表示', '15')
  })
  it('配列', () => {
    cmp('a=[];a[1]=30;a[1]を表示', '30')
  })
  it('ネスト配列', () => {
    cmp('a=[[1,2,3], [4,5,6]];a[1][1]を表示', '5')
  })
  it('オブジェクト', () => {
    cmp('a={};a[\'a\']=30;a[\'a\']を表示', '30')
  })
  it('階乗', () => {
    cmp('2^3を表示', '8')
  })
  it('否定', () => {
    cmp('(!1)を表示', '0')
    cmp('(!0)を表示', '1')
    cmp('(!オン)を表示', '0')
    cmp('(!オフ)を表示', '1')
  })
  it('配列簡易記号', () => {
    cmp('A=[];A@0=5;A@0を表示', '5')
    cmp('A=[];A＠0=5;A＠1=6;AをJSONエンコードして表示', '[5,6]')
  })
})
