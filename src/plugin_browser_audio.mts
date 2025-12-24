/* eslint-disable quote-props */
export default {
  // @オーディオ
  'オーディオ開': { // @オーディオファイルのURLを指定して、オーディオを読み込み、Audioオブジェクトを返す // @おーでぃおひらく
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (url: any, sys: any) {
      const a = new Audio()
      a.src = url
      return a
    },
    return_none: false
  },
  'オーディオ再生': { // @AudioオブジェクトOBJを指定してオーディオを再生 // @おーでぃおさいせい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (obj: any, sys: any) {
      if (!obj) { throw new Error('オーディオ再生する前に、オーディオ開くで音声ファイルを読み込んでください') }
      obj.loop = false
      obj.play()
    },
    return_none: true
  },
  'オーディオループ再生': { // @AudioオブジェクトOBJを指定してオーディオをループ再生する // @おーでぃおるーぷさいせい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (obj: any, sys: any) {
      if (!obj) { throw new Error('オーディオループ再生する前に、オーディオ開くで音声ファイルを読み込んでください') }
      obj.loop = true
      obj.play()
    },
    return_none: true
  },
  'オーディオ停止': { // @AudioオブジェクトOBJを指定してオーディオを停止 // @おーでぃおていし
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (obj: any, sys: any) {
      if (!obj) { throw new Error('オーディオ停止する前に、オーディオ開くで音声ファイルを読み込んでください') }
      obj.pause()
      obj.currentTime = 0 // 暫定
      // オーディオ停止で再生位置が0に戻らない問題(#715)
      setTimeout(() => {
        obj.currentTime = 0 // しっかりと設定
      }, 10)
    },
    return_none: true
  },
  'オーディオ一時停止': { // @AudioオブジェクトOBJを指定してオーディオを一時停止 // @おーでぃおいちじていし
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (obj: any, sys: any) {
      if (!obj) { throw new Error('オーディオ一時停止する前に、オーディオ開くで音声ファイルを読み込んでください') }
      obj.pause()
    },
    return_none: true
  },
  'オーディオ音量取得': { // @AudioオブジェクトOBJの音量を取得して返す // @おーでぃおおんりょうしゅとく
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (obj: any, sys: any) {
      if (!obj) { throw new Error('オーディオ音量取得する前に、オーディオ開くで音声ファイルを読み込んでください') }
      return obj.volume
    }
  },
  'オーディオ音量設定': { // @AudioオブジェクトOBJの音量をV(0-1)に設定する // @おーでぃおおんりょうせってい
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    pure: true,
    fn: function (obj: any, v: any, sys: any) {
      if (!obj) { throw new Error('オーディオ音量設定する前に、オーディオ開くで音声ファイルを読み込んでください') }
      obj.volume = v
    },
    return_none: true
  },
  'オーディオ長取得': { // @AudioオブジェクトOBJを指定してオーディオの長さを取得して返す // @おーでぃおながさしゅとく
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (obj: any, sys: any) {
      if (!obj) { throw new Error('オーディオ長取得する前に、オーディオ開くで音声ファイルを読み込んでください') }
      return obj.duration
    }
  },
  'オーディオ再生位置取得': { // @AudioオブジェクトOBJを指定してオーディオの再生位置を取得して返す // @おーでぃおさいせいいちしゅとく
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (obj: any, sys: any) {
      if (!obj) { throw new Error('オーディオ再生位置取得する前に、オーディオ開くで音声ファイルを読み込んでください') }
      return obj.currentTime
    }
  },
  'オーディオ再生位置設定': { // @AudioオブジェクトOBJを指定してオーディオの位置を数値Vで設定する // @おーでぃおさいせい
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    pure: true,
    fn: function (obj: any, v: any, sys: any) {
      if (!obj) { throw new Error('オーディオ再生位置設定する前に、オーディオ開くで音声ファイルを読み込んでください') }
      obj.currentTime = v
    },
    return_none: true
  }
}
