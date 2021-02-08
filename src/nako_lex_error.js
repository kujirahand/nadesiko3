class LexError extends Error {
  /**
   * @param {string} reason
   * @param {number} preprocessedCodeStartOffset
   * @param {number} preprocessedCodeEndOffset
   * @param {number | undefined} [line]
   * @param {string | undefined} [fname]
   */
  constructor(reason, preprocessedCodeStartOffset, preprocessedCodeEndOffset, line, fname) {
    const fname2 = fname === undefined ? '' : fname
    const line2 = line === undefined ? '' : `(${line + 1}行目)`
    const nakoVersion = require('./nako_version')
    const message = `[字句解析エラー]${fname2}${line2}: ${reason}\n` +
      `[バージョン] ${nakoVersion.version}`
    super(message)
    this.reason = reason
    this.preprocessedCodeStartOffset = preprocessedCodeStartOffset
    this.preprocessedCodeEndOffset = preprocessedCodeEndOffset
    this.line = line
    this.fname = fname
  }
}

class LexErrorWithSourceMap extends LexError {
  /**
   * @param {string} reason
   * @param {number} preprocessedCodeStartOffset
   * @param {number} preprocessedCodeEndOffset
   * @param {number | null} startOffset
   * @param {number | null} endOffset,
   * @param {number | undefined} line
   * @param {string | undefined} filename
   */
  constructor(
    reason,
    preprocessedCodeStartOffset,
    preprocessedCodeEndOffset,
    startOffset,
    endOffset,
    line,
    filename,
  ) {
    super(reason, preprocessedCodeStartOffset, preprocessedCodeEndOffset, line, filename)
    /** @readonly */
    this.startOffset = startOffset
    /** @readonly */
    this.endOffset = endOffset
  }
}

module.exports = {
  LexError,
  LexErrorWithSourceMap,
}
