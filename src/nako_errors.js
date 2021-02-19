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
   * @param {import("./nako3").Ast | null | undefined} first
   * @param {import("./nako3").Ast | null | undefined} [last]
   */
  static fromNode(msg, first, last) {
    if (!first) {
      return new NakoSyntaxError(msg, undefined, null, null, undefined)
    }
    const startOffset = typeof first.startOffset === 'number' ? first.startOffset : null
    const endOffset =
      (last && typeof last.endOffset === 'number') ?
        last.endOffset :
        (typeof first.endOffset === 'number' ? first.endOffset : null)
    return new NakoSyntaxError(msg, first.line, startOffset, endOffset, first.file)
  }

  /**
   * @param {string} msg
   * @param {number | undefined} line
   * @param {number | null} startOffset
   * @param {number | null} endOffset
   * @param {string | undefined} filename
   */
  constructor (msg, line, startOffset, endOffset, filename) {
    super('文法エラー', msg, filename, line)
    this.filename = filename
    this.line = line
    this.msg = msg
    this.startOffset = startOffset
    this.endOffset = endOffset
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

    super('実行時エラー', `${from === undefined ? '' : `${from}で`}エラー『${className}${msg}』が発生しました。`, undefined, line)
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
  NakoRuntimeError,
  NakoImportError,
}
