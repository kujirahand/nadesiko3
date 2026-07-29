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

    it('連文は常に非同期として扱う', () => {
      const def = defFuncNode('F', [{ type: 'renbun', blocks: [], josi: '' }])
      assert.strictEqual(checkAsyncFn(blockNode([def]), new Map()), true)
      assert.strictEqual(def.asyncFn, true)
    })

    it('[現状の挙動] block の走査は最初の非同期ノードで打ち切られる', () => {
      // ブロックの走査は子が非同期だと分かった時点で return するため、
      // それより後ろの兄弟はそのパスでは訪問されない。
      // したがって G は、この走査だけでは非同期と判定されない。
      //
      // 実際のパーサでは yDefFuncCommon が解析中に usedAsyncFn を追跡して
      // 関数定義に asyncFn を付けるので、この走査に頼らなくても G は非同期になる
      // (下の「NakoParser 経由での結合確認」を参照)。
      // 分離前からの挙動なので、そのまま固定しておく。
      const funclist = new Map([
        ['待つ', { type: 'func', asyncFn: true }],
        ['F', { type: 'func', asyncFn: true }]
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
      assert.strictEqual(defG.asyncFn, false, 'F の後ろにある G は訪問されない')
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
  })
})
