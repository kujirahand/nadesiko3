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
    console.log("***" + node.toStringAll());
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__print(((1+2)*3));\n");
  });
  it('3<=5', ()=> {
    const list = Tokenizer.split("3<=5を表示");
    const node = Parser.parse(list);
    const code = JSGenerator.generate(node, false);
    assert.equal(code, "__print((3<=5));\n");
  });
});

