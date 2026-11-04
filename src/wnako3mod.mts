// wnako3mod - nadesiko for web browser
// - wnako3 から wnako3mod を取り込む。
// - このファイルはモジュールとして別のファイルから取り込み可能。
import { NakoCompiler, LoaderTool, LoaderToolTask, LoaderOptions } from '../core/src/nako3.mjs'
import { NakoGlobal } from '../core/src/nako_global.mjs'
import { NakoImportError } from '../core/src/nako_errors.mjs'
import { Token } from '../core/src/nako_types.mjs'
import { setupEditor } from './wnako3_editor.mjs'
import nakoVersion, { NakoVersion } from './nako_version.mjs'
import PluginBrowser from './plugin_browser.mjs'
import PluginJS from './plugin_js.mjs'

const NAKO_SCRIPT_RE = /^(なでしこ|nako|nadesiko)3?$/

const HTTP_POLICY_HINT = 'httpsを使ってください。どうしてもhttpが必要な場合は、取り込み文の前に『!互換性重視:取込』と書くと許可されます。'

/**
 * 取り込み用に URL を取得する。平文 http は既定で禁止する (#2634)
 *
 * ブラウザの fetch では、cross-origin リダイレクトの中間ホップを観測できない(opaque になる)。
 * そのため、リダイレクトは通常の follow に任せ、取得後に最終URL(res.url)だけを確認する。
 * 中間ホップが http で最終URLが https のような場合は検出できない(ブラウザ側の制約)。
 */
async function fetchImportUrl(filePath: string, token: Token, options?: LoaderOptions): Promise<Response> {
  const allowHttp = !!(options && options.allowHttp)
  // 多層防御として、取得前にも判定する(コア側でも判定済み)
  if (/^http:\/\//i.test(filePath) && !allowHttp) {
    throw new NakoImportError(`平文のhttp『${filePath}』からの取り込みは既定で禁止されています。${HTTP_POLICY_HINT}`, token.file, token.line)
  }
  const res = await fetch(filePath)
  // 初回URLがhttpsで最終URLがhttpなら、httpsからhttpへのダウングレード
  // (res.url が空文字のときは確認できないのでスキップする)
  if (!allowHttp && /^https:\/\//i.test(filePath) && /^http:\/\//i.test(res.url || '')) {
    throw new NakoImportError(`『${filePath}』のリダイレクト先『${res.url}』は平文のhttpです(httpsからhttpへのダウングレード)。既定で禁止されています。${HTTP_POLICY_HINT}`, token.file, token.line)
  }
  return res
}

export class WebNakoCompiler extends NakoCompiler {
  version: string
  wnakoVersion: NakoVersion
  localFiles: Record<string, string>
  constructor() {
    super({ useBasicPlugin: true })
    this.version = nakoVersion.version
    this.wnakoVersion = nakoVersion
    this.localFiles = {}
    // プラグインを追加
    this.addPluginObject('PluginJS', PluginJS)
    this.addPluginObject('PluginBrowser', PluginBrowser)
    // 必要な定数を設定
    this.addListener('beforeRun', (g: NakoGlobal) => {
      // バージョン情報を設定
      g.__varslist[0].set('ナデシコ種類', 'wnako3')
      g.__varslist[0].set('ナデシコバージョン', nakoVersion.version)
      g.__varslist[0].set('WNAKOバージョン', nakoVersion.version)
    })
  }

  /**
   * ブラウザでtype="なでしこ"というスクリプトを得て実行する
   */
  async runNakoScript() {
    // スクリプトタグの中身を得る
    let nakoScriptCount = 0
    const scripts = document.querySelectorAll('script')
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i]
      if (script.type.match(NAKO_SCRIPT_RE)) {
        nakoScriptCount++
        // URLからスクリプト名を見つける
        const url = (typeof (window.location) === 'object') ? window.location.href : 'url_unknown'
        const fname = `${url}#script${nakoScriptCount}.nako3`
        const code = script.text
        // 依存するライブラリをロード
        await this.loadDependencies(code, fname)
        // プログラムを実行
        await this.runAsync(script.text, fname)
      }
    }
    if (nakoScriptCount > 1) {
      console.log('実行したなでしこの個数=', nakoScriptCount)
    }
  }

  /** 取り込む文を実行する */
  async loadDependencies(code: string, filename: string, preCode = '', localFiles: any = {}): Promise<unknown> {
    this.localFiles = localFiles || {}
    return this._loadDependencies(code, filename, preCode, this.getLoaderTool())
  }

  /**
   * type=なでしこ のスクリプトを自動実行するべきかどうかを返す
   * @returns type=なでしこ のスクリプトを自動実行するべきかどうか
   */
  checkScriptTagParam(): boolean {
    const scripts = document.querySelectorAll('script')
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i]
      const src = script.src || ''
      if (src.indexOf('wnako3.js?run') >= 0 ||
          src.indexOf('wnako3.js&run') >= 0) {
        return true
      }
    }
    return false
  }

  /**
   * 指定したidのHTML要素をなでしこ言語のエディタにする。
   * @param {string | Element} idOrElement HTML要素
   * @see {setupEditor}
   */
  setupEditor(idOrElement: any) {
    return setupEditor(idOrElement, this, (window as any).ace)
  }

  /** なでしこ3の『取り込む』命令のための読み込みツール */
  getLoaderTool(): LoaderTool {
     
    const tool = { readJs: this.readJs, readNako3: this.readNako3, resolvePath: this.resolvePath }
    return tool
  }

  /** JSプラグインの読み込み */
  readJs(filePath: string, token: Token, options?: LoaderOptions): LoaderToolTask<any> {
    if (this.localFiles && this.localFiles[filePath]) {
      return {
         
        task: (async() => () => {
           
          Function(this.localFiles[filePath])()
          return {}
        })()
      }
    }
    return {
      task: (async() => {
        // もし動的インポートに対応していれば動的インポートを試す
        const basename = ('/' + filePath).split('/').pop() || '?'
        /*
        try {
          const obj = await import(filePath)
          this.addPluginObject(basename, obj)
          return {}
        } catch (e) { }
        */
        // WebPackの関係で動的インポートが失敗するので、テキストとしてJSソースを取り出して処理する
        // JavaScriptをテキストとして取得
        const res = await fetchImportUrl(filePath, token, options)
        if (!res.ok) {
          throw new NakoImportError(`ファイル『${filePath}』のダウンロードに失敗しました: ${res.status} ${res.statusText}`, token.file, token.line)
        }
        let jstext = await res.text()
        // ESModuleっぽければ `default export`を置き換える
        const r: number = Math.floor(Math.random() * 1000000)
        const exportName = `exportObject${r}`
        if (jstext.includes('default export')) {
          jstext = jstext.replace('default export', `;let ${exportName} = `)
          jstext += `\n;navigator.nako3.addPluginObject('${basename}', ${exportName});\n`
        }
        // addPluginObjectが存在する
        if (!jstext.includes('navigator.nako3.addPluginObject')) {
          throw new NakoImportError(`ファイル ${filePath} の中に文字列 "navigator.nako3.addPluginObject" が存在しません。現在、ブラウザ版のなでしこ言語v3は自動登録するプラグインのみをサポートしています。`, token.file, token.line)
        }
        const gNavigator: any = navigator
        const gSelf: any = gNavigator.nako3
        // textの例: `navigator.nako3.addPluginObject('PluginRequireTest', { requiretest: { type: 'var', value: 100 } })`
        return () => {
          // プラグインの自動登録は navigator.nako3 を参照するため、 navigator.nako3 を一時的に現在のインスタンスにする。
          const globalNavigator: any = gNavigator
          const globalNako3 = globalNavigator.nako3
          globalNavigator.nako3 = gSelf
          try {
             
            const f = Function(jstext)
            f.apply(gSelf.__globalObj)
          } catch (err) {
             
            throw new NakoImportError(`プラグイン ${filePath} の取り込みに失敗: ${err instanceof Error ? err.message : err + ''}`, token.file, token.line)
          } finally {
            globalNavigator.nako3 = globalNako3
          }
          return {}
        }
      })()
    }
  }

  /** NAKO3プラグインの読み込み */
  readNako3(filePath: string, token: Token, options?: LoaderOptions): LoaderToolTask<string> {
    if (this.localFiles && this.localFiles[filePath]) { // ローカルファイルを使う場合
      return {
        task: (() => {
          return (new Promise((resolve, _reject) => {
            const s: string = this.localFiles[filePath]
            resolve(s)
          }))
        })()
      }
    }
    return {
      task: (async() => {
        const res = await fetchImportUrl(filePath, token, options)
        if (!res.ok) {
          throw new NakoImportError(`ファイル ${filePath} のダウンロードに失敗しました: ${res.status} ${res.statusText}`, token.file, token.line)
        }
        return await res.text()
      })()
    }
  }

  /** 読み込みでパスを解決する */
  resolvePath(name: string, token: Token, fromFile: string) {
    let pathname = name
    // 明示的に http(s) URL が書かれているか (#2634)
    const isAbsoluteUrl = /^https?:\/\//i.test(name)
    // http から始まっていれば解決は不要
    if (pathname.match(/^https?:\/\//)) { // フルパスなら解決不要
    } else if (this.localFiles && this.localFiles[name]) {
      pathname = this.localFiles[name]
    } else {
      try {
        pathname = new URL(name).pathname
      } catch {
        // 単純にパスに変換できなければ、location.hrefを参考にパスを組み立てる
        try {
          let baseDir = dirname(fromFile)
          if (baseDir === '') {
            // https://2/3/4.html
            const a = window.location.href.split('/')
            baseDir = '/' + a.slice(3, a.length - 1).join('/')
          }
          pathname = resolveURL(baseDir, name)
        } catch (e) {
          throw new NakoImportError(`取り込み文の引数でパスが解決できません。https:// か http:// で始まるアドレスを指定してください。\n${e as string}`, token.file, token.line)
        }
      }
    }
    // 相対指定から解決されたURLがページと同一オリジンなら、オリジン部分を取り除いてパスにする (#2634)
    // 同一オリジンの相対取り込みはページと同じ信頼境界なので、コア側のhttp禁止チェックの対象外にする。
    // 明示的に書かれた http(s) URL や他オリジンのURLは、従来どおりチェック対象のまま残す。
    if (!isAbsoluteUrl && /^https?:\/\//i.test(pathname)) {
      let origin = ''
      try {
        origin = new URL(window.location.href).origin
      } catch {
        origin = ''
      }
      if (origin !== '' && pathname.toLowerCase().startsWith(origin.toLowerCase())) {
        pathname = pathname.substring(origin.length)
        if (pathname === '') { pathname = '/' }
        if (!pathname.startsWith('/')) { pathname = '/' + pathname }
      }
    }
    // 拡張子によってプラグインタイプを分岐する
    const checkExt = (name: string, extlist: string[]): boolean => {
      for (const ext of extlist) {
        if (name.endsWith(ext)) { return true }
        if (name.endsWith(ext + '.txt')) { return true } // '.mjs.txt' にもマッチ
      }
      return false
    }
    // URLパラメータを考慮する
    const aname: string = (pathname + '?').split('?')[0]
    // JSプラグイン    → (.js|.mjs)
    // NAKO3プラグイン → (.nako3|.nako)
    if (checkExt(aname, ['.js', '.mjs'])) { return { filePath: pathname, type: 'js' } }
    if (checkExt(aname, ['.nako3', '.nako'])) { return { filePath: pathname, type: 'nako3' } }
    if (checkExt(pathname, ['.js', '.mjs'])) { return { filePath: pathname, type: 'js' } }
    if (checkExt(pathname, ['.nako3', '.nako'])) { return { filePath: pathname, type: 'nako3' } }
    // ファイル拡張子が未指定の場合
    throw new NakoImportError(`ファイル『${name}』は拡張子が(.nako3|.js|.js.txt|.mjs|.mjs.txt)以外なので取り込めません。`, token.file, token.line)
  }
}

function dirname(s: string) {
  const a = s.split('/')
  if (a && a.length > 1) {
    return a.slice(0, a.length - 1).join('/')
  }
  return ''
}

function resolveURL(base: string, s: string) {
  const baseA = base.split('/')
  if (baseA.length > 0 && baseA[baseA.length - 1] === '') {
    baseA.pop()
  }
  const sA = s.split('/')
  for (const p of sA) {
    if (p === '') { continue }
    if (p === '.') { continue }
    if (p === '..') {
      baseA.pop()
      continue
    }
    baseA.push(p)
  }
  return baseA.join('/')
}
