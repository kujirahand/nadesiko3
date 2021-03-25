const td = require('testdouble')
const assert = require('assert').strict
const PluginBrowser = require('../../src/plugin_browser')

describe('plugin_browser_location', () => {
  describe('location-url', () => {
    const chkurl = (args, res) => {
      global.window = {}
      global.window.location = {}
      global.window.location.href = ''
      PluginBrowser['ブラウザ移動'].fn.apply(this, args)
      assert.equal(global.window.location.href, res)
    }
    it('ブラウザ移動', () => {
      chkurl(['http://url'], 'http://url')
    })
  })
  describe('history-back', () => {
    const chkback = (args, msg) => {
      const fakeBack = td.func('back')
      global.window = {}
      global.window.history = {}
      global.window.history.back = fakeBack
      td.when(fakeBack(msg)).thenReturn(undefined)
      PluginBrowser['ブラウザ戻'].fn.apply(this, args)
      td.verify(fakeBack(td.matchers.anything()), { times: 1 })
    }
    it('ブラウザ戻', () => {
      chkback([], -1)
    })
  })
})
