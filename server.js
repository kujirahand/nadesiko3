'use strict';

const express = require('express');
const app = express();
const serveIndex = require('serve-index');
const port = process.env['NAKO_SERVER_PORT'] || 8081;

// ルーティングの指定
app.get('/', function (req, res) {
    res.redirect(302, "/demo");
});
app.use(express.static('.'));
app.use(serveIndex('.', {icons: true}));

// サーバーを起動
const server = app.listen(port, function () {
    const port = server.address().port;
    console.log('nako3 server start...');
    console.log(`http://localhost:${port}/`);
});


