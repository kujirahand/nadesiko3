export default {
  // @グラフ描画_CHARTJS
  'グラフ描画': { // @ Chart.jsを利用して、DATAのグラフを描画 // @ぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      // Chart.jsが使えるかチェック
      const win: any = sys.__v0.WINDOW
      if (typeof win === 'undefined') {
        throw new Error('『グラフ描画』のエラー。ブラウザで実行してください。')
      }
      // Chart.jsがないので自動的に取り込む
      if (typeof win.Chart === 'undefined') {
        console.log('try to load chart.js')
        await sys.__loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0')
        console.log('loaded chart.js')
      }
      if (typeof win.Chart === 'undefined') {
        throw new Error('『グラフ描画』のエラー。Chart.jsを取り込みに失敗しました。')
      }
      const Chart = win.Chart
      // Canvasが有効？
      if (!sys.__canvas) {
        throw new Error('『グラフ描画』のエラー。『描画開始』命令で描画先のCanvasを指定してください。 ')
      }
      // 日本語のキーワードを変換
      if (data['タイプ']) { data.type = data['タイプ'] }
      if (data['データ']) { data.data = data['データ'] }
      if (data['オプション']) { data.options = data['オプション'] }
      if (sys.__chartjs) {
        sys.__chartjs.destroy()
      }
      // eslint-disable-next-line no-undef
      const chart = new Chart(sys.__canvas, data)
      sys.__chartjs = chart
      return chart
    }
  },
  'グラフオプション': { type: 'const', value: {} }, // @ぐらふおぷしょん
  '線グラフ描画': { // @ 線グラフを描画 // @せんぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      data = sys.__exec('二次元グラフデータ変形', ['line', data, sys])
      const d = {
        type: 'line',
        data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '棒グラフ描画': { // @ 棒グラフを描画 // @ぼうぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      // グラフオプションの差分作成
      const gopt = Object.assign({},
        sys.__v0['グラフオプション'],
        { 'indexAxis': 'x' })
      data = sys.__exec('二次元グラフデータ変形', ['bar', data, sys])
      const d = {
        type: 'bar',
        data,
        options: gopt
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '横棒グラフ描画': { // @ 横棒グラフを描画 // @よこぼうぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    pure: true,
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      // グラフオプションの差分作成
      const gopt = Object.assign({},
        sys.__v0['グラフオプション'],
        { 'indexAxis': 'y' })
      data = sys.__exec('二次元グラフデータ変形', ['bar', data, sys])
      const d = {
        type: 'bar', // horizontalBar
        data,
        options: gopt
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '積上棒グラフ描画': { // @ 複数列のデータがある場合積み上げ棒グラフを描画 // @つみあげぼうぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      // グラフオプションの差分作成
      const gopt = Object.assign({},
        sys.__v0['グラフオプション'],
        {
          'indexAxis': 'x',
          'scales': {
            x: { stacked: true },
            y: { stacked: true }
          }
        })
      data = sys.__exec('二次元グラフデータ変形', ['bar', data, sys])
      const d = {
        type: 'bar',
        data,
        options: gopt
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '積上横棒グラフ描画': { // @ 複数列のデータがある場合積み上げ棒グラフを描画 // @つみあげよこぼうぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      // グラフオプションの差分作成
      const gopt = Object.assign({},
        sys.__v0['グラフオプション'],
        {
          'indexAxis': 'y',
          'scales': {
            x: { stacked: true },
            y: { stacked: true }
          }
        })
      data = sys.__exec('二次元グラフデータ変形', ['bar', data, sys])
      const d = {
        type: 'bar',
        data,
        options: gopt
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '散布図描画': { // @ 散布図を描画 // @さんぷず
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      // グラフオプションの差分作成
      const gopt = Object.assign({},
        sys.__v0['グラフオプション'],
        {})
      data = sys.__exec('二次元グラフデータ変形', ['scatter', data, sys])
      const d = {
        type: 'scatter',
        data,
        options: gopt
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '円グラフ描画': { // @ 円グラフを描画 // @えんぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      data = sys.__exec('二次元グラフデータ変形', ['pie', data, sys])
      const d = {
        type: 'pie',
        data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  'ドーナツグラフ描画': { // @ 円グラフ（ドーナツ）を描画 // @ドーナツぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      data = sys.__exec('二次元グラフデータ変形', ['pie', data, sys])
      const d = {
        type: 'doughnut',
        data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  'ポーラーグラフ描画': { // @ 円グラフ（鶏頭グラフ/ポーラーエリアチャート）を描画 // @ぽーらーぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      data = sys.__exec('二次元グラフデータ変形', ['pie', data, sys])
      const d = {
        type: 'polarArea',
        data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  'レーダーグラフ描画': { // @ レーダーチャートを描画 // @れーだーぐらふびょうが
    type: 'func',
    josi: [['を', 'で', 'の']],
    asyncFn: true,
    fn: async function (data: any, sys: any) {
      data = sys.__exec('二次元グラフデータ変形', ['bar', data, sys])
      const d = {
        type: 'radar',
        data,
        options: sys.__v0['グラフオプション']
      }
      return sys.__exec('グラフ描画', [d, sys])
    }
  },
  '二次元グラフデータ変形': { // @ 二次元配列をXXグラフ描画の形式に整形する。種類TとDATAを指定。 // @にじげんぐらふでーたへんけい
    type: 'func',
    josi: [['の'], ['を']],
    fn: function (t: any, dataOrg: any, sys: any) {
      // データを破壊的に変更してしまうので最初にデータをコピー (#1416)
      const data = JSON.parse(JSON.stringify(dataOrg))
      const bgcolorList: string[] = [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ]
      const fgcolorList: string[] = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ]
      const res: any = {}
      const bgcolors: string[] = []
      const fgcolors: string[] = []
      res.labels = []
      // 配列かどうか
      if (data instanceof Array) {
        // 二次元データのとき
        if (data[0] instanceof Array) {
          if (t === 'pie') { // 円グラフの時だけ整形方法が異なる
            const o: any = {}
            o.data = []
            res.datasets = [o]
            for (let i = 0; i < data.length; i++) {
              res.labels.push(data[i][0]) // label
              o.data.push(data[i][1]) // value
              bgcolors.push(bgcolorList[i % 6])
              fgcolors.push(fgcolorList[i % 6])
            }
            o.backgroundColor = bgcolors
            o.borderColor = fgcolors
            return res
          }
          // 左側のラベルの処理
          // [1,0]が文字列ならラベルあり
          if (typeof (data[1][0]) === 'string') {
            for (let i = 1; i < data.length; i++) {
              res.labels.push(data[i][0]) // 左ラベルを追加
              data[i] = data[i].slice(1) // 左ラベル除去
            }
            data[0] = data[0].slice(1) // ヘッダ行も左ラベルを削除
          } else {
            // 左側ラベルない場合 - ダミーのラベルを追加
            for (let i = 1; i < data.length; i++) {
              res.labels.push(i)
            }
          }
          res.datasets = []
          for (let i = 0; i < data[0].length; i++) {
            const o: any = {}
            res.datasets.push(o)
            o.label = data[0][i]
            o.backgroundColor = bgcolorList[i % 6]
            o.borderColor = fgcolorList[i % 6]
            o.data = []
            for (let j = 1; j < data.length; j++) {
              o.data.push(data[j][i])
            }
          }
          return res
        }
        // 一次元データのとき
        // ラベルを作成
        for (let i = 0; i < data.length; i++) {
          res.labels.push(i + 1)
          bgcolors.push(bgcolorList[i % 6])
          fgcolors.push(fgcolorList[i % 6])
        }
        const o1: any = {}
        res.datasets = [o1]
        o1.label = 'データ'
        o1.data = data
        o1.backgroundColor = bgcolors
        o1.borderColor = fgcolors
        return res
      }
      if (data instanceof Object) { return data }
      // データが1つだけのとき
      return sys.__exec('二次元グラフデータ変形', [[data], sys])
    }
  }
}
