// @ts-nocheck
import path from 'path'
export default function (config) {
  config.set({
    frameworks: ['mocha', 'webpack'],
    files: [
      {
        pattern: 'test/*_test.js',
        type: 'module',
        included: false
      },
      {
        pattern: '../../release/*.js',
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
      },
      {
        pattern: '../node/*.nako3',
        included: false,
        served: true,
        watched: false,
        nocache: true
      }
    ],
    customContextFile: 'test/html/custom_context.html',
    proxies: {
      '/src/': '/absolute' + path.resolve('./src') + '/',
      '/release/': '/absolute' + path.resolve('./release') + '/',
      '/test/': '/absolute' + path.resolve('./test/node') + '/'
    },
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
      'test/*_test.js': ['webpack']
    },
    // webpackの設定
    webpack: {
      mode: 'development',
      target: ['web', 'es5'],
      resolve: {
        mainFields: ['browser', 'main', 'module']
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
    // reporter options
    mochaReporter: {
      showDiff: true
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
