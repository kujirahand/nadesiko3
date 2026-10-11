import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { NakoCompiler } from '../src/nako3.mjs'

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
Aを表示`, 'main.nako3')).log, '7\n2')
    assert.equal(calls, 1)
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
  })
})
