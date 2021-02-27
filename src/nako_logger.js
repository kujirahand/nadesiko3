/**
 * 右ほど優先度が高い。
 * @typedef {'trace' | 'debug' | 'info' | 'warn' | 'error' | 'stdout'} LogLevel
 */

const { NakoError } = require("./nako_errors")

/**
 * @typedef {{ startOffset?: number | null, endOffset?: number | null, line?: number, file?: string }} Position
 * @typedef {(data: { level: LogLevel, message: string, position: Position, levelJa: string, positionJa: string, combined: string }) => void} LogListener
 */

/**
 * コンパイラのログ情報を出力するためのクラス。
 */
class NakoLogger {
    /**
     * console.logによるloggerを作成する。
     * @returns {LogListener}
     */
    static getSimpleLogger(color = true) {
        let mode = 
            (!color) ? 'nocolor' :
            (typeof process === 'object') ? 'Node.js' :
            (typeof window !== undefined) ? 'Browser' :
            'nocolor'

        if (mode === 'Node.js') {
            return ({ level, levelJa, positionJa, message, combined }) => {
                if (level === 'stdout') {
                    console.log(combined)
                    return
                }
                const bold = '\x1b[1m'
                const bgBlack = '\x1b[40m'
                const color = {
                    error: bold + '\x1b[31m',
                    warn: bold + '\x1b[33m',
                    info: bold + '\x1b[34m',
                    debug: bold + '\x1b[37m' + bgBlack,
                    trace: bold + '\x1b[37m' + bgBlack,
                }[level]
                console.log(`${color}${levelJa}\x1b[0m${positionJa}${message}`)
            }
        } else if (mode === 'Browser') {
            // ブラウザ
            return ({ level, levelJa, positionJa, message, combined }) => {
                if (level === 'stdout') {
                    console.log(combined)
                    return
                }
                const color = {
                    error: `background: white; color: red; font-weight: bold;`,
                    warn: `background: white; color: orange; font-weight: bold;`,
                    info: `background: white; color: blue; font-weight: bold;`,
                    debug: `background: darkgray; color: white; font-weight: bold;`,
                    trace: `background: darkgray; color: white; font-weight: bold;`,
                }[level]
                const reset = `color: inherit; background: inherit; font-weight: inherit;`
                console.log(`%c${levelJa}%c${positionJa}${message}`, color, reset)
            }
        } else {
            return ({ combined }) => { console.log(combined) }
        }
    }

    /**
     * @param {HTMLElement} container
     * @returns {LogListener}
     */
    static getHTMLLogger(container) {
        /** @param {string} t */
        function escapeHTML(t) {
            return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
        }
        return ({ level, levelJa, positionJa, message, combined }) => {
            if (level === 'stdout') {
                container.innerHTML += escapeHTML(combined) + '<br>'
                return
            }
            const color = {
                stdout: '',
                error: `background: white; color: red; font-weight: bold;`,
                warn: `background: white; color: orange; font-weight: bold;`,
                info: `background: white; color: blue; font-weight: bold;`,
                debug: `background: darkgray; color: white; font-weight: bold;`,
                trace: `background: darkgray; color: white; font-weight: bold;`,
            }[level]

            // levelをチェックしないとクラス名の部分のXSSが怖い
            if (color === undefined) {
                throw new Error(`ログレベル ${level} は定義されていません。`)
            }
            container.innerHTML += `<span style="${color}" class="loglevel-${level}">${escapeHTML(levelJa)}</span>${escapeHTML(positionJa + message)}<br>`
        }
    }

    constructor() {
        /** @type {{ level: LogLevel, callback: LogListener, exactMatch: boolean }[]} */
        this.listeners = []
    }

    /**
     * 本体開発時のデバッグ情報（debugより更に詳細な情報）
     * @param {string} message @param {Position | null} [position]
     */
    trace(message, position = null) { this._log('trace', message, position || {}) }

    /**
     * 本体開発時のデバッグ情報
     * @param {string} message @param {Position | null} [position]
     */
    debug(message, position = null) { this._log('debug', message, position || {}) }

    /**
     * ユーザープログラムのデバッグ情報（あまり重要ではないもの）
     * @param {string} message @param {Position | null} [position]
     */
    info(message, position = null) { this._log('info', message, position || {}) }

    /**
     * ユーザープログラムのデバッグ情報（重要なもの）
     * @param {string} message @param {Position | null} [position]
     */
    warn(message, position = null) { this._log('warn', message, position || {}) }

    /**
     * エラーメッセージ
     * @param {string | Error} message @param {Position | null} [position]
     */
    error(message, position = null) { this._log('error', message, position || {}) }

    /**
     * 「表示」で出力した文字列
     * @param {string} message
     */
    stdout(message) { this._log('stdout', message, {}) }

    /**
     * `level` 以上のメッセージを受け取るコールバックを設定する。
     * @param {LogLevel} level
     * @param {LogListener} callback
     * @param {boolean} [exactMatch] trueを指定しないとき、より重要度の高いログも受け取る。
     */
    addListener(level, callback, exactMatch = false) { this.listeners.push({ level, callback, exactMatch }) }
    /** @param {LogListener} callback */
    removeListener(callback) { this.listeners = this.listeners.filter((l) => l.callback !== callback) }

    /** @param {LogLevel} level */
    addSimpleLogger(level, color = true) { this.addListener(level, NakoLogger.getSimpleLogger(color)) }

    /** @param {LogLevel} level @param {HTMLElement} container */
    addHTMLLogger(level, container) { this.addListener(level, NakoLogger.getHTMLLogger(container)) }

    /**
     * ログレベルの文字列表現を数値表現に変換する。
     * @param {LogLevel} level @private
     */
    _logLevel(level) { return { 'trace': 0, 'debug': 1, 'info': 2, 'warn': 3, 'error': 4, 'stdout': 5 }[level] }

    /**
     * @param {LogLevel} level @param {string | Error} message @param {Position} position @private
     */
    _log(level, message, position) {
        this.listeners
            .filter((l) => l.exactMatch ? l.level === level : this._logLevel(l.level) <= this._logLevel(level))
            .forEach((f) => {
                if (message instanceof NakoError) {
                    f.callback({ level, message: message.msg, position: /** @type {Position} */(message), levelJa: message.tag, positionJa: message.positionJa, combined: message.message })
                    return
                } else if (message instanceof Error) {
                    message = message.message
                }
                const levelJa = { 'trace': '[デバッグ情報（詳細）]', 'debug': '[デバッグ情報]', 'info': '[情報]', 'warn': '[警告]', 'error': '[エラー]', 'stdout': '' }[level]
                const positionJa = level === 'stdout' ? '' : `${position.file || ''}${position.line === undefined ? '' : `(${position.line + 1}行目): `}`
                f.callback({ level, message, position, levelJa, positionJa, combined: `${levelJa}${positionJa}${message}` })
            })
    }
}

module.exports = NakoLogger
