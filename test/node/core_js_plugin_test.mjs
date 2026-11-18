/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * JS連携命令(plugin_js)を使うコアのテスト
 *
 * plugin_js は core/ の外(src/)にあるため、core/test ではなく
 * ここ(test/node)で検証する。nadesiko3core 単体のテストは
 * plugin_js に依存しない。
 */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginJS from '../../src/plugin_js.mjs'

describe('core_js_plugin_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    nako.getLogger().debug('code=' + code)
    const g = await nako.runAsync(code, 'main.nako3')
    assert.strictEqual(g.log, res)
  }
  const cmpex = async (/** @type {string} */ code, /** @type {{name: string, message: string}} */ exinfo) => {
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    try {
      await nako.runAsync(code, 'main.nako3')
    } catch (err) {
      assert.strictEqual(err.name, exinfo.name)
      assert.notStrictEqual(err.message.indexOf(exinfo.message), -1)
      return
    }
    assert.fail(`${exinfo.name} が発生しませんでした`)
  }
  it('配列＋オブジェクトプロパティで__getProp/__setPropを特別扱いしない #2194', async () => {
    // __getProp/__setPropがあっても「犬」は「dog」に変換されない
    await cmp(`
      FN_GET=JS実行(『(function(p){ p = (p == '犬') ? 'dog' : p; return this[p]; })』);
      FN_SET=JS実行(『(function(p, v){ p = (p == '犬') ? 'dog' : p; this[p]=v; })』);
      A={"dog": 30,"__setProp": FN_SET,"__getProp": FN_GET};
      A$犬=200; A$dogを表示;
    `, '30')
    // 1次元配列＋オブジェクトプロパティ
    await cmp(`
      FN_GET=JS実行(『(function(p){ p = (p == '犬') ? 'dog' : p; return this[p]; })』);
      FN_SET=JS実行(『(function(p, v){ p = (p == '犬') ? 'dog' : p; this[p]=v; })』);
      A=[{"dog": 30,"__setProp": FN_SET,"__getProp": FN_GET}];
      A[0]$犬=200; A[0]$dogを表示;
    `, '30')
    // 2次元配列＋オブジェクトプロパティ
    await cmp(`
      FN_GET=JS実行(『(function(p){ p = (p == '犬') ? 'dog' : p; return this[p]; })』);
      FN_SET=JS実行(『(function(p, v){ p = (p == '犬') ? 'dog' : p; this[p]=v; })』);
      A=[[{"dog": 30,"__setProp": FN_SET,"__getProp": FN_GET}]];
      A[0][0]$犬=200; A[0][0]$dogを表示;
    `, '30')
  })
  it('オブジェクトプロパティ構文に増減文を使う', async () => {
    // $記法で増やす
    await cmp('A＝{"a":0};A$aを1増やす。A$aを表示。', '1')
    await cmp('A＝{"a":5};A$aを3だけ増やす。A$aを表示。', '8')
    // $記法で減らす
    await cmp('A＝{"a":10};A$aを1減らす。A$aを表示。', '9')
    await cmp('A＝{"a":10};A$aを5だけ減らす。A$aを表示。', '5')
    // ネスト$記法で増やす・減らす
    await cmp('A={"猫":{"日本猫":10}};A$猫$日本猫を5増やす。A$猫$日本猫を表示。', '15')
    await cmp('A={"猫":{"日本猫":10}};A$猫$日本猫を3減らす。A$猫$日本猫を表示。', '7')
    // __getProp/__setPropは特別扱いせず、通常のプロパティを増減する (#2194)
    await cmp(
      '『 (function(prop, sys){ return this[prop] * 10 })』をJS実行してF_GETに代入。\n' +
      '『 (function(prop, val, sys){ this[prop] = val * 10 })』をJS実行してF_SETに代入。\n' +
      'A={"幅": 3, "__setProp": F_SET, "__getProp": F_GET};\n' +
      'A$幅を2増やす。A$幅を表示。', '5')
    await cmp(
      '『 (function(prop, sys){ return this[prop] * 10 })』をJS実行してF_GETに代入。\n' +
      '『 (function(prop, val, sys){ this[prop] = val * 10 })』をJS実行してF_SETに代入。\n' +
      'A={"幅": 10, "__setProp": F_SET, "__getProp": F_GET};\n' +
      'A$幅を3減らす。A$幅を表示。', '7')
  })
  it('__getProp/__setPropを通常のプロパティとして扱う(#2194)', async () => {
    // __getPropを呼び出さず、通常のプロパティ値を取得する
    await cmp(
      '『 (function(prop, sys){ return this[prop] * 10 })』をJS実行してF_GETに代入。\n' +
      '『 (function(prop, val, sys){ this[prop] = val })』をJS実行してF_SETに代入。\n' +
      'A={"幅": 3, "__setProp": F_SET, "__getProp": F_GET};\n' +
      'A$幅=5; A$幅を表示', '5')
    // __setPropを呼び出さず、通常のプロパティへ値を格納する
    await cmp(
      '『 (function(prop, sys){ return this[prop] })』をJS実行してF_GETに代入。\n' +
      '『 (function(prop, val, sys){ this[prop] = val*10 })』をJS実行してF_SETに代入。\n' +
      'A={"幅": 3, "__setProp": F_SET, "__getProp": F_GET};\n' +
      'A$幅=5; A$幅を表示', '5')
  })
  it('反復 - prototypeを無視', async () => {
    await cmp('f=『function F(){}; F.prototype.foo = 20; const f = new F(); f.p1 = 10; f』をJS実行。fを反復して表示', '10')
  })
  it('特殊命令 - JS実行', async () => {
    await cmp('「3*7」をJS実行して表示', '21')
  })
  it('特殊命令 - JS関数実行', async () => {
    await cmp('「Math.max」を[3,9,5]でJS関数実行して表示', '9')
  })
  it('特殊命令 - JSメソッド実行', async () => {
    await cmp('「[1,2,3]」の「join」を[「-」]でJSメソッド実行して表示', '1-2-3')
  })
  it('特殊命令 - JSオブジェクト取得', async () => {
    await cmp('A=5;「A」のJSオブジェクト取得して表示', '5')
  })
  it('特殊命令 - AWAIT実行', async () => {
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    const code = 'F=「a=>a*2」をJS実行\nFを[21]でAWAIT実行して表示'
    const g = await nako.runAsync(code, 'main.nako3')
    assert.strictEqual(g.log, '42')
  })
  it('特殊命令 - AWAIT実行（配列以外の引数）', async () => {
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    const code = 'F=「a=>a*2」をJS実行\nFを21でAWAIT実行して表示'
    const g = await nako.runAsync(code, 'main.nako3')
    assert.strictEqual(g.log, '42')
  })
  it('JS実行', async () => {
    await cmp('「3+6」をJS実行して表示', '9')
    await cmp('「Math.floor(3.5)」をJS実行して表示', '3')
  })
  it('JS関数実行', async () => {
    await cmp('"Math.floor"を[3.14]でJS関数実行して表示', '3')
    await cmp('"Math.floor"を3.14でJS関数実行して表示', '3')
    await cmp('F="Math.floor"でJS実行;Fを[3.14]でJS関数実行して表示', '3')
  })
  it('JSメソッド実行 #854', async () => {
    let globalScope
    let globalName
    if (typeof window === 'object' && typeof window.navigator === 'object') {
      globalScope = window
      globalName = 'window'
    } else {
      globalScope = global
      globalName = 'global'
    }
    globalScope.jstest = () => { return 777 }
    await cmp('「' + globalName + '」の「jstest」を[]でJSメソッド実行して表示。', '777')
    globalScope.jstest_x2 = (/** @type {number} */ a) => { return a * 2 }
    await cmp('「' + globalName + '」の「jstest_x2」を30でJSメソッド実行して表示。', '60')
    globalScope.jstest_mul = (/** @type {number} */ a, /** @type {number} */ b) => { return a * b }
    await cmp('「' + globalName + '」の「jstest_mul」を[30,30]でJSメソッド実行して表示。', '900')
  })
  it('「??」のカスタマイズ機能を追加 #1852', async () => {
    await cmp('["JSONエンコード","表示"]をハテナ関数設定; ?? [1,2,3]', '[1,2,3]')
    await cmp('["文字列分解", "ASC", "JSONエンコード","表示"]をハテナ関数設定; ?? "abc"', '[97,98,99]')
    await cmp('["JS:Math.ceil","表示"]をハテナ関数設定; ?? 3.2', '4')
    await cmp('[『JS:(function(v,sys){return Math.ceil(v);})』,"表示"]をハテナ関数設定; ?? 3.2', '4')
  })
  it('JSオブジェクト取得がfalsyなローカル変数を見失わない #2500', async () => {
    // ローカル変数が falsy でもグローバル変数へフォールバックせずローカルの値を返す
    await cmp('●テスト\n　変数 A=0\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテスト()を表示', '0')
    await cmp('●テスト\n　変数 A=偽\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテスト()を表示', 'false')
    await cmp('●テスト\n　変数 A=「」\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテスト()を表示', '')
    await cmp('●テスト\n　変数 A=NULL\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテスト()を表示', 'null')
    await cmp('●テスト\n　変数 A=非数\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテスト()を表示', 'NaN')
    // truthyなローカル変数は従来どおり返す
    await cmp('●テスト\n　変数 A=5\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテスト()を表示', '5')
    // ローカル変数が無ければ従来どおりグローバル変数へフォールバックする
    await cmp('●テスト\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=7\nテスト()を表示', '7')
    // ローカル変数が undefined(未定義) の場合は「未設定」とみなしグローバル変数へフォールバックする
    await cmp('●テスト\n　変数 A=未定義\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテスト()を表示', '99')
    // どこにも存在しなければ null (JSオブジェクト取得のデフォルト値) を返す
    await cmp('●テスト\n　「A」のJSオブジェクト取得を戻す\nここまで\nテスト()を表示', 'null')
  })
  it('JSオブジェクト取得がfalsyな名前空間変数を見失わない #2500', async () => {
    // 名前空間付き変数が falsy でもその値を返す
    await cmp('A=0\n「main__A」のJSオブジェクト取得を表示', '0')
    await cmp('A=偽\n「main__A」のJSオブジェクト取得を表示', 'false')
    await cmp('A=「」\n「main__A」のJSオブジェクト取得を表示', '')
    await cmp('A=NULL\n「main__A」のJSオブジェクト取得を表示', 'null')
    // 存在しない名前空間変数は従来どおり null を返す
    await cmp('「nosuchmod__A」のJSオブジェクト取得を表示', 'null')
  })
  it('関数内のローカル変数が他の関数やトップレベルに漏洩しない #2534', async () => {
    // pureでない命令(ここではJSオブジェクト取得)を呼んだ関数のローカル変数が
    // __varslist[2] / __self.__locals に残留せず、後続の関数の参照を遮蔽しない
    // 先の関数が設定した falsy な値でも遮蔽しない
    await cmp('●テストA\n　変数 A=0\n　「A」のJSオブジェクト取得を戻す\nここまで\n●テストB\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテストA()。\nテストB()を表示', '99')
    await cmp('●テストA\n　変数 A=偽\n　「A」のJSオブジェクト取得を戻す\nここまで\n●テストB\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテストA()。\nテストB()を表示', '99')
    await cmp('●テストA\n　変数 A=「」\n　「A」のJSオブジェクト取得を戻す\nここまで\n●テストB\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテストA()。\nテストB()を表示', '99')
    await cmp('●テストA\n　変数 A=NULL\n　「A」のJSオブジェクト取得を戻す\nここまで\n●テストB\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテストA()。\nテストB()を表示', '99')
    // トップレベルからも残留したローカル変数は見えない
    await cmp('●テストA\n　変数 A=0\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテストA()。\n「A」のJSオブジェクト取得を表示', '99')
    // グローバル変数も無ければ null (JSオブジェクト取得のデフォルト値) を返す
    await cmp('●テストA\n　A=0\n　「A」のJSオブジェクト取得を戻す\nここまで\nテストA()。\n「A」のJSオブジェクト取得を表示', 'null')
    // 関数内では従来どおり自身のローカル変数が見える(回帰確認)
    await cmp('●テストA\n　変数 A=0\n　「A」のJSオブジェクト取得を戻す\nここまで\nA=99\nテストA()を表示', '0')
  })
  it('入れ子の関数呼び出しで内側のローカル変数が外側に漏洩しない #2534', async () => {
    // 内側の関数でpureでない命令を呼んでも、外側の関数のその後の探索に内側のローカル変数は見えない
    await cmp('●内側\n　変数 B=0\n　「B」のJSオブジェクト取得を戻す\nここまで\n●外側\n　内側()。\n　「B」のJSオブジェクト取得を戻す\nここまで\nB=99\n外側()を表示', '99')
  })
  it('ローカル変数の同期後に__varslist[2]と__localsへ残留しない #2534', async () => {
    // falsyな値でもプレフィックス無しキーが __varslist[2] へ書き込まれないことを
    // Map.has で構造的に検証する (falsy値の__findVar経由の遮蔽確認は #2500 の修正後に実効性を持つ)
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    const g = await nako.runAsync('●テストA\n　A=0\n　「A」のJSオブジェクト取得を戻す\nここまで\nテストA()。', 'main.nako3')
    // 関数のローカル変数がトップレベルのスコープ __varslist[2] に書き込まれない
    assert.strictEqual(g.__varslist[2].has('A'), false)
    // __self.__locals も呼び出し前の値に復元され、関数のスコープを指したまま残らない
    assert.strictEqual(g.__locals.has('A'), false)
    assert.strictEqual(g.__findVar('A', 'def'), 'def')
  })
  it('VOID型(return_none)のpureでない命令でもローカル変数が漏洩しない #2534', async () => {
    // 値を返さない命令は genVoidCallCode(文レベルのtry/finally)を通るため、そちらの経路も固定する
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    nako.addPlugin({
      meta: { type: 'const', value: { pluginName: 'TestPlugin2534', nakoVersion: '3.6.0' } },
      ローカル書込: {
        type: 'func', josi: [['を']], pure: false, return_none: true,
        fn: (v, sys) => { sys.__locals.set('W', v) }
      }
    })
    const g = await nako.runAsync('●テストA\n　A=0\n　42をローカル書込。\nここまで\n●テストB\n　「W」のJSオブジェクト取得を戻す\nここまで\nテストA()。\nテストB()を表示。', 'main.nako3')
    // テストBからはテストAのローカル変数もプラグインが書き込んだ値も見えない
    assert.strictEqual(g.log, 'null')
    assert.strictEqual(g.__varslist[2].has('A'), false)
    assert.strictEqual(g.__varslist[2].has('W'), false)
    assert.strictEqual(g.__locals.has('A'), false)
    assert.strictEqual(g.__locals.has('W'), false)
  })
  it('pureでない命令による__localsへのdeleteが呼出元のローカル変数に直接作用する #2534', async () => {
    // エイリアス経路では sys.__locals の破壊的操作が呼出元スコープへ直接作用する(仕様)
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    nako.addPlugin({
      meta: { type: 'const', value: { pluginName: 'TestPlugin2534', nakoVersion: '3.6.0' } },
      ローカル削除: {
        type: 'func', josi: [['の']], pure: false, return_none: true,
        fn: (v, sys) => { sys.__locals.delete(v) }
      }
    })
    const g = await nako.runAsync('●テストA\n　A=5\n　「A」のローカル削除。\n　「A」のJSオブジェクト取得を戻す\nここまで\nテストA()を表示。', 'main.nako3')
    // delete後はローカル変数Aが消える(JSオブジェクト取得はデフォルト値nullを返す)
    assert.strictEqual(g.log, 'null')
    assert.strictEqual(g.__varslist[2].has('A'), false)
    assert.strictEqual(g.__locals.has('A'), false)
  })
  it('pureでない命令が例外を投げても__localsが復元され変数が残留しない #2534', async () => {
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    try {
      await nako.runAsync('●テストA\n　A=0\n　「XXX」を[]でJS関数実行\nここまで\nテストA()。', 'main.nako3')
      assert.fail('実行時エラーになるはずです')
    } catch (err) {
      // JS関数実行が投げる実行時エラー(想定内のエラーであることを固定)
      assert.ok(err instanceof Error)
    }
    const g = nako.__globalObj
    assert.strictEqual(g.__varslist[2].has('A'), false)
    assert.strictEqual(g.__locals.has('A'), false)
    assert.strictEqual(g.__findVar('A', 'def'), 'def')
  })
  it('pureでない命令を同一関数内で複数回呼んでも各呼出のローカル同期が独立して機能する #2534', async () => {
    // loopId による一意採番で const の重複宣言(SyntaxError)が起きないことの回帰保護
    // VOID型と値返し型の呼出を混在させる
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    nako.addPlugin({
      meta: { type: 'const', value: { pluginName: 'TestPlugin2534', nakoVersion: '3.6.0' } },
      ローカル書込: {
        type: 'func', josi: [['を']], pure: false, return_none: true,
        fn: (v, sys) => { sys.__locals.set('W', v) }
      }
    })
    const g = await nako.runAsync('●テストA\n　A=0\n　42をローカル書込。\n　B=「A」のJSオブジェクト取得\n　1をローカル書込。\n　Wを戻す\nここまで\nテストA()を表示。', 'main.nako3')
    // 3箇所の呼出それぞれで同期が機能し、W=1・B=0 が正しく読める
    assert.strictEqual(g.log, '1')
    assert.strictEqual(g.__varslist[2].has('A'), false)
    assert.strictEqual(g.__varslist[2].has('B'), false)
    assert.strictEqual(g.__varslist[2].has('W'), false)
    assert.strictEqual(g.__locals.has('W'), false)
  })
  it('pureでない命令の実行中に呼ばれた関数内でもローカル変数の同期が独立して機能する #2534', async () => {
    // 「実行」(pure:false)の呼出ウィンドウ内で呼ばれる関数の中で、
    // さらにpureでない命令を呼ぶ入れ子ケース。内側の同期が外側の __locals を
    // 正しく保存・復元し、どちらのローカル変数も漏洩しないことを確認する。
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    const g = await nako.runAsync(
      '●内側\n' +
      '　B=0\n' +
      '　「B」のJSオブジェクト取得を戻す\n' +
      'ここまで\n' +
      '●外側\n' +
      '　A=1\n' +
      '　R=「内側」を実行。\n' +
      '　「{R}/{A}」を戻す\n' +
      'ここまで\n' +
      '外側()を表示。', 'main.nako3')
    // 内側は自身の B=0 を返し、外側は自身の A=1 と R=0 を返す
    assert.strictEqual(g.log, '0/1')
    // 外側・内側どちらのローカル変数もトップレベル・__locals に残留しない
    assert.strictEqual(g.__varslist[2].has('A'), false)
    assert.strictEqual(g.__varslist[2].has('B'), false)
    assert.strictEqual(g.__locals.has('A'), false)
    assert.strictEqual(g.__locals.has('B'), false)
  })
  it('クロージャを持つ無名関数内からpureでない命令を呼んでもローカル変数が漏洩しない #2534', async () => {
    // 外側のローカル変数を参照する無名関数(varslistSet.length > 4 でusesClosure)の中で
    // pureでない命令を呼んでも、無名関数のローカル変数は __varslist[2] / __locals に残留しない
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    const g = await nako.runAsync(
      '●外側\n' +
      '　X=1\n' +
      '　inner = 関数()\n' +
      '　　B=5\n' +
      '　　「B」のJSオブジェクト取得 + X を戻す\n' +
      '　ここまで\n' +
      '　innerを戻す\n' +
      'ここまで\n' +
      'F=外側()\n' +
      'F()を表示。', 'main.nako3')
    // inner内のローカル変数B=5が__locals経由で見え、外側のX=1はクロージャ経由で見える
    assert.strictEqual(g.log, '6')
    assert.strictEqual(g.__varslist[2].has('B'), false)
    assert.strictEqual(g.__locals.has('B'), false)
    assert.strictEqual(g.__findVar('B', 'def'), 'def')
  })
  it('文レベルのpureでない命令の引数位置のpureでない命令も正しく同期される #2534', async () => {
    // 引数式内の pure でない命令は自身の同期ウィンドウを持つ。
    // 引数ホイスト後もネストした呼出から見えるスコープが変わらないことを固定する
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    nako.addPlugin({
      meta: { type: 'const', value: { pluginName: 'TestPlugin2534', nakoVersion: '3.6.0' } },
      ローカル書込: {
        type: 'func', josi: [['を']], pure: false, return_none: true,
        fn: (v, sys) => { sys.__locals.set('W', v) }
      }
    })
    const g = await nako.runAsync(
      '●テストA\n' +
      '　A=5\n' +
      '　(「A」のJSオブジェクト取得)をローカル書込。\n' +
      '　Wを戻す\n' +
      'ここまで\n' +
      'テストA()を表示。', 'main.nako3')
    // 引数位置の JSオブジェクト取得 は自身の同期ウィンドウで A=5 を観測する
    assert.strictEqual(g.log, '5')
    assert.strictEqual(g.__varslist[2].has('A'), false)
    assert.strictEqual(g.__varslist[2].has('W'), false)
    assert.strictEqual(g.__locals.has('A'), false)
    assert.strictEqual(g.__locals.has('W'), false)
  })
})
