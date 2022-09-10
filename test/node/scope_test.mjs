/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'
import { CNako3 } from '../../src/cnako3mod.mjs'
// __dirname のために
import url from 'url'
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('scope_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new CNako3()
    const g = await nako.runAsync(code, 'main.nako3')
    assert.strictEqual(g.log, res)
  }
  // test file
  const scopeA = path.join(__dirname, 'scope_a.nako3')
  const scopeB = path.join(__dirname, 'scope_b.nako3')
  const scopeC = path.join(__dirname, 'scope_c.nako3')
  const codeInclude = `!「${scopeA}」を取り込む。\n!「${scopeB}」を取り込む。\n!「${scopeC}」を取り込む。\n`
  // test
  it('scope_a', async () => {
    await cmp(`!「${scopeA}」を取り込む。3の二倍表示処理。`, '6')
    await cmp(`!「${scopeA}」を取り込む。3のscope_a__二倍表示処理。`, '6')
  })
  it('scope_a & scope_b', async () => {
    await cmp(`!「${scopeA}」を取り込む。\n!「${scopeB}」を取り込む。\n3の二倍表示処理。`, '6')
    await cmp(`!「${scopeA}」を取り込む。\n!「${scopeB}」を取り込む。\n3の三倍表示処理。`, '9')
    await cmp(`!「${scopeA}」を取り込む。\n!「${scopeB}」を取り込む。\n3のscope_a__二倍表示処理。`, '6')
    await cmp(`!「${scopeA}」を取り込む。\n!「${scopeB}」を取り込む。\n3のscope_b__二倍表示処理。`, '6')
    await cmp(`!「${scopeA}」を取り込む。\n!「${scopeB}」を取り込む。\n3のscope_b__三倍表示処理。`, '9')
  })
  it('scope_a & scope_b & scope_c', async () => {
    // scope なし
    await cmp(`${codeInclude}\n3の二倍表示処理。`, '6')
    await cmp(`${codeInclude}\n3の三倍表示処理。`, '9')
    await cmp(`${codeInclude}\n3の四倍表示処理。`, '12')
    // scope あり
    await cmp(`${codeInclude}\n3のscope_a__二倍表示処理。`, '6')
    await cmp(`${codeInclude}\n3のscope_b__三倍表示処理。`, '9')
    await cmp(`${codeInclude}\n3のscope_c__四倍表示処理。`, '12')
  })
  it('関数の中から関数を呼ぶ', async () => {
    await cmp(`${codeInclude}\n●AAAとは\n3の二倍表示処理\nここまで。AAA;`, '6')
    await cmp(`${codeInclude}\n●AAAとは\n3の三倍表示処理\nここまで。AAA;`, '9')
    await cmp(`${codeInclude}\n●AAAとは\n3の四倍表示処理\nここまで。AAA;`, '12')
  })
  it('文字列で取り込み先の関数を呼び出す場合', async () => {
    await cmp(`${codeInclude}\n[1,5,3,2,4]を「カスタムソート処理」で配列カスタムソートしてJSONエンコードして表示`, '[1,2,3,4,5]')
    await cmp(`${codeInclude}\n[1,3,2]を「scope_c__カスタムソート処理」で配列カスタムソートしてJSONエンコードして表示`, '[1,2,3]')
  })
  it('取り込みつつ自分のスコープの関数を文字列で呼び出す場合', async () => {
    await cmp(`${codeInclude}\n●(A,Bを)AAAとは\nA-Bを戻す\nここまで;[1,5,3,2,4]を「AAA」で配列カスタムソートしてJSONエンコードして表示`, '[1,2,3,4,5]')
    await cmp(`${codeInclude}\n●(A,Bを)カスタムソート処理とは\nB-Aを戻す\nここまで;[1,3,2]を「カスタムソート処理」で配列カスタムソートしてJSONエンコードして表示`, '[3,2,1]')
    await cmp(`${codeInclude}\n●(A,Bを)カスタムソート処理とは\nB-Aを戻す\nここまで;[1,3,2]を「scope_c__カスタムソート処理」で配列カスタムソートしてJSONエンコードして表示`, '[1,2,3]')
    await cmp(`${codeInclude}\n●(A,Bを)カスタムソート処理とは\nB-Aを戻す\nここまで;[1,3,2]を「main__カスタムソート処理」で配列カスタムソートしてJSONエンコードして表示`, '[3,2,1]')
  })
})
