const assert = require('assert');

const src = "../src";
const Tokenizer = require(`${src}/tokenizer.js`);
const Parser = require(`${src}/parser.js`);
const JSGenerator = require(`${src}/JSGenerator`);

describe('jsgen', ()=>{

  it('let', ()=> {
    const list = Tokenizer.split("a = 3");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__vars['a'] = 3;\n");
  });
  it('print', ()=> {
    const list = Tokenizer.split("30を表示");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__print(30);\n");
  });
  it('3+5', ()=> {
    const list = Tokenizer.split("3+5を表示");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__print((3+5));\n");
  });
  it('1+2*3', ()=> {
    const list = Tokenizer.split("1+2*3を表示");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__print((1+(2*3)));\n");
  });
  it('(1+2)*3', ()=> {
    const list = Tokenizer.split("(1+2)*3を表示");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__print(((1+2)*3));\n");
  });
  it('3<=5', ()=> {
    const list = Tokenizer.split("3<=5を表示");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__print((3<=5));\n");
  });
  it('MULTI LINE1', ()=> {
    const list = Tokenizer.split("1を表示\n2を表示");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__print(1);\n__print(2);\n");
  });
  it('MULTI LINE2', ()=> {
    const list = Tokenizer.split("1を表示;2を表示");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__print(1);\n__print(2);\n");
  });
  it('LET & PRINT', ()=> {
    const list = Tokenizer.split("A=1+2*3;Aを表示");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__vars['A'] = (1+(2*3));\n__print(__vars['A']);\n");
  });
  it('システム関数の実行', ()=> {
    const list = Tokenizer.split("A=3に5を足す;Aを表示");
    const node = Parser.parse(list);
    console.log("***" + node.toStringAll());
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__vars['A'] = (1+(2*3));\n__print(__vars['A']);\n");
  });
});

