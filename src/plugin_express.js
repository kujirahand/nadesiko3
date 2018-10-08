/**
 * file: plugin_express.js
 * Webサーバのためのプラグイン (expressをラップしたもの)
 */
const express = require('express')
const bodyParser = require('body-parser')

let server = null
let app = null
let debug = true
// 定数・変数
let WEBSERVER_NAME = 'WEBサーバ(なでしこ+Express)'
const ERROR_NO_INIT = '先に『WEBサーバ起動』命令を実行してください。'

const PluginExpress = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__v0['WEBサーバ:ONSUCCESS'] = null
      sys.__v0['WEBサーバ:ONERROR'] = null
      sys.__v0['WEBサーバ:要求'] = null
      sys.__v0['WEBサーバ:応答'] = null
      sys.__v0['WEBサーバクエリ'] = {}
    }
  },
  // @Webサーバ(Express)
  'GETデータ': {type: 'const', value: ''}, // @WEBサーバクエリ
  'POSTデータ': {type: 'const', value: ''}, // @WEBサーバクエリ
  'WEBサーバ名前設定': { // @Webサーバの名前を変更する // @WEBさーばなまえへんこう
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (name, sys) {
      WEBSERVER_NAME = name
      debug = false
    },
    return_none: true
  },
  'WEBサーバ起動': { // @ポートPORTNOでWebサーバを起動して成功したら『WEBサーバ起動成功した時』を実行する // @WEBさーばきどう
    type: 'func',
    josi: [['まで'], ['の', 'で']],
    fn: function (callback, portno, sys) {
      app = express()
      server = app.listen(portno, () => {
        const pno = server.address().port
        if (debug) {
          console.log('* [' + WEBSERVER_NAME + ']')
          console.log('| 以下のURLで起動しました。')
          console.log('+- [URL] http://localhost:' + pno)
        }
        const callback = sys.__v0['WEBサーバ:ONSUCCESS']
        if (callback) {
          callback(pno, sys)
        }
      })
      server.on('error', (e) => {
        const callback = sys.__v0['WEBサーバ:ONERROR']
        if (callback) {
          callback(e, sys)
        }
      })
      // POSTを自動的に処理
      app.use(bodyParser.text({
        type: 'text/plain'
      }))
      app.use(bodyParser.json({
        type: 'application/json'
      }))
      app.use(bodyParser.urlencoded({
        type: 'application/x-www-form-urlencoded',
        extended: true
      }))
      return server
    }
  },
  'WEBサーバ起動成功時': { // @WEBサーバ起動が成功した時にcallbackを実行 // @WEBさーばきどうせいこうしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WEBサーバ:ONSUCCESS'] = callback
    },
    return_none: true
  },
  'WEBサーバ起動失敗時': { // @WEBサーバ起動が失敗した時にcallbackを実行 // @WEBさーばきどうしっぱいしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WEBサーバ:ONERROR'] = callback
    },
    return_none: true
  },
  'WEBサーバ静的パス指定': { // @サーバのHTMLや画像などを配置する静的パスを指定する // @WEBさーばせいてきぱすしてい
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: function (url, path) {
      if (app == null) {
        throw new Error(ERROR_NO_INIT)
      }
      if (debug) {
        console.log('static', url, path)
      }
      app.use(url, express.static(path))
    },
    return_none: true
  },
  'WEBサーバGET時': { // @URIにGETメソッドがあった時の処理を指定 // @WEBさーばGETしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: function (callback, uri, sys) {
      app.get(uri, (req, res) => { callbackServerFunc(callback, req, res, sys) })
    },
    return_none: true
  },
  'WEBサーバPOST時': { // @URIにPOSTメソッドがあった時の処理を指定 // @WEBさーばPOSTしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: function (callback, uri, sys) {
      app.post(uri, (req, res) => { callbackServerFunc(callback, req, res, sys) })
    },
    return_none: true
  },
  'WEBサーバPUT時': { // @URIにPOSTメソッドがあった時の処理を指定 // @WEBさーばPUTしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: function (callback, uri, sys) {
      app.put(uri, (req, res) => { callbackServerFunc(callback, req, res, sys) })
    },
    return_none: true
  },
  'WEBサーバDELETE時': { // @URIにPOSTメソッドがあった時の処理を指定 // @WEBさーばDELETEしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: function (callback, uri, sys) {
      app.delete(uri, (req, res) => { callbackServerFunc(callback, req, res, sys) })
    },
    return_none: true
  },
  'WEBサーバ出力': { // @クライアントにSを出力 // @WEBさーばしゅつりょく
    type: 'func',
    josi: [['を', 'と']],
    fn: function (s, sys) {
      const res = sys.__v0['WEBサーバ:応答']
      res.send(s)
    },
    return_none: true
  },
  'WEBサーバリダイレクト': { // @URLにリダイレクトする // @WEBさーばりだいれくと
    type: 'func',
    josi: [['へ', 'に']],
    fn: function (url, sys) {
      const res = sys.__v0['WEBサーバ:応答']
      res.redirect(302, url)
    },
    return_none: true
  }
}

// GET/POST/PUT/DELETEのコールバック
function callbackServerFunc (callback, req, res, sys) {
  sys.__v0['WEBサーバ:要求'] = req
  sys.__v0['WEBサーバ:応答'] = res
  sys.__v0['GETデータ'] = req.query
  sys.__v0['POSTデータ'] = req.body
  callback(req, res)
}

module.exports = PluginExpress
