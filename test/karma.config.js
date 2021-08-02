const path = require('path')

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'webpack'],
    files: [
      'common/*.js'
    ],
    plugins: [
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-webpack'
    ],
    customLaunchers: {
      FirefoxCustom: {
        base: 'Firefox',
        prefs: {
          'dom.w3c_touch_events.enabled': 1,
          'dom.w3c_touch_events.legacy_apis.enabled': true
        },
        flags: ['-width', 400, '-height', 400]
      },
      FirefoxCustomHeadless: {
        base: 'FirefoxHeadless',
        prefs: {
          'dom.w3c_touch_events.enabled': 1,
          'dom.w3c_touch_events.legacy_apis.enabled': true
        },
        flags: ['-width', 400, '-height', 400]
      }
    },
    preprocessors: {
      'common/*.js': ['webpack']
    },
    // webpackの設定
    webpack: {
      mode: 'development',
      target: ['web', 'es5'],
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: { loader: 'babel-loader' }
          }
        ]
      },
      resolve: {
        mainFields: ['browser', 'main', 'module'],
        alias: {
          'assert': path.resolve(__dirname, '../utils/assert.js'),
          'root': path.join(__dirname, '..'),
          'nako3': path.join(__dirname, '../src'),
          'utils': path.join(__dirname, '../utils')
        }
      }
    },
    reporters: ['mocha'],
    // reporter options
    mochaReporter: {
      showDiff: true
    },
    coverageReporter: {
      dir: '../coverage/common',
      subdir: function (browser) {
        return browser.toLowerCase().split(/[ /-]/)[0]
      },
      reporters: [
        { type: 'text' },
        { type: 'text-summary' },
        { type: 'lcov' },
        { type: 'text', file: 'text.txt' },
        { type: 'json', file: 'text.json' },
        { type: 'text-summary', file: 'text-summary.txt' },
        { type: 'lcovonly', file: 'report-lcovonly.txt' }
      ],
      instrumenterOptions: {
        istanbul: { noCompact: true }
      }
    },
    port: 9876, // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['Firefox', 'FirefoxHeadless', 'FirefoxCustom', 'FirefoxCustomHeadless'],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity
  })
}
