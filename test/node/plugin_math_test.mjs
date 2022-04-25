import assert from 'assert'
import { NakoCompiler } from '../../src/nako3.mjs'
import { CNako3 } from '../../src/cnako3mod.mjs'

describe('plugin_math_test', () => {
  const wnako = new NakoCompiler()

  const cnako = new CNako3()
  cnako.silent = true
  // wnako.logger.addListener('trace', ({ nodeConsole }) => { console.log(nodeConsole) })

  const cmp = async (code, res) => {
    for (let nako of [cnako, wnako]) {
      let c = code
      nako.logger.debug('code=' + code)
      assert.strictEqual((await nako.run(c)).log, res)
    }
  }

  // --- test ---
  it('算術関数/SIGN', () => {
    cmp('-5のSIGNを表示', '-1')
    cmp('-5の符号を表示', '-1')
    cmp('5の符号を表示', '1')
    cmp('0の符号を表示', '0')
  })
  it('算術関数/FRAC', () => {
    cmp('5.5のFRACを表示', '0.5')
    cmp('5.5の小数部分を表示', '0.5')
    cmp('3.14の整数部分を表示', '3')
    cmp('-3.14の整数部分を表示', '-3')
  })
  it('ATAN2', () => {
    cmp('90と15のATAN2を表示', '1.4056476493802699')
    cmp('15と90のATAN2を表示', '0.16514867741462683')
  })
  it('座標角度計算 (#875)', () => {
    cmp('[10,10]の座標角度計算して表示', '45')
    cmp('[0,10]の座標角度計算して表示', '90')
    cmp('[10,0]の座標角度計算して表示', '0')
  })
})
