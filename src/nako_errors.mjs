import nakoVersion from './nako_version.mjs'

/**
 * なでしこ言語が投げる全てのエラーが継承するクラス
 */
export class NakoError extends Error {
  /**
   * @param {string} tag
   * @param {string} msg
   * @param {string | undefined} file
   * @param {number | undefined} line
   */
  constructor (tag, msg, file, line) {
    const positionJa = `${file || ''}${line === undefined ? '' : `(${line + 1}行目): `}`
    super(`[${tag}]${positionJa}${msg}\n[バージョン] ${nakoVersion.version}`)
    this.tag = '[' + tag + ']'
    this.positionJa = positionJa
    this.msg = msg
  }
}

export class NakoIndentError extends NakoError {
  /**
   * @param {string} msg
   * @param {number} line
   * @param {string} file
   */
  constructor (msg, line, file) {
    super('インデントエラー', msg, file, line)
    this.line = line
    this.file = file
  }
}

// コンパイラの内部でのみ使うエラー。投げられたらtryでキャッチしてLexerErrorへ変更する。
export class InternalLexerError extends NakoError {
  /**
   * @param {string} msg
   * @param {number} preprocessedCodeStartOffset
   * @param {number} preprocessedCodeEndOffset
   * @param {number | undefined} [line]
   * @param {string | undefined} [file]
   */
  constructor (msg, preprocessedCodeStartOffset, preprocessedCodeEndOffset, line, file) {
    super('字句解析エラー（内部エラー）', msg, file, line)
    this.preprocessedCodeStartOffset = preprocessedCodeStartOffset
    this.preprocessedCodeEndOffset = preprocessedCodeEndOffset
    this.line = line
    this.file = file
  }
}

export class NakoLexerError extends NakoError {
  /**
   * @param {string} msg
   * @param {number | null} startOffset
   * @param {number | null} endOffset,
   * @param {number | undefined} line
   * @param {string | undefined} file
   */
  constructor (
    msg,
    startOffset,
    endOffset,
    line,
    file
  ) {
    super('字句解析エラー', msg, file, line)
    this.startOffset = startOffset
    this.endOffset = endOffset
    this.line = line
    this.file = file
  }
}

export class NakoSyntaxError extends NakoError {
  /**
   * @param {string} msg
   * @param {import("./nako3").Ast | null | undefined} first
   * @param {import("./nako3").Ast | null | undefined} [last]
   */
  static fromNode (msg, first, last) {
    if (!first) {
      return new NakoSyntaxError(msg, undefined, null, null, undefined)
    }
    const startOffset = typeof first.startOffset === 'number' ? first.startOffset : null
    const endOffset =
      (last && typeof last.endOffset === 'number')
        ? last.endOffset
        : (typeof first.endOffset === 'number' ? first.endOffset : null)
    return new NakoSyntaxError(msg, first.line, startOffset, endOffset, first.file)
  }

  /**
   * @param {string} msg
   * @param {number | undefined} line
   * @param {number | null} startOffset
   * @param {number | null} endOffset
   * @param {string | undefined} file
   */
  constructor (msg, line, startOffset, endOffset, file) {
    super('文法エラー', msg, file, line)
    this.file = file
    this.line = line
    this.startOffset = startOffset
    this.endOffset = endOffset
  }
}

export class NakoRuntimeError extends NakoError {
  /**
   * @param {Error | string} error エラー
   * @param {string | undefined} lineNo 発生行
   */
  constructor (error, lineNo) {
    const className =
      (error instanceof Error &&
       error.constructor !== Error &&
       error.constructor !== NakoRuntimeError)
        ? error.constructor.name + ': '
        : ''
    const msg = error instanceof Error ? error.message : error + ''

    // 行番号を表す文字列をパースする。
    /** @type {number | undefined} */
    let line
    /** @type {string | undefined} */
    let file
    /** @type {RegExpExecArray | null} */
    let matches
    if (lineNo === undefined) {
      line = undefined
      file = undefined
    // eslint-disable-next-line no-cond-assign
    } else if (matches = /^l(-?\d+):(.*)$/.exec(lineNo)) {
      line = +matches[1]
      file = matches[2]
    // eslint-disable-next-line no-cond-assign
    } else if (matches = /^l(-?\d+)$/.exec(lineNo)) {
      line = +matches[1]
      file = undefined
    } else {
      line = undefined
      file = lineNo
    }

    super('実行時エラー', `エラー『${className}${msg}』が発生しました。`, file, line)
    this.error = error
    this.lineNo = lineNo
    this.line = line
    this.file = file
  }
}

export class NakoImportError extends NakoError {
  /**
   * @param {string} msg
   * @param {string} file
   * @param {number} line
   */
  constructor (msg, file, line) {
    super('取り込みエラー', msg, file, line)
    this.file = file
    this.line = line
  }
}
