/** 簡易HTTPサーバ */
import fs from 'fs';
import http from 'http';
import path from 'path';
// 定数
const HTTPSERVER_LOGID = '[簡易HTTPサーバ]';
class EasyURLItem {
    constructor(action) {
        this.action = action;
        this.url = '';
        this.path = '';
        this.callback = (req, res) => { };
    }
}
class EasyURLDispather {
    constructor() {
        this.server = null;
        this.items = [];
    }
    doRequest(req, res) {
        const url = req.url;
        console.log(`${HTTPSERVER_LOGID} 要求あり:` + url);
        // URLの一致を調べてアクションを実行
        const filtered = this.items.filter(v => url.startsWith(v.url));
        for (const it of filtered) {
            let isBreak = true;
            if (it.action === 'static') {
                isBreak = this.doRequestStatic(req, res, it);
            }
            else if (it.action === 'callback') {
                isBreak = this.doRequestCallback(req, res, it);
            }
            if (!isBreak) {
                break;
            }
        }
    }
    doRequestStatic(req, res, it) {
        let url = ('' + req.url).replace(/\./g, ''); // URLの.や..を許可しない
        url = url.substring(it.url.length);
        const fpath = path.join(it.path, url);
        if (!fs.existsSync(fpath)) {
            res.statusCode = 404;
            res.end('<html><meta charset="utf-8"><body><h1>404 ファイルがありません。</h1></body></html>');
            return true;
        }
        // ファイルを読んで返す
        fs.readFile(fpath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Failed to read file.');
                return;
            }
            const mime = getMIMEType(fpath);
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
        });
        return false;
    }
    doRequestCallback(req, res, it) {
        return false;
    }
    addItem(it) {
        this.items.push(it);
    }
    parseURL(uri) {
        const params = {};
        if (uri.indexOf('?') >= 0) {
            const a = uri.split('?');
            uri = a[0];
            const q = String(a[1]).split('&');
            for (const kv of q) {
                const qq = kv.split('=');
                const key = decodeURIComponent(qq[0]);
                const val = decodeURIComponent(qq[1]);
                params[key] = val;
            }
        }
        return params;
    }
}
// MIMEタイプ
const MimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'svg+xml'
};
function getMIMEType(url) {
    let ext = '.txt';
    const m = url.match(/(\.[a-z0-9_]+)$/);
    if (m) {
        ext = m[1];
    }
    if (MimeTypes[ext]) {
        return MimeTypes[ext];
    }
    return 'text/plain';
}
const PluginHttpServer = {
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            sys.__httpserver = null;
        }
    },
    // @簡易HTTPサーバ
    'お世話': { type: 'const', value: 1 },
    '簡易HTTPサーバ起動': {
        type: 'func',
        josi: [['の', 'で']],
        pure: true,
        fn: function (port, sys) {
            // 管理オブジェクトを作成する
            const dp = sys.__httpserver = new EasyURLDispather();
            // サーバオブジェクトを生成
            dp.server = http.createServer((req, res) => {
                dp.doRequest(req, res);
            });
            // サーバ起動
            dp.server.listen(port, () => {
                console.log(`${HTTPSERVER_LOGID} ポート番号(${port})で監視開始`);
            });
        }
    },
    '簡易HTTPサーバ静的パス指定': {
        type: 'func',
        josi: [['を'], ['に', 'へ']],
        pure: true,
        fn: function (url, path, sys) {
            const dp = sys.__httpserver;
            const it = new EasyURLItem('static');
            it.url = url;
            it.path = path;
            dp.addItem(it);
        }
    }
};
export default PluginHttpServer;