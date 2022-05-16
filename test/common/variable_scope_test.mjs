import assert from 'assert'
import { NakoCompiler } from '../../src/nako3.mjs'

describe('variable_scope_test', () => {
    const nako = new NakoCompiler()
    const cmp = (code, res) => {
        assert.strictEqual(nako.run(code).log, res)
    }

    it('関数内からグローバル変数へ代入', () => {
        cmp(`
Aとは変数
●Fとは
    A=1
ここまで
F
Aを表示
`, `1`)
    })
    it('関数内からグローバル変数を参照', () => {
        cmp(`
Aとは変数
●Fとは
    Aを表示
ここまで
A=1
F
`, `1`)
    })
    it('変数のshadowing', () => {
        cmp(`
Aとは変数
A=2
●Fとは
    Aとは変数
    A=1
    Aを表示
ここまで
F
Aを表示
`, `1\n2`)
    })
    it('ネストした関数定義', () => {
        // 関数内の関数定義は、関数外で定義されている場合と同じ扱いとする。
        cmp(`
Aとは変数
A=3
●Fとは
    Aとは変数
    ●Gとは
        A=1
    ここまで
ここまで
G
Aを表示
`, '1')
    })
    it('JavaScriptで使えない変数名の使用 - グローバル変数の場合', () => {
        cmp(`
if=10
ifを表示
`, '10')
    })
    it('JavaScriptで使えない変数名の使用 - ローカル変数の場合', () => {
        cmp(`
●function
    var=10
    varを表示
ここまで
function
`, '10')
    })
    it('JavaScriptで使えない変数名の使用 - 関数からグローバル変数を参照する場合', () => {
        cmp(`
var=10
●function
    varを表示
ここまで
function
`, '10')
    })
    it('JavaScriptで使えない変数名の使用 - 変数のshadowing', () => {
        cmp(`
var=10
●function
    varsとは変数
    vars=1
ここまで
function
varを表示
`, '10')
    })
    /*
    // 暫定 #1131 修正のため
    it('関数内から「ナデシコする」を呼ぶ', () => {
        cmp(`\
A=1
●Fとは
    B=2
    「A=3;B=4」をナデシコする
    Aを表示
    Bを表示
ここまで
F
`, '3\n4')
    })
    */
    it('「代入」文が正しく動作しない #1208', () => {
        cmp(`
A=10
20をBに代入。
Aを表示。
Bを表示。        
テスト。
●テストとは
    Aを表示。
    Bを表示。
ここまで。
`, '10\n20\n10\n20')
    })
    it('「定める」文が正しく動作しない #1225', () => {
        cmp(`
英語挨拶１を10に定める。
定数　英語挨拶２=20
英語挨拶１を表示。
英語挨拶２を表示。
テスト。
●テストとは
　　英語挨拶１を表示。
　　英語挨拶２を表示。
ここまで。
`, '10\n20\n10\n20')
    })
})
