/* eslint-disable no-undef */
import assert from 'assert'
import PluginBrowser from '../../src/plugin_browser.mjs'

// eslint-disable-next-line no-undef
describe('plugin_browser_location', () => {
  // eslint-disable-next-line no-undef
  describe('location-url', () => {
    const chkurl = (/** @type {string[]} */ args, /** @type {unknown} */ res) => {
      // @ts-ignore
      global.window = {}
      // @ts-ignore
      global.window.location = {}
      global.window.location.href = ''
      // @ts-ignore
      PluginBrowser['ブラウザ移動'].fn.apply(this, args)
      assert.equal(global.window.location.href, res)
    }
    it('ブラウザ移動', () => {
      chkurl(['http://url'], 'http://url')
    })
  })
  describe('history-back', () => {
    const chkback = (/** @type {never[]} */ args, /** @type {number} */ msg) => {
      const calls = []
      // @ts-ignore
      global.window = {}
      // @ts-ignore
      global.window.history = {}
      // @ts-ignore
      global.window.history.back = (...a) => { calls.push(a) }
      // @ts-ignore
      PluginBrowser['ブラウザ戻'].fn.apply(this, args)
      assert.deepEqual(calls, [[msg]])
    }
    it('ブラウザ戻', () => {
      chkback([], -1)
    })
  })
})
