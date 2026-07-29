/* eslint-disable no-undef */
/**
 * 構文解析器(NakoParser)の回帰テスト (#2364)
 *
 * `core/src/nako_parser3.mts` は 2,900 行を超える大きなファイルで、
 * これまでパーサを直接検証するテストが無く、回帰は実行結果(runAsync)経由でしか
 * 検出できなかった。パーサの内部構造に手を入れる際の安全網として、
 * 構文解析の結果である AST そのものを検証する。
 *
 * 2 段構えで検証している。
 *
 *  1. 構造アサーション … パーサの仕様を人間が読める形で固定する
 *  2. ゴールデン比較   … AST の全キー・全値・キーの並び順まで含めて完全一致を確認する
 *
 * コーパスとゴールデンファイルの更新方法は `fixtures/README.md` を参照。
 */
import { describe, it } from 'node:test'
import assert from 'assert'
import fs from 'node:fs'
import { PARSER_CORPUS, parseToPlainAst } from './fixtures/parser_corpus.mjs'

/** ブロック直下のノード種別を並べる(構造アサーション用) */
function blockTypes (ast) {
  return ast.blocks.filter((n) => n.type !== 'eol').map((n) => n.type)
}

/** 最初の(eol 以外の)文を取り出す */
function firstSentence (ast) {
  return ast.blocks.find((n) => n.type !== 'eol')
}

describe('nako_parser_test', () => {
  // -------------------------------------------------------------------------
  // 1. 構造アサーション … パーサの仕様を人間が読める形で固定する
  // -------------------------------------------------------------------------
  describe('構造アサーション', () => {
    it('文の並びが block になる', () => {
      const ast = parseToPlainAst('A=1\nB=2\n')
      assert.strictEqual(ast.type, 'block')
      assert.deepStrictEqual(blockTypes(ast), ['let', 'let'])
    })

    it('代入は let になり変数名にモジュール名が付く', () => {
      const let1 = firstSentence(parseToPlainAst('A=1\n'))
      assert.strictEqual(let1.type, 'let')
      assert.strictEqual(let1.name, 'main__A')
      assert.strictEqual(let1.blocks[0].type, 'number')
      assert.strictEqual(let1.blocks[0].value, 1)
    })

    it('関数呼び出しは func になり助詞で引数が結び付く', () => {
      const func = firstSentence(parseToPlainAst('「あ」を表示\n'))
      assert.strictEqual(func.type, 'func')
      assert.strictEqual(func.name, '表示')
      assert.strictEqual(func.blocks.length, 1)
      assert.strictEqual(func.blocks[0].value, 'あ')
      assert.strictEqual(func.blocks[0].josi, 'を')
    })

    it('演算子の優先順位が AST の入れ子に反映される', () => {
      // 1+2*3 は 1+(2*3) になる
      const func = firstSentence(parseToPlainAst('1+2*3を表示\n'))
      const op = func.blocks[0]
      assert.strictEqual(op.type, 'op')
      assert.strictEqual(op.operator, '+')
      assert.strictEqual(op.blocks[0].value, 1)
      assert.strictEqual(op.blocks[1].operator, '*')
      assert.strictEqual(op.blocks[1].blocks[0].value, 2)
      assert.strictEqual(op.blocks[1].blocks[1].value, 3)
    })

    it('カッコが優先順位を上書きする', () => {
      // (1+2)*3 は (1+2) が先
      const func = firstSentence(parseToPlainAst('(1+2)*3を表示\n'))
      const op = func.blocks[0]
      assert.strictEqual(op.operator, '*')
      assert.strictEqual(op.blocks[0].operator, '+')
      assert.strictEqual(op.blocks[1].value, 3)
    })

    it('もし文は if になり blocks が [条件, 真, 偽] の順になる', () => {
      const ifAst = firstSentence(parseToPlainAst('もしA=1ならば\nB=1\n違えば\nB=2\nここまで\n'))
      assert.strictEqual(ifAst.type, 'if')
      assert.strictEqual(ifAst.blocks.length, 3)
      assert.strictEqual(ifAst.blocks[0].type, 'op')
      assert.strictEqual(ifAst.blocks[0].operator, 'eq')
    })

    it('関数定義は def_func になり引数リストを持つ', () => {
      // 『足す』は送り仮名が落ちて『足』になる
      const def = firstSentence(parseToPlainAst('●(AとBを)足すとは\nA+Bで戻る\nここまで\n'))
      assert.strictEqual(def.type, 'def_func')
      assert.strictEqual(def.name, 'main__足')
      assert.deepStrictEqual(def.meta.varnames, ['A', 'B'])
      assert.deepStrictEqual(def.meta.josi, [['と'], ['を']])
    })

    it('配列リテラルは json_array になる', () => {
      const let1 = firstSentence(parseToPlainAst('A=[1,2,3]\n'))
      assert.strictEqual(let1.blocks[0].type, 'json_array')
      assert.deepStrictEqual(let1.blocks[0].blocks.map((n) => n.value), [1, 2, 3])
    })

    it('辞書リテラルは json_obj になりキーと値が交互に並ぶ', () => {
      const let1 = firstSentence(parseToPlainAst('A={"a":1,"b":2}\n'))
      const obj = let1.blocks[0]
      assert.strictEqual(obj.type, 'json_obj')
      assert.deepStrictEqual(obj.blocks.map((n) => n.value), ['a', 1, 'b', 2])
    })

    it('配列要素への代入は let_array になる', () => {
      const ast = parseToPlainAst('A=[0]\nA[0]=1\n')
      assert.deepStrictEqual(blockTypes(ast), ['let', 'let_array'])
    })

    it('繰り返し文は for になる', () => {
      const forAst = firstSentence(parseToPlainAst('Nを1から10まで繰り返す\nNを表示\nここまで\n'))
      assert.strictEqual(forAst.type, 'for')
      assert.strictEqual(forAst.blocks[0].value, 1)
      assert.strictEqual(forAst.blocks[1].value, 10)
    })

    it('連文は block として接続される', () => {
      const renbun = firstSentence(parseToPlainAst('1に2を足して3を掛けて表示\n'))
      assert.strictEqual(renbun.type, 'block')
    })

    it('非同期関数を呼ぶ関数には asyncFn が伝播する', () => {
      const ast = parseToPlainAst('●Fとは\n1秒待つ\nここまで\nF\n')
      const def = ast.blocks.find((n) => n.type === 'def_func')
      assert.strictEqual(def.asyncFn, true, '『待つ』を呼ぶ関数Fは非同期になる')
    })

    it('エラー監視は try_except になる', () => {
      const tryAst = firstSentence(parseToPlainAst('エラー監視\nA=1\nエラーならば\nB=2\nここまで\n'))
      assert.strictEqual(tryAst.type, 'try_except')
      assert.strictEqual(tryAst.blocks.length, 2)
    })
  })

  // -------------------------------------------------------------------------
  // 2. ゴールデン比較 … AST が 1 バイトも変わらないことを確認する
  // -------------------------------------------------------------------------
  describe('ゴールデン比較', () => {
    const goldenPath = new URL('./fixtures/parser_ast_golden.json', import.meta.url)
    const golden = JSON.parse(fs.readFileSync(goldenPath, 'utf8'))

    it('ゴールデンとコーパスの項目が一致する', () => {
      assert.deepStrictEqual(Object.keys(golden), Object.keys(PARSER_CORPUS),
        'コーパスを変更したらゴールデンを再生成すること (fixtures/README.md 参照)')
    })

    for (const [name, code] of Object.entries(PARSER_CORPUS)) {
      it(name, () => {
        assert.deepStrictEqual(parseToPlainAst(code), golden[name])
      })
    }
  })
})
