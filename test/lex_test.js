const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('lex_test', () => {
  const nako = new NakoCompiler()
  nako.debug = false
  const cmp = (code, res) => {
    if (nako.debug)
      console.log('code=' + code)
    
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
  it('範囲コメントの処理', () => {
    cmp('1を表示\n/*2を表示\n3を表示\n*/\n4を表示\n', '1\n4')
  })
  it('文字列の埋め込み語句のかな省略', () => {
    cmp('見出し=30;「--{見出}--」を表示', '--30--')
  })
  it('文字列の埋め込み変数名全角英数字', () => {
    cmp('N1=30;「--{Ｎ１}--」を表示', '--30--')
  })
  it('文字列の埋め込み配列', () => {
    cmp('手説明＝["グー","チョキ","パー"];「自分は{手説明@1}、相手は{手説明@0}」と表示', '自分はチョキ、相手はグー')
  })
  it('はい/いいえ', () => {
    cmp('はいを表示', '1')
    cmp('いいえを表示', '0')
  })
})
