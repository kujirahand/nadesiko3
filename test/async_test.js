const assert = require('assert')
const Nako3Assert = require('../src/nako3_assert.js')

describe('async_test', () => {
  const debug = false
  const nako3 = new Nako3Assert()
  nako3.debug = debug
  const cmp = (code, exRes) => {
    const result = nako3.runReset(code).log
    assert.equal(result, exRes)
  }
  const exe = (code) => {
    nako3.runReset(code)
  }

  // assert test
  it('アサート自体のテスト', () => {
    exe('3と3でテスト。')
    cmp('3を表示', '3')
  })

  // --- async ---
  it('async_simple', () => {
    exe(
      '逐次実行\n' +
      '先に、1と表示\n' +
      '次に、2と表示\n' +
      '次に、表示ログと「1\n2\n」でテスト。\n' +
      'ここまで。\n'
    )
  })
  it('async_multiple', () => {
    exe(
      '逐次実行\n' +
      '先に\n' +
      '  1と表示\n' +
      '  2と表示\n' +
      'ここまで\n' +
      '次に、3と表示\n' +
      '次に、表示ログと「1\n2\n3\n」でテスト。\n' +
      'ここまで。\n'
    )
  })
})
