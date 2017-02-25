module.exports = {
  
  entry: {
    nako3: './src/nako3.js',
  },

  output: {
    path: `${__dirname}/release`,
    filename: '[name].js'
  },
  
  devtool: 'cheap-module-eval-source-map',

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
};


