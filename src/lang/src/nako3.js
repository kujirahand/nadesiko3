//
// nadesiko ver3
//
const NakoPeg = require('./nako_parser.js');
const NakoGen = require('./nako_gen.js');

class NakoCompiler {
  constructor() {
    this.debug = false;
    this.gen = new NakoGen();
    this.reset();
  }
  useDebug() { this.debug = true; }
  reset() {
    this.gen.clearLog();
  }
  addFunc(key, josi, fn) {
    this.gen.addFunc(key, josi, fn);
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
      console.log("--- ast ---");
      console.log(ast);
      console.log("--- generate ---");
      console.log(js);
    }
    return js;
  }
  compile(code) {
    const ast = this.parse(code);
    const js = this.generate(ast);
    return js;
  }
  run(code) {
    const js = this.compile(code);
    const __vars = this.gen.getVars();
    eval(js);
    return this;
  }
  run_reset(code) {
    this.reset();
    const js = this.compile(code);
    const __vars = this.gen.getVars();
    eval(js);
    return this;
  }
  get log() {
    let s = this.getFunc("__print_log");
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
      if (type == "nako" || type =="なでしこ") {
        this.run(script.text);
      }
    }
  }
  readPlugin(obj) {
    // TODO: なでしこのシステムにプラグインを登録
  }
}

// モジュールなら外部から参照できるように
module.exports = NakoCompiler;

// ブラウザなら navigator.nako3 になでしこを登録
if (typeof(navigator) == "object") {
  navigator.nako3 = new NakoCompiler();
}




