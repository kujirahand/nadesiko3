const assert = require('assert');
const NakoCompiler = require('../src/nako3.js');

describe('PluginSystem test', ()=>{
  const nako = new NakoCompiler();
  nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log("code=" + code);
    }
    assert.equal(nako.run_reset(code).log, res);
  };
  // --- test ---
  it('ナデシコエンジンを表示', ()=> {
    cmp("ナデシコエンジンを表示", "nadesi.com/v3");
  });
  it('四則演算', ()=> {
    cmp("1に2を足して3を掛けて表示", "9");
    cmp("10を2で割って表示", "5");
    cmp("10を2で割った余り;それを表示", "0");
  });
  it('JS実行', ()=> {
    cmp("「3+6」をJS実行して表示", "9");
    cmp("「Math.floor(3.5)」をJS実行して表示", "3");
  });
  it('型変換', ()=> {
    cmp("「3.14」を文字列変換して表示", "3.14");
    cmp("「0xFF」を整数変換して表示", "255");
  });
  it('変数型確認', ()=> {
    cmp("30の変数型確認して表示。", "number");
  });
});

