import http from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const rootDir = resolve(process.cwd(), '..')

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function safeJoin (baseDir, urlPath) {
  const cleanPath = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^\/+/, '')
  const filePath = resolve(baseDir, cleanPath)
  if (filePath !== baseDir && !filePath.startsWith(baseDir + '/')) {
    return null
  }
  return filePath
}

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/demo/index.html' : req.url || '/demo/index.html'
  const candidate = safeJoin(rootDir, urlPath)
  if (candidate === null) {
    res.writeHead(403)
    res.end('forbidden')
    return
  }

  let filePath = candidate
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
  }
  if (!existsSync(filePath)) {
    res.writeHead(404)
    res.end('not found')
    return
  }

  res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' })
  createReadStream(filePath).pipe(res)
})

server.listen(0, '127.0.0.1', () => {
  const address = server.address()
  if (typeof address === 'object' && address) {
    process.stdout.write(`READY:${address.port}\n`)
  }
})

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})