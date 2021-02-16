module.exports = {
  // @オーディオ
  'オーディオ開': { // @オーディオファイルのURLを指定して、オーディオを読み込み、Audioオブジェクトを返す // @おーでぃおひらく
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (url, sys) {
      const a = new Audio()
      a.src = url
      a.addEventListener('timeupdate', (e) => {
        sys.__v0['オーディオ再生位置'] = a.currentTime
      })
      return a
    },
    return_none: false
  },
  'オーディオ再生位置': {type: 'const', value: 0}, // @おーでぃおさいせいいち
  'オーディオ再生': { // @AudioオブジェクトOBJを指定してオーディをを再生 // @おーでぃおさいせい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (obj, sys) {
      if (!obj) throw new Error('オーディオ再生する前に、オーディオ開くで音声ファイルを読み込んでください')
      obj.currentTime = sys.__v0['オーディオ再生位置']
      obj.play()
    },
    return_none: true
  },
  'オーディオ停止': { // @AudioオブジェクトOBJを指定してオーディを停止 // @おーでぃおていし
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (obj, sys) {
      if (!obj) throw new Error('オーディオ停止する前に、オーディオ開くで音声ファイルを読み込んでください')
      obj.pause()
      sys.__v0['オーディオ再生位置'] = 0 // 暫定
      // オーディオ停止で再生位置が0に戻らない問題(#715)
      setTimeout(() => {
        sys.__v0['オーディオ再生位置'] = 0 // イベント後停止
      }, 10)
    },
    return_none: true
  },
  'オーディオ一時停止': { // @AudioオブジェクトOBJを指定してオーディを一時停止 // @おーでぃおていし
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (obj, sys) {
      if (!obj) throw new Error('オーディオ停止する前に、オーディオ開くで音声ファイルを読み込んでください')
      sys.__v0['オーディオ再生位置'] = obj.currentTime
      obj.pause()
    },
    return_none: true
  }
}
