const path = require('path')
const NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin

const srcPath = path.join(__dirname, 'src')
const releasePath = path.join(__dirname, 'release')
const editorPath = path.join(__dirname, 'editor')

process.noDeprecation = true

/**
 * caniuse-db/data.json のうち、なでしこ3の関数内で実際に使用しているのは agents だけなので、
 * caniuse-db/data.json の中身を agents のみにすることで生成物のサイズ削減を図る
 */
class CanIUseDBDataReplacementPlugin extends NormalModuleReplacementPlugin {
  constructor () {
    super(/caniuse-db\/data\.json/, path.join(__dirname, 'tmp', 'caniuse-db', 'data.json'))
  }

  apply (compiler) {
    const fs = require('fs')
    const data = require('caniuse-db/data.json')

    fs.mkdirSync(path.dirname(this.newResource), {recursive: true})
    fs.writeFileSync(this.newResource, JSON.stringify({agents: data.agents}))
    return super.apply(compiler)
  }
}

module.exports = {
  entry: {
    wnako3: [path.join(srcPath, 'wnako3.js')], // plugin_system+plugin_browser含む
    plugin_turtle: [path.join(srcPath, 'plugin_turtle.js')],
    editor: [path.join(editorPath, 'edit_main.jsx')],
    version: [path.join(editorPath, 'version_main.jsx')]
  },

  output: {
    path: releasePath,
    filename: '[name].js'
  },

  // devtool: 'cheap-module-eval-source-map',

  plugins: [
    new CanIUseDBDataReplacementPlugin()
  ],

  module: {
    rules: [
      // .jsx file
      {
        test: /\.jsx$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: [editorPath, srcPath],
        query: {
          presets: ['@babel/preset-env', '@babel/preset-react']
        }
      },
      // .js file
      {
        loader: 'babel-loader',
        test: /\.js$/,
        exclude: /node_modules/,
        include: [srcPath],
        query: {
          presets: ['@babel/preset-env']
        }
      },
      {
        loaders: ['style-loader', 'css-loader'],
        test: /\.css$/
      }
    ]
  },

  resolve: {
    extensions: ['*', '.webpack.js', '.web.js', '.js', '.jsx']
  }
}
