const path = require('path')

module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'webpack'],
    files: [
      'test/*_test.js',
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
      },
    ],
    customContextFile: 'test/html/custom_context.html',
    customDebugFile: 'test/html/custom_debug.html',
    proxies: {
       '/ace/': '/absolute' + path.resolve('./node_modules/ace-builds/src-noconflict') + '/',
       '/release/': '/absolute' + path.resolve('./release') + '/',
       '/src/': '/absolute' + path.resolve('./src') + '/'
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
      'test/*_test.js': ['webpack']
    },
    // webpackの設定
    webpack: {
      mode: 'development',
      target: ["web", "es5"],
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
    // reporter options
    mochaReporter: {
      showDiff: true
    },
    port: 9876, // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['Chrome', 'ChromeHeadless', 'ChromeCustom', 'ChromeCustomHeadless'],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity
  })
}
