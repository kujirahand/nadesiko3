import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { NakoCompiler } from '../src/nako3.mjs'

describe('配列の範囲添字アクセス #2599', () => {
  const cmp = async (code, expected) => {
    const nako = new NakoCompiler()
    assert.equal((await nako.runAsync(code, 'main.nako3')).log, expected)
  }

  it('末尾を含めないスライスを取得する', async () => {
    await cmp('A=[0,1,2,3,4,5,6];A_SUB=A[0…3];A_SUBをJSON変換して表示', '[0,1,2]')
    await cmp('A=[0,1,2,3];区間=1…3;A[区間]をJSONエンコードして表示;A@(区間)をJSONエンコードして表示', '[1,2]\n[1,2]')
  })

  it('負の位置・範囲外・空の範囲を扱う', async () => {
    await cmp('A=[0,1,2,3];B=[A[-3…-1],A[-2…4],A[-99…99],A[4…9],A[2…1],A[1…1],([])[0…3]];BをJSONエンコードして表示', '[[1,2],[2,3],[0,1,2,3],[],[],[],[]]')
  })

  it('括弧内の配列・入れ子の要素をスライスする', async () => {
    await cmp('([0,1,2,3])[1…3]をJSONエンコードして表示;A=[[0,1,2,3]];A[0][1…3]をJSONエンコードして表示;A[0,1…3][0]を表示', '[1,2]\n[1,2]\n1')
  })

  it('元の配列を変更せず浅いコピーを返す', async () => {
    await cmp('A=[[1],[2],[3]];B=A[0…2];B[0][0]=9;B[1]=[8];AをJSONエンコードして表示;BをJSONエンコードして表示', '[[9],[2],[3]]\n[[9],[8]]')
  })

  it('配列取得と範囲取得を一度だけ評価する', async () => {
    await cmp('回数=0\n●配列取得とは\n回数を1増やす\n[0,1,2,3]を戻す\nここまで\n●区間取得とは\n回数を10増やす\n1…3を戻す\nここまで\n(配列取得)[区間取得]をJSONエンコードして表示\n回数を表示', '[1,2]\n11')
  })

  it('既存の参照命令の末尾を含む動作を維持する', async () => {
    await cmp('A=[0,1,2,3];Aの0…3を参照してJSONエンコードして表示;A[0…3]をJSONエンコードして表示', '[0,1,2,3]\n[0,1,2]')
  })
})
