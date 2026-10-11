import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { NakoCompiler } from '../src/nako3.mjs'
import { NakoGen } from '../src/nako_gen.mjs'
import { NakoParser } from '../src/nako_parser3.mjs'

const cmp = async (code, expected) => {
  const nako = new NakoCompiler()
  assert.equal((await nako.runAsync(code, 'main.nako3')).log, expected)
}

describe('もし式 #2591', () => {
  it('Issueの単行の例で真偽それぞれの値を代入する', async () => {
    for (const [condition, expected] of [[1, '5'], [0, '2']]) {
      await cmp(`家猫=${condition}。猫愛嬌は、もし家猫なら5、違えば2。猫愛嬌を表示。`, expected)
    }
  })

  it('Issueの複数行の例で関数呼び出しや数値を返す', async () => {
    for (const [condition, expected] of [[1, '5'], [0, '2']]) {
      await cmp(`家猫=${condition}
猫愛嬌は、もし家猫なら
  2に3を足したもの
違えば
  2
ここまで
猫愛嬌を表示`, expected)
    }
  })

  it('インデント構文でも値を返す', async () => {
    await cmp(`家猫=1
猫愛嬌は、もし家猫なら:
  5
違えば:
  2
猫愛嬌を表示`, '5')
  })

  it('単行と複数行を組み合わせた分岐を閉じる', async () => {
    for (const [condition, expected] of [[1, '5\n後続'], [0, '2\n後続']]) {
      await cmp(`A=もし${condition}なら5
違えば
  2
ここまで
Aを表示
「後続」を表示`, expected)
      await cmp(`A=もし${condition}なら
  5
違えば2
ここまで
Aを表示
「後続」を表示`, expected)
    }
  })

  it('単行式が外側の関数やもし文のここまでを消費しない', async () => {
    await cmp(`●選択処理
  A=もし1なら5、違えば2
  Aを表示
ここまで
選択処理
もし1なら
  A=もし0なら5、違えば2
ここまで
Aを表示
「後続」を表示`, '5\n2\n後続')
  })

  it('分岐で初めて代入・宣言した変数を式の外から参照できる', async () => {
    for (const condition of [1, 0]) {
      await cmp(`A=もし${condition}なら
  新代入値=7
  変数の新宣言値=8
  5
違えば
  新代入値=9
  変数の偽宣言値=10
  2
ここまで
新代入値を表示
${condition ? '新宣言値' : '偽宣言値'}を表示`, condition ? '7\n8' : '9\n10')
    }
  })

  it('関数内の分岐の変数は関数スコープに属する', async () => {
    await cmp(`変数の共有値=100
●選択処理
  A=もし1なら
    新局所値=7
    変数の共有値=8
    5
  違えば
    2
  ここまで
  新局所値を表示
  共有値を表示
ここまで
選択処理
共有値を表示`, '7\n8\n100')
  })

  it('複数行のもし式を括弧に付けた助詞で関数に渡す', async () => {
    await cmp(`3に(もし1なら
  5
違えば
  2
ここまで)を足して表示`, '8')
    await cmp(`(もし0なら
  5
違えば
  2
ここまで)を表示`, '2')
  })

  it('空の分岐ASTをジェネレーターに渡しても構文エラーになる', () => {
    const gen = new NakoGen(new NakoCompiler())
    const empty = { type: 'block', blocks: [], josi: '', line: 0, file: 'main.nako3' }
    for (const blocks of [
      [{ type: 'number', value: 1, line: 0 }, empty, empty],
      [{ type: 'number', value: 0, line: 0 }, { ...empty, blocks: [{ type: 'number', value: 5, line: 0 }] }, empty]
    ]) {
      assert.throws(() => gen.convIfExpression({ type: 'if_expr', blocks, line: 0 }), /もし.*式.*末尾/)
    }
  })

  it('括弧の中で計算・引数・配列・辞書の値に使える', async () => {
    await cmp('((もし1なら5、違えば2)+10)を表示', '15')
    await cmp('3に(もし0なら5、違えば2)を足して表示', '5')
    await cmp('A=[(もし1なら「猫」、違えば「犬」),0]。A[0]を表示', '猫')
    await cmp('A={"値":(もし0なら5、違えば2)}。A["値"]を表示', '2')
    await cmp('A=[0]。A[0]=もし1なら5、違えば2。A[0]を表示', '5')
    await cmp('A=もし0なら0、違えば[1,2]。A[1]を表示', '2')
    await cmp('A=もし1なら0n、違えば2n。(A+1n)を表示', '1')
  })

  it('分岐を入れ子にできる', async () => {
    await cmp('A=もし1なら(もし0なら10、違えば20)、違えば30。Aを表示', '20')
    await cmp('A=もし0なら10、違えば(もし1なら20、違えば30)。Aを表示', '20')
  })

  it('選んだ分岐だけ実行し末尾の式を返す', async () => {
    for (const [condition, expected] of [[1, '真\n5\n1'], [0, '偽\n2\n2']]) {
      await cmp(`回数=0
A=もし${condition}なら
  回数=回数+1
  「真」を表示
  5
違えば
  回数=回数+2
  「偽」を表示
  2
ここまで
Aを表示
回数を表示`, expected)
    }
  })

  it('条件の関数は一度だけ呼ぶ', async () => {
    await cmp(`回数=0
●判定処理
  回数=回数+1
  1を戻す
ここまで
A=もし判定処理なら5、違えば2
Aを表示
回数を表示`, '5\n1')
  })

  it('同期実行とユーザー関数の戻り値に使える', async () => {
    const nako = new NakoCompiler()
    assert.equal(nako.run('A=もし1なら5、違えば2。Aを表示', 'main.nako3').log, '5')
    await cmp(`●(値の)選択処理
  (もし値なら5、違えば2)を戻す
ここまで
1の選択処理を表示
0の選択処理を表示`, '5\n2')
  })

  it('非同期の呼び出しを待って値を返す', async () => {
    const nako = new NakoCompiler()
    let calls = 0
    nako.addPluginObject('test_if_async', {
      meta: { type: 'const', value: { pluginName: 'test_if_async', pluginVersion: '3.6.0', nakoRuntime: ['cnako', 'wnako'], nakoVersion: '3.6.0' } },
      非同期値取得: { type: 'func', josi: [], asyncFn: true, fn: async () => { calls++; return 7 } }
    })
    assert.equal((await nako.runAsync(`●非同期選択処理
  A=もし1なら
    非同期値取得
  違えば
    2
  ここまで
  Aを戻す
ここまで
非同期選択処理を表示
A=もし0なら非同期値取得、違えば2
Aを表示
A=もし非同期値取得なら5、違えば2
Aを表示
A=もし0なら5、違えば非同期値取得
Aを表示`, 'main.nako3')).log, '7\n2\n5\n7')
    assert.equal(calls, 3)
  })

  it('未選択の分岐の例外は発生しない', async () => {
    const nako = new NakoCompiler()
    nako.addPluginObject('test_if_throw', {
      meta: { type: 'const', value: { pluginName: 'test_if_throw', pluginVersion: '3.6.0', nakoRuntime: ['cnako', 'wnako'], nakoVersion: '3.6.0' } },
      失敗値取得: { type: 'func', josi: [], fn: () => { throw new Error('未選択') } }
    })
    assert.equal((await nako.runAsync('A=もし1なら5、違えば失敗値取得。Aを表示。A=もし0なら失敗値取得、違えば2。Aを表示', 'main.nako3')).log, '5\n2')
  })

  it('違えば・分岐の値・ここまでの欠落を構文エラーにする', () => {
    for (const code of [
      'A=もし1なら5。',
      'A=もし1なら、違えば2。',
      'A=もし1なら5、違えば。',
      'A=もし1なら\n5\n違えば\n2',
      'A=もし1なら\nB=5\n違えば\n2\nここまで',
      'A=もし1なら\n1を戻す\n5\n違えば\n2\nここまで',
      'A=もし1なら「結果」を表示、違えば2'
    ]) {
      const nako = new NakoCompiler()
      assert.throws(() => nako.compile(code, 'main.nako3'), /もし.*式/)
    }
  })

  it('従来のもし文を保つ', async () => {
    await cmp('もし1なら「真」を表示。違えば「偽」を表示。', '真')
    await cmp('もし0なら\n「真」を表示\n違えば\n「偽」を表示\nここまで', '偽')
    await cmp('A=もし1なら5、違えば2。もしA=5なら「真」を表示。', '真')
  })

  it('分岐の先頭の未対応構文を明示する', () => {
    const nako = new NakoCompiler()
    assert.throws(() => nako.compile('A=もし1なら\n抜ける\n5\n違えば\n2\nここまで', 'main.nako3'), /もし.*式の分岐には代入/)
  })

  it('構文エラー後も同じコンパイラで再実行できる', async () => {
    const nako = new NakoCompiler()
    assert.throws(() => nako.compile('A=もし1なら5', 'main.nako3'), /もし.*式/)
    assert.equal((await nako.runAsync('A=もし0なら5、違えば2。Aを表示', 'main.nako3')).log, '2')
  })

  it('文形式の入れ子にはもし式の案内を表示する', () => {
    for (const body of ['もし1なら「a」を表示', 'もし1なら\n  「a」を表示\nここまで', 'もし1なら5']) {
      const nako = new NakoCompiler()
      assert.throws(() => nako.compile(`A=もし1なら\n${body}\n5\n違えば\n2\nここまで`, 'main.nako3'), /入れ子の条件分岐は.*「もし」式で書いてください/)
    }
  })

  it('もし式の解析失敗時に開始位置と外側のスタックを戻す', () => {
    for (const code of ['もし1なら5', '(もし1なら5)', 'もし1なら(もし1なら5)、違えば2']) {
      const nako = new NakoCompiler()
      const parser = new NakoParser(nako.logger)
      parser.setFuncList(nako.funclist)
      parser.tokens = nako.lex(code, 'main.nako3').tokens
      const startIndex = code.startsWith('(') ? 1 : 0
      parser.index = startIndex
      const stack = [{ type: 'number', value: 3, josi: 'に', line: 0 }]
      parser.stack = stack
      parser.isReadingCalc = true
      assert.throws(() => parser.yIFExpression(), /もし.*式/)
      assert.equal(parser.getIndex(), startIndex)
      assert.strictEqual(parser.stack, stack)
      assert.equal(parser.stackList.length, 0)
      assert.equal(parser.isReadingCalc, true)
      assert.equal(parser.ifExpressionDepth, 0)
    }
  })

  it('パーサーとジェネレーターで同じ末尾の値の検証を使う', () => {
    for (const value of ['「結果」を表示', '表示(「結果」)', 'B=5']) {
      const nako = new NakoCompiler()
      assert.throws(() => nako.parse(`A=もし1なら\n${value}\n違えば\n2\nここまで`, 'main.nako3'), /もし.*式.*末尾/)
    }
    const nako = new NakoCompiler()
    const ast = nako.parse('A=もし1なら5、違えば2', 'main.nako3')
    const node = ast.blocks.find(node => node.type === 'let').blocks[0]
    node.blocks[1].blocks = [{ type: 'func', name: '表示', blocks: [], line: 0 }]
    assert.throws(() => new NakoGen(nako).convIfExpression(node), /もし.*式.*末尾/)
    node.blocks[1].blocks = [{ type: 'let', name: 'B', blocks: [], line: 0 }]
    assert.throws(() => new NakoGen(nako).convIfExpression(node), /もし.*式.*末尾/)
  })
})
