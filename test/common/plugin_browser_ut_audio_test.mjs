import * as td from 'testdouble'
import assert from 'assert'
import PluginBrowser from '../../src/plugin_browser.mjs'
import { PluginUtHelper } from '../../utils/plugin_ut_helper.js'

class StubAudio {
  contructor () {
    this.src = ''
    this.eventid = ''
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.callback = function () {}
    this.currentTime = 0
  }

  /**
   * @param {any} evt
   * @param {any} func
   */
  addEventListener (evt, func) {
    this.callback = func
    this.eventid = evt
  }
}

describe('plugin_browser_audio', () => {
  const cu = new PluginUtHelper(PluginBrowser)

  describe('audio-open', () => {
    const chkopen = (/** @type {string[] | { __v0: {}; }[]} */ args, /** @type {unknown} */ url, /** @type {undefined} */ res) => {
      const sys = {}
      sys.__v0 = {}
      // @ts-ignore
      global.window = {}
      // @ts-ignore
      global.window.Audio = StubAudio
      // @ts-ignore
      global.Audio = StubAudio
      // @ts-ignore
      args.push(sys)
      // @ts-ignore
      const obj = PluginBrowser['オーディオ開'].fn.apply(this, args)
      assert.equal(obj.src, url)
    }
    it('オーディオ開', () => {
      chkopen(['http://url'], 'http://url')
    })
  })
  describe('audio-play', () => {
    const chkplay = () => {
      const sys = {}
      sys.__v0 = {}
      // @ts-ignore
      global.window = {}
      // @ts-ignore
      global.window.Audio = StubAudio
      // @ts-ignore
      global.Audio = StubAudio
      // @ts-ignore
      const obj = PluginBrowser['オーディオ開'].fn.apply(this, ['http://url', sys])
      const fakePlay = td.func('play')
      obj.play = fakePlay
      obj.currentTime = 234
      // @ts-ignore
      PluginBrowser['オーディオ再生'].fn.apply(this, [obj, sys])
      assert.equal(obj.currentTime, 234)
      td.verify(fakePlay(), { times: 1 })
    }
    it('オーディオ再生', () => {
      chkplay()
    })
    it('オーディオ再生 - noobj', () => {
      cu.cmpfnex('オーディオ再生', [null, {}], 'Error', 'オーディオ再生する前に、オーディオ開くで音声ファイルを読み込んでください')
    })
  })
  describe('audio-pause', () => {
    const chkpause = (/** @type {string} */ fnname, /** @type {number} */ cur, /** @type {number} */ pos, /** @type {unknown} */ res) => {
      const sys = {}
      sys.__v0 = {}
      // @ts-ignore
      global.window = {}
      // @ts-ignore
      global.window.Audio = StubAudio
      // @ts-ignore
      global.Audio = StubAudio
      // @ts-ignore
      const obj = PluginBrowser['オーディオ開'].fn.apply(this, ['http://url', sys])
      const fakePause = td.func('pause')
      obj.pause = fakePause
      obj.currentTime = cur
      // @ts-ignore
      PluginBrowser[fnname].fn.apply(this, [obj, sys])
      assert.equal(obj.currentTime, res)
      td.verify(fakePause(), { times: 1 })
    }
    it('オーディオ停止', () => {
      chkpause('オーディオ停止', 234, 456, 0)
    })
    it('オーディオ一時停止', () => {
      chkpause('オーディオ一時停止', 234, 456, 234)
    })
    it('オーディオ停止 - noobj', () => {
      cu.cmpfnex('オーディオ停止', [null, {}], 'Error', 'オーディオ停止する前に、オーディオ開くで音声ファイルを読み込んでください')
    })
    it('オーディオ一時停止 - noobj', () => {
      cu.cmpfnex('オーディオ一時停止', [null, {}], 'Error', 'オーディオ一時停止する前に、オーディオ開くで音声ファイルを読み込んでください')
    })
  })
})
