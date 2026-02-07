/* eslint-disable no-undef */
import assert from 'assert'

import { NakoCompiler } from '../src/nako3.mjs'
// import plugin_node from '../../src/plugin_node.mts'
// import { NakoSyntaxError } from '../src/nako_errors.mjs'

describe('side_effects_test', async () => {
  it('変数の定義 - 1', async () => {
    const nako = new NakoCompiler()
    await nako.runAsync('A=10', 'main.nako3')
    assert.strictEqual((await nako.runAsync('Aを表示')).log, '10')
  })
  it('関数の定義 - 変数として参照', async () => {
    const nako = new NakoCompiler()
    await nako.runAsync('●Aとは;3を戻す;ここまで', 'main.nako3')
    const g = await nako.runAsync('Aを表示')
    assert.strictEqual(g.log, '3')
  })
  it('関数の定義 - 関数として参照', async () => {
    const nako = new NakoCompiler()
    try {
      await nako.runAsync('●Aとは\nここまで', 'main.nako3')
      nako.reset()
      await nako.runAsync('A', 'main.nako3')
    } catch (err) {
      assert.strictEqual(err.type, 'NakoSyntaxError')
    }
  })
  it('関数の定義 - 関数として定義した場合', async () => {
    const nako = new NakoCompiler()
    await nako.runAsync('●Aとは\nここまで', 'main.nako3')
    assert.strictEqual((await nako.runAsync('●（xの）Aとは\nここまで', 'main.nako3')).log, '')
  })
  it('プラグイン変数の上書き', async () => {
    const nako = new NakoCompiler()
    nako.addPlugin({
      'meta': { type: 'const', value: { pluginName: 'SideEffectTestPlugin', nakoVersion: '3.6.3' } },
      'プラグイン変数': { type: 'var', value: 100 }
    }, true)
    await nako.runAsync('プラグイン変数=20', 'main.nako3') // プラグイン変数 = 20
    nako.reset() // ここで変数がリセットされるので、上記のプラグイン変数が有効になる
    assert.strictEqual((await nako.runAsync('プラグイン変数を表示', 'main.nako3')).log, '100')
  })
  it('プラグイン関数の上書き', async () => {
    const nako = new NakoCompiler()
    await nako.runAsync('●(AとBを)足すとは;999を戻す;ここまで', 'main.nako3')
    assert.strictEqual((await nako.runAsync('1と2を足して表示', 'main.nako3')).log, '999')
  })
  it('プラグイン関数の上書き後にリセット', async () => {
    const nako = new NakoCompiler()
    await nako.runAsync('●(AとBを)足すとは;999を戻す;ここまで', 'main.nako3')
    nako.reset()
    assert.strictEqual((await nako.runAsync('1と2を足して表示', 'main.nako3')).log, '3')
  })
  it('addFuncで設定した関数の上書き', async () => {
    const nako = new NakoCompiler()
    nako.addFunc('hoge', [], () => 1, false)
    assert.strictEqual((await nako.runAsync('●hogeとは\n2を戻す\nここまで\nhogeを表示', 'main.nako3')).log, '2')
    nako.reset()
    assert.strictEqual((await nako.runAsync('hogeを表示', 'main.nako3')).log, '1')
  })
  it('「初期化」と「!クリア」を呼ぶ', async () => {
    const log = []
    const nako = new NakoCompiler()

    let count = 0
    nako.addPlugin({
      'meta': {
        type: 'const',
        value: { pluginName: 'init_clear_plugin', nakoVersion: '3.6.3' }
      },
      '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: (sys) => {
          sys.x = count++
          log.push('初期化' + sys.x)
        }
      },
      '!クリア': {
        type: 'func',
        josi: [],
        pure: true,
        fn: (sys) => {
          log.push('!クリア' + sys.x)
        }
      }
    }, true)
    // NakoGlobalのテスト
    const process1 = await nako.runAsync('a=1')
    const process2 = await nako.runAsync('a=1')
    assert.strictEqual(process1, process2) // 同じものを返すこと
    process1.destroy()
    assert.deepStrictEqual(log, ['初期化0', '!クリア0'])
  })
  it('余分なNakoGlobalが生成されないこと #1246', async () => {
    const nako3 = new NakoCompiler()
    const g1 = await nako3.runAsync('A=10')
    const g2 = await nako3.runAsync('B=10')
    assert.strictEqual(g1.guid, g2.guid)
  })
})
