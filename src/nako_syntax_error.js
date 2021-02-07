/**
 * なでしこの文法エラーを表示するクラス
 */

class NakoSyntaxError extends Error {
  constructor (msg, line, fname) {
    const line2 = line + 1
    const fname2 = (fname === undefined) ? '' : fname
    // Get Nadesiko Version
    const nakoVersion = require('./nako_version')
    // Error Message Format
    const title = `[文法エラー]${fname2}(${line2}行目): ${msg}\n` +
                  `[バージョン] ${nakoVersion.version}`
    super(title)
    this.msg = msg
    this.line = line
    this.fname = fname
  }
}

class NakoSyntaxErrorWithSourceMap extends NakoSyntaxError {
  /**
   *@param {import('./nako3').TokenWithSourceMap} token
   *@param {number} startOffset
   *@param {number} endOffset
   *@param {NakoSyntaxError} error
   */
  constructor(token, startOffset, endOffset, error) {
      super(error.msg, error.line, error.fname)
      /** @readonly */
      this.token = token
      /** @readonly */
      this.startOffset = startOffset
      /** @readonly */
      this.endOffset = endOffset
      /** @readonly */
      this.error = error
  }
}

module.exports = {
  NakoSyntaxError,
  NakoSyntaxErrorWithSourceMap,
}
