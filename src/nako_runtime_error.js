/**
 * NakoRuntimeError
 * 実行時エラーのためのクラス
 */

const nakoVersion = require("./nako_version")

class NakoRuntimeError extends Error {
  /**
   * @param {Error | string} error エラー
   * @param {number | undefined} line 発生行
   * @param {string | undefined} [from] 発生箇所
   */
  constructor (error, line, from) {
    const className =
      (error instanceof Error &&
       error.constructor !== Error &&
       error.constructor !== NakoRuntimeError)
      ? error.constructor.name + ": "
      : ''
    const from2 = from === undefined ? '' : `${from}で`
    const line2 = line === undefined ? '' : `(${line + 1}行目)`
    const msg = error instanceof Error ? error.message : error + ''

    super(`[実行時エラー]${line2}: ${from2}エラー『${className}${msg}』が発生しました。\n` +
          `[バージョン] ${nakoVersion.version}`)
    this.msg = msg
    this.line = line
    this.from = from
  }
}

module.exports = NakoRuntimeError
