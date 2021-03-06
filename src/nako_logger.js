/**
 * 右ほど優先度が高い。
 * @typedef {'trace' | 'debug' | 'info' | 'warn' | 'error' | 'stdout'} LogLevel
 */

const { NakoError } = require('./nako_errors')
const NakoColors = require('./nako_colors')

/**
 * @typedef {{ startOffset?: number | null, endOffset?: number | null, line?: number, file?: string }} Position
 * @typedef {(data: { position: Position, level: LogLevel, noColor: string, browserConsole: string[], html: string, nodeConsole: string }) => void} LogListener
 */

/** @param {Position | null | undefined} p */
const stringifyPosition = (p) => p ? `${p.file || ''}${p.line === undefined ? '' : `(${p.line + 1}行目): `}` : ''

const levels = ['trace', 'debug', 'info', 'warn', 'error', 'stdout']

/**
 * コンパイラのログ情報を出力するためのクラス。
 */
class NakoLogger {
    constructor() {
        /** @type {{ level: LogLevel, callback: LogListener, includeHigherLevels: boolean }[]} */
        this.listeners = []
    }

    /**
     * @param {LogLevel} level
     * @param {LogListener} callback
     * @param {boolean} [includeHigherLevels] より重要度の高いログも受け取る
     */
    addListener(level, callback, includeHigherLevels = true) { this.listeners.push({ level, callback, includeHigherLevels }) }

    /** @param {LogListener} callback */
    removeListener(callback) { this.listeners = this.listeners.filter((l) => l.callback !== callback) }

    /** 本体開発時のデバッグ情報（debugより更に詳細な情報）
     * @param {string} message @param {Position | null} [position] */
    trace(message, position = null) { this.send('trace', `${NakoColors.color.red}[デバッグ情報（詳細）]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position) }

    /** 本体開発時のデバッグ情報
     * @param {string} message @param {Position | null} [position] */
    debug(message, position = null) { this.send('debug', `${NakoColors.color.red}[デバッグ情報]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position) }

    /** ユーザープログラムのデバッグ情報（あまり重要ではないもの）
     * @param {string} message @param {Position | null} [position] */
    info(message, position = null) { this.send('info', `${NakoColors.color.red}[情報]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position) }

    /** ユーザープログラムのデバッグ情報（重要なもの）
     * @param {string} message @param {Position | null} [position] */
    warn(message, position = null) { this.send('warn', `${NakoColors.color.red}[警告]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position) }

    /** エラーメッセージ
     * @param {string | Error} message @param {Position | null} [position] */
    error(message, position = null) {
        if (message instanceof NakoError) {
            this.send('error', `${NakoColors.color.red}${message.tag}${NakoColors.color.reset}${message.positionJa}${message.msg}`, position || /** @type {Position} */(message))
            return
        } else if (message instanceof Error) {
            message = message.message
        }
        this.send('error', `${NakoColors.color.red}[エラー]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position || /** @type {Position} */(message))
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
        const converted = NakoColors.convertColorTextFormat(nodeConsole)
        let style = ''
        if (nodeConsole.includes('\n')) {
            style += 'border-top: 1px solid #8080806b; border-bottom: 1px solid #8080806b;'
        }
        // 送信
        this.listeners
            .filter((l) => l.includeHigherLevels ? (levels.indexOf(l.level) <= levels.indexOf(level)) : l.level === level)
            .forEach((l) => { l.callback({
                noColor: converted.noColor,
                nodeConsole: converted.nodeConsole,
                browserConsole: browserConsole || converted.browserConsole,
                html: `<div style="${style}">` + (html || converted.html) + '</div>',
                level,
                position: position || {},
            }) })
    }
}

module.exports = NakoLogger
