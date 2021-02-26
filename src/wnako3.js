// nadesiko for web browser
// wnako3.js
const NakoCompiler = require('./nako3')
const { NakoImportError } = require('./nako_errors')
const PluginBrowser = require('./plugin_browser')
const NAKO_SCRIPT_RE = /^(なでしこ|nako|nadesiko)3?$/
const { setupEditor } = require('./wnako3_editor')

class WebNakoCompiler extends NakoCompiler {
  constructor () {
    super()
    this.__varslist[0]['ナデシコ種類'] = 'wnako3'
  }

  /**
   * ブラウザでtype="なでしこ"というスクリプトを得て実行する
   */
  runNakoScript () {
    // スクリプトタグの中身を得る
    let nakoScriptCount = 0
    let scripts = document.querySelectorAll('script')
    for (let i = 0; i < scripts.length; i++) {
      let script = scripts[i]
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
  async loadDependencies(code, filename, preCode = '', localFiles = {}) {
    return super.loadDependencies(code, filename, preCode, {
      readJs: (filePath, token) => {
        if (localFiles.hasOwnProperty(filePath)) {
          return { sync: true, value: () => { window.eval(localFiles[filePath]); return {} } }
        }
        return {
          sync: false,
          value: (async () => {
            if (!filePath.startsWith('http://') && !filePath.startsWith('https://')) {
              throw new NakoImportError('ブラウザ版のなでしこの取り込み文の引数には https:// か http:// で始まるアドレスを指定してください。', token.line, token.file)
            }
            const res = await fetch(filePath)
            if (!res.ok) {
              throw new NakoImportError(`ファイル ${filePath} のダウンロードに失敗しました: ${res.status} ${res.statusText}`, token.line, token.file)
            }
            const text = await res.text()
            if (text.includes('navigator.nako3.addPluginObject')) {
              // textの例: `navigator.nako3.addPluginObject('PluginRequireTest', { requiretest: { type: 'var', value: 100 } })`
              return () => { window.eval(text); return {} }
            }
            throw new Error('ダウンロードしたファイルの中に文字列 "navigator.nako3.addPluginObject" が存在しません。現在、ブラウザ版のなでしこ言語v3は自動登録するプラグインのみをサポートしています。')
          })()
        }
      },
      readNako3: (filePath, token) => {
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
        if (!localFiles.hasOwnProperty(name)) {
          try {
            pathname = new URL(name).pathname
          } catch (e) {
            throw new NakoImportError(`ブラウザ版のなでしこの取り込み文の引数には、ローカルに存在するファイルか https:// か http:// で始まるアドレスを指定してください。\n${e}`, token.line, token.file)
          }
        }
        if (pathname.endsWith('.js') || pathname.endsWith('.js.txt')) {
          return { filePath: name, type: 'js' }
        }
        if (pathname.endsWith('.nako3') || pathname.endsWith('.nako3.txt')) {
          return { filePath: name, type: 'nako3' }
        }
        return { filePath: name, type: 'invalid' }
      },
    })
  }

  /**
   * type=なでしこ のスクリプトを自動実行するべきかどうかを返す
   * @returns {boolean} type=なでしこ のスクリプトを自動実行するべきかどうか
   */
  checkScriptTagParam () {
    let scripts = document.querySelectorAll('script')
    for (let i = 0; i < scripts.length; i++) {
      let script = scripts[i]
      let src = script.src || ''
      if (src.indexOf('wnako3.js?run') >= 0 || 
          src.indexOf('wnako3.js&run') >= 0) {
        return true
      }
    }
    return false
  }

  /**
   * コードを生成 (override)
   * @param ast AST
   * @param isTest テストかどうか
   * @returns {string} コード
   */
  generate(ast, isTest) {
    let code = super.generate(ast, isTest)

    if (isTest && code !== '') {
      code = '// mocha初期化\n' +
        'const stats = document.getElementById(\'mocha-stats\');\n' +
        'if(stats !== null) {\n' +
        ' document.getElementById(\'mocha\').removeChild(stats);\n' +
        '}\n' +
        'mocha.suite.suites = [];\n' +
        'mocha.setup("bdd");\n' +
        'mocha.growl();\n'+
        'mocha.checkLeaks();\n' +
        'mocha.cleanReferencesAfterRun(false);\n' +
        '\n' +
        code + '\n' +
        'mocha.run();// テスト実行\n'
    }

    return code
  }

  /**
   * 指定したidのHTML要素をなでしこ言語のエディタにする。
   * @param {string} id div要素のid
   * 
   * @see {setupEditor}
   */
  setupEditor(id) {
    return setupEditor(id, this, /** @type {any} */(window).ace)
  }
}

// ブラウザなら navigator.nako3 になでしこを登録
if (typeof (navigator) === 'object' && !navigator.exportWNako3) {
  const nako3 = navigator.nako3 = new WebNakoCompiler()
  nako3.addPluginObject('PluginBrowser', PluginBrowser)
  window.addEventListener('DOMContentLoaded', (e) => {
    const isAutoRun = nako3.checkScriptTagParam()
    if (isAutoRun) {nako3.runNakoScript()}
  }, false)
  window.addEventListener('beforeunload', (e) => {
    mocha.dispose()
  })
} else
  {module.exports = WebNakoCompiler}

