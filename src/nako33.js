/**
 * nadesiko v3 (demo version)
 */
const Parser = require('./nako_parser3')
const Lexer = require('./nako_lexer')
const Prepare = require('./nako_prepare')

const prepare = new Prepare()
const parser = new Parser()
const lexer = new Lexer()

class NakoCompiler {
  constructor () {
    this.silent = true
    this.funclist = {}
    //
  }
  compile (src) {
    src = prepare.convert(src)
    lexer.setFuncList(this.funclist)
    parser.setFuncList(this.funclist)
    const tokens = lexer.setInput(src)
    const node = parser.parse(tokens)
    console.log(JSON.stringify(node, null, 2))
  }
  addFunc (name, josi, callback) {
    this.funclist[name] = {
      josi: josi,
      fn: callback
    }
  }
}

module.exports = NakoCompiler
// test
const c = new NakoCompiler()
c.addFunc('表示', [['を', 'と']], (e) => console.log(e))
c.addFunc('加算', [['と', 'に'], ['を']], (a, b) => a + b)
c.compile('\nA=「abc」\nB=30\n;;;\n')
