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
    // /mocha/* → node_modules/mocha/*
    // HTMLランナーがmocha.js/mocha.cssを /mocha/ パスで参照するため
    serveStaticDir('/mocha/', path.resolve(rootDir, 'node_modules/mocha')),
    // 旧Karma互換プロキシ: 旧テスト資産が期待するURLをPlaywright実行で再現する
    {
      name: 'karma-compat-proxies',
      configureServer (server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next()
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
          const imagePath = req.url.split('?')[0]
          if (imageProxies[imagePath]) {
            req.url = imageProxies[imagePath]
          }
          next()
        })
      }
    }
  ]
})
