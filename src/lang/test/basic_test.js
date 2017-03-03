const assert = require('assert');
const NakoCompiler = require('../src/nako3.js');

describe('basic', ()=>{
  const nako = new NakoCompiler();
  nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log("code=" + code);
    }
    assert.equal(nako.run_reset(code).log, res);
  };
  // --- test ---
  it('print', ()=> {
    cmp("3を表示","3");
    cmp("100を表示","100");
    cmp("0xFFを表示","255");
  });
  it('string', ()=> {
    cmp("「abc」を表示","abc");
    cmp("\"abc\"を表示","abc");
  });
  it('rawstring', ()=> {
    cmp("『abc』を表示","abc");
    cmp("'abc'を表示","abc");
  });
  it('exstring', ()=> {
    cmp("a=30;「abc{a}abc」を表示","abc30abc");
    cmp("a=30;「abc｛a｝abc」を表示","abc30abc");
  });
  it('string - LF', ()=> {
    cmp("a=30;「abc\nabc」を表示","abc\nabc");
  });
  it('システム定数', ()=> {
    assert.equal(nako.run_reset("ナデシコエンジンを表示").log, "nadesi.com/v3");
  });
});
