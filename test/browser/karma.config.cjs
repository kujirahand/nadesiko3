// @ts-nocheck
/*
import express from 'express'
import path from 'path'
// import multer from 'multer'
import bodyParser from 'body-parser'
*/

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const multer = require('multer')

const bodyParserRaw = bodyParser.raw
const bodyParserText = bodyParser.text

const storage = multer.diskStorage({
  // ファイルの保存先を指定
  destination: function (req, file, cb) {
    cb(null, 'tmp')
  },
  // ファイル名を指定(オリジナルのファイル名を指定)
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const parserUpload = multer({ storage: storage })
const parserMultipart = multer().none()
const parserText = bodyParserText({type: ['application/x-www-form-urlencoded','multipart/form-data']})
const parserRaw = bodyParserRaw({})

var CustomMiddlewareFactory = function (config) {
  // /custom/*
  const custom = express.Router()

  custom.get('/echo.nako3', (req, res) => {
    // 例: http://localhost:9876/custom/echo.nako3?delay_ms=30&content=A%3D20
    setTimeout(() => { res.send(req.query['content']) }, +req.query['delay_ms'])
  })
  custom.get('/cyclic_import_1.nako3', (req, res) => {
    res.send('!「http://localhost:9876/custom/cyclic_import_2.nako3」を取り込む。\nA=100')
  })
  custom.get('/cyclic_import_2.nako3', (req, res) => {
    res.send('!「http://localhost:9876/custom/cyclic_import_1.nako3」を取り込む。\nB=200')
  })
  custom.get('/echo.js', (req, res) => {
    setTimeout(() => { res.send(req.query['content']) }, +req.query['delay_ms'])
  })
  custom.all('/delayedimage/:name', (req, res) => {
    const filename = '/' + req.params.name
    setTimeout(() => {
      res.setHeader('Location', filename);
      res.status(307).end()
    }, 500)
  })
  custom.all('/ok', (req, res) => {
    console.log('test')
    res.send('OK')
  })
  custom.all('/ok/json', (req, res) => {
    res.json('OK')
  })
  custom.all('/uploadimage', (req, res) => {
    const type = req.headers['content-type'].split(';')[0]
    if (type === 'multipart/form-data') {
      parserUpload.single('file')(req, res, (err) => {
        if (err) {
          console.log('parse error'+(!!err?' and has error':''))
          console.log(err)
          return res.end('' + err)
        }
        return res.end('OK')
      })
    } else {
      console.log(type)
      return res.status(501).end('content-type must multipart/form-data')
    }
  })
  custom.all(['/echo', '/echo/json'], (req, res) => {
    const type = req.headers['content-type'].split(';')[0]
    const echos = (err) => {
      if (err) {
        console.log('parse error'+(!!err?' and has error':''))
        console.log(err)
        return res.end(err)
      }
      let data = req.body
      if (req.url.endsWith('/json') || typeof data !== 'string') {
        data = JSON.stringify(data)
      }
      res.writeHead(200)
      return res.end(data)
    }
    switch (type) {
      case 'application/x-www-form-urlencoded':
      case 'text/plain':
        parserText(req, res, echos)
        break
      case 'application/octet-stream':
        parserRaw(req, res, echos)
        break
      case 'multipart/form-data':
        parserMultipart(req, res, echos)
        break
      default:
        res.status(501).send('unsupport content-type')
    }
  })

  const app = express()
  app.use('/custom', custom)
  return app
}

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha','webpack'],
    files: [
      {pattern: '../../release/wnako3webworker.js', served: true, included: false},
      'test/*_test.js',
      'test/html/*.html',
      {pattern: 'test/image/*.png', included: false, served: true, watched: false, nocache: false}
    ],
    proxies: {
       '/wnako3webworker.js': '/absolute' + path.resolve('./release/wnako3webworker.js'),
       '/turtle.png': '/base/test/image/turtle_kana.png',
       '/turtle-elephant.png': '/base/test/image/elephant_kana.png',
       '/turtle-panda.png': '/base/test/image/panda_kana.png',
       '/test/image/': '/base/test/image/'
    },
    middleware: ['custom'],
    plugins: [
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-webpack',
      'karma-html2js-preprocessor',
      {'middleware:custom': ['factory', CustomMiddlewareFactory]}
    ],
    customLaunchers: {
        FirefoxCustom: {
            base: 'Firefox',
            prefs: {
              'dom.w3c_touch_events.enabled': 1,
              'dom.w3c_touch_events.legacy_apis.enabled': true
            },
            flags: [ '-width', 400, '-height', 400 ]
        },
        FirefoxCustomHeadless: {
            base: 'FirefoxHeadless',
            prefs: {
              'dom.w3c_touch_events.enabled': 1,
              'dom.w3c_touch_events.legacy_apis.enabled': true
            },
            flags: [ '-width', 400, '-height', 400 ]
        }
    },
    preprocessors: {
      'test/*_test.js': ['webpack'],
      'test/html/*.html': ['html2js']
    },
    // webpackの設定
    webpack: {
      mode: "development",
      target: ["web", "es5"],
      resolve: {
        mainFields: ["browser", "main", "module"],
        alias: {
          "root": path.join(__dirname, "../.."),
          "nako3": path.join(__dirname, '../../src'),
          "utils" : path.join(__dirname, '../../utils'),
          "nadesiko3core" : path.join(__dirname, '../../core'),
        }
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: { loader: 'babel-loader' }
          },
          {
            test: /\.(jpg|png)$/,
            use: { loader: 'url-loader' }
          }
        ]
      }
    },
    reporters: ['mocha'],
    // reporter options
    mochaReporter: {
      showDiff: true,
    },
    coverageReporter: {
      dir: '../../coverage/browser',
      subdir: function(browser) {
         return browser.toLowerCase().split(/[ /-]/)[0];
      },
      reporters: [
        { type: 'text' },
        { type: 'text-summary' },
        { type: 'lcov' },
        { type: 'text', file: 'text.txt' },
        { type: 'json', file: 'text.json' },
        { type: 'text-summary', file: 'text-summary.txt' },
        { type: 'lcovonly', file: 'report-lcovonly.txt' },
      ],
      instrumenterOptions: {
        istanbul: { noCompact: true }
      }
    },
    port: 9876,  // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['Firefox', 'FirefoxHeadless', 'FirefoxCustom', 'FirefoxCustomHeadless' ],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity
  })
}
