/* eslint-disable no-undef */
import { describe, it } from 'node:test'
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
  // #2665 関数宣言より後で宣言したグローバル変数が関数からアクセスできない
  it('関数定義より後で代入したグローバル変数を関数から読み書きできる', async () => {
    await cmp(`
●後定義読取とは
  Gを戻す
ここまで
●後定義書込とは
  G=123
ここまで
G=99
R=後定義読取
「読取={R}」を表示
後定義書込
「書込後のG={G}」を表示
`, '読取=99\n書込後のG=123')
  })
  it('関数定義より後で変数宣言したグローバル変数を関数から読み書きできる', async () => {
    await cmp(`
●読むとは
  Aを戻す
ここまで
●書くとは
  A=5
ここまで
Aとは変数
A=1
読むを表示
書く
Aを表示
`, '1\n5')
  })
  it('関数定義より後で定義した辞書を関数から読める', async () => {
    await cmp(`
●取得とは
  D@"x"を戻す
ここまで
D={}
D@"x"=42
取得を表示
`, '42')
  })
  it('後定義のグローバルと同名の明示ローカルが優先される', async () => {
    await cmp(`
●Fとは
  変数 A=50
  A=60
  Aを戻す
ここまで
A=1
Fを表示
Aを表示
`, '60\n1')
  })
  it('関数内だけで暗黙に代入した変数はローカルのまま', async () => {
    await cmp(`
●Fとは
  B=2
ここまで
F
Bを表示
`, 'undefined')
  })
  it('無名関数から後定義グローバルを参照できる', async () => {
    await cmp(`
F=関数
  Gを戻す
ここまで
G=77
Fを実行して表示
`, '77')
  })
  it('後定義グローバルより引数が優先される #2665', async () => {
    await cmp(`
●F(A)とは
  Aを戻す
ここまで
A=999
F(5)を表示
Aを表示
`, '5\n999')
  })
  it('後定義グローバルの配列要素を関数内から増減できる #2665', async () => {
    await cmp(`
●Fとは
  D[1]を1増やす
ここまで
D=[10,20]
F
Dを表示
`, '10,21')
  })
  it('後定義の定数を関数から読める #2665', async () => {
    await cmp(`
●Fとは
  Cを戻す
ここまで
Cとは定数=3
Fを表示
`, '3')
  })
  it('後定義の定数へ関数内から代入するとエラー #2665', async () => {
    const nako = new NakoCompiler()
    assert.throws(
      () => nako.runSync(`
●Fとは
  C=9
ここまで
Cとは定数=3
F
`, 'main.nako3'),
      /定数『C』は既に定義済みなので、値を代入することはできません。/)
  })
  it('名前付き関数をまたいだ無名関数は外側のローカルを捕捉しない #2665', async () => {
    await cmp(`
F=関数
  変数 A=111
  ●内側とは
    G=関数
      Aを戻す
    ここまで
    Gを実行
  ここまで
  内側を戻す
ここまで
A=222
Fを実行して表示
`, '222')
  })
  it('無名関数は外側の関数の明示ローカルを捕捉する #2665', async () => {
    await cmp(`
●外とは
  変数 A=10
  G=関数
    Aを戻す
  ここまで
  Gを実行
ここまで
A=222
外を表示
`, '10')
  })
})
