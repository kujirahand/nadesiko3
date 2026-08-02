/* eslint-disable no-undef */
// tools/nako3server/index.nako3 (なでしこ3版の超簡易Webサーバ)のテスト
// 実際に cnako3 でサーバを起動して、HTTPリクエストを投げて動作を確認する。
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import http from 'http'
import net from 'net'
import { spawn } from 'child_process'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.resolve(__dirname, '../../')
const cnako3Path = path.join(rootDir, 'src/cnako3.mjs')
const serverDir = path.join(rootDir, 'tools/nako3server')
const serverNako3 = path.join(serverDir, 'index.nako3')
// 外部ライブラリ(extlib)の有無を判定するファイル。無いとサーバがダウンロードを試みる。
const extlibMark = path.join(rootDir, 'demo/extlib/pure-min.css')

/** 空いているポート番号を取得する */
function getFreePort () {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port
      srv.close(() => { resolve(port) })
    })
  })
}

/** cnako3 で index.nako3 を起動する。環境変数ENVを追加で渡す。 */
function spawnServer (env) {
  return spawn(process.execPath, [cnako3Path, serverNako3], {
    cwd: serverDir,
    env: { ...process.env, NAKO3SERVER_OPEN: '0', ...env }
  })
}

/** 子プロセスの標準出力にMARKが現れるまで待つ。現れなければタイムアウトでエラー。 */
function waitForOutput (child, mark, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buf = ''
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`タイムアウト: 「${mark}」が出力されませんでした。\n出力=${buf}`))
    }, timeoutMs)
    const onData = (chunk) => {
      buf += chunk.toString()
      if (buf.indexOf(mark) >= 0) {
        cleanup()
        resolve(buf)
      }
    }
    const onExit = () => {
      cleanup()
      reject(new Error(`サーバが起動前に終了しました。\n出力=${buf}`))
    }
    const cleanup = () => {
      clearTimeout(timer)
      child.stdout.off('data', onData)
      child.stderr.off('data', onData)
      child.off('exit', onExit)
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('exit', onExit)
  })
}

/** 子プロセスを終了させる */
function killServer (child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null || child.signalCode !== null) { resolve(); return }
    child.on('exit', () => { resolve() })
    child.kill('SIGKILL')
  })
}

/** HTTP GETを実行して、ステータス・ヘッダ・本文(Buffer)を返す。リダイレクトは追わない。 */
function httpGet (port, reqPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: reqPath, method: 'GET' }, (res) => {
      const chunks = []
      res.on('data', (c) => { chunks.push(c) })
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })
      })
    })
    req.on('error', reject)
    req.end()
  })
}

describe('nako3server/index.nako3', () => {
  let child = null
  let port = 0
  // extlibが無い環境ではサーバがダウンロードを試みるため、ダミーを置いてテストを独立させる
  let createdExtlib = false

  before(async () => {
    if (!fs.existsSync(extlibMark)) {
      fs.mkdirSync(path.dirname(extlibMark), { recursive: true })
      fs.writeFileSync(extlibMark, '/* dummy for test */')
      createdExtlib = true
    }
    port = await getFreePort()
    child = spawnServer({ PORT: String(port) })
    await waitForOutput(child, '### 超簡易Webサーバが起動しました', 60000)
  })

  after(async () => {
    await killServer(child)
    if (createdExtlib && fs.existsSync(extlibMark)) {
      fs.unlinkSync(extlibMark)
    }
  })

  it('ルート(/)にアクセスすると /demo/ へリダイレクトすること', async () => {
    const res = await httpGet(port, '/')
    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.location, '/demo/')
  })

  it('フォルダを指定するとindex.htmlが返ること', async () => {
    const res = await httpGet(port, '/demo/')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers['content-type'], 'text/html; charset=utf-8')
    const expected = fs.readFileSync(path.join(rootDir, 'demo/index.html'))
    assert.strictEqual(res.body.length, expected.length)
  })

  it('エイリアス(/css)がdemoフォルダへ割り当てられること', async () => {
    const res = await httpGet(port, '/css/basic.css')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers['content-type'], 'text/css')
    const expected = fs.readFileSync(path.join(rootDir, 'demo/css/basic.css'))
    assert.strictEqual(res.body.length, expected.length)
  })

  it('バイナリファイル(png)が壊れずに返ること', async () => {
    const res = await httpGet(port, '/image/nako.png')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers['content-type'], 'image/png')
    const expected = fs.readFileSync(path.join(rootDir, 'demo/image/nako.png'))
    assert.ok(res.body.equals(expected), 'PNGの内容が元ファイルと一致すること')
  })

  it('クエリパラメータ付きのURLでもファイルが返ること', async () => {
    const res = await httpGet(port, '/demo/index.html?abc=123')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers['content-type'], 'text/html; charset=utf-8')
  })

  it('存在しないファイルは404を返すこと', async () => {
    const res = await httpGet(port, '/no_such_file_12345.txt')
    assert.strictEqual(res.status, 404)
    assert.ok(res.body.toString('utf-8').indexOf('404') >= 0)
  })

  it('上位フォルダへの参照(..)でルート外のファイルが読めないこと', async () => {
    // ルートフォルダの外へ確実に抜け出せるだけの「../」を並べて /etc/passwd を狙う。
    // サニタイズが働いていなければ 200 で中身が漏れてしまう。
    const escape = '/demo/' + '../'.repeat(20) + 'etc/passwd'
    const res = await httpGet(port, escape)
    assert.strictEqual(res.status, 404)
    assert.ok(res.body.toString('utf-8').indexOf('root:') < 0, '/etc/passwd の内容が漏れていないこと')
  })

  it('URIから「..」が確実に取り除かれること', async () => {
    // 「/de..mo/index.html」は「..」が除去されると「/demo/index.html」になる。
    // これが200で返ることは、サニタイズが実際に動いている証拠になる。
    const res = await httpGet(port, '/de..mo/index.html')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers['content-type'], 'text/html; charset=utf-8')
  })

  it('未知の拡張子はtext/plainで返ること', async () => {
    const res = await httpGet(port, '/package.json')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers['content-type'], 'text/plain; charset=utf-8')
  })
})

describe('nako3server/index.nako3 - ポート番号の指定', () => {
  let createdExtlib = false

  before(() => {
    if (!fs.existsSync(extlibMark)) {
      fs.mkdirSync(path.dirname(extlibMark), { recursive: true })
      fs.writeFileSync(extlibMark, '/* dummy for test */')
      createdExtlib = true
    }
  })

  after(() => {
    if (createdExtlib && fs.existsSync(extlibMark)) {
      fs.unlinkSync(extlibMark)
    }
  })

  it('コマンドライン引数でポート番号を指定できること', async () => {
    const port = await getFreePort()
    const child = spawn(process.execPath, [cnako3Path, serverNako3, String(port)], {
      cwd: serverDir,
      env: { ...process.env, NAKO3SERVER_OPEN: '0', PORT: '' }
    })
    try {
      // 「[URL] ...」の行までを待つ(起動メッセージの次の行に出力される)
      const out = await waitForOutput(child, '[URL] http://', 60000)
      assert.ok(out.indexOf(`:${port}`) >= 0, `出力にポート番号${port}が含まれること 出力=${out}`)
      const res = await httpGet(port, '/')
      assert.strictEqual(res.status, 302)
    } finally {
      await killServer(child)
    }
  })

  it('数値でないポート番号を指定するとエラーを表示して終了すること', async () => {
    const child = spawnServer({ PORT: 'abc' })
    let out = ''
    child.stdout.on('data', (c) => { out += c.toString() })
    child.stderr.on('data', (c) => { out += c.toString() })
    await new Promise((resolve) => { child.on('exit', resolve) })
    assert.ok(out.indexOf('[ERROR] 無効なポート番号です: abc') >= 0, `エラーメッセージが表示されること 出力=${out}`)
  })

  it('範囲外のポート番号を指定するとエラーを表示して終了すること', async () => {
    const child = spawnServer({ PORT: '99999' })
    let out = ''
    child.stdout.on('data', (c) => { out += c.toString() })
    child.stderr.on('data', (c) => { out += c.toString() })
    await new Promise((resolve) => { child.on('exit', resolve) })
    assert.ok(out.indexOf('[ERROR] 無効なポート番号です: 99999') >= 0, `エラーメッセージが表示されること 出力=${out}`)
  })
})
