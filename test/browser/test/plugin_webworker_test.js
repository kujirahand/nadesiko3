import { assert } from 'chai'
import { NakoCompiler } from 'nadesiko3core/src/nako3.mjs'
import PluginBrowser from 'nako3/plugin_browser.mjs'
import { importStatus } from './import_plugin_checker.js'
import PluginWebWorker from 'nako3/plugin_webworker.mjs'
import { retry } from './compare_util'

describe('plugin_webworker_test', () => {
  let nako = null
  afterEach(() => {
    nako = null
  })
  beforeEach(() => {
    nako = new NakoCompiler()
    // const pluginClone = Object.assign({}, PluginWebWorker)
    // nako.addPluginFile('PluginWebWorker', 'plugin_webworker.js', pluginClone)
    nako.addPluginFile('PluginBrowser', 'plugin_browser.js', PluginBrowser)
    nako.addPluginFile('PluginWebWorker', 'plugin_webworker.js', PluginWebWorker)
  })

  // --- test ---
  it('auto import for browser', () => {
    const pluginName = 'PluginWebWorker'
    const imported = importStatus.hasImport(pluginName)
    assert.ok(imported, 'was import')
    const autoImport = importStatus.getAutoImport(pluginName)
    assert.strictEqual(typeof (autoImport.obj), 'object')
  })

  it('web worker basic', async () => {
    const msgs = []
    nako.addFunc('報告', [['を']], (msg) => {
      msgs.push(msg)
    })
    const code = `Wは「/wnako3webworker.js」をワーカー起動
WにNAKOワーカーハンドラ設定
WからNAKOワーカーデータ受信した時には、
　受信データを報告
　Wをワーカー終了
ここまで
WからNAKOワーカー表示した時には、
　受信データを報告
ここまで

Wで「"かかかかか"を表示する;"<>?"をHTML変換して表示する;"おわり"をNAKOワーカーデータ送信」をNAKOワーカープログラム起動
`
    nako.run(code)

    await retry(() => assert.equal(JSON.stringify(msgs), '["かかかかか","&lt;&gt;?","おわり"]'))
  }).timeout(10000)

  it('web worker transport', async () => {
    const msgs = []
    nako.addFunc('報告', [['を']], (msg) => {
      msgs.push(msg)
    })
    const code = `Wは「/wnako3webworker.js」をワーカー起動
WにNAKOワーカーハンドラ設定
WからNAKOワーカーデータ受信した時には、
　受信データを報告
　WをNAKOワーカー終了
ここまで
WからNAKOワーカー表示した時には、
　受信データを報告
ここまで

ワーカー側値は「おわり」
●ワーカ内処理とは
　NAKOワーカーデータ受信した時には、
　　受信データを表示
　　「<>?」をHTML変換して表示する
　　ワーカー側値をNAKOワーカーデータ送信
　ここまで
ここまで

Wに["ワーカ内処理","ワーカー側値"]をNAKOワーカー転送
ワーカー側値は「始まり」

Wで「ワーカ内処理する」をNAKOワーカープログラム起動
Wに「あいうえお」をNAKOワーカーデータ送信
`
    nako.run(code)

    await retry(() => assert.equal(JSON.stringify(msgs), '["あいうえお","&lt;&gt;?","おわり"]'))
  }).timeout(10000)
})
