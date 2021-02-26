/**
 * @typedef {'trace' | 'debug' | 'info' | 'warn' | 'error'} LogLevel
 */

/**
 * @typedef {{ startOffset?: number | null, endOffset?: number | null, line?: number, file?: string }} Position
 * @typedef {(data: { level: LogLevel, message: string, position: Position, levelJa: string, positionJa: string }) => void} LogListener
 */

/**
 * コンパイラのログ情報を出力するためのクラス。
 */
class NakoLogger {
    /**
     * console.logによるloggerを作成する。
     * @returns {LogListener}
     */
    static getSimpleLogger (color = true) {
        let mode = 
            (!color) ? 'nocolor' :
            (typeof process === 'object') ? 'Node.js' :
            (typeof window !== undefined) ? 'Browser' :
            'nocolor'

        if (mode === 'Node.js') {
            return ({ level, levelJa, positionJa, message }) => {
                const bold = '\x1b[1m'
                const bgBlack = '\x1b[40m'
                const color = {
                    error: bold + '\x1b[31m',
                    warn: bold + '\x1b[33m',
                    info: bold + '\x1b[34m',
                    debug: bold + '\x1b[37m' + bgBlack,
                    trace: bold + '\x1b[37m' + bgBlack,
                }[level]
                console.log(`${color}[${levelJa}]\x1b[0m${positionJa}${message}`)
            }
        } else if (mode === 'Browser') {
            // ブラウザ
            return ({ level, levelJa, positionJa, message }) => {
                const color = {
                    error: `background: white; color: red; font-weight: bold;`,
                    warn: `background: white; color: orange; font-weight: bold;`,
                    info: `background: white; color: blue; font-weight: bold;`,
                    debug: `background: darkgray; color: white; font-weight: bold;`,
                    trace: `background: darkgray; color: white; font-weight: bold;`,
                }[level]
                const reset = `color: inherit; background: inherit; font-weight: inherit;`
                console.log(`%c[${levelJa}]%c${positionJa}${message}`, color, reset)
            }
        } else {
            return ({ levelJa, positionJa, message }) => { console.log(`[${levelJa}]${positionJa}${message}`) }
        }
    }

    constructor() {
        /** @type {{ level: LogLevel, callback: LogListener }[]} */
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
     * @param {string} message @param {Position | null} [position]
     */
    error(message, position = null) { this._log('error', message, position || {}) }

    /**
     * `level` 以上のメッセージを受け取るコールバックを設定する。
     * @param {LogLevel} level @param {LogListener} callback
     */
    addListener(level, callback) { this.listeners.push({ level, callback }) }
    /** @param {LogListener} callback */
    removeListener(callback) { this.listeners = this.listeners.filter((l) => l.callback !== callback) }

    /** @param {LogLevel} level */
    addSimpleLogger(level, color = true) { this.addListener(level, NakoLogger.getSimpleLogger(color)) }

    /**
     * ログレベルの文字列表現を数値表現に変換する。
     * @param {LogLevel} level @private
     */
    _logLevel(level) { return { 'trace': 0, 'debug': 1, 'info': 2, 'warn': 3, 'error': 4 }[level] }

    /**
     * @param {LogLevel} level @param {string} message @param {Position} position @private
     */
    _log(level, message, position) {
        this.listeners
            .filter((l) => this._logLevel(l.level) <= this._logLevel(level))
            .forEach((f) => {
                f.callback({
                    level,
                    message,
                    position,
                    levelJa: { 'trace': 'デバッグ情報（詳細）', 'debug': 'デバッグ情報', 'info': '情報', 'warn': '警告', 'error': 'エラー' }[level],
                    positionJa: `${position.file || ''}${position.line === undefined ? '' : `(${position.line + 1}行目): `}`,
                })
            })
    }
}

module.exports = NakoLogger
