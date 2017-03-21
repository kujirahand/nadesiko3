// nadesiko for web browser
// wnako3.js
const NakoCompiler = require('./nako3')
const PluginBrowser = require('./plugin_browser')

class WebNakoCompiler extends NakoCompiler {
    /**
     * ブラウザでtype="なでしこ"というスクリプトを得て実行する
     */
  runNakoScript () {
        // スクリプトタグの中身を得る
    let scripts = document.querySelectorAll('script')
    for (let i = 0; i < scripts.length; i++) {
      let script = scripts[i]
      let type = script.type
      if (type === 'nako' || type === 'なでしこ') {
        this.run(script.text)
      }
    }
  }

  checkScriptTagParam () {
        // src属性で、?runが指定されていれば、
        // type=なでしこ のスクリプトを自動実行する
    let scripts = document.querySelectorAll('script')
    for (let i = 0; i < scripts.length; i++) {
      let script = scripts[i]
      let src = script.src || ''
      if (src.indexOf('wnako3.js?run') >= 0) {
        this.runNakoScript()
        break
      }
    }
  }
}

module.exports = WebNakoCompiler

// ブラウザなら navigator.nako3 になでしこを登録
if (typeof (navigator) === 'object') {
  const nako3 = navigator.nako3 = new WebNakoCompiler()
  nako3.addPluginObject('PluginBrowser', PluginBrowser)
  setTimeout(() => {
    nako3.checkScriptTagParam()
  }, 1)
}
