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
    // await cmp(`${codeInclude}\n●AAAとは\n3の二倍表示処理\nここまで。AAA;`, '6')
    // await cmp(`${codeInclude}\n●AAAとは\n3の三倍表示処理\nここまで。AAA;`, '9')
    // await cmp(`${codeInclude}\n●AAAとは\n3の四倍表示処理\nここまで。AAA;`, '12')
  })
})
