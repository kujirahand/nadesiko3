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
})
