const path = require('path')
const StatsPlugin = require('stats-webpack-plugin') // バンドルサイズ解析のため
const TerserPlugin = require('terser-webpack-plugin') // サイズ縮小プラグイン
const { NormalModuleReplacementPlugin } = require('webpack')
const { AggressiveMergingPlugin } = require('webpack').optimize

const srcPath = path.join(__dirname, 'src')
const releasePath = path.join(__dirname, 'release')
const editorPath = path.join(__dirname, 'editor')

// @ts-ignore
process.noDeprecation = true

// [args] --mode=(production|development)
const mode_ = (process.env.NODE_ENV) ? process.env.NODE_ENV : 'development'

module.exports = {
  mode: mode_,
  target: ['web', 'es5'],
  entry: {
    wnako3: [path.join(srcPath, 'wnako3.js')], // plugin_system+plugin_browser含む
    wnako3webworker: [path.join(srcPath, 'wnako3webworker.js')], // plugin_system+plugin_browser_in_worker含む
    nako_gen_async: [path.join(srcPath, 'nako_gen_async.js')], // なでしこ3非同モード
    plugin_kansuji: [path.join(srcPath, 'plugin_kansuji.js')],
    plugin_markup: [path.join(srcPath, 'plugin_markup.js')],
    plugin_turtle: [path.join(srcPath, 'plugin_turtle.js')],
    plugin_csv: [path.join(srcPath, 'plugin_csv.js')],
    plugin_datetime: [path.join(srcPath, 'plugin_datetime.js')],
    plugin_caniuse: [path.join(srcPath, 'plugin_caniuse.js')],
    plugin_webworker: [path.join(srcPath, 'plugin_webworker.js')],
    editor: [path.join(editorPath, 'edit_main.jsx')],
    version: [path.join(editorPath, 'version_main.jsx')]
  },

  output: {
    path: releasePath,
    filename: '[name].js'
  },

  // devtool: 'cheap-module-eval-source-map',
  plugins: [
    new StatsPlugin('stats.json', {chunkModules: true}, null), // バンドルサイズ解析
    new AggressiveMergingPlugin(),
  ],

  module: {
    rules: [
      // .jsx file
      {
        test: /\.jsx$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: [editorPath, srcPath]
      },
      // .js file
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: [srcPath]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(jpg|png)$/,
        loader: 'url-loader'
      }
    ]
  },

  resolve: {
    extensions: ['*', '.webpack.js', '.web.js', '.js', '.jsx'],
    mainFields: ['browser', 'main', 'module']
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  },

  // 大幅なコンパイル速度向上のために
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
}
