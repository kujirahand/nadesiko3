/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'

import { NakoCompiler } from '../src/nako3.mjs'
import { NakoTokenizer } from '../src/nako_tokenizer.mjs'
import { NakoLogger } from '../src/nako_logger.mjs'

/**
 * 字句解析パイプラインを NakoCompiler から分離したモジュールのテスト (#2360)
 */
describe('nako_tokenizer_test', () => {
  /** 取り込み文を扱わない、単体テスト用のトークナイザを作る */
  const createTokenizer = () => {
    const logger = new NakoLogger()
    return new NakoTokenizer({
      getLogger: () => logger,
      // 取り込み文は扱わないので、何もせず空配列を返す
      replaceRequireStatements: () => [],
      removeRequireStatements: () => []
    })
  }

  it('rawtokenizeがトークン列を返す', () => {
    const tokenizer = createTokenizer()
    // 単体のトークナイザは関数一覧を持たないため、命令は word になる
    const tokens = tokenizer.rawtokenize('1と2を足す', 0, 'main.nako3')
    const types = tokens.map((t) => t.type)
    assert.ok(types.includes('number'), '数値トークンが含まれること')
    assert.ok(types.includes('word'), '単語トークンが含まれること')
    assert.deepStrictEqual(tokens.filter((t) => t.type === 'number').map((t) => t.value), [1, 2])
  })

  it('rawtokenizeはpreCodeがcodeの先頭にないとエラーになる', () => {
    const tokenizer = createTokenizer()
    assert.throws(
      () => tokenizer.rawtokenize('「A」を表示', 0, 'main.nako3', '「B」を表示'),
      /preCodeを含める必要があります/
    )
  })

  it('rawtokenizeがモジュールリストへ自身を追加する', () => {
    const tokenizer = createTokenizer()
    tokenizer.rawtokenize('「A」を表示', 0, 'sample.nako3')
    assert.ok(tokenizer.getModList().includes('sample'))
  })

  it('全角の記号が半角へ正規化される', () => {
    const tokenizer = createTokenizer()
    // 全角の「＝」が半角の「=」として解釈される
    const tokens = tokenizer.rawtokenize('Ａ＝１', 0, 'main.nako3')
    const types = tokens.map((t) => t.type)
    assert.ok(types.includes('eq'), '代入のトークンになること')
  })

  it('トークンに行番号と桁位置が設定される', () => {
    const tokenizer = createTokenizer()
    const tokens = tokenizer.rawtokenize('「A」を表示\n「B」を表示\n', 0, 'main.nako3')
    const second = tokens.filter((t) => t.type === 'string' && t.value === 'B')[0]
    assert.ok(second !== undefined)
    assert.strictEqual(second.line, 1, '2行目のトークンの行番号は1になること')
  })

  it('コメントのトークンが残る', () => {
    const tokenizer = createTokenizer()
    const tokens = tokenizer.rawtokenize('# これはコメント\n「A」を表示\n', 0, 'main.nako3')
    const comments = tokens.filter((t) => t.type === 'line_comment')
    assert.strictEqual(comments.length, 1)
  })

  it('lexCodeTokenがstartOffsetを加算する', () => {
    const tokenizer = createTokenizer()
    const res = tokenizer.lexCodeToken('1に2を足す', 0, 'main.nako3', 100)
    const withOffset = res.tokens.filter((t) => t.startOffset !== undefined)
    assert.ok(withOffset.length > 0)
    assert.ok(withOffset.every((t) => t.startOffset >= 100), 'startOffsetが加算されること')
  })

  it('lexCodeTokenにstartOffsetがnullならオフセットを消す', () => {
    const tokenizer = createTokenizer()
    const res = tokenizer.lexCodeToken('1に2を足す', 0, 'main.nako3', null)
    assert.ok(res.tokens.every((t) => t.startOffset === undefined))
    assert.ok(res.tokens.every((t) => t.endOffset === undefined))
  })

  it('lexが字句解析の結果を返す', () => {
    const tokenizer = createTokenizer()
    const res = tokenizer.lex('# コメント\n「A」を表示\n', 'main.nako3')
    assert.ok(res.tokens.length > 0)
    assert.strictEqual(res.commentTokens.length, 1)
    assert.deepStrictEqual(res.requireTokens, [])
  })

  it('NakoCompilerの各メソッドはトークナイザへ委譲される', () => {
    const nako = new NakoCompiler()
    const viaCompiler = nako.rawtokenize('1と2を足す', 0, 'main.nako3')
    const viaTokenizer = nako.tokenizer.rawtokenize('1と2を足す', 0, 'main.nako3')
    assert.deepStrictEqual(viaCompiler.map((t) => t.type), viaTokenizer.map((t) => t.type))
    // getModList もトークナイザが持つモジュールリストを返す
    assert.strictEqual(nako.getModList(), nako.tokenizer.getModList())
  })

  it('replaceLoggerを呼ぶとトークナイザのロガーも差し替わる', () => {
    const nako = new NakoCompiler()
    const logger = nako.replaceLogger()
    assert.strictEqual(nako.tokenizer.lexer.logger, logger)
    assert.strictEqual(nako.getLogger(), logger)
  })

  it('文字列展開の中のコードも字句解析される', async () => {
    const nako = new NakoCompiler()
    const g = await nako.runAsync('A=3;「値は{A}です」を表示', 'main.nako3')
    assert.strictEqual(g.log, '値は3です')
  })
})
