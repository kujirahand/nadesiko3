const multer =  require('multer')
const bodyParserRaw = require('body-parser/lib/types/raw')
const bodyParserText = require('body-parser/lib/types/text')
const bodyParserUrlencoded =  require('body-parser/lib/types/urlencoded')

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
const parserUrlencoded = bodyParserUrlencoded({extended: false})
const parserText = bodyParserText({type: ['application/x-www-form-urlencoded','multipart/form-data']})
const parserRaw = bodyParserRaw({})

var CustomMiddlewareFactory = function (config) {
  return function (request, response, /* next */) {
    if (! /^\/custom\//.test(request.url)) {
      response.writeHead(404)
      return response.end('not found other in custom:'+request.url)
    } else
    if (/^\/custom\/delayedimage\//.test(request.url)) {
      const filename = request.url.substring(20)
      setTimeout(() => {
        response.setHeader('Location', filename);
        response.writeHead(307)
        return response.end()
      }, 500)
      return
    } else
    if (/^\/custom\/ok(\/json)?$/.test(request.url)) {
      let data = 'OK'
      if (/^\/custom\/ok\/json$/.test(request.url)) {
        data = JSON.stringify(data)
      }
      response.writeHead(200)
      return response.end(data)
    } else
    if (/^\/custom\/uploadimage$/.test(request.url)) {
      const rawtype = request.headers['content-type']
      const type = rawtype.split(';')[0]
      if (type==='multipart/form-data') {
        parserUpload.single('file')(request, response, (err) => {
          if (err) {
            console.log('parse error'+(!!err?' and has error':''))
            console.log(err)
            return response.end(err)
          }
          let data = "OK"
          response.writeHead(200)
          return response.end(data)
        })
      } else {
        console.log(type)
        response.writeHead(501)
        return response.end('content-type must multipart/form-data')
      }
      return;
    } else
    if (/^\/custom\/echo(\/json)?$/.test(request.url)) {
      const rawtype = request.headers['content-type']
      const type = rawtype.split(';')[0]
      const echos = (err) => {
        if (err) {
          console.log('parse error'+(!!err?' and has error':''))
          console.log(err)
          return response.end(err)
        }
        let data = request.body
        if (/^\/custom\/echo\/json$/.test(request.url) || typeof data !== 'string') {
          data = JSON.stringify(data)
        }
        response.writeHead(200)
        return response.end(data)
      }
      if (type==='application/x-www-form-urlencoded') {
        parserText(request, response, echos)
//        parserUrlencoded(request, response, echos)
      } else
      if (type==='text/plain') {
        parserText(request, response, echos)
      } else
      if (type==='application/octet-stream') {
        parserRaw(request, response, echos)
      } else
      if (type==='multipart/form-data') {
//        parserText(request, response, echos)
        parserMultipart(request, response, echos)
      } else {
        console.log(type)
        response.writeHead(501)
        return response.end('unsupport content-type')
      }
      return;
    }
    response.writeHead(404)
    return response.end('not found content at:'+request.url)
  }
}

module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    files: [
      'test/*_test.js',
      'test/html/*.html',
      {pattern: 'test/image/*.png', included: false, served: true, watched: false, nocache: false}
    ],
    proxies: {
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
      resolve: {
        mainFields: ["browser", "main", "module"]
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
    reporters: ['mocha', 'coverage'],
    // reporter options
    mochaReporter: {
      showDiff: true
    },
    coverageReporter: {
      dir: '../coverage/ct',
      reporters: [
        { type: 'text' },
        { type: 'text-summary' },
        { type: 'lcov', subdir: '.'},
        { type: 'text', subdir: '.', file: 'text.txt' },
        { type: 'json', subdir: '.', file: 'text.json' },
        { type: 'text-summary', subdir: '.', file: 'text-summary.txt' },
        { type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt' },
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
