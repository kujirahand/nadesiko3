//
// nadesiko ver3
//
const NakoPeg = require('./nako_parser.js');
const NakoGen = require('./nako_gen.js');
const PluginSystem = require('./plugin_system.js');

class NakoCompiler {
    constructor() {
        this.debug = false;
        this.silent = true;
        this.gen = new NakoGen(this);
        this.gen.addPlugin(PluginSystem);
        this.reset();
    }

    /**
     * デバッグモードに設定する
     */
    useDebug() {
        this.debug = true;
    }

    reset() {
        if (!this.__varslist) { // 初回
            this.__varslist = [{}, {}, {}];
            this.__self = this;
        } else { // 二回目以降
            this.__varslist = [this.__varslist[0], {}, {}];
        }
        this.__vars = this.__varslist[2];
        this.clearLog();
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
        const def = this.gen.getDefFuncCode();
        if (this.debug) {
            console.log("--- generate ---");
            console.log(def + js);
        }
        return def + js;
    }

    /**
     * プログラムをコンパイルしてJavaScriptのコードを返す
     */
    compile(code) {
        const ast = this.parse(code);
        if (this.debug) {
            console.log("--- ast ---");
            console.log(JSON.stringify(ast, null, 2));
        }
        // generate
        const js = this.generate(ast);
        return js;
    }

    /**
     * eval()実行前に直接JSのオブジェクトを取得する場合
     * @returns {*}
     */
    getVarsList() {
        const v = this.gen.getVarsList();
        return [v[0], v[1], {}];
    }

    /**
     * 完全にJSのコードを取得する場合
     * @returns {*}
     */
    getVarsCode() {
        return this.gen.getVarsCode();
    }

    getHeader() {
        return this.gen.getHeader();
    }

    _run(code, is_reset) {
        if (is_reset) this.reset();
        const js = this.compile(code);
        var __varslist = this.__varslist = this.getVarsList();
        var __vars = this.__vars = this.__varslist[2];
        var __self = this.__self;
        if (is_reset) this.clearLog();
        eval(js);
        return this;
    }

    run(code) {
        return this._run(code, false);
    }

    run_reset(code) {
        return this._run(code, true);
    }

    clearLog() {
        this.__varslist[0]["表示ログ"] = "";
    }

    get log() {
        var s = this.__varslist[0]["表示ログ"];
        s = s.replace(/\s+$/, '');
        return s;
    }

    /**
     * プラグイン・オブジェクトを追加(ブラウザ向け)
     * @param name プラグインの名前
     * @param po プラグイン・オブジェクト
     */
    addPluginObject(name, po) {
        this.gen.addPluginObject(name, po);
    }

    /**
     * プラグイン・ファイルを追加(Node.js向け)
     * @param objName オブジェクト名を登録
     * @param path 取り込むモジュールのファイルパス
     * @param po 登録するオブジェクト
     */
    addPluginFile(objName, path, po) {
        this.gen.addPluginFile(objName, path, po);
    }
}

// モジュールなら外部から参照できるように
module.exports = NakoCompiler;
