module.exports = {
  // @グラフ描画_CHARTJS
  'グラフ描画': { // @ Chart.jsを利用して、DATAのグラフを描画 // @ぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    pure: true,
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
    pure: false,
    fn: function (data, sys) {
      data = sys.__exec('二次元グラフデータ変形', ['line', data, sys])
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
    pure: false,
    fn: function (data, sys) {
      data = sys.__exec('二次元グラフデータ変形', ['bar', data, sys])
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
    pure: false,
    fn: function (data, sys) {
      data = sys.__exec('二次元グラフデータ変形', ['bar', data, sys])
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
    pure: false,
    fn: function (data, sys) {
      data = sys.__exec('二次元グラフデータ変形', ['pie', data, sys])
      const d = {
        type: 'pie',
        data: data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '二次元グラフデータ変形': { // @ 二次元配列をXXグラフ描画の形式に整形する。種類TとDATAを指定。 // @にじげんぐらふでーたへんけい
    type: 'func',
    josi: [['の'],['を']],
    pure: false,
    fn: function (t, data, sys) {
      const bgcolorList = [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ]
      const fgcolorList = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ]
      const res = {}
      const bgcolors = []
      const fgcolors = []
      res['labels'] = []
      // 配列かどうか
      if (data instanceof Array) {
        // 二次元データのとき
        if (data[0] instanceof Array) {
          if (t === 'pie') { // 円グラフの時だけ整形方法が異なる
            const o = {}
            o['data'] = []
            res['datasets'] = [o]
            for (let i = 0; i < data.length; i++) {
              res['labels'].push(data[i][0]) // label
              o['data'].push(data[i][1]) // value
              bgcolors.push(bgcolorList[i % 6])
              fgcolors.push(fgcolorList[i % 6])
            }
            o['backgroundColor'] = bgcolors
            o['borderColor'] = fgcolors
            return res
          }
          // 左側のラベルの処理
          // [1,0]が文字列ならラベルあり
          if (typeof(data[1][0]) === 'string') {
            for (let i = 1; i < data.length; i++) {
              res['labels'].push(data[i][0]) // 左ラベルを追加
              data[i] = data[i].slice(1) // 左ラベル除去
            }
            data[0] = data[0].slice(1) // ヘッダ行も左ラベルを削除
          } else {
            // 左側ラベルない場合 - ダミーのラベルを追加
            for (let i = 1; i < data.length; i++) {
              res['labels'].push(i)
            }
          }
          res['datasets'] = []
          for (let i = 0; i < data[0].length; i++) {
            const o = {}
            res['datasets'].push(o)
            o.label = data[0][i]
            o.backgroundColor = bgcolorList[i % 6]
            o.borderColor = fgcolorList[i % 6]
            o.data = []
            for (let j = 1; j < data.length; j++) {
              o.data.push(data[j][i])
            }
          }
          // console.log(res)
          return res
        }
        // 一次元データのとき
        // ラベルを作成
        for (let i = 0; i < data.length; i++) {
          res['labels'].push(i+1)
          bgcolors.push(bgcolorList[i % 6])
          fgcolors.push(fgcolorList[i % 6])
        }
        const o1 = {}
        res['datasets'] = [o1]
        o1['label'] = 'データ'
        o1['data'] = data
        o1['backgroundColor'] = bgcolors
        o1['borderColor'] = fgcolors
        // console.log(res)
        return res
      }
      if (data instanceof Object) {return data}
      // データが1つだけのとき
      return sys.__exec('二次元グラフデータ変形', [[data], sys])
    }
  }
}
