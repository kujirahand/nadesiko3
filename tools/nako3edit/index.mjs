#!/usr/bin/env node
/** nako3edit用の超簡易サーバ(生のnodeだけで簡単HTTPサーバ) */
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import opener from 'opener'
import http from 'http'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CONST
const SERVER_PORT = resolveServerPort(8888)
const SERVER_HOST = process.env.NAKO3EDIT_HOST || 'localhost'
const rootDir = path.resolve(__dirname)
const releaseDir = path.resolve(path.join(__dirname, '../../release'))
const isWin = process.platform === 'win32'
const homeDir = process.env[isWin ? 'USERPROFILE' : 'HOME'] ?? '.'
const userDir = path.join(homeDir, 'nadesiko3_user')
const CNAKO3 = path.resolve(path.join(__dirname, '../../src/cnako3.mjs'))
const NODE = process.argv[0]
const appkey = 'k' +
  Math.floor(Math.random() * 0xFFFFFFFF).toString(16) +
  Math.floor(Math.random() * 0xFFFFFFFF).toString(16) +
  Math.floor(Math.random() * 0xFFFFFFFF).toString(16) +
  Math.floor(Math.random() * 0xFFFFFFFF).toString(16)

// ユーザーフォルダを作成
if (!fs.existsSync(userDir)) { fs.mkdirSync(userDir) }

// サーバ
const server = http.createServer(function (req, res) {
  console.log('[ようこそ]', JSON.stringify(req.url))

  // root なら "demo/"へリダイレクト
  if (req.url === '/') {
    res.writeHead(302, { 'Location': `/html/files.html?appkey=${appkey}` })
    res.end('<a href="/html/files.html">HTML</a>')
    return
  }
  // URLのパース
  let uri = '' + req.url
  const params = {}
  if (uri.indexOf('?') >= 0) {
    const a = uri.split('?')
    uri = a[0]
    const q = String(a[1]).split('&')
    for (const kv of q) {
      const qq = kv.split('=')
      try {
        params[qq[0]] = decodeURIComponent(qq[1])
      } catch (e) {
        console.error(e)
      }
    }
  }
  // サニタイズ
  uri = uri.replace(/\.\./g, '') // 上のフォルダは許さない
  // API
  if (uri === '/files') {
    apiFiles(res)
    return
  }
  if (uri === '/load') {
    apiLoad(res, params)
    return
  }
  if (uri === '/save') {
    apiSave(res, params)
    return
  }
  if (uri === '/run') {
    apiRun(res, params)
    return
  }
  if (uri === '/run_direct') {
    apiRunDirect(res, params)
    return
  }
  if (uri === '/get_new_filename') {
    apiGetNewFilename(res)
    return
  }
  if (uri === '/deletefile') {
    apiDelete(res, params)
    return
  }
  if (uri === '/get_plugins') {
    apiGetPlugins(res, params)
    return
  }
  if (uri === '/add_plugins') {
    apiAddPlugins(res, params)
    return
  }

  // ファイルパスを生成
  let filePath = path.join(rootDir, uri)
  // エイリアス
  if (uri.startsWith('/release/')) {
    uri = uri.replace(/^\/release/, '')
    filePath = path.join(releaseDir, uri)
  }

  // フォルダか？
  if (isDir(filePath)) {
    // index.html を足す
    filePath = path.join(filePath, 'index.html')
  }

  // ファイルの存在確認
  if (!fs.existsSync(filePath)) {
    console.log('[ERROR] 404 ', uri)
    console.log('| file=', filePath)
    res.statusCode = 404
    res.end('<html><meta charset="utf-8"><body><h1>404 残念(ToT) ファイルがありません。</h1></body></html>')
    return
  }
  // ファイルを読んで返す
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 500
      res.end('Failed to read file.')
      return
    }
    const mime = getMIMEType(filePath)
    res.writeHead(200, { 'Content-Type': mime })
    res.end(data)
  })
})
// サーバを起動
server.listen(SERVER_PORT, SERVER_HOST, function () {
  const url = 'http://' + SERVER_HOST + ':' + SERVER_PORT
  console.log('### 超簡易Webサーバが起動しました')
  console.log('[URL]', url)
  if (process.env.NAKO3EDIT_OPEN !== '0') {
    opener(url)
  }
})

// MIMEタイプ
const MimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'svg+xml'
}
function getMIMEType (url) {
  let ext = '.txt'
  const m = url.match(/(\.[a-z0-9_]+)$/)
  if (m) { ext = m[1] }
  if (MimeTypes[ext]) { return MimeTypes[ext] }
  return 'text/plain'
}

// ディレクトリか判定
function isDir (pathName) {
  try {
    // node v12以下ではエラーがあると例外を返す
    const stats = fs.statSync(pathName)
    if (stats && stats.isDirectory()) {
      return true
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    return false
  }
}

// API
function apiFiles (res) {
  const files = fs.readdirSync(userDir)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(files))
}
function apiLoad (res, params) {
  const fname = removePathFlag(params.file)
  const fullpath = path.join(userDir, fname)
  console.log('load=', fullpath)
  let text = '# 新規ファイル\n「こんにちは」と表示。'
  if (fs.existsSync(fullpath)) {
    text = fs.readFileSync(fullpath, 'utf-8')
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(text)
}
function apiSave (res, params) {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  const appkeyUser = params.appkey
  if (appkey !== appkeyUser) {
    res.end('[ERROR] キーが違います')
    return
  }
  const fname = removePathFlag(params.file)
  const body = params.body
  const fullpath = path.join(userDir, fname)
  try {
    fs.writeFileSync(fullpath, body, 'utf-8')
    console.log('[save] file=', fullpath)
    console.log('body=', body)
    console.log('--------------------------------')
    res.end('ok')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    res.end('[ERROR] 保存に失敗しました😭')
  }
}

function removePathFlag (s) {
  // ファイル名をサニタイズ
  s = s.replace(/['"`\\?/<>*]/g, '_')
  s = s.replace(/_{2,}/g, '') // '__'を削除
  return s
}

function apiRun (res, params) {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  const appkeyUser = params.appkey
  if (appkey !== appkeyUser) {
    res.end('[ERROR] キーが違います')
    return
  }
  const fname = removePathFlag(params.file)
  const body = params.body
  const fullpath = path.join(userDir, fname)
  try {
    fs.writeFileSync(fullpath, body, 'utf-8')
    const cmd = `"${NODE}" "${CNAKO3}" "${fullpath}"`
    let result = ''
    try {
      result = execSync(cmd).toString()
    } catch (err) {
      console.error(err)
      res.end('[ERROR]実行に失敗しました。' + err.toString())
      return
    }
    console.log('[run] file=', fname)
    console.log('--------------------------------')
    console.log(result)
    console.log('--------------------------------')
    res.end(result)
  } catch (err) {
    console.error(err)
    res.end('[ERROR] 実行に失敗しました。')
  }
}

function apiRunDirect(res, params) {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  const appkeyUser = params.appkey
  if (appkey !== appkeyUser) {
    res.end('[ERROR] キーが違います')
    return
  }
  const fname = removePathFlag(params.file)
  const fullpath = path.join(userDir, fname)
  try {
    const cmd = `"${NODE}" "${CNAKO3}" "${fullpath}"`
    console.log("@run=", cmd)
    let result = ''
    try {
      result = execSync(cmd).toString()
    } catch (err) {
      console.error(err)
      res.end('[ERROR]実行に失敗しました。' + err.toString())
      return
    }
    console.log('[run] file=', fname)
    console.log('--------------------------------')
    console.log(result)
    console.log('--------------------------------')
    res.end(result)
  } catch (err) {
    console.error(err)
    res.end('[ERROR] 実行に失敗しました。')
  }
}

function apiDelete (res, params) {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  const appkeyUser = params.appkey
  if (appkey !== appkeyUser) {
    res.end('"[ERROR] キーが違います"')
    return
  }
  const fname = removePathFlag(params.file)
  const fullpath = path.join(userDir, fname)
  try {
    if (fs.existsSync(fullpath)) {
      fs.unlinkSync(fullpath)
      res.end('"ok"')
    } else {
      res.end('"[ERROR] ファイルが見つかりません。"')
    }
    return
  } catch (err) {
    console.error(err)
    res.end('error:' + err.message)
  }
}

function apiGetNewFilename (res) {
  let fname = 'newfile.nako3'
  for (let i = 1; i <= 9999; i++) {
    fname = `file${i}.nako3`
    const full = path.join(userDir, fname)
    if (fs.existsSync(full)) { continue }
    break
  }
  res.writeHead(200, { 'Content-Type': 'text/plaing; charset=utf-8' })
  res.end(`"${fname}"`)
}

function apiGetPlugins (res, params) {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  const appkeyUser = params.appkey
  if (appkey !== appkeyUser) {
    res.end('"[ERROR] キーが違います"')
    return
  }
  try {
    // コマンドを実行してプラグインを取得
    const cmd = 'npm search "nadesiko3\\-" --json'
    const result = execSync(cmd).toString()
    res.end(result)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    res.end('"[ERROR] プラグインの取得に失敗しました。"')
  }
}

function apiAddPlugins(res, params) {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  const appkeyUser = params.appkey
  if (appkey !== appkeyUser) {
    res.end('"[ERROR] キーが違います"')
    return
  }
  try {
    const name = params.name
    if (!name) {
      res.end('"[ERROR] プラグイン名が指定されていません。"')
      return
    }
    const cmd = `npm install "${name}"`
    const result = execSync(cmd).toString()
    res.end("実行しました:" + result)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    res.end('"[ERROR] プラグインの取得に失敗しました。"')
  }
}

// ポート番号の解決
function resolveServerPort (defaultPort) {
  const rawPort = process.env.NAKO3EDIT_PORT || process.argv[2] || defaultPort
  const port = Number.parseInt(rawPort, 10)
  if (Number.isNaN(port) || port < 0 || port > 65535) {
    console.error(`[ERROR] 無効なポート番号です: ${rawPort}`)
    console.error('[ERROR] 環境変数 PORT またはコマンドライン引数には 0 から 65535 の整数を指定してください。')
    process.exit(1)
  }
  return port
}
