// nadesiko for web browser
// wnako3.js
const NakoCompiler = require('./nako3')
const NakoRequire = require('./nako_require_helper')
const PluginBrowser = require('./plugin_browser')
const NAKO_SCRIPT_RE = /^(なでしこ|nako|nadesiko)3?$/

class WebNakoCompiler extends NakoCompiler {
  constructor () {
    super()
    this.__varslist[0]['ナデシコ種類'] = 'wnako3'
    this.beforeParseCallback = this.beforeParse
    this.requireHelper = new NakoRequire(this)
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
        this.run(script.text)
      }
    }
    console.log('実行したなでしこの個数=', nakoScriptCount)
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

  requireNako3 (tokens, filepath, nako3) {
    const importNako3 = filename => {
      return new Promise((resolve, reject) => {
        fetch(filename, { mode: 'no-cors' })
        .then(res => {
          if (res.ok) {
            return res.text()
          }
          reject(new Error(`fail load nako3(${filename})`))
        }).then(txt => {
          const subtokens = nako3.rawtokenize(txt, 0, filename)
          resolve(this.requireHelper.affectRequire(subtokens, filename, this.requireHelper.resolveNako3forBrowser.bind(this.requireHelper), importNako3))
        }).catch(err => {
          reject(err)
        })
      })
    }
    return this.requireHelper.affectRequire(tokens, filepath, this.requireHelper.resolveNako3forBrowser.bind(this.requireHelper), importNako3)
  }

  requirePlugin (tokens, nako3) {
    if (this.requireHelper.pluginlist.length > 0) {
      const funclist = nako3.funclist
      const filelist = this.requireHelper.pluginlist
      return new Promise((allresolve, allreject) => {
        const pluginpromise = []
        filelist.forEach(filename => {
          pluginpromise.push(new Promise((resolve, reject) => {
            fetch(filename, { mode: 'no-cors' })
            .then(res => {
              if (res.ok) {
                return res.text()
              }
              reject(new Error(`fail load plugin(${filename})`))
            }).then(txt => {
              resolve(txt)
            }).catch(err => {
              reject(err)
            })
          }))
        })

        Promise.all(pluginpromise).then(modules => {
          modules.forEach(module => {
            if (/navigator\.nako3\.addPluginObject/.test(module)) {
              // for auto registration plugin, exetute only
              window.eval(module)
            } else
            if (/module\.exports\s*=/.test(module)) {
              // for commonjs structure plugin
              allreject(new Error('no suppout type plugin(commonjs)'))
            } else {
              allreject(new Error('no suppout type plugin(unknown)'))
            }
            /*
            // for module structure plugin, regist each expoted key
            Object.keys(module).forEach((key) => {
              console.log('[Plugin]' + key)
              nako3.addPluginObject(key, module[key])
            })
            */
          })
          allresolve(tokens)
        }).catch(err => {
          allreject(err)
        })
        //  throw new Error('no support dynamic import at browser envrionment')
      })
    }
    return tokens
  }

  // トークンリストからプラグインのインポートを抜き出して処理する
  beforeParse (opts) {
    const tokens = opts.tokens
    const nako3 = opts.nako3
    const filepath = opts.filepath

    this.requireHelper.reset()

    const rslt = this.requireNako3(tokens, filepath, nako3)
    if (rslt instanceof Promise) {
      return new Promise((resolve, reject) => {
        rslt.then(subtokens => {
          resolve(this.requirePlugin(subtokens, nako3))
        }).catch(err => {
          reject(err)
        })
      })
    } else {
      return this.requirePlugin(rslt, nako3)
    }
  }
}

// ブラウザなら navigator.nako3 になでしこを登録
if (typeof (navigator) === 'object') {
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

