#!/usr/bin/env node
/** なでしこ3簡易EXPRESSサーバー */

const express = require('express')
const app = express()

// set static
const path = require('path')
const rootDir = path.resolve(path.join(__dirname, '../'))
app.use(express.static(rootDir))
console.log('documentRoot:', rootDir)

// ライブラリがあるかチェック
const fs = require('fs')
if (!fs.existsSync(path.resolve(rootDir, 'extlib/pure.min.css'))) {
  const execSync = require('child_process').execSync;
  execSync('npm run extlib:install')
}

// root => redirect
app.get('/', function (req, res) {
  res.redirect(302, 'demo/')
})

// start server
let port = 3000
let server = null
const callbackStart = () => {
  const opener = require('opener')
  const port = server.address().port
  console.log('+ サーバーを開始しました')
  console.log('+ [URL] http://localhost:%s', port)
  opener('http://localhost:' + port)
}

server = app
  .listen(port, callbackStart)
  .on('error', () => {
    port += 1
    server = app
      .listen(port, callbackStart)
      .on('error', () => {
        port += 1
        server = app
          .listen(port, callbackStart)
          .on('error', (e) => {
            console.log('サーバーを起動できませんでした。')
            console.log(e.toString())
          })
      })
  })
