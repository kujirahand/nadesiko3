const assert = require('assert');
const NakoCompiler = require('../src/nako3.js');

describe('calc', ()=>{
  const nako = new NakoCompiler();
  it('basic', ()=> {
    assert.equal(nako.run_reset("3を表示").log, "3");
  });
  it('足し算', ()=> {
    assert.equal(nako.run_reset("3+5を表示").log, "8");
  });
  it('掛け算', ()=> {
    assert.equal(nako.run_reset("1+2*3を表示").log, "7");
  });
  it('連続演算：して', ()=> {
    assert.equal(nako.run_reset("3に5を足して表示").log, "8");
  });
  it('連続演算：て-3に5を掛けて表示', ()=> {
    assert.equal(nako.run_reset("3に5を掛けて表示").log, "15");
  });
  it('配列', ()=> {
    assert.equal(nako.run_reset("a=[];a[1]=30;a[1]を表示").log, "30");
  });
  it('ネスト配列', ()=> {
    assert.equal(nako.run_reset("a=[[1,2,3], [4,5,6]];a[1][1]を表示").log, "5");
  });
  it('オブジェクト', ()=> {
    assert.equal(nako.run_reset("a={};a['a']=30;a['a']を表示").log, "30");
  });
  it('もし', ()=> {
    assert.equal(nako.run_reset("もし3>1ならば「あ」と表示。").log, "あ");
    assert.equal(nako.run_reset("もし3<1ならば「あ」と表示。\n"+
      "違えば「い」と表示。").log, "い");
  });
});
