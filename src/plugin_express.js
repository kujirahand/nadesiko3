/**
 * file: plugin_express.js
 * Webサーバのためのプラグイン (expressをラップしたもの)
 */
const fs = require('fs')
const path = require('path')
const express = require('express')
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
      sys.__v0['WEBサーバ要求オブジェクト'] = null
      sys.__v0['WEBサーバ応答オブジェクト'] = null
    }
  },
  // @Webサーバ(Exoress)
  'WEBサーバ名前設定': { // @Webサーバの名前を変更する // @WEBさーばなまえへんこう
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (name, sys) {
      WEBSERVER_NAME = name
      debug = false
      return name
    },
  },
  'WEBサーバ起動': { // @ポートPORTNOでWebサーバを起動する // @WEBさーばきどう
    type: 'func',
    josi: [['の', 'で']],
    fn: function (portno, sys) {
      app = express()
      server = app.listen(portno, ()=>{
        console.log('[' + WEBSERVER_NAME + ']')
        console.log('以下のURLで起動しました。')
        console.log('- [URL] http://localhost:' + server.address().port)
      })
      return server
    }
  },
  'WEBサーバ静的パス指定': { // @サーバのHTMLや画像などを配置する静的パスを指定する // @WEBさーばせいてきぱすしてい
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: function (url, path) {
      if (app == null) throw new Error(ERROR_NO_INIT)
      if (debug) console.log('static', url, path)
      app.use(url, express.static(path))
      return true
    }
  },
  'WEBサーバGET時': { // @URIにGETメソッドがあった時の処理を指定 // @WEBさーばGETしたとき
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    fn: function (callback, uri, sys) {
      app.get(uri, (req, res) => {
        sys.__v0['WEBサーバ要求オブジェクト'] = req
        sys.__v0['WEBサーバ応答オブジェクト'] = res
        callback(req, res)
      })
      return true
    }
  },
}


module.exports = PluginExpress
