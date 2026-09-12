/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import http from 'http'
import os from 'os'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginHttpServer from '../../src/plugin_httpserver.mjs'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('plugin_httpserver_test', () => {
  let nako
  let serverDp
  let uploadSnapshot = []
  const uploadDir = path.join(os.tmpdir(), 'nako3-plugin_httpserver_upload')

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  beforeEach(() => {
    serverDp = null
    nako = new NakoCompiler()
    // PluginHttpServerの登録。名前は 'plugin_httpserver.js' とする。
    nako.addPluginFile('PluginHttpServer', 'plugin_httpserver.js', PluginHttpServer)
    try {
      uploadSnapshot = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : []
    } catch (e) {
      uploadSnapshot = []
    }
  })

  afterEach(async () => {
    if (serverDp && serverDp.server) {
      await new Promise((resolve) => {
        serverDp.server.close(() => {
          resolve()
        })
      })
      // 次のテストで古いサーバを参照しないよう null に戻す
      serverDp = null
    }
    // このテストで作ったアップロードファイルだけを消す
    try {
      if (fs.existsSync(uploadDir)) {
        for (const file of fs.readdirSync(uploadDir)) {
          if (!uploadSnapshot.includes(file)) {
            try { fs.unlinkSync(path.join(uploadDir, file)) } catch (e) {}
          }
        }
      }
    } catch (e) {}
  })

  it('クエリパラメータ付きのURLで静的ファイルが取得できること', async () => {
    // テスト用のダミーファイルを作成
    const tempDir = path.join(__dirname, 'fixtures_http')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    const tempFile = path.join(tempDir, 'test.txt')
    fs.writeFileSync(tempFile, 'hello world')

    let port = 0
    // `簡易HTTPサーバ起動時`を呼ぶ
    const code = `
●ダミー起動
  戻る。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「/」を「${tempDir.replace(/\\/g, '/')}」に簡易HTTPサーバ静的パス指定。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    // クエリパラメータ付きでリクエストを送る
    const resText = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/test.txt?foo=bar&baz=123`, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      }).on('error', reject)
    })

    assert.strictEqual(resText, 'hello world')

    // 一時ファイルを削除
    try {
      fs.unlinkSync(tempFile)
      fs.rmdirSync(tempDir)
    } catch (e) {}
  })

  it('POSTメソッドで送信されたJSONデータを取得できること', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  POSTデータ["message"]を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/post-json」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const postData = JSON.stringify({ message: 'hello post json' })
    const resText = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/post-json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    assert.strictEqual(resText, 'hello post json')
  })

  it('POSTメソッドで送信されたurlencodedデータを取得できること', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  「{POSTデータ["message"]}|{POSTデータ["__proto__"]}」を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/post-urlencoded」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const postData = 'message=hello+post+urlencoded&__proto__=proto_value'
    const resText = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/post-urlencoded',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    assert.strictEqual(resText, 'hello post urlencoded|proto_value')
  })

  it('GETクエリパラメータが正しく解析されること #2493', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  G=GETデータ
  「{G["token"]}|{G["flag"]}|{G["next"]}|{G["?URL"]}」を簡易HTTPサーバ出力。
ここまで。
●プロト確認
  G=GETデータ
  「{G["__proto__"]}|{G["?URL"]}」を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/hello」に簡易HTTPサーバ受信時。
「プロト確認」を「/proto」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const request = (path) => new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'GET'
      }, (res) => {
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.end()
    })

    // 値の中の=と?、値なしフラグをまとめて正しく解析する
    assert.strictEqual(await request('/hello?token=a=b&flag&next=a?b'), 'a=b||a?b|/hello')
    // #フラグメント以降は切り捨てる
    assert.strictEqual(await request('/hello?token=a#frag'), 'a|undefined|undefined|/hello')
    // 重複キーは最後の値で上書きされる
    assert.strictEqual(await request('/hello?token=1&token=2&flag&next=x'), '2||x|/hello')
    // +は空白に変換される
    assert.strictEqual(await request('/hello?token=hello+world&flag&next=x'), 'hello world||x|/hello')
    // 不正なpercentエンコーディングは生のまま保持される
    assert.strictEqual(await request('/hello?token=%ZZ&flag&next=x'), '%ZZ||x|/hello')
    // 特殊キー__proto__でもクラッシュせず、?URLはパスで上書きされる
    assert.strictEqual(await request('/hello?__proto__=x&%3FURL=/evil&token=a'), 'a|undefined|undefined|/hello')
    // __proto__は値として取得でき、?URLはリクエストのパスが維持されること
    assert.strictEqual(await request('/proto?__proto__=x&%3FURL=/evil&token=a'), 'x|/proto')
    // __proto__でObject.prototypeが汚染されないこと
    assert.strictEqual(({}).x, undefined)
    assert.strictEqual(Object.prototype.x, undefined)
    // hasOwnProperty等のObject.prototype由来のキーでもクラッシュしない
    assert.strictEqual(await request('/hello?hasOwnProperty=x&constructor=y&token=a'), 'a|undefined|undefined|/hello')
  })

  it('POSTメソッドでファイルをアップロードしてFILESデータを取得できること', async () => {
    const originalWriteFileSync = fs.writeFileSync
    fs.writeFileSync = () => {
      throw new Error('writeFileSync should not be used during upload handling')
    }

    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  ファイル情報＝FILESデータ[0]
  もし、ファイル情報["path"]が空でなければ
    ファイル名＝ファイル情報["name"]
    ファイルサイズ＝ファイル情報["size"]
    「OK:{ファイル名}:{ファイルサイズ}」を簡易HTTPサーバ出力。
  違えば
    「NG」を簡易HTTPサーバ出力。
  ここまで。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/upload」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const boundary = '----TestBoundary'
    const parts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="file1"; filename="hello.txt"\r\n`,
      `Content-Type: text/plain\r\n\r\n`,
      `hello world nako3 upload\r\n`,
      `--${boundary}--\r\n`
    ]
    const postData = Buffer.from(parts.join(''))

    const resText = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': postData.length
        }
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    try {
      assert.strictEqual(resText, 'OK:hello.txt:24')
    } finally {
      fs.writeFileSync = originalWriteFileSync
    }
  })

  it('Content-Dispositionのname/filenameの順序に依存せずfieldNameを正しく取得できること #2494', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  もし、(FILESデータの配列要素数)=0ならば
    もし、POSTデータに"upload"が辞書キー存在ならば
      「FIELD:{POSTデータ["upload"]}」を簡易HTTPサーバ出力。
    違えば
      「NG」を簡易HTTPサーバ出力。
    ここまで。
  違えば
    ファイル情報＝FILESデータ[0]
    保存名＝ファイル情報["path"]からファイル名抽出
    「OK:{ファイル情報["fieldName"]}:{ファイル情報["name"]}:{保存名}」を簡易HTTPサーバ出力。
  ここまで。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/upload」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const postMultipart = (disposition) => new Promise((resolve, reject) => {
      const boundary = '----TestBoundary'
      const parts = [
        `--${boundary}\r\n`,
        `Content-Disposition: ${disposition}\r\n`,
        `Content-Type: text/plain\r\n\r\n`,
        `hello world\r\n`,
        `--${boundary}--\r\n`
      ]
      const postData = Buffer.from(parts.join(''))
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': postData.length
        }
      }, (res) => {
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.write(postData)
      req.end()
    })

    // name先頭でもfilename先頭でもfieldNameは正しく「upload」になる
    assert.match(await postMultipart('form-data; name="upload"; filename="photo.txt"'), /^OK:upload:photo.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    assert.match(await postMultipart('form-data; filename="photo.txt"; name="upload"'), /^OK:upload:photo.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // nameが無い場合はファイルとして扱われず、クラッシュもしない
    assert.strictEqual(await postMultipart('form-data; filename="photo.txt"'), 'NG')
    // nameを解決できないパートはconsole.warnで警告される
    const warnSpy = []
    const origWarn = console.warn
    console.warn = (...args) => { warnSpy.push(args.join(' ')) }
    try {
      await postMultipart('form-data; filename="no-name.txt"')
    } finally {
      console.warn = origWarn
    }
    assert.ok(warnSpy.some((m) => m.includes('name を解決できないパート')), '警告が出力されること')
    assert.ok(warnSpy.some((m) => m.includes('no-name.txt')), '警告にパートのContent-Dispositionが含まれること')
    // 空のnameでfilenameが無いパートも警告して無視する
    const emptyNameWarn = []
    console.warn = (...args) => { emptyNameWarn.push(args.join(' ')) }
    try {
      assert.strictEqual(await postMultipart('form-data; name=""'), 'NG')
    } finally {
      console.warn = origWarn
    }
    assert.ok(emptyNameWarn.some((m) => m.includes('name が空のためパートを無視しました')))
    // filenameが無い場合はフィールドとして扱われ、POSTデータに保存される
    assert.strictEqual(await postMultipart('form-data; name="upload"'), 'FIELD:hello world')
    // quoted-string内の;と=を正しく扱う(nameとfilenameの値は正しく分離される)
    // 保存名はWindows禁止文字のみ除去するため;や=は保持される
    assert.match(await postMultipart('form-data; filename="a;b.txt"; name="upload"'), /^OK:upload:a;b\.txt:[0-9]+_[0-9A-Za-z_-]+_a;b\.txt$/)
    assert.match(await postMultipart('form-data; filename="a;b=c"; name="upload"'), /^OK:upload:a;b=c:[0-9]+_[0-9A-Za-z_-]+_a;b=c$/)
    // 大文字キーを大文字小文字を区別せず扱う
    assert.match(await postMultipart('form-data; NAME="upload"; FILENAME="photo.txt"'), /^OK:upload:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // quoted-stringのエスケープを処理する
    assert.match(await postMultipart('form-data; name="quo\\"ted"; filename="photo.txt"'), /^OK:quo"ted:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    assert.match(await postMultipart('form-data; name="a\\\\b"; filename="photo.txt"'), /^OK:a\\b:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // 空値・非引用値を扱う
    assert.match(await postMultipart('form-data; name=""; filename="photo.txt"'), /^OK::photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    assert.match(await postMultipart('form-data; name=upload; filename=photo.txt'), /^OK:upload:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // disposition-typeなしでも解析できる
    assert.match(await postMultipart('name="upload"; filename="photo.txt"'), /^OK:upload:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // =の前後の空白(OWS)を許容する
    assert.match(await postMultipart('form-data; name = "upload" ; filename = "photo.txt"'), /^OK:upload:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // 空のfilenameはファイル扱いせず、フィールドとしてPOSTデータに保存される
    assert.strictEqual(await postMultipart('form-data; name="upload"; filename=""'), 'FIELD:hello world')
    assert.strictEqual(await postMultipart("form-data; name=\"upload\"; filename*=\"\""), 'FIELD:hello world')
    // 空のfilename*(RFC 5987の空値)はfilenameへフォールバックする。filenameも空ならフィールドとして扱う
    assert.strictEqual(await postMultipart("form-data; name=\"upload\"; filename*=UTF-8''"), 'FIELD:hello world')
    // filename*が空でもfilenameがあればファイルとして扱う
    assert.match(await postMultipart("form-data; name=\"upload\"; filename=\"report.pdf\"; filename*=UTF-8''"), /^OK:upload:report\.pdf:[0-9]+_[0-9A-Za-z_-]+_report\.pdf$/)
    // 空のname*はnameへフォールバックせず、空のnameとして扱う(nameは空のまま)
    assert.match(await postMultipart("form-data; name*=UTF-8''; filename=\"photo.txt\""), /^OK::photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // filename*の非UTF-8文字セットはfilenameへフォールバックする
    assert.match(await postMultipart("form-data; name=\"upload\"; filename=\"photo.txt\"; filename*=ISO-8859-1''caf%E9.txt"), /^OK:upload:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // filename*内のエンコードされたパス区切り(%2F)はbasenameで無害化される
    assert.match(await postMultipart("form-data; name=\"upload\"; filename*=UTF-8''..%2F..%2Fetc%2Fpasswd"), /^OK:upload:\.\.\/\.\.\/etc\/passwd:[0-9]+_[0-9A-Za-z_-]+_passwd$/)
    // name*(RFC 5987)もデコードしてfieldNameに使う
    assert.match(await postMultipart("form-data; name*=UTF-8''%E3%82%A2%E3%83%83%E3%83%97; filename=\"photo.txt\""), /^OK:アップ:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // nameの値に;や=を含む場合も正しくfieldNameに使う
    assert.match(await postMultipart('form-data; name="a;b=c"; filename="photo.txt"'), /^OK:a;b=c:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // RFC 5987のfilename*を優先してデコードする
    assert.match(await postMultipart('form-data; name="upload"; filename*="UTF-8\'\'%E7%94%BB%E5%83%8F.txt"'), /^OK:upload:画像\.txt:[0-9]+_[0-9A-Za-z_-]+_画像\.txt$/)
    // RFC 5987のfilename*未引用形式(token形式)
    assert.match(await postMultipart("form-data; name=\"upload\"; filename*=UTF-8''%E7%94%BB%E5%83%8F.txt"), /^OK:upload:画像\.txt:[0-9]+_[0-9A-Za-z_-]+_画像\.txt$/)
    // filenameとfilename*が同時にある場合はfilename*を優先する
    assert.match(await postMultipart("form-data; name=\"upload\"; filename=\"old.txt\"; filename*=UTF-8''%E6%96%B0%E3%81%97%E3%81%84.txt"), /^OK:upload:新しい\.txt:[0-9]+_[0-9A-Za-z_-]+_新しい\.txt$/)
    // RFC 5987の言語タグ付きでもデコードする
    assert.match(await postMultipart("form-data; name=\"upload\"; filename*=UTF-8'ja'%E7%94%BB%E5%83%8F.txt"), /^OK:upload:画像\.txt:[0-9]+_[0-9A-Za-z_-]+_画像\.txt$/)
    // ドット始まりのファイル名は接頭辞があるため保存名に残す
    assert.match(await postMultipart('form-data; name="upload"; filename=".gitignore"'), /^OK:upload:\.gitignore:[0-9]+_[0-9A-Za-z_-]+_\.gitignore$/)
    // ディレクトリ区切りを含むfilenameは保存名がbasenameに限定される(パストラバーサル防止)
    assert.match(await postMultipart('form-data; name="upload"; filename="../../etc/passwd"'), /^OK:upload:\.\.\/\.\.\/etc\/passwd:[0-9]+_[0-9A-Za-z_-]+_passwd$/)
    // バックスラッシュ区切りのパストラバーサルは保存名がbasenameに限定される
    // (quoted-stringでは\がエスケープされるため\\で送る)
    assert.match(await postMultipart('form-data; name="upload"; filename="..\\\\..\\\\etc\\\\passwd"'), /^OK:upload:\.\.\\\.\.\\etc\\passwd:[0-9]+_[0-9A-Za-z_-]+_passwd$/)
    // シェルメタ文字を含むfilenameも保存名に保持される(表示名と保存名が一致する)
    assert.match(await postMultipart('form-data; name="upload"; filename="$(id).txt"'), /^OK:upload:\$\(id\)\.txt:[0-9]+_[0-9A-Za-z_-]+_\$\(id\)\.txt$/)
    // __proto__等のprototype由来のnameでも汚染されず値として扱われる
    assert.match(await postMultipart('form-data; name="__proto__"; filename="x.txt"'), /^OK:__proto__:x\.txt:[0-9]+_[0-9A-Za-z_-]+_x\.txt$/)
    // Content-Dispositionのパラメータ名が__proto__でもクラッシュせずname/filenameを取得できる
    assert.match(await postMultipart('form-data; __proto__="x"; name="upload"; filename="photo.txt"'), /^OK:upload:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // MIMEパートヘッダのobs-fold(CRLF + WSP)も正規化して解析する
    assert.match(await postMultipart('form-data;\r\n name="upload"; filename="photo.txt"'), /^OK:upload:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // 閉じクォートが途中で切れる不正な値でも無限ループせず応答する
    assert.strictEqual(await postMultipart('form-data; name="upload; filename="photo.txt"'), 'NG')
    // malformedなquoted-string(閉じクォートなし)でもクラッシュせず末尾まで読む
    assert.match(await postMultipart('form-data; name="upload"; filename="photo.txt'), /^OK:upload:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // RFC 5987デコード後に制御文字(%01)を含む値は除去される
    assert.match(await postMultipart("form-data; name=\"upload\"; filename*=UTF-8''%01photo.txt"), /^OK:upload:photo\.txt:[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
    // 極端に長いfilenameは拡張子を残しつつ保存名をUTF-8で200バイトに切り詰める
    assert.match(await postMultipart('form-data; name="upload"; filename="' + 'a'.repeat(250) + '.txt"'), new RegExp('^OK:upload:' + 'a'.repeat(250) + '\\.txt:[0-9]+_[0-9A-Za-z_-]+_' + 'a'.repeat(196) + '\\.txt$'))
    // quoted-stringの先頭・末尾空白は表示名では値として保持し、保存名では先頭・末尾空白を除去する
    assert.match(await postMultipart('form-data; name=" upload "; filename=" photo.txt "'), /^OK: upload : photo\.txt :[0-9]+_[0-9A-Za-z_-]+_photo\.txt$/)
  })

  it('HTTPメソッドにGET/POST/PUT/DELETEが設定されること', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  「M={HTTPメソッド}」を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/method」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const request = (method) => new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/method',
        method: method
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve(data) })
      })
      req.on('error', reject)
      req.end()
    })

    assert.strictEqual(await request('GET'), 'M=GET')
    assert.strictEqual(await request('POST'), 'M=POST')
    assert.strictEqual(await request('PUT'), 'M=PUT')
    assert.strictEqual(await request('DELETE'), 'M=DELETE')
  })
  it('受信時コールバックで例外が発生してもプロセスが落ちず500を返すこと', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  情報＝FILESデータ[0]
  情報["path"]を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/boom」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    const status = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/boom',
        method: 'GET'
      }, (res) => {
        res.on('data', () => {})
        res.on('end', () => { resolve(res.statusCode) })
      })
      req.on('error', reject)
      req.end()
    })

    // 例外がプロセスを停止させず、500として返ること
    assert.strictEqual(status, 500)

    // サーバが生きていて次のリクエストも処理できること
    const status2 = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/boom',
        method: 'GET'
      }, (res) => {
        res.on('data', () => {})
        res.on('end', () => { resolve(res.statusCode) })
      })
      req.on('error', reject)
      req.end()
    })
    assert.strictEqual(status2, 500)
  })

  it('未登録経路にリクエストしたときに404が返ること #2496', async () => {
    let port = 0
    const code = `
●ダミー起動
  戻る。
ここまで。
●受信処理
  「hello」を簡易HTTPサーバ出力。
ここまで。
「ダミー起動」を${port}で簡易HTTPサーバ起動時。
「受信処理」を「/hello」に簡易HTTPサーバ受信時。
`
    const g = await nako.runAsync(code, 'main')
    serverDp = g.__httpserver
    await wait(100)
    port = serverDp.server.address().port

    // 登録済み経路 /hello は 200 と hello を返す
    const helloRes = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/hello',
        method: 'GET'
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve({ statusCode: res.statusCode, body: data }) })
      })
      req.on('error', reject)
      req.end()
    })
    assert.strictEqual(helloRes.statusCode, 200)
    assert.strictEqual(helloRes.body, 'hello')

    // 未登録経路 /zzz はハングせず 404 が返ること
    const notFoundRes = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/zzz',
        method: 'GET'
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve({ statusCode: res.statusCode, body: data }) })
      })
      req.on('error', reject)
      req.end()
    })
    assert.strictEqual(notFoundRes.statusCode, 404)
    assert.match(notFoundRes.body, /404/)

    // 未登録経路の後でもサーバが生きていて正常経路にアクセスできること
    const helloRes2 = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/hello',
        method: 'GET'
      }, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => { resolve({ statusCode: res.statusCode, body: data }) })
      })
      req.on('error', reject)
      req.end()
    })
    assert.strictEqual(helloRes2.statusCode, 200)
    assert.strictEqual(helloRes2.body, 'hello')
  })
})
