import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync, statSync, createReadStream } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// プロジェクトルート（test-browserの親ディレクトリ）
const rootDir = path.resolve(__dirname, '..')

/**
 * 指定URLプレフィックスを静的ディレクトリから配信するViteプラグインを作成する
 * 旧Karma環境の静的配信パスを、Playwright実行でも互換維持するために使用する
 */
function serveStaticDir (urlPrefix, dirPath) {
  const mimeMap = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.nako3': 'text/plain'
  }
  return {
    name: `serve-static-${urlPrefix.replaceAll('/', '_')}`,
    configureServer (server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(urlPrefix)) return next()
        // クエリパラメータを除去してファイルパスを取得する
        const relPath = req.url.slice(urlPrefix.length).split('?')[0]
        const filePath = path.join(dirPath, relPath)
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const ext = path.extname(filePath)
          res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream')
          res.setHeader('Cache-Control', 'no-cache')
          createReadStream(filePath).pipe(res)
          return
        }
        next()
      })
    }
  }
}

/**
 * リクエストボディをUTF-8文字列として読み込む
 */
function readRequestBody (req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk))
    })
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * multipart/form-dataの簡易パーサー
 */
function parseMultipartForm (bodyText, boundary) {
  const result = {}
  const pattern = /name="([^"]+)"\r\n\r\n([^\r\n]*)/g
  let match = pattern.exec(bodyText)
  while (match !== null) {
    result[match[1]] = match[2]
    match = pattern.exec(bodyText)
  }
  return result
}

function sendText (res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  res.statusCode = statusCode
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'no-cache')
  res.end(text)
}

function sendJson (res, statusCode, value) {
  sendText(res, statusCode, JSON.stringify(value), 'application/json; charset=utf-8')
}

export default defineConfig({
  // プロジェクトルートから静的ファイルを配信する
  root: rootDir,
  resolve: {
    alias: {
      // 旧Karma + webpack aliasと同じパス解決を再現する
      nadesiko3core: path.resolve(rootDir, 'core'),
      nako3: path.resolve(rootDir, 'src'),
      root: rootDir,
      utils: path.resolve(rootDir, 'utils')
    }
  },
  server: {
    port: 5173,
    // プロジェクトルート以下のファイルへのアクセスを許可する
    fs: {
      allow: [rootDir]
    }
  },
  plugins: [
    // /ace/* → node_modules/ace-builds/src-noconflict/*
    // bundledとace_editorテストがace.jsを /ace/ パスで参照するため
    serveStaticDir('/ace/', path.resolve(rootDir, 'node_modules/ace-builds/src-noconflict')),
    // /test/image/* → 旧ブラウザテストの期待画像
    serveStaticDir('/test/image/', path.resolve(rootDir, 'test-browser/test/browser/test/image')),
    // 旧Karma互換プロキシ: 旧テスト資産が期待するURLをPlaywright実行で再現する
    {
      name: 'karma-compat-proxies',
      configureServer (server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next()
          const requestPath = req.url.split('?')[0]

          // 旧ブラウザテストが利用する簡易API
          if (requestPath === '/custom/ok') {
            sendText(res, 200, 'OK')
            return
          }
          if (requestPath === '/custom/ok/json') {
            sendJson(res, 200, 'OK')
            return
          }
          if (requestPath === '/custom/uploadimage') {
            sendText(res, 200, 'OK')
            return
          }

          if (requestPath === '/custom/echo/json' || requestPath === '/custom/echo') {
            void (async () => {
              const bodyText = await readRequestBody(req)
              const contentType = (req.headers['content-type'] || '').toLowerCase()

              if (requestPath === '/custom/echo/json') {
                // POST送信はURLエンコード文字列、POSTフォーム送信はオブジェクトを返す
                if (contentType.includes('application/x-www-form-urlencoded')) {
                  sendJson(res, 200, bodyText)
                  return
                }
                const boundaryMatch = contentType.match(/boundary=([^;]+)/)
                if (boundaryMatch) {
                  const formObject = parseMultipartForm(bodyText, boundaryMatch[1])
                  sendJson(res, 200, formObject)
                  return
                }
                sendJson(res, 200, bodyText)
                return
              }

              if (contentType.includes('application/x-www-form-urlencoded')) {
                const params = new URLSearchParams(bodyText)
                const obj = Object.fromEntries(params.entries())
                sendJson(res, 200, obj)
                return
              }
              const boundaryMatch = contentType.match(/boundary=([^;]+)/)
              if (boundaryMatch) {
                const formObject = parseMultipartForm(bodyText, boundaryMatch[1])
                sendJson(res, 200, formObject)
                return
              }
              sendJson(res, 200, {})
            })().catch((err) => {
              sendText(res, 500, String(err))
            })
            return
          }

          if (requestPath.startsWith('/custom/delayedimage/')) {
            const imageName = requestPath.replace('/custom/delayedimage/', '')
            const imagePath = path.resolve(rootDir, 'test-browser/test/browser/test/image', imageName)
            if (existsSync(imagePath) && statSync(imagePath).isFile()) {
              setTimeout(() => {
                res.setHeader('Content-Type', 'image/png')
                res.setHeader('Cache-Control', 'no-cache')
                createReadStream(imagePath).pipe(res)
              }, 500)
              return
            }
            sendText(res, 404, 'not found')
            return
          }

          // /wnako3webworker.js → /release/wnako3webworker.js
          if (req.url === '/wnako3webworker.js' || req.url === '/wnako3webworker.js?') {
            req.url = '/release/wnako3webworker.js'
            return next()
          }
          // タートル画像のプロキシ（旧Karma設定由来の参照先を再現する）
          const imageProxies = {
            '/turtle.png': '/test-browser/test/browser/test/image/turtle_kana.png',
            '/turtle-elephant.png': '/test-browser/test/browser/test/image/elephant_kana.png',
            '/turtle-panda.png': '/test-browser/test/browser/test/image/panda_kana.png'
          }
          if (imageProxies[requestPath]) {
            req.url = imageProxies[requestPath]
          }
          next()
        })
      }
    }
  ]
})
