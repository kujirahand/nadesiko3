const TestEnv = require('./test_utils').TestEnv

describe('basic ajax', () => {
  const env = new TestEnv()
  before(function () {
    env.getEnv()
  })

  it('POSTデータ生成', () => {
    const code = `
パラメータは空オブジェクト。
パラメータ["KEY"]は、「VALUE」。
パラメータ["_X"]は、「XE^ZA」。
パラメータ["SPACE"]は、「 」。
パラメータをPOSTデータ生成して報告する。
`
    env.cmpReport(code, ['KEY=VALUE&_X=XE%5EZA&SPACE=%20'])
  })

  it('AJAXオプション設定', () => {
    const code = `
パラメータは空オブジェクト。
パラメータ["KEY"]は、「VALUE」。
パラメータにAJAXオプション設定する。
AJAXオプションを報告する。
`
    env.cmpReport(code, [{ KEY: 'VALUE' }])
  })

  it('AJAX送信時', (done) => {
    const code = '「/resources/ok.txt」へAJAX送信時には;対象を報告する;ここまで'
    env.waitCmpReport(done, code, ['OK'])
  })

  it('POST送信時', (done) => {
    const code = `
パラメータは空オブジェクト。
パラメータ["param1"]は、「data1^」。
パラメータ["param2"]は、「data2^^」。
パラメータを「/resources/ok.txt」へPOST送信時には
対象を報告する。
ここまで
`
    env.waitCmpReport(done, code, ['OK'])
  }).timeout(10000)

  it('AJAX送信', (done) => {
    const code = `
逐次実行
次に、「/resources/ok.txt」へAJAX送信する。
次に、対象を報告する。
ここまで
`
    env.waitCmpReport(done, code, ['OK'])
  })
})
