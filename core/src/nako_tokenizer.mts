// deno-lint-ignore-file no-explicit-any
/**
 * なでしこ3の字句解析パイプライン
 *
 * NakoCompiler から字句解析とソースマップ処理を分離したモジュール (#2360)
 * 循環参照を避けるため、このモジュールは nako3.mts を参照せず、
 * 必要な機能は NakoTokenizerHost インターフェイス経由で受け取る。
 */
import { Token } from './nako_types.mjs'
import { NakoLexer } from './nako_lexer.mjs'
import { NakoPrepare } from './nako_prepare.mjs'
import { convertInlineIndent, convertIndentSyntax } from './nako_indent_inline.mjs'
import { convertDNCL } from './nako_from_dncl.mjs'
import { convertDNCL2 } from './nako_from_dncl2.mjs'
import { SourceMappingOfTokenization, SourceMappingOfIndentSyntax, OffsetToLineColumn, subtractSourceMapByPreCodeLength } from './nako_source_mapping.mjs'
import { NakoLexerError, InternalLexerError } from './nako_errors.mjs'
import { NakoLogger } from './nako_logger.mjs'

/** 字句解析の結果 */
export interface LexResult {
  commentTokens: Token[];
  tokens: Token[];
  requireTokens: Token[];
}

/**
 * NakoTokenizer がホスト(NakoCompiler)に要求する最小限の機能
 */
export interface NakoTokenizerHost {
  getLogger (): NakoLogger;
  /** 取り込み文を依存ファイルのトークン列で置換する */
  replaceRequireStatements (tokens: Token[], includeGuard?: Set<string>): Token[];
  /** 取り込み文を削除する(シンタックスハイライト用) */
  removeRequireStatements (tokens: Token[]): Token[];
}

/**
 * なでしこのソースコードをトークン列へ分割するクラス
 */
export class NakoTokenizer {
  readonly prepare: NakoPrepare
  readonly lexer: NakoLexer
  private host: NakoTokenizerHost

  constructor (host: NakoTokenizerHost) {
    this.host = host
    this.prepare = NakoPrepare.getInstance()
    this.lexer = new NakoLexer(host.getLogger())
  }

  /** モジュール(名前空間)の一覧を取得する */
  getModList (): string[] {
    return this.lexer.modList
  }

  /**
   * コードを単語に分割する
   * @param code なでしこのプログラム
   * @param line なでしこのプログラムの行番号
   * @param filename
   * @param preCode
   * @returns トークンのリスト
   */
  rawtokenize (code: string, line: number, filename: string, preCode = ''): Token[] {
    if (!code.startsWith(preCode)) {
      throw new Error('codeの先頭にはpreCodeを含める必要があります。')
    }
    // 名前空間のモジュールリストに自身を追加
    const modName = NakoLexer.filenameToModName(filename)
    const modList = this.getModList()
    if (modList.indexOf(modName) < 0) { modList.unshift(modName) }
    // 全角半角の統一処理
    const preprocessed = this.prepare.convert(code)
    const tokenizationSourceMapping = new SourceMappingOfTokenization(code.length, preprocessed)
    const indentationSyntaxSourceMapping = new SourceMappingOfIndentSyntax(code, [], [])
    const offsetToLineColumn = new OffsetToLineColumn(code)
    // トークン分割
    let tokens: Token[]
    try {
      tokens = this.lexer.tokenize(preprocessed.map((v) => v.text).join(''), line, filename)
    } catch (err) {
      if (!(err instanceof InternalLexerError)) {
        throw err
      }
      // エラー位置をソースコード上の位置に変換して返す
      const dest = indentationSyntaxSourceMapping.map(tokenizationSourceMapping.map(err.preprocessedCodeStartOffset), tokenizationSourceMapping.map(err.preprocessedCodeEndOffset))
      const line: number|undefined = dest.startOffset === null ? err.line : offsetToLineColumn.map(dest.startOffset, false).line
      const map = subtractSourceMapByPreCodeLength({ ...dest, line }, preCode)
      throw new NakoLexerError(err.msg, map.startOffset, map.endOffset, map.line, filename)
    }
    // DNCL ver2 (core #41)
    tokens = convertDNCL2(tokens)
    // DNCL ver1 (#1140)
    tokens = convertDNCL(tokens)
    // インデント構文を変換 #596
    tokens = convertIndentSyntax(tokens)
    // インラインインデントを変換 #1215
    tokens = convertInlineIndent(tokens)

    // ソースコード上の位置に変換
    tokens = tokens.map((token) => {
      const dest = indentationSyntaxSourceMapping.map(
        tokenizationSourceMapping.map(token.preprocessedCodeOffset || 0),
        tokenizationSourceMapping.map((token.preprocessedCodeOffset || 0) + (token.preprocessedCodeLength || 0))
      )
      let line = token.line
      let column = 0
      if (token.type === 'eol' && dest.endOffset !== null) {
        // eolはnako_genで `line = ${eolToken.line};` に変換されるため、
        // 行末のeolのlineは次の行の行数を表す必要がある。
        const out = offsetToLineColumn.map(dest.endOffset, false)
        line = out.line
        column = out.column
      } else if (dest.startOffset !== null) {
        const out = offsetToLineColumn.map(dest.startOffset, false)
        line = out.line
        column = out.column
      }
      return {
        ...token,
        ...subtractSourceMapByPreCodeLength({ line, column, startOffset: dest.startOffset, endOffset: dest.endOffset }, preCode),
        rawJosi: token.josi
      }
    })
    return tokens
  }

  /**
   * 単語の属性を構文解析に先立ち補正する
   * @param {Token[]} tokens トークンのリスト
   * @param {boolean} isFirst 最初の呼び出しかどうか
   * @param {string} filename
   * @returns コード (なでしこ)
   */
  converttoken (tokens: Token[], isFirst: boolean, filename: string): Token[] {
    const tok = this.lexer.replaceTokens(tokens, isFirst, filename)
    return tok
  }

  /**
   * typeがcodeのトークンを単語に分割するための処理
   * @param {string} code
   * @param {number} line
   * @param {string} filename
   * @param {number | null} startOffset
   * @returns
   */
  lexCodeToken (code: string, line: number, filename: string, startOffset: number|null): {commentTokens: Token[], tokens: Token[]} {
    // 単語に分割
    let tokens = this.rawtokenize(code, line, filename, '')

    // 文字列内位置からファイル内位置へ変換
    if (startOffset === null) {
      for (const token of tokens) {
        token.startOffset = undefined
        token.endOffset = undefined
      }
    } else {
      for (const token of tokens) {
        if (token.startOffset !== undefined) {
          token.startOffset += startOffset
        }
        if (token.endOffset !== undefined) {
          token.endOffset += startOffset
        }
      }
    }

    // convertTokenで消されるコメントのトークンを残す
    const commentTokens = tokens.filter((t) => t.type === 'line_comment' || t.type === 'range_comment')
      .map((v) => ({ ...v })) // clone

    tokens = this.converttoken(tokens, false, filename)

    return { tokens, commentTokens }
  }

  /** 字句解析を行う */
  lex (code: string, filename = 'main.nako3', preCode = '', syntaxHighlighting = false): LexResult {
    // 単語に分割
    let tokens = this.rawtokenize(code, 0, filename, preCode)

    // require文を再帰的に置換する
    const requireStatementTokens = syntaxHighlighting ? this.host.removeRequireStatements(tokens) : this.host.replaceRequireStatements(tokens, undefined)
    for (const t of requireStatementTokens) {
      if (t.type === 'word' || t.type === 'not') {
        t.type = 'require'
      }
    }
    if (requireStatementTokens.length >= 3) {
      // modList を更新
      for (let i = 0; i < requireStatementTokens.length; i += 3) {
        let modName = requireStatementTokens[i + 1].value
        modName = NakoLexer.filenameToModName(modName)
        if (this.lexer.modList.indexOf(modName) < 0) {
          this.lexer.modList.push(modName)
        }
      }
    }

    // convertTokenで消されるコメントのトークンを残す
    const commentTokens: Token[] = tokens.filter((t) => t.type === 'line_comment' || t.type === 'range_comment')
      .map((v) => ({ ...v })) // clone

    tokens = this.converttoken(tokens, true, filename)

    // 'string_ex'トークンから変換された'code'トークンを字句解析する
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] && tokens[i].type === 'code') {
        const children = this.lexCodeToken(tokens[i].value, tokens[i].line, filename, tokens[i].startOffset || 0)
        commentTokens.push(...children.commentTokens)
        tokens.splice(i, 1, ...children.tokens)
        i--
      }
    }

    this.host.getLogger().trace('--- lex ---\n' + JSON.stringify(tokens, null, 2))

    return { commentTokens, tokens, requireTokens: requireStatementTokens }
  }
}
