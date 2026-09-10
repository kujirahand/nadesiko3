/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import http from 'http'
import os from 'os'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginHttpServer from '../../src/plugin_httpserver.mjs'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('plugin_httpserver_test', () => {
  let nako
  let serverDp

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  beforeEach(() => {
    serverDp = null
    nako = new NakoCompiler()
    // PluginHttpServerの登録。名前は 'plugin_httpserver.js' とする。
    nako.addPluginFile('PluginHttpServer', 'plugin_httpserver.js', PluginHttpServer)
  })

  afterEach(async () => {
    if (serverDp && serverDp.server) {
      await new Promise((resolve) => {
        serverDp.server.close(() => {
          resolve()
        })
      })
    }
  })

  it('クエリパラメータ付きのURLで静的ファイルが取得できること', async () => {
    // テスト用のダミーファイルを作成
    const tempDir = path.join(__dirname, 'fixtures_http')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    const tempFile = path.join(tempDir, 'test.txt')
    fs.writeFileSync(tempFile, 'hello world')

    let port = 0
    // `簡易HTTPサーバ起動時`を呼ぶ
    const code = `
●ダミー起動
  戻る。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「/」を「${tempDir.replace(/\\/g, '/')}」に簡易HTTPサーバ静的パス指定。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    // クエリパラメータ付きでリクエストを送る
    const resText = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/test.txt?foo=bar&baz=123`, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      }).on('error', reject)
    })

    assert.strictEqual(resText, 'hello world')

    // 一時ファイルを削除
    try {
      fs.unlinkSync(tempFile)
      fs.rmdirSync(tempDir)
    } catch (e) {}
  })

  it('POSTメソッドで送信されたJSONデータを取得できること', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  POSTデータ["message"]を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/post-json」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const postData = JSON.stringify({ message: 'hello post json' })
    const resText = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/post-json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    assert.strictEqual(resText, 'hello post json')
  })

  it('POSTメソッドで送信されたurlencodedデータを取得できること', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  POSTデータ["message"]を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/post-urlencoded」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const postData = 'message=hello+post+urlencoded'
    const resText = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/post-urlencoded',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    assert.strictEqual(resText, 'hello post urlencoded')
  })

  it('GETクエリパラメータが正しく解析されること #2493', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  G=GETデータ
  「{G["token"]}|{G["flag"]}|{G["next"]}|{G["?URL"]}」を簡易HTTPサーバ出力。
ここまで。
●プロト確認
  G=GETデータ
  「{G["__proto__"]}|{G["?URL"]}」を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/hello」に簡易HTTPサーバ受信時。
「プロト確認」を「/proto」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const request = (path) => new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'GET'
      }, (res) => {
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.end()
    })

    // 値の中の=と?、値なしフラグをまとめて正しく解析する
    assert.strictEqual(await request('/hello?token=a=b&flag&next=a?b'), 'a=b||a?b|/hello')
    // #フラグメント以降は切り捨てる
    assert.strictEqual(await request('/hello?token=a#frag'), 'a|undefined|undefined|/hello')
    // 重複キーは最後の値で上書きされる
    assert.strictEqual(await request('/hello?token=1&token=2&flag&next=x'), '2||x|/hello')
    // +は空白に変換される
    assert.strictEqual(await request('/hello?token=hello+world&flag&next=x'), 'hello world||x|/hello')
    // 不正なpercentエンコーディングは生のまま保持される
    assert.strictEqual(await request('/hello?token=%ZZ&flag&next=x'), '%ZZ||x|/hello')
    // 特殊キー__proto__でもクラッシュせず、?URLはパスで上書きされる
    assert.strictEqual(await request('/hello?__proto__=x&%3FURL=/evil&token=a'), 'a|undefined|undefined|/hello')
    // __proto__は値として取得でき、?URLはリクエストのパスが維持されること
    assert.strictEqual(await request('/proto?__proto__=x&%3FURL=/evil&token=a'), 'x|/proto')
    // __proto__でObject.prototypeが汚染されないこと
    assert.strictEqual(({}).x, undefined)
    assert.strictEqual(Object.prototype.x, undefined)
  })

  it('POSTメソッドでファイルをアップロードしてFILESデータを取得できること', async () => {
    const originalWriteFileSync = fs.writeFileSync
    fs.writeFileSync = () => {
      throw new Error('writeFileSync should not be used during upload handling')
    }

    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  ファイル情報＝FILESデータ[0]
  もし、ファイル情報["path"]が空でなければ
    ファイル名＝ファイル情報["name"]
    ファイルサイズ＝ファイル情報["size"]
    「OK:{ファイル名}:{ファイルサイズ}」を簡易HTTPサーバ出力。
  違えば
    「NG」を簡易HTTPサーバ出力。
  ここまで。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/upload」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const boundary = '----TestBoundary'
    const parts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="file1"; filename="hello.txt"\r\n`,
      `Content-Type: text/plain\r\n\r\n`,
      `hello world nako3 upload\r\n`,
      `--${boundary}--\r\n`
    ]
    const postData = Buffer.from(parts.join(''))

    const resText = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': postData.length
        }
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    try {
      assert.strictEqual(resText, 'OK:hello.txt:24')

      const uploadDir = path.join(os.tmpdir(), 'nako3-plugin_httpserver_upload')
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir)
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(uploadDir, file))
          } catch (e) {}
        }
        try {
          fs.rmdirSync(uploadDir)
        } catch (e) {}
      }
    } finally {
      fs.writeFileSync = originalWriteFileSync
    }
  })

  it('HTTPメソッドにGET/POST/PUT/DELETEが設定されること', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  「M={HTTPメソッド}」を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/method」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const request = (method) => new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/method',
        method: method
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.end()
    })

    assert.strictEqual(await request('GET'), 'M=GET')
    assert.strictEqual(await request('POST'), 'M=POST')
    assert.strictEqual(await request('PUT'), 'M=PUT')
    assert.strictEqual(await request('DELETE'), 'M=DELETE')
  })
  it('受信時コールバックで例外が発生してもプロセスが落ちず500を返すこと', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  情報＝FILESデータ[0]
  情報["path"]を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/boom」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const status = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/boom',
        method: 'GET'
      }, (res) => {
        res.on('data', () => {})
        res.on('end', () => { resolve(res.statusCode) })
      })
      req.on('error', reject)
      req.end()
    })

    // 例外がプロセスを停止させず、500として返ること
    assert.strictEqual(status, 500)

    // サーバが生きていて次のリクエストも処理できること
    const status2 = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/boom',
        method: 'GET'
      }, (res) => {
        res.on('data', () => {})
        res.on('end', () => { resolve(res.statusCode) })
      })
      req.on('error', reject)
      req.end()
    })
    assert.strictEqual(status2, 500)
  })
})
