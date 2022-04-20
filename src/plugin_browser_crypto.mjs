export default {
  // @ハッシュ関数
  'ハッシュ値計算時': { // @データSをアルゴリズムALG(sha-256/sha-384/sha-512)のエンコーディングでハッシュ値を計算して変数「対象」に代入する。 // @ はっしゅちけいさんしたとき
    type: 'func',
    josi: [['へ'], ['を'], ['で']],
    pure: false,
    fn: function (func, s, alg, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      // convert
      const buffer = new TextEncoder('utf-8').encode(s)
      crypto.subtle.digest(alg, buffer).then(function (hash) {
        const codes = []
        const view = new DataView(hash)
        for (let i = 0; i < view.byteLength; i += 4) {
          const v = view.getUint32(i)
          const h = v.toString(16)
          const pad = '00' + h
          codes.push(pad.substr(pad.length - 2, 2))
        }
        const res = sys.__v0['対象'] = codes.join('')
        func(res)
      })
    },
    return_none: true
  }
}
