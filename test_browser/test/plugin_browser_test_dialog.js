import * as td from 'testdouble'
import { assert } from './compare_util'

export default (nako) => {
  describe('言う', () => {
    const cmpalert = (code, msg) => {
      const windowalert = td.replace(window, 'alert')
      td.when(windowalert(msg)).thenReturn(undefined)
      if (nako.debug) {
        console.log('code=' + code)
      }
      nako.runReset(code)
      td.verify(windowalert(td.matchers.anything()), { times: 1 })
      td.reset()
    }
    it('言う', () => {
      cmpalert('「あいうえおか」を言う', 'あいうえおか')
    })
  })
  describe('尋ねる/文字尋ねる', () => {
    const cmpprompt = (code, msg, rslt, res) => {
      const windowprompt = td.replace(window, 'prompt')
      td.when(windowprompt(msg)).thenReturn(rslt)
      if (nako.debug) {
        console.log('code=' + code)
      }
      assert.equal(nako.runReset(code).log, res)
      td.verify(windowprompt(td.matchers.anything()), { times: 1 })
      td.reset()
    }
    it('尋ねる - string', () => {
      cmpprompt('A=「から」を尋ねる;AをJSONエンコードして表示', 'から', null, '""')
      cmpprompt('A=「かきくけこ」を尋ねる;AをJSONエンコードして表示', 'かきくけこ', 'abc', '"abc"')
      cmpprompt('A=「あ」を尋ねる;AをJSONエンコードして表示', 'あ', '1..5', '"1..5"')
      cmpprompt('A=「い」を尋ねる;AをJSONエンコードして表示', 'い', '1.2.3', '"1.2.3"')
      cmpprompt('A=「う」を尋ねる;AをJSONエンコードして表示', 'う', '....', '"...."')
    })
    it('尋ねる - number', () => {
      cmpprompt('A=「あいうえおか」を尋ねる;AをJSONエンコードして表示', 'あいうえおか', '1.24', '1.24')
      cmpprompt('A=「かききけこけ」を尋ねる;AをJSONエンコードして表示', 'かききけこけ', '20', '20')
      cmpprompt('A=「ままみみむむ」を尋ねる;AをJSONエンコードして表示', 'ままみみむむ', '+23', '23')
      cmpprompt('A=「さしすせそ」を尋ねる;AをJSONエンコードして表示', 'さしすせそ', '9007199254740991', '9007199254740991')
    })
    it('尋ねる - negative number', () => {
      cmpprompt('A=「さしすせ」を尋ねる;AをJSONエンコードして表示', 'さしすせ', '-10', '-10')
      cmpprompt('A=「そ」を尋ねる;AをJSONエンコードして表示', 'そ', '-0.3', '-0.3')
    })
    it('尋ねる - zenkaku number', () => {
      cmpprompt('A=「とてとてとて」を尋ねる;AをJSONエンコードして表示', 'とてとてとて', '２０', '20')
      cmpprompt('A=「りりりて」を尋ねる;AをJSONエンコードして表示', 'りりりて', '＋５．５５', '5.55')
      cmpprompt('A=「てけり」を尋ねる;AをJSONエンコードして表示', 'てけり', '－０．３', '-0.3')
    })
    it('文字尋ねる - string', () => {
      cmpprompt('A=「から」を文字尋ねる;AをJSONエンコードして表示', 'から', null, '""')
      cmpprompt('A=「かきくけこ」を文字尋ねる;AをJSONエンコードして表示', 'かきくけこ', 'abc', '"abc"')
      cmpprompt('A=「あ」を文字尋ねる;AをJSONエンコードして表示', 'あ', '1..5', '"1..5"')
      cmpprompt('A=「かききけこけ」を文字尋ねる;AをJSONエンコードして表示', 'かききけこけ', '20', '"20"')
      cmpprompt('A=「あいうえおか」を文字尋ねる;AをJSONエンコードして表示', 'あいうえおか', '1.24', '"1.24"')
      cmpprompt('A=「そ」を文字尋ねる;AをJSONエンコードして表示', 'そ', '-0.3', '"-0.3"')
    })
  })
  describe('二択', () => {
    const cmpconfirm = (code, msg, rslt, res) => {
      const windowconfirm = td.replace(window, 'confirm')
      td.when(windowconfirm(msg)).thenReturn(rslt)

      if (nako.debug) {
        console.log('code=' + code)
      }
      assert.equal(nako.runReset(code).log, res)
      td.verify(windowconfirm(td.matchers.anything()), { times: 1 })
      td.reset()
    }
    it('二択', () => {
      cmpconfirm('A=「これ」で二択;AをJSONエンコードして表示', 'これ', true, 'true')
      cmpconfirm('A=「それ」で二択;AをJSONエンコードして表示', 'それ', false, 'false')
    })
  })
}
