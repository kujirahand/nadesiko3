module.exports = {
  // @色定数
  '水色': {type: 'const', value: 'aqua'}, // @みずいろ
  '紫色': {type: 'const', value: 'fuchsia'}, // @むらさきいろ
  '緑色': {type: 'const', value: 'lime'}, // @みどりいろ
  '青色': {type: 'const', value: 'blue'}, // @あおいろ
  '赤色': {type: 'const', value: 'red'}, // @あかいろ
  '黄色': {type: 'const', value: 'yellow'}, // @きいろ
  '黒色': {type: 'const', value: 'black'}, // @くろいろ
  '白色': {type: 'const', value: 'white'}, // @しろいろ
  '茶色': {type: 'const', value: 'maroon'}, // @ちゃいろ
  '灰色': {type: 'const', value: 'gray'}, // @はいいろ
  '金色': {type: 'const', value: 'gold'}, // @きんいろ
  '黄金色': {type: 'const', value: 'gold'}, // @こがねいろ
  '銀色': {type: 'const', value: 'silver'}, // @ぎんいろ
  '白金色': {type: 'const', value: 'silver'}, // @しろがねいろ
  'オリーブ色': {type: 'const', value: 'olive'}, // @おりーぶいろ
  'ベージュ色': {type: 'const', value: 'beige'}, // @べーじゅいろ
  'アリスブルー色': {type: 'const', value: 'aliceblue'}, // @ありすぶるーいろ
  'RGB': { // @赤緑青を256段階でそれぞれ指定して、#RRGGBB形式の値を返す // @RGB
    type: 'func',
    josi: [['と'], ['と'], ['で', 'の']],
    pure: true,
    fn: function (r, g, b) {
      const z2 = (v) => {
        const v2 = '00' + v.toString(16)
        return v2.substr(v2.length - 2, 2)
      }
      return '#' + z2(r) + z2(g) + z2(b)
    },
    return_none: false
  },
  '色混': { // @配列で[RR,GG,BB]を指定して色を混ぜて#RRGGBB形式の値を返す // @いろまぜる
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      const z2 = (v) => {
        const v2 = '00' + v.toString(16)
        return v2.substr(v2.length - 2, 2)
      }
      if (!a) {throw new Error('『色混ぜる』の引数には配列を指定します')}
      if (a.length < 3) {throw new Error('『色混ぜる』の引数には[RR,GG,BB]形式の配列を指定します')}
      return '#' + z2(a[0]) + z2(a[1]) + z2(a[2])
    },
    return_none: false
  }
}
