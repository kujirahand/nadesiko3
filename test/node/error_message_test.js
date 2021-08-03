const assert = require('assert')
const path = require('path')
const CNako3 = require('../../src/cnako3')
const NakoCompiler = require('../../src/nako3')
const { NakoSyntaxError, NakoRuntimeError, NakoIndentError, NakoLexerError } = require('../../src/nako_errors')

describe('error_message', () => {
  const nako = new NakoCompiler()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  /**
   * エラーメッセージがresArrの全ての要素を含むことを確認する。
   */
  const cmp = (code, resArr, ErrorClass, _nako = nako) => {
    _nako.logger.debug('code=' + code)
    assert.throws(
      () => _nako.run(code, path.join(__dirname, 'main.nako3')),
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
      cmp('\n「こんに{ちは」と表示する', [
        '2行目',
        'main.nako3'
      ], NakoLexerError)
    })
  })

  describe('構文エラー', () => {
    it('比較', () => {
      cmp('「こんにち」はを表示', [
        '不完全な文です。',
        '演算子『＝』が解決していません。',
        '演算子『＝』は『文字列『こんにち』と単語『を表示』が等しいかどうかの比較』として使われています。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('単項演算子', () => {
      cmp('!(はい + 1)', [
        '不完全な文です。',
        '演算子『not』が解決していません。',
        '演算子『not』は『演算子『+』に演算子『not』を適用した式』として使われています。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('2項演算子', () => {
      cmp('1 + 2', [
        '不完全な文です。',
        '演算子『+』が解決していません。',
        '演算子『+』は『数値1と数値2に演算子『+』を適用した式』として使われています。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('変数のみの式', () => {
      cmp('A', [
        '不完全な文です。',
        '単語『A』が解決していません。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('複数のノードが使われていない場合', () => {
      cmp('あ「こんにちは」はは表示', [
        '不完全な文です。',
        '単語『あ』、演算子『＝』が解決していません。',
        '演算子『＝』は『文字列『こんにちは』と単語『は表示』が等しいかどうかの比較』として使われています。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('関数の宣言でエラー', () => {
      cmp('●30とは', [
        '関数30の宣言でエラー。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('依存ファイルにエラーがある場合', () => {
      cmp('!「./syntax_error.nako3」を取り込む\n1を表示', [
        'syntax_error.nako3',
        '2行目'
      ], NakoSyntaxError, new CNako3())
    })
    it('"_"がある場合', () => {
      cmp(
        'a = [ _\n' +
        '    1, 2, 3\n' +
        ']\n' +
        '「こんにちは」」と表示する', [
          '4行目',
          'main.nako3'
        ], NakoLexerError
      )
    })
  })
  describe('実行時エラー', () => {
    it('「エラー発生」の場合', () => {
      cmp(
        '「エラーメッセージ」のエラー発生', [
          '1行目'
        ], NakoRuntimeError)
    })
    it('依存ファイルでエラーが発生した場合', () => {
      cmp('!「./runtime_error.nako3」を取り込む\n1を表示', [
        'runtime_error.nako3',
        '2行目'
      ], NakoRuntimeError, new CNako3())
    })
    it('エラー位置をプロパティから取得 - 単純な例', () => {
      assert.throws(
        () => nako.run('1を表示\n1のエラー発生', 'main.nako3'),
        err => {
          assert(err instanceof NakoRuntimeError)
          assert.strictEqual(err.line, 1) // 2行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
    it('エラー位置をプロパティから取得 - 前後に文がある場合', () => {
      assert.throws(
        () => nako.run('1を表示\n1を表示。1のエラー発生。1を表示。', 'main.nako3'),
        err => {
          assert(err instanceof NakoRuntimeError)
          assert.strictEqual(err.line, 1) // 2行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
    it('エラー位置をプロパティから取得 - 1行目の場合', () => {
      assert.throws(
        () => nako.run('1のエラー発生', 'main.nako3'),
        err => {
          assert(err instanceof NakoRuntimeError)
          assert.strictEqual(err.line, 0) // 1行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
    it('エラー位置をプロパティから取得 - repeatTimes', () => {
      assert.throws(
        () => nako.run('3回\n1のエラー発生\nここまで', 'main.nako3'),
        err => {
          assert(err instanceof NakoRuntimeError)
          assert.strictEqual(err.line, 1) // 2行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
    it('「秒後」の中でエラーが発生した場合', (done) => {
      const nako = new NakoCompiler()
      const logger = nako.run('0.0001秒後には\n1のエラー発生\nここまで', 'main.nako3').logger
      logger.addListener('error', ({ level, noColor }) => {
        assert.strictEqual(level, 'error')
        assert.strictEqual(noColor, '[実行時エラー]main.nako3(2行目): エラー『1』が発生しました。')
        done()
      })
    })
    it('JavaScriptのみで動くコードの場合 - エラー発生', function () {
      if (process.env.NODE_ENV === 'test') { return this.skip() }
      const nako = new NakoCompiler()
      const code = nako.compileStandalone('10のエラー発生')
      const silent = 'const console = { error() {} };\n'
      assert.throws(
        () => new Function(silent + code)(),
        (err) => {
          assert.strictEqual(err.message.split('\n')[0], '[実行時エラー](1行目): エラー『10』が発生しました。')
          return true
        }
      )
    })
    it('JavaScriptのみで動くコードの場合 - 「秒後」内の場合', function (done) {
      if (process.env.NODE_ENV === 'test') { return this.skip() }
      const nako = new NakoCompiler()
      new Function('const console = { error: this.callback };\n' + nako.compileStandalone('0.0001秒後には\n20のエラー発生\nここまで')).apply({
        callback: (err) => {
          assert.strictEqual(err.message.split('\n')[0], '[実行時エラー](2行目): エラー『20』が発生しました。')
          done()
        }
      })
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
          'main.nako3'
        ], NakoIndentError)
    })
  })
  describe('警告の表示', () => {
    it('未定義の変数を参照したとき', () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor }, false)
      compiler.run('xを表示', 'main.nako3')
      assert.strictEqual(log, '[警告]main.nako3(1行目): 変数『x』は定義されていません。')
    })
    it('存在しない高速化オプションを指定したとき', () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor }, false)
      compiler.run('「あ」で実行速度優先\nここまで', 'main.nako3')
      assert.strictEqual(log, '[警告]main.nako3(1行目): 実行速度優先文のオプション『あ』は存在しません。')
    })
    it('ユーザー定義関数を上書きしたとき', () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor }, false)
      compiler.run('●Aとは\nここまで\n●Aとは\nここまで', 'main.nako3')
      assert.strictEqual(log, '[警告]main.nako3(3行目): 関数『A』は既に定義されています。')
    })
    it('プラグイン関数を上書きしたとき', () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor }, false)
      compiler.run('●（Aを）足すとは\nここまで', 'main.nako3')
      assert.strictEqual(log, '[警告]main.nako3(1行目): 関数『足』は既に定義されています。')
    })
  })
})
