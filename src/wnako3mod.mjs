// wnako3mod - nadesiko for web browser
// - wnako3 から wnako3mod を取り込む。
// - このファイルはモジュールとして別のファイルから取り込み可能。
import { NakoCompiler } from 'nadesiko3core/src/nako3.mjs';
import { NakoImportError } from 'nadesiko3core/src/nako_errors.mjs';
import { setupEditor } from './wnako3_editor.mjs';
import nakoVersion from './nako_version.mjs';
import PluginBrowser from './plugin_browser.mjs';
const NAKO_SCRIPT_RE = /^(なでしこ|nako|nadesiko)3?$/;
export class WebNakoCompiler extends NakoCompiler {
    constructor() {
        super({ useBasicPlugin: true });
        this.wnakoVersion = nakoVersion;
        // プラグインを追加
        this.addPluginObject('PluginBrowser', PluginBrowser);
        // 必要な定数を設定
        this.addListener('beforeRun', (g) => {
            g.__varslist[0]['ナデシコ種類'] = 'wnako3';
            g.__varslist[0]['ナデシコバージョン'] = nakoVersion.version;
        });
    }
    /**
     * ブラウザでtype="なでしこ"というスクリプトを得て実行する
     */
    async runNakoScript() {
        // スクリプトタグの中身を得る
        let nakoScriptCount = 0;
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            if (script.type.match(NAKO_SCRIPT_RE)) {
                nakoScriptCount++;
                // URLからスクリプト名を見つける
                const url = (typeof (window.location) === 'object') ? window.location.href : 'url_unknown';
                const fname = `${url}#script${nakoScriptCount}.nako3`;
                const code = script.text;
                // 依存するライブラリをロード
                await this.loadDependencies(code, fname);
                // プログラムを実行
                await this.runAsync(script.text, fname);
            }
        }
        if (nakoScriptCount > 1) {
            console.log('実行したなでしこの個数=', nakoScriptCount);
        }
    }
    /**
     * @this {WebNakoCompiler}
     * @param {string} code
     * @param {string} filename
     * @param {string} [preCode]
     * @param {Record<string, string>} [localFiles]
     * @returns {Promise<unknown>}
     */
    async loadDependencies(code, filename, preCode = '', localFiles = {}) {
        return this._loadDependencies(code, filename, preCode, {
            readJs: (filePath, token) => {
                if (Object.prototype.hasOwnProperty.call(localFiles, filePath)) {
                    return {
                        task: (async () => () => {
                            // eslint-disable-next-line no-new-func
                            Function(localFiles[filePath])();
                            return {};
                        })()
                    };
                }
                return {
                    task: (async () => {
                        const res = await fetch(filePath);
                        if (!res.ok) {
                            throw new NakoImportError(`ファイル『${filePath}』のダウンロードに失敗しました: ${res.status} ${res.statusText}`, token.file, token.line);
                        }
                        const text = await res.text();
                        if (!text.includes('navigator.nako3.addPluginObject')) {
                            throw new NakoImportError(`ファイル ${filePath} の中に文字列 "navigator.nako3.addPluginObject" が存在しません。現在、ブラウザ版のなでしこ言語v3は自動登録するプラグインのみをサポートしています。`, token.file, token.line);
                        }
                        // textの例: `navigator.nako3.addPluginObject('PluginRequireTest', { requiretest: { type: 'var', value: 100 } })`
                        return () => {
                            // プラグインの自動登録は navigator.nako3 を参照するため、 navigator.nako3 を一時的に現在のインスタンスにする。
                            const globalNavigator = navigator;
                            const globalNako3 = globalNavigator.nako3;
                            globalNavigator.nako3 = this;
                            try {
                                // eslint-disable-next-line no-new-func
                                Function(text)();
                            }
                            catch (err) {
                                throw new NakoImportError(`プラグイン ${filePath} の取り込みに失敗: ${err instanceof Error ? err.message : err + ''}`, token.file, token.line);
                            }
                            finally {
                                globalNavigator.nako3 = globalNako3;
                            }
                            return {};
                        };
                    })()
                };
            },
            readNako3: (filePath, token) => {
                if (Object.prototype.hasOwnProperty.call(localFiles, filePath)) {
                    return {
                        task: (() => {
                            return (new Promise((resolve, reject) => {
                                const s = localFiles[filePath];
                                resolve(s);
                            }));
                        })()
                    };
                }
                return {
                    task: (async () => {
                        const res = await fetch(filePath);
                        if (!res.ok) {
                            throw new NakoImportError(`ファイル ${filePath} のダウンロードに失敗しました: ${res.status} ${res.statusText}`, token.file, token.line);
                        }
                        return await res.text();
                    })()
                };
            },
            resolvePath: (name, token, fromFile) => {
                let pathname = name;
                // http から始まっていれば解決は不要
                if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
                    // fullpath
                }
                else {
                    // ローカルにファイルが存在するならそれを使う。そうでなければURLとして解釈する。
                    if (!Object.prototype.hasOwnProperty.call(localFiles, name)) {
                        try {
                            pathname = new URL(name).pathname;
                        }
                        catch (e) {
                            // 単純にパスに変換できなければ、location.hrefを参考にパスを組み立てる
                            try {
                                let baseDir = dirname(fromFile);
                                if (baseDir === '') {
                                    // https://2/3/4.html
                                    const a = window.location.href.split('/');
                                    baseDir = '/' + a.slice(3, a.length - 1).join('/');
                                }
                                pathname = resolveURL(baseDir, name);
                            }
                            catch (e) {
                                throw new NakoImportError(`取り込み文の引数でパスが解決できません。https:// か http:// で始まるアドレスを指定してください。\n${e}`, token.file, token.line);
                            }
                        }
                    }
                    else {
                        pathname = localFiles[name];
                    }
                }
                // .js および .mjs なら JSプラグイン
                if (pathname.endsWith('.js') || pathname.endsWith('.js.txt') || pathname.endsWith('.mjs') || pathname.endsWith('.mjs.txt')) {
                    return { filePath: pathname, type: 'js' };
                }
                // .nako3 なら なでしこ3プラグイン
                if (pathname.endsWith('.nako3') || pathname.endsWith('.nako3.txt')) {
                    return { filePath: pathname, type: 'nako3' };
                }
                // ファイル拡張子が未指定の場合
                throw new NakoImportError(`ファイル『${name}』は拡張子が(.nako3|.js|.js.txt|.mjs|.mjs.txt)以外なので取り込めません。`, token.file, token.line);
            }
        });
    }
    /**
     * type=なでしこ のスクリプトを自動実行するべきかどうかを返す
     * @returns {boolean} type=なでしこ のスクリプトを自動実行するべきかどうか
     */
    checkScriptTagParam() {
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            const src = script.src || '';
            if (src.indexOf('wnako3.js?run') >= 0 ||
                src.indexOf('wnako3.js&run') >= 0) {
                return true;
            }
        }
        return false;
    }
    /**
     * 指定したidのHTML要素をなでしこ言語のエディタにする。
     * @param {string | Element} idOrElement HTML要素
     * @see {setupEditor}
     */
    setupEditor(idOrElement) {
        return setupEditor(idOrElement, this, window.ace);
    }
}
function dirname(s) {
    const a = s.split('/');
    if (a && a.length > 1) {
        return a.slice(0, a.length - 1).join('/');
    }
    return '';
}
function resolveURL(base, s) {
    const baseA = base.split('/');
    const sA = s.split('/');
    for (const p of sA) {
        if (p === '') {
            continue;
        }
        if (p === '.') {
            continue;
        }
        if (p === '..') {
            baseA.pop();
            continue;
        }
        baseA.push(p);
    }
    return baseA.join('/');
}
