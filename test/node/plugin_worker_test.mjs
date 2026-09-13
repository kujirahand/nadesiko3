/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginWorker from '../../src/plugin_worker.mjs'

describe('plugin_worker_test', () => {
  it('NAKOワーカーデータ受信時は非関数に解決されるコールバック名を登録時にエラーにする #2500', async () => {
    // falsy なローカルがコールバック名を遮蔽した場合、イベント発火時の TypeError ではなく
    // 登録時にエラーになることを実プラグインで確認する。
    // Node には self が無いため、プラグイン初期化用に空オブジェクトを一時的に設定する。
    const prevSelf = globalThis.self
    globalThis.self = {}
    try {
      const nako = new NakoCompiler()
      nako.addPlugin(PluginWorker)
      await assert.rejects(
        nako.runAsync(
          '●テストとは\n' +
          '　F=0\n' +
          '　「F」でNAKOワーカーデータ受信時。\n' +
          'ここまで\n' +
          'テスト()。', 'main.nako3'),
        /『NAKOワーカーデータ受信時』に実行できない関数が指定されました/)
    } finally {
      if (prevSelf === undefined) { delete globalThis.self } else { globalThis.self = prevSelf }
    }
  })
  it('NAKOワーカーデータ受信時に文字列で関数名を指定できる #2500', async () => {
    // 関数名の文字列指定は __findFunc で解決され登録される
    const prevSelf = globalThis.self
    globalThis.self = {}
    try {
      const nako = new NakoCompiler()
      nako.addPlugin(PluginWorker)
      const g = await nako.runAsync(
        '●受信処理とは\n「ok」を戻す\nここまで\n' +
        '「受信処理」でNAKOワーカーデータ受信時。', 'main.nako3')
      assert.strictEqual(typeof g.__getSysVar('PluginWorker:ondata'), 'function')
    } finally {
      if (prevSelf === undefined) { delete globalThis.self } else { globalThis.self = prevSelf }
    }
  })
})
