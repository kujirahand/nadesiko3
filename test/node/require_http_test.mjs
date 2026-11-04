/* eslint-disable no-undef */
import { describe, it, before, after } from 'node:test'
import assert from 'assert'
import http from 'node:http'

import { CNako3, fetchImportUrl } from '../../src/cnako3mod.mjs'
import { NakoImportError } from '../../core/src/nako_errors.mjs'

/**
 * 平文 http での取り込みを既定で禁止する (#2634)
 */
describe('require_http_test', () => {
  const token = { file: 'main.nako3', line: 1 }

  /** fetch のスタブを作る。routes は URL → { status, location, body } */
  const createFetchStub = (routes) => {
    const calls = []
    const stub = async (url, init) => {
      calls.push({ url: String(url), init })
      const r = routes[String(url)]
      if (!r) { return new Response('not found', { status: 404 }) }
      const headers = r.location ? { location: r.location } : {}
      return new Response(r.body ?? '', { status: r.status ?? 200, headers })
    }
    return { stub, calls }
  }

  describe('fetchImportUrl', () => {
    it('https から https へのリダイレクトは成功する', async () => {
      const { stub, calls } = createFetchStub({
        'https://a.example/lib.nako3': { status: 302, location: 'https://b.example/lib.nako3' },
        'https://b.example/lib.nako3': { body: 'OK' }
      })
      const res = await fetchImportUrl('https://a.example/lib.nako3', {}, token, stub)
      assert.strictEqual(await res.text(), 'OK')
      assert.strictEqual(calls.length, 2)
      assert.strictEqual(calls[0].init.redirect, 'manual')
    })

    it('相対 Location が解決される', async () => {
      const { stub } = createFetchStub({
        'https://a.example/dir/lib.nako3': { status: 301, location: '/other/lib2.nako3' },
        'https://a.example/other/lib2.nako3': { body: 'REL' }
      })
      const res = await fetchImportUrl('https://a.example/dir/lib.nako3', {}, token, stub)
      assert.strictEqual(await res.text(), 'REL')
    })

    it('https から http へのリダイレクトは禁止される', async () => {
      const { stub, calls } = createFetchStub({
        'https://a.example/lib.nako3': { status: 302, location: 'http://b.example/lib.nako3' },
        'http://b.example/lib.nako3': { body: 'NG' }
      })
      await assert.rejects(fetchImportUrl('https://a.example/lib.nako3', {}, token, stub), (err) => {
        assert.ok(err instanceof NakoImportError)
        assert.ok(/ダウングレード/.test(err.msg))
        assert.ok(/http:\/\/b\.example\/lib\.nako3/.test(err.msg))
        return true
      })
      assert.strictEqual(calls.length, 1, 'http には接続しない')
    })

    it('allowHttp のときは https から http へのリダイレクトも許可される', async () => {
      const { stub } = createFetchStub({
        'https://a.example/lib.nako3': { status: 307, location: 'http://b.example/lib.nako3' },
        'http://b.example/lib.nako3': { body: 'OK' }
      })
      const res = await fetchImportUrl('https://a.example/lib.nako3', { allowHttp: true }, token, stub)
      assert.strictEqual(await res.text(), 'OK')
    })

    it('http の初回URLは allowHttp のときだけ成功する', async () => {
      const { stub, calls } = createFetchStub({ 'http://a.example/lib.nako3': { body: 'OK' } })
      await assert.rejects(fetchImportUrl('http://a.example/lib.nako3', {}, token, stub), NakoImportError)
      assert.strictEqual(calls.length, 0, '禁止時は fetch を呼ばない')
      const res = await fetchImportUrl('http://a.example/lib.nako3', { allowHttp: true }, token, stub)
      assert.strictEqual(await res.text(), 'OK')
    })

    it('http/https 以外のスキームは禁止される', async () => {
      const { stub } = createFetchStub({})
      await assert.rejects(fetchImportUrl('file:///etc/passwd', { allowHttp: true }, token, stub), NakoImportError)
      const { stub: stub2 } = createFetchStub({
        'https://a.example/x.nako3': { status: 302, location: 'ftp://b.example/x.nako3' }
      })
      await assert.rejects(fetchImportUrl('https://a.example/x.nako3', { allowHttp: true }, token, stub2), NakoImportError)
    })

    it('リダイレクトの上限を超えるとエラーになる', async () => {
      const { stub, calls } = createFetchStub({
        'https://a.example/loop': { status: 302, location: 'https://a.example/loop' }
      })
      await assert.rejects(fetchImportUrl('https://a.example/loop', {}, token, stub), (err) => {
        assert.ok(err instanceof NakoImportError)
        assert.ok(/リダイレクト/.test(err.msg))
        return true
      })
      assert.strictEqual(calls.length, 11, '初回 + リダイレクト10回')
    })
  })

  describe('CNako3 の統合テスト(ローカルhttpサーバー)', () => {
    let server
    let base
    before(async () => {
      server = http.createServer((req, res) => {
        if (req.url === '/lib.nako3') {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('●(Aを)ライブラリ関数とは\n  「ライブラリ:{A}」を表示\nここまで\n')
        } else if (req.url === '/plugin.mjs') {
          res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
          res.end([
            'export default {',
            "  'meta': {",
            "    type: 'const',",
            "    value: { pluginName: 'plugin_http_test', description: 'httpテスト用', pluginVersion: '3.6.0', nakoRuntime: ['cnako'], nakoVersion: '3.6.0' }",
            '  },',
            "  'HTTPプラグイン値': { type: 'const', value: 42 }",
            '}',
            ''
          ].join('\n'))
        } else {
          res.writeHead(404)
          res.end('not found')
        }
      })
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
      base = `http://127.0.0.1:${server.address().port}`
    })
    after(async () => {
      if (server) {
        server.closeAllConnections?.()
        await new Promise((resolve) => server.close(resolve))
      }
    })

    it('既定では http の取り込みは NakoImportError になる', async () => {
      const nako = new CNako3()
      const code = `!「${base}/lib.nako3」を取り込む\n「あ」をライブラリ関数\n`
      await assert.rejects(nako.runAsync(code, 'main.nako3'), (err) => {
        assert.ok(err instanceof NakoImportError)
        assert.ok(/互換性重視:取込/.test(err.msg))
        return true
      })
    })

    it('!互換性重視:取込 を前に書くと http の取り込みができる', async () => {
      const nako = new CNako3()
      const code = `!互換性重視:取込\n!「${base}/lib.nako3」を取り込む\n「あ」をライブラリ関数\n`
      const g = await nako.runAsync(code, 'main.nako3')
      assert.strictEqual(g.log, 'ライブラリ:あ')
    })

    it('既定では http の JSプラグインの取り込みは NakoImportError になる', async () => {
      const nako = new CNako3()
      const code = `!「${base}/plugin.mjs」を取り込む\nHTTPプラグイン値を表示\n`
      await assert.rejects(nako.runAsync(code, 'main.nako3'), (err) => {
        assert.ok(err instanceof NakoImportError)
        return true
      })
    })

    it('!互換性重視:取込 を前に書くと http の JSプラグインを取り込める', async () => {
      const nako = new CNako3()
      const code = `!互換性重視:取込\n!「${base}/plugin.mjs」を取り込む\nHTTPプラグイン値を表示\n`
      const g = await nako.runAsync(code, 'main.nako3')
      assert.strictEqual(g.log, '42')
    })
  })
})
