/* eslint-disable no-undef */
// PR #2624 の回帰テスト。
// genVar がリンクできない (実体のない) システム関数・変数への参照で生成する
// `/*[link_error]l行:ファイル*/` コメントに、`*/` や行終端文字を含むファイル名を
// 埋め込んでも、生成された JavaScript を破壊(コメント脱出・任意JS注入)できないことを検証する。
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import { NakoGen } from '../src/nako_gen.mjs'

const DUMMY_NAME = 'リンクエラー検証用'

/**
 * genVar を直接呼んで link_error 経路を通し、生成コードを返す
 * @param {string | undefined} file
 * @returns {string}
 */
const genLinkError = (file) => {
  const nako = new NakoCompiler()
  // システム変数スコープ (__varslist[0]) に名前だけを登録する。
  // NakoGen は生成時に __varslist のキーから varslistSet を作るため findVar が i=0 を返し、
  // getNakoFunc() が undefined を返すため genVar が link_error 経路に入る。
  nako.__varslist[0].set(DUMMY_NAME, undefined)
  const gen = new NakoGen(nako)
  const position = { type: 'word', line: 5 }
  if (file !== undefined) { position.file = file }
  return gen.genVar(DUMMY_NAME, position)
}

const PREFIX = '__self.__varslist[0].get("' + DUMMY_NAME + '")'
const commentOf = (file) => `/*[link_error]l5:${file}*/`

describe('nako_gen_link_error_test (PR #2624)', () => {
  const cases = [
    ['通常のファイル名', 'main.nako3', 'main.nako3'],
    ['URL (単独の / は置換しない)', 'https://example.com/a/b.nako3', 'https://example.com/a/b.nako3'],
    ['*/ を含む', 'test*/evil', 'test＊／evil'],
    ['連続した * と /', '**/', '*＊／'],
    ['CR を含む', 'a\rb', 'a¶b'],
    ['LF を含む', 'a\nb', 'a¶b'],
    ['U+2028 を含む', 'a\u2028b', 'a¶b'],
    ['U+2029 を含む', 'a\u2029b', 'a¶b'],
    ['* と / の間に改行', '*\n/', '*¶/'],
    ['file 未設定', undefined, 'unknown']
  ]
  for (const [title, file, expected] of cases) {
    it(`${title}: 出力が無害化される`, () => {
      const code = genLinkError(file)
      assert.strictEqual(code, PREFIX + commentOf(expected))
      // 末尾の正規の */ を除いて、*/ が現れない
      const body = code.slice(0, -2)
      assert.ok(!body.includes('*/'), code)
      // 生の行終端文字が残らない
      assert.ok(!/[\r\n\u2028\u2029]/.test(code), code)
    })
  }

  it('注入ペイロードが評価されない', () => {
    const payload = '*/ + (globalThis.PWNED=1) + 0 /*'
    const code = genLinkError(payload)
    const self = { __varslist: [{ get: () => 42 }, new Map(), new Map()] }
    delete globalThis.PWNED
    try {
      const result = new Function('__self', 'return ' + code)(self)
      assert.strictEqual(globalThis.PWNED, undefined)
      assert.strictEqual(result, 42)
    } finally {
      delete globalThis.PWNED
    }
  })
})
