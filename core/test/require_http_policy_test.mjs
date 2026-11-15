/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'

import { NakoCompiler } from '../src/nako3.mjs'
import { listRequireStatements, NakoRequireLoader } from '../src/nako_require.mjs'
import { NakoImportError } from '../src/nako_errors.mjs'

/**
 * 平文 http での取り込みを既定で禁止する (#2634)
 */
describe('require_http_policy_test', () => {
  const createLoader = () => {
    const nako = new NakoCompiler()
    const loader = new NakoRequireLoader({
      rawtokenize: (code, line, filename, preCode) => nako.rawtokenize(code, line, filename, preCode),
      addPluginFromFile: () => {},
      getLogger: () => nako.getLogger(),
      createScanner: () => new NakoCompiler(),
      countFailure: () => {}
    })
    return { nako, loader }
  }

  /** 呼び出し履歴を記録するスタブのLoaderToolを作る */
  const createTools = () => {
    const calls = { readNako3: [], readJs: [], resolvePath: [] }
    const tools = {
      resolvePath: (name, token, fromFile, options) => {
        calls.resolvePath.push({ name, options })
        const type = /\.(js|mjs)$/.test(name) ? 'js' : 'nako3'
        return { filePath: name, type }
      },
      readNako3: (filePath, token, options) => {
        calls.readNako3.push({ filePath, options })
        return { task: Promise.resolve('「LIB」を表示\n') }
      },
      readJs: (filePath, token, options) => {
        calls.readJs.push({ filePath, options })
        return { task: Promise.resolve(() => ({})) }
      }
    }
    return { tools, calls }
  }

  const assertHttpForbidden = (fn) => {
    assert.throws(fn, (err) => {
      assert.ok(err instanceof NakoImportError)
      assert.ok(/http/.test(err.msg))
      assert.ok(/互換性重視:取込/.test(err.msg), '許可の方法がメッセージに含まれること')
      return true
    })
  }

  it('http:// の .nako3 は指令なしだとエラーになり、読み込まれない', () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    assertHttpForbidden(() => loader.load('!「http://example.com/lib.nako3」を取り込む\n', 'main.nako3', '', tools))
    assert.strictEqual(calls.readNako3.length, 0)
  })

  it('スキームが大文字の HTTP:// でも禁止される', () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    assertHttpForbidden(() => loader.load('!「HTTP://example.com/lib.nako3」を取り込む\n', 'main.nako3', '', {
      ...tools,
      resolvePath: (name) => ({ filePath: name, type: 'nako3' })
    }))
    assert.strictEqual(calls.readNako3.length, 0)
  })

  it('指令を前に書けば http:// の .nako3 を読み込める', async () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    await loader.load('!互換性重視:取込\n!「http://example.com/lib.nako3」を取り込む\n', 'main.nako3', '', tools)
    assert.strictEqual(calls.readNako3.length, 1)
    assert.strictEqual(calls.readNako3[0].options.allowHttp, true)
    assert.ok(loader.dependencies['http://example.com/lib.nako3'])
  })

  it('全角の指令でも許可される', async () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    await loader.load('!互換性重視：取込\n!「http://example.com/lib.nako3」を取り込む\n', 'main.nako3', '', tools)
    assert.strictEqual(calls.readNako3.length, 1)
  })

  it('「!互換性重視:取込禁止」は指令として扱わない(末尾境界の確認)', () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    assertHttpForbidden(() => loader.load('!互換性重視:取込禁止\n!「http://example.com/lib.nako3」を取り込む\n', 'main.nako3', '', tools))
    assert.strictEqual(calls.readNako3.length, 0)
  })

  it('指令の後ろに句点やコメントがあっても許可される', async () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    await loader.load('!互換性重視:取込。\n!「http://example.com/lib.nako3」を取り込む\n', 'main.nako3', '', tools)
    assert.strictEqual(calls.readNako3.length, 1)
    const { loader: loader2 } = createLoader()
    const { tools: tools2, calls: calls2 } = createTools()
    await loader2.load('!互換性重視:取込 # 互換性のための指定\n!「http://example.com/lib.nako3」を取り込む\n', 'main.nako3', '', tools2)
    assert.strictEqual(calls2.readNako3.length, 1)
  })

  it('指令が取り込み文より後ろにある場合は禁止のまま', () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    const code = '!「http://example.com/lib.nako3」を取り込む\n!互換性重視:取込\n'
    assertHttpForbidden(() => loader.load(code, 'main.nako3', '', tools))
    assert.strictEqual(calls.readNako3.length, 0)
  })

  it('指令より前の http は禁止、後ろの http は許可される(文ごとに判定)', () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    const code = '!「http://example.com/a.nako3」を取り込む\n!互換性重視:取込\n!「http://example.com/b.nako3」を取り込む\n'
    assertHttpForbidden(() => loader.load(code, 'main.nako3', '', tools))
    assert.strictEqual(calls.readNako3.length, 0)
  })

  it('https:// の取り込みは指令なしでも読み込める', async () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    await loader.load('!「https://example.com/lib.nako3」を取り込む\n', 'main.nako3', '', tools)
    assert.strictEqual(calls.readNako3.length, 1)
    assert.ok(!calls.readNako3[0].options.allowHttp)
  })

  it('http:// の .js は指令なしだと禁止される', () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    assertHttpForbidden(() => loader.load('!「http://example.com/plugin.js」を取り込む\n', 'main.nako3', '', tools))
    assert.strictEqual(calls.readJs.length, 0)
  })

  it('指令があれば http:// の .js を読み込める', async () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    await loader.load('!互換性重視:取込\n!「http://example.com/plugin.js」を取り込む\n', 'main.nako3', '', tools)
    assert.strictEqual(calls.readJs.length, 1)
    assert.strictEqual(calls.readJs[0].options.allowHttp, true)
  })

  it('ローカルファイルの取り込みは従来どおり読み込める', async () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    await loader.load('!「lib.nako3」を取り込む\n', 'main.nako3', '', tools)
    assert.strictEqual(calls.readNako3.length, 1)
    assert.ok(loader.dependencies['lib.nako3'])
  })

  it('指令は取り込み先のファイルには引き継がれない', async () => {
    const { loader } = createLoader()
    const { tools, calls } = createTools()
    // main は許可するが、a.nako3 の中の http 取り込みは許可されない
    tools.readNako3 = (filePath, token, options) => {
      calls.readNako3.push({ filePath, options })
      const src = filePath === 'http://example.com/a.nako3'
        ? '!「http://example.com/b.nako3」を取り込む\n'
        : '「B」を表示\n'
      return { task: Promise.resolve(src) }
    }
    const result = loader.load('!互換性重視:取込\n!「http://example.com/a.nako3」を取り込む\n', 'main.nako3', '', tools)
    await assert.rejects(Promise.resolve(result), (err) => {
      assert.ok(err instanceof NakoImportError)
      return true
    })
    assert.ok(!calls.readNako3.some((c) => c.filePath === 'http://example.com/b.nako3'))
  })

  it('指令行が取り込み文として誤検出されない', () => {
    const nako = new NakoCompiler()
    const code = '!互換性重視:取込\n!「lib.nako3」を取り込む\n「テスト」を表示\n'
    const tokens = nako.rawtokenize(code, 0, 'main.nako3')
    const list = listRequireStatements(tokens)
    assert.deepStrictEqual(list.map((t) => t.value), ['lib.nako3'])
    const directive = tokens.filter((t) => t.type === 'line_comment')
    assert.strictEqual(directive.length, 1)
  })

  it('指令行入りのプログラムが通常どおり実行できる', async () => {
    const nako = new NakoCompiler()
    const g = await nako.runAsync('!互換性重視:取込\n「こんにちは」を表示\n', 'main.nako3')
    assert.strictEqual(g.log, 'こんにちは')
  })
})
