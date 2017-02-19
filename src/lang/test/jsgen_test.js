const assert = require('assert');
const Tokenizer = require('../src/tokenizer.js').Tokenizer;
const Parser = require('../src/parser.js').Parser;
const JSGenerator = require('../src/JSGenerator').JSGenerator;

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

});

