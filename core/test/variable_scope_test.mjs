/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('variable_scope_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    const realResult = (await nako.runAsync(code, 'main.nako3')).log
    assert.strictEqual(realResult, res)
  }

  it('関数内からグローバル変数へ代入', async () => {
    await cmp(`
Aとは変数
●Fとは
    A=1
ここまで
F
Aを表示
`, '1')
  })
  it('関数内からグローバル変数を参照', async () => {
    await cmp(`
Aとは変数
●Fとは
    Aを表示
ここまで
A=1
F
`, '1')
  })
  it('変数のshadowing', async () => {
    await cmp(`
Aとは変数
A=2
●Fとは
    Aとは変数
    A=1
    Aを表示
ここまで
F
Aを表示
`, '1\n2')
  })
  it('ネストした関数定義', async () => {
    // 関数内の関数定義は、関数外で定義されている場合と同じ扱いとする。
    await cmp(`
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
  it('JavaScriptで使えない変数名の使用 - グローバル変数の場合', async () => {
    await cmp(`
if=10
ifを表示
`, '10')
  })
  it('JavaScriptで使えない変数名の使用 - ローカル変数の場合', async () => {
    await cmp(`
●function
    var=10
    varを表示
ここまで
function
`, '10')
  })
  it('JavaScriptで使えない変数名の使用 - 関数からグローバル変数を参照する場合', async () => {
    await cmp(`
var=10
●function
    varを表示
ここまで
function
`, '10')
  })
  it('JavaScriptで使えない変数名の使用 - 変数のshadowing', async () => {
    await cmp(`
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
  it('「代入」文が正しく動作しない #1208', async () => {
    await cmp(`
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
  it('代入文のテスト #1225', async () => {
    await cmp(`
A=10。
Bは20。
Cに30を代入。
Dは40である。
Eは50です。
変数 Fは60
変数[G,H,I]=[70,80,90]
J,K,L=[1,2,3]
テスト。
●テストとは
  [A,B,C,D,E,F,G,H,I,J,K,L]をJSONエンコードして表示。
ここまで。
`, '[10,20,30,40,50,60,70,80,90,1,2,3]')
  })
  it('定数文のテスト #1225', async () => {
    await cmp(`
Aを10に定める。
定数 Bは20。
定数[C,D,E]=[30,40,50]
テスト。
●テストとは
  [A,B,C,D,E]をJSONエンコードして表示。
ここまで。
`, '[10,20,30,40,50]')
  })
  it('変数宣言のテスト core#158', async () => {
    await cmp('変数 A;A=30;Aを表示。', '30')
    await cmp('変数 B=30;Bを表示。', '30')
    await cmp('変数 C{公開}=30;Cを表示。', '30')
  })
  // #1746 貯蔵庫で2回実行すると変数がundefinedになる
  it('2回実行しても変数がundefinedにならない', async () => {
    const nako = new NakoCompiler()
    const code = `
変数 hoge=10
hogeを表示
それは関数
    変数 hoge=20
ここまで
`
    const opt = { resetEnv: true, resetAll: false, preCode: '' }
    const r1 = await nako.runAsync(code, 'main.nako3', opt)
    assert.strictEqual(r1.log, '10')
    const r2 = await nako.runAsync(code, 'main.nako3', opt)
    assert.strictEqual(r2.log, '10')
  })
  // #1746 無名関数でローカル変数を宣言した後にトップレベルで同名の変数宣言するとundefinedになる
  it('無名関数のローカル変数が外側のスコープに漏れない', async () => {
    await cmp(`
それは関数
    変数 hoge=20
ここまで
変数 hoge=10
hogeを表示
`, '10')
  })
})
