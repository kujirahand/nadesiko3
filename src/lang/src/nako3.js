//
// nadesiko ver3
//

// なでしこのグローバル変数
const __vars = {};
let __print = (msg) => {
  console.log(msg);
};

if (typeof(navigator) == "object") {
  setTimeout(()=>{
    nako3_browser();
  },1);
}

function nako3_browser(){
  // 書き換え
  __print = (msg) => {
    const e = document.getElementById("info");
    e.innerHTML += msg;
  };
  // スクリプトタグの中身を得る
  let scripts = document.querySelectorAll("script");
  for (let i = 0; i < scripts.length; i++) {
    let script = scripts[i];
    let type = script.type;
    if (type == "nako" || type =="なでしこ") {
      nako3_browser_run_script(script);
    }
  }
}

function nako3_browser_run_script(script) {
  let code = script.text;
  let type = script.type;
  let option = script.option;
  nako3_run(code);
}

function nako3_run(code) {
  console.log("今作ってます。");
  //
  const Tokenizer = require('./tokenizer.js').Tokenizer;
  const Parser = require('../src/parser.js').Parser;
  const JSGenerator = require('../src/JSGenerator').JSGenerator;
  //
  const list = Tokenizer.split(code);
  const node = Parser.parse(list);
  const js = JSGenerator.generate(node, false);
  console.log(js);
  eval(js);
}


