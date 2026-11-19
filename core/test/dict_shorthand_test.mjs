/* eslint-disable no-undef */
// 辞書リテラルの省略記法 (#2686)
// - {1:10} は {"1":10} (数値キー)
// - {a} は {"a":a} (変数の省略記法。値の変数を展開する)
// - {10} は {"10":10} (数値のみ)
// いずれもトップレベルと関数内で解釈が変わらないこと。
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('dict_shorthand #2686', async () => {
  const cmp = async (/** @type {string} */code, /** @type {string} */res) => {
    const nako = new NakoCompiler()
    assert.strictEqual((await nako.runAsync(code, 'main.nako3')).log, res)
  }

  // --- ケース1: 数値キー {1:10} → {"1":10} ---
  it('数値キー (トップレベル)', async () => {
    await cmp('{1:10}をJSON変換して表示', '{"1":10}')
    await cmp('{0:10}をJSON変換して表示', '{"0":10}')
    await cmp('{1.5:10}をJSON変換して表示', '{"1.5":10}')
    await cmp('{1:10,2:20}をJSON変換して表示', '{"1":10,"2":20}')
    // 値には式や変数も書ける
    await cmp('A=5;{1:A+1}をJSON変換して表示', '{"1":6}')
    await cmp('{1:「あ」}をJSON変換して表示', '{"1":"あ"}')
  })
  it('数値キー (関数内でも同じ)', async () => {
    await cmp('●テストとは\n{1:10}をJSON変換して戻る\nここまで\nテストを表示', '{"1":10}')
    await cmp('A=5\n●テストとは\n{1:A+1}をJSON変換して戻る\nここまで\nテストを表示', '{"1":6}')
  })
  it('数値キーは文字列キーとして解析される', () => {
    const nako = new NakoCompiler()
    const ast = nako.parse('A={1:10}\n', 'main.nako3')
    const obj = ast.blocks[0].blocks[0]
    assert.strictEqual(obj.type, 'json_obj')
    assert.deepStrictEqual(obj.blocks.map((/** @type {any} */n) => n.value), ['1', 10])
    assert.strictEqual(obj.blocks[0].type, 'string')
  })

  // --- ケース2: 変数の省略記法 {a} → {"a":a} ---
  it('変数の省略記法 (トップレベル)', async () => {
    await cmp('A=1;{A}をJSON変換して表示', '{"A":1}')
    // 元の報告形式 (反復でキーと値を取り出す)
    await cmp('A=1\n{A}を反復\n「{対象キー}、{対象}」を表示\nここまで', 'A、1')
    // 複数の省略記法、明示形との混在
    await cmp('A=1;B=2;{A,B}をJSON変換して表示', '{"A":1,"B":2}')
    await cmp('A=1;{A,C:3}をJSON変換して表示', '{"A":1,"C":3}')
  })
  it('変数の省略記法 (関数内でも同じ: グローバル変数)', async () => {
    await cmp('A=1\n●テストとは\n{A}をJSON変換して戻る\nここまで\nテストを表示', '{"A":1}')
    await cmp('A=1\n●テストとは\n{A}を反復\n「{対象キー}、{対象}」を表示\nここまで\nここまで\nテスト', 'A、1')
  })
  it('変数の省略記法 (関数内でも同じ: 引数とローカル変数)', async () => {
    await cmp('●(Aで)テストとは\n{A}をJSON変換して戻る\nここまで\n5でテストを表示', '{"A":5}')
    await cmp('●テストとは\nB=7\n{B}をJSON変換して戻る\nここまで\nテストを表示', '{"B":7}')
  })

  // --- ケース3: 数値のみ {10} → {"10":10} ---
  it('数値のみ (トップレベル)', async () => {
    await cmp('{10}をJSON変換して表示', '{"10":10}')
    // 元の報告形式 (反復でキーと値を取り出す)
    await cmp('{10}を反復\n「{対象キー}、{対象}」を表示\nここまで', '10、10')
  })
  it('数値のみ (関数内でも同じ)', async () => {
    await cmp('●テストとは\n{10}をJSON変換して戻る\nここまで\nテストを表示', '{"10":10}')
  })

  // --- 組み合わせ: トップレベルと関数内で結果が一致する ---
  it('省略記法の組み合わせ (トップレベルと関数内)', async () => {
    // JSのオブジェクトでは整数らしいキーが先に昇順で並ぶ
    await cmp('A=1;{1:10,A,10}をJSON変換して表示', '{"1":10,"10":10,"A":1}')
    await cmp('A=1\n●テストとは\n{1:10,A,10}をJSON変換して戻る\nここまで\nテストを表示', '{"1":10,"10":10,"A":1}')
  })

  // --- 巻き戻し後の再パースでも結果が変わらない (レビュー指摘) ---
  it('添字の中の省略記法 (再パースされる位置)', async () => {
    // 配列の添字は解析が巻き戻されて読み直されることがある。
    // その場合も {A} が {"A":"A"} にならず変数を参照すること。
    await cmp('A=1;B=[100,200];B[({A}$A)-1]を表示', '100')
    await cmp('A=1;B=[100,200];B[({A:A}$A)-1]を表示', '100')
  })
  it('同名のローカル変数がグローバルを隠す', async () => {
    await cmp('A=1\n●テストとは\nA=2\n{A}をJSON変換して戻る\nここまで\nテストを表示', '{"A":2}')
  })
  it('入れ子の辞書でも省略記法が使える', async () => {
    await cmp('A=5;{1:{A}}をJSON変換して表示', '{"1":{"A":5}}')
    await cmp('A=5;{A:{1:2}}をJSON変換して表示', '{"A":{"1":2}}')
  })
  it('16進数の数値キー', async () => {
    await cmp('{0xFF:1}をJSON変換して表示', '{"255":1}')
  })
  it('値のない数値キーや余分なコロンはエラー', async () => {
    const err = async (/** @type {string} */code) => {
      const nako = new NakoCompiler()
      await assert.rejects(async () => { await nako.runAsync(code, 'main.nako3') }, /文法エラー/)
    }
    await err('{1:}をJSON変換して表示')
    await err('{1:10:20}をJSON変換して表示')
  })

  // --- 既存記法の回帰確認 ---
  it('既存の辞書記法は変わらない', async () => {
    await cmp('A=1;{A:A}をJSON変換して表示', '{"A":1}')
    await cmp('{"1":10}をJSON変換して表示', '{"1":10}')
    await cmp('{「1」:10}をJSON変換して表示', '{"1":10}')
    await cmp('{}をJSON変換して表示', '{}')
    await cmp('A=1\n●テストとは\n{A:A}をJSON変換して戻る\nここまで\nテストを表示', '{"A":1}')
  })
})
