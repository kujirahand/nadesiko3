const PluginWebWorker = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys._webworker = {
        setNakoHandler: function(work) {
          work.onmessage = (event) => {
            const data = event.data || { type: '', data: '' }
            const type = data.type || ''
            const value = data.data || ''
            switch (type) {
              case 'output':
                if (work.onoutput) {
                  work.onoutput.apply(sys, [value, event])
                }
                break;
              case 'data':
                if (work.ondata) {
                  work.ondata.apply(sys, [value, event])
                }
                break;
            }
          }
        }
      }
    }
  },

  // @イベント用定数
  '対象イベント': {type:'const', value: ''}, // @たいしょういべんと
  '受信データ': {type:'const', value: ''}, // @たいしょういべんと

  'ワーカー起動': { // @指定したURLでWebWorkerを起動する。ワーカオブジェクトを返す。 // @わーかーきどう
    type: 'func',
    josi: [['で','を','の']],
    fn: function (url, sys) {
      return myWorker = new Worker(url)
    },
    return_none: false
  },
  'NAKOワーカー起動': { // @指定したなでしこ３のWebWorkerを起動する。ワーカオブジェクトを返す。 // @NAKOわーかーきどう
    type: 'func',
    josi: [],
    fn: function (sys) {
      return myWorker = new Worker('wwnako3.js')
      if (myWorker) {
        sys._webworker.setNakoHandler(myWorker)
      }
    },
    return_none: false
  },
  'NAKOワーカーハンドラ設定': { // @ワーカーにNAKOワーカーのための設定を行う。 // @NAKOわーかーはんどらせってい
    type: 'func',
    josi: [['に','へ','の']],
    fn: function (work, sys) {
      sys._webworker.setNakoHandler(work)
    },
    return_none: true
  },
  'NAKOワーカーデータ返信受信時': { // @無名関数Fでなでしこv3エンジンに対してワーカーメッセージによりデータを受信した時に実行するイベントを設定。『受信データ』に受信したデータ。『対象イベント』にイベント引数。 // @NAKOわーかーでーたへんしんじゅしんしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: function (func, work, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      work.ondata = (data, e) => {
        sys.__v0['受信データ'] = data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'NAKOワーカー表示時': { // @無名関数Fでなでしこv3エンジンに対してワーカーメッセージにより表示データを受信した時に実行するイベントを設定。『受信データ』に表示しようとしたデータ。『対象イベント』にイベント引数。 // @NAKOわーかーひょうじしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: function (func, work, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      work.onoutput = (data, e) => {
        sys.__v0['受信データ'] = data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'ワーカーメッセージ返信受信時': { // @無名関数Fでworkに対してメッセージを受信した時に実行するイベントを設定。『受信データ』に受信したデータ。『対象イベント』にイベント引数。 // @わーかーめっせーへんしんじじゅしんしたとき
    type: 'func',
    josi: [['で'], ['を', 'の']],
    fn: function (func, work, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      work.onmessage = (e) => {
        sys.__v0['受信データ'] = e.data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'NAKOワーカープログラム起動': { // @WORKERに固有の形式でプログラムの転送と実行行う。 // @NAKOぷろぐらむきどう
    type: 'func',
    josi: [['に','で'],['を']],
    fn: function (work, data, sys) {
      const msg = {
        type: 'run',
        data: data
      }
      work.postMessage(msg)
    },
    return_none: true
  },
  'NAKOワーカーリセット': { // @WORKERに固有の形式でプログラムの転送と実行行う。 // @わーかーりせっと
    type: 'func',
    josi: [['を']],
    fn: function (work, sys) {
      const msg = {
        type: 'reset',
        data: ''
      }
      work.postMessage(msg)
    },
    return_none: true
  },
  'ワーカー終了': { // @WORKERを終了する。 // @わーかーしゅうりょう
    type: 'func',
    josi: [['を']],
    fn: function (work, sys) {
      work.terminate()
    },
    return_none: true
  },
  'NAKOワーカー終了': { // @WORKERを終了する。 // @NAKOわーかーしゅうりょう
    type: 'func',
    josi: [['を']],
    fn: function (work, sys) {
      const msg = {
        type: 'close',
        data: ''
      }
      work.postMessage(msg)
    },
    return_none: true
  },
  'NAKOワーカーデータ送信': { // @WORKERに固有の形式でデータを送信する。 // @NAKOわーかーでーたそうしん
    type: 'func',
    josi: [['に'],['を']],
    fn: function (work, data, sys) {
      const msg = {
        type: 'data',
        data: data
      }
      work.postMessage(msg)
    },
    return_none: true
  },
  'ワーカーメッセージ送信': { // @WORKERにメッセージを送信する。 // @わーかーめっせーじそうしん
    type: 'func',
    josi: [['に'],['を']],
    fn: function (work, msg, sys) {
      work.postMessage(msg)
    },
    return_none: true
  }
}

if (typeof (navigator) === 'object' && typeof (navigator.nako3) === 'object') {
  navigator.nako3.addPluginObject('PluginWebWorker', PluginWebWorker)
}
if (typeof (module) === 'object') {
  module.exports = PluginWebWorker
}
