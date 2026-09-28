import { assert } from './compare_util.js'

export default (nako) => {
  // ダイアログ方式を「ブラウザ」にして、ブラウザ標準のダイアログを使う場合を検証する (#2548)
  const runBrowserDialog = async (code) => {
    if (nako.logger && typeof nako.logger.clear === 'function') { nako.logger.clear() }
    return nako.runAsync('ダイアログ方式=「ブラウザ」\n' + code, 'main.nako3', { resetAll: true, resetEnv: true })
  }
  describe('言う', () => {
    const cmpalert = async (code, msg) => {
      const originalAlert = window.alert
      const calls = []
      window.alert = (...a) => { calls.push(a) }
      try {
        nako.logger.debug('code=' + code)
        await runBrowserDialog(code)
        assert.deepEqual(calls, [[msg]])
      } finally {
        window.alert = originalAlert
      }
    }
    it('言う', async () => {
      await cmpalert('「あいうえおか」を言う', 'あいうえおか')
    })
  })
  describe('尋ねる/文字尋ねる', () => {
    const cmpprompt = async (code, msg, rslt, res) => {
      const originalPrompt = window.prompt
      const calls = []
      window.prompt = (...a) => { calls.push(a); return rslt }
      try {
        nako.logger.debug('code=' + code)
        assert.strictEqual((await runBrowserDialog(code)).log, res)
        assert.deepEqual(calls, [[msg]])
      } finally {
        window.prompt = originalPrompt
      }
    }
    it('尋ねる - string', async () => {
      await cmpprompt('A=「から」を尋ねる;AをJSONエンコードして表示', 'から', null, '""')
      await cmpprompt('A=「かきくけこ」を尋ねる;AをJSONエンコードして表示', 'かきくけこ', 'abc', '"abc"')
      await cmpprompt('A=「あ」を尋ねる;AをJSONエンコードして表示', 'あ', '1..5', '"1..5"')
      await cmpprompt('A=「い」を尋ねる;AをJSONエンコードして表示', 'い', '1.2.3', '"1.2.3"')
      await cmpprompt('A=「う」を尋ねる;AをJSONエンコードして表示', 'う', '....', '"...."')
    })
    it('尋ねる - number', async () => {
      await cmpprompt('A=「あいうえおか」を尋ねる;AをJSONエンコードして表示', 'あいうえおか', '1.24', '1.24')
      await cmpprompt('A=「かききけこけ」を尋ねる;AをJSONエンコードして表示', 'かききけこけ', '20', '20')
      await cmpprompt('A=「ままみみむむ」を尋ねる;AをJSONエンコードして表示', 'ままみみむむ', '+23', '23')
      await cmpprompt('A=「さしすせそ」を尋ねる;AをJSONエンコードして表示', 'さしすせそ', '9007199254740991', '9007199254740991')
    })
    it('尋ねる - negative number', async () => {
      await cmpprompt('A=「さしすせ」を尋ねる;AをJSONエンコードして表示', 'さしすせ', '-10', '-10')
      await cmpprompt('A=「そ」を尋ねる;AをJSONエンコードして表示', 'そ', '-0.3', '-0.3')
    })
    it('尋ねる - zenkaku number', async () => {
      await cmpprompt('A=「とてとてとて」を尋ねる;AをJSONエンコードして表示', 'とてとてとて', '２０', '20')
      await cmpprompt('A=「りりりて」を尋ねる;AをJSONエンコードして表示', 'りりりて', '＋５．５５', '5.55')
      await cmpprompt('A=「てけり」を尋ねる;AをJSONエンコードして表示', 'てけり', '－０．３', '-0.3')
    })
    it('文字尋ねる - string', async () => {
      await cmpprompt('A=「から」を文字尋ねる;AをJSONエンコードして表示', 'から', null, '""')
      await cmpprompt('A=「かきくけこ」を文字尋ねる;AをJSONエンコードして表示', 'かきくけこ', 'abc', '"abc"')
      await cmpprompt('A=「あ」を文字尋ねる;AをJSONエンコードして表示', 'あ', '1..5', '"1..5"')
      await cmpprompt('A=「かききけこけ」を文字尋ねる;AをJSONエンコードして表示', 'かききけこけ', '20', '"20"')
      await cmpprompt('A=「あいうえおか」を文字尋ねる;AをJSONエンコードして表示', 'あいうえおか', '1.24', '"1.24"')
      await cmpprompt('A=「そ」を文字尋ねる;AをJSONエンコードして表示', 'そ', '-0.3', '"-0.3"')
    })
  })
  describe('二択', () => {
    const cmpconfirm = async (code, msg, rslt, res) => {
      const originalConfirm = window.confirm
      const calls = []
      window.confirm = (...a) => { calls.push(a); return rslt }
      try {
        nako.logger.debug('code=' + code)
        assert.strictEqual((await runBrowserDialog(code)).log, res)
        assert.deepEqual(calls, [[msg]])
      } finally {
        window.confirm = originalConfirm
      }
    }
    it('二択', async () => {
      await cmpconfirm('A=「これ」で二択;AをJSONエンコードして表示', 'これ', true, 'true')
      await cmpconfirm('A=「それ」で二択;AをJSONエンコードして表示', 'それ', false, 'false')
    })
  })
}
