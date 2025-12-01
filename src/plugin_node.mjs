/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * file: plugin_node.mjs
 * node.js のためのプラグイン
 */
import fs from 'node:fs';
import fse from 'fs-extra';
import fetch, { FormData, Blob } from 'node-fetch';
import { exec, execSync } from 'node:child_process';
import shellQuote from 'shell-quote';
import path from 'node:path';
import iconv from 'iconv-lite';
import opener from 'opener';
import assert from 'node:assert';
// ハッシュ関数で利用
import crypto from 'node:crypto';
import os from 'node:os';
import url from 'node:url';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { isWindows, getCommandLineArgs } from './deno_wrapper.mjs';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ローカル関数
function fileExists(f) {
    try {
        fs.statSync(f);
        return true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }
    catch (err) {
        return false;
    }
}
function isDir(f) {
    try {
        const st = fs.statSync(f);
        return st.isDirectory();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }
    catch (err) {
        return false;
    }
}
let nodeProcess = globalThis.process;
// Denoのためのラッパー
if (typeof globalThis.Deno !== 'undefined') {
    nodeProcess = {
        platform: globalThis.Deno.build.os,
        arch: globalThis.Deno.build.arch,
        argv: getCommandLineArgs(),
        exit: (code) => {
            globalThis.Deno.exit(code);
        },
        cwd: () => {
            return globalThis.Deno.cwd();
        }
    };
}
export default {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_node', // プラグインの名前
            description: 'Node.js向けプラグイン', // プラグインの説明
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
            // OS判定
            const isWin = isWindows();
            sys.tags.isWin = isWin;
            // プラグインの初期化
            sys.tags.__quotePath = (fpath) => {
                if (isWin) {
                    fpath = fpath.replace(/"/g, '');
                    fpath = fpath.replace(/%/g, '"^%"');
                    fpath = '"' + fpath + '"';
                }
                else {
                    // console.log('before:', fpath)
                    fpath = shellQuote.quote([fpath]);
                    // console.log('after:', fpath)
                }
                return fpath;
            };
            sys.tags.__getBinPath = (tool) => {
                let fpath = tool;
                if (isWin) {
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
            sys.tags.__getBokanPath = () => {
                // Electronから実行した場合
                if (nodeProcess.argv.length === 1) {
                    return path.dirname(path.resolve(nodeProcess.argv[0]));
                }
                // cnako3のときランタイムを除いたメインファイルのパスを取得する
                let mainfile = '.';
                for (let i = 0; i < nodeProcess.argv.length; i++) {
                    const f = nodeProcess.argv[i];
                    const bf = path.basename(f);
                    if (bf === 'node' || bf === 'node.exe') {
                        continue;
                    } // runtime
                    if (bf === 'cnako3.mjs' || bf === 'cnako3.mts') {
                        continue;
                    } // mts/mjs
                    if (bf.substring(0, 1) === '-') {
                        continue;
                    } // options
                    mainfile = f;
                    break;
                }
                return path.dirname(path.resolve(mainfile));
            };
            sys.__setSysVar('コマンドライン', nodeProcess.argv);
            sys.__setSysVar('ナデシコランタイムパス', nodeProcess.argv[0]);
            sys.__setSysVar('ナデシコランタイム', path.basename(nodeProcess.argv[0]));
            sys.__setSysVar('母艦パス', sys.tags.__getBokanPath());
            sys.__setSysVar('AJAX:ONERROR', null);
            // 『尋』『文字尋』『標準入力取得時』『標準入力全取得』のための一時変数
            // nadesiko3-serverを起動した時、ctrl+cでプロセスが止まらない(#1668)を考慮した設計にする
            // 非同期通信を使うと標準入力を占有してしまうため、一時的に全部の標準入力を取得しておいて、残りをバッファに入れておく仕組みにする
            // 加えて、pause/resumeを使わない仕掛けにする
            // 標準入力の行読み取りを単一リスナーで処理し、共有キュー/ハンドラーで配信する
            sys.tags.__stdinSetup = false;
            sys.tags.__stdinQueue = [];
            sys.tags.__stdinWaiters = [];
            sys.tags.__lineHandlers = [];
            sys.tags.__stdinEnded = false;
            sys.tags.__endWaiters = [];
            sys.tags.__stdinRaw = '';
            sys.tags.__setupStdin = () => {
                if (sys.tags.__stdinSetup) {
                    return;
                }
                sys.tags.__stdinSetup = true;
                let partial = '';
                const emitLine = (line) => {
                    // 永続ハンドラーへ通知（『標準入力取得時』など）
                    for (const h of sys.tags.__lineHandlers) {
                        try {
                            h(line);
                        }
                        catch (e) { /* ignore */ }
                    }
                    // 一度きりの待機者（『尋』『文字尋』）へ優先的に配信、なければキュー
                    if (sys.tags.__stdinWaiters.length > 0) {
                        const w = sys.tags.__stdinWaiters.shift();
                        if (w) {
                            w(line);
                        }
                    }
                    else {
                        sys.tags.__stdinQueue.push(line);
                    }
                };
                nodeProcess.stdin.on('data', (buf) => {
                    // 生データも保持（『標準入力全取得』向け）
                    try {
                        sys.tags.__stdinRaw += buf.toString();
                    }
                    catch (_) { }
                    const bufStr = buf.toString();
                    for (let i = 0; i < bufStr.length; i++) {
                        const c = bufStr.charAt(i);
                        if (c === '\r') {
                            continue;
                        }
                        if (c === '\n') {
                            emitLine(partial);
                            partial = '';
                            continue;
                        }
                        partial += c;
                    }
                });
                nodeProcess.stdin.on('end', () => {
                    if (partial !== '') {
                        emitLine(partial);
                        partial = '';
                    }
                    sys.tags.__stdinEnded = true;
                    if (sys.tags.__endWaiters && Array.isArray(sys.tags.__endWaiters)) {
                        for (const w of sys.tags.__endWaiters) {
                            try {
                                w();
                            }
                            catch (_) { }
                        }
                        sys.tags.__endWaiters = [];
                    }
                });
            };
            sys.tags.readline = (question, handler) => {
                sys.tags.__setupStdin();
                if (question) {
                    nodeProcess.stdout.write(question);
                }
                // ハンドラー指定時は永続購読として登録
                if (handler !== undefined) {
                    sys.tags.__lineHandlers.push(handler);
                    return true;
                }
                // すでにキューがあれば即返す
                if (sys.tags.__stdinQueue.length > 0) {
                    const line = sys.tags.__stdinQueue.shift();
                    return line;
                }
                // 次の1行を待機
                return new Promise((resolve) => {
                    sys.tags.__stdinWaiters.push(resolve);
                });
            };
        }
    },
    // @ファイル入出力
    '開': {
        type: 'func',
        josi: [['を', 'から']],
        pure: true,
        fn: function (f) {
            return fs.readFileSync(f, 'utf-8');
        }
    },
    '読': {
        type: 'func',
        josi: [['を', 'から']],
        pure: true,
        fn: function (f) {
            return fs.readFileSync(f, 'utf-8');
        }
    },
    'バイナリ読': {
        type: 'func',
        josi: [['を', 'から']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (s, sys) {
            return fs.readFileSync(s);
        }
    },
    '保存': {
        type: 'func',
        josi: [['を'], ['へ', 'に']],
        pure: true,
        asyncFn: true,
        fn: function (s, f) {
            return new Promise((resolve, reject) => {
                // 引数sの型によって書き込みオプションを変更する
                const options = {};
                if (typeof s === 'string') {
                    options.encoding = 'utf-8';
                }
                if (s instanceof ArrayBuffer) {
                    s = Buffer.from(s);
                }
                // データをファイルへ書き込む
                fs.writeFile(f, s, options, (err) => {
                    if (err) {
                        reject(new Error(`ファイル『${f}』に保存できませんでした。理由:${err.message}`));
                        return;
                    }
                    resolve(null);
                });
            });
        },
        return_none: true
    },
    'SJISファイル読': {
        type: 'func',
        josi: [['を', 'から']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                else {
                    if (stdout) {
                        console.log(stdout);
                    }
                }
            });
        }
    },
    '起動時': {
        type: 'func',
        josi: [['で'], ['を']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                    let st;
                    try {
                        st = fs.statSync(fullpath);
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    }
                    catch (e) {
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (a, b, sys) {
            return fse.copySync(a, b);
        }
    },
    'ファイルコピー時': {
        type: 'func',
        josi: [['で'], ['から', 'を'], ['に', 'へ']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (a, b, sys) {
            return fse.moveSync(a, b);
        }
    },
    'ファイル移動時': {
        type: 'func',
        josi: [['で'], ['から', 'を'], ['に', 'へ']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (path, sys) {
            return fse.removeSync(path);
        }
    },
    'ファイル削除時': {
        type: 'func',
        josi: [['で'], ['の', 'を']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (path, sys) {
            return fs.statSync(path);
        }
    },
    'ファイルサイズ取得': {
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            const cwd = nodeProcess.cwd();
            return path.resolve(cwd);
        }
    },
    'カレントディレクトリ変更': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (dir) {
            nodeProcess.chdir(dir);
        },
        return_none: true
    },
    '作業フォルダ取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            const cwd = nodeProcess.cwd();
            return path.resolve(cwd);
        }
    },
    '作業フォルダ変更': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (dir) {
            nodeProcess.chdir(dir);
        },
        return_none: true
    },
    'ホームディレクトリ取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            return nodeProcess.env[sys.tags.isWin ? 'USERPROFILE' : 'HOME'];
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
    '母艦パス': { type: 'const', value: '' }, // @ぼかんぱす
    '母艦パス取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            return sys.tags.__getBokanPath();
        }
    },
    'テンポラリフォルダ': {
        type: 'func',
        josi: [],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (sys) {
            // 環境変数からテンポラリフォルダを取得
            return os.tmpdir();
        }
    },
    '一時フォルダ作成': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            return nodeProcess.env[s];
        }
    },
    '環境変数一覧取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            return nodeProcess.env;
        }
    },
    // @圧縮・解凍
    '圧縮解凍ツールパス': { type: 'const', value: '7z' }, // @あっしゅくかいとうつーるぱす
    '圧縮解凍ツールパス変更': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v, sys) {
            sys.__setSysVar('圧縮解凍ツールパス', v);
        },
        return_none: true
    },
    '解凍': {
        type: 'func',
        josi: [['を', 'から'], ['に', 'へ']],
        pure: true,
        fn: function (a, b, sys) {
            const tpath = sys.tags.__quotePath(sys.tags.__getBinPath(sys.__getSysVar('圧縮解凍ツールパス')));
            a = sys.tags.__quotePath(a);
            b = sys.tags.__quotePath(b);
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
            const tpath = sys.tags.__quotePath(sys.tags.__getBinPath(sys.__getSysVar('圧縮解凍ツールパス')));
            a = sys.tags.__quotePath(a);
            b = sys.tags.__quotePath(b);
            const cmd = `${tpath} x ${a} -o${b} -y`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            const tpath = sys.tags.__quotePath(sys.tags.__getBinPath(sys.__getSysVar('圧縮解凍ツールパス')));
            a = sys.tags.__quotePath(a);
            b = sys.tags.__quotePath(b);
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
            const tpath = sys.tags.__quotePath(sys.tags.__getBinPath(sys.__getSysVar('圧縮解凍ツールパス')));
            a = sys.tags.__quotePath(a);
            b = sys.tags.__quotePath(b);
            const cmd = `${tpath} a -r ${b} ${a} -y`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    throw new Error('[エラー]『圧縮時』' + (err.message || JSON.stringify(err)));
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
            nodeProcess.exit();
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            nodeProcess.on('SIGINT', (signal) => {
                const flag = func(sys);
                if (flag) {
                    nodeProcess.exit();
                }
            });
        },
        return_none: true
    },
    '終了': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            sys.__exec('終', []);
        },
        return_none: true
    },
    'OS取得': {
        type: 'func',
        josi: [],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (sys) {
            return nodeProcess.platform;
        }
    },
    'OSアーキテクチャ取得': {
        type: 'func',
        josi: [],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (sys) {
            return nodeProcess.arch;
        }
    },
    // @コマンドラインと標準入出力
    'コマンドライン': { type: 'const', value: '' }, // @こまんどらいん
    'ナデシコランタイム': { type: 'const', value: '' }, // @なでしこらんたいむ
    'ナデシコランタイムパス': { type: 'const', value: '' }, // @なでしこらんたいむぱす
    '標準入力取得時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (callback, sys) {
            if (!sys.tags.readline) {
                throw new Error('『標準入力取得時』命令で標準入力が取得できません');
            }
            if (typeof callback === 'string') {
                callback = sys.__findFunc(callback, '標準入力取得時');
            }
            sys.tags.readline('', (line) => {
                sys.__setSysVar('対象', line);
                callback(line);
            });
        }
    },
    '尋': {
        type: 'func',
        josi: [['と', 'を']],
        pure: true,
        asyncFn: true,
        fn: async function (msg, sys) {
            if (!sys.tags.readline) {
                throw new Error('『尋』命令で標準入力が取得できません');
            }
            const line = await sys.tags.readline(msg);
            const lineAsNumber = Number(line);
            if (isNaN(lineAsNumber)) {
                return line;
            }
            else {
                return lineAsNumber;
            }
        }
    },
    '文字尋': {
        type: 'func',
        josi: [['と', 'を']],
        pure: true,
        asyncFn: true,
        fn: async function (msg, sys) {
            if (!sys.tags.readline) {
                throw new Error('『尋』命令で標準入力が取得できません');
            }
            const line = await sys.tags.readline(msg);
            return line;
        }
    },
    '標準入力全取得': {
        type: 'func',
        josi: [],
        pure: true,
        asyncFn: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (sys) {
            sys.tags.__setupStdin();
            return new Promise((resolve) => {
                if (sys.tags.__stdinEnded) {
                    return resolve(sys.tags.__stdinRaw);
                }
                sys.tags.__endWaiters.push(() => {
                    resolve(sys.tags.__stdinRaw);
                });
            });
        }
    },
    // @テスト
    'ASSERT等': {
        type: 'func',
        josi: [['と'], ['が']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (a, b, sys) {
            assert.strictEqual(a, b);
        }
    },
    // @ネットワーク
    '自分IPアドレス取得': {
        type: 'func',
        josi: [],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            let options = sys.__getSysVar('AJAXオプション');
            if (options === '') {
                options = { method: 'GET' };
            }
            fetch(url, options).then((res) => {
                return res.text();
            }).then((text) => {
                sys.__setSysVar('対象', text);
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
        pure: true,
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
            // eslint-disable-next-line @typescript-eslint/no-for-in-array
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
                sys.__setSysVar('対象', text);
                callback(text);
            }).catch((err) => {
                sys.__getSysVar('AJAX:ONERROR')(err);
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
                sys.__setSysVar('対象', text);
                callback(text);
            }).catch((err) => {
                sys.__getSysVar('AJAX:ONERROR')(err);
            });
        }
    },
    'AJAX失敗時': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (callback, sys) {
            sys.__setSysVar('AJAX:ONERROR', callback);
        }
    },
    'AJAXオプション': { type: 'const', value: '' }, // @AJAXおぷしょん
    'AJAXオプション設定': {
        type: 'func',
        josi: [['に', 'へ', 'と']],
        pure: true,
        fn: function (option, sys) {
            sys.__setSysVar('AJAXオプション', option);
        },
        return_none: true
    },
    'AJAX保障送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に']],
        pure: true,
        fn: function (url, sys) {
            let options = sys.__getSysVar('AJAXオプション');
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (url, params, sys) {
            const flist = [];
            // eslint-disable-next-line @typescript-eslint/no-for-in-array
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            let options = sys.__getSysVar('AJAXオプション');
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
                sys.__setSysVar('対象', text);
            }).catch((err) => {
                console.error('[AJAX受信のエラー]', err);
            });
        },
        return_none: true
    },
    'POSTデータ生成': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (params, sys) {
            const flist = [];
            for (const key in params) {
                const v = params[key];
                const kv = encodeURIComponent(key) + '=' + encodeURIComponent(v);
                flist.push(kv);
            }
            return flist.join('&');
        }
    },
    'POST送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        asyncFn: true,
        fn: function (url, params, sys) {
            return new Promise((resolve, reject) => {
                const bodyData = sys.__exec('POSTデータ生成', [params, sys]);
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: bodyData
                };
                fetch(url, options).then(res => {
                    return res.text();
                }).then(text => {
                    resolve(text);
                }).catch(err => {
                    reject(new Error(err.message));
                });
            });
        }
    },
    'POSTフォーム送信': {
        type: 'func',
        josi: [['まで', 'へ', 'に'], ['を']],
        pure: true,
        asyncFn: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (url, params, sys) {
            return new Promise((resolve, reject) => {
                const fd = new FormData();
                for (const key in params) {
                    fd.set(key, params[key]);
                }
                const options = {
                    method: 'POST',
                    body: fd
                };
                fetch(url, options).then(res => {
                    return res.text();
                }).then(text => {
                    resolve(text);
                }).catch(err => {
                    reject(new Error(err.message));
                });
            });
        }
    },
    // @新AJAX
    'AJAXテキスト取得': {
        type: 'func',
        josi: [['から']],
        pure: true,
        asyncFn: true,
        fn: async function (url, sys) {
            let options = sys.__getSysVar('AJAXオプション');
            if (options === '') {
                options = { method: 'GET' };
            }
            // console.log(url, options)
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
            let options = sys.__getSysVar('AJAXオプション');
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
            let options = sys.__getSysVar('AJAXオプション');
            if (options === '') {
                options = { method: 'GET' };
            }
            const res = await fetch(url, options);
            const bin = await res.arrayBuffer();
            return bin;
        },
        return_none: false
    },
    // DISCORD
    'DISCORD送信': {
        type: 'func',
        josi: [['へ', 'に'], ['を']],
        pure: true,
        asyncFn: true,
        fn: async function (url, s, sys) {
            const payload = { content: s };
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                throw new Error('『DISCORD送信』に失敗しました。' + res.statusText);
            }
        },
        return_none: true
    },
    'DISCORDファイル送信': {
        type: 'func',
        josi: [['へ', 'に'], ['と'], ['を']],
        pure: true,
        asyncFn: true,
        fn: async function (url, f, s, sys) {
            const formData = new FormData();
            formData.append('content', s);
            const imageData = fs.readFileSync(f);
            const fname = path.basename(f);
            const uint8 = new Uint8Array(imageData);
            formData.append('file', new Blob([uint8]), fname);
            const options = {
                'method': 'POST',
                'body': formData
            };
            const res = await fetch(url, options);
            if (!res.ok) {
                throw new Error('『DISCORDファイル送信』に失敗しました。' + res.statusText);
            }
        },
        return_none: true
    },
    // @LINE
    'LINE送信': {
        type: 'func',
        josi: [['へ', 'に'], ['を']],
        pure: true,
        fn: function (token, message, sys) {
            throw new Error('『LINE送信』は2025年4月で使えなくなりました。[詳細URL] https://nadesi.com/v3/doc/go.php?4670');
        }
    },
    'LINE画像送信': {
        type: 'func',
        josi: [['へ', 'に'], ['と'], ['を']],
        pure: true,
        fn: function (token, imageFile, message, sys) {
            throw new Error('『LINE画像送信』は2025年4月で使えなくなりました。[詳細URL] https://nadesi.com/v3/doc/go.php?4670');
        }
    },
    // @文字コード
    '文字コード変換サポート判定': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (code, sys) {
            return iconv.encodingExists(code);
        }
    },
    'SJIS変換': {
        type: 'func',
        josi: [['に', 'へ', 'を']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (str, sys) {
            // iconv.skipDecodeWarning = true
            return iconv.encode(str, 'Shift_JIS');
        }
    },
    'SJIS取得': {
        type: 'func',
        josi: [['から', 'を', 'で']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (buf, sys) {
            // iconv.skipDecodeWarning = true
            return iconv.decode(Buffer.from(buf), 'sjis');
        }
    },
    'エンコーディング変換': {
        type: 'func',
        josi: [['を'], ['へ', 'で']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (s, code, sys) {
            // iconv.skipDecodeWarning = true
            return iconv.encode(s, code);
        }
    },
    'エンコーディング取得': {
        type: 'func',
        josi: [['を'], ['から', 'で']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (sys) {
            return crypto.getHashes();
        }
    },
    'ハッシュ値計算': {
        type: 'func',
        josi: [['を'], ['の'], ['で']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (s, alg, enc, sys) {
            const hashsum = crypto.createHash(alg);
            hashsum.update(s);
            return hashsum.digest(enc);
        }
    },
    'ランダムUUID生成': {
        type: 'func',
        josi: [],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (sys) {
            const uuid = crypto.randomUUID();
            return uuid;
        }
    },
    'ランダム配列生成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (cnt, sys) {
            const a = new Uint8Array(cnt);
            crypto.getRandomValues(a);
            return a;
        }
    }
};
