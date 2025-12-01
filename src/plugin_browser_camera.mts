// @ts-nocheck
import { NakoSystem } from '../core/src/plugin_api.mjs'

export default {
  // @カメラ
  'カメラオプション': { type: 'const', value: { video: true, audio: false } }, // @かめらおぷしょん
  'カメラ起動': { // @カメラを起動する // @かめらきどう
    type: 'func',
    josi: [['の', 'に', 'へ', 'で']],
    pure: true,
    asyncFn: true,
    fn: async function (v: any, sys: NakoSystem) {
      const options = sys.__getSysVar('カメラオプション')
      const stream = await navigator.mediaDevices.getUserMedia(options)
      v.srcObject = stream
      const settings = sys.__exec('カメラ設定取得', [v, sys])
      if (settings.width && settings.height) {
        v.width = settings.width
        v.height = settings.height
      }
      v.onloadedmetadata = function () {
        v.play()
      }
      sys.tags.usingCamera = true
      sys.tags.video = v
    },
    return_none: true
  },
  'カメラ終了': { // @カメラを終了 // @かめらしゅうりょう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any, sys: NakoSystem) {
      sys.__exec('メディアストリーム停止', [v, sys])
      v.srcObject = null
      sys.tags.usingCamera = false
      sys.tags.video = null
    },
    return_none: true
  },
  'カメラ映像再生': { // @カメラ映像を再生する // @かめらえいぞうさいせい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any, sys: NakoSystem) {
      if (v && v.play) {
        v.play()
      }
    },
    return_none: true
  },
  'カメラ映像一時停止': { // @カメラ映像の再生を一時停止する // @かめらえいぞういちじていし
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any, sys: NakoSystem) {
      if (v && v.pause) {
        v.pause()
      }
    },
    return_none: true
  },
  'カメラ設定取得': { // @カメラ設定を取得して返す // @かめらせっていしゅとく
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any, sys: NakoSystem) {
      if (v && v.srcObject && v.srcObject.getVideoTracks) {
        const tracks = v.srcObject.getVideoTracks()
        if (tracks.length > 0) {
          const settings = tracks[0].getSettings()
          return settings
        }
        return {}
      }
      return {}
    },
    return_none: false
  },
  'メディアストリーム取得': { // @メディアストリームを取得して返す(カメラオプションを参照) // @めでぃあすとりーむしゅとく
    type: 'func',
    josi: [],
    pure: true,
    asyncFn: true,
    fn: async function (sys: NakoSystem) {
      const options = sys.__getSysVar('カメラオプション')
      const stream = await navigator.mediaDevices.getUserMedia(options)
      return stream
    },
    return_none: false
  },
  'メディアストリーム停止': { // @メディアストリームを停止する // @めでぃあすとりーむていし
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v:any, sys: NakoSystem) {
      if (v && v.srcObject && v.srcObject.getVideoTracks) {
        const tracks = v.srcObject.getVideoTracks()
        for (const track of tracks) {
          track.stop()
        }
      }
    },
    return_none: false
  }
}
