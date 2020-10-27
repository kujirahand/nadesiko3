const assert = require('assert')
const NakoCompiler = require('../src/nako3')
describe('literal_test', () => {
  const nako = new NakoCompiler()
  nako.debug = false
  const cmp = (code, res) => {
    if (nako.debug) console.log('code=' + code)
    assert.equal(nako.runReset(code).log, res)
  }
  const err = (code) => {
    if (nako.debug) console.log('code=' + code)
    try {
      nako.runReset(code)
    } catch (error) {
      assert.ok(error)
      return
    }
    assert.fail()
  }
  // --- test ---
  it('非数', () => {
    cmp('0/0を表示', 'NaN')
    cmp('非数を表示', 'NaN')
  })
  it('無限大', () => {
    cmp('3/無限大を表示', 0)
  })
  describe('十進法のテスト', () => {
    //基本的に（整数部）（小数部）（指数部）です
    it('0', () => {
      cmp('０の変数型確認して表示', 'number')
      cmp('013+014を表示', '27') //javascriptとは違い0から始まる7以下の数字だけで構成される数は八進数ではなく十進数として解釈されます
    })
    it('小数点', () => {
      cmp('.11の変数型確認して表示', 'number') //小数点から始まっても数として解釈
      cmp('222.の変数型確認して表示', 'number') //逆に小数点で終わっても数として解釈
      err('123.$の変数型確認して表示') //しかしドットの後に定義されていない文字列をくっつけるとエラー
    })
    it('指数表記', () => {
      cmp('7e+8=7e8を表示', 'true') //指数表記の+は省略可能
      cmp('7.5e8の変数型確認して表示', 'number') //小数と組み合わせることもできる
      cmp('7.e8の変数型確認して表示', 'number') //もちろん小数部を省略しても数として解釈
    })
  })
  it('十六進法のテスト', () => {
    cmp('０ｘ１ｄｆの変数型確認して表示', 'number')
  })
  it('八進法のテスト', () => {
    cmp('0o157の変数型確認して表示', 'number')
  })
  it('二進法のテスト', () => {
    cmp('０ｂ１０１の変数型確認して表示', 'number')
  })
  it('数値区切文字', () => {
    cmp('12345_00=123_4500を表示', 'true') //区切り文字として「_」が使用できます
    cmp('12345_00=1_23_4500を表示', 'true') //数字の中でのどこでも使用できます
    err('1____23_4500を表示') //連続して使うことはできません
    cmp('_123を表示', 'undefined') //区切り文字で始めることはできません
    err('123_を表示') //区切り文字で終わらせることはできません
    cmp('0xCAFE_F00Dの変数型確認して表示', 'number') //十六進数でも
    cmp('0o123456_777の変数型確認して表示', 'number') //八進数でも
    cmp('0b1111_0000の変数型確認して表示', 'number') //二進数でも
    cmp('101_475_938.322_8の変数型確認して表示', 'number') //小数でも
    err('3_.1415の変数型確認して表示', 'number') //小数点等の標識の前後では区切り文字は使えません
    err('3e_1415の変数型確認して表示', 'number')
  })
})