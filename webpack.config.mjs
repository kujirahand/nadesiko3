// webpack
import path from 'path'
import { fileURLToPath } from 'url'
import StatsPlugin from 'stats-webpack-plugin' // バンドルサイズ解析のため
import TerserPlugin from 'terser-webpack-plugin' // サイズ縮小プラグイン

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcPath = path.join(__dirname, 'src')
const srcCorePath = path.join(__dirname, 'node_modules/nadesiko3core/src')
const releasePath = path.join(__dirname, 'release')
const editorPath = path.join(__dirname, 'editor')

// @ts-ignore
process.noDeprecation = true

// [args] --mode=(production|development)
const mode_ = (process.env.NODE_ENV) ? process.env.NODE_ENV : 'development'

export default {
  mode: mode_,
  target: ['web', 'es5'],
  entry: {
    wnako3: [path.join(srcPath, 'wnako3.mjs')], // plugin_system+plugin_browser含む
    wnako3webworker: [path.join(srcPath, 'wnako3webworker.mjs')], // plugin_system+plugin_browser_in_worker含む
    nako_gen_async: [path.join(srcCorePath, 'nako_gen_async.mjs')], // なでしこ3非同モード
    plugin_kansuji: [path.join(srcPath, 'plugin_kansuji.mjs')],
    plugin_markup: [path.join(srcPath, 'plugin_markup.mjs')],
    plugin_turtle: [path.join(srcPath, 'plugin_turtle.mjs')],
    // plugin_csv: [path.join(srcCorePath, 'plugin_csv.mjs')],
    plugin_datetime: [path.join(srcPath, 'plugin_datetime.mjs')],
    plugin_caniuse: [path.join(srcPath, 'plugin_caniuse.mjs')],
    plugin_webworker: [path.join(srcPath, 'plugin_webworker.mjs')],
    plugin_weykturtle3d: [path.join(srcPath, 'plugin_weykturtle3d.mjs')],
    editor: [path.join(editorPath, 'edit_main.jsx')],
    version: [path.join(editorPath, 'version_main.jsx')]
  },
  output: {
    path: releasePath,
    filename: '[name].js'
  },

  plugins: [
    new StatsPlugin('stats.json', { chunkModules: true }, null) // バンドルサイズ解析
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
    extensions: ['*',  '.webpack.mjs', '.webpack.js', '.web.js', '.js', '.mjs', '.jsx'],
    mainFields: ['browser', 'main', 'module']
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  }
}
