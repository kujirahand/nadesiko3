// nadesiko for web browser worker
// wwnako3.js
const NakoCompiler = require('./nako3')
const NakoRequire = require('./nako_require_helper')
const PluginBrowserInWorker = require('./plugin_browser_in_worker')
const PluginWebWorker = require('./plugin_webworker')
const PluginWorker = require('./plugin_worker')
const NAKO_SCRIPT_RE = /^(なでしこ|nako|nadesiko)3?$/

class WebWorkerNakoCompiler extends NakoCompiler {
  constructor () {
    super()
    this.__varslist[0]['ナデシコ種類'] = 'wwnako3'
    this.beforeParseCallback = this.beforeParse
    this.requireHelper = new NakoRequire(this)
    this.ondata = (data, event) => {
    }
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

// ブラウザワーカーなら navigator.nako3 になでしこを登録
if (typeof (navigator) === 'object' && self && self instanceof WorkerGlobalScope) {
  const nako3 = navigator.nako3 = new WebWorkerNakoCompiler()
  nako3.addPluginObject('PluginBrowserInWorker', PluginBrowserInWorker)
  nako3.addPluginObject('PluginWebWorker', PluginWebWorker)
  nako3.addPluginObject('PluginWorker', PluginWorker)

  self.onmessage = (event) => {
    const nako3 = navigator.nako3
    const data = event.data || { type: '', data: '' }
    const type = data.type || ''
    const value = data.data || ''
    switch (type) {
      case 'reset':
        nako3.reset()
        break
      case 'close':
        self.close()
        break
      case 'run':
        nako3.run(value)
        break
      case 'data':
        if (nako3.ondata) {
          nako3.ondata.apply(nako3, [value, event])
        }
        break;
    }
  }
}
