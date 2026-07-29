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
})
