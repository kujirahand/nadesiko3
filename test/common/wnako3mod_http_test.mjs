import assert from 'assert'
import { WebNakoCompiler } from '../../src/wnako3mod.mjs'
import { NakoImportError } from '../../core/src/nako_errors.mjs'

/**
 * Web版でも平文 http での取り込みを既定で禁止する (#2634)
 */
describe('wnako3mod_http_test', () => {
  let originalWindow
  let originalFetch
  let fetchCalls
  const token = { file: 'main', line: 1 }

  /** 指定した最終URL(res.url)を持つレスポンスを返す fetch スタブを設定する */
  const stubFetch = (finalUrl, body = 'OK') => {
    globalThis.fetch = async (url) => {
      fetchCalls.push(String(url))
      return { ok: true, status: 200, statusText: 'OK', url: finalUrl, text: async () => body }
    }
  }

  before(() => {
    originalWindow = globalThis.window
    originalFetch = globalThis.fetch
    globalThis.window = { location: { href: 'https://localhost:8888/index.html' } }
  })

  after(() => {
    globalThis.window = originalWindow
    globalThis.fetch = originalFetch
  })

  beforeEach(() => {
    fetchCalls = []
  })

  it('readNako3: http:// は許可なしだと fetch を呼ばずに NakoImportError になる', async () => {
    stubFetch('http://example.com/lib.nako3')
    const compiler = new WebNakoCompiler()
    await assert.rejects(compiler.readNako3('http://example.com/lib.nako3', token, {}).task, NakoImportError)
    await assert.rejects(compiler.readNako3('HTTP://example.com/lib.nako3', token).task, NakoImportError)
    assert.strictEqual(fetchCalls.length, 0)
  })

  it('readNako3: http:// は許可ありなら取得できる', async () => {
    stubFetch('http://example.com/lib.nako3', 'HTTP-OK')
    const compiler = new WebNakoCompiler()
    const text = await compiler.readNako3('http://example.com/lib.nako3', token, { allowHttp: true }).task
    assert.strictEqual(text, 'HTTP-OK')
    assert.strictEqual(fetchCalls.length, 1)
  })

  it('readNako3: https から最終URLが http になるとダウングレードとして NakoImportError になる', async () => {
    stubFetch('http://evil.example.com/lib.nako3')
    const compiler = new WebNakoCompiler()
    await assert.rejects(compiler.readNako3('https://example.com/lib.nako3', token, {}).task, (err) => {
      assert.ok(err instanceof NakoImportError)
      assert.ok(/ダウングレード/.test(err.msg))
      return true
    })
  })

  it('readNako3: 許可ありなら最終URLが http でも取得できる', async () => {
    stubFetch('http://example.com/lib.nako3', 'DOWN-OK')
    const compiler = new WebNakoCompiler()
    const text = await compiler.readNako3('https://example.com/lib.nako3', token, { allowHttp: true }).task
    assert.strictEqual(text, 'DOWN-OK')
  })

  it('readNako3: 最終URLが https なら取得できる', async () => {
    stubFetch('https://cdn.example.com/lib.nako3', 'HTTPS-OK')
    const compiler = new WebNakoCompiler()
    const text = await compiler.readNako3('https://example.com/lib.nako3', token, {}).task
    assert.strictEqual(text, 'HTTPS-OK')
  })

  it('readNako3: res.url が空文字のときは最終URLの確認をスキップする', async () => {
    stubFetch('', 'EMPTY-OK')
    const compiler = new WebNakoCompiler()
    const text = await compiler.readNako3('https://example.com/lib.nako3', token, {}).task
    assert.strictEqual(text, 'EMPTY-OK')
  })

  it('readNako3: 相対パス(同一オリジン)の取り込みが http へリダイレクトされるとダウングレードとしてエラーになる', async () => {
    // window は before() で https://localhost:8888/index.html に設定されている
    stubFetch('http://evil.example.com/lib.nako3')
    const compiler = new WebNakoCompiler()
    await assert.rejects(compiler.readNako3('/dir/lib.nako3', token, {}).task, (err) => {
      assert.ok(err instanceof NakoImportError)
      assert.ok(/ダウングレード/.test(err.msg))
      return true
    })
  })

  describe('resolvePath', () => {
    const resolve = (name, fromFile, href) => {
      globalThis.window = { location: { href } }
      return new WebNakoCompiler().resolvePath(name, token, fromFile)
    }
    const pageHref = 'http://localhost:8888/dir/index.html'

    it('httpで配信されたページと同一オリジンの相対取り込みはパスになる', () => {
      const r = resolve('lib.nako3', 'http://localhost:8888/dir/index.html#script1.nako3', pageHref)
      assert.strictEqual(r.filePath, '/dir/lib.nako3')
      assert.strictEqual(r.type, 'nako3')
    })

    it('他オリジンのファイルからの相対取り込みは絶対URLのまま', () => {
      const r = resolve('b.nako3', 'https://cdn.example.com/lib/a.nako3', pageHref)
      assert.strictEqual(r.filePath, 'https://cdn.example.com/lib/b.nako3')
    })

    it('明示したhttp URLはそのまま返る', () => {
      const r = resolve('http://example.com/x.nako3', 'http://localhost:8888/dir/index.html#s.nako3', pageHref)
      assert.strictEqual(r.filePath, 'http://example.com/x.nako3')
    })

    it('明示した同一オリジンのhttp URLもそのまま返る', () => {
      const r = resolve('http://localhost:8888/dir/x.nako3', '', pageHref)
      assert.strictEqual(r.filePath, 'http://localhost:8888/dir/x.nako3')
    })

    it('大文字の HTTP URL も明示URLとしてそのまま返る', () => {
      const r = resolve('HTTP://example.com/x.nako3', 'http://localhost:8888/dir/index.html#s.nako3', pageHref)
      assert.strictEqual(r.filePath, 'HTTP://example.com/x.nako3')
    })

    it('オリジンが前方一致するだけの別オリジンは同一オリジンとして扱わない', () => {
      const r = resolve('b.nako3', 'https://example.com.evil/lib/a.nako3', 'https://example.com/dir/index.html')
      assert.strictEqual(r.filePath, 'https://example.com.evil/lib/b.nako3')
    })
  })

  it('getLoaderTool が readNako3 / readJs / resolvePath を返す', () => {
    const tool = new WebNakoCompiler().getLoaderTool()
    assert.strictEqual(typeof tool.readNako3, 'function')
    assert.strictEqual(typeof tool.readJs, 'function')
    assert.strictEqual(typeof tool.resolvePath, 'function')
  })
})
