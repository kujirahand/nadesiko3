// @ts-nocheck
// nadesiko for web browser
// wnako3.js
require('whatwg-fetch') // IE11サポートが不要になったら外す

const NakoCompiler = require('./nako3')
const { NakoImportError } = require('./nako_errors')
const NAKO_SCRIPT_RE = /^(なでしこ|nako|nadesiko)3?$/
const { setupEditor } = require('./wnako3_editor')
const PluginBrowser = require('./plugin_browser')

class WebNakoCompiler extends NakoCompiler {
  constructor () {
    super({ useBasicPlugin: true })
    this.__varslist[0]['ナデシコ種類'] = 'wnako3'
  }

  /**
   * ブラウザでtype="なでしこ"というスクリプトを得て実行する
   */
  runNakoScript () {
    // スクリプトタグの中身を得る
    let nakoScriptCount = 0
    const scripts = document.querySelectorAll('script')
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i]
      if (script.type.match(NAKO_SCRIPT_RE)) {
        nakoScriptCount++
        this.run(script.text, `script${i}.nako3`)
      }
    }
    console.log('実行したなでしこの個数=', nakoScriptCount)
  }

  /**
   * @this {WebNakoCompiler}
   * @param {string} code
   * @param {string} filename
   * @param {string} [preCode]
   * @param {Record<string, string>} [localFiles]
   * @returns {Promise<unknown>}
   */
  async loadDependencies (code, filename, preCode = '', localFiles = {}) {
    return this._loadDependencies(code, filename, preCode, {
      readJs: (filePath, token) => {
        // eslint-disable-next-line no-prototype-builtins
        if (localFiles.hasOwnProperty(filePath)) {
          return {
            sync: true,
            value: () => {
              // eslint-disable-next-line no-new-func
              Function(localFiles[filePath])()
              return {}
            }
          }
        }
        return {
          sync: false,
          value: (async () => {
            const res = await fetch(filePath)
            if (!res.ok) {
              throw new NakoImportError(`ファイル ${filePath} のダウンロードに失敗しました: ${res.status} ${res.statusText}`, token.line, token.file)
            }
            const text = await res.text()
            if (!text.includes('navigator.nako3.addPluginObject')) {
              throw new NakoImportError(`ファイル ${filePath} の中に文字列 "navigator.nako3.addPluginObject" が存在しません。現在、ブラウザ版のなでしこ言語v3は自動登録するプラグインのみをサポートしています。`, token.line, token.file)
            }
            // textの例: `navigator.nako3.addPluginObject('PluginRequireTest', { requiretest: { type: 'var', value: 100 } })`
            return () => {
              // プラグインの自動登録は navigator.nako3 を参照するため、 navigator.nako3 を一時的に現在のインスタンスにする。
              const globalNako3 = navigator.nako3
              navigator.nako3 = this
              try {
                // eslint-disable-next-line no-new-func
                Function(text)()
              } catch (err) {
                throw new NakoImportError(`プラグイン ${filePath} の取り込みに失敗: ${err instanceof Error ? err.message : err + ''}`, token.line, token.file)
              } finally {
                navigator.nako3 = globalNako3
              }
              return {}
            }
          })()
        }
      },
      readNako3: (filePath, token) => {
        // eslint-disable-next-line no-prototype-builtins
        if (localFiles.hasOwnProperty(filePath)) {
          return { sync: true, value: localFiles[filePath] }
        }
        return {
          sync: false,
          value: (async () => {
            const res = await fetch(filePath)
            if (!res.ok) {
              throw new NakoImportError(`ファイル ${filePath} のダウンロードに失敗しました: ${res.status} ${res.statusText}`, token.line, token.file)
            }
            return await res.text()
          })()
        }
      },
      resolvePath: (name, token) => {
        // ローカルにファイルが存在するならそれを使う。そうでなければURLとして解釈する。
        let pathname = name
        // eslint-disable-next-line no-prototype-builtins
        if (!localFiles.hasOwnProperty(name)) {
          try {
            pathname = new URL(name).pathname
          } catch (e) {
            // 単純にパスに変換できなければ、loccation.hrefを参考にパスを組み立てる
            try {
              const href_a = window.location.href.split('/')
              const href_dir = href_a.splice(0, href_a.length - 1).join('/');
              const href = href_dir + '/' + name
              pathname = new URL(href).pathname
            } catch (e) {
              throw new NakoImportError(`取り込み文の引数でパスが解決できません。https:// か http:// で始まるアドレスを指定してください。\n${e}`, token.line, token.file)
            }
          }
        }
        if (pathname.endsWith('.js') || pathname.endsWith('.js.txt')) {
          return { filePath: name, type: 'js' }
        }
        if (pathname.endsWith('.nako3') || pathname.endsWith('.nako3.txt')) {
          return { filePath: name, type: 'nako3' }
        }
        return { filePath: name, type: 'invalid' }
      }
    })
  }

  /**
   * type=なでしこ のスクリプトを自動実行するべきかどうかを返す
   * @returns {boolean} type=なでしこ のスクリプトを自動実行するべきかどうか
   */
  checkScriptTagParam () {
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
  setupEditor (idOrElement) {
    return setupEditor(idOrElement, this, /** @type {any} */(window).ace)
  }
}

// ブラウザなら navigator.nako3 になでしこを登録
if (typeof (navigator) === 'object' && !navigator.exportWNako3) {
  const nako3 = navigator.nako3 = new WebNakoCompiler()
  nako3.addPluginObject('PluginBrowser', PluginBrowser)
  window.addEventListener('DOMContentLoaded', (e) => {
    const isAutoRun = nako3.checkScriptTagParam()
    if (isAutoRun) { nako3.runNakoScript() }
  }, false)
} else { module.exports = WebNakoCompiler }
