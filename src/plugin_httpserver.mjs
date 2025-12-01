/** 簡易HTTPサーバ */
import fs from 'fs';
import http from 'http';
import path from 'path';
// 定数
const HTTPSERVER_LOGID = '[簡易HTTPサーバ]';
const ERR_NOHTTPSERVER = '最初に『簡易HTTPサーバ起動時』を実行してサーバを起動する必要があります。';
class EasyURLItem {
    constructor(action) {
        this.action = action;
        this.url = '';
        this.path = '';
        this.callback = (req, res) => { };
    }
}
class EasyURLDispather {
    constructor(sys) {
        this.server = null;
        this.items = [];
        this.sys = sys;
        this.curReq = null;
        this.curRes = null;
        this.isEnd = false;
        this.usedHeader = false;
    }
    doRequest(req, res) {
        this.curReq = req;
        this.curRes = res;
        console.log(`${HTTPSERVER_LOGID} 要求あり URL=` + req.url);
        const params = this.parseURL(req.url);
        const url = params['?URL'];
        this.sys.__setSysVar('GETデータ', params);
        // URLの一致を調べてアクションを実行
        const filtered = this.items.filter(v => url.startsWith(v.url)).sort((a, b) => { return b.url.length - a.url.length; });
        for (const it of filtered) {
            let isBreak = false;
            if (it.action === 'static') {
                isBreak = this.doRequestStatic(req, res, it);
            }
            else if (it.action === 'callback') {
                isBreak = this.doRequestCallback(req, res, it);
            }
            if (isBreak) {
                break;
            }
        }
    }
    return404(res) {
        console.error(HTTPSERVER_LOGID, 404, '見当たりません。');
        res.statusCode = 404;
        res.end('<html><meta charset="utf-8"><body><h1>404 見当たりません。</h1></body></html>');
    }
    doRequestStatic(req, res, it) {
        let url = ('' + req.url).replace(/\.\./g, ''); // URLの..を許可しない
        url = url.substring(it.url.length);
        let fpath = path.join(it.path, url);
        console.log('FILE=', fpath);
        if (!fs.existsSync(fpath)) {
            this.return404(res);
            return true;
        }
        // ディレクトリなら index.html を確認
        if (isDir(fpath)) {
            fpath = path.join(fpath, 'index.html');
            console.log('FILE(DIR)=', fpath);
            if (!fs.existsSync(fpath)) {
                this.return404(res);
                return true;
            }
        }
        // ファイルを読んで返す
        fs.readFile(fpath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end('Failed to read file.');
                console.warn(HTTPSERVER_LOGID, 'read error file=', fpath);
                return true;
            }
            const mime = getMIMEType(fpath);
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
            return true;
        });
        return true;
    }
    doRequestCallback(req, res, it) {
        this.isEnd = false;
        this.usedHeader = false;
        it.callback(req, res);
        if (!this.isEnd) {
            return true;
        }
        return true;
    }
    addItem(it) {
        this.items.push(it);
    }
    parseURL(uri) {
        const params = {};
        if (uri.indexOf('?') >= 0) {
            const a = uri.split('?');
            params['?URL'] = a[0];
            const q = String(a[1]).split('&');
            for (const kv of q) {
                const qq = kv.split('=');
                const key = decodeURIComponent(qq[0]);
                const val = decodeURIComponent(qq[1]);
                params[key] = val;
            }
        }
        else {
            params['?URL'] = uri;
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
// ディレクトリか判定
function isDir(pathName) {
    try {
        // node v12以下ではエラーがあると例外を返す
        const stats = fs.statSync(pathName);
        if (stats && stats.isDirectory()) {
            return true;
        }
    }
    catch (err) {
        return false;
    }
}
const PluginHttpServer = {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_httpserver', // プラグインの名前
            description: 'HTTPサーバプラグイン', // プラグインの説明
            pluginVersion: '3.6.0', // プラグインのバージョン
            nakoRuntime: ['cnako'], // 対象ランタイム
            nakoVersion: '3.6.0' // 要求なでしこバージョン
        }
    },
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            sys.__httpserver = null;
        }
    },
    // @簡易HTTPサーバ
    'GETデータ': { type: 'const', value: '' }, // @GETでーた
    '簡易HTTPサーバ起動時': {
        type: 'func',
        josi: [['を'], ['の', 'で']],
        pure: true,
        fn: function (callback, port, sys) {
            // 管理オブジェクトを作成する
            const dp = sys.__httpserver = new EasyURLDispather(sys);
            // サーバオブジェクトを生成
            dp.server = http.createServer((req, res) => {
                dp.doRequest(req, res);
            });
            // サーバ起動
            dp.server.listen(port, () => {
                console.log(`${HTTPSERVER_LOGID} ポート番号(${port})で監視開始`);
                if (typeof callback === 'string') {
                    callback = sys.__findFunc(callback);
                }
                callback(sys);
            });
        }
    },
    '簡易HTTPサーバ静的パス指定': {
        type: 'func',
        josi: [['を'], ['に', 'へ']],
        pure: true,
        fn: function (url, path, sys) {
            if (sys.__httpserver === null) {
                throw new Error(ERR_NOHTTPSERVER);
            }
            const dp = sys.__httpserver;
            const it = new EasyURLItem('static');
            it.url = url;
            it.path = path;
            dp.addItem(it);
        }
    },
    '簡易HTTPサーバ受信時': {
        type: 'func',
        josi: [['を'], ['に', 'へ', 'で']],
        pure: true,
        fn: function (callback, url, sys) {
            if (sys.__httpserver === null) {
                throw new Error(ERR_NOHTTPSERVER);
            }
            const dp = sys.__httpserver;
            const it = new EasyURLItem('callback');
            if (url === '') {
                url = '/';
            }
            if (url.charAt(0) !== '/') {
                url = '/' + url;
            }
            it.url = url;
            if (typeof callback === 'string') {
                callback = sys.__findFunc(callback);
            }
            it.callback = callback;
            dp.addItem(it);
        }
    },
    '簡易HTTPサーバ出力': {
        type: 'func',
        josi: [['を', 'と', 'の']],
        pure: true,
        fn: function (s, sys) {
            if (sys.__httpserver === null) {
                throw new Error(ERR_NOHTTPSERVER);
            }
            const dp = sys.__httpserver;
            if (dp.curRes === null) {
                throw new Error('『簡易HTTPサーバ受信時』のみ出力が可能です。');
            }
            if (!dp.usedHeader) {
                dp.usedHeader = true;
                dp.curRes.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            }
            dp.curRes.end(s);
            dp.isEnd = true;
        }
    },
    '簡易HTTPサーバヘッダ出力': {
        type: 'func',
        josi: [['で'], ['を', 'の', 'と']],
        pure: true,
        fn: function (no, head, sys) {
            if (sys.__httpserver === null) {
                throw new Error(ERR_NOHTTPSERVER);
            }
            const dp = sys.__httpserver;
            if (dp.curRes === null) {
                throw new Error('『簡易HTTPサーバ受信時』のみ出力が可能です。');
            }
            dp.curRes.writeHead(no, head);
            dp.isEnd = true;
            dp.usedHeader = true;
        }
    },
    '簡易HTTPサーバ移動': {
        type: 'func',
        josi: [['へ', 'に']],
        pure: true,
        fn: function (url, sys) {
            if (sys.__httpserver === null) {
                throw new Error(ERR_NOHTTPSERVER);
            }
            const dp = sys.__httpserver;
            if (dp.curRes === null) {
                throw new Error('『簡易HTTPサーバ受信時』のみ出力が可能です。');
            }
            console.log(HTTPSERVER_LOGID, '移動=', url);
            dp.curRes.writeHead(302, { 'Location': url });
            dp.curRes.end(`<html><body><a href="${url}">JUMP</a></body></html>`);
            dp.isEnd = true;
        }
    }
};
export default PluginHttpServer;
