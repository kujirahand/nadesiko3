const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('lex_test', () => {
  const nako = new NakoCompiler()
  // nako.debug = true
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    assert.equal(nako.runReset(code).log, res)
  }
  // --- test ---
  it('送り仮名の省略テスト', () => {
    cmp('『abc』の『a』を「*」に置換。表示', '*bc')
    cmp('『abc』の『a』を「*」に置換します。それを表示', '*bc')
    cmp('『abc』の『a』を「*」に置換しろ。表示しろ。', '*bc')
  })
  it('仮名表記の曖昧', () => {
    cmp('『abc』の『a』を「*」に置き換え。表示', '*bc')
  })
  it('文字列の埋め込み語句のかな省略', () => {
    cmp('見出し=30;「--{見出し}--」を表示', '--30--')
  })
})
