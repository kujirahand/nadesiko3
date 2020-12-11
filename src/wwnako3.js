// nadesiko for web browser worker
// wwnako3.js
const NakoCompiler = require('./nako3')
const NakoRequiePlugin = require('./nako_require_plugin_helper')
const NakoRequieNako3 = require('./nako_require_nako3_helper')
const PluginWebWorker = require('./plugin_webworker')
const NAKO_SCRIPT_RE = /^(なでしこ|nako|nadesiko)3?$/

class WebWorkerNakoCompiler extends NakoCompiler {
  constructor () {
    super()
    this.__varslist[0]['ナデシコ種類'] = 'wwnako3'
    this.beforeParseCallback = this.beforeParse
    this.requirePluginHelper = new NakoRequiePlugin(this)
    this.requireNako3Helper = new NakoRequieNako3(this)
    this.ondata = (data, event) => {
    }
  }

  requireNako3 (tokens, filepath, nako3) {
    const resolveNako3 = (filename, basepath) => {
      return filename
    }
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
          resolve(this.requireNako3Helper.affectRequireNako3(subtokens, filename, resolveNako3, importNako3))
        }).catch(err => {
          reject(err)
        })
      })
    }
    return this.requireNako3Helper.affectRequireNako3(tokens, filepath, resolveNako3, importNako3)
  }

  requirePlugin (tokens, nako3) {
    const filelist = this.requirePluginHelper.checkAndPickupRequirePlugin(tokens)
    if (filelist.length > 0) {
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
              eval(module)
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

    this.requireNako3Helper.reset()

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

const PluginWorker = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function(sys) {
    }
  },

  '対象イベント': {type:'const', value: ''}, // @たいしょういべんと
  '受信データ': {type:'const', value: ''}, // @たいしょういべんと

  'NAKOワーカーデータ受信時': { // @無名関数Fでなでしこv3エンジンに対してワーカーメッセージによりデータを受信した時に実行するイベントを設定。『受信データ』に受信したデータM。『対象イベント』にイベント引数。 // @NAKOわーかーでーたじゅしんしたとき
    type: 'func',
    josi: [['で']],
    fn: function (func, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      sys.ondata = (data, e) => {
        sys.__v0['受信データ'] = data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'ワーカーメッセージ受信時': { // @無名関数Fでselfに対してメッセージを受信した時に実行するイベントを設定。『受信データ』に受信したデータ。『対象イベント』にイベント引数。 // @わーかーめっせーじじゅしんしたとき
    type: 'func',
    josi: [['で']],
    fn: function (func, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      self.onmessage = (e) => {
        sys.__v0['受信データ'] = e.data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'NAKOワーカーデータ返信': { // @起動もとに固有の形式でデータを送信する。 // @NAKOわーかーでーたへんしん
    type: 'func',
    josi: [['を']],
    fn: function (data, sys) {
      const msg = {
        type: 'data',
        data: data
      }
      postMessage(msg)
    },
    return_none: true
  },
  'ワーカーメッセージ返信': { // @起動もとにメッセージを送信する。 // @わーかーめっせーじへんしん
    type: 'func',
    josi: [['を']],
    fn: function (msg, sys) {
      postMessage(msg)
    },
    return_none: true
  },
  '表示': { // @メインスレッドに固有の形式で表示データを送信する。 // @ひょうじ
    type: 'func',
    josi: [['を']],
    fn: function (data, sys) {
      const msg = {
        type: 'output',
        data: data
      }
      postMessage(msg)
    },
    return_none: true
  },
  '終了': { // @ワーカーを終了する。 // @しゅうりょう
    type: 'func',
    josi: [],
    fn: function (sys) {
      close()
    },
    return_none: true
  }
}

// ブラウザワーカーなら navigator.nako3 になでしこを登録
if (typeof (navigator) === 'object' && self && self instanceof WorkerGlobalScope) {
  const nako3 = navigator.nako3 = new WebWorkerNakoCompiler()
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
