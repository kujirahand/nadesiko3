module.exports = {
  // @グラフ描画_CHARTJS
  'グラフ描画': { // @ Chart.jsを利用して、DATAのグラフを描画 // @ぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: function (data, sys) {
      // Chart.jsが使えるかチェック
      if (!window['Chart']) {
        throw new Error('『グラフ描画』のエラー。Chart.jsを取り込んでください。')
      }
      // Canvasが有効？
      if (!sys.__canvas) {
        throw new Error('『グラフ描画』のエラー。『描画開始』命令で描画先のCanvasを指定してください。 ')
      }
      // 日本語のキーワードを変換
      if (data['タイプ']) { data['type'] = data['タイプ'] }
      if (data['データ']) { data['data'] = data['データ'] }
      if (data['オプション']) { data['options'] = data['オプション'] }
      const chart = new Chart(sys.__canvas, data)
      return chart
    }
  },
  'グラフオプション': {type: 'const', value: {}}, // @ぐらふおぷしょん
  '線グラフ描画': { // @ 線グラフを描画 // @せんぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: function (data, sys) {
      const d = {
        type: 'line',
        data: data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '棒グラフ描画': { // @ 棒グラフを描画 // @ぼうぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: function (data, sys) {
      const d = {
        type: 'bar',
        data: data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '横棒グラフ描画': { // @ 横棒グラフを描画 // @よこぼうぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: function (data, sys) {
      const d = {
        type: 'horizontalBar',
        data: data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '円グラフ描画': { // @ 円グラフを描画 // @えんぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    fn: function (data, sys) {
      const d = {
        type: 'pie',
        data: data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  }
}
