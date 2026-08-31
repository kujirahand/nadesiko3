// @ts-nocheck
/* eslint-disable no-undef */
import assert from 'assert'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import { NakoSyntaxError, NakoRuntimeError, NakoIndentError, NakoLexerError } from '../../core/src/nako_errors.mjs'
import { CNako3 } from '../../src/cnako3mod.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// eslint-disable-next-line no-undef
describe('error_message', () => {
  const nako = new NakoCompiler()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  /**
   * エラーメッセージがresArrの全ての要素を含むことを確認する。
   */
  const cmp = async (/** @type {string} */ code, /** @type {string[]} */ resArr, /** @type {typeof NakoLexerError} */ ErrorClass, _nako = nako) => {
    _nako.logger.debug('code=' + code)
    await assert.rejects(
      async () => await _nako.runAsync(code, path.join(__dirname, 'main.nako3')),
      (err) => {
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
    it('エラー位置の取得', async () => {
      await cmp('\n「こんに{ちは」と表示する', [
        '2行目',
        'main.nako3'
      ], NakoLexerError)
    })
  })

  describe('構文エラー', () => {
    it('比較', async () => {
      await cmp('「こんにち」はを表示', [
        '不完全な文です。',
        '演算子『＝』が解決していません。',
        '演算子『＝』は『文字列『こんにち』と単語『を表示』が等しいかどうかの比較』として使われています。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('単項演算子', async () => {
      await cmp('!(はい + 1)', [
        '不完全な文です。',
        '演算子『not』が解決していません。',
        '演算子『not』は『演算子『+』に演算子『not』を適用した式』として使われています。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('2項演算子', async () => {
      await cmp('1 + 2', [
        '不完全な文です。',
        '演算子『+』が解決していません。',
        '演算子『+』は『数値1と数値2に演算子『+』を適用した式』として使われています。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('変数のみの式', async () => {
      await cmp('A', [
        '不完全な文です。',
        '単語『A』が解決していません。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('複数のノードが使われていない場合', async () => {
      await cmp('あ「こんにちは」はは表示', [
        '不完全な文です。',
        '単語『あ』、演算子『＝』が解決していません。',
        '演算子『＝』は『文字列『こんにちは』と単語『は表示』が等しいかどうかの比較』として使われています。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('関数の宣言でエラー', async () => {
      await cmp('●30とは', [
        '関数30の宣言でエラー。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('依存ファイルにエラーがある場合', async () => {
      await cmp('!「./syntax_error.nako3」を取り込む\n1を表示', [
        'syntax_error.nako3',
        '2行目'
      ], NakoSyntaxError, new CNako3())
    })
    it('"_"がある場合', async () => {
      await cmp(
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
    it('「エラー発生」の場合', async () => {
      await cmp(
        '「エラーメッセージ」のエラー発生', [
          '1行目'
        ], NakoRuntimeError)
    })
    it('依存ファイルでエラーが発生した場合', async () => {
      await cmp('!「./runtime_error.nako3」を取り込む\n1を表示', [
        'runtime_error.nako3',
        '2行目'
      ], NakoRuntimeError, new CNako3())
    })
    it('エラー位置をプロパティから取得 - 単純な例', () => {
      assert.throws(
        () => nako.run('1を表示\n1のエラー発生', 'main.nako3'),
        err => {
          assert.strictEqual(err.type, 'NakoRuntimeError')
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
          assert.strictEqual(err.type, 'NakoRuntimeError')
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
          assert.strictEqual(err.type, 'NakoRuntimeError')
          assert.strictEqual(err.line, 0) // 1行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
    it('エラー位置をプロパティから取得 - repeatTimes', () => {
      const nako = new NakoCompiler()
      assert.throws(
        () => nako.run('3回\n1のエラー発生\nここまで', 'main.nako3'),
        err => {
          assert.strictEqual(err.type, 'NakoRuntimeError')
          assert.strictEqual(err.line, 1) // 2行目
          assert.strictEqual(err.file, 'main.nako3')
          return true
        }
      )
    })
    it('「秒後」の中でエラーが発生した場合', async () => {
      const nako = new NakoCompiler()
      const logger = nako.getLogger()
      logger.addListener('error', ({ level, noColor }) => {
        const s = (noColor + '\n').split('\n')[0]
        assert.strictEqual(level, 'error')
        assert.strictEqual(s, '[実行時エラー]main.nako3(2行目): 1')
      })
      await nako.runAsync('0.0001秒後には\n1のエラー発生\nここまで', 'main.nako3')
    })
    it('JavaScriptのみで動くコードの場合 - エラー発生', async function () {
      if (process.env.NODE_ENV === 'test') { return this.skip() }
      const nako = new NakoCompiler()
      const code = nako.compileStandalone('10のエラー発生')
      const silent = 'const console = { error: () => {}, warn: () => {}, log: () => {} };\n'
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nadesiko3-standalone-'))
      try {
        await fs.cp(path.join(__dirname, '../../core/src'), path.join(tempDir, 'nako3runtime'), { recursive: true })
        const mainFile = path.join(tempDir, 'main.mjs')
        await fs.writeFile(mainFile, silent + code)
        await assert.rejects(
          async () => await import(pathToFileURL(mainFile).href),
          (err) => {
            assert.strictEqual(err.message.split('\n')[0], '[実行時エラー]main.nako3(1行目): 10')
            return true
          }
        )
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true })
      }
    })
  })
  describe('インデント構文のエラー', () => {
    it('『ここまで』を使用', async () => {
      await cmp(
        '！インデント構文\n' +
        'もしはいならば\n' +
        'ここまで\n', [
          '3行目',
          'main.nako3',
          'インデント構文が有効化されているときに『ここまで』を使うことはできません。'
        ], NakoIndentError)
    })
    it('『ここまで』を使用 - "_"を使った場合', async () => {
      await cmp(
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
    it('未定義の変数を参照したとき', async () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor })
      await compiler.runAsync('!厳しくチェック;xを表示', 'main.nako3')
      assert.strictEqual(log.split('。')[0], '[警告]main.nako3(1行目): 変数『x』は定義されていません')
    })
    it('関数の引数にundefinedを与えたとき', async () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor })
      await compiler.runAsync('!厳しくチェック;undefinedを表示', 'main.nako3')
      assert.strictEqual(log.split('。')[0], '[警告]main.nako3(1行目): 命令『表示』の引数にundefinedを渡しています')
    })
    it('存在しない高速化オプションを指定したとき', async () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor })
      await compiler.runAsync('「あ」で実行速度優先\nここまで', 'main.nako3')
      assert.strictEqual(log, '[警告]main.nako3(1行目): 実行速度優先文のオプション『あ』は存在しません。')
    })
    it('ユーザー定義関数を上書きしたとき', async () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor }, false)
      await compiler.runAsync('●Aとは\nここまで\n●Aとは\nここまで', 'main.nako3')
      assert.strictEqual(log, '[警告]main.nako3(3行目): 関数『A』は既に定義されています。')
    })
    it('プラグイン関数を上書きしたとき', async () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor }, false)
      await compiler.runAsync('●（Aを）足すとは\nここまで', 'main.nako3')
      // 上記は「main::足す」という関数を定義したことになる
      // assert.strictEqual(log, '[警告]main.nako3(1行目): 関数『足』は既に定義されています。')
      assert.strictEqual(log, '')
    })
  })
})
