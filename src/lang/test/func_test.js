const assert = require('assert');
const NakoCompiler = require('../src/nako3.js');

describe('func_test', ()=>{
  const nako = new NakoCompiler();
  nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log("code=" + code);
    }
    assert.equal(nako.run_reset(code).log, res);
  };
  it('def_func', ()=> {
    cmp("●HOGE()\n「あ」と表示\n---\nHOGE。", "あ");
  });
});

