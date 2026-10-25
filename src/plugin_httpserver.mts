/** 簡易HTTPサーバ */
import fs from 'fs'
import http from 'http'
import path from 'path'
import os from 'os'
import { AsyncLocalStorage } from 'async_hooks'
import { parseQueryString } from '../core/src/url_util.mjs'

// 定数
const HTTPSERVER_LOGID = '[簡易HTTPサーバ]'
const ERR_NOHTTPSERVER = '最初に『簡易HTTPサーバ起動時』を実行してサーバを起動する必要があります。'
const MAX_BODY_SIZE_POST = 10 * 1024 * 1024 // 10MB
// RFC 2046 の boundary 文法: 0*69<bchars> bcharsnospace
// bcharsnospace = DIGIT / ALPHA / "'" / "(" / ")" / "+" / "_" / "," / "-" / "." / "/" / ":" / "=" / "?"
// bchars は bcharsnospace に空白を加えたもので、末尾1文字は空白以外(bcharsnospace)でなければならない
const MULTIPART_BOUNDARY_RE = /^[0-9A-Za-z'()+_,\-./:=? ]{0,69}[0-9A-Za-z'()+_,\-./:=?]$/

/** 1リクエスト分の出力・状態 (並列リクエストで共有しない) */
type HttpReqCtx = {
  req: any
  res: any
  isEnd: boolean
  usedHeader: boolean
  method: string
  getData: any
  postData: any
  filesData: any
}
const httpReqStore = new AsyncLocalStorage<HttpReqCtx>()

/** リクエストごとに分離するシステム変数名 */
const REQ_SCOPED_VARS = new Set(['HTTPメソッド', 'GETデータ', 'POSTデータ', 'FILESデータ'])

/** ラッパーを適用済みの Map (sys ではなく Map 自体をキーにして二重ラップを防ぐ) */
const reqScopedPatchedMaps = new WeakSet<object>()

function getHttpReqCtx (): HttpReqCtx {
  const ctx = httpReqStore.getStore()
  if (!ctx || !ctx.res) {
    throw new Error('『簡易HTTPサーバ受信時』のみ出力が可能です。')
  }
  return ctx
}

/**
 * __v0 / __varslist[0] の get/set/has/delete を ALS 経由にする。
 * 生成コードは __v0.get('GETデータ') を使うため、__setSysVar だけでは
 * 非同期交差時に共有 Map が混ざる。
 * パッチ不能時は throw（fail-closed）。REQ_SCOPED_VARS は ALS 外で共有 Map に落とさない。
 * 適用済み判定は Map 自体をキーにする (複数の sys が同じ Map を共有しても
 * 二重ラップにならず、Map が差し替わった場合は新しい Map に適用できる)。
 * なお clear やイテレーション等のその他の Map 操作は対象外とする
 * (生成コードはリクエスト変数の読み書きに get/set しか使わない)。
 */
function installReqScopedVarMap (sys: any): void {
  const v0: Map<string, any> | undefined = sys.__varslist?.[0] ?? sys.__v0
  if (!v0 || typeof v0.get !== 'function' || typeof v0.set !== 'function') {
    throw new Error('簡易HTTPサーバ: リクエスト変数の分離を初期化できません。')
  }
  if (reqScopedPatchedMaps.has(v0)) {
    sys.__httpserverReqScopedInstalled = true
    return
  }
  const origGet = v0.get.bind(v0)
  const origSet = v0.set.bind(v0)
  const origHas = v0.has.bind(v0)
  const origDelete = v0.delete.bind(v0)
  // 復元用に、適用前の自前プロパティの descriptor を記録しておく
  // (通常の Map には無いが、既に自前プロパティがある場合はそれを正確に戻すため)
  const ownDescriptors: { [key: string]: PropertyDescriptor | undefined } = {}
  for (const name of ['get', 'set', 'has', 'delete']) {
    ownDescriptors[name] = Object.getOwnPropertyDescriptor(v0, name)
  }
  const restoreProp = (name: string) => {
    const desc = ownDescriptors[name]
    try {
      if (desc) {
        Object.defineProperty(v0, name, desc)
      } else {
        delete (v0 as any)[name]
      }
    } catch { /* 復元不能でもフラグは立てない */ }
  }
  const emptyFor = (key: string): any => {
    switch (key) {
      case 'HTTPメソッド': return ''
      case 'GETデータ': return {}
      case 'POSTデータ': return {}
      case 'FILESデータ': return []
      default: return undefined
    }
  }
  const wrappedGet = (key: any) => {
    const k = String(key)
    if (REQ_SCOPED_VARS.has(k)) {
      const ctx = httpReqStore.getStore()
      if (!ctx) {
        // ALS 外: 共有 Map を読まず空を返す（他リクエスト値の漏洩防止）
        return emptyFor(k)
      }
      switch (k) {
        case 'HTTPメソッド': return ctx.method
        case 'GETデータ': return ctx.getData
        case 'POSTデータ': return ctx.postData
        case 'FILESデータ': return ctx.filesData
      }
    }
    return origGet(key)
  }
  const wrappedSet = (key: any, value: any) => {
    const k = String(key)
    if (REQ_SCOPED_VARS.has(k)) {
      const ctx = httpReqStore.getStore()
      if (!ctx) {
        // ALS 外: 共有 Map に書かない（fail-closed）
        return v0
      }
      switch (k) {
        case 'HTTPメソッド': ctx.method = value; break
        case 'GETデータ': ctx.getData = value; break
        case 'POSTデータ': ctx.postData = value; break
        case 'FILESデータ': ctx.filesData = value; break
      }
      return v0
    }
    return origSet(key, value)
  }
  const wrappedHas = (key: any) => {
    const k = String(key)
    if (REQ_SCOPED_VARS.has(k)) {
      // get/set と同じ方針: リクエスト処理中だけ存在するものとして扱い、
      // ALS 外では共有 Map の残留値を見せない。
      // なお delete の後も true のままになる (delete はフィールドを空相当へ
      // 戻すだけで、変数自体はリクエスト処理中は常に存在するものとして扱う)
      return httpReqStore.getStore() !== undefined
    }
    return origHas(key)
  }
  const wrappedDelete = (key: any) => {
    const k = String(key)
    if (REQ_SCOPED_VARS.has(k)) {
      const ctx = httpReqStore.getStore()
      if (!ctx) {
        // ALS 外: 共有 Map からは消さない（fail-closed）
        return false
      }
      switch (k) {
        case 'HTTPメソッド': ctx.method = ''; break
        case 'GETデータ': ctx.getData = {}; break
        case 'POSTデータ': ctx.postData = {}; break
        case 'FILESデータ': ctx.filesData = []; break
      }
      return true
    }
    return origDelete(key)
  }
  // 全てのラッパーが載ってからインストール済みにする。途中失敗で再試行不能にしない。
  // 復元は適用前の状態へ戻す (自前プロパティが元々あれば descriptor で復元し、
  // 無ければ delete で除去してプロトタイプメソッドだけの状態に戻す)。
  try {
    v0.get = wrappedGet
    v0.set = wrappedSet
    v0.has = wrappedHas
    v0.delete = wrappedDelete
  } catch (e) {
    restoreProp('get')
    restoreProp('set')
    restoreProp('has')
    restoreProp('delete')
    throw e
  }
  reqScopedPatchedMaps.add(v0)
  // 適用済み判定の正は reqScopedPatchedMaps 側。sys 側フラグは状態確認用に併せて立てる
  sys.__httpserverReqScopedInstalled = true
}

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

  constructor(sys: any) {
    this.server = null
    this.items = []
    this.sys = sys
    installReqScopedVarMap(sys)
  }

  doRequest(req: any, res: any) {
    const ctx: HttpReqCtx = {
      req,
      res,
      isEnd: false,
      usedHeader: false,
      method: '',
      getData: {},
      postData: {},
      filesData: []
    }
    // イベントコールバックは ALS を継承しないことがあるため、各入口で run し直す
    const enter = (fn: () => void) => { httpReqStore.run(ctx, fn) }

    enter(() => {
      const method = String(req.method || '').toUpperCase()
      ctx.method = method
      // ALS 経由 Map 経由で反映（共有 Map には書かない）
      this.sys.__setSysVar('HTTPメソッド', method)
      console.error(`${HTTPSERVER_LOGID} 要求あり METHOD=${method} URL=` + req.url)
      const params = this.parseURL(req.url)
      const url = params['?URL']
      ctx.getData = params
      this.sys.__setSysVar('GETデータ', params)

      const runDispatcher = (postData: any) => {
        try {
          ctx.postData = postData
          this.sys.__setSysVar('POSTデータ', postData)
          this.sys.__setSysVar('FILESデータ', ctx.filesData)
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
        req.on('end', () => {
          enter(() => {
            void (async () => {
              const bodyBuffer = Buffer.concat(chunks)
              let postData: any = {}
              let filesData: any[] = []
              const contentType = req.headers['content-type'] || ''
              try {
                const mediaType = contentType.split(';', 1)[0].trim().toLowerCase()
                if (mediaType === 'multipart/form-data') {
                  const boundary = parseContentDisposition(contentType, true)['boundary'] ?? ''
                  if (!MULTIPART_BOUNDARY_RE.test(boundary)) {
                    console.error(`${HTTPSERVER_LOGID} multipart/form-data 要求の boundary が取得できないか文法上不正です`)
                    res.statusCode = 400
                    res.end('Bad Request.')
                    return
                  }
                  const parsed = await parseMultipart(bodyBuffer, boundary)
                  postData = parsed.fields
                  filesData = parsed.files
                } else if (mediaType === 'application/json' || mediaType.startsWith('application/json-') || mediaType.endsWith('+json')) {
                  const bodyStr = bodyBuffer.toString('utf-8')
                  try {
                    postData = JSON.parse(bodyStr)
                  } catch {
                    postData = bodyStr
                  }
                } else if (mediaType === 'application/x-www-form-urlencoded') {
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
                ctx.filesData = filesData
                this.sys.__setSysVar('FILESデータ', filesData)
              } catch (err: any) {
                this.returnError(res, err)
                return
              }
              runDispatcher(postData)
            })()
          })
        })
      } else {
        ctx.filesData = []
        this.sys.__setSysVar('FILESデータ', [])
        runDispatcher({})
      }
    })
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
    const ctx = getHttpReqCtx()
    ctx.isEnd = false
    ctx.usedHeader = false
    // ALS 経由でこのリクエストの値を公開（共有 Map には書かない）
    this.sys.__setSysVar('HTTPメソッド', ctx.method)
    this.sys.__setSysVar('GETデータ', ctx.getData)
    this.sys.__setSysVar('POSTデータ', ctx.postData)
    this.sys.__setSysVar('FILESデータ', ctx.filesData)
    const ret: any = it.callback(req, res)
    // コールバックが非同期関数だった場合、拒否をここで捕まえる
    if (ret && typeof ret.then === 'function') {
      ret.then(undefined, (err: any) => { this.returnError(res, err) })
    }
    if (!ctx.isEnd) {
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
/** `;`区切りの `キー=値` パラメータを持つヘッダ値を解析してパラメータ辞書を返す汎用パーサ。
 * Content-Disposition(`form-data; name="upload"; filename="photo.txt"`)や
 * Content-Type(`multipart/form-data; boundary=X`)の解析に使用する。
 * 値がダブルクォート付きの場合は quoted-string として解析し、値中の `;`・`=`・
 * エスケープ(`\"`, `\\`)も処理する。非引用値は RFC 7230 の token として解釈する。
 * キーは大文字小文字を区別しない(小文字化して格納)。`=` 前後の Optional Whitespace は許容する。
 * パラメータの順序に依存せず `name` と `filename` を正しく分離するためのヘルパーとして導入し、
 * Content-Type の boundary 取得にも流用する。(#2494)
 * strict を true にすると、各パラメータが必ず `;` の直後から始まり、値の後が OWS を除いて
 * `;` または末尾であることを検証する。区切りのない断片に遭遇した時点で解析を打ち切り、
 * それ以降のパラメータは採用しない(先頭の型部分は最初の `;` まで読み飛ばす)。
 * Content-Type の boundary 取得のように区切り欠落を受理したくない用途向け。(#2495)
 */
// RFC 7230 の separators を使用。ただし `'` は tchar であると同時に
// RFC 5987 の `charset'language'value` 区切りにも使うため区切り文字として扱わない。
const CD_SEPARATORS = '()<>@,;:\\"/[]?={} \t'

// Content-Disposition のキーとして有効な RFC 7230 token 文字
const CD_KEY_RE = /^[0-9a-zA-Z!#$%&'*+.^_`|~-]+$/

/** Content-Disposition の `キー=値` の値部分を解析して返す。
 * start には `=` 後の Optional Whitespace をスキップした位置を渡すこと。
 */
function parseCDValue(headerValue: string, start: number): { value: string, next: number, valid: boolean } {
  let i = start
  let val = ''
  let valid = true
  if (i < headerValue.length && headerValue[i] === '"') {
    i++ // opening DQUOTE
    let closed = false
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
        // quoted-pair を形成しない末尾の `\` は不正な quoted-string
        valid = false
        i++
        break
      }
      if (headerValue[i] === '"') {
        i++ // closing DQUOTE
        closed = true
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
    // 閉じ引用符なしで末尾へ到達した quoted-string は不正
    if (!closed) { valid = false }
  } else {
    // 非引用値はRFC 7230のtoken。区切り文字・空白・制御文字(0x00-0x1F, 0x7F)・非ASCIIで停止する。
    // そのため非引用の非ASCII値(例: filename=画像.txt)は空になり、実ブラウザは非引用値を送らないため実害はない
    const valStart = i
    while (i < headerValue.length && CD_SEPARATORS.indexOf(headerValue[i]) < 0 &&
           headerValue.charCodeAt(i) >= 0x21 && headerValue.charCodeAt(i) <= 0x7e) { i++ }
    val = headerValue.substring(valStart, i)
  }
  return { value: val, next: i, valid }
}

function parseContentDisposition(headerValue: string, strict = false): { [key: string]: string } {
  // obs-fold (CRLF 1*(SP/HTAB)) を単一 SP に正規化してから解析する
  const normalized = headerValue.replace(/\r\n[ \t]+/g, ' ')
  // Object.create(null)により __proto__ 等のキーでもプロトタイプ汚染せず、自前プロパティとして扱える
  const params: { [key: string]: string } = Object.create(null)
  let i = 0

  if (strict) {
    // strict モードでは先頭の型部分を読み飛ばし、最初の ';' 以降をパラメータ部とする
    const semiIdx = normalized.indexOf(';')
    i = semiIdx >= 0 ? semiIdx + 1 : normalized.length
  } else {
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
  }

  while (i < normalized.length) {
    if (strict) {
      // strict モードでは ';' は直前の値の後に消費済みなので OWS のみスキップする。
      // ここで OWS 以外が続く場合は区切りのない断片であり、後続の解析を打ち切る
      while (i < normalized.length && (normalized[i] === ' ' || normalized[i] === '\t')) { i++ }
    } else {
      // セパレータと空白をスキップ
      while (i < normalized.length && (normalized[i] === ';' || normalized[i] === ' ' || normalized[i] === '\t')) { i++ }
    }
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
      // strict モードでは '=' を伴わない不正な断片(空パラメータやベアトークン等)は打ち切る。
      // 非 strict では不正な断片で i が進まないと無限ループになるため、最低1文字進める
      if (strict) { break }
      if (i <= iterStart) { i++ }
      continue
    }
    i++ // '='

    // 値(先頭の空白をスキップ)
    while (i < normalized.length && (normalized[i] === ' ' || normalized[i] === '\t')) { i++ }
    const parsed = parseCDValue(normalized, i)
    i = parsed.next
    if (i <= iterStart) { i++ }

    if (strict) {
      // 閉じ引用符の欠落や未完了の quoted-pair は不正な値として採用しない
      if (!parsed.valid) { break }
      // strict モードでは値の後が OWS を除いて ';' または末尾でなければならない。
      // 区切り欠落ならこの値自体も採用せず打ち切る
      while (i < normalized.length && (normalized[i] === ' ' || normalized[i] === '\t')) { i++ }
      if (i < normalized.length && normalized[i] !== ';') { break }
      if (i < normalized.length) { i++ }
    }

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
      callback = sys.__findFunc(callback, '簡易HTTPサーバ起動時') // 文字列指定なら関数に変換
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
      callback = sys.__findFunc(callback, '簡易HTTPサーバ受信時') // 文字列指定なら関数に変換
      if (sys.__httpserver === null) {
        throw new Error(ERR_NOHTTPSERVER)
      }
      const dp: EasyURLDispather = sys.__httpserver
      const it: EasyURLItem = new EasyURLItem('callback')
      if (url === '') { url = '/' }
      if (url.charAt(0) !== '/') { url = '/' + url }
      it.url = url
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
      const ctx = getHttpReqCtx()
      if (!ctx.usedHeader) {
        ctx.usedHeader = true
        ctx.res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      }
      ctx.res.end(s)
      ctx.isEnd = true
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
      const ctx = getHttpReqCtx()
      ctx.res.writeHead(no, head)
      ctx.isEnd = true
      ctx.usedHeader = true
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
      const ctx = getHttpReqCtx()
      const raw = String(url ?? '')
      // C0/DEL と前後空白を正規化。タブ混入 javascript: 等のスキームすり抜けを防ぐ。
      if (/[\u0000-\u001F\u007F]/.test(raw)) {
        throw new Error('リダイレクト先URLが不正です。')
      }
      const loc = raw.trim()
      if (loc === '') {
        throw new Error('リダイレクト先URLが不正です。')
      }
      // 先頭スキームのみ検査（クエリ内コロンは許可）。http(s) 以外のスキームは拒否。
      const schemeM = loc.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/)
      if (schemeM) {
        const scheme = schemeM[1].toLowerCase()
        if (scheme !== 'http' && scheme !== 'https') {
          throw new Error('リダイレクト先URLが不正です。')
        }
      }
      const safeHref = loc
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      console.error(`${HTTPSERVER_LOGID} 移動=${loc}`)
      ctx.res.writeHead(302, { 'Location': loc })
      ctx.res.end(`<html><body><a href="${safeHref}">JUMP</a></body></html>`)
      ctx.isEnd = true
    }
  }
}

export default PluginHttpServer
