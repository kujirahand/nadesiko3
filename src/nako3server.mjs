#!/usr/bin/env node
/** なでしこ3簡易EXPRESSサーバー */

import express from 'express'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import opener from 'opener'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express()

// set static
const rootDir = path.resolve(path.join(__dirname, '../'))
app.use(express.static(rootDir))
console.log('documentRoot:', rootDir)

// ライブラリがあるかチェック
if (!fs.existsSync(path.resolve(rootDir, 'extlib/pure.min.css'))) {
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
