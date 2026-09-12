/** 簡易HTTPサーバ */
import fs from 'fs'
import http from 'http'
import path from 'path'
import os from 'os'
import { parseQueryString } from '../core/src/url_util.mjs'

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
    this.callback = (_req, _res) => {}
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
    // HTTPメソッド(GET/POST/PUT/DELETEなど)を設定
    const method = String(req.method || '').toUpperCase()
    this.sys.__setSysVar('HTTPメソッド', method)
    // 診断ログはstdoutではなくstderrへ出力する(Node.js test runner #64061 で
    // 子プロセスのstdoutがIPCメッセージ枠組みと競合する問題があるため)
    console.error(`${HTTPSERVER_LOGID} 要求あり METHOD=${method} URL=` + req.url)
    const params = this.parseURL(req.url)
    const url = params['?URL']
    this.sys.__setSysVar('GETデータ', params)

    const runDispatcher = (postData: any) => {
      try {
        this.sys.__setSysVar('POSTデータ', postData)
        // URLの一致を調べてアクションを実行
        const filtered = this.items.filter(v => url.startsWith(v.url)).sort((a, b) => { return b.url.length - a.url.length })
        let matched = false
        for (const it of filtered) {
          let isBreak = false
          if (it.action === 'static') {
            isBreak = this.doRequestStatic(req, res, it)
          } else if (it.action === 'callback') {
            isBreak = this.doRequestCallback(req, res, it)
          }
          if (isBreak) {
            matched = true
            break
          }
        }
        if (!matched) {
          this.return404(res)
        }
      } catch (err: any) {
        // ここで捕まえないとサーバのプロセスごと落ちてしまう
        this.returnError(res, err)
      }
    }

    if (method === 'POST') {
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
            } catch {
              postData = bodyStr
            }
          } else if (contentType.indexOf('application/x-www-form-urlencoded') >= 0) {
            const bodyStr = bodyBuffer.toString('utf-8')
            postData = parseQueryString(bodyStr)
          } else {
            postData = bodyBuffer.toString('utf-8')
          }
        } catch (err: any) {
          console.error(`${HTTPSERVER_LOGID} アップロード保存エラー: ${err.message}`)
          res.statusCode = 500
          res.end('Failed to save upload file.')
          return
        }
        try {
          this.sys.__setSysVar('FILESデータ', filesData)
        } catch (err: any) {
          this.returnError(res, err)
          return
        }
        runDispatcher(postData)
      })
    } else {
      this.sys.__setSysVar('FILESデータ', [])
      runDispatcher({})
    }
  }

  /** リクエスト処理中に発生した例外を500として返す。
   * 非同期のイベントハンドラ内で例外を投げるとプロセスごと停止してしまうため、必ずここで捕まえる。 */
  returnError(res: any, err: any) {
    const msg = (err && err.message) ? err.message : String(err)
    console.error(`${HTTPSERVER_LOGID} 実行エラー: ${msg}`)
    try {
      if (!res.writableEnded) {
        res.statusCode = 500
        res.end('Internal Server Error.')
      }
    } catch {
      // 応答済みなどで書き込めない場合は何もしない
    }
  }

  return404(res: any) {
    console.error(HTTPSERVER_LOGID, 404, '見当たりません。')
    try {
      if (!res.writableEnded) {
        res.statusCode = 404
        res.end('<html><meta charset="utf-8"><body><h1>404 見当たりません。</h1></body></html>')
      }
    } catch {
      // 応答済みなどで書き込めない場合は何もしない
    }
  }

  doRequestStatic(req: any, res: any, it: EasyURLItem): boolean {
    const params = this.parseURL(req.url)
    const rawUrl = params['?URL'] || ''
    let url: string = ('' + rawUrl).replace(/\.\./g, '') // URLの..を許可しない
    url = url.substring(it.url.length)
    let fpath = path.join(it.path, url)
    console.error(`${HTTPSERVER_LOGID} FILE=${fpath}`)
    if (!fs.existsSync(fpath)) {
      this.return404(res)
      return true
    }
    // ディレクトリなら index.html を確認
    if (isDir(fpath)) {
      fpath = path.join(fpath, 'index.html')
      console.error(`${HTTPSERVER_LOGID} FILE(DIR)=${fpath}`)
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
    const ret: any = it.callback(req, res)
    // コールバックが非同期関数だった場合、拒否をここで捕まえる
    if (ret && typeof ret.then === 'function') {
      ret.then(undefined, (err: any) => { this.returnError(res, err) })
    }
    if (!this.isEnd) {
      return true
    }
    return true
  }

  addItem(it: EasyURLItem) {
    this.items.push(it)
  }

  parseURL(uri: string): { [key: string]: string } {
    // #以降はフラグメントとして扱うため、#より前に?がある場合のみクエリとして解析する
    const hashIdx = uri.indexOf('#')
    const base = hashIdx >= 0 ? uri.substring(0, hashIdx) : uri
    const qi = base.indexOf('?')
    const rawPath = qi >= 0 ? base.substring(0, qi) : base
    const query = qi >= 0 ? base.substring(qi + 1) : ''
    const params = parseQueryString(query)
    // ?URL はクエリパラメータで上書きされないよう最後に設定する
    params['?URL'] = rawPath
    return params
  }
}
/** Content-Disposition ヘッダ値を解析してパラメータ辞書を返す。
 * `form-data; name="upload"; filename="photo.txt"` のような形式を、
 * `;`区切りで `キー=値` 形式として取り出す。値がダブルクォート付きの場合は
 * quoted-string として解析し、値中の `;`・`=`・エスケープ(`\"`, `\\`)も処理する。
 * キーは大文字小文字を区別しない。`=` 前後の Optional Whitespace は許容する。
 * パラメータの順序に依存せず `name` と `filename` を正しく分離するためのヘルパー。(#2494)
 */
// RFC 7230 の separators を使用。ただし `'` は tchar であると同時に
// RFC 5987 の `charset'language'value` 区切りにも使うため区切り文字として扱わない。
const CD_SEPARATORS = '()<>@,;:\\"/[]?={} \t'

// Content-Disposition のキーとして有効な RFC 7230 token 文字
const CD_KEY_RE = /^[0-9a-zA-Z!#$%&'*+.^_`|~-]+$/

/** Content-Disposition の `キー=値` の値部分を解析して返す。
 * start には `=` 後の Optional Whitespace をスキップした位置を渡すこと。
 */
function parseCDValue(headerValue: string, start: number): { value: string, next: number } {
  let i = start
  let val = ''
  if (i < headerValue.length && headerValue[i] === '"') {
    i++ // opening DQUOTE
    while (i < headerValue.length) {
      if (headerValue[i] === '\\') {
        if (i + 1 < headerValue.length) {
          // RFC 2616 / RFC 7230 の quoted-pair では \ に続く1文字がエスケープされる。
          // 追加するのは HTAB/SP/VCHAR(0x21-0x7E)/obs-text のみに制限する
          const nc = headerValue.charCodeAt(i + 1)
          if (nc === 0x09 || (nc >= 0x20 && nc <= 0x7e) || nc >= 0x80) {
            val += headerValue[i + 1]
          }
          i += 2
          continue
        }
        // quoted-pair を形成しない末尾の `\` は無視して終了する
        i++
        break
      }
      if (headerValue[i] === '"') {
        i++ // closing DQUOTE
        break
      }
      // quoted-string内の制御文字(HTABとSP以外)はスキップする。
      // なお `"` は閉じクォートとして扱われるため値には含まれない
      const c = headerValue.charCodeAt(i)
      if (c === 0x09 || (c >= 0x20 && c <= 0x7e) || c >= 0x80) {
        val += headerValue[i]
      }
      i++
    }
  } else {
    // 非引用値はRFC 7230のtoken。区切り文字・空白・制御文字(0x00-0x1F, 0x7F)・非ASCIIで停止する。
    // そのため非引用の非ASCII値(例: filename=画像.txt)は空になり、実ブラウザは非引用値を送らないため実害はない
    const valStart = i
    while (i < headerValue.length && CD_SEPARATORS.indexOf(headerValue[i]) < 0 &&
           headerValue.charCodeAt(i) >= 0x21 && headerValue.charCodeAt(i) <= 0x7e) { i++ }
    val = headerValue.substring(valStart, i)
  }
  return { value: val, next: i }
}

function parseContentDisposition(headerValue: string): { [key: string]: string } {
  // obs-fold (CRLF 1*(SP/HTAB)) を単一 SP に正規化してから解析する
  const normalized = headerValue.replace(/\r\n[ \t]+/g, ' ')
  // Object.create(null)により __proto__ 等のキーでもプロトタイプ汚染せず、自前プロパティとして扱える
  const params: { [key: string]: string } = Object.create(null)
  let i = 0

  // 先頭の disposition-type (form-data/inline/attachment 等) を token として読み、
  // その後の OWS と `;` を正しくスキップする。
  // `name="foo"` のように type がない場合(= が先に現れる場合)はスキップせず
  // その位置からパラメータ解析を始める
  let j = 0
  while (j < normalized.length && CD_SEPARATORS.indexOf(normalized[j]) < 0 &&
         normalized.charCodeAt(j) >= 0x21 && normalized.charCodeAt(j) <= 0x7e) { j++ }
  while (j < normalized.length && (normalized[j] === ' ' || normalized[j] === '\t')) { j++ }
  if (j < normalized.length && normalized[j] === ';') {
    i = j + 1
  } else if (j < normalized.length && normalized[j] === '=') {
    // type がなく最初のパラメータから始まる
    i = 0
  } else {
    // disposition-type の後に ; も = もない場合は、その位置からパラメータ解析を再開する
    i = j
  }

  while (i < normalized.length) {
    // セパレータと空白をスキップ
    while (i < normalized.length && (normalized[i] === ';' || normalized[i] === ' ' || normalized[i] === '\t')) { i++ }
    if (i >= normalized.length) { break }

    const iterStart = i
    // キー
    const keyStart = i
    while (i < normalized.length && CD_SEPARATORS.indexOf(normalized[i]) < 0 &&
           normalized.charCodeAt(i) >= 0x21 && normalized.charCodeAt(i) <= 0x7e) { i++ }
    const key = normalized.substring(keyStart, i).toLowerCase()
    // = 前の Optional Whitespace をスキップする
    while (i < normalized.length && (normalized[i] === ' ' || normalized[i] === '\t')) { i++ }
    if (i >= normalized.length || normalized[i] !== '=') {
      // 不正な断片で i が進まないと無限ループになるため、最低1文字進める
      if (i <= iterStart) { i++ }
      continue
    }
    i++ // '='

    // 値(先頭の空白をスキップ)
    while (i < normalized.length && (normalized[i] === ' ' || normalized[i] === '\t')) { i++ }
    const parsed = parseCDValue(normalized, i)
    i = parsed.next
    if (i <= iterStart) { i++ }

    // RFC 7230 の token 文字のみをキーとして有効にする(空キーや不正な文字は無視)
    if (!CD_KEY_RE.test(key)) { continue }
    // 重複するキーは最後の値で上書きする(後勝ち)
    params[key] = parsed.value
  }

  return params
}
/** RFC 5987 形式(`UTF-8''%E3%81%82...`)の値をデコードして返す。
 * 対応しているのは UTF-8 のみ。UTF-8以外の文字セットや不正な値の場合は null を返す。
 * デコード結果から制御文字(0x00-0x1F, 0x7F)を除去する。(#2494)
 */
function decodeRFC5987(value: string): string | null {
  const m = value.match(/^([^']*)'([^']*)'(.*)$/)
  if (!m) { return null }
  const charset = m[1].toLowerCase()
  if (charset !== 'utf-8') { return null }
  try {
    // eslint-disable-next-line no-control-regex -- デコード後の制御文字を除去するため
    return decodeURIComponent(m[3]).replace(/[\x00-\x1f\x7f]+/g, '')
  } catch {
    return null
  }
}
/** 辞書にキーを安全に設定する。
 * __proto__等のprototype由来のキーでObject.prototypeを汚染しないようdefinePropertyを使う。
 * 対象はなでしこ3へ渡す辞書(POSTデータ等)のためObject.create(null)は使わない:
 * なでしこ3の辞書操作が instanceof Object を前提にしている。内部限りの params 等は
 * Object.create(null)を使う(parseContentDisposition参照)。(#2494)
 */
function setDictValue(obj: any, key: string, value: any) {
  Object.defineProperty(obj, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true
  })
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
    const headers: any = Object.create(null)
    // MIMEパートヘッダの obs-fold (CRLF 1*(SP/HTAB)) を単一SPに戻してから行分割する
    const unfolded = headerStr.replace(/\r\n[ \t]+/g, ' ').replace(/\n[ \t]+/g, ' ')
    const lines = unfolded.split(/\r?\n/)
    for (const line of lines) {
      const idx = line.indexOf(':')
      if (idx !== -1) {
        const key = line.substring(0, idx).trim().toLowerCase()
        const val = line.substring(idx + 1).trim()
        headers[key] = val
      }
    }

    const contentDisposition = headers['content-disposition'] || ''
    const cdParams = parseContentDisposition(contentDisposition)
    // name* (RFC 5987) があれば優先してUTF-8デコードし、なければ name を使う。
    // quoted-string の先頭・末尾空白は値の一部なので trim しない
    let name: string | undefined
    if (cdParams['name*'] !== undefined) {
      const decoded = decodeRFC5987(cdParams['name*'])
      name = decoded !== null ? decoded : cdParams['name']
    } else {
      name = cdParams['name']
    }
    if (name !== undefined) {
      // eslint-disable-next-line no-control-regex -- fieldNameから制御文字を除去するため
      name = name.replace(/[\x00-\x1f\x7f]+/g, '')
    }
    // filename* (RFC 5987) があれば優先してUTF-8デコードする。
    // デコードできない場合は filename にフォールバックし、それもなければ空文字にする
    let filename: string
    if (cdParams['filename*'] !== undefined) {
      const decoded = decodeRFC5987(cdParams['filename*'])
      // RFC 5987として解析できたが空のときは filename へフォールバックする
      filename = (decoded !== null && decoded !== '') ? decoded : (cdParams['filename'] ?? '')
    } else {
      filename = cdParams['filename'] ?? ''
    }
    // eslint-disable-next-line no-control-regex -- 表示名から制御文字を除去するため
    filename = filename.replace(/[\x00-\x1f\x7f]+/g, '')
    // 空の filename はファイル扱いにしない(不要な一時ファイルを作らない)
    const hasFilename = filename !== ''

    if (name !== undefined) {
      if (hasFilename) {
        // 保存ファイル名は、OS非依存で / と \ の両方を区切りと見なした basename に限定する。
        // さらに Windows 禁止文字( : * ? " < > | )と制御文字を除去する(/ と \ は basename 化で消える)。
        // シェルメタ文字は fs.promises.writeFile に直接渡すため除去しない(ファイル名中の記号を可能な限り保持する)。(#2494)
        const baseName = filename.replace(/\\/g, '/').split('/').pop() || ''
        let safeFilename = baseName.replace(/[:*?"<>|]+/g, '_')
        // eslint-disable-next-line no-control-regex -- ファイル名から制御文字を除去するため
        safeFilename = safeFilename.replace(/[\x00-\x1f\x7f]+/g, '')
        // 先頭の空白と末尾の空白・ドットを除去する(先頭のドットは後続の判定で無効化する)
        safeFilename = safeFilename.replace(/^\s+/, '').replace(/[\s.]+$/, '')
        // ENAMETOOLONGを避けるためUTF-8で200バイトに制限する。拡張子は残して本体側を詰める
        if (Buffer.byteLength(safeFilename, 'utf8') > 200) {
          // ENAMETOOLONGを避けるため拡張子は残し、本体側をUTF-8で200バイト以内に詰める
          const dotIdx = safeFilename.lastIndexOf('.')
          const hasExt = dotIdx > 0
          const ext = hasExt ? safeFilename.substring(dotIdx) : ''
          const stem = hasExt ? safeFilename.substring(0, dotIdx) : safeFilename
          const maxStemBytes = 200 - Buffer.byteLength(ext, 'utf8')
          if (maxStemBytes > 0) {
            let newStem = Buffer.from(stem, 'utf8').subarray(0, maxStemBytes).toString('utf8')
            newStem = newStem.replace(/\uFFFD+$/, '')
            safeFilename = newStem + ext
          } else {
            // 拡張子だけで200バイトを超える場合は拡張子も含めて切り詰める
            safeFilename = Buffer.from(safeFilename, 'utf8').subarray(0, 200).toString('utf8')
            safeFilename = safeFilename.replace(/\uFFFD+$/, '')
          }
          // 切り詰めで末尾に空白・ドットが残る場合に備えて再除去する
          safeFilename = safeFilename.replace(/[\s.]+$/, '')
        }
        // 空のときだけプレースホルダにする。ドット始まり(.gitignore等)は
        // uniqueName の接頭辞があるため '.' / '..' にはならないのでそのまま残す
        if (safeFilename === '') {
          safeFilename = '_'
        }
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
        // nameが空の場合はフィールド登録しない
        if (name !== '') {
          setDictValue(fields, name, partBody.toString('utf-8'))
        } else {
          // eslint-disable-next-line no-control-regex -- ログを壊さないよう制御文字を除去してから200文字に切り詰める
          const cdLog = contentDisposition.replace(/[\x00-\x1f\x7f]+/g, '').substring(0, 200)
          console.warn(`${HTTPSERVER_LOGID} Content-Disposition の name が空のためパートを無視しました: ${cdLog}`)
        }
      }
    } else {
      // name を解決できないパート(name が無い、name* デコード失敗等)は無視するが、利用者に分かるよう警告する
      // eslint-disable-next-line no-control-regex -- ログを壊さないよう制御文字を除去してから200文字に切り詰める
      const cdLog = contentDisposition.replace(/[\x00-\x1f\x7f]+/g, '').substring(0, 200)
      console.warn(`${HTTPSERVER_LOGID} Content-Disposition に name を解決できないパートを無視しました: ${cdLog}`)
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
  } catch {
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
  'HTTPメソッド': { type: 'const', value: '' }, // @HTTPめそっど
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
        try {
          dp.doRequest(req, res)
        } catch (err: any) {
          // ここで捕まえないとサーバのプロセスごと落ちてしまう
          dp.returnError(res, err)
        }
      })
      dp.server.on('error', (err: any) => {
        console.error(`${HTTPSERVER_LOGID} エラー: ${err.message}`)
      })
      // サーバ起動
      dp.server.listen(port, () => {
        console.error(`${HTTPSERVER_LOGID} ポート番号(${port})で監視開始`)
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
      console.error(`${HTTPSERVER_LOGID} 移動=${url}`)
      dp.curRes.writeHead(302, { 'Location': url })
      dp.curRes.end(`<html><body><a href="${url}">JUMP</a></body></html>`)
      dp.isEnd = true
    }
  }
}

export default PluginHttpServer
