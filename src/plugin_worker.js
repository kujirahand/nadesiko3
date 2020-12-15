const PluginWorker = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function(sys) {
      sys.__v0['SELF'] = self || {}
      sys.__v0['依頼主'] = self || {}
    }
  },

  '対象イベント': {type:'const', value: ''}, // @たいしょういべんと
  '受信データ': {type:'const', value: ''}, // @たいしょういべんと
  'SELF': {type:'const', value: ''}, // @SELF
  '依頼主': {type:'const', value: ''}, // @SELF

  'NAKOワーカーデータ受信時': { // @無名関数Fでなでしこv3エンジンに対してワーカーメッセージによりデータを受信した時に実行するイベントを設定。『受信データ』に受信したデータM。『対象イベント』にイベント引数。 // @NAKOわーかーでーたじゅしんしたとき
    type: 'func',
    josi: [['で']],
    fn: function (func, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      sys.ondata = (data, e) => {
        sys.__v0['受信データ'] = data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'ワーカーメッセージ受信時': { // @無名関数Fでselfに対してメッセージを受信した時に実行するイベントを設定。『受信データ』に受信したデータ。『対象イベント』にイベント引数。 // @わーかーめっせーじじゅしんしたとき
    type: 'func',
    josi: [['で']],
    fn: function (func, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      self.onmessage = (e) => {
        sys.__v0['受信データ'] = e.data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'NAKOワーカーデータ送信': { // @起動もとに固有の形式でデータを送信する。 // @NAKOわーかーでーたへんしん
    type: 'func',
    josi: [['を']],
    fn: function (data, sys) {
      const msg = {
        type: 'data',
        data: data
      }
      postMessage(msg)
    },
    return_none: true
  },
  'ワーカーメッセージ送信': { // @起動もとにメッセージを送信する。 // @わーかーめっせーじへんしん
    type: 'func',
    josi: [['を']],
    fn: function (msg, sys) {
      postMessage(msg)
    },
    return_none: true
  },
  '表示': { // @メインスレッドに固有の形式で表示データを送信する。 // @ひょうじ
    type: 'func',
    josi: [['を']],
    fn: function (data, sys) {
      const msg = {
        type: 'output',
        data: data
      }
      postMessage(msg)
    },
    return_none: true
  },
  '終了': { // @ワーカーを終了する。 // @しゅうりょう
    type: 'func',
    josi: [],
    fn: function (sys) {
      close()
    },
    return_none: true
  }
}

module.exports = PluginWorker
