module.exports = {

    entry: {
        wnako3: './src/wnako3.js',
        plugin_browser: './src/plugin_browser.js',
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


