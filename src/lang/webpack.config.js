module.exports = {
    entry: {
        wnako3: './src/wnako3.js', // plugin_system + plugin_browser を含む
        plugin_turtle: './src/plugin_turtle.js',
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
                query: {
                    presets: ['env']
                }
            }
        ]
    }
};
