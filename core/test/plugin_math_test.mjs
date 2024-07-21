/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

// eslint-disable-next-line no-undef
describe('plugin_math_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }

  // --- test ---
  it('算術関数/SIGN', async () => {
    await cmp('-5のSIGNを表示', '-1')
    await cmp('-5の符号を表示', '-1')
    await cmp('5の符号を表示', '1')
    await cmp('0の符号を表示', '0')
  })
  it('算術関数/FRAC', async () => {
    await cmp('5.5のFRACを表示', '0.5')
    await cmp('5.5の小数部分を表示', '0.5')
    await cmp('3.14の整数部分を表示', '3')
    await cmp('-3.14の整数部分を表示', '-3')
  })
  it('ATAN2', async () => {
    await cmp('90と15のATAN2を表示', '1.4056476493802699')
    await cmp('15と90のATAN2を表示', '0.16514867741462683')
  })
  it('座標角度計算 (#875)', async () => {
    await cmp('[10,10]の座標角度計算して表示', '45')
    await cmp('[0,10]の座標角度計算して表示', '90')
    await cmp('[10,0]の座標角度計算して表示', '0')
  })
})
