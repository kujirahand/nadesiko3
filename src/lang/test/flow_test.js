const assert = require('assert');
const NakoCompiler = require('../src/nako3.js');

describe('flow', ()=>{
  const nako = new NakoCompiler();
  nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log("code=" + code);
    }
    assert.equal(nako.run_reset(code).log, res);
  };
  it('もし', ()=> {
    cmp("もし3>1ならば「あ」と表示。", "あ");
    cmp("もし3<1ならば「あ」と表示。\n"+
      "違えば「い」と表示。", "い");
  });
  it('回', ()=> {
    cmp("3回「あ」と表示。", "あ\nあ\nあ");
    cmp("A=3;(A)回、Aを表示。", "3\n3\n3");
  });
  it('の間', ()=> {
    cmp("N=3;(N>0)の間\nNを表示\nN=N-1\n---", "3\n2\n1");
  });
  it('繰り返す', ()=> {
    cmp("Nを1から3まで繰り返す\nNを表示\n---", "1\n2\n3");
  });
  it('連続計算', ()=> {
    cmp("3に5を足してNに代入;Nを表示", "8");
    cmp("3に5を足して2を掛けて表示", "16");
  });
});
