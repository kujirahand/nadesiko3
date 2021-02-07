
class LexError extends Error {
  /**
   * @param {string} reason
   * @param {number} preprocessedCodeStartOffset
   * @param {number} preprocessedCodeEndOffset
   */
  constructor(reason, preprocessedCodeStartOffset, preprocessedCodeEndOffset) {
    super(`LexError: ${reason}`)
    this.reason = reason
    this.preprocessedCodeStartOffset = preprocessedCodeStartOffset
    this.preprocessedCodeEndOffset = preprocessedCodeEndOffset
  }
}

class LexErrorWithSourceMap extends LexError {
  /**
   * @param {string} reason
   * @param {number} preprocessedCodeStartOffset
   * @param {number} preprocessedCodeEndOffset
   * @param {number | null} startOffset
   * @param {number | null} endOffset
   */
  constructor(
    reason,
    preprocessedCodeStartOffset,
    preprocessedCodeEndOffset,
    startOffset,
    endOffset,
  ) {
    super(reason, preprocessedCodeStartOffset, preprocessedCodeEndOffset)
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
