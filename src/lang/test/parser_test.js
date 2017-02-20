//
// parser test
//
const assert = require('assert');
const src = "../src";
const Tokenizer = require(`${src}/tokenizer.js`);
const Parser = require(`${src}/parser.js`);

describe('parser', ()=>{

  it('let', ()=> {
    const list = Tokenizer.split("a = 3");
    const ts = Tokenizer.listToString(list);
    assert.equal(ts, "a:WORD|=:EQ|3:NUM");
    const node = Parser.parse(list);
    const s = node.toStringAll();
    assert.equal(s, "BLOCK:*|LET:a|VALUE:3");
  });
  it('print', ()=> {
    const list = Tokenizer.split("30を表示");
    const node = Parser.parse(list);
    const s = node.toStringAll();
    assert.equal(s, "BLOCK:*|PRINT:|VALUE:30");
  });
  it('print with noise', ()=> {
    const list = Tokenizer.split("30を表示。\n");
    const node = Parser.parse(list);
    const s = node.toStringAll();
    assert.equal(s, "BLOCK:*|PRINT:|VALUE:30");
  });

});

