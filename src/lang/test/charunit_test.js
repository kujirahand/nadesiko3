const assert = require('assert');
const charunit = require('../src/charunit.js');

describe('charunit', ()=>{
  it('isWord', ()=> {
    assert.equal(charunit.isWord('あ'), true);
    assert.equal(charunit.isWord('a'), true);
    assert.equal(charunit.isWord('_'), true);
    assert.equal(charunit.isWord('言'), true);
    assert.equal(charunit.isWord('#'), false);
    assert.equal(charunit.isWord('+'), false);
    assert.equal(charunit.isWord(' '), false);
  });
});