/* eslint-disable no-undef */
// tools/nako3edit/index.nako3 (なでしこ3版エディタサーバー)のテスト
// 一時HOMEでサーバーを起動し、実際のHTTP APIとファイル操作を確認する。
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import http from 'http'
import net from 'net'
import os from 'os'
import { spawn } from 'child_process'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../')
const cnako3Path = path.join(rootDir, 'src/cnako3.mjs')
const editorDir = path.join(rootDir, 'tools/nako3edit')
const editorNako3 = path.join(editorDir, 'index.nako3')

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

/** 一時HOMEを指定してcnako3版nako3editを起動する */
function spawnServer (homeDir, env = {}, args = []) {
  return spawn(process.execPath, [cnako3Path, editorNako3, ...args], {
    cwd: editorDir,
    env: {
      ...process.env,
      HOME: homeDir,
      USERPROFILE: homeDir,
      NAKO3EDIT_HOST: '127.0.0.1',
      NAKO3EDIT_OPEN: '0',
      ...env
    }
  })
}

/** 子プロセスの標準出力に文字列が現れるまで待つ */
function waitForOutput (child, mark, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    let buf = ''
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`タイムアウト: 「${mark}」が出力されませんでした。\n出力=${buf}`))
    }, timeoutMs)
    const onData = (chunk) => {
      buf += chunk.toString()
      if (buf.includes(mark)) {
        cleanup()
        resolve(buf)
      }
    }
    const onExit = () => {
      cleanup()
      reject(new Error(`サーバーが起動前に終了しました。\n出力=${buf}`))
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

/** 子プロセスを確実に終了する */
function killServer (child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null || child.signalCode !== null) { resolve(); return }
    child.once('exit', () => { resolve() })
    child.kill('SIGKILL')
  })
}

/** HTTP GETを実行する。リダイレクトは追わない。 */
function httpGet (port, reqPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: reqPath, method: 'GET' }, (res) => {
      const chunks = []
      res.on('data', (chunk) => { chunks.push(chunk) })
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })
      })
    })
    req.setTimeout(10000, () => { req.destroy(new Error(`HTTPタイムアウト: ${reqPath}`)) })
    req.on('error', reject)
    req.end()
  })
}

/** クエリをURLエンコードしてAPIパスを作る */
function apiPath (pathname, params) {
  return `${pathname}?${new URLSearchParams(params).toString()}`
}

describe('nako3edit/index.nako3', () => {
  let child = null
  let port = 0
  let tempHome = ''
  let userDir = ''
  let appkey = ''

  before(async () => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'nako3edit-test-'))
    userDir = path.join(tempHome, 'nadesiko3_user')
    port = await getFreePort()
    child = spawnServer(tempHome, { NAKO3EDIT_PORT: String(port) })
    await waitForOutput(child, '### 超簡易Webサーバが起動しました')

    const root = await httpGet(port, '/')
    assert.strictEqual(root.status, 302)
    const location = root.headers.location
    assert.ok(location.startsWith('/html/files.html?appkey='))
    appkey = new URL(`http://localhost${location}`).searchParams.get('appkey')
    assert.ok(appkey.startsWith('k'))
  })

  after(async () => {
    await killServer(child)
    if (tempHome && fs.existsSync(tempHome)) {
      fs.rmSync(tempHome, { recursive: true, force: true })
    }
  })

  it('ユーザーフォルダを作成して空のファイル一覧を返すこと', async () => {
    const res = await httpGet(port, '/files')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers['content-type'], 'application/json')
    assert.deepStrictEqual(JSON.parse(res.body.toString('utf-8')), [])
    assert.ok(fs.statSync(userDir).isDirectory())
  })

  it('存在しないファイルには新規ファイルの初期値を返すこと', async () => {
    const res = await httpGet(port, apiPath('/load', { file: 'missing.nako3' }))
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.headers['content-type'], 'text/plain')
    assert.strictEqual(res.body.toString('utf-8'), '# 新規ファイル\n「こんにちは」と表示。')
  })

  it('アプリキーが違う場合は保存しないこと', async () => {
    const res = await httpGet(port, apiPath('/save', {
      appkey: 'wrong-key',
      file: 'invalid.nako3',
      body: '保存されない'
    }))
    assert.strictEqual(res.body.toString('utf-8'), '[ERROR] キーが違います')
    assert.ok(!fs.existsSync(path.join(userDir, 'invalid.nako3')))
  })

  it('ファイル名をサニタイズして保存・読込できること', async () => {
    const body = '「保存できました」と表示。'
    const unsafeName = '../sample/test?.nako3'
    const savedName = '.._sample_test_.nako3'
    const save = await httpGet(port, apiPath('/save', { appkey, file: unsafeName, body }))
    assert.strictEqual(save.body.toString('utf-8'), 'ok')
    assert.strictEqual(fs.readFileSync(path.join(userDir, savedName), 'utf-8'), body)

    const load = await httpGet(port, apiPath('/load', { file: unsafeName }))
    assert.strictEqual(load.body.toString('utf-8'), body)
  })

  it('保存したファイルを一覧で返すこと', async () => {
    const res = await httpGet(port, '/files')
    const files = JSON.parse(res.body.toString('utf-8'))
    assert.ok(files.includes('.._sample_test_.nako3'))
  })

  it('/runで保存したプログラムをcnako3実行できること', async () => {
    const res = await httpGet(port, apiPath('/run', {
      appkey,
      file: 'run-test.nako3',
      body: '「RUN_OK」と表示。'
    }))
    assert.strictEqual(res.status, 200)
    assert.match(res.body.toString('utf-8'), /RUN_OK/)
    assert.ok(fs.existsSync(path.join(userDir, 'run-test.nako3')))
  })

  it('/run_directで保存済みプログラムをcnako3実行できること', async () => {
    const res = await httpGet(port, apiPath('/run_direct', { appkey, file: 'run-test.nako3' }))
    assert.strictEqual(res.status, 200)
    assert.match(res.body.toString('utf-8'), /RUN_OK/)
  })

  it('未使用の新規ファイル名をJSON文字列で返すこと', async () => {
    fs.writeFileSync(path.join(userDir, 'file1.nako3'), '')
    const res = await httpGet(port, '/get_new_filename')
    assert.strictEqual(res.headers['content-type'], 'text/plain; charset=utf-8')
    assert.strictEqual(JSON.parse(res.body.toString('utf-8')), 'file2.nako3')
  })

  it('ファイルを削除し、存在しない場合はエラーを返すこと', async () => {
    const target = path.join(userDir, 'delete-test.nako3')
    fs.writeFileSync(target, '削除対象')
    const deleted = await httpGet(port, apiPath('/deletefile', { appkey, file: 'delete-test.nako3' }))
    assert.strictEqual(JSON.parse(deleted.body.toString('utf-8')), 'ok')
    assert.ok(!fs.existsSync(target))

    const missing = await httpGet(port, apiPath('/deletefile', { appkey, file: 'delete-test.nako3' }))
    assert.strictEqual(JSON.parse(missing.body.toString('utf-8')), '[ERROR] ファイルが見つかりません。')
  })

  it('プラグインAPIでキーと必須パラメータを検証すること', async () => {
    const wrongKey = await httpGet(port, apiPath('/get_plugins', { appkey: 'wrong-key' }))
    assert.strictEqual(JSON.parse(wrongKey.body.toString('utf-8')), '[ERROR] キーが違います')

    const missingName = await httpGet(port, apiPath('/add_plugins', { appkey }))
    assert.strictEqual(JSON.parse(missingName.body.toString('utf-8')), '[ERROR] プラグイン名が指定されていません。')
  })

  it('HTMLとreleaseエイリアスの静的ファイルを返すこと', async () => {
    const html = await httpGet(port, '/html/files.html')
    assert.strictEqual(html.status, 200)
    assert.strictEqual(html.headers['content-type'], 'text/html')
    assert.ok(html.body.equals(fs.readFileSync(path.join(editorDir, 'html/files.html'))))

    const release = await httpGet(port, '/release/wnako3.js')
    assert.strictEqual(release.status, 200)
    assert.strictEqual(release.headers['content-type'], 'text/javascript')
    assert.ok(release.body.equals(fs.readFileSync(path.join(rootDir, 'release/wnako3.js'))))
  })

  it('存在しないファイルは404を返し、上位パス参照を除去すること', async () => {
    const missing = await httpGet(port, '/no-such-file.txt')
    assert.strictEqual(missing.status, 404)
    assert.match(missing.body.toString('utf-8'), /404/)

    const sanitized = await httpGet(port, '/ht..ml/files.html')
    assert.strictEqual(sanitized.status, 200)
  })
})

describe('nako3edit/index.nako3 - ポート番号の指定', () => {
  let tempHome = ''

  before(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'nako3edit-port-test-'))
  })

  after(() => {
    if (tempHome && fs.existsSync(tempHome)) {
      fs.rmSync(tempHome, { recursive: true, force: true })
    }
  })

  it('コマンドライン引数でポート番号を指定できること', async () => {
    const port = await getFreePort()
    const child = spawnServer(tempHome, { NAKO3EDIT_PORT: '' }, [String(port)])
    try {
      const out = await waitForOutput(child, '[URL] http://')
      assert.ok(out.includes(`:${port}`), `出力にポート番号${port}が含まれること 出力=${out}`)
      const res = await httpGet(port, '/')
      assert.strictEqual(res.status, 302)
    } finally {
      await killServer(child)
    }
  })

  for (const invalidPort of ['abc', '99999']) {
    it(`無効なポート番号(${invalidPort})を指定するとエラーを表示して終了すること`, async () => {
      const child = spawnServer(tempHome, { NAKO3EDIT_PORT: invalidPort })
      let out = ''
      child.stdout.on('data', (chunk) => { out += chunk.toString() })
      child.stderr.on('data', (chunk) => { out += chunk.toString() })
      await new Promise((resolve) => { child.on('exit', resolve) })
      assert.ok(out.includes(`[ERROR] 無効なポート番号です: ${invalidPort}`), `出力=${out}`)
      assert.ok(out.includes('環境変数 NAKO3EDIT_PORT'), `出力=${out}`)
    })
  }
})
