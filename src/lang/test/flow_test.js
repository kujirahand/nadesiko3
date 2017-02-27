const assert = require('assert');
const NakoCompiler = require('../src/nako3.js');

describe('calc', ()=>{
  const nako = new NakoCompiler();
  it('もし', ()=> {
    assert.equal(nako.run_reset("もし3>1ならば「あ」と表示。").log, "あ");
    assert.equal(nako.run_reset("もし3<1ならば「あ」と表示。\n"+
      "違えば「い」と表示。").log, "い");
  });
});
