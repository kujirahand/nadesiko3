const assert = require('assert')
const NakoCompiler = require('../src/nako3')
const { NakoSyntaxError, NakoRuntimeError, NakoIndentError, LexErrorWithSourceMap } = require('../src/nako_errors')

describe('error_message', () => {
  const nako = new NakoCompiler()
  // nako.debug = true;

  /**
   * エラーメッセージがresArrの全ての要素を含むことを確認する。
   */
  const cmp = (code, resArr, ErrorClass) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    assert.throws(
      () => nako.runReset(code, 'main.nako3'),
      err => {
        assert(err instanceof ErrorClass)
        for (const res of resArr) {
          if (!err.message.includes(res)) {
            throw new Error(`${JSON.stringify(err.message)} が ${JSON.stringify(res)} を含みません。`)
          }
        }
        return true
      }
    )
  }

  describe('字句解析エラー', () => {
    it('エラー位置の取得', () => {
      cmp(`\n「こんに{ちは」と表示する`, [
        '2行目',
        'main.nako3',
      ], LexErrorWithSourceMap)
    })
  })

  describe('構文エラー', () => {
    it('比較', () => {
      cmp('「こんにち」はを表示', [
        '不完全な文です。',
        '演算子『＝』が解決していません。',
        '演算子『＝』は『文字列『こんにち』と単語『を表示』が等しいかどうかの比較』として使われています。',
        'main.nako3',
      ], NakoSyntaxError)
    })
    it('単項演算子', () => {
      cmp('!(はい + 1)', [
        '不完全な文です。',
        '演算子『not』が解決していません。',
        '演算子『not』は『演算子『+』に演算子『not』を適用した式』として使われています。',
        'main.nako3',
      ], NakoSyntaxError)
    })
    it('2項演算子', () => {
      cmp('1 + 2', [
        '不完全な文です。',
        '演算子『+』が解決していません。',
        '演算子『+』は『数値1と数値2に演算子『+』を適用した式』として使われています。',
        'main.nako3',
      ], NakoSyntaxError)
    })
    it('変数のみの式', () => {
      cmp('A', [
        '不完全な文です。',
        '単語『A』が解決していません。',
        'main.nako3',
      ], NakoSyntaxError)
    })
    it('複数のノードが使われていない場合', () => {
      cmp('あ「こんにちは」はは表示', [
        '不完全な文です。',
        '単語『あ』、演算子『＝』が解決していません。',
        '演算子『＝』は『文字列『こんにちは』と単語『は表示』が等しいかどうかの比較』として使われています。',
        'main.nako3',
      ], NakoSyntaxError)
    })
    it('関数の宣言でエラー', () => {
      cmp('●30とは', [
        '関数30の宣言でエラー。',
        'main.nako3',
      ], NakoSyntaxError)
    })
    it('依存ファイルにエラーがある場合', () => {
      nako.dependencies = { 'dependent.nako3': { content: '\na', alias: new Set(['dependent.nako3']), addPluginFile: () => {} } }
      cmp('!「dependent.nako3」を取り込む\n1を表示', [
        'dependent.nako3',
        '2行目',
      ], NakoSyntaxError)
    })
    it('"_"がある場合', () => {
      cmp(
        `a = [ _\n` +
        `    1, 2, 3\n` +
        `]\n` +
        `「こんにちは」」と表示する`, [
          '4行目',
          'main.nako3'
        ], NakoSyntaxError
      )
    })
  })
  describe('実行時エラー', () => {
    it('「エラー発生」の場合', () => {
      cmp(
        '「エラーメッセージ」のエラー発生', [
        '関数『エラー発生』でエラー『エラーメッセージ』が発生しました。',
      ], NakoRuntimeError)
    })
    it('依存ファイルでエラーが発生した場合', () => {
      nako.dependencies = { 'dependent.nako3': { content: '\n1のエラー発生\n', alias: new Set(['dependent.nako3']), addPluginFile: () => {} } }
      cmp('!「dependent.nako3」を取り込む\n1を表示', [
        'dependent.nako3',
        '2行目',
      ], NakoRuntimeError)
    })
    it('エラー位置をプロパティから取得 - 単純な例', () => {
      assert.throws(
        () => nako.runReset('1を表示\n1のエラー発生', 'main.nako3'),
        err => {
          assert(err instanceof NakoRuntimeError)
          assert.strictEqual(err.line, 1)  // 2行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
    it('エラー位置をプロパティから取得 - 前後に文がある場合', () => {
      assert.throws(
        () => nako.runReset('1を表示\n1を表示。1のエラー発生。1を表示。', 'main.nako3'),
        err => {
          assert(err instanceof NakoRuntimeError)
          assert.strictEqual(err.line, 1)  // 2行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
    it('エラー位置をプロパティから取得 - 1行目の場合', () => {
      assert.throws(
        () => nako.runReset('1のエラー発生', 'main.nako3'),
        err => {
          assert(err instanceof NakoRuntimeError)
          assert.strictEqual(err.line, 0)  // 1行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
    it('エラー位置をプロパティから取得 - repeatTimes', () => {
      assert.throws(
        () => nako.runReset('3回\n1のエラー発生', 'main.nako3'),
        err => {
          assert(err instanceof NakoRuntimeError)
          assert.strictEqual(err.line, 1)  // 2行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
  })
  describe('インデント構文のエラー', () => {
    it('『ここまで』を使用', () => {
      cmp(
        '！インデント構文\n' +
        'もしはいならば\n' +
        'ここまで\n', [
        '3行目',
        'main.nako3',
        'インデント構文が有効化されているときに『ここまで』を使うことはできません。'
      ], NakoIndentError)
    })
    it('『ここまで』を使用 - "_"を使った場合', () => {
      cmp(
        '！インデント構文\n' +
        'A=[ _\n' +
        ']\n' +
        'ここまで\n', [
          '4行目',
          'main.nako3',
        ], NakoIndentError)
    })
  })
})
