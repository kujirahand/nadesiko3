// @ts-nocheck
export default {
  // @WebSocket
  'WS接続完了時': { // @WebSocketでサーバに接続完了した時に実行されるイベントを指定 // @WSせつぞくかんりょうしたとき
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (callback: any, sys: any) {
      sys.__setSysVar('WS:ONOPEN', callback)
    },
    return_none: true
  },
  'WS受信時': { // @WebSocketでサーバからメッセージを受信した時に実行されるイベントを指定 // @WSじゅしんしたとき
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (callback: any, sys: any) {
      sys.__setSysVar('WS:ONMESSAGE', callback)
    },
    return_none: true
  },
  'WSエラー発生時': { // @WebSocketでエラーが発生した時に実行されるイベントを指定 // @WSえらーはっせいじ
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (callback: any, sys: any) {
      sys.__setSysVar('WS:ONERROR', callback)
    },
    return_none: true
  },
  'WS接続': { // @WebSocketサーバsに接続する // @WSせつぞく
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (s: any, sys: any) {
      const ws = new WebSocket(s)
      ws.onopen = () => {
        const cbOpen = sys.__getSysVar('WS:ONOPEN')
        if (cbOpen) { cbOpen(sys) }
      }
      ws.onerror = (err) => {
        const cbError = sys.__getSysVar('WS:ONERROR')
        if (cbError) { cbError(err, sys) }
        console.log('WSエラー', err)
      }
      ws.onmessage = (e) => {
        sys.__setSysVar('対象', e.data)
        const cbMsg = sys.__getSysVar('WS:ONMESSAGE')
        if (cbMsg) { cbMsg(sys) }
      }
      sys.__setSysVar('WS:SOCKET', ws)
      return ws
    }
  },
  'WS送信': { // @アクティブなWebSocketへsを送信する // @WSそうしん
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function (s: any, sys: any) {
      const ws = sys.__getSysVar('WS:SOCKET')
      ws.send(s)
    }
  },
  'WS切断': { // @アクティブなWebSocketを閉じる // @WSせつだん
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
      const ws = sys.__getSysVar('WS:SOCKET')
      ws.close()
    }
  }
}
