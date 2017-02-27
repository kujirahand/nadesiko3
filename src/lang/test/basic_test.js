const assert = require('assert');
const NakoCompiler = require('../src/nako3.js');

describe('basic', ()=>{
  const nako = new NakoCompiler();
  it('print', ()=> {
    assert.equal(nako.run_reset("3を表示").log, "3");
  });
  it('string', ()=> {
    assert.equal(nako.run_reset("「abc」を表示").log, "abc");
  });
  it('rawstring', ()=> {
    assert.equal(nako.run_reset("'abc'を表示").log, "abc");
  });
  it('exstring', ()=> {
    assert.equal(nako.run_reset("a=3;「abc{a}」を表示").log, "abc3");
    assert.equal(nako.run_reset("a=3;「abc｛a｝」を表示").log, "abc3");
    assert.equal(nako.run_reset("aaa=300;「abc{aaa}」を表示").log, "abc300");
  });
  it('string - lf', ()=> {
    assert.equal(nako.run_reset("「abc\ndef」を表示").log, "abc\ndef");
  });
});
