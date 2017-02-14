const Tokenizer = require('./tokenizer.js').Tokenizer;
var tok = new Tokenizer('3+5');
tok.tokenize();
console.log(tok._res);
