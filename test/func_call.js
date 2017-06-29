const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('関数呼び出しテスト', () => {
  const nako = new NakoCompiler()
  // nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    assert.equal(nako.runReset(code).log, res)
  }
  // --- test ---
  it('関数式の呼び出し - 足す(2,3)を表示。', () => {
    cmp('足す(2,3)を表示。', '5')
  })
  it('四則演算を連文で', () => {
    cmp('1に2を足して3を掛けて3で割って2を引いて表示', '1')
  })
  it('「そう」のテスト', () => {
    cmp('３が１以上。もしそうならば「真」と表示。', '真')
  })
  it('後方で定義した関数を前方で使う1', () => {
    cmp('HOGE(3,4)を表示;●(A,B)HOGEとは、それはA+B;', '7')
    cmp('「姫」と「殿」が出会って表示;●(AとBが)出会うとは、それはA&B;', '姫殿')
  })
  it('後方で定義した関数を前方で使う2', () => {
    cmp('Nとは変数=30;HOGE(3,4)を表示;●(A,B)HOGEとは;それはA+B+N;', '37')
  })
  it('代入と表示', () => {
    cmp('A=今日;もし(今日=A)ならば「1」と表示', '1')
  })
  // ---
})
