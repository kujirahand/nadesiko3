const assert = require('assert');
const NakoCompiler = require('../src/nako3.js');

describe('func_test', ()=>{
  const nako = new NakoCompiler();
  //nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log("code=" + code);
    }
    assert.equal(nako.run_reset(code).log, res);
  };
  // --- test ---
  it('def_func no arg', ()=> {
    cmp("●HOGE()\n「あ」と表示\n---\nHOGE。", "あ");
  });
  it('def_func with arg', ()=> {
    cmp("●HOGE(Aに)\nAと表示\n---\n「姫」にHOGE。", "姫");
  });
  it('def_func with arg3', ()=> {
    cmp("●踊る(AとBがCを)\n「{A}:{B}:{C}」と表示\n---\n「姫」と「殿」が「タンゴ」を踊る。", "姫:殿:タンゴ");
  });
  it('def_func has return', ()=> {
    cmp("●加算(AにBを)\n(A+B)で戻る\n---\n2に3を加算して表示。", "5");
  });
});

