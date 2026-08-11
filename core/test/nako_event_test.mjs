/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'

import { NakoCompiler } from '../src/nako3.mjs'
import { NakoEventEmitter } from '../src/nako_event.mjs'
import { NakoRunner } from '../src/nako_runner.mjs'

/**
 * イベント機構を NakoCompiler から分離したモジュールのテスト (#2360)
 */
describe('nako_event_test', () => {
  it('onで登録したコールバックがfireで呼ばれる', () => {
    const emitter = new NakoEventEmitter()
    const log = []
    emitter.on('beforeParse', (v) => { log.push(`a:${v}`) })
    emitter.on('beforeParse', (v) => { log.push(`b:${v}`) })
    emitter.fire('beforeParse', 1)
    assert.deepStrictEqual(log, ['a:1', 'b:1'])
  })

  it('登録していないイベントを発火しても何も起きない', () => {
    const emitter = new NakoEventEmitter()
    let called = 0
    emitter.on('beforeParse', () => { called++ })
    emitter.fire('finish', null)
    assert.strictEqual(called, 0)
  })

  it('別のイベント名のコールバックは呼ばれない', () => {
    const emitter = new NakoEventEmitter()
    const log = []
    emitter.on('beforeParse', () => { log.push('parse') })
    emitter.on('finish', () => { log.push('finish') })
    emitter.fire('finish', null)
    assert.deepStrictEqual(log, ['finish'])
  })

  it('getEventListで登録済みのイベントを取得できる', () => {
    const emitter = new NakoEventEmitter()
    emitter.on('beforeRun', () => {})
    assert.strictEqual(emitter.getEventList().length, 1)
    assert.strictEqual(emitter.getEventList()[0].eventName, 'beforeRun')
  })

  it('clearで登録済みのイベントを削除できる', () => {
    const emitter = new NakoEventEmitter()
    let called = 0
    emitter.on('finish', () => { called++ })
    emitter.clear()
    emitter.fire('finish', null)
    assert.strictEqual(called, 0)
    assert.strictEqual(emitter.getEventList().length, 0)
  })

  it('NakoCompilerのaddListenerでイベントが発火する順番', async () => {
    const nako = new NakoCompiler()
    const log = []
    nako.addListener('beforeParse', () => { log.push('beforeParse') })
    nako.addListener('beforeGenerate', () => { log.push('beforeGenerate') })
    nako.addListener('afterGenerate', () => { log.push('afterGenerate') })
    nako.addListener('beforeRun', () => { log.push('beforeRun') })
    nako.addListener('finish', () => { log.push('finish') })
    await nako.runAsync('「テスト」を表示', 'main.nako3')
    assert.deepStrictEqual(log, ['beforeParse', 'beforeGenerate', 'afterGenerate', 'beforeRun', 'finish'])
  })

  it('非同期プログラムの完了後にfinishが発火する (#2384)', async () => {
    const nako = new NakoCompiler()
    let logAtFinish = null
    nako.addListener('finish', (g) => { logAtFinish = g.log })
    const g = await nako.runAsync('0.02秒待つ\n「完了」を表示', 'main.nako3')
    assert.strictEqual(logAtFinish, '完了')
    assert.strictEqual(g.log, '完了')
  })

  it('runSyncでは非同期プログラムでも同期的にfinishが発火する (#2384)', async () => {
    const nako = new NakoCompiler()
    const logsAtFinish = []
    nako.addListener('finish', (g) => { logsAtFinish.push(g.log) })
    const g = nako.runSync('0.02秒待つ\n「完了」を表示', 'main.nako3')
    assert.deepStrictEqual(logsAtFinish, [''])
    assert.strictEqual(g.log, '')
    await new Promise((resolve) => setTimeout(resolve, 40))
    assert.strictEqual(g.log, '完了')
    assert.deepStrictEqual(logsAtFinish, [''])
  })

  it('thenableがrejectした後にもfinishが発火する (#2384)', async () => {
    const events = []
    const runner = new NakoRunner({
      fireEvent: (name, g) => { events.push([name, g.completed]) },
      getLogger: () => ({ error: () => {} })
    })
    const g = { lastJSCode: '', numFailures: 0, completed: false }
    const result = runner.evalJS(`
      return {
        then: (_resolve, reject) => setTimeout(() => {
          this.completed = true
          reject(new Error('非同期失敗'))
        }, 1)
      }
    `, g, true)
    assert.deepStrictEqual(events, [['beforeRun', false]])
    await assert.rejects(Promise.resolve(result), /非同期失敗/)
    assert.deepStrictEqual(events, [['beforeRun', false], ['finish', true]])
  })

  it('beforeParseにはソースコードが渡される', async () => {
    const nako = new NakoCompiler()
    let received = null
    nako.addListener('beforeParse', (code) => { received = code })
    await nako.runAsync('1と2を足して表示', 'main.nako3')
    assert.strictEqual(received, '1と2を足して表示')
  })

  it('beforeRunとfinishには実行環境が渡される', async () => {
    const nako = new NakoCompiler()
    const received = []
    nako.addListener('beforeRun', (g) => { received.push(g) })
    nako.addListener('finish', (g) => { received.push(g) })
    const g = await nako.runAsync('「テスト」を表示', 'main.nako3')
    assert.strictEqual(received.length, 2)
    assert.strictEqual(received[0], g)
    assert.strictEqual(received[1], g)
  })
})
