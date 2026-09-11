/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'

import { NakoCompiler } from '../src/nako3.mjs'
import { basicPlugins, registerBasicPlugins } from '../src/nako_basic_plugins.mjs'

/**
 * 基本プラグインの一覧を NakoCompiler から分離したモジュールのテスト (#2360)
 */
describe('nako_basic_plugins_test', () => {
  it('基本プラグインの一覧を取得できる', () => {
    assert.strictEqual(basicPlugins.length, 6)
    const names = basicPlugins.map((po) => po.meta.value.pluginName)
    assert.deepStrictEqual(names, [
      'plugin_system', 'plugin_math', 'plugin_promise', 'plugin_test', 'plugin_csv', 'plugin_toml'
    ])
  })

  it('registerBasicPluginsは一覧の順にaddPluginを呼ぶ', () => {
    const called = []
    registerBasicPlugins({ addPlugin: (po) => { called.push(po) } })
    assert.deepStrictEqual(called, basicPlugins)
  })

  it('useBasicPluginがtrueなら基本プラグインの命令を使える', () => {
    const nako = new NakoCompiler({ useBasicPlugin: true })
    assert.ok(nako.getFunc('表示') !== undefined, 'PluginSystemの命令')
    assert.ok(nako.getFunc('SIN') !== undefined, 'PluginMathの命令')
  })

  it('useBasicPluginがfalseなら基本プラグインは登録されない', () => {
    const nako = new NakoCompiler({ useBasicPlugin: false })
    assert.strictEqual(nako.getFunc('表示'), undefined)
    assert.deepStrictEqual(Object.keys(nako.getPluginfiles()), [])
  })

  it('addBasicPluginsを後から呼んでも登録できる', () => {
    const nako = new NakoCompiler({ useBasicPlugin: false })
    nako.addBasicPlugins()
    assert.ok(nako.getFunc('表示') !== undefined)
    assert.strictEqual(Object.keys(nako.getPluginfiles()).length, basicPlugins.length)
  })

  it('useBasicPlugin:falseでも増減文はNumber/BigIntで動作する (#2488)', async () => {
    // 増減文は言語コアの構文なので、基本プラグインなしでも __incValue を利用できる
    const runGetVar = async (/** @type {string} */ code) => {
      const nako = new NakoCompiler({ useBasicPlugin: false })
      const g = await nako.runAsync(code, 'main.nako3')
      return g.__varslist[2].get('main__A')
    }
    // Number は従来どおり
    assert.strictEqual(await runGetVar('A=1;Aを1増やす'), 2)
    assert.strictEqual(await runGetVar('A=5;Aを2だけ減らす'), 3)
    // BigInt は精度を保ったまま
    assert.strictEqual(await runGetVar('A=1n;Aを1だけ増やす'), 2n)
    assert.strictEqual(await runGetVar('A=9007199254740993n;Aを「9007199254740993」だけ減らす'), 0n)
  })

  it('compileStandaloneの生成コードに__incValueが埋め込まれる (#2488)', () => {
    const nako = new NakoCompiler()
    const js = nako.compileStandalone('A=1;Aを1増やす', 'main.nako3')
    assert.ok(js.includes('self.__incValue ='), 'standaloneに __incValue が埋め込まれる')
    assert.ok(!js.includes('__incValueCode__'), 'テンプレート置換漏れがない')
    assert.ok(js.includes('function incValue'), '関数本体が埋め込まれる')
  })
})
