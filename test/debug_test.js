const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('debug', () => {
  const nako = new NakoCompiler()
  // nako.logger.addSimpleLogger('trace')
  const cmp = (code, res) => {
    nako.logger.debug('code=' + code)
    assert.strictEqual(nako.runReset(code).log, res)
  }
  // --- test ---
  it('print simple', () => {
    cmp('/* aaa */\n3を表示\n2*3を表示', '3\n6')
    // cmp("/* a\n */\n3を表示\n「テスト」でエラー発生。", "3\n6");
  })
})
