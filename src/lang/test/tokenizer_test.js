//
// tokenizer test
//
const assert = require('assert');
const Tokenizer = require('../src/tokenizer.js').Tokenizer;

describe('tokenizer', ()=>{

  it('calc1', ()=> {
    const list = Tokenizer.split("3 + 5");
    const s = Tokenizer.listToString(list);
    assert.equal(list.length, 3);
    assert.equal(s, "3:NUM|+:OP|5:NUM");
  });
  it('calc2', ()=> {
    const list = Tokenizer.split("3*5");
    const s = Tokenizer.listToString(list);
    assert.equal(list.length, 3);
    assert.equal(s, "3:NUM|*:OP|5:NUM");
  });
  it('calc3', ()=> {
    const list = Tokenizer.split("(1+2)*3");
    const s = Tokenizer.listToString(list);
    assert.equal(list.length, 7);
    assert.equal(s, "(:PAREN_BEGIN|1:NUM|+:OP|2:NUM|):PAREN_END|*:OP|3:NUM");
  });

  it('STRING', ()=> {
    const list = Tokenizer.split("「hoge」");
    const s = Tokenizer.listToString(list);
    assert.equal(list.length, 1);
    assert.equal(s, "hoge:STR");
  });
  
  it('COMMENT1', ()=> {
    const list = Tokenizer.split("「hoge」/* rem */");
    const s = Tokenizer.listToString(list);
    assert.equal(list.length, 1);
    assert.equal(s, "hoge:STR");
  });
  it('COMMENT2', ()=> {
    const list = Tokenizer.split("30\n#hoge\n30");
    const s = Tokenizer.listToString(list);
    assert.equal(list.length, 3);
    assert.equal(s, "30:NUM|\n:EOS|30:NUM");
  });
  it("sentence", () => {
    const list = Tokenizer.split("「a」と言う");
    const s = Tokenizer.listToString(list);
    assert.equal(list.length, 3);
    assert.equal(s, "a:STR|と:JOSI|言う:WORD");
  });
  it("if", () => {
    const list = Tokenizer.split("もし,Aが5以上ならば");
    const s = Tokenizer.listToString(list);
    assert.equal(s, "もし:IF|A:WORD|が:JOSI|5:NUM|以上:WORD|ならば:JOSI");
  });
  it("removeLastKana", () => {
    const fn = (n) => { return Tokenizer.removeLastKana(n); };
    assert.equal(fn("言う"), "言");
    assert.equal(fn("言いなさい"), "言");
    assert.equal(fn("繰り返す"), "繰返");
    assert.equal(fn("もしも"), "もしも");
  });
});

