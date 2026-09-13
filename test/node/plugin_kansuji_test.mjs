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
    // 小数リテラルでも指数表記と同じ桁数制限・末尾0正規化になる
    await cmp(`「0.${'0'.repeat(71)}1」の漢数字の算用数字を表示。`, '1e-72')
    await cmp(`「0.${'0'.repeat(71)}1000」の漢数字の算用数字を表示。`, '1e-72')
    await cmp('「0.0001000」の漢数字の算用数字を表示。', '0.0001')
  })
  it('漢数字の指数表記は扱える桁数を超えたらエラー #2485', async () => {
    await reject('「1e72」を漢数字して表示。', /大きさを超えています/)
    await reject('「1e+72」を漢数字して表示。', /大きさを超えています/)
    await reject('「1e-73」を漢数字して表示。', /大きさを超えています/)
    await reject(`「0.${'0'.repeat(72)}1」を漢数字して表示。`, /大きさを超えています/)
    await reject(`「0.${'0'.repeat(72)}1000」を漢数字して表示。`, /大きさを超えています/)
    await reject('「1e80」を漢数字して表示。', /大きさを超えています/)
    await reject('「1e1000000」を漢数字して表示。', /大きさを超えています/)
    await reject('「1e-1000000」を漢数字して表示。', /大きさを超えています/)
    await reject('「9999999999999999999999999999999999999999999999999999999999999999999999999」を漢数字して表示。', /大きさを超えています/)
  })
  it('漢数字の非十進表記は入力エラー #2486', async () => {
    // Number() では数値とみなされるが十進表記ではない入力を一律に拒否する
    await reject('「0x10」を漢数字して表示。', /無効な文字/)
    await reject('「0X10」を漢数字して表示。', /無効な文字/)
    await reject('「-0x10」を漢数字して表示。', /無効な文字/)
    await reject('「0b101」を漢数字して表示。', /無効な文字/)
    await reject('「0o17」を漢数字して表示。', /無効な文字/)
    await reject('「Infinity」を漢数字して表示。', /無効な文字/)
    await reject('「-Infinity」を漢数字して表示。', /無効な文字/)
    await reject('「+Infinity」を漢数字して表示。', /無効な文字/)
    await reject('「NaN」を漢数字して表示。', /無効な文字/)
    // 前後の空白・空文字列も受理しない
    await reject('「 12 」を漢数字して表示。', /無効な文字/)
    await reject('「　12」を漢数字して表示。', /無効な文字/)
    await reject('「」を漢数字して表示。', /無効な文字/)
    // 指数表記の形を崩したものも拒否する
    await reject('「1e」を漢数字して表示。', /無効な文字/)
    await reject('「e3」を漢数字して表示。', /無効な文字/)
    await reject('「1e3.5」を漢数字して表示。', /無効な文字/)
    await reject('「1e+」を漢数字して表示。', /無効な文字/)
    await reject('「1e-」を漢数字して表示。', /無効な文字/)
    await reject('「.e3」を漢数字して表示。', /無効な文字/)
    await reject('「1.e」を漢数字して表示。', /無効な文字/)
    // 符号や小数点だけでは数値にならない
    await reject('「+」を漢数字して表示。', /無効な文字/)
    await reject('「-」を漢数字して表示。', /無効な文字/)
    await reject('「.」を漢数字して表示。', /無効な文字/)
    await reject('「-.」を漢数字して表示。', /無効な文字/)
    // 末尾・途中の改行・行終端文字も受理しない
    await reject('「12{改行}」を漢数字して表示。', /無効な文字/)
    await reject('「1{改行}2」を漢数字して表示。', /無効な文字/)
    // \r・\r\n は前処理で \n に正規化されてからプラグインへ渡る
    await reject('「12\r」を漢数字して表示。', /無効な文字/)
    await reject('「12\u2028」を漢数字して表示。', /無効な文字/)
    await reject('「12\u2029」を漢数字して表示。', /無効な文字/)
    await reject('「12\r\n」を漢数字して表示。', /無効な文字/)
  })
  it('漢数字の十進表記は変換できる #2486', async () => {
    await cmp('「12」を漢数字して表示。', '十二')
    await cmp('「.5」を漢数字して表示。', '零・五')
    await cmp('「-.5」を漢数字して表示。', '-零・五')
    // 末尾の小数点は指数表記の仮数部(「1.e3」→「千」)と同様に丸める
    await cmp('「5.」を漢数字して表示。', '五')
    await cmp('「-5.」を漢数字して表示。', '-五')
    await cmp('「5.e3」を漢数字して表示。', '五千')
    // 0相当の表記(末尾の小数点丸めを含む)は符号を付けず「零」になる
    await cmp('「0.」を漢数字して表示。', '零')
    await cmp('「-0.」を漢数字して表示。', '零')
    await cmp('「.0」を漢数字して表示。', '零')
    await cmp('「00.00」を漢数字して表示。', '零')
  })
  it('漢数字の非指数表記(既存動作)', async () => {
    await cmp('3.14の漢数字を表示。', '三・一四')
    await cmp('「-123」を漢数字して表示。', '-百二十三')
    await cmp('「１２３４５６７８９０」の漢数字を表示。', '十二億三千四百五十六万七千八百九十')
    await cmp('「三・一四」の算用数字を表示。', '3.14')
    await cmp('「二億九千九百七十九万二千四百五十八」の算用数字を表示。', '299792458')
  })
})
