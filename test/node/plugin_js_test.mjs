import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginSystem from '../../core/src/plugin_system.mjs'
import PluginJS from '../../src/plugin_js.mjs'
import { CNako3 } from '../../src/cnako3mod.mjs'
import { WebNakoCompiler } from '../../src/wnako3mod.mjs'

const movedNames = ['JS実行', 'JSオブジェクト取得', 'JS関数実行', 'JSメソッド実行', 'AWAIT実行']

describe('JavaScript連携プラグインの分離 (#2577)', () => {
  it('共通コアにはJS連携命令と評価用ヘルパーを登録しない', async () => {
    const nako = new NakoCompiler()
    for (const name of movedNames) {
      assert.equal(PluginSystem[name], undefined, name)
      assert.equal(nako.__varslist[0].has(name), false, name)
    }
    const g = await nako.runAsync('「表示」をハテナ関数設定; ?? 3+4', 'main.nako3')
    assert.equal(g.log, '7')
    assert.equal(g.__evalJS, undefined)
    assert.equal(g.__evalSafe, undefined)
  })

  it('コア単体ではJSプラグインを明示登録して使える', async () => {
    const nako = new NakoCompiler()
    nako.addPlugin(PluginJS)
    assert.equal((await nako.runAsync('「3*7」をJS実行して表示', 'main.nako3')).log, '21')
  })

  it('コア単体のハテナ関数設定ではJS:指定に必要なプラグインを案内する', async () => {
    const nako = new NakoCompiler()
    await assert.rejects(
      nako.runAsync('[「表示」,「JS:(s)=>s*2」]をハテナ関数設定', 'main.nako3'),
      /『ハテナ関数設定』のJS:指定にはplugin_jsの登録が必要です/
    )
    assert.equal((await nako.runAsync('[「表示」]をハテナ関数設定; ?? 7', 'main.nako3')).log, '7')
  })

  it('cnakoのnostdではJSプラグインも登録しない', () => {
    const nako = new CNako3({ nostd: true })
    for (const name of movedNames) { assert.equal(nako.__varslist[0].has(name), false, name) }
  })

  it('WebWorker版でもJS連携命令が標準登録される', () => {
    // WorkerGlobalScopeを別プロセスに用意して、実際の登録入口を通す。
    const workerModule = new URL('../../src/wnako3webworker.mjs', import.meta.url).href
    const code = `
      import assert from 'node:assert/strict'
      globalThis.WorkerGlobalScope = class {}
      globalThis.self = new WorkerGlobalScope()
      const messages = []
      globalThis.postMessage = self.postMessage = (message) => messages.push(message)
      Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true })
      await import(${JSON.stringify(workerModule)})
      await navigator.nako3.runAsync('「3*7」をJS実行して表示', 'main.nako3')
      assert.deepEqual(messages, [{ type: 'output', data: 21 }])
    `
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stdout + result.stderr)
  })

  for (const [runtime, Compiler] of [['cnako', CNako3], ['wnako', WebNakoCompiler]]) {
    it(`${runtime}では取り込みなしで従来のJS連携命令を使える`, async () => {
      const samples = [
        ['「3*7」をJS実行して表示', '21'],
        ['「return sys.__getSysVar("ナデシコ種類")」をJS実行して表示', `${runtime}3`],
        ['A=5;「A」のJSオブジェクト取得して表示', '5'],
        ['「Math.max」を[3,9,5]でJS関数実行して表示', '9'],
        ['「[1,2,3]」の「join」を[「-」]でJSメソッド実行して表示', '1-2-3'],
        ['F=「async a=>a*2」をJS実行;Fを21でAWAIT実行して表示', '42'],
        ['[「JS:(s,sys)=>sys.__exec(\'表示\',[s*2,sys])」]をハテナ関数設定; ?? 3', '6']
      ]
      for (const [code, expected] of samples) {
        const nako = new Compiler()
        assert.equal((await nako.runAsync(code, 'main.nako3')).log, expected, code)
      }
    })
  }

  it('cnakoで出力した単独実行ファイルでもJS連携命令を使える', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nako3-js-'))
    try {
      const nako = new CNako3()
      const output = path.join(tmp, 'main.mjs')
      await nako.nakoCompile({ output }, '「Math.max」を[3,9,5]でJS関数実行して表示', false)
      assert.ok(fs.existsSync(path.join(tmp, 'nako3runtime/plugin_js.mjs')))
      const result = spawnSync(process.execPath, [output], { encoding: 'utf8' })
      assert.equal(result.status, 0, result.stderr)
      assert.equal(result.stdout.trim(), '9')
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
})
