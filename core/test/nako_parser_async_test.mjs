/* eslint-disable no-undef */
/**
 * nako_parser_async.mts の単体テスト (#2364)
 *
 * 非同期処理(asyncFn)の判定は、これまで NakoParser の内部メソッドだったため
 * 単体で検証できなかった。分離したことで AST を直接組み立てて確認できる。
 */
import { describe, it } from 'node:test'
import assert from 'assert'
import { checkAsyncFn } from '../src/nako_parser_async.mjs'
import { NakoCompiler } from '../src/nako3.mjs'

/** テスト用に func ノードを作る */
function funcNode (name, blocks = [], asyncFn = false) {
  return { type: 'func', name, blocks, asyncFn, josi: '' }
}

/** テスト用に def_func ノードを作る */
function defFuncNode (name, blocks = []) {
  return { type: 'def_func', name, blocks, meta: {}, asyncFn: false, josi: '' }
}

/** テスト用に block ノードを作る */
function blockNode (blocks) {
  return { type: 'block', blocks, josi: '' }
}

/** テスト用に func_obj(無名関数) ノードを作る */
function funcObjNode (blocks = [], asyncFn = false) {
  return { type: 'func_obj', name: '', blocks, meta: {}, asyncFn, josi: '' }
}

/** テスト用に let(代入) ノードを作る */
function letNode (name, value) {
  return { type: 'let', name, blocks: [value], josi: '' }
}

/**
 * なでしこのプログラムを実行してログを得る
 *
 * runAsync は生成コードの非同期IIFEを開始した時点で戻るため、
 * 実行完了までイベントループを進める必要がある (課題は #2381 を参照)
 */
async function runAndGetLog (code) {
  const g = await new NakoCompiler().runAsync(code, 'main.nako3')
  await new Promise((resolve) => setTimeout(resolve, 10))
  return g.log
}

describe('nako_parser_async_test', () => {
  describe('checkAsyncFn', () => {
    it('非同期処理が無ければ書き換えない', () => {
      const ast = blockNode([funcNode('表示', [{ type: 'number', value: 1, josi: 'を' }])])
      assert.strictEqual(checkAsyncFn(ast, new Map()), false)
      assert.strictEqual(ast.blocks[0].asyncFn, false)
    })

    it('funclist が非同期の関数を呼ぶと asyncFn が付く', () => {
      const funclist = new Map([['待つ', { type: 'func', asyncFn: true }]])
      const ast = blockNode([funcNode('待つ')])
      assert.strictEqual(checkAsyncFn(ast, funclist), true, '書き換えたので true')
      assert.strictEqual(ast.blocks[0].asyncFn, true)
    })

    it('書き換えが済めば false を返す(不動点に到達する)', () => {
      const funclist = new Map([['待つ', { type: 'func', asyncFn: true }]])
      const ast = blockNode([funcNode('待つ')])
      assert.strictEqual(checkAsyncFn(ast, funclist), true)
      assert.strictEqual(checkAsyncFn(ast, funclist), false, '2回目は変化しない')
    })

    it('関数定義の中身が非同期なら関数定義自体が非同期になる', () => {
      const funclist = new Map([['待つ', { type: 'func', asyncFn: true }]])
      const def = defFuncNode('F', [funcNode('待つ')])
      assert.strictEqual(checkAsyncFn(blockNode([def]), funclist), true)
      assert.strictEqual(def.asyncFn, true)
      assert.strictEqual(def.meta.asyncFn, true, 'meta にも反映される')
    })

    it('引数の中に非同期があれば呼び出し自体も非同期になる', () => {
      const funclist = new Map([['待つ', { type: 'func', asyncFn: true }]])
      const inner = funcNode('待つ')
      const outer = funcNode('表示', [inner])
      assert.strictEqual(checkAsyncFn(blockNode([outer]), funclist), true)
      assert.strictEqual(outer.asyncFn, true)
    })

    it('引数の走査も最初の非同期ノードで打ち切らない', () => {
      const funclist = new Map([['待つ', { type: 'func', asyncFn: true }]])
      const arg1 = funcNode('待つ')
      const arg2 = funcNode('待つ')
      const outer = funcNode('足', [arg1, arg2])
      const ast = blockNode([outer])

      let count = 0
      while (checkAsyncFn(ast, funclist)) {
        count++
        assert.ok(count < 10, '不動点に収束しない')
      }
      assert.strictEqual(outer.asyncFn, true)
      assert.strictEqual(arg1.asyncFn, true)
      assert.strictEqual(arg2.asyncFn, true, '2つ目の引数も訪問される')
    })

    it('連文は常に非同期として扱う', () => {
      const def = defFuncNode('F', [{ type: 'renbun', blocks: [], josi: '' }])
      assert.strictEqual(checkAsyncFn(blockNode([def]), new Map()), true)
      assert.strictEqual(def.asyncFn, true)
    })

    it('block 内の複数の非同期関数をすべて走査する', () => {
      const funclist = new Map([
        ['待つ', { type: 'func', asyncFn: true }],
        ['F', { type: 'func', asyncFn: false }],
        ['G', { type: 'func', asyncFn: false }]
      ])
      const defF = defFuncNode('F', [funcNode('待つ')])
      const defG = defFuncNode('G', [funcNode('F')])
      const ast = blockNode([defF, defG])

      let count = 0
      while (checkAsyncFn(ast, funclist)) {
        count++
        assert.ok(count < 10, '不動点に収束しない')
      }
      assert.strictEqual(defF.asyncFn, true)
      assert.strictEqual(defG.asyncFn, true, 'F の後ろにある G も訪問される')
      assert.strictEqual(funclist.get('F').asyncFn, true)
      assert.strictEqual(funclist.get('G').asyncFn, true)
    })

    it('関数定義の本体も最初の非同期ノードで打ち切らない', () => {
      // 本体の1文目が非同期でも、2文目以降を走査しないと
      // そこにある呼び出しに asyncFn が付かない
      const funclist = new Map([
        ['待つ', { type: 'func', asyncFn: true }],
        ['G', { type: 'func', asyncFn: true }],
        ['F', { type: 'func', asyncFn: false }]
      ])
      const callG = funcNode('G')
      const def = defFuncNode('F', [funcNode('待つ'), callG])

      let count = 0
      while (checkAsyncFn(blockNode([def]), funclist)) {
        count++
        assert.ok(count < 10, '不動点に収束しない')
      }
      assert.strictEqual(def.asyncFn, true)
      assert.strictEqual(callG.asyncFn, true, '1文目より後ろの呼び出しも訪問される')
    })

    it('非同期な無名関数を保持する変数の呼び出しも非同期になる', () => {
      // F=●()...ここまで のように変数へ代入された無名関数は funclist に載らないため、
      // 代入を追跡しないと呼び出し側に asyncFn が付かない
      const funclist = new Map([['待つ', { type: 'func', asyncFn: true }]])
      const anon = funcObjNode([funcNode('待つ')])
      const callF = funcNode('F')
      const ast = blockNode([letNode('F', anon), callF])

      let count = 0
      while (checkAsyncFn(ast, funclist)) {
        count++
        assert.ok(count < 10, '不動点に収束しない')
      }
      assert.strictEqual(anon.asyncFn, true)
      assert.strictEqual(callF.asyncFn, true, '変数経由の呼び出しにも asyncFn が付く')
    })

    it('同期な無名関数を保持する変数は非同期にならない', () => {
      const anon = funcObjNode([funcNode('表示')])
      const callF = funcNode('F')
      const ast = blockNode([letNode('F', anon), callF])
      assert.strictEqual(checkAsyncFn(ast, new Map()), false)
      assert.strictEqual(callF.asyncFn, false)
    })

    it('無名関数の変数はその関数スコープの外へ漏れない', () => {
      // 関数 F の中のローカル変数 X と、外側の変数 X は別物として扱う
      const funclist = new Map([['待つ', { type: 'func', asyncFn: true }]])
      const innerAnon = funcObjNode([funcNode('待つ')])
      const defF = defFuncNode('F', [letNode('X', innerAnon)])
      const outerCallX = funcNode('X')
      const ast = blockNode([defF, outerCallX])

      let count = 0
      while (checkAsyncFn(ast, funclist)) {
        count++
        assert.ok(count < 10, '不動点に収束しない')
      }
      assert.strictEqual(innerAnon.asyncFn, true)
      assert.strictEqual(outerCallX.asyncFn, false, '関数の外の X は非同期にならない')
    })
  })

  describe('NakoParser 経由での結合確認', () => {
    it('非同期関数を呼ぶユーザー関数に asyncFn が伝播する', () => {
      const ast = new NakoCompiler().parse('●Fとは\n1秒待つ\nここまで\nF\n', 'main.nako3')
      const def = ast.blocks.find((n) => n.type === 'def_func')
      assert.strictEqual(def.asyncFn, true)
    })

    it('非同期処理を含まない関数は asyncFn にならない', () => {
      const ast = new NakoCompiler().parse('●Fとは\n1を表示\nここまで\nF\n', 'main.nako3')
      const def = ast.blocks.find((n) => n.type === 'def_func')
      assert.strictEqual(def.asyncFn, false)
    })

    it('連文を代入する関数が複数続いてもすべてawaitされる (#2170)', async () => {
      const code = `Aを表示。
Bを表示。

●A
    a=30に5を足して2を掛ける。
    「A関数内：」&aを表示。
    aを戻す。
ここまで。

●B
    b=30に5を足して2を掛ける。
    「B関数内：」&bを表示。
    bを戻す。
ここまで。`
      assert.strictEqual(await runAndGetLog(code), 'A関数内：70\n70\nB関数内：70\n70')
    })
  })

  describe('無名関数(関数オブジェクト)の非同期判定', () => {
    it('連文を含む無名関数の呼び出しがawaitされる', async () => {
      const code = `F=●()
    b=1に2を足して3を掛ける。
    bを戻す。
ここまで。
F()を表示。`
      assert.strictEqual(await runAndGetLog(code), '9')
    })

    it('「変数」で宣言した無名関数の呼び出しもawaitされる', async () => {
      const code = `変数 F=●()
    b=1に2を足して3を掛ける。
    bを戻す。
ここまで。
F()を表示。`
      assert.strictEqual(await runAndGetLog(code), '9')
    })

    it('非同期のユーザー関数を呼ぶ無名関数もawaitされる', async () => {
      const code = `●B
    b=1に2を足して3を掛ける。
    bを戻す。
ここまで。
F=●()
    Bを戻す。
ここまで。
F()を表示。`
      assert.strictEqual(await runAndGetLog(code), '9')
    })

    it('関数の中で定義した無名関数の呼び出しもawaitされる', async () => {
      const code = `Aを実行。
●A
    F=●()
        b=1に2を足して3を掛ける。
        bを戻す。
    ここまで。
    F()を表示。
ここまで。`
      assert.strictEqual(await runAndGetLog(code), '9')
    })

    it('非同期の文より後ろで定義した無名関数の呼び出しもawaitされる', async () => {
      // 関数本体の走査が1文目で打ち切られていると F() に asyncFn が付かない
      const code = `Aを実行。
●A
    a=30に5を足して2を掛ける。
    aを表示。
    F=●()
        b=1に2を足して3を掛ける。
        bを戻す。
    ここまで。
    F()を表示。
ここまで。`
      assert.strictEqual(await runAndGetLog(code), '70\n9')
    })

    it('引数が2つとも非同期の無名関数でもすべてawaitされる', async () => {
      // 引数の走査が1つ目で打ち切られていると G() に asyncFn が付かない
      const code = `F=●()
    b=1に2を足して3を掛ける。
    bを戻す。
ここまで。
G=●()
    c=2に2を足して2を掛ける。
    cを戻す。
ここまで。
F()とG()を足して表示。`
      assert.strictEqual(await runAndGetLog(code), '17')
    })

    it('非同期処理を含まない無名関数はawaitされない', async () => {
      const code = `F=●()
    b=1に2を足す。
    bを戻す。
ここまで。
F()を表示。`
      assert.strictEqual(await runAndGetLog(code), '3')
    })
  })
})
