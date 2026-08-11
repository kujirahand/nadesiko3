/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'

import { NakoCompiler, newCompilerOptions } from '../src/nako3.mjs'
import { newCompilerOptions as newCompilerOptionsFromRunner } from '../src/nako_runner.mjs'

/**
 * 実行部を NakoCompiler から分離したモジュールのテスト (#2360)
 */
describe('nako_runner_test', () => {
  it('newCompilerOptionsは既定値を埋める', () => {
    const opt = newCompilerOptions()
    assert.strictEqual(opt.testOnly, false)
    assert.strictEqual(opt.resetEnv, false)
    assert.strictEqual(opt.resetAll, false)
    assert.strictEqual(opt.preCode, '')
    assert.strictEqual(opt.nakoGlobal, null)
  })

  it('newCompilerOptionsは指定した値を残す', () => {
    const opt = newCompilerOptions({ testOnly: true, preCode: 'A=1;' })
    assert.strictEqual(opt.testOnly, true)
    assert.strictEqual(opt.preCode, 'A=1;')
    assert.strictEqual(opt.resetEnv, false)
  })

  it('nako3.mjsとnako_runner.mjsのnewCompilerOptionsは同じ関数', () => {
    assert.strictEqual(newCompilerOptions, newCompilerOptionsFromRunner)
  })

  it('runAsyncが実行環境を返し__globalObjに記録される', async () => {
    const nako = new NakoCompiler()
    const g = await nako.runAsync('「テスト」を表示', 'main.nako3')
    assert.strictEqual(g.log, 'テスト')
    assert.strictEqual(nako.__globalObj, g, '現在の実行環境が記録されること')
    assert.strictEqual(nako.__globals.length, 1)
    assert.strictEqual(nako.__globals[0], g)
  })

  it('__globalObjは代入もできる(後方互換)', () => {
    const nako = new NakoCompiler()
    assert.strictEqual(nako.__globalObj, null)
    const dummy = { dummy: true }
    nako.__globalObj = dummy
    assert.strictEqual(nako.__globalObj, dummy)
  })

  it('__globalsは代入もできる(後方互換)', () => {
    const nako = new NakoCompiler()
    nako.__globals = []
    assert.deepStrictEqual(nako.__globals, [])
  })

  it('連続して実行すると同じ実行環境を再利用する', async () => {
    const nako = new NakoCompiler()
    const g1 = await nako.runAsync('A=10', 'main.nako3')
    const g2 = await nako.runAsync('Aを表示', 'main.nako3')
    assert.strictEqual(g1, g2, '実行環境が共有されること')
    assert.strictEqual(g2.log, '10')
    assert.strictEqual(nako.__globals.length, 1)
  })

  it('clearPluginsで実行環境の一覧が空になる', async () => {
    const nako = new NakoCompiler()
    await nako.runAsync('「テスト」を表示', 'main.nako3')
    assert.strictEqual(nako.__globals.length, 1)
    nako.clearPlugins()
    assert.strictEqual(nako.__globals.length, 0)
  })

  it('resetAllを指定すると新しい実行環境が作られる', async () => {
    const nako = new NakoCompiler()
    const g1 = await nako.runAsync('A=10', 'main.nako3')
    const g2 = await nako.runAsync('「テスト」を表示', 'main.nako3', newCompilerOptions({ resetAll: true, resetEnv: true }))
    assert.notStrictEqual(g1, g2, '実行環境が作り直されること')
  })

  it('nakoGlobalを指定すると、その実行環境を使う', async () => {
    const nako = new NakoCompiler()
    const g1 = await nako.runAsync('A=10', 'main.nako3')
    const g2 = await nako.runAsync('Aを表示', 'main.nako3', newCompilerOptions({ nakoGlobal: g1 }))
    assert.strictEqual(g1, g2)
    assert.strictEqual(g2.log, '10')
  })

  it('runSyncも同じように動作する', () => {
    const nako = new NakoCompiler()
    const g = nako.runSync('「同期」を表示', 'main.nako3')
    assert.strictEqual(g.log, '同期')
  })

  it('testメソッドはpreCodeを反映する', () => {
    const nako = new NakoCompiler()
    // preCode は code の先頭に含めて渡す仕様
    const g = nako.test('A=5;Aを表示', 'main.nako3', 'A=5;')
    assert.strictEqual(g.log, '5')
  })

  it('runReset は他の実行インスタンスもリセットする', async () => {
    const nako = new NakoCompiler()
    await nako.runAsync('A=10', 'main.nako3')
    const g = await nako.runReset('「リセット」を表示', 'main.nako3')
    assert.strictEqual(g.log, 'リセット')
    assert.strictEqual(nako.__globals.length, 1, '古い実行環境が破棄されること')
  })

  it('実行時エラーはログに記録された上で例外になる', async () => {
    const nako = new NakoCompiler()
    await assert.rejects(async () => {
      await nako.runAsync('『存在しない関数』のエラー発生', 'main.nako3')
    })
  })

  it('初期化に失敗したプラグインのクリア関数は呼ばれない #2064', async () => {
    // プラグインの初期化は生成されたJavaScriptの中で実行されるため、
    // 実行に失敗すると初期化されないまま実行環境が残ってしまう。
    // その状態で次の実行を行うと「!クリア」でエラーが出ていた。
    let failInit = true
    let clearCount = 0
    const plugin = {
      meta: { type: 'const', value: { pluginName: 'plugin_dummy2064', nakoVersion: '3.6.0' } },
      初期化: {
        type: 'func',
        josi: [],
        pure: true,
        fn: (sys) => {
          if (failInit) { throw new Error('初期化に失敗') }
          sys.__dummyClear2064 = () => { clearCount++ }
        }
      },
      '!クリア': {
        type: 'func',
        josi: [],
        pure: true,
        // 初期化されていなければ、ここで TypeError になる
        fn: (sys) => { sys.__dummyClear2064() }
      }
    }
    const errors = []
    const nako = new NakoCompiler()
    nako.getLogger().addListener('error', (data) => { errors.push(data.noColor) })
    nako.addPluginObject('plugin_dummy2064', plugin)

    // 1回目 … 初期化に失敗して実行環境だけが残る
    await assert.rejects(async () => { await nako.runReset('「NG」を表示', 'main.nako3') })

    // 2回目 … 初期化されていないのでクリア関数は呼ばれない
    failInit = false
    const g2 = await nako.runReset('「OK」を表示', 'main.nako3')
    assert.strictEqual(g2.log, 'OK')
    assert.strictEqual(clearCount, 0, 'クリア関数が呼ばれないこと')
    assert.strictEqual(
      errors.filter((e) => e.includes('クリア関数でエラーが発生しました')).length, 0,
      'クリア関数のエラーが出ないこと')

    // 3回目 … 2回目で初期化が成功しているのでクリア関数が呼ばれる
    const g3 = await nako.runReset('「OK2」を表示', 'main.nako3')
    assert.strictEqual(g3.log, 'OK2')
    assert.strictEqual(clearCount, 1, '初期化済みならクリア関数が呼ばれること')
  })
})
