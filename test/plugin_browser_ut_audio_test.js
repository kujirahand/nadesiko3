const td = require('testdouble')
const assert = require('assert').strict
const PluginBrowser = require('../src/plugin_browser')
const { PluginUtHelper } = require('../utils/plugin_ut_helper')

class StubAudio {
  contructor () {
    this.src = ''
    this.eventid = ''
    this.callback = function () {}
    this.currentTime = 0
  }

  addEventListener (evt, func) {
    this.callback = func
    this.eventid = evt
  }
}

describe('plugin_browser_audio', () => {
  const cu = new PluginUtHelper(PluginBrowser)

  describe('audio-open', () => {
    const chkopen = (args, url, res) => {
      const sys = {}
      sys.__v0 = {}
      sys.__v0['オーディオ再生位置'] = 0
      global.window = {}
      global.window.Audio = StubAudio
      global.Audio = StubAudio
      args.push(sys)
      const obj = PluginBrowser['オーディオ開'].fn.apply(this, args)
      assert.equal(obj.src, url)
      assert.equal(obj.eventid, 'timeupdate')
      obj.currentTime = 12345
      obj.callback(obj, [null])
      assert.equal(sys.__v0['オーディオ再生位置'], 12345)
    }
    it('オーディオ開', () => {
      chkopen(['http://url'], 'http://url')
    })
  })
  describe('audio-play', () => {
    const chkplay = () => {
      const sys = {}
      sys.__v0 = {}
      sys.__v0['オーディオ再生位置'] = -1
      global.window = {}
      global.window.Audio = StubAudio
      global.Audio = StubAudio
      const obj = PluginBrowser['オーディオ開'].fn.apply(this, ['http://url', sys])
      const fakePlay = td.func('play')
      obj.play = fakePlay
      sys.__v0['オーディオ再生位置'] = 234
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
    const chkpause = (fnname, cur, pos, res) => {
      const sys = {}
      sys.__v0 = {}
      sys.__v0['オーディオ再生位置'] = -1
      global.window = {}
      global.window.Audio = StubAudio
      global.Audio = StubAudio
      const obj = PluginBrowser['オーディオ開'].fn.apply(this, ['http://url', sys])
      const fakePause = td.func('pause')
      obj.pause = fakePause
      obj.currentTime = cur
      sys.__v0['オーディオ再生位置'] = pos
      PluginBrowser[fnname].fn.apply(this, [obj, sys])
      assert.equal(sys.__v0['オーディオ再生位置'], res)
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
      cu.cmpfnex('オーディオ一時停止', [null, {}], 'Error', 'オーディオ停止する前に、オーディオ開くで音声ファイルを読み込んでください')
    })
  })
})
