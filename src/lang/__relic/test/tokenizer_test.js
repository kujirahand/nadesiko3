//
// tokenizer test
//
const assert = require('assert');
const src = "../src";
const Tokenizer = require(`${src}/tokenizer.js`);
const Token = require(`${src}/token.js`);
const tokens = require(`${src}/tokens.js`);

describe('tokenizer', ()=>{
  it("Token.isType", ()=> {
    const t = new Token(tokens.NUM, 300);
    assert.equal(true, t.isType([tokens.NUM]));
    assert.equal(false, t.isType([tokens.STR]));
    assert.equal(true, t.isType([tokens.STR, tokens.NUM]));
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
    assert.equal(s, "30:NUM|\n:EOL|30:NUM");
  });
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
  it('calc4', ()=> {
    const list = Tokenizer.split("3 <= 5");
    const s = Tokenizer.listToString(list);
    assert.equal(s, "3:NUM|<=:OP|5:NUM");
  });
  it('STRING', ()=> {
    const list = Tokenizer.split("「hoge」");
    const s = Tokenizer.listToString(list);
    assert.equal(list.length, 1);
    assert.equal(s, "hoge:STR");
  });
  
  it("sentence", () => {
    const list = Tokenizer.split("「a」と言う");
    const s = Tokenizer.listToString(list);
    assert.equal(list.length, 3);
    assert.equal(s, "a:STR|と:JOSI|言う:WORD");
  });
  it('PRINT1', ()=> {
    const list = Tokenizer.split("30を表示");
    const s = Tokenizer.listToString(list);
    assert.equal(s, "30:NUM|を:JOSI|表示:PRINT");
  });
  it("PRINT2", () => {
    const list = Tokenizer.split("\n\n「a」と表示\n");
    const s = Tokenizer.listToString(list);
    assert.equal(s, "\n:EOL|\n:EOL|a:STR|と:JOSI|表示:PRINT|\n:EOL");
  });
  it("PRINT3-with noise", () => {
    const list = Tokenizer.split("    \t 「a」と表示。\t    ");
    const s = Tokenizer.listToString(list);
    assert.equal(s, "a:STR|と:JOSI|表示:PRINT|;:EOL");
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

