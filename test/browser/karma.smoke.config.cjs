const path = require('path')

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'webpack'],
    files: [
      'test/*_smoke_test.js'
    ],
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
        },
        alias: {
          root: path.join(__dirname, '../..'),
          nako3: path.join(__dirname, '../../src'),
          utils: path.join(__dirname, '../../utils'),
          nadesiko3core: path.join(__dirname, '../../core')
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
