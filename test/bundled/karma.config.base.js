const path = require('path')

module.exports = function (config) {
  config.set({
    basePath: '',
    urlRoot: '/',
    frameworks: ['chai', 'mocha', 'webpack'],
    files: [
      'test_base/*_test.js',
      {
        pattern: '../../release/*.js',
        included: false,
        served: true,
        watched: false,
        nocache: true
      },
      {
        pattern: 'test_base/js/*.js',
        included: false,
        served: true,
        watched: false,
        nocache: true
      },
      {
        pattern: 'test_base/resources/*',
        included: false,
        served: true,
        watched: false,
        nocache: true
      },
      {
        pattern: 'test_base/css/*.css',
        included: false,
        served: true,
        watched: false,
        nocache: true
      }
    ],
    customContextFile: 'test_base/html/custom_context.html',
    customDebugFile: 'test_base/html/custom_debug.html',
    proxies: {
      '/release/': '/absolute' + path.resolve('./release') + '/',
      '/src/': '/absolute' + path.resolve('./src') + '/',
      '/css/': '/base/test_base/css/',
      '/js/': '/base/test_base/js/',
      '/resources/': '/base/test_base/resources/'
    },
    plugins: [
      'karma-firefox-launcher',
      'karma-chrome-launcher',
      'karma-ie-launcher',
      '@chiragrupani/karma-chromium-edge-launcher',
      'karma-chai',
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
      },
      ChromeCustom: {
        base: 'Chrome',
        flags: ['--disable-translate', '--disable-extensions']
      },
      ChromeCustomHeadless: {
        base: 'ChromeHeadless',
        flags: ['--disable-translate', '--disable-extensions', '--no-sandbox']
      }
    },
    preprocessors: {
      'test_base/*_test.js': ['webpack']
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
    browsers: ['FirefoxCustom', 'FirefoxCustomHeadless', 'IE', 'Chrome', 'ChromeHeadless', 'Edge', 'EdgeHeadless'],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity
  })
}
