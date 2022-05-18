/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'

import { NakoCompiler } from '../../src/nako3.mjs'
import { CNako3 } from '../../src/cnako3mod.mjs'
import { NakoSyntaxError } from '../../src/nako_errors.mjs'

// __dirname のために
import url from 'url'
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('side_effects_test', () => {
  it('変数の定義 - 1', () => {
    const nako = new NakoCompiler()
    nako.run('A=10', 'main.nako3')
    assert.strictEqual(nako.run('Aを表示', 'main.nako3').log, 'undefined')
  })
  it('関数の定義 - 変数として参照', () => {
    const nako = new NakoCompiler()
    nako.run('●Aとは\nここまで', 'main.nako3')
    assert.strictEqual(nako.run('Aを表示', 'main.nako3').log, 'undefined')
  })
  it('関数の定義 - 関数として参照', () => {
    const nako = new NakoCompiler()
    nako.run('●Aとは\nここまで', 'main.nako3')
    assert.throws(() => nako.run('A', 'main.nako3'), NakoSyntaxError)
  })
  it('関数の定義 - 関数として定義した場合', () => {
    const nako = new NakoCompiler()
    nako.run('●Aとは\nここまで', 'main.nako3')
    assert.strictEqual(nako.run('●（xの）Aとは\nここまで', 'main.nako3').log, '')
  })
  it('プラグイン変数の上書き', () => {
    const nako = new NakoCompiler()
    nako.addPluginObject('SideEffectTestPlugin', {
      'プラグイン変数': { type: 'var', value: 100 }
    })
    nako.run('プラグイン変数=20', 'main.nako3')
    assert.strictEqual(nako.run('プラグイン変数を表示', 'main.nako3').log, '100')
  })
  it('プラグイン関数の上書き', () => {
    const nako = new NakoCompiler()
    nako.run('●足すとは\nここまで', 'main.nako3')
    assert.strictEqual(nako.run('1と2を足して表示', 'main.nako3').log, '3')
  })
  it('addFuncで設定した関数の上書き', () => {
    const nako = new NakoCompiler()
    nako.addFunc('hoge', [], () => 1, false)
    assert.strictEqual(nako.run('●hogeとは\n2を戻す\nここまで\nhogeを表示', 'main.nako3').log, '2')
    assert.strictEqual(nako.run('hogeを表示', 'main.nako3').log, '1')
  })
  it('プラグインの取り込み', async () => {
    const nako = new CNako3({ nostd: false })
    nako.silent = true

    // 取り込み命令ありで実行
    const code1 = '!「plugin_csv.mjs」を取り込む。\n「1,2」のCSV取得して表示'
    assert.strictEqual((await nako.runAsync(code1, 'main.nako3')).log, '1,2')

    // [TODO] 取り込み命令なしで実行
    // const code2 = '!「1,2」のCSV取得して表示'
    // assert.throws(() => nako.run(code2, 'main.nako3'), NakoSyntaxError)
  })
  it('ファイルの取り込み', async () => {
    const cnako = new CNako3({ nostd: false })
    cnako.silent = true

    // 取り込み命令ありで実行
    const fname = path.join(__dirname, 'requiretest.nako3')
    const code1 = `!「${fname}」を取り込む。\n痕跡を表示。3と5を痕跡演算して、表示。`
    const res = await cnako.runAsync(code1, 'main.nako3')
    assert.strictEqual(res.log, '5\n8')

    // 取り込み命令なしで実行
    /* [TODO] なぜか以下うまくエラーを捕捉できない
        const code2 = '痕跡を表示。3と5を痕跡演算して、表示。'
        assert.throws(
            async () => { await nako.run(code2, 'main.nako3') },
            NakoSyntaxError)
        */
  })
  it('「初期化」と「!クリア」を呼ぶ', () => {
    /** @type {any[]} */
    const log = []
    const nako = new NakoCompiler()

    let count = 0
    nako.addPluginObject('ClearTest', {
      '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: (/** @type {{ x: number; }} */ sys) => {
          sys.x = count++
          log.push(['初期化', sys.x])
        }
      },
      '!クリア': {
        type: 'func',
        josi: [],
        pure: true,
        fn: (/** @type {{ x: any; }} */ sys) => {
          log.push(['!クリア', sys.x])
        }
      }
    })

    const process1 = nako.run('a=1', '')
    const process2 = nako.run('a=1', '')

    process1.destroy()
    process2.destroy()

    assert.deepStrictEqual(log, [['初期化', 0], ['初期化', 1], ['!クリア', 0], ['!クリア', 1]])
  })
})
