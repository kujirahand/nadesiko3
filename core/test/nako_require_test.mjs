/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'

import { NakoCompiler } from '../src/nako3.mjs'
import { listRequireStatements, NakoRequireLoader } from '../src/nako_require.mjs'
import { NakoImportError } from '../src/nako_errors.mjs'

/**
 * 取り込み文(require)の処理を NakoCompiler から分離したモジュールのテスト (#2360)
 */
describe('nako_require_test', () => {
  /** テスト用のローダーを作る。addPluginFromFile の呼び出し履歴も返す */
  const createLoader = () => {
    const nako = new NakoCompiler()
    const addedPlugins = []
    const loader = new NakoRequireLoader({
      rawtokenize: (code, line, filename, preCode) => nako.rawtokenize(code, line, filename, preCode),
      addPluginFromFile: (fpath, po) => { addedPlugins.push({ fpath, po }) },
      getLogger: () => nako.getLogger(),
      createScanner: () => new NakoCompiler(),
      countFailure: () => {}
    })
    return { nako, loader, addedPlugins }
  }

  /** 依存ファイルの情報を作る */
  const newDependency = (nako, filePath, code) => {
    return {
      tokens: nako.rawtokenize(code, 0, filePath),
      alias: new Set([filePath]),
      addPluginFile: () => {},
      funclist: new Map(),
      moduleExport: new Map()
    }
  }

  it('export関数とNakoCompilerのstaticメソッドは同じ結果を返す', () => {
    const nako = new NakoCompiler()
    const tokens = nako.rawtokenize('!「hoge.nako3」を取り込む\n「テスト」を表示\n', 0, 'main.nako3')
    const a = listRequireStatements(tokens).map((t) => t.value)
    const b = NakoCompiler.listRequireStatements(tokens).map((t) => t.value)
    assert.deepStrictEqual(a, ['hoge.nako3'])
    assert.deepStrictEqual(a, b)
  })

  it('複数の取り込み文をstartの昇順で列挙する', () => {
    const nako = new NakoCompiler()
    const code = '!「a.nako3」を取り込む\n!「b.nako3」を取り込む\n!「c.nako3」を取り込む\n'
    const tokens = nako.rawtokenize(code, 0, 'main.nako3')
    const list = listRequireStatements(tokens)
    assert.deepStrictEqual(list.map((t) => t.value), ['a.nako3', 'b.nako3', 'c.nako3'])
    for (let i = 0; i < list.length; i++) {
      assert.strictEqual(list[i].end, list[i].start + 3, '取り込み文は3トークンで構成される')
      if (i > 0) {
        assert.ok(list[i - 1].start < list[i].start, 'startの昇順に並んでいること')
      }
    }
  })

  it('相互に取り込み合うファイルでも無限ループしない', () => {
    const { nako, loader } = createLoader()
    // a.nako3 は b.nako3 を、b.nako3 は a.nako3 を取り込む
    loader.dependencies = {
      'a.nako3': newDependency(nako, 'a.nako3', '!「b.nako3」を取り込む\n「A」を表示\n'),
      'b.nako3': newDependency(nako, 'b.nako3', '!「a.nako3」を取り込む\n「B」を表示\n')
    }
    const tokens = nako.rawtokenize('!「a.nako3」を取り込む\n「M」を表示\n', 0, 'main.nako3')
    const deleted = loader.replaceRequireStatements(tokens)
    assert.ok(deleted.length > 0, '取り込み文が削除されること')
    assert.strictEqual(listRequireStatements(tokens).length, 0, '取り込み文がすべて置換されること')
  })

  it('removeRequireStatementsは取り込み文を削除する', () => {
    const { nako, loader } = createLoader()
    let called = 0
    loader.dependencies = {
      'a.nako3': { ...newDependency(nako, 'a.nako3', '「A」を表示\n'), addPluginFile: () => { called++ } }
    }
    const tokens = nako.rawtokenize('!「a.nako3」を取り込む\n「M」を表示\n', 0, 'main.nako3')
    const deleted = loader.removeRequireStatements(tokens)
    assert.strictEqual(deleted.length, 3)
    assert.strictEqual(listRequireStatements(tokens).length, 0)
    assert.strictEqual(called, 1, 'シンタックスハイライトのためにaddPluginFileが呼ばれること')
  })

  it('読み込まれていないファイルを取り込むとエラーになる', () => {
    const { nako, loader } = createLoader()
    const tokens = nako.rawtokenize('!「notfound.nako3」を取り込む\n', 0, 'main.nako3')
    assert.throws(() => loader.replaceRequireStatements(tokens), /読み込まれていません/)
  })

  it('未対応の拡張子ではNakoImportErrorになる', () => {
    const { loader } = createLoader()
    const tools = {
      resolvePath: (name) => ({ filePath: name, type: 'txt' }),
      readNako3: () => ({ task: Promise.resolve('') }),
      readJs: () => ({ task: Promise.resolve(() => ({})) })
    }
    assert.throws(
      () => loader.load('!「foo.txt」を取り込む\n', 'main.nako3', '', tools),
      (err) => {
        assert.ok(err instanceof NakoImportError)
        assert.ok(/読み込めません/.test(err.msg))
        return true
      }
    )
  })

  it('なでしこファイルを読み込んでdependenciesに保存する', async () => {
    const { loader } = createLoader()
    const tools = {
      resolvePath: (name) => ({ filePath: name, type: 'nako3' }),
      readNako3: () => ({ task: Promise.resolve('●(Aを)ライブラリ関数とは\nAを戻す\nここまで\n') }),
      readJs: () => ({ task: Promise.resolve(() => ({})) })
    }
    await loader.load('!「lib.nako3」を取り込む\n', 'main.nako3', '', tools)
    const dep = loader.dependencies['lib.nako3']
    assert.ok(dep !== undefined, 'dependenciesに登録されること')
    assert.ok(dep.tokens.length > 0, 'トークン列が保存されること')
    const names = [...dep.funclist.keys()].filter((k) => String(k).includes('ライブラリ関数'))
    assert.ok(names.length > 0, '関数名の一覧が事前に取り出されること')
  })

  it('JSプラグインを読み込んでaddPluginFromFileを呼ぶ', async () => {
    const { loader, addedPlugins } = createLoader()
    const pluginObject = {
      meta: { type: 'const', value: { pluginName: 'RequireTestPlugin', nakoVersion: '3.6.0' } },
      取込テスト値: { type: 'const', value: 123 }
    }
    const tools = {
      resolvePath: (name) => ({ filePath: name, type: 'mjs' }),
      readNako3: () => ({ task: Promise.resolve('') }),
      readJs: () => ({ task: Promise.resolve(() => pluginObject) })
    }
    await loader.load('!「plugin.mjs」を取り込む\n', 'main.nako3', '', tools)
    assert.strictEqual(addedPlugins.length, 1)
    assert.strictEqual(addedPlugins[0].fpath, 'plugin.mjs')
    assert.strictEqual(loader.dependencies['plugin.mjs'].funclist, pluginObject)
  })

  it('同じファイルを2回取り込んでもエイリアスにまとめられる', async () => {
    const { loader } = createLoader()
    const tools = {
      resolvePath: (name) => ({ filePath: 'lib.nako3', type: 'nako3' }),
      readNako3: () => ({ task: Promise.resolve('「LIB」を表示\n') }),
      readJs: () => ({ task: Promise.resolve(() => ({})) })
    }
    await loader.load('!「lib.nako3」を取り込む\n!「./lib.nako3」を取り込む\n', 'main.nako3', '', tools)
    assert.strictEqual(Object.keys(loader.dependencies).length, 1)
    assert.deepStrictEqual([...loader.dependencies['lib.nako3'].alias].sort(), ['./lib.nako3', 'lib.nako3'])
  })
})
