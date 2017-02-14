
require('babel-polyfill');

// リリース時は、--releaseをつけてビルドする
const DEBUG = !process.argv.includes('--release');

export default {
  
  entry: {
    nako3: './src/nako3.js',
  },

  output: {
    path: DEBUG ? `${__dirname}/debug` : `${__dirname}/js`,
    filename: '[name].js'
  },
  
  devtool: DEBUG ? 'cheap-module-eval-source-map' : false,  

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        include: [
          `${__dirname}/src`,
        ],
        loader: "babel-loader",
      }
    ]
  }
}

