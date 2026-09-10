/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginKansuji from '../../src/plugin_kansuji.mjs'

describe('plugin_kansuji_test', () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.addPluginFile('PluginKansuji', 'plugin_kansuji.js', PluginKansuji)
    nako.logger.debug('code=' + code)
    const g = await nako.runAsync(code)
    assert.strictEqual(g.log, res)
  }
  const reject = async (/** @type {string} */ code, /** @type {RegExp} */ pattern) => {
    const nako = new NakoCompiler()
    nako.addPluginFile('PluginKansuji', 'plugin_kansuji.js', PluginKansuji)
    await assert.rejects(nako.runAsync(code), pattern)
  }

  // --- test ---
  it('漢数字の指数表記 #2485', async () => {
    await cmp('「10e1」を漢数字して表示。', '百')
    await cmp('「01e2」を漢数字して表示。', '百')
    await cmp('「.5e1」を漢数字して表示。', '五')
    await cmp('「-1e3」を漢数字して表示。', '-千')
    await cmp('「1e-3」を漢数字して表示。', '零・〇〇一')
    await cmp('「1e3」を漢数字して表示。', '千')
  })
  it('漢数字の指数表記の境界ケース #2485', async () => {
    await cmp('「+1e3」を漢数字して表示。', '+千')
    await cmp('「1E3」を漢数字して表示。', '千')
    await cmp('「1.e3」を漢数字して表示。', '千')
    await cmp('「-.5e1」を漢数字して表示。', '-五')
    await cmp('「-1e-3」を漢数字して表示。', '-零・〇〇一')
    await cmp('「10e-1」を漢数字して表示。', '一')
    await cmp('「000.100e-1」を漢数字して表示。', '零・〇一')
    await cmp('「0e5」を漢数字して表示。', '零')
    await cmp('「0.0e1」を漢数字して表示。', '零')
    await cmp('「-0e1」を漢数字して表示。', '零')
    await cmp('「-0.0」を漢数字して表示。', '零')
    await cmp('「+0.0」を漢数字して表示。', '零')
  })
  it('漢数字の指数表記の往復変換 #2485', async () => {
    await cmp('「1e10」の漢数字の算用数字を表示。', '10000000000')
    await cmp('「1e+10」の漢数字の算用数字を表示。', '10000000000')
    await cmp('「1e-10」の漢数字の算用数字を表示。', '1e-10')
    await cmp('「1.1e+1」の漢数字の算用数字を表示。', '11')
    await cmp('「1.234e2」の漢数字の算用数字を表示。', '123.4')
    await cmp('「1.234e-23」の漢数字の算用数字を表示。', '1.234e-23')
    await cmp('「901.1234e-2」の漢数字の算用数字を表示。', '9.011234')
    // 巨大整数をNumberへ丸めずに桁を保つ
    await cmp('「1.234e23」の漢数字の算用数字を表示。', '123400000000000000000000')
    // 扱える最大桁数ちょうど
    await cmp('「1e71」の漢数字の算用数字を表示。', '1' + '0'.repeat(71))
    await cmp('「1e-72」の漢数字の算用数字を表示。', '1e-72')
    await cmp(`「${'9'.repeat(72)}」の漢数字の算用数字を表示。`, '9'.repeat(72))
    // 末尾0を除けば同じ値になる表記も受理する
    await cmp('「1.00e2」を漢数字して表示。', '百')
    await cmp('「1.0e-72」の漢数字の算用数字を表示。', '1e-72')
    await cmp('「10e-73」の漢数字の算用数字を表示。', '1e-72')
    await cmp('「100e-74」の漢数字の算用数字を表示。', '1e-72')
    await cmp('「1.0e71」の漢数字の算用数字を表示。', '1' + '0'.repeat(71))
    await cmp('「9e71」の漢数字の算用数字を表示。', '9' + '0'.repeat(71))
    // 小数点位置がちょうど0になる経路
    await cmp('「5e-1」を漢数字して表示。', '零・五')
    await cmp('「0.1e-71」の漢数字の算用数字を表示。', '1e-72')
  })
  it('漢数字の指数表記は扱える桁数を超えたらエラー #2485', async () => {
    await reject('「1e72」を漢数字して表示。', /大きさを超えています/)
    await reject('「1e+72」を漢数字して表示。', /大きさを超えています/)
    await reject('「1e-73」を漢数字して表示。', /大きさを超えています/)
    await reject('「1e80」を漢数字して表示。', /大きさを超えています/)
    await reject('「1e1000000」を漢数字して表示。', /大きさを超えています/)
    await reject('「1e-1000000」を漢数字して表示。', /大きさを超えています/)
    await reject('「9999999999999999999999999999999999999999999999999999999999999999999999999」を漢数字して表示。', /大きさを超えています/)
  })
  it('漢数字の非指数表記(既存動作)', async () => {
    await cmp('3.14の漢数字を表示。', '三・一四')
    await cmp('「-123」を漢数字して表示。', '-百二十三')
    await cmp('「１２３４５６７８９０」の漢数字を表示。', '十二億三千四百五十六万七千八百九十')
    await cmp('「三・一四」の算用数字を表示。', '3.14')
    await cmp('「二億九千九百七十九万二千四百五十八」の算用数字を表示。', '299792458')
  })
})
