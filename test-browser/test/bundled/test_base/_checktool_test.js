const TestEnv = require('./test_utils').TestEnv

describe('browsers test', function () {

  const env = new TestEnv()
  before( function () {
    env.getEnv()
  })

  describe('check testtool', function () {

    it('context check', function () {
      env.checkEnv()
    })
    it('info check', function () {
      env.cmpInfo('「こんにちは」を表示する。', "こんにちは")
    })
    it('report check', function () {
      env.cmpReport('「こんにちは」を報告する。', ["こんにちは"])
    })
    it('error check', function () {
      env.cmpError('「こんにちは」を食べる。', {name: 'Error', message: /単語『食』が解決していません。/} )
    })
  })
})
