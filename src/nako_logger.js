/**
 * 右ほど優先度が高い。
 * @typedef {'trace' | 'debug' | 'info' | 'warn' | 'error' | 'stdout'} LogLevel
 */

const { NakoError } = require('./nako_errors')
const NakoColors = require('./nako_colors')

/**
 * @typedef {{ startOffset?: number | null, endOffset?: number | null, line?: number, file?: string }} Position
 * @typedef {(
 *     data: {
 *         position: Position       // ログの送信時にposition引数で渡されたデータ
 *         level: LogLevel          // ログの重要度
 *         noColor: string          // 例: '[情報](2行目): foo'
 *         nodeConsole: string      // 例: '\x1B[1m\x1B[34m[情報]\x1B[0m(2行目): foo\x1B[0m'
 *         browserConsole: string[] // 例: ['%c%c[情報]%c(2行目): foo', 'color: inherit; font-weight: bold;', ...]
 *         html: string             // 例: '<div style="">...</div>'
 *     }) => void
 * } LogListener addListenerメソッドで設定されるコールバック
 */

/**
 * エラー位置を日本語で表示する。
 * たとえば `stringifyPosition({ file: "foo.txt", line: 5 })` は `"foo.txt(6行目):"` を出力する。
 * @param {Position | null | undefined} p
 */
const stringifyPosition = (p) => p ? `${p.file || ''}${p.line === undefined ? '' : `(${p.line + 1}行目): `}` : ''

const levels = ['trace', 'debug', 'info', 'warn', 'error', 'stdout']

/**
 * コンパイラのログ情報を出力するためのクラス。
 * trace(), debug(), info(), warn(), error() はそれぞれメッセージに `[警告]` などのタグとエラー位置の日本語表現を付けて表示する。
 * error() は引数にエラーオブジェクトを受け取ることもでき、その場合エラーオブジェクトからエラーメッセージとエラー位置が取り出される。
 */
class NakoLogger {
    constructor() {
        /** @type {{ level: LogLevel, callback: LogListener, includeHigherLevels: boolean }[]} */
        this.listeners = []
    }

    /**
     * sendメソッドで送られた情報を受け取るコールバックを設定する。
     * @param {LogLevel} level
     * @param {LogListener} callback
     * @param {boolean} [includeHigherLevels] より重要度の高いログも受け取る
     */
    addListener(level, callback, includeHigherLevels = true) { this.listeners.push({ level, callback, includeHigherLevels }) }

    /**
     * addListenerメソッドで設定したコールバックを取り外す。
     * @param {LogListener} callback
     */
    removeListener(callback) { this.listeners = this.listeners.filter((l) => l.callback !== callback) }

    /** 本体開発時のデバッグ情報（debugより更に詳細な情報）
     * @param {string} message @param {Position | null} [position] */
    trace(message, position = null) {
        this.send('trace', `${NakoColors.color.bold}[デバッグ情報（詳細）]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position)
    }

    /** 本体開発時のデバッグ情報
     * @param {string} message @param {Position | null} [position] */
    debug(message, position = null) {
        this.send('debug', `${NakoColors.color.bold}[デバッグ情報]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position)
    }

    /** ユーザープログラムのデバッグ情報（あまり重要ではないもの）
     * @param {string} message @param {Position | null} [position] */
    info(message, position = null) {
        this.send('info', `${NakoColors.color.bold}${NakoColors.color.blue}[情報]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position)
    }

    /** ユーザープログラムのデバッグ情報（重要なもの）
     * @param {string} message @param {Position | null} [position] */
    warn(message, position = null) {
        this.send('warn', `${NakoColors.color.bold}${NakoColors.color.green}[警告]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position)
    }

    /** エラーメッセージ
     * @param {string | Error} message @param {Position | null} [position] */
    error(message, position = null) {
        if (message instanceof NakoError) {
            // NakoErrorのサブクラスの場合は、そのプロパティからエラー位置などを取得できる。
            this.send('error', `${NakoColors.color.red}${message.tag}${NakoColors.color.reset}${message.positionJa}${message.msg}`, position || /** @type {Position} */(message))
            return
        } else if (message instanceof Error) {
            // 一般のエラーの場合は、messageのみ取得できる。
            message = message.message
        }
        this.send('error', `${NakoColors.color.bold}${NakoColors.color.red}[エラー]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position || /** @type {Position} */(message))
    }

    /**
     * 指定したlevelのlistenerにメッセージを送る。htmlやbrowserConsoleは無ければnodeConsoleから生成する。
     * @param {LogLevel} level
     * @param {string} nodeConsole
     * @param {Position | null | undefined} [position]
     * @param {string | undefined} [html]
     * @param {[string, string] | undefined} [browserConsole]
     */
    send(level, nodeConsole, position, html, browserConsole) {
        // nodeConsoleからnoColor, nodeCondoleなどの形式を生成する。
        const formats = NakoColors.convertColorTextFormat(nodeConsole)

        // ログが複数行から構成される場合は、htmlでの表現にborderを設定する。
        let style = ''
        if (nodeConsole.includes('\n')) {
            style += 'border-top: 1px solid #8080806b; border-bottom: 1px solid #8080806b;'
        }

        // 各イベントリスナーが受け取るデータ
        const data = {
            noColor: formats.noColor,
            nodeConsole: formats.nodeConsole,
            browserConsole: browserConsole || formats.browserConsole,
            html: `<div style="${style}">` + (html || formats.html) + '</div>', // 各行を style: block で表示するために、<div>で囲む。
            level,
            position: position || {},
        }

        // 送信
        for (const l of this.listeners) {
            if (l.includeHigherLevels) {
                if (levels.indexOf(l.level) <= levels.indexOf(level)) {
                    l.callback(data)
                }
            } else {
                if (l.level === level) {
                    l.callback(data)
                }
            }
        }
    }
}

module.exports = NakoLogger
