module.exports = {
  
  entry: {
    nako3: './src/nako3.js',
  },

  output: {
    path: `${__dirname}/js`,
    filename: '[name].js'
  },
  
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


