const path = require('path')

process.env.CHROME_BIN = process.env.CHROME_BIN || 'google-chrome'

module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'webpack'],
    files: [
      'test/*_smoke_test.js',
      {
        pattern: '../../release/*.js',
        included: false,
        served: true,
        watched: false,
        nocache: true
      },
      {
        pattern: '../../node_modules/ace-builds/src-noconflict/*.js',
        included: false,
        served: true,
        watched: false,
        nocache: true
      },
      {
        pattern: '../../src/*.css',
        included: false,
        served: true,
        watched: false,
        nocache: true
      }
    ],
    customContextFile: 'test/html/custom_context.html',
    proxies: {
      '/ace/': '/absolute' + path.resolve('./node_modules/ace-builds/src-noconflict') + '/',
      '/src/': '/absolute' + path.resolve('./src') + '/',
      '/release/': '/absolute' + path.resolve('./release') + '/'
    },
    plugins: [
      'karma-chrome-launcher',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-webpack'
    ],
    customLaunchers: {
      ChromeCustom: {
        base: 'Chrome',
        flags: ['--window-size=400,400']
      },
      ChromeCustomHeadless: {
        base: 'ChromeHeadless',
        flags: ['--window-size=400,400', '--no-sandbox', '--disable-dev-shm-usage']
      }
    },
    preprocessors: {
      'test/*_smoke_test.js': ['webpack']
    },
    webpack: {
      mode: 'development',
      target: ['web', 'es5'],
      resolve: {
        mainFields: ['browser', 'main', 'module'],
        fallback: {
          module: false
        }
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: { loader: 'babel-loader' }
          }
        ]
      }
    },
    reporters: ['mocha'],
    mochaReporter: {
      showDiff: true
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['Chrome', 'ChromeHeadless', 'ChromeCustom', 'ChromeCustomHeadless'],
    autoWatch: false,
    concurrency: Infinity
  })
}
