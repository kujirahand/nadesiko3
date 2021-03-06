const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('error_test', () => {
  const nako = new NakoCompiler()
  // nako.logger.addSimpleLogger('trace')
  const cmp = (code, res) => {
    nako.logger.debug('code=' + code)
    assert.strictEqual(nako.runReset(code).log, res)
  }
  // --- test ---
  it('エラー処理 - 基本', () => {
    cmp('123を表示', '123')
    cmp('エラー監視;「hoge」のエラー発生;エラーならば;「ERR」と表示;ここまで', 'ERR')
  })
})
