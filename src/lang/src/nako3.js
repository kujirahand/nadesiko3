//
// nadesiko ver3
//
const NakoPeg = require('./nako_parser.js');
const NakoGen = require('./nako_gen.js');
const PluginSystem = require('./plugin_system.js');

class NakoCompiler {
    constructor() {
        this.debug = false;
        this.gen = new NakoGen();
        this.reset();
    }

    useDebug() {
        this.debug = true;
    }

    reset() {
        this.gen.clearPlugin();
        this.gen.addPlugin(PluginSystem);
        this.gen.clearLog();
    }

    addFunc(key, josi, fn) {
        this.gen.addFunc(key, josi, fn);
    }

    setFunc(key, fn) {
        this.gen.setFunc(key, fn);
    }

    getFunc(key) {
        return this.gen.getFunc(key);
    }

    parse(code) {
        // trim
        code = code.replace(/^\s+/, '')
            .replace(/\s+$/, '');
        // convert
        const ast = NakoPeg.parse(code + "\n");
        return ast;
    }

    generate(ast) {
        const js = this.gen.c_gen(ast);
        if (this.debug) {
            console.log("--- generate ---");
            console.log(js);
        }
        return js;
    }

    compile(code) {
        const ast = this.parse(code);
        if (this.debug) {
            console.log("--- ast ---");
            console.log(JSON.stringify(ast, null, 2));
        }
        const js = this.generate(ast);
        return js;
    }

    /** eval()実行前に直接JSのオブジェクトを取得する場合 */
    getVarsList() {
        const v = this.gen.getVarsList();
        return [v[0], {}];
    }

    /** 完全にJSのコードを取得する場合 */
    getVarsCode() {
        return this.gen.getVarsCode();
    }

    getHeader() {
        return this.gen.getHeader();
    }

    _run(code, is_reset) {
        if (is_reset) this.reset();
        const js = this.compile(code);
        var __varslist = this.getVarsList();
        var __vars = __varslist[1];
        eval(js);
        return this;
    }

    run(code) {
        return this._run(code, false);
    }

    run_reset(code) {
        return this._run(code, true);
    }

    get log() {
        let s = this.getFunc("__print_log").value;
        s = s.replace(/\s+$/, '');
        return s;
    }

    /** ブラウザでtype="なでしこ"というスクリプトを得て実行する */
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

    addPlugin(obj) {
        // なでしこのシステムにプラグインを登録
        this.gen.addPlugin(obj);
    }
}

// モジュールなら外部から参照できるように
module.exports = NakoCompiler;

// ブラウザなら navigator.nako3 になでしこを登録
if (typeof(navigator) == "object") {
    navigator.nako3 = new NakoCompiler();
}
