module.exports = {
  // @WebSocket
  'WS接続完了時': { // @WebSocketでサーバに接続完了した時に実行されるイベントを指定 // @WSせつぞくかんりょうしたとき
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (callback, sys) {
      sys.__v0['WS:ONOPEN'] = callback
    },
    return_none: true
  },
  'WS受信時': { // @WebSocketでサーバからメッセージを受信した時に実行されるイベントを指定 // @WSじゅしんしたとき
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (callback, sys) {
      sys.__v0['WS:ONMESSAGE'] = callback
    },
    return_none: true
  },
  'WSエラー発生時': { // @WebSocketでエラーが発生した時に実行されるイベントを指定 // @WSえらーはっせいじ
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (callback, sys) {
      sys.__v0['WS:ONERROR'] = callback
    },
    return_none: true
  },
  'WS接続': { // @WebSocketサーバsに接続する // @WSせつぞく
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (s, sys) {
      const ws = new WebSocket(s)
      ws.onopen = () => {
        const cbOpen = sys.__v0['WS:ONOPEN']
        if (cbOpen) {cbOpen(sys)}
      }
      ws.onerror = (err) => {
        const cbError = sys.__v0['WS:ONERROR']
        if (cbError) {cbError(err, sys)}
        console.log('WSエラー', err)
      }
      ws.onmessage = (e) => {
        sys.__v0['対象'] = e.data
        const cbMsg = sys.__v0['WS:ONMESSAGE']
        if (cbMsg) {cbMsg(sys)}
      }
      sys.__v0['WS:SOCKET'] = ws
      return ws
    }
  },
  'WS送信': { // @アクティブなWebSocketへsを送信する // @WSそうしん
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function (s, sys) {
      const ws = sys.__v0['WS:SOCKET']
      ws.send(s)
    }
  },
  'WS切断': { // @アクティブなWebSocketを閉じる // @WSせつだん
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      const ws = sys.__v0['WS:SOCKET']
      ws.close()
    }
  }
}
