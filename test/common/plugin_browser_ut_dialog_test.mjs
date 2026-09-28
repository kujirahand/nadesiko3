import PluginBrowser from '../../src/plugin_browser.mjs'
import assert from 'assert'

// ダイアログ方式を「ブラウザ」にして、ブラウザ標準のダイアログを使う場合の検証 (#2548)
const makeSys = () => {
  const v0 = new Map([['ダイアログキャンセル値', ''], ['ダイアログ方式', 'ブラウザ']])
  return { __v0: v0, __getSysVar: (key) => v0.get(key) }
}

describe('plugin_browser_dialog', () => {
  describe('言う', () => {
    const chkalert = async (args, msg) => {
      const calls = []
      global.window = {}
      global.window.alert = (...a) => { calls.push(a) }
      global.alert = global.window.alert
      await PluginBrowser['言'].fn(...args, makeSys())
      assert.deepEqual(calls, [[msg]])
    }
    it('言', async () => {
      await chkalert(['あいうえお'], 'あいうえお')
    })
  })
  describe('尋ねる', () => {
    const chkprompt = async (args, rtn, msg, res) => {
      const calls = []
      global.window = {}
      global.window.prompt = (...a) => { calls.push(a); return rtn }
      global.prompt = global.window.prompt
      assert.equal(await PluginBrowser['尋'].fn(args[0], args[1] || makeSys()), res)
      assert.deepEqual(calls, [[msg]])
    }
    it('尋 - 数値', async () => {
      await chkprompt(['あいうえお'], '2000', 'あいうえお', 2000)
      await chkprompt(['あいうえお'], '1.23', 'あいうえお', 1.23)
      await chkprompt(['あいうえお'], '３５６', 'あいうえお', 356)
      await chkprompt(['あいうえお'], '３．１４', 'あいうえお', 3.14)
    })
    it('尋 - 負数', async () => {
      await chkprompt(['あいうえお'], '-5', 'あいうえお', -5)
      await chkprompt(['あいうえお'], '-12.5', 'あいうえお', -12.5)
      await chkprompt(['あいうえお'], '－２０', 'あいうえお', -20)
      await chkprompt(['あいうえお'], '－１．９２', 'あいうえお', -1.92)
    })
    it('尋 - 数値以外', async () => {
      await chkprompt(['あいうえお'], 'abd', 'あいうえお', 'abd')
      await chkprompt(['あいうえお'], '123...456', 'あいうえお', '123...456')
      await chkprompt(['あいうえお'], '1.2.3', 'あいうえお', '1.2.3')
      await chkprompt(['あいうえお'], 'あかね', 'あいうえお', 'あかね')
    })
    it('尋 - キャンセル', async () => {
      const sys = makeSys()
      await chkprompt(['あいうえお', sys], null, 'あいうえお', '')
    })
  })
  describe('文字尋ねる', () => {
    const chkprompt = async (args, rtn, msg, res) => {
      const calls = []
      global.window = {}
      global.window.prompt = (...a) => { calls.push(a); return rtn }
      global.prompt = global.window.prompt
      assert.equal(await PluginBrowser['文字尋'].fn(args[0], args[1] || makeSys()), res)
      assert.deepEqual(calls, [[msg]])
    }
    it('文字尋 - 数字', async () => {
      await chkprompt(['あいうえお'], '2000', 'あいうえお', '2000')
      await chkprompt(['あいうえお'], '1.23', 'あいうえお', '1.23')
    })
    it('文字尋 - 負数の数字', async () => {
      await chkprompt(['あいうえお'], '-5', 'あいうえお', '-5')
      await chkprompt(['あいうえお'], '-12.5', 'あいうえお', '-12.5')
    })
    it('文字尋 - 数字以外', async () => {
      await chkprompt(['あいうえお'], 'abd', 'あいうえお', 'abd')
      await chkprompt(['あいうえお'], '123...456', 'あいうえお', '123...456')
      await chkprompt(['あいうえお'], '1.2.3', 'あいうえお', '1.2.3')
    })
    it('文字尋 - キャンセル', async () => {
      const sys = makeSys()
      await chkprompt(['あいうえお', sys], null, 'あいうえお', '')
    })
  })
  describe('二択', () => {
    const chkconfirm = async (args, rtn, msg, res) => {
      const calls = []
      global.window = {}
      global.window.confirm = (...a) => { calls.push(a); return rtn }
      global.confirm = global.window.confirm
      assert.equal(await PluginBrowser['二択'].fn(...args, makeSys()), res)
      assert.deepEqual(calls, [[msg]])
    }
    it('二択', async () => {
      await chkconfirm(['あいうえお'], true, 'あいうえお', true)
      await chkconfirm(['あいうえお'], false, 'あいうえお', false)
    })
  })
})
