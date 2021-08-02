const assert = require('assert')
const NakoCompiler = require('../../src/nako3')
const PluginKansuji = require('../../src/plugin_kansuji.js')

describe('plugin_kansuji_test', () => {
  const nako = new NakoCompiler()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  nako.addPluginFile('PluginKansuji', 'plugin_kansuji.js', PluginKansuji)
  const cmp = (code, res) => {
    nako.logger.debug('code=' + code)

    assert.strictEqual(nako.run(code).log, res)
  }

  // --- test ---
  it('漢数字', () => {
    cmp('「三・一四」の算用数字を表示。', '3.14')
    cmp('3.14の漢数字を表示。', '三・一四')
    cmp('１２３４５６７８９０の漢数字を表示。', '十二億三千四百五十六万七千八百九十')
    cmp('「１２３４５６７８９０」の漢数字を表示。', '十二億三千四百五十六万七千八百九十')
    cmp('「二億九千九百七十九万二千四百五十八」の算用数字を表示。', '299792458')
    cmp('「1e+10」の漢数字の算用数字を表示。', '10000000000')
    cmp('「1e10」の漢数字の算用数字を表示。', '10000000000')
    cmp('「1e-10」の漢数字の算用数字を表示。', '1e-10')
    cmp('「1.1」の漢数字の算用数字を表示。', '1.1')
    cmp('「1.1e+1」の漢数字の算用数字を表示。', '11')
    cmp('「1.234e+2」の漢数字の算用数字を表示。', '123.4')
    cmp('「1.234e2」の漢数字の算用数字を表示。', '123.4')
    cmp('「1.234e23」の漢数字の算用数字を表示。', '123400000000000000000000')
    cmp('「1.234e-23」の漢数字の算用数字を表示。', '1.234e-23')
    cmp('「901.1234e-2」の漢数字の算用数字を表示。', '9.011234')
    cmp('「0」の漢数字の算用数字を表示。', '0')
    cmp('「1」の漢数字の算用数字を表示。', '1')
    cmp('「10」の漢数字の算用数字を表示。', '10')
    cmp('「11」の漢数字の算用数字を表示。', '11')
    cmp('「12」の漢数字の算用数字を表示。', '12')
    cmp('「20」の漢数字の算用数字を表示。', '20')
    cmp('「102」の漢数字の算用数字を表示。', '102')
    cmp('「200」の漢数字の算用数字を表示。', '200')
    cmp('「1002」の漢数字の算用数字を表示。', '1002')
    cmp('「1020」の漢数字の算用数字を表示。', '1020')
    cmp('「2000」の漢数字の算用数字を表示。', '2000')
    cmp('「10002」の漢数字の算用数字を表示。', '10002')
    cmp('「20000」の漢数字の算用数字を表示。', '20000')
    cmp('「10000000」の漢数字の算用数字を表示。', '10000000')
    cmp('「100000000」の漢数字の算用数字を表示。', '100000000')
    cmp('「28000103206018」の漢数字の算用数字を表示。', '28000103206018')
    cmp('「161803398874989484820458683436563811772030917980576286213544862270526046」の漢数字の算用数字を表示。', '161803398874989484820458683436563811772030917980576286213544862270526046')
  })
  //
  it('漢数字の0とマイナス #874', () => {
    cmp('0の漢数字を表示。', '零')
    cmp('「０」の漢数字を表示。', '零')
    cmp('「零」の算用数字を表示。', '0')
    cmp('-1の漢数字を表示。', '-一')
    cmp('"+1"の漢数字を表示。', '+一')
    cmp('「-1」の漢数字を表示。', '-一')
  })
})
