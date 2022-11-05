/**
 * file: plugin_node.mjs
 * node.js のためのプラグイン
 */
import fs from 'fs';
import fse from 'fs-extra';
import fetch from 'node-fetch';
import { exec, execSync } from 'child_process';
import shellQuote from 'shell-quote';
import path from 'path';
import iconv from 'iconv-lite';
import opener from 'opener';
import assert from 'assert';
// 「標準入力取得時」「尋」で利用
import readline from 'readline';
// ハッシュ関数で利用
import crypto from 'crypto';
import os from 'os';
import url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default {
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            sys.__quotePath = (fpath) => {
                if (process.platform === 'win32') {
                    fpath = fpath.replace(/\"/g, '');
                    fpath = fpath.replace(/\%/g, '"^%"');
                    fpath = '"' + fpath + '"';
                }
                else {
                    console.log('before:', fpath);
                    fpath = shellQuote.quote([fpath]);
                    console.log('after:', fpath);
                }
                return fpath;
            };
            sys.__getBinPath = (tool) => {
                let fpath = tool;
                if (process.platform === 'win32') {
                    if (!fileExists(tool)) {
                        const root = path.resolve(path.join(__dirname, '..'));
                        fpath = path.join(root, 'bin', tool + '.exe');
                        if (fileExists(fpath)) {
                            return `${fpath}`;
                        }
                        return tool;
                    }
                }
                return fpath;
            };
            sys.__getBokanPath = () => {
                let nakofile;
                const cmd = path.basename(process.argv[1]);
                if (cmd.indexOf('cnako3') < 0) {
                    nakofile = process.argv[1];
                }
                else {
                    nakofile = process.argv[2];
                }
                return path.dirname(path.resolve(nakofile));
            };
            sys.__v0['コマンドライン'] = process.argv;
            sys.__v0['ナデシコランタイムパス'] = process.argv[0];
            sys.__v0['ナデシコランタイム'] = path.basename(process.argv[0]);
            sys.__v0['母艦パス'] = sys.__getBokanPath();
            sys.__v0['AJAX:ONERROR'] = null;
        }
    },
    // @ファイル入出力
    '開': {
        type: 'func',
        josi: [['を', 'から']],
        pure: true,
        fn: function (s) {
            return fs.readFileSync(s, 'utf-8');
        }
    },
    '読': {
        type: 'func',
        josi: [['を', 'から']],
        pure: false,
        fn: function (s, sys) {
            return sys.__exec('開', [s]);
        }
    },
    'バイナリ読': {
        type: 'func',
        josi: [['を', 'から']],
        pure: true,
        fn: function (s, sys) {
            return fs.readFileSync(s);
        }
    },
    '保存': {
        type: 'func',
        josi: [['を'], ['へ', 'に']],
        pure: true,
        fn: function (s, f) {
            // Buffer?
            if (typeof s === 'string') {
                fs.writeFileSync(f, s, 'utf-8');
            }
            else if (s instanceof Buffer) {
                fs.writeFileSync(f, s);
            }
            else if (s instanceof ArrayBuffer) {
                fs.writeFileSync(f, Buffer.from(s));
            }
            else {
                fs.writeFileSync(f, s);
            }
        },
        return_none: true
    },
    'SJISファイル読': {
        type: 'func',
        josi: [['を', 'から']],
        pure: true,
        fn: function (s, sys) {
            // iconv.skipDecodeWarning = true
            const buf = fs.readFileSync(s);
            const text = iconv.decode(Buffer.from(buf), 'sjis');
            return text;
        }
    },
    'SJISファイル保存': {
        type: 'func',
        josi: [['を'], ['へ', 'に']],
        pure: true,
        fn: function (s, f, sys) {
            // iconv.skipDecodeWarning = true
            const buf = iconv.encode(s, 'Shift_JIS');
            fs.writeFileSync(f, buf);
        },
        return_none: true
    },
    'EUCファイル読': {
        type: 'func',
        josi: [['を', 'から']],
        pure: true,
        fn: function (s, sys) {
            const buf = fs.readFileSync(s);
            const text = iconv.decode(Buffer.from(buf), 'euc-jp');
            return text;
        }
    },
    'EUCファイル保存': {
        type: 'func',
        josi: [['を'], ['へ', 'に']],
        pure: true,
        fn: function (s, f, sys) {
            const buf = iconv.encode(s, 'euc-jp');
            fs.writeFileSync(f, buf);
        },
        return_none: true
    },
    '起動待機': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (s) {
            const r = execSync(s);
            return r.toString();
        }
    },
    '起動': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (s) {
            exec(s, (err, stdout, stderr) => {
                if (err) {
                    console.error(stderr);
                }
                else if (stdout) {
                    console.log(stdout);
                }
            });
        }
    },
    '起動時': {
        type: 'func',
        josi: [['で'], ['を']],
        pure: true,
        fn: function (callback, s, sys) {
            exec(s, (err, stdout, stderr) => {
                if (err) {
                    throw new Error(stderr);
                }
                else {
                    callback(stdout);
                }
            });
        }
    },
    'ブラウザ起動': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (url) {
            opener(url);
        }
    },
    'ファイル列挙': {
        type: 'func',
        josi: [['の', 'を', 'で']],
        pure: true,
        fn: function (s) {
            if (s.indexOf('*') >= 0) { // ワイルドカードがある場合
                const searchPath = path.dirname(s);
                const mask1 = path.basename(s)
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*');
                const mask2 = (mask1.indexOf(';') < 0)
                    ? mask1 + '$'
                    : '(' + mask1.replace(/;/g, '|') + ')$';
                const maskRE = new RegExp(mask2, 'i');
                const list = fs.readdirSync(searchPath);
                return list.filter((n) => maskRE.test(n));
            }
            else {
                return fs.readdirSync(s);
            }
        }
    },
    '全ファイル列挙': {
        type: 'func',
        josi: [['の', 'を', 'で']],
        pure: true,
        fn: function (s) {
            /** @type {string[]} */
            const result = [];
            // ワイルドカードの有無を確認
            let mask = '.*';
            let basepath = s;
            if (s.indexOf('*') >= 0) {
                basepath = path.dirname(s);
                const mask1 = path.basename(s)
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*');
                mask = (mask1.indexOf(';') < 0)
                    ? mask1 + '$'
                    : '(' + mask1.replace(/;/g, '|') + ')$';
            }
            basepath = path.resolve(basepath);
            const maskRE = new RegExp(mask, 'i');
            // 再帰関数を定義
            const enumR = (base) => {
                const list = fs.readdirSync(base);
                for (const f of list) {
                    if (f === '.' || f === '..') {
                        continue;
                    }
                    const fullpath = path.join(base, f);
                    let st = null;
                    try {
                        st = fs.statSync(fullpath);
                    }
                    catch (e) {
                        st = null;
                    }
                    if (st == null) {
                        continue;
                    }
                    if (st.isDirectory()) {
                        enumR(fullpath);
                        continue;
                    }
                    if (maskRE.test(f)) {
                        result.push(fullpath);
                    }
                }
            };
            // 検索実行
            enumR(basepath);
            return result;
        }
    },
    '存在': {
        type: 'func',
        josi: [['が', 'の']],
        pure: true,
        fn: function (path) {
            return fileExists(path);
        }
    },
    'フォルダ存在': {
        type: 'func',
        josi: [['が', 'の']],
        pure: true,
        fn: function (path) {
            return isDir(path);
        }
    },
    'フォルダ作成': {
        type: 'func',
        josi: [['の', 'を', 'に', 'へ']],
        pure: true,
        fn: function (path) {
            return fse.mkdirpSync(path);
        }
    },
    'ファイルコピー': {
        type: 'func',
        josi: [['から', 'を'], ['に', 'へ']],
        pure: true,
        fn: function (a, b, sys) {
            return fse.copySync(a, b);
        }
    },
    'ファイルコピー時': {
        type: 'func',
        josi: [['で'], ['から', 'を'], ['に', 'へ']],
        pure: true,
        fn: function (callback, a, b, sys) {
            return fse.copy(a, b, (err) => {
                if (err) {
                    throw new Error('ファイルコピー時:' + err);
                }
                callback();
            });
        },
        return_none: false
    },
    'ファイル移動': {
        type: 'func',
        josi: [['から', 'を'], ['に', 'へ']],
        pure: true,
        fn: function (a, b, sys) {
            return fse.moveSync(a, b);
        }
    },
    'ファイル移動時': {
        type: 'func',
        josi: [['で'], ['から', 'を'], ['に', 'へ']],
        pure: true,
        fn: function (callback, a, b, sys) {
            fse.move(a, b, (err) => {
                if (err) {
                    throw new Error('ファイル移動時:' + err);
                }
                callback();
            });
        },
        return_none: false
    },
    'ファイル削除': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        fn: function (path, sys) {
            return fse.removeSync(path);
        }
    },
    'ファイル削除時': {
        type: 'func',
        josi: [['で'], ['の', 'を']],
        pure: true,
        fn: function (callback, path, sys) {
            return fse.remove(path, (err) => {
                if (err) {
                    throw new Error('ファイル削除時:' + err);
                }
                callback();
            });
        },
        return_none: false
    },
    'ファイル情報取得': {
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (path, sys) {
            return fs.statSync(path);
        }
    },
    'ファイルサイズ取得': {
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (path, sys) {
            const st = fs.statSync(path);
            if (!st) {
                return -1;
            }
            return st.size;
        }
    },
    // @パス操作
    'ファイル名抽出': {
        type: 'func',
        josi: [['から', 'の']],
        pure: true,
        fn: function (s) {
            return path.basename(s);
        }
    },
    'パス抽出': {
        type: 'func',
        josi: [['から', 'の']],
        pure: true,
        fn: function (s) {
            return path.dirname(s);
        }
    },
    '絶対パス変換': {
        type: 'func',
        josi: [['を', 'の']],
        pure: true,
        fn: function (a) {
            return path.resolve(a);
        }
    },
    '相対パス展開': {
        type: 'func',
        josi: [['を'], ['で']],
        pure: true,
        fn: function (a, b) {
            return path.resolve(path.join(a, b));
        }
    },
    // @フォルダ取得
    'カレントディレクトリ取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            const cwd = process.cwd();
            return path.resolve(cwd);
        }
    },
    'カレントディレクトリ変更': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (dir) {
            process.chdir(dir);
        },
        return_none: true
    },
    '作業フォルダ取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            const cwd = process.cwd();
            return path.resolve(cwd);
        }
    },
    '作業フォルダ変更': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (dir) {
            process.chdir(dir);
        },
        return_none: true
    },
    'ホームディレクトリ取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
        }
    },
    'デスクトップ': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const home = sys.__exec('ホームディレクトリ取得', [sys]);
            return path.join(home, 'Desktop');
        }
    },
    'マイドキュメント': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const home = sys.__exec('ホームディレクトリ取得', [sys]);
            return path.join(home, 'Documents');
        }
    },
    '母艦パス': { type: 'const', value: '' },
    '母艦パス取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            return sys.__getBokanPath();
        }
    },
    'テンポラリフォルダ': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            // 環境変数からテンポラリフォルダを取得
            return os.tmpdir();
        }
    },
    '一時フォルダ作成': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (dir, sys) {
            if (dir === '' || !dir) {
                dir = os.tmpdir();
            }
            // 環境変数からテンポラリフォルダを取得
            return fs.mkdtempSync(dir);
        }
    },
    // @環境変数
    '環境変数取得': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (s) {
            return process.env[s];
        }
    },
    '環境変数一覧取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            return process.env;
        }
    },
    // @圧縮・解凍
    '圧縮解凍ツールパス': { type: 'const', value: '7z' },
    '圧縮解凍ツールパス変更': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v, sys) {
            sys.__v0['圧縮解凍ツールパス'] = v;
        },
        return_none: true
    },
    '解凍': {
        type: 'func',
        josi: [['を', 'から'], ['に', 'へ']],
        pure: true,
        fn: function (a, b, sys) {
            const tpath = sys.__quotePath(sys.__getBinPath(sys.__v0['圧縮解凍ツールパス']));
            a = sys.__quotePath(a);
            b = sys.__quotePath(b);
            const cmd = `${tpath} x ${a} -o${b} -y`;
            execSync(cmd);
            return true;
        }
    },
    '解凍時': {
        type: 'func',
        josi: [['で'], ['を', 'から'], ['に', 'へ']],
        pure: true,
        fn: function (callback, a, b, sys) {
            const tpath = sys.__quotePath(sys.__getBinPath(sys.__v0['圧縮解凍ツールパス']));
            a = sys.__quotePath(a);
            b = sys.__quotePath(b);
            const cmd = `${tpath} x ${a} -o${b} -y`;
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    throw new Error('[エラー]『解凍時』' + err);
                }
                callback(stdout);
            });
        },
        return_none: false
    },
    '圧縮': {
        type: 'func',
        josi: [['を', 'から'], ['に', 'へ']],
        pure: true,
        fn: function (a, b, sys) {
            const tpath = sys.__quotePath(sys.__getBinPath(sys.__v0['圧縮解凍ツールパス']));
            a = sys.__quotePath(a);
            b = sys.__quotePath(b);
            const cmd = `${tpath} a -r ${b} ${a} -y`;
            execSync(cmd);
            return true;
        }
    },
    '圧縮時': {
        type: 'func',
        josi: [['で'], ['を', 'から'], ['に', 'へ']],
        pure: true,
        fn: function (callback, a, b, sys) {
            const tpath = sys.__quotePath(sys.__getBinPath(sys.__v0['圧縮解凍ツールパス']));
            a = sys.__quotePath(a);
            b = sys.__quotePath(b);
            const cmd = `${tpath} a -r ${b} ${a} -y`;
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    throw new Error('[エラー]『圧縮時』' + err);
                }
                callback(stdout);
            });
        },
        return_none: true
    },
    // @Nodeプロセス
    '終': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            process.exit();
        },
        return_none: true
    },
    '強制終了時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (func, sys) {
            if (typeof (func) === 'string') {
                func = sys.__findFunc(func, '強制終了時');
            }
            process.on('SIGINT', (signal) => {
                const flag = func(sys);
                if (flag) {
                    process.exit();
                }
            });
        },
        return_none: true
    },
    '終了': {
        type: 'func',
        josi: [],
        pure: false,
        fn: function (sys) {
            sys.__exec('終', []);
        },
        return_none: true
    },
    'OS取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            return process.platform;
        }
    },
    'OSアーキテクチャ取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            return process.arch;
        }
    },
    // @コマンドラインと標準入出力
    'コマンドライン': { type: 'const', value: '' },
    'ナデシコランタイム': { type: 'const', value: '' },
    'ナデシコランタイムパス': { type: 'const', value: '' },
    '標準入力取得時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (callback) {
            const reader = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            reader.on('line', function (line) {
                callback(line);
            });
        }
    },
    '尋': {
        type: 'func',
        josi: [['と', 'を']],
        pure: true,
        asyncFn: true,
        fn: function (msg) {
            return new Promise((resolve, reject) => {
                const rl = readline.createInterface(process.stdin, process.stdout);
                if (!rl) {
                    reject(new Error('『尋』命令で標準入力が取得できません'));
                    return;
                }
                rl.question(msg, (buf) => {
                    rl.close();
                    if (buf && buf.match(/^[0-9.]+$/)) {
                        buf = parseFloat(buf);
                    }
                    resolve(buf);
                });
            });
        }
    },
    // @テスト
    'ASSERT等': {
        type: 'func',
        josi: [['と'], ['が']],
        pure: true,
        fn: function (a, b, sys) {
            assert.strictEqual(a, b);
        }
    },
    // @ネットワーク
    '自分IPアドレス取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const nif = os.networkInterfaces();
            if (!nif) {
                throw new Error('『自分IPアドレス取得』でネットワークのインターフェイスが種畜できません。');
            }
            /**
             * @type {string[]}
             */
            const result = [];
            for (const dev in nif) {
                const n = nif[dev];
                if (!n) {
                    continue;
                }
                n.forEach((detail) => {
                    if (detail.family === 'IPv4') {
                        result.push(detail.address);
                    }
                });
            }
            return result;
        }
    },
    '自分IPV6アドレス取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const nif = os.networkInterfaces();
            if (!nif) {
                throw new Error('『自分IPアドレス取得』でネットワークのインターフェイスが種畜できません。');
            }
            const result = [];
            for (const dev in nif) {
                const n = nif[dev];
                if (!n) {
                    continue;
                }
                n.forEach((detail) => {
                    if (detail.family === 'IPv6') {
                        result.push(detail.address);
                    }
                });
            }
            return result;
        }
    },
    // @Ajax
    'AJAX送信時': {
        type: 'func',
        josi: [['の'], ['まで', 'へ', 'に']],
        pure: true,
        fn: function (callback, url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            fetch(url, options).then((res) => {
                return res.text();
            }).then((text) => {
                sys.__v0['対象'] = text;
                callback(text);
            }).catch((err) => {
                console.log('[fetch.error]', err);
                throw err;
            });
        },
        return_none: true
    },
    'AJAX受信時': {
        type: 'func',
        josi: [['で'], ['から', 'を']],
        pure: true,
        fn: function (callback, url, sys) {
            sys.__exec('AJAX送信時', [callback, url, sys]);
        },
        return_none: true
    },
    'GET送信時': {
        type: 'func',
        josi: [['の'], ['まで', 'へ', 'に']],
        pure: false,
        fn: function (callback, url, sys) {
            sys.__exec('AJAX送信時', [callback, url, sys]);
        },
        return_none: true
    },
    'POST送信時': {
        type: 'func',
        josi: [['の'], ['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (callback, url, params, sys) {
            const flist = [];
            for (const key in params) {
                const v = params[key];
                const kv = encodeURIComponent(key) + '=' + encodeURIComponent(v);
                flist.push(kv);
            }
            const bodyData = flist.join('&');
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: bodyData
            };
            fetch(url, options).then((res) => {
                return res.text();
            }).then((text) => {
                sys.__v0['対象'] = text;
                callback(text);
            }).catch((err) => {
                sys.__v0['AJAX:ONERROR'](err);
            });
        }
    },
    'POSTフォーム送信時': {
        type: 'func',
        josi: [['の'], ['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (callback, url, params, sys) {
            const fd = new FormData();
            for (const key in params) {
                fd.set(key, params[key]);
            }
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                body: fd
            };
            fetch(url, options).then((res) => {
                return res.text();
            }).then((text) => {
                sys.__v0['対象'] = text;
                callback(text);
            }).catch((err) => {
                sys.__v0['AJAX:ONERROR'](err);
            });
        }
    },
    'AJAX失敗時': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (callback, sys) {
            sys.__v0['AJAX:ONERROR'] = callback;
        }
    },
    'AJAXオプション': { type: 'const', value: '' },
    'AJAXオプション設定': {
        type: 'func',
        josi: [['に', 'へ', 'と']],
        pure: true,
        fn: function (option, sys) {
            sys.__v0['AJAXオプション'] = option;
        },
        return_none: true
    },
    'AJAX保障送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に']],
        pure: true,
        fn: function (url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            return fetch(url, options);
        },
        return_none: false
    },
    'HTTP保障取得': {
        type: 'func',
        josi: [['の', 'から', 'を']],
        pure: true,
        fn: function (url, sys) {
            return sys.__exec('AJAX保障送信', [url, sys]);
        },
        return_none: false
    },
    'GET保障送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に']],
        pure: true,
        fn: function (url, sys) {
            return sys.__exec('AJAX保障送信', [url, sys]);
        },
        return_none: false
    },
    'POST保障送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (url, params, sys) {
            const flist = [];
            for (const key in params) {
                const v = params[key];
                const kv = encodeURIComponent(key) + '=' + encodeURIComponent(v);
                flist.push(kv);
            }
            const bodyData = flist.join('&');
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: bodyData
            };
            return fetch(url, options);
        },
        return_none: false
    },
    'POSTフォーム保障送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        fn: function (url, params, sys) {
            const fd = new FormData();
            for (const key in params) {
                fd.set(key, params[key]);
            }
            const options = {
                method: 'POST',
                body: fd
            };
            return fetch(url, options);
        },
        return_none: false
    },
    'AJAX内容取得': {
        type: 'func',
        josi: [['から'], ['で']],
        pure: true,
        fn: function (res, type, sys) {
            type = type.toString().toUpperCase();
            if (type === 'TEXT' || type === 'テキスト') {
                return res.text();
            }
            else if (type === 'JSON') {
                return res.json();
            }
            else if (type === 'BLOB') {
                return res.blob();
            }
            else if (type === 'ARRAY' || type === '配列') {
                return res.arrayBuffer();
            }
            else if (type === 'BODY' || type === '本体') {
                return res.body;
            }
            return res.body();
        },
        return_none: false
    },
    'AJAX受信': {
        type: 'func',
        josi: [['から', 'を']],
        pure: true,
        fn: function (url, sys) {
            if (sys.__genMode !== '非同期モード') {
                throw new Error('『AJAX受信』を使うには、プログラムの冒頭で「!非同期モード」と宣言してください。');
            }
            const sysenv = sys.setAsync(sys);
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            // fetch 実行
            fetch(url, options).then((res) => {
                if (res.ok) { // 成功したとき
                    return res.text();
                }
                else { // 失敗したとき
                    throw new Error('status=' + res.status);
                }
            }).then((text) => {
                sys.__v0['対象'] = text;
                sys.compAsync(sys, sysenv);
            }).catch((err) => {
                console.error('[AJAX受信のエラー]', err);
                sys.__errorAsync(err, sys);
            });
        },
        return_none: true
    },
    // @新AJAX
    'AJAXテキスト取得': {
        type: 'func',
        josi: [['から']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            const res = await fetch(url, options);
            const txt = await res.text();
            return txt;
        },
        return_none: false
    },
    'AJAX_JSON取得': {
        type: 'func',
        josi: [['から']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            const res = await fetch(url, options);
            const txt = await res.json();
            return txt;
        },
        return_none: false
    },
    'AJAXバイナリ取得': {
        type: 'func',
        josi: [['から']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            let options = sys.__v0['AJAXオプション'];
            if (options === '') {
                options = { method: 'GET' };
            }
            const res = await fetch(url, options);
            const bin = await res.arrayBuffer();
            return bin;
        },
        return_none: false
    },
    // @文字コード
    '文字コード変換サポート判定': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        fn: function (code, sys) {
            return iconv.encodingExists(code);
        }
    },
    'SJIS変換': {
        type: 'func',
        josi: [['に', 'へ', 'を']],
        pure: true,
        fn: function (str, sys) {
            // iconv.skipDecodeWarning = true
            return iconv.encode(str, 'Shift_JIS');
        }
    },
    'SJIS取得': {
        type: 'func',
        josi: [['から', 'を', 'で']],
        pure: true,
        fn: function (buf, sys) {
            // iconv.skipDecodeWarning = true
            return iconv.decode(Buffer.from(buf), 'sjis');
        }
    },
    'エンコーディング変換': {
        type: 'func',
        josi: [['を'], ['へ', 'で']],
        pure: true,
        fn: function (s, code, sys) {
            // iconv.skipDecodeWarning = true
            return iconv.encode(s, code);
        }
    },
    'エンコーディング取得': {
        type: 'func',
        josi: [['を'], ['から', 'で']],
        pure: true,
        fn: function (buf, code, sys) {
            // iconv.skipDecodeWarning = true
            return iconv.decode(Buffer.from(buf), code);
        }
    },
    // @ハッシュ関数
    'ハッシュ関数一覧取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            return crypto.getHashes();
        }
    },
    'ハッシュ値計算': {
        type: 'func',
        josi: [['を'], ['の'], ['で']],
        pure: true,
        fn: function (s, alg, enc, sys) {
            const hashsum = crypto.createHash(alg);
            hashsum.update(s);
            return hashsum.digest(enc);
        }
    }
};
// ローカル関数
function fileExists(f) {
    try {
        fs.statSync(f);
        return true;
    }
    catch (err) {
        return false;
    }
}
function isDir(f) {
    try {
        const st = fs.statSync(f);
        return st.isDirectory();
    }
    catch (err) {
        return false;
    }
}
