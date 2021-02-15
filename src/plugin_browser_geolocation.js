module.exports = {
  // @位置情報
  '位置情報取得時': { // @位置情報を取得してコールバック関数内で変数「対象」に配列で[緯度,経度]を返す // @いちじょうほうしゅとくしたとき
    type: 'func',
    josi: [['の', 'に', 'へ']],
    pure: false,
    fn: function (func, sys) {
      let cb = func
      if (typeof cb === 'string') {cb = sys.__findVar(cb)}
      if (!('geolocation' in navigator))
        {throw new Error('関数『位置情報取得時』は使えません。')}

      navigator.geolocation.getCurrentPosition((position) => {
        sys.__v0['対象'] = [
          position.coords.latitude,
          position.coords.longitude
        ]
        cb(position)
      })
    },
    return_none: true
  },
  '位置情報監視時': { // @位置情報を監視してIDを返す。引数に指定したコールバック関数内で変数「対象」に配列で[緯度,経度]を返す // @いちじょうほうかんししたとき
    type: 'func',
    josi: [['の', 'に', 'へ']],
    pure: false,
    fn: function (func, sys) {
      let cb = func
      if (typeof cb === 'string') {cb = sys.__findVar(cb)}
      if (!('geolocation' in navigator))
        {throw new Error('関数『位置情報監視時』は使えません。')}

      return navigator.geolocation.watchPosition((position) => {
        sys.__v0['対象'] = [
          position.coords.latitude,
          position.coords.longitude
        ]
        cb(position)
      })
    },
    return_none: false
  },
  '位置情報監視停止': { // @『位置情報監視時』で開始した監視を停止する // @いちじょうほうかんしていし
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (wid, sys) {
      navigator.geolocation.clearWatch(wid)
    },
    return_none: true
  }
}
