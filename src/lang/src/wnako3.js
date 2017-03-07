// nadesiko for web browser
// wnako3.js

const NakoCompiler = require('./nako3');
const PluginBrowser = require('./plugin_browser');

// プラグインテストのため、後から呼び出す
// const PluginTurtle = require('./plugin_turtle');

class WebNakoCompiler extends NakoCompiler {
    /**
     * ブラウザでtype="なでしこ"というスクリプトを得て実行する
     */
    runNakoScript() {
        // スクリプトタグの中身を得る
        let scripts = document.querySelectorAll("script");
        for (let i = 0; i < scripts.length; i++) {
            let script = scripts[i];
            let type = script.type;
            if (type == "nako" || type == "なでしこ") {
                this.run(script.text);
            }
        }
    }
}

module.exports = WebNakoCompiler;

// ブラウザなら navigator.nako3 になでしこを登録
if (typeof(navigator) == "object") {
    const nako3 = navigator.nako3 = new WebNakoCompiler();
    nako3.addPluginObject('PluginBrowser', PluginBrowser);
    // nako3.addPluginObject('PluginTurtle', PluginTurtle);
}

