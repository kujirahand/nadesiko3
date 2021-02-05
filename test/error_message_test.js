const assert = require('assert')
const NakoCompiler = require('../src/nako3')
const NakoSyntaxError = require('../src/nako_syntax_error')

describe('error_message', () => {
  const nako = new NakoCompiler()
  // nako.debug = true;

  /**
   * エラーメッセージがresArrの全ての要素を含むことを確認する。
   */
  const cmp = (code, resArr) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    assert.throws(
      () => nako.runReset(code),
      err => {
        console.log(err)
        assert(err instanceof NakoSyntaxError)
        for (const res of resArr) {
          if (err.message.indexOf(res) === -1) {
            throw new Error(`${JSON.stringify(err.message)} が ${JSON.stringify(res)} を含みません。`)
          }
        }
        return true
      }
    )
  }
  it('比較', () => {
    cmp('「こんにち」はを表示', [
      '不完全な文です。',
      '演算子『＝』が解決していません。',
      '演算子『＝』は『文字列『こんにち』と単語『を表示』が等しいかどうかの比較』として使われています。',
    ])
  })
  it('単項演算子', () => {
    cmp('!(はい + 1)', [
      '不完全な文です。',
      '演算子『not』が解決していません。',
      '演算子『not』は『演算子『+』に演算子『not』を適用した式』として使われています。',
    ])
  })
  it('2項演算子', () => {
    cmp('1 + 2', [
      '不完全な文です。',
      '演算子『+』が解決していません。',
      '演算子『+』は『数値1と数値2に演算子『+』を適用した式』として使われています。',
    ])
  })
  it('変数のみの式', () => {
    cmp('A', [
      '不完全な文です。',
      '単語『A』が解決していません。',
    ])
  })
  it('複数のノードが使われていない場合', () => {
    cmp('あ「こんにちは」はは表示', [
      '不完全な文です。',
      '単語『あ』、演算子『＝』が解決していません。',
      '演算子『＝』は『文字列『こんにちは』と単語『は表示』が等しいかどうかの比較』として使われています。',
    ])
  })
})
