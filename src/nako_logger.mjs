/** NakoLogger */
import { NakoError } from './nako_errors.mjs';
import { NakoColors } from './nako_colors.mjs';
/** ログレベル - 数字が高いほど優先度が高い。 */
export class LogLevel {
    // string to level no
    static fromS(levelStr) {
        let level = LogLevel.trace;
        switch (levelStr) {
            case 'trace':
                level = LogLevel.trace;
                break;
            case 'debug':
                level = LogLevel.debug;
                break;
            case 'info':
                level = LogLevel.info;
                break;
            case 'warn':
                level = LogLevel.warn;
                break;
            case 'error':
                level = LogLevel.error;
                break;
            case 'stdout':
                level = LogLevel.stdout;
                break;
        }
        return level;
    }
    static toString(level) {
        const levels = ['___', 'trace', 'debug', 'info', 'warn', 'error', 'stdout'];
        return levels[level];
    }
}
// level no
LogLevel.trace = 1;
LogLevel.debug = 3;
LogLevel.info = 3;
LogLevel.warn = 4;
LogLevel.error = 5;
LogLevel.stdout = 6;
/**
 * エラー位置を日本語で表示する。
 * たとえば `stringifyPosition({ file: "foo.txt", line: 5 })` は `"foo.txt(6行目):"` を出力する。
 */
function stringifyPosition(p) {
    if (!p) {
        return '';
    }
    return `${p.file || ''}${p.line === undefined ? '' : `(${p.line + 1}行目): `}`;
}
/**
 * コンパイラのログ情報を出力するためのクラス。
 * trace(), debug(), info(), warn(), error() はそれぞれメッセージに `[警告]` などのタグとエラー位置の日本語表現を付けて表示する。
 * error() は引数にエラーオブジェクトを受け取ることもでき、その場合エラーオブジェクトからエラーメッセージとエラー位置が取り出される。
 */
export class NakoLogger {
    constructor() {
        this.listeners = [];
    }
    /**
     * sendメソッドで送られた情報を受け取るコールバックを設定する。
     * @param levelStr
     * @param callback
     */
    addListener(levelStr, callback) {
        const level = LogLevel.fromS(levelStr);
        this.listeners.push({ level, callback });
    }
    /**
     * addListenerメソッドで設定したコールバックを取り外す。
     * @param {LogListener} callback
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter((l) => l.callback !== callback);
    }
    /** 本体開発時のデバッグ情報（debugより更に詳細な情報）
     * @param {string} message
     * @param {Position | null} position
     */
    trace(message, position = null) {
        this.sendI(LogLevel.trace, `${NakoColors.color.bold}[デバッグ情報（詳細）]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position);
    }
    /** 本体開発時のデバッグ情報
     * @param {string} message
     * @param {Position | null} position
     */
    debug(message, position = null) {
        this.sendI(LogLevel.debug, `${NakoColors.color.bold}[デバッグ情報]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position);
    }
    /** ユーザープログラムのデバッグ情報（あまり重要ではないもの）
     * @param {string} message
     * @param {Position | null} position
     */
    info(message, position = null) {
        this.sendI(LogLevel.info, `${NakoColors.color.bold}${NakoColors.color.blue}[情報]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position);
    }
    /** ユーザープログラムのデバッグ情報（重要なもの）
     * @param {string} message
     * @param {Position | null} position
     */
    warn(message, position = null) {
        this.sendI(LogLevel.warn, `${NakoColors.color.bold}${NakoColors.color.green}[警告]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position);
    }
    /** エラーメッセージ
     * @param {string | Error} message
     * @param {Position | null} position
     */
    error(message, position = null) {
        if (message instanceof NakoError) {
            // NakoErrorのサブクラスの場合は、そのプロパティからエラー位置などを取得できる。
            this.sendI(LogLevel.error, `${NakoColors.color.red}${message.tag}${NakoColors.color.reset}${message.positionJa}${message.msg}`, position);
            return;
        }
        else if (message instanceof Error) {
            // 一般のエラーの場合は、messageのみ取得できる。
            message = message.message;
        }
        this.sendI(LogLevel.error, `${NakoColors.color.bold}${NakoColors.color.red}[エラー]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position);
    }
    /** ユーザープログラムのデバッグ情報（重要なもの）
     * @param {string} message
     * @param {Position | null} position
     */
    log(message, position = null) {
        this.sendI(LogLevel.stdout, `${message}`, position);
    }
    /** 指定したlevelのlistenerにメッセージを送る。htmlやbrowserConsoleは無ければnodeConsoleから生成する。 */
    send(levelStr, nodeConsole, position, html = null, browserConsole = null) {
        const i = LogLevel.fromS(levelStr);
        this.sendI(i, nodeConsole, position, html, browserConsole);
    }
    /** 指定したlevelのlistenerにメッセージを送る。htmlやbrowserConsoleは無ければnodeConsoleから生成する。 */
    sendI(level, nodeConsole, position, html = null, browserConsole = null) {
        const makeData = () => {
            // nodeConsoleからnoColor, nodeCondoleなどの形式を生成する。
            const formats = NakoColors.convertColorTextFormat(nodeConsole);
            // ログが複数行から構成される場合は、htmlでの表現にborderを設定する。
            let style = '';
            if (nodeConsole.includes('\n')) {
                style += 'border-top: 1px solid #8080806b; border-bottom: 1px solid #8080806b;';
            }
            // 各イベントリスナーが受け取るデータ
            const data = {
                noColor: formats.noColor,
                nodeConsole: formats.nodeConsole,
                browserConsole: browserConsole || formats.browserConsole,
                html: `<div style="${style}">` + (html || formats.html) + '</div>',
                level: LogLevel.toString(level),
                position: position
            };
            return data;
        };
        // 登録したリスナーに通知する
        for (const l of this.listeners) {
            if (l.level <= level) {
                const data = makeData();
                l.callback(data);
            }
        }
    }
}
