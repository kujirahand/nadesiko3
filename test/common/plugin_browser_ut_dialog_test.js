const td = require('testdouble')
const assert = require('assert').strict
const PluginBrowser = require('../../src/plugin_browser')

describe('plugin_browser_dialog', () => {
  describe('言う', () => {
    const chkalert = (args, msg) => {
      const fakeAlert = td.func('alert')
      td.when(fakeAlert(msg)).thenReturn(undefined)
      global.window = {}
      global.window.alert = fakeAlert
      global.alert = fakeAlert
      PluginBrowser['言'].fn.apply(this, args)
      td.verify(fakeAlert(td.matchers.anything()), { times: 1 })
      td.reset()
    }
    it('言', () => {
      chkalert(['あいうえお'], 'あいうえお')
    })
  })
  describe('尋ねる', () => {
    const chkprompt = (args, rtn, msg, res) => {
      const fakePrompt = td.func('prompt')
      td.when(fakePrompt(msg)).thenReturn(rtn)
      global.window = {}
      global.window.prompt = fakePrompt
      global.prompt = fakePrompt
      assert.equal(PluginBrowser['尋'].fn.apply(this, args), res)
      td.verify(fakePrompt(td.matchers.anything()), { times: 1 })
      td.reset()
    }
    it('尋 - 数値', () => {
      chkprompt(['あいうえお'], '2000', 'あいうえお', 2000)
      chkprompt(['あいうえお'], '1.23', 'あいうえお', 1.23)
      chkprompt(['あいうえお'], '３５６', 'あいうえお', 356)
      chkprompt(['あいうえお'], '３．１４', 'あいうえお', 3.14)
    })
    it('尋 - 負数', () => {
      chkprompt(['あいうえお'], '-5', 'あいうえお', -5)
      chkprompt(['あいうえお'], '-12.5', 'あいうえお', -12.5)
      chkprompt(['あいうえお'], '－２０', 'あいうえお', -20)
      chkprompt(['あいうえお'], '－１．９２', 'あいうえお', -1.92)
    })
    it('尋 - 数値以外', () => {
      chkprompt(['あいうえお'], 'abd', 'あいうえお', 'abd')
      chkprompt(['あいうえお'], '123...456', 'あいうえお', '123...456')
      chkprompt(['あいうえお'], '1.2.3', 'あいうえお', '1.2.3')
      chkprompt(['あいうえお'], 'あかね', 'あいうえお', 'あかね')
    })
    it('尋 - キャンセル', () => {
      const sys = { __v0: { 空: '' } }
      chkprompt(['あいうえお', sys], null, 'あいうえお', '')
    })
  })
  describe('文字尋ねる', () => {
    const chkprompt = (args, rtn, msg, res) => {
      const fakePrompt = td.func('prompt')
      td.when(fakePrompt(msg)).thenReturn(rtn)
      global.window = {}
      global.window.prompt = fakePrompt
      global.prompt = fakePrompt
      assert.equal(PluginBrowser['文字尋'].fn.apply(this, args), res)
      td.verify(fakePrompt(td.matchers.anything()), { times: 1 })
      td.reset()
    }
    it('文字尋 - 数字', () => {
      chkprompt(['あいうえお'], '2000', 'あいうえお', '2000')
      chkprompt(['あいうえお'], '1.23', 'あいうえお', '1.23')
    })
    it('文字尋 - 負数の数字', () => {
      chkprompt(['あいうえお'], '-5', 'あいうえお', '-5')
      chkprompt(['あいうえお'], '-12.5', 'あいうえお', '-12.5')
    })
    it('文字尋 - 数字以外', () => {
      chkprompt(['あいうえお'], 'abd', 'あいうえお', 'abd')
      chkprompt(['あいうえお'], '123...456', 'あいうえお', '123...456')
      chkprompt(['あいうえお'], '1.2.3', 'あいうえお', '1.2.3')
    })
    it('文字尋 - キャンセル', () => {
      const sys = { __v0: { 空: '' } }
      chkprompt(['あいうえお', sys], null, 'あいうえお', '')
    })
  })
  describe('二択', () => {
    const chkconfirm = (args, rtn, msg, res) => {
      const fakeConfirm = td.func('confirm')
      td.when(fakeConfirm(msg)).thenReturn(rtn)
      global.window = {}
      global.window.confirm = fakeConfirm
      global.confirm = fakeConfirm
      assert.equal(PluginBrowser['二択'].fn.apply(this, args), res)
      td.verify(fakeConfirm(td.matchers.anything()), { times: 1 })
      td.reset()
    }
    it('二択', () => {
      chkconfirm(['あいうえお'], true, 'あいうえお', true)
      chkconfirm(['あいうえお'], false, 'あいうえお', false)
    })
  })
})
