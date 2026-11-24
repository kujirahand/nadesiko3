/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import { NakoCompiler } from '../src/nako3.mjs'
import { NakoSyntaxError, NakoRuntimeError, NakoIndentError, NakoLexerError } from '../src/nako_errors.mjs'
import assert from 'assert'

// eslint-disable-next-line no-undef
describe('error_message', () => {
  const nako = new NakoCompiler()
  const cmp = (/** @type {string} */ code, /** @type {string[]} */ resArr, /** @type {typeof NakoLexerError} */ ErrorClass, _nako = nako) => {
    _nako.reset()
    _nako.logger.debug('code=' + code)
    assert.throws(
      () => _nako.runSync(code, 'main.nako3'),
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
    it('エラー位置の取得', () => {
      cmp('\n「こんに{ちは」と表示する', [
        '2行目',
        'main.nako3'
      ], NakoLexerError)
    })
  })

  describe('構文エラー', () => {
    it('比較', () => {
      return cmp('「こんにち」はを表示', [
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
    it('配列の要素を区切るカンマの書き忘れ (#2436)', () => {
      cmp('A=[[0,0,0,0][0,0,0,0]]', [
        '配列の直後にある『[...]』を配列アクセスとして解析できません。',
        '配列の要素を区切る『,』(カンマ)を忘れていませんか。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('配列の直後の不正なプロパティ指定 (#2436)', () => {
      cmp('A=[]$', [
        '配列の直後にある『$プロパティ』の指定が不正です。',
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
    it('プロパティ参照が未解決のとき内部型名ではなくソース表記で表示する (#2692)', () => {
      cmp('ホゲは{hoge:1}。ホゲ$hoge', [
        '不完全な文です。',
        'プロパティ参照『ホゲ$hoge』が解決していません。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('配列参照が未解決のとき内部型名ではなくソース表記で表示する (#2692)', () => {
      cmp('Aは[1,2]。A@0', [
        '不完全な文です。',
        '配列参照『A@0』が解決していません。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('値への後置参照が未解決のとき内部型名ではなくソース表記で表示する (#2692)', () => {
      cmp('Aは[[9]]。A@0@0', [
        '不完全な文です。',
        '配列参照『A@0@0』が解決していません。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('添字の後ろのプロパティもソース表記で表示する (#2692)', () => {
      // 『$b』は文字列ノードとして添字と一緒に保持されるため、『@b』と表示しないこと
      cmp('Aは[{b:1}]。A@0$b', [
        '不完全な文です。',
        '配列参照『A@0$b』が解決していません。',
        'main.nako3'
      ], NakoSyntaxError)
      cmp('ホゲは{a:[{b:1}]}。ホゲ$a@0$b', [
        '不完全な文です。',
        '配列参照『ホゲ$a@0$b』が解決していません。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('添字が式のときもソース表記で表示する (#2692)', () => {
      cmp('Aは[1,2]。N=0。A@(N+1)', [
        '不完全な文です。',
        '配列参照『A@N+1』が解決していません。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('未解決の単語レポートでもプロパティ参照をソース表記で表示する (#2692)', () => {
      cmp('ホゲは{hoge:1}。ホゲ$hoge ホゲ$hogeを表示', [
        '未解決の単語があります: [プロパティ参照『ホゲ$hoge』]',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('関数定義の『ここまで』エラーで次の語句が記号のときは直前の文の確認を促す (#2692)', () => {
      cmp('●テストとは\n  1を表示。\n@0を表示。', [
        '『ここまで』がありません。関数定義の末尾に必要です。『@』の前に『ここまで』を記述してください。',
        'なお、直前の文が正しく解析できていない場合にもこのエラーになります。直前の文を確認してください。',
        'main.nako3'
      ], NakoSyntaxError)
    })
    it('関数定義の『ここまで』エラーでファイル末尾のときはトークンのJSONを出さない (#2692)', () => {
      const nako2 = new NakoCompiler()
      assert.throws(
        () => nako2.runSync('●テストとは\n  1を表示。', 'main.nako3'),
        (err) => {
          assert(err instanceof NakoSyntaxError)
          assert(err.message.includes('ファイルの末尾の前に『ここまで』を記述してください。'), err.message)
          assert(!err.message.includes('"type":"eof"'), err.message)
          return true
        }
      )
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
    it('未定義の変数を参照したとき', async () => {
      const compiler = new NakoCompiler()
      let log = ''
      compiler.logger.addListener('warn', ({ noColor }) => { log += noColor })
      await compiler.runAsync('!厳しくチェック;xを表示', 'main.nako3')
      assert.strictEqual(log.split('。')[0], '[警告]main.nako3(1行目): 変数『x』は定義されていません')
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
  it('戻り値のない関数を代入文の結果に使おうとする #175', async () => {
    const compiler = new NakoCompiler()
    const logger = compiler.getLogger()
    logger.addListener('error', ({ level, noColor }) => {
      const s = (noColor + '\n').split('\n')[0].replace('[エラー]', '')
      assert.strictEqual(level, 'error')
      assert.strictEqual(s, '[文法エラー]main.nako3(1行目): 関数『表示』は戻り値がないので結果を代入できません。')
      return true
    })
    try {
      await compiler.runAsync('A=「あ」を表示', 'main.nako3')
    } catch (_) {
      // pass
    }
  })
})
