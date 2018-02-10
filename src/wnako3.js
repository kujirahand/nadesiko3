// nadesiko for web browser
// wnako3.js
const NakoCompiler = require('./nako3')
const PluginBrowser = require('./plugin_browser')
const NAKO_SCRIPT_RE = /^(なでしこ|nako|nadesiko)3?$/
class WebNakoCompiler extends NakoCompiler {
  /**
   * ブラウザでtype="なでしこ"というスクリプトを得て実行する
   */
  runNakoScript (scripts) {
    // スクリプトタグの中身を得る
    let nakoScriptCount = 0
    for (let i = 0; i < scripts.length; i++) {
      let script = scripts[i]
      if (script.type.match(NAKO_SCRIPT_RE)) {
        nakoScriptCount++
        this.run(script.text)
      }
    }
    console.log('実行したなでしこの個数=', nakoScriptCount)
  }

  checkScriptTagParam () {
    // src属性で、?runが指定されていれば、
    // type=なでしこ のスクリプトを自動実行する
    let scripts = document.querySelectorAll('script')
    for (let i = 0; i < scripts.length; i++) {
      let script = scripts[i]
      let src = script.src || ''
      if (src.indexOf('wnako3.js?run') >= 0) {
        this.runNakoScript(scripts)
        break
      }
    }
  }
}

// ブラウザなら navigator.nako3 になでしこを登録
if (typeof (navigator) === 'object') {
  const nako3 = navigator.nako3 = new WebNakoCompiler()
  nako3.addPluginObject('PluginBrowser', PluginBrowser)
  window.addEventListener('DOMContentLoaded', (e) => {
    nako3.checkScriptTagParam()
  }, false)
} else {
  module.exports = WebNakoCompiler
}
