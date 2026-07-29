/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'

import { NakoCompiler } from '../src/nako3.mjs'
import { NakoPluginManager, PLUGIN_MIN_VERSION_INT } from '../src/nako_plugin_manager.mjs'
import { NakoLogger } from '../src/nako_logger.mjs'

/**
 * プラグイン管理を NakoCompiler から分離したモジュールのテスト (#2360)
 */
describe('nako_plugin_manager_test', () => {
  /** テスト用にホストを差し替えた NakoPluginManager を作る */
  const createManager = () => {
    const funclist = new Map()
    const sysVars = new Map()
    const logger = new NakoLogger()
    const manager = new NakoPluginManager({
      getFuncList: () => funclist,
      getSysVars: () => sysVars,
      getLogger: () => logger
    })
    return { manager, funclist, sysVars, logger }
  }

  /** 現在のバージョン要求を満たすメタ情報を作る */
  const newMeta = (pluginName, nakoVersion = '3.6.0') => {
    return { type: 'const', value: { pluginName, nakoVersion } }
  }

  it('プラグイン名が重複した場合は登録されない', () => {
    const nako = new NakoCompiler()
    nako.addPlugin({
      meta: newMeta('DuplicatedPlugin'),
      重複テスト値: { type: 'const', value: 1 }
    })
    nako.addPlugin({
      meta: newMeta('DuplicatedPlugin'),
      重複テスト値: { type: 'const', value: 2 }
    })
    // 2回目の登録は無視されるので、最初に登録した値のままになる
    assert.strictEqual(nako.getFunc('重複テスト値').value, 1)
  })

  it('metaが無い場合はプラグイン名をキー名から自動生成する', () => {
    const { manager, sysVars } = createManager()
    manager.addPlugin({ hoge: { type: 'const', value: 1 } })
    const pluginInfo = sysVars.get('__pluginInfo')
    assert.ok(pluginInfo.hoge !== undefined, 'キー名からプラグイン名が作られること')
    assert.ok(manager.pluginfiles.hoge !== undefined)
  })

  it('古い形式のプラグインは nakoVersionResult が false になる', () => {
    const { manager, sysVars } = createManager()
    // PLUGIN_MIN_VERSION_INT(600) より小さいバージョンを指定する
    manager.addPlugin({
      meta: newMeta('OldPlugin', '3.5.99'),
      古い値: { type: 'const', value: 1 }
    })
    const pluginInfo = sysVars.get('__pluginInfo')
    assert.strictEqual(pluginInfo.OldPlugin.nakoVersionResult, false)
    assert.strictEqual(PLUGIN_MIN_VERSION_INT, 600)
  })

  it('新しい形式のプラグインは nakoVersionResult が true のまま', () => {
    const { manager, sysVars } = createManager()
    manager.addPlugin({
      meta: newMeta('NewPlugin', '3.6.0'),
      新しい値: { type: 'const', value: 1 }
    })
    const pluginInfo = sysVars.get('__pluginInfo')
    assert.notStrictEqual(pluginInfo.NewPlugin.nakoVersionResult, false)
  })

  it('「初期化」は「!プラグイン名:初期化」へ変換される', () => {
    const { manager } = createManager()
    const po = {
      meta: newMeta('InitPlugin'),
      初期化: { type: 'func', josi: [], fn: () => {} }
    }
    manager.addPlugin(po)
    assert.strictEqual(po['初期化'], undefined)
    assert.strictEqual(typeof po['!InitPlugin:初期化'], 'object')
  })

  it('ファイル名に使えない文字はアンダースコアに置換される', () => {
    assert.strictEqual(NakoPluginManager.removeInvalidFilenameChars('my plugin/name'), 'my_plugin_name')
    // 日本語(ひらがな・カタカナ・漢字)はそのまま残る
    assert.strictEqual(NakoPluginManager.removeInvalidFilenameChars('プラグイン漢字かな'), 'プラグイン漢字かな')
  })

  it('プラグイン名の不正文字を置換した名前で登録される', () => {
    const { manager, sysVars } = createManager()
    manager.addPlugin({
      meta: newMeta('my plugin/name'),
      置換テスト値: { type: 'const', value: 1 }
    })
    const pluginInfo = sysVars.get('__pluginInfo')
    assert.ok(pluginInfo.my_plugin_name !== undefined)
    assert.ok(manager.modules.my_plugin_name !== undefined)
  })

  it('「初期化」と「!」で始まるキーはコマンド一覧に登録されない', () => {
    const { manager } = createManager()
    manager.addPlugin({
      meta: newMeta('CommandListPlugin'),
      普通の値: { type: 'const', value: 1 },
      '!クリア': { type: 'func', josi: [], fn: () => {} },
      初期化: { type: 'func', josi: [], fn: () => {} }
    })
    assert.strictEqual(manager.hasCommand('普通の値'), true)
    assert.strictEqual(manager.hasCommand('!クリア'), false)
    assert.strictEqual(manager.hasCommand('初期化'), false)
    assert.strictEqual(manager.hasCommand('!CommandListPlugin:初期化'), false)
  })

  it('addFuncで登録した関数をgetFuncで参照できる', () => {
    const { manager, sysVars } = createManager()
    const fn = (a) => a
    manager.addFunc('テスト関数', [['を']], fn, false)
    const f = manager.getFunc('テスト関数')
    assert.strictEqual(f.type, 'func')
    assert.strictEqual(f.return_none, false)
    assert.strictEqual(sysVars.get('テスト関数'), fn)
  })

  it('createFuncListFromPluginsはプラグイン由来の関数だけを返す', () => {
    const { manager, sysVars } = createManager()
    manager.addPlugin({
      meta: newMeta('ResetPlugin'),
      プラグイン値: { type: 'const', value: 1 }
    })
    // ユーザー定義関数を模したものはシステム領域には登録されない
    const funclist = manager.createFuncListFromPlugins(sysVars)
    assert.strictEqual(funclist.has('プラグイン値'), true)
    assert.strictEqual(funclist.has('ユーザー関数'), false)
  })

  it('reset()するとユーザー定義関数は消えプラグイン関数は残る', async () => {
    const nako = new NakoCompiler()
    await nako.runAsync('●(Aを)ユーザー関数とは\nAを戻す\nここまで', 'main.nako3')
    // ユーザー定義関数は名前空間付きで登録される
    assert.ok(nako.getFunc('main__ユーザー関数') !== undefined)
    nako.reset()
    assert.strictEqual(nako.getFunc('main__ユーザー関数'), undefined)
    assert.ok(nako.getFunc('表示') !== undefined, 'プラグインの命令は残ること')
  })

  it('NakoCompiler.__module と NakoPluginManager.modules は同じ内容を指す', () => {
    const nako = new NakoCompiler()
    nako.addPlugin({
      meta: newMeta('ModuleSharePlugin'),
      共有テスト値: { type: 'const', value: 1 }
    })
    assert.ok(nako.__module.ModuleSharePlugin !== undefined)
    assert.ok(nako.getPluginfiles().ModuleSharePlugin !== undefined)
  })

  it('addPluginObjectはmetaが無いプラグインに名前を付ける', () => {
    const { manager, sysVars } = createManager()
    manager.addPluginObject('ObjectPlugin', { オブジェクト値: { type: 'const', value: 1 } })
    const pluginInfo = sysVars.get('__pluginInfo')
    assert.ok(pluginInfo.ObjectPlugin !== undefined)
  })

  it('addPluginFromFileはメタ情報にファイルパスを記録する', () => {
    const { manager, sysVars } = createManager()
    manager.addPluginFromFile('/path/to/plugin.mjs', {
      meta: newMeta('FilePlugin'),
      ファイル値: { type: 'const', value: 1 }
    })
    const pluginInfo = sysVars.get('__pluginInfo')
    assert.strictEqual(pluginInfo.FilePlugin.path, '/path/to/plugin.mjs')
  })

  it('未知のtypeを持つプラグインはエラーになる', () => {
    const { manager } = createManager()
    assert.throws(() => {
      manager.addPlugin({
        meta: newMeta('BrokenPlugin'),
        壊れた値: { type: 'unknown', value: 1 }
      })
    }, /プラグインの追加でエラー/)
  })
})
