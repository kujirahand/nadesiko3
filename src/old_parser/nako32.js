const Parser = require('./nako_parser2').Parser
const Lexer = require('./nako_lexer')
const Prepare = require('./nako_prepare')

const prepare = new Prepare()
const parser = new Parser()
const lexer = new Lexer()
parser.lexer = lexer

class NakoCompiler {
  constructor () {
    this.silent = true
    //
  }
  compile (src) {
    src = prepare.convert(src)
    try {
      const node = parser.parse(src)
      console.log(JSON.stringify(node, null, 2))
    } catch (e) {
      console.log(e)
      if (e.hash.expected) {
        const expected = e.hash.expected.join(',')
        throw new Error(
          `構文エラー(${e.hash.line}): ` +
          `『${e.hash.token}』がありましたが、` +
          `次を期待: ${expected}`)
      } else {
        throw new Error(
          `エラー(${e.hash.line}): ` +
          `予期せぬ『${e.hash.token}』。`)
      }
    }
  }
}

module.exports = NakoCompiler
// test
const c = new NakoCompiler()
c.compile('\nA=5')
