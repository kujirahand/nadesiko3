// nadesiko for web browser worker
// wwnako3.js
const NakoCompiler = require('./nako3')
const PluginBrowserInWorker = require('./plugin_browser_in_worker')
const PluginWorker = require('./plugin_worker')

class WebWorkerNakoCompiler extends NakoCompiler {
  constructor () {
    super()
    this.__varslist[0]['ナデシコ種類'] = 'wwnako3'
    this.ondata = (data, event) => {
    }
  }
}

// ブラウザワーカーなら navigator.nako3 になでしこを登録
if (typeof (navigator) === 'object' && self && self instanceof WorkerGlobalScope) {
  const nako3 = navigator.nako3 = new WebWorkerNakoCompiler()
  nako3.addPluginObject('PluginBrowserInWorker', PluginBrowserInWorker)
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
        nako3.runEx(value, undefined, {resetEnv: false, resetLog: false})
        break
      case 'trans':{
          const codes = []
          value.forEach(o => {
            if (o.type === 'func') {
              nako3.gen.nako_func[o.name] = o.content.meta
              nako3.funclist[o.name] = o.content.func
              nako3.__varslist[1][o.name] = () => {}
            } else
            if (o.type === 'val') {
              nako3.__varslist[2][o.name] = o.content
            }
          })
        }
        break
      case 'data':
        if (nako3.ondata) {
          nako3.ondata.apply(nako3, [value, event])
        }
        break;
    }
  }
}
