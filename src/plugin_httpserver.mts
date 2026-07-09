/** 簡易HTTPサーバ */
import fs from 'fs'
import http from 'http'
import path from 'path'
import os from 'os'

// 定数
const HTTPSERVER_LOGID = '[簡易HTTPサーバ]'
const ERR_NOHTTPSERVER = '最初に『簡易HTTPサーバ起動時』を実行してサーバを起動する必要があります。'
const MAX_BODY_SIZE_POST = 10 * 1024 * 1024 // 10MB
      
// オブジェクト
type EasyURLActionType = 'static' | 'callback'
type EasyURLCallback = (req: any, res: any) => void
type EasyHTTPOnStart = (sys: any) => void

class EasyURLItem {
  url: string
  action: EasyURLActionType
  path: string
  callback: EasyURLCallback
  constructor(action: EasyURLActionType) {
    this.action = action
    this.url = ''
    this.path = ''
    this.callback = (req, res) => {}
  }
}
class EasyURLDispather {
  server: any
  sys: any
  items: EasyURLItem[]
  curReq: any
  curRes: any
  isEnd: boolean
  usedHeader: boolean

  constructor(sys: any) {
    this.server = null
    this.items = []
    this.sys = sys
    this.curReq = null
    this.curRes = null
    this.isEnd = false
    this.usedHeader = false
  }

  doRequest(req: any, res: any) {
    this.curReq = req
    this.curRes = res
    console.log(`${HTTPSERVER_LOGID} 要求あり URL=` + req.url)
    const params = this.parseURL(req.url)
    const url = params['?URL']
    this.sys.__setSysVar('GETデータ', params)

    const runDispatcher = (postData: any) => {
      this.sys.__setSysVar('POSTデータ', postData)
      // URLの一致を調べてアクションを実行
      const filtered = this.items.filter(v => url.startsWith(v.url)).sort((a, b) => { return b.url.length - a.url.length })
      for (const it of filtered) {
        let isBreak = false
        if (it.action === 'static') {
          isBreak = this.doRequestStatic(req, res, it)
        } else if (it.action === 'callback') {
          isBreak = this.doRequestCallback(req, res, it)
        }
        if (isBreak) { break }
      }
    }

    if (req.method === 'POST') {
      let bodySize = 0
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => {
        bodySize += chunk.length
        if (bodySize > MAX_BODY_SIZE_POST) {
          res.statusCode = 413
          res.end('Request entity too large.')
          req.destroy()
          return
        }
        chunks.push(chunk)
      })
      req.on('end', async() => {
        const bodyBuffer = Buffer.concat(chunks)
        let postData: any = {}
        let filesData: any[] = []
        const contentType = req.headers['content-type'] || ''
        try {
          if (contentType.indexOf('multipart/form-data') >= 0) {
            const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)
            if (boundaryMatch) {
              const boundary = (boundaryMatch[1] || boundaryMatch[2] || '').trim()
              const parsed = await parseMultipart(bodyBuffer, boundary)
              postData = parsed.fields
              filesData = parsed.files
            }
          } else if (contentType.indexOf('application/json') >= 0) {
            const bodyStr = bodyBuffer.toString('utf-8')
            try {
              postData = JSON.parse(bodyStr)
            } catch (e) {
              postData = bodyStr
            }
          } else if (contentType.indexOf('application/x-www-form-urlencoded') >= 0) {
            const bodyStr = bodyBuffer.toString('utf-8')
            const searchParams = new URLSearchParams(bodyStr)
            const obj: any = {}
            for (const [key, val] of searchParams.entries()) {
              obj[key] = val
            }
            postData = obj
          } else {
            postData = bodyBuffer.toString('utf-8')
          }
        } catch (err: any) {
          console.error(`${HTTPSERVER_LOGID} アップロード保存エラー: ${err.message}`)
          res.statusCode = 500
          res.end('Failed to save upload file.')
          return
        }
        this.sys.__setSysVar('FILESデータ', filesData)
        runDispatcher(postData)
      })
    } else {
      this.sys.__setSysVar('FILESデータ', [])
      runDispatcher({})
    }
  }

  return404(res: any) {
    console.error(HTTPSERVER_LOGID, 404, '見当たりません。')
    res.statusCode = 404
    res.end('<html><meta charset="utf-8"><body><h1>404 見当たりません。</h1></body></html>')
  }

  doRequestStatic(req: any, res: any, it: EasyURLItem): boolean {
    const params = this.parseURL(req.url)
    const rawUrl = params['?URL'] || ''
    let url: string = ('' + rawUrl).replace(/\.\./g, '') // URLの..を許可しない
    url = url.substring(it.url.length)
    let fpath = path.join(it.path, url)
    console.log('FILE=', fpath)
    if (!fs.existsSync(fpath)) {
      this.return404(res)
      return true
    }
    // ディレクトリなら index.html を確認
    if (isDir(fpath)) {
      fpath = path.join(fpath, 'index.html')
      console.log('FILE(DIR)=', fpath)
      if (!fs.existsSync(fpath)) {
        this.return404(res)
        return true
      }
    }
    // ファイルを読んで返す
    fs.readFile(fpath, (err, data) => {
      if (err) {
        res.statusCode = 500
        res.end('Failed to read file.')
        console.warn(HTTPSERVER_LOGID, 'read error file=', fpath)
        return true
      }
      const mime = getMIMEType(fpath)
      res.writeHead(200, { 'Content-Type': mime })
      res.end(data)
      return true
    })
    return true
  }

  doRequestCallback(req: any, res: any, it: EasyURLItem): boolean {
    this.isEnd = false
    this.usedHeader = false
    it.callback(req, res)
    if (!this.isEnd) {
      return true
    }
    return true
  }

  addItem(it: EasyURLItem) {
    this.items.push(it)
  }

  parseURL(uri: string): any {
    const params: any = {}
    if (uri.indexOf('?') >= 0) {
      const a = uri.split('?')
      params['?URL'] = a[0]
      const q = String(a[1]).split('&')
      for (const kv of q) {
        const qq = kv.split('=')
        const key = decodeURIComponent(qq[0])
        const val = decodeURIComponent(qq[1])
        params[key] = val
      }
    } else {
      params['?URL'] = uri
    }
    return params
  }
}
async function parseMultipart(body: Buffer, boundary: string): Promise<{ files: any[], fields: any }> {
  const fields: any = {}
  const files: any[] = []

  const boundaryBuffer = Buffer.from('--' + boundary)
  let pos = 0
  const parts: Buffer[] = []

  while (true) {
    const nextIdx = body.indexOf(boundaryBuffer, pos)
    if (nextIdx === -1) { break }
    if (pos > 0) {
      let endPos = nextIdx
      if (body[nextIdx - 2] === 13 && body[nextIdx - 1] === 10) {
        endPos -= 2
      } else if (body[nextIdx - 1] === 10) {
        endPos -= 1
      }
      parts.push(body.subarray(pos, endPos))
    }
    pos = nextIdx + boundaryBuffer.length
  }

  for (const part of parts) {
    if (part.length === 0) { continue }
    let start = 0
    if (part[0] === 13 && part[1] === 10) { start = 2 }
    else if (part[0] === 10) { start = 1 }

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'), start)
    let bodyStart = 0
    let headerStr = ''
    if (headerEnd !== -1) {
      headerStr = part.toString('utf-8', start, headerEnd)
      bodyStart = headerEnd + 4
    } else {
      const headerEndLf = part.indexOf(Buffer.from('\n\n'), start)
      if (headerEndLf !== -1) {
        headerStr = part.toString('utf-8', start, headerEndLf)
        bodyStart = headerEndLf + 2
      }
    }

    if (bodyStart === 0) { continue }

    const partBody = part.subarray(bodyStart)
    const headers: any = {}
    const lines = headerStr.split(/\r?\n/)
    for (const line of lines) {
      const idx = line.indexOf(':')
      if (idx !== -1) {
        const key = line.substring(0, idx).trim().toLowerCase()
        const val = line.substring(idx + 1).trim()
        headers[key] = val
      }
    }

    const contentDisposition = headers['content-disposition'] || ''
    const nameMatch = contentDisposition.match(/name="([^"]+)"/)
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)

    if (nameMatch) {
      const name = nameMatch[1]
      if (filenameMatch) {
        const filename = filenameMatch[1]
        const safeFilename = path.basename(filename).replace(/[\\/]/g, '_')
        const contentType = headers['content-type'] || 'application/octet-stream'

        const uploadDir = path.join(os.tmpdir(), 'nako3-plugin_httpserver_upload')
        if (!fs.existsSync(uploadDir)) {
          await fs.promises.mkdir(uploadDir, { recursive: true })
        }
        const uniqueName = Date.now() + '_' + Math.random().toString(36).substring(2, 8) + '_' + safeFilename
        const filepath = path.join(uploadDir, uniqueName)
        await fs.promises.writeFile(filepath, partBody)

        files.push({
          fieldName: name,
          name: filename,
          path: filepath,
          size: partBody.length,
          type: contentType
        })
      } else {
        fields[name] = partBody.toString('utf-8')
      }
    }
  }

  return { files, fields }
}
// MIMEタイプ
const MimeTypes: any = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.nako3': 'text/nadesiko3',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'svg+xml'
}
function getMIMEType(url: string) {
  let ext = '.txt'
  const m = url.match(/(\.[a-z0-9_]+)$/)
  if (m) { ext = m[1] }
  if (MimeTypes[ext]) { return MimeTypes[ext] }
  return 'text/plain'
}
// ディレクトリか判定
function isDir(pathName: string) {
  try {
    // node v12以下ではエラーがあると例外を返す
    const stats = fs.statSync(pathName)
    if (stats && stats.isDirectory()) {
      return true
    }
  } catch (err: any) {
    return false
  }
}

const PluginHttpServer = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_httpserver', // プラグインの名前
      description: 'HTTPサーバプラグイン', // プラグインの説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['cnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: any) {
      sys.__httpserver = null
    }
  },
  // @簡易HTTPサーバ
  'GETデータ': { type: 'const', value: '' }, // @GETでーた
  'POSTデータ': { type: 'const', value: '' }, // @POSTでーた
  'FILESデータ': { type: 'const', value: '' }, // @FILESでーた
  '簡易HTTPサーバ起動時': { // @ポート番号PORTを指定して簡易HTTPサーバを起動して、CALLBACKを実行する。 // @かんいHTTPさーばきどうしたとき
    type: 'func',
    josi: [['を'], ['の', 'で']],
    pure: true,
    fn: function(callback: EasyHTTPOnStart, port: number, sys: any) {
      // 管理オブジェクトを作成する
      const dp = sys.__httpserver = new EasyURLDispather(sys)
      // サーバオブジェクトを生成
      dp.server = http.createServer((req: any, res: any) => {
        dp.doRequest(req, res)
      })
      dp.server.on('error', (err: any) => {
        console.error(`${HTTPSERVER_LOGID} エラー: ${err.message}`)
      })
      // サーバ起動
      dp.server.listen(port, () => {
        console.log(`${HTTPSERVER_LOGID} ポート番号(${port})で監視開始`)
        if (typeof callback === 'string') { callback = sys.__findFunc(callback) }
        callback(sys)
      })
    }
  },
  '簡易HTTPサーバ静的パス指定': { // @静的コンテンツのパスを指定。URLをPATHへマップする。 // @かんいHTTPさーばせいてきぱすしてい
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    pure: true,
    fn: function(url: string, path: string, sys: any) {
      if (sys.__httpserver === null) {
        throw new Error(ERR_NOHTTPSERVER)
      }
      const dp: EasyURLDispather = sys.__httpserver
      const it: EasyURLItem = new EasyURLItem('static')
      it.url = url
      it.path = path
      dp.addItem(it)
    }
  },
  '簡易HTTPサーバ受信時': { // @URLを指定して合致するリクエストが来たら処理を実行する。 // @かんいHTTPさーばじゅしんしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ', 'で']],
    pure: true,
    fn: function(callback: EasyURLCallback, url: string, sys: any) {
      if (sys.__httpserver === null) {
        throw new Error(ERR_NOHTTPSERVER)
      }
      const dp: EasyURLDispather = sys.__httpserver
      const it: EasyURLItem = new EasyURLItem('callback')
      if (url === '') { url = '/' }
      if (url.charAt(0) !== '/') { url = '/' + url }
      it.url = url
      if (typeof callback === 'string') { callback = sys.__findFunc(callback) }
      it.callback = callback
      dp.addItem(it)
    }
  },
  '簡易HTTPサーバ出力': { // @受信時に、データSを出力する。 // @かんいHTTPさーばしゅつりょく
    type: 'func',
    josi: [['を', 'と', 'の']],
    pure: true,
    fn: function(s: string, sys: any) {
      if (sys.__httpserver === null) {
        throw new Error(ERR_NOHTTPSERVER)
      }
      const dp: EasyURLDispather = sys.__httpserver
      if (dp.curRes === null) {
        throw new Error('『簡易HTTPサーバ受信時』のみ出力が可能です。')
      }
      if (!dp.usedHeader) {
        dp.usedHeader = true
        dp.curRes.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      }
      dp.curRes.end(s)
      dp.isEnd = true
    }
  },
  '簡易HTTPサーバヘッダ出力': { // @受信時にステータスコードNOで、ヘッダHEAD(辞書形式)を出力する。 // @かんいHTTPさーばへっだしゅつりょく
    type: 'func',
    josi: [['で'], ['を', 'の', 'と']],
    pure: true,
    fn: function(no: number, head: string, sys: any) {
      if (sys.__httpserver === null) {
        throw new Error(ERR_NOHTTPSERVER)
      }
      const dp: EasyURLDispather = sys.__httpserver
      if (dp.curRes === null) {
        throw new Error('『簡易HTTPサーバ受信時』のみ出力が可能です。')
      }
      dp.curRes.writeHead(no, head)
      dp.isEnd = true
      dp.usedHeader = true
    }
  },
  '簡易HTTPサーバ移動': { // @受信時にヘッダ302(リダイレクト)を出力してURLへページを移動力する。 // @かんいHTTPさーばいどう
    type: 'func',
    josi: [['へ', 'に']],
    pure: true,
    fn: function(url: string, sys: any) {
      if (sys.__httpserver === null) {
        throw new Error(ERR_NOHTTPSERVER)
      }
      const dp: EasyURLDispather = sys.__httpserver
      if (dp.curRes === null) {
        throw new Error('『簡易HTTPサーバ受信時』のみ出力が可能です。')
      }
      console.log(HTTPSERVER_LOGID, '移動=', url)
      dp.curRes.writeHead(302, { 'Location': url })
      dp.curRes.end(`<html><body><a href="${url}">JUMP</a></body></html>`)
      dp.isEnd = true
    }
  }
}

export default PluginHttpServer
