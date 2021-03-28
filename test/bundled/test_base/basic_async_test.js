const TestEnv = require('./test_utils').TestEnv

describe('basic async', () => {
  const env = new TestEnv()
  before( function () {
    env.getEnv()
  })

  it('同期タイマー', (done) => {
    const code = '' +
      '逐次実行\n' +
      '先に、0.01秒待機\n' +
      '次に、30を報告\n' +
      'ここまで。\n'
    env.waitCmpReport(done ,code, [30])
  })

})
