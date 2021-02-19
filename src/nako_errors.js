const nakoVersion = require("./nako_version")

/**
 * なでしこ言語が投げる全てのエラーが継承するクラス
 */
class NakoError extends Error {
  /**
   * @param {string} tag
   * @param {string} msg
   * @param {string | undefined} filename
   * @param {number | undefined} line
   */
  constructor(tag, msg, filename, line) {
    super(`[${tag}]${filename || ''}${line === undefined ? '' : `(${line + 1}行目): `}${msg}\n[バージョン] ${nakoVersion.version}`)
  }
}

class NakoIndentError extends NakoError {
  /**
   * @param {string} msg
   * @param {number} line
   * @param {string} filename
   */
  constructor(msg, line, filename) {
    super('インデントエラー', msg, filename, line)
    this.msg = msg
    this.line = line
    this.filename = filename
  }
}

class LexError extends NakoError {
  /**
   * @param {string} msg
   * @param {number} preprocessedCodeStartOffset
   * @param {number} preprocessedCodeEndOffset
   * @param {number | undefined} [line]
   * @param {string | undefined} [filename]
   */
  constructor(msg, preprocessedCodeStartOffset, preprocessedCodeEndOffset, line, filename) {
    super('字句解析エラー', msg, filename, line)
    this.msg = msg
    this.preprocessedCodeStartOffset = preprocessedCodeStartOffset
    this.preprocessedCodeEndOffset = preprocessedCodeEndOffset
    this.line = line
    this.filename = filename
  }
}

class LexErrorWithSourceMap extends LexError {
  /**
   * @param {string} msg
   * @param {number} preprocessedCodeStartOffset
   * @param {number} preprocessedCodeEndOffset
   * @param {number | null} startOffset
   * @param {number | null} endOffset,
   * @param {number | undefined} line
   * @param {string | undefined} filename
   */
  constructor(
    msg,
    preprocessedCodeStartOffset,
    preprocessedCodeEndOffset,
    startOffset,
    endOffset,
    line,
    filename,
  ) {
    super(msg, preprocessedCodeStartOffset, preprocessedCodeEndOffset, line, filename)
    this.startOffset = startOffset
    this.endOffset = endOffset
  }
}

class NakoSyntaxError extends NakoError {
  /**
   * @param {string} msg
   * @param {number} line
   * @param {string} filename
   */
  constructor (msg, line, filename) {
    super('文法エラー', msg, filename, line)
    this.filename = filename
    this.line = line
    this.msg = msg
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
      super(error.msg, error.line, error.filename)
      this.token = token
      this.startOffset = startOffset
      this.endOffset = endOffset
      this.error = error
  }
}

class NakoRuntimeError extends NakoError {
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
    const msg = error instanceof Error ? error.message : error + ''

    super('実行時エラー', `${from === undefined ? '' : `${from}で`}エラー『${className}${msg}』が発生しました。\n` +
    `[バージョン] ${nakoVersion.version}`, undefined, line)
    this.error = error
    this.msg = msg
    this.line = line
    this.from = from
  }
}

class NakoImportError extends NakoError {
  /**
   * @param {string} msg
   * @param {number} line
   * @param {string} filename
   */
  constructor (msg, line, filename) {
    super('取り込みエラー', msg, filename, line)
    this.filename = filename
    this.line = line
    this.msg = msg
  }
}

module.exports = {
  NakoError,
  NakoIndentError,
  LexError,
  LexErrorWithSourceMap,
  NakoSyntaxError,
  NakoSyntaxErrorWithSourceMap,
  NakoRuntimeError,
  NakoImportError,
}
