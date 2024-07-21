/* eslint-disable no-undef */
import assert from 'assert'
import { NakoLexer } from '../src/nako_lexer.mjs'
import { NakoLogger } from '../src/nako_logger.mjs'
import { NakoPrepare } from '../src/nako_prepare.mjs'

describe('nako_lexer_test', () => {
  const lex = new NakoLexer(new NakoLogger())
  const pre = NakoPrepare.getInstance()
  // --- test ---
  it('トークンの区切りテスト', () => {
    const a = lex.tokenize('Nは30', 0, 'test.nako3')
    assert.strictEqual(NakoLexer.tokensToTypeStr(a, '|'), 'word|number')
    const b = lex.tokenize('もしN=30ならば', 0, 'test.nako3')
    assert.strictEqual(NakoLexer.tokensToTypeStr(b, '|'), 'もし|word|eq|number')
  })
  it('関数の登録テスト', () => {
    const code = '●AAAとは\n「あ」を表示\nここまで。\n'
    const code2 = pre.convert(code).map((v) => v.text).join('')
    const tok = lex.tokenize(code2, 0, 'test.nako3')
    /** @type {any} */
    const funclist = new Map()
    // @ts-ignore
    NakoLexer.preDefineFunc(tok, lex.logger, funclist)
    assert.strictEqual(funclist.get('test__AAA').type, 'func')
  })
  it('変数は登録しないというテスト', () => {
    const code = 'HOGE=333\n'
    const code2 = pre.convert(code).map((v) => v.text).join('')
    const tok = lex.tokenize(code2, 0, 'test.nako3')
    /** @type {any} */
    const funclist = new Map()
    NakoLexer.preDefineFunc(tok, lex.logger, funclist)
    assert.strictEqual(funclist.HOGE, undefined)
  })
})
