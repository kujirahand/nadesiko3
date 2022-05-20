#!/usr/bin/env node
/** 超簡易サーバ(生のnodeだけで簡単HTTPサーバ) */
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
const SERVER_PORT = 3000
const rootDir = path.resolve(path.join(__dirname, '../'))

// ライブラリがあるかチェック
if (!fs.existsSync(path.resolve(rootDir, 'extlib/pure.min.css'))) {
  execSync('npm run extlib:install')
}

// root => redirect to demo/

const server = http.createServer(function (req, res) {
  console.log('[ようこそ]', JSON.stringify(req.url))

  // root なら "demo/"へリダイレクト
  if (req.url === '/') {
    res.writeHead(302, { 'Location': '/demo/' })
    res.end('<a href="/demo/">DEMO</a>')
    return
  }
  // サニタイズ
  let uri = '' + req.url
  uri = uri.replace(/\.\./g, '') // 上のフォルダは許さない

  // ファイルパスを生成
  let filePath = path.join(rootDir, uri)
  // エイリアス
  if (uri.startsWith('/extlib')) {
    filePath = path.join(rootDir, 'demo', uri)
  }
  if (uri.startsWith('/css')) {
    filePath = path.join(rootDir, 'demo', uri)
  }
  if (uri.startsWith('/image')) {
    filePath = path.join(rootDir, 'demo', uri)
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
server.listen(SERVER_PORT, function () {
  const url = 'http://localhost:' + SERVER_PORT
  console.log('### 超簡易Webサーバが起動しました')
  console.log('### script: /src/nako3server.mjs')
  console.log('[URL]', url)
  opener(url)
})

// MIMEタイプ
const MimeTypes = {
  '.html': 'text/html; charset=utf-8',
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
  return 'text/plain; charset=utf-8'
}

// ディレクトリか判定
function isDir (pathName) {
  const stats = fs.statSync(pathName, { throwIfNoEntry: false })
  if (stats && stats.isDirectory()) {
    return true
  }
  return false
}
