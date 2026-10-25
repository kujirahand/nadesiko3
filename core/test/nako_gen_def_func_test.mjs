/* eslint-disable no-undef */
/**
 * 宣言関数名を生成 JS へ埋め込むときの無害化のテスト (PR #2625)
 *
 * `NakoGen.getDefFuncCode` が `nakoFuncList` のキーを
 * `//[DEF_FUNC name=...]` コメントと `__varslist[1].set(...)` へ出す際に、
 * 関数名に `"` や行終端が含まれても文字列リテラルや行コメントを
 * 破壊して任意の JS を差し込めないことを検証する。
 */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import { NakoGen, NakoGenOptions } from '../src/nako_gen.mjs'

describe('nako_gen_def_func_test', async () => {
  /**
   * nakoFuncList に名前を直接登録し、getDefFuncCode の DEF_FUNC 部分 (3行) を返す。
   * 字句解析では作れない名前 (改行や U+2028 等を含む名前) も検証できる。
   * @param {string} name 関数名
   * @returns {string[]} DEF_FUNC の3行
   */
  const genDefLines = (name) => {
    const nako = new NakoCompiler()
    nako.getNakoFuncList().set(name, {
      josi: [],
      fn: '(() => 42)',
      type: 'func',
      asyncFn: false,
      isExport: null
    })
    const gen = new NakoGen(nako)
    const code = gen.getDefFuncCode(nako, new NakoGenOptions())
    const lines = code.split('\n').filter((l) => l.includes('DEF_FUNC') || l.includes('__varslist[1].set('))
    return lines
  }

  /**
   * DEF_FUNC の set 行だけを実行し、登録されたキー一覧を返す。
   * 注入が成功していれば余分なキーが登録される。
   * @param {string} setLine `__self.__varslist[1].set(...);` の行
   * @returns {string[]} 登録されたキー
   */
  const evalSetLine = (setLine) => {
    const map = new Map()
    const __self = { __varslist: [new Map(), map, new Map()] }
    // eslint-disable-next-line no-new-func
    new Function('__self', setLine)(__self)
    return [...map.keys()]
  }

  // 検証する関数名の一覧: [表示名, 関数名]
  const cases = [
    ['通常の日本語名', 'テスト関数'],
    ['ダブルクォート入り', 'a"b'],
    ['シングルクォート入り', "a'b"],
    ['バックスラッシュ入り', 'a\\b'],
    ['注入を試みる名前', 'x"); __self.__varslist[1].set("pwn", 999); //'],
    ['改行(LF)入り', 'a\nb'],
    ['復帰(CR)入り', 'a\rb'],
    ['U+2028入り', 'a\u2028b'],
    ['U+2029入り', 'a\u2029b'],
    ['リテラルの \\u2028 文字並び', '\\u2028'],
    ['絵文字(サロゲートペア)入り', 'テスト😀'],
    ['孤立サロゲート', '\ud800'],
    ['《》とクォート入り', '《悪意"》']
  ]

  for (const [label, name] of cases) {
    it(`生成コードが壊れない: ${label}`, () => {
      const lines = genDefLines(name)
      // DEF_FUNC は開始コメント・set・終了コメントの3行のまま
      assert.strictEqual(lines.length, 3, `DEF_FUNC が3行ではありません: ${JSON.stringify(lines)}`)
      assert.ok(lines[0].startsWith('//[DEF_FUNC name='), lines[0])
      assert.ok(lines[1].startsWith('__self.__varslist[1].set('), lines[1])
      assert.ok(lines[2].startsWith('//[/DEF_FUNC name='), lines[2])
      // 生の行終端 (U+2028/U+2029/CR) が行内に残っていない
      for (const line of lines) {
        assert.ok(!/[\u2028\u2029\r]/.test(line), `行終端が残っています: ${JSON.stringify(line)}`)
      }
      // set 行を実行しても、元の名前のキー1件だけが登録される (往復一致・注入なし)
      const keys = evalSetLine(lines[1])
      assert.deepStrictEqual(keys, [name])
    })
  }

  it('通常名では JSON 文字列形式で出力される', () => {
    const lines = genDefLines('テスト関数')
    assert.strictEqual(lines[0], '//[DEF_FUNC name="テスト関数" asyncFn=false]')
    assert.strictEqual(lines[1], '__self.__varslist[1].set("テスト関数", (() => 42));')
    assert.strictEqual(lines[2], '//[/DEF_FUNC name="テスト関数"]')
  })

  it('U+2028/U+2029 は \\uXXXX 形式に置換される', () => {
    assert.ok(genDefLines('a\u2028b')[1].includes('"a\\u2028b"'))
    assert.ok(genDefLines('a\u2029b')[1].includes('"a\\u2029b"'))
  })

  // --- ソース経由の実行テスト (《特別名前トークン》で定義できる名前) ---
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    assert.strictEqual((await nako.runAsync(code, 'main.nako3')).log, res)
  }

  it('《》名にダブルクォートを含む関数を定義して呼べる', async () => {
    await cmp('●《a"b》とは\n「ok」で戻る\nここまで\n《a"b》を表示', 'ok')
  })

  it('《》名にシングルクォートを含む関数を定義して呼べる', async () => {
    await cmp("●《a'b》とは\n「ok」で戻る\nここまで\n《a'b》を表示", 'ok')
  })

  it('《》名にバックスラッシュを含む関数を定義して呼べる', async () => {
    await cmp('●《a\\b》とは\n「ok」で戻る\nここまで\n《a\\b》を表示', 'ok')
  })

  it('通常の関数定義が従来どおり動く', async () => {
    await cmp('●テスト関数とは\n「ok」で戻る\nここまで\nテスト関数を表示', 'ok')
  })
})
