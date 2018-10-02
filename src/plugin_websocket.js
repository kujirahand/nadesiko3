/**
 * file: plugin_websocket.js
 * WebSocketのためのプラグイン (wsをラップしたもの)
 */
const WebSocket = require('ws').Server

let app = null

// 定数・変数
const ERROR_NO_INIT = '先に『WSサーバ起動』命令を実行してください。'

const PluginWebsocket = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__v0['WSサーバ:ONSUCCESS'] = null
      sys.__v0['WSサーバ:ONERROR'] = null
      sys.__v0['WSサーバ:ONMESSAGE'] = null
      sys.__v0['WSサーバ:ONCONNECTION'] = null
    }
  },
  // @WebSocketサーバ
  'WSサーバ起動': { // @ポートPORTNOでWebサーバを起動して成功したら『WSサーバ起動成功した時』を実行する // @WSさーばきどう
    type: 'func',
    josi: [['の', 'で']],
    fn: function (portno, sys) {
      app = new WebSocket({port: portno})
      app.on('connection', (ws, req) => {
        const cbCon = sys.__v0['WSサーバ:ONCONNECTION']
        if (cbCon) {
          sys.__v0['対象'] = req
          cbCon(sys)
        }
        ws.on('message', (msg) => {
          const cbMsg = sys.__v0['WSサーバ:ONMESSAGE']
          sys.__v0['対象'] = msg
          if (cbMsg) cbMsg(sys)
        })
      })
      app.on('close', (e) => {
        console.log('ws::close', e)
      })
      app.on('error', (e) => {
        const callback = sys.__v0['WSサーバ:ONERROR']
        if (callback) callback(e, sys)
      })
      // サーバの成功時
      const callback = sys.__v0['WSサーバ:ONSUCCESS']
      if (callback) callback(sys)
      return app
    }
  },
  'WSサーバ起動成功時': { // @WSサーバ起動が成功した時にcallbackを実行 // @WSさーばきどうせいこうしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONSUCCESS'] = callback
    },
    return_none: true
  },
  'WSサーバ起動失敗時': { // @WSサーバ起動が失敗した時にcallbackを実行 // @WSさーばきどうしっぱいしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONERROR'] = callback
    },
    return_none: true
  },
  'WSサーバ接続時': { // @WSサーバにクライアントが接続してきた時callbackを実行。接続情報は、変数『対象』に入る // @WSさーばせつぞくしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONCONNECTION'] = callback
    },
    return_none: true
  },
  'WSサーバ受信時': { // @WSサーバでメッセージを受信した時に実行される。受信データは『対象』に代入される // @WSさーばじゅしんしたとき
    type: 'func',
    josi: [['で']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONMESSAGE'] = callback
    },
    return_none: true
  },
  'WSサーバ全送信': { // @WSサーバで全員にメッセージSを送信する // @WSさーばぜんそうしん
    type: 'func',
    josi: [['を']],
    fn: function (s, sys) {
      if (!app) throw new Error(ERROR_NO_INIT)
      app.clients.forEach((client) => {
        client.send(s)
      })
    },
    return_none: true
  },
  'WSクライアント一覧取得': { // @WSサーバに接続しているクライアントの一覧を返す // @WSくらいあんといちらんしゅとく
    type: 'func',
    josi: [['を']],
    fn: function (s, sys) {
      if (!app) throw new Error(ERROR_NO_INIT)
      return app.clients
    },
    return_none: true
  }
}

module.exports = PluginWebsocket
