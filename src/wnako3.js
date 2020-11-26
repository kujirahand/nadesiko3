// nadesiko for web browser
// wnako3.js
require('node-fetch')

const NakoCompiler = require('./nako3')
const NakoRequiePlugin = require('./nako_require_plugin_helper')
const PluginBrowser = require('./plugin_browser')
const NAKO_SCRIPT_RE = /^(なでしこ|nako|nadesiko)3?$/

class WebNakoCompiler extends NakoCompiler {
  constructor () {
    super()
    this.__varslist[0]['ナデシコ種類'] = 'wnako3'
    this.beforeParseCallback = this.beforeParse
    this.requirePlugin = new NakoRequiePlugin(this)
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

  // トークンリストからプラグインのインポートを抜き出して処理する
  beforeParse (opts) {
    const tokens = opts.tokens
    const filelist = this.requirePlugin.checkAndPickupRequirePlugin(tokens)
    if (filelist.length > 0) {
      return new Promise((allresolve, allreject) => {
        const nako3 = opts.nako3
        const pluginpromise = []
        filelist.forEach(filename => {
          pluginpromise.push(new Promise((resolve, reject) => {
            fetch(filename, { mode: 'no-cors' })
            .then(res => {
              if (res.ok) {
                return res.text()
              }
              reject(new Error('fail load plugin'))
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

