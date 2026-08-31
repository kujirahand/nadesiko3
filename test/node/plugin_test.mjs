/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'
import { CNako3 } from '../../src/cnako3mod.mjs'

// __dirname のために
import url from 'url'
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('plugin_test', () => {
  const nako = new CNako3()
  const scope1 = path.join(__dirname, 'scope1.nako3')
  const scope2 = path.join(__dirname, 'scope2.nako3')
  const scopeAssignment = path.join(__dirname, 'scope_assignment.nako3')
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    nako.getLogger().debug('code=' + code)
    const ret = await nako.runAsync(code, 'main.nako3')
    if (ret.log !== res) {
      console.log('[ERROR]', ret.log, '!=', res)
    }
    assert.strictEqual(ret.log, res)
    nako.reset()
  }
  const reject = async (/** @type {string} */ code, /** @type {RegExp} */ pattern) => {
    try {
      await assert.rejects(nako.runAsync(code, 'main.nako3'), pattern)
    } finally {
      nako.reset()
    }
  }
  it('JS「取り込む」', async () => {
    const plug = path.join(__dirname, '..', '..', 'src', 'plugin_keigo.mjs')
    await cmp(`!「${plug}」を取り込む。\n拝啓。お世話になっております。礼節レベル取得して表示。`, '1')
  })
  it('NAKO3スコープテスト1__グローバル変数', async () => {
    await cmp(`!「${scope1}」を取り込む。\n朝食値段を表示。`, '1000')
    await cmp(`!「${scope1}」を取り込む。\nscope1__スコープ取得して表示。`, 'scope1')
  })
  it('NAKO3スコープテスト2__グローバル変数', async () => {
    await cmp(`!「${scope2}」を取り込む。\n朝食値段を表示。`, '2000')
    await cmp(`!「${scope2}」を取り込む。\nscope2__スコープ取得して表示。`, 'scope2')
  })
  it('NAKO3スコープテスト1+2__関数', async () => {
    const scope = `!「${scope1}」を取り込む。\n!「${scope2}」を取り込む。\n`
    const reverse = `!「${scope2}」を取り込む。\n!「${scope1}」を取り込む。\n`
    await cmp(`${scope};scope1__朝食取得して表示。`, '1000')
    await cmp(`${scope};scope2__朝食取得して表示。`, '2000')
    await cmp(`${reverse};scope1__朝食取得して表示;scope2__朝食取得して表示。`, '1000\n2000')
  })
  it('NAKO3スコープテスト1+2__変数', async () => {
    const scope = `!「${scope1}」を取り込む。\n!「${scope2}」を取り込む。\n`
    await cmp(`${scope};朝食値段を表示。`, '1000')
    await cmp(`${scope};scope2__朝食値段=2500;scope2__朝食取得して表示。`, '2500')
    await cmp(`${scope};朝食値段=3000;朝食値段を表示;scope1__朝食取得して表示;scope2__朝食取得して表示。`, '3000\n1000\n2000')
    await cmp(`${scope};3000を朝食値段に代入;朝食値段を表示;scope1__朝食取得して表示;scope2__朝食取得して表示。`, '3000\n1000\n2000')
    await cmp(`${scope};2500をscope2__朝食値段に代入;scope2__朝食取得して表示。`, '2500')
    // ファイル直下の無修飾な増減は、自ファイル側の未初期化変数を0として開始する。
    await cmp(`${scope};朝食値段を100だけ増やす;朝食値段を表示;scope1__朝食取得して表示;scope2__朝食取得して表示。`, '100\n1000\n2000')
  })
  it('NAKO3スコープテスト__取り込んだ配列とプロパティの更新', async () => {
    const scope = `!「${scopeAssignment}」を取り込む。\n`
    await cmp(`${scope};配列値[0]=99;配列値[0]を表示。`, '99')
    await cmp(`${scope};配列値@0=98;配列値@0を表示。`, '98')
    await cmp(`${scope};97を配列値[0]に代入;配列値[0]を表示。`, '97')
    await cmp(`${scope};配列値[0]を5だけ増やす;配列値[0]を表示。`, '15')
    await cmp(`${scope};設定物$値=99;設定物$値を表示。`, '99')
    await cmp(`${scope};設定物$値を5だけ増やす;設定物$値を表示。`, '15')
    await cmp(`${scope};複合[0]$値=99;複合[0]$値を表示。`, '99')
    await cmp(`${scope};定数配列[0]=99;定数配列[0]を表示。`, '99')
  })
  it('NAKO3スコープテスト__取り込んだ定数は変更できない', async () => {
    const scope = `!「${scopeAssignment}」を取り込む。\n`
    await reject(`${scope};固定値=5。`, /定数/)
    await reject(`${scope};5を固定値に代入。`, /定数/)
    await reject(`${scope};固定値を5だけ増やす。`, /定数/)
  })
})
