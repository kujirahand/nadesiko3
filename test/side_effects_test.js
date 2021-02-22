const NakoCompiler = require('../src/nako3')
const assert = require('assert')
const CNako3 = require('../src/cnako3')
const { NakoSyntaxError } = require('../src/nako_errors')

describe('side_effects_test', () => {
    it('変数の定義', () => {
        const nako = new NakoCompiler()
        nako.runReset(`A=10`, 'main.nako3')
        assert.strictEqual(nako.runReset(`Aを表示`, 'main.nako3').log, `undefined`)
    })
    it('関数の定義 - 変数として参照', () => {
        const nako = new NakoCompiler()
        nako.runReset(`●Aとは\nここまで`, 'main.nako3')
        assert.strictEqual(nako.runReset(`Aを表示`, 'main.nako3').log, `undefined`)
    })
    it('関数の定義 - 関数として参照', () => {
        const nako = new NakoCompiler()
        nako.runReset(`●Aとは\nここまで`, 'main.nako3')
        assert.throws(() => nako.runReset(`A`, 'main.nako3'), NakoSyntaxError)
    })
    it('関数の定義 - 関数として定義した場合', () => {
        const nako = new NakoCompiler()
        nako.runReset(`●Aとは\nここまで`, 'main.nako3')
        assert.strictEqual(nako.runReset(`●（xの）Aとは\nここまで`, 'main.nako3').log, ``)
    })
    it('プラグイン変数の上書き', () => {
        const nako = new NakoCompiler()
        nako.addPluginObject('SideEffectTestPlugin', {
            'プラグイン変数': {type: 'var', value: 100},
        })
        nako.runReset(`プラグイン変数=20`, 'main.nako3')
        assert.strictEqual(nako.runReset(`プラグイン変数を表示`, 'main.nako3').log, `100`)
    })
    it('プラグイン関数の上書き', () => {
        const nako = new NakoCompiler()
        nako.runReset(`●足すとは\nここまで`, 'main.nako3')
        assert.strictEqual(nako.runReset(`1と2を足して表示`, 'main.nako3').log, `3`)
    })
    it('プラグインの取り込み', () => {
        const nako = new CNako3({ nostd: true })
        nako.silent = true

        // 取り込み命令ありで実行
        const code1 = '!「plugin_csv」を取り込む。\n「1,2」のCSV取得して表示'
        assert.strictEqual(nako.runReset(code1, 'main.nako3').log, `1,2`)

        // 取り込み命令なしで実行
        const code2 = '!「1,2」のCSV取得して表示'
        assert.throws(() => nako.runReset(code2, 'main.nako3'), NakoSyntaxError)
    })
    it('ファイルの取り込み', () => {
        const nako = new CNako3({ nostd: true })
        nako.silent = true

        // 取り込み命令ありで実行
        const code1 = '!「test/requiretest.nako3」を取り込む。\n痕跡を表示。3と5を痕跡演算して、表示。'
        assert.strictEqual(nako.runReset(code1, 'main.nako3').log, `5\n8`)

        // 取り込み命令なしで実行
        const code2 = '痕跡を表示。3と5を痕跡演算して、表示。'
        assert.throws(() => nako.runReset(code2, 'main.nako3'), NakoSyntaxError)
    })
})
