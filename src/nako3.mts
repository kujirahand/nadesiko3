/**
 * nadesiko v3
 */
import { NakoParser } from './nako_parser3.mjs'
import { NakoLexer } from './nako_lexer.mjs'
import { NakoPrepare } from './nako_prepare.mjs'
import { generateJS, NakoGenResult } from './nako_gen.mjs'
import { NakoGenASync } from './nako_gen_async.mjs'
import NakoIndent from './nako_indent.mjs'
import { convertDNCL } from './nako_from_dncl.mjs'
import PluginSystem from './plugin_system.mjs'
import PluginMath from './plugin_math.mjs'
import PluginPromise from './plugin_promise.mjs'
import PluginTest from './plugin_test.mjs'
import { SourceMappingOfTokenization, SourceMappingOfIndentSyntax, OffsetToLineColumn, subtractSourceMapByPreCodeLength } from './nako_source_mapping.mjs'
import { NakoRuntimeError, NakoLexerError, NakoImportError, NakoSyntaxError, InternalLexerError, NakoError } from './nako_errors.mjs'
import { NakoLogger } from './nako_logger.mjs'
import { NakoGlobal } from './nako_global.mjs'

// type
import { Token, Ast, FuncList, FuncListItem, FuncArgs } from './nako_types.mjs'

const cloneAsJSON = (x: any): any => JSON.parse(JSON.stringify(x))

export interface CompilerOptions {
  resetEnv: boolean;
  testOnly: boolean | string;
  resetAll: boolean;
}

/**
 * インタプリタに「取り込み」文を追加するために用意するオブジェクト
 * @typedef {{
 *    resolvePath: (name: string, token: TokenWithSourceMap, fromFile: string) => { type: 'nako3' | 'js' | 'invalid', filePath: string }
 *    readNako3: (filePath: string, token: TokenWithSourceMap) => { task: Promise<string> }
 *    readJs: (filePath: string, token: TokenWithSourceMap) => { task: Promise<() => object> }
 * }} LoaderTool
 */

export interface LoaderToolTask<T> {
  task: Promise<T>;
}
export interface LoaderTool {
  // type: 'nako3' | 'js' | 'invalid' | 'mjs'
  resolvePath: (name: string, token: Token, fromFile: string) => { type: string, filePath: string };
  readNako3: (filePath: string, token: Token) => LoaderToolTask<string>;
  readJs: (filePath: string, token: Token) => LoaderToolTask<object>;
}

interface DependenciesItem {
  tokens: Token[];
  alias: Set<string>;
  addPluginFile: () => void;
  funclist: object;
}
type Dependencies = { [key:string]:DependenciesItem }

interface LexResult {
  commentTokens: Token[];
  tokens: Token[];
  requireTokens: Token[];
}

export interface NakoCompilerOption {
  useBasicPlugin: boolean;
}

type NakoVars = {[key: string]: any}

export class NakoCompiler {
  filename: string;
  options: NakoCompilerOption;
  silent: boolean;
  __varslist: NakoVars[];
  __locals: NakoVars;
  __self: NakoCompiler;
  __vars: NakoVars;
  __v0: NakoVars;
  __v1: NakoVars;
  __globals: NakoGlobal[];
  __module: Record<string, Record<string, FuncListItem>>;
  // eslint-disable-next-line camelcase
  nako_func: FuncList;
  funclist: FuncList;
  logger: NakoLogger;
  pluginFunclist: Record<string, FuncListItem>;
  pluginfiles: Record<string, any>;
  isSetter: boolean;
  commandlist: Set<string>;
  prepare: NakoPrepare;
  parser: NakoParser;
  lexer: NakoLexer;
  dependencies: Dependencies;
  usedFuncs: Set<string>;
  numFailures: number;
  setFunc: any;

  /**
   * @param {undefined | {'useBasicPlugin':true|false}} options
   */
  constructor (options: NakoCompilerOption | undefined = undefined) {
    if (options === undefined) {
      options = { useBasicPlugin: true }
    }
    this.silent = true
    this.filename = 'inline'
    this.options = options
    // 環境のリセット
    /** @type {Record<string, any>[]} */
    this.__varslist = [{}, {}, {}] // このオブジェクトは変更しないこと (this.gen.__varslist と共有する)
    this.__locals = {} // ローカル変数
    this.__self = this
    this.__vars = this.__varslist[2]
    this.__v0 = this.__varslist[0]
    this.__v1 = this.__varslist[1]
    /**
     * @type {NakoGlobal[]}
     */
    this.__globals = [] // 生成した NakoGlobal のインスタンスを保持
    /** @type {Record<string, Record<string, NakoFunction>>} */
    this.__module = {} // requireなどで取り込んだモジュールの一覧
    this.pluginFunclist = {} // プラグインで定義された関数
    this.funclist = {} // プラグインで定義された関数 + ユーザーが定義した関数
    this.pluginfiles = {} // 取り込んだファイル一覧
    this.isSetter = false // 代入的関数呼び出しを管理(#290)
    this.commandlist = new Set() // プラグインで定義された定数・変数・関数の名前
    this.nako_func = {} // __v1に配置するJavaScriptのコードで定義された関数

    this.logger = new NakoLogger()

    // 必要なオブジェクトを覚えておく
    this.prepare = NakoPrepare.getInstance()
    this.parser = new NakoParser(this.logger)
    this.lexer = new NakoLexer(this.logger)

    /**
     * 取り込み文を置換するためのオブジェクト。
     * 正規化されたファイル名がキーになり、取り込み文の引数に指定された正規化されていないファイル名はaliasに入れられる。
     * JavaScriptファイルによるプラグインの場合、contentは空文字列。
     * funclistはシンタックスハイライトの高速化のために事前に取り出した、ファイルが定義する関数名のリスト。
     */
    this.dependencies = {}

    /** @type {Set<string>} */
    this.usedFuncs = new Set()

    this.setFunc = this.addFunc // エイリアス

    this.numFailures = 0

    if (options.useBasicPlugin) { this.addBasicPlugins() }
  }

  /**
   * 基本的なプラグインを追加する
   */
  addBasicPlugins () {
    this.addPluginObject('PluginSystem', PluginSystem)
    this.addPluginObject('PluginMath', PluginMath)
    this.addPluginObject('PluginPromise', PluginPromise)
    this.addPluginObject('PluginAssert', PluginTest)
  }

  /**
   * loggerを新しいインスタンスで置き換える。
   */
  replaceLogger () {
    const logger = this.lexer.logger = this.parser.logger = this.logger = new NakoLogger()
    return logger
  }

  /**
   * ファイル内のrequire文の位置を列挙する。出力の配列はstartでソートされている。
   * @param {Token[]} tokens rawtokenizeの出力
   */
  static listRequireStatements (tokens: Token[]): Token[] {
    const requireStatements: Token[] = []
    for (let i = 0; i + 2 < tokens.length; i++) {
      // not (string|string_ex) '取り込み'
      if (!(tokens[i].type === 'not' &&
        (tokens[i + 1].type === 'string' || tokens[i + 1].type === 'string_ex') &&
        tokens[i + 2].value === '取込')) {
        continue
      }
      requireStatements.push({
        ...tokens[i],
        start: i,
        end: i + 3,
        value: tokens[i + 1].value + '',
        firstToken: tokens[i],
        lastToken: tokens[i + 2]
      })
      i += 2
    }
    return requireStatements
  }

  /**
   * プログラムが依存するファイルを再帰的に取得する。
   * - 依存するファイルがJavaScriptファイルの場合、そのファイルを実行して評価結果をthis.addPluginFileに渡す。
   * - 依存するファイルがなでしこ言語の場合、ファイルの中身を取得して変数に保存し、再帰する。
   *
   * @param {string} code
   * @param {string} filename
   * @param {string} preCode
   * @param {LoaderTool} tools 実行環境 (ブラウザ or Node.js) によって外部ファイルの取得・実行方法は異なるため、引数でそれらを行う関数を受け取る。
   *  - resolvePath は指定した名前をもつファイルを検索し、正規化されたファイル名を返す関数。返されたファイル名はreadNako3かreadJsの引数になる。
   *  - readNako3は指定されたファイルの中身を返す関数。
   *  - readJsは指定したファイルをJavaScriptのプログラムとして実行し、`export default` でエクスポートされた値を返す関数。
   * @returns {Promise<unknown> | void}
   * @protected
   */
  _loadDependencies (code: string, filename: string, preCode: string, tools: LoaderTool) {
    const dependencies: Dependencies = {}
    const compiler = new NakoCompiler({ useBasicPlugin: true })

    /**
     * @param {any} item
     * @param {any} tasks
     */
    const loadJS = (item: any, tasks: any) => {
      // jsならプラグインとして読み込む。(ESMでは必ず動的に読む)
      const obj = tools.readJs(item.filePath, item.firstToken)
      tasks.push(obj.task.then((res: any) => {
        const pluginFuncs = res()
        this.addPluginFile(item.value, item.filePath, pluginFuncs, false)
        dependencies[item.filePath].funclist = pluginFuncs
        dependencies[item.filePath].addPluginFile = () => { this.addPluginFile(item.value, item.filePath, pluginFuncs, false) }
      }))
    }
    const loadNako3 = (item: any, tasks: any) => {
      // nako3ならファイルを読んでdependenciesに保存する。
      const content = tools.readNako3(item.filePath, item.firstToken)
      const registerFile = (code: string) => {
        // シンタックスハイライトの高速化のために、事前にファイルが定義する関数名のリストを取り出しておく。
        // preDefineFuncはトークン列に変更を加えるため、事前にクローンしておく。
        // 「プラグイン名設定」を行う (#956)
        const modName = NakoLexer.filenameToModName(item.filePath)
        code = `『${modName}』にプラグイン名設定;` + code + ';『メイン』にプラグイン名設定;'
        const tokens = this.rawtokenize(code, 0, item.filePath)
        dependencies[item.filePath].tokens = tokens
        const funclist = {}
        NakoLexer.preDefineFunc(cloneAsJSON(tokens), this.logger, funclist)
        dependencies[item.filePath].funclist = funclist
        // 再帰
        return loadRec(code, item.filePath, '')
      }
      // 取り込み構文における問題を減らすため、必ず非同期でプログラムを読み込む仕様とした #1219
      tasks.push(content.task.then((res) => registerFile(res)))
    }
    const loadRec = (code: string, filename: string, preCode: string): Promise<unknown>|void => {
      const tasks: Promise<unknown>[] = []
      // 取り込みが必要な情報一覧を調べる(トークン分割して、取り込みタグを得る)
      const tags = NakoCompiler.listRequireStatements(compiler.rawtokenize(code, 0, filename, preCode))
      // パスを解決する
      const tagsResolvePath = tags.map((v) => ({ ...v, ...tools.resolvePath(v.value, v.firstToken as Token, filename) }))
      // 取り込み開始
      for (const item of tagsResolvePath) {
        // 2回目以降の読み込み
        // eslint-disable-next-line no-prototype-builtins
        if (dependencies.hasOwnProperty(item.filePath)) {
          dependencies[item.filePath].alias.add(item.value)
          continue
        }

        // 初回の読み込み
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        dependencies[item.filePath] = { tokens: [], alias: new Set([item.value]), addPluginFile: ():void => {}, funclist: {} }
        if (item.type === 'js' || item.type === 'mjs') {
          loadJS(item, tasks)
        } else if (item.type === 'nako3') {
          loadNako3(item, tasks)
        } else {
          throw new NakoImportError(`ファイル『${item.value}』を読み込めません。ファイルが存在しないか未対応の拡張子です。`,
            (item.firstToken as Token).file, (item.firstToken as Token).line)
        }
      }
      if (tasks.length > 0) {
        return Promise.all(tasks)
      }
      return undefined
    }

    try {
      const result = loadRec(code, filename, preCode)

      // 非同期な場合のエラーハンドリング
      if (result !== undefined) {
        result.catch((err) => {
          // 読み込みに失敗しても処理は続ける方針なので、失敗しても例外は投げない
          // たぶん、その後の構文解析でエラーになるため
          this.logger.warn(err.msg)
        })
      }

      // すべてが終わってからthis.dependenciesに代入する。そうしないと、「実行」ボタンを連打した場合など、
      // loadDependencies() が並列実行されるときに正しく動作しない。
      this.dependencies = dependencies
      return result
    } catch (err) {
      // 同期処理では素直に例外を投げる
      this.logger.warn('' + err)
      throw err
    }
  }

  /**
   * コードを単語に分割する
   * @param {string} code なでしこのプログラム
   * @param {number} line なでしこのプログラムの行番号
   * @param {string} filename
   * @param {string} [preCode]
   * @returns {TokenWithSourceMap[]} トークンのリスト
   */
  rawtokenize (code: string, line: number, filename: string, preCode = ''): Token[] {
    if (!code.startsWith(preCode)) {
      throw new Error('codeの先頭にはpreCodeを含める必要があります。')
    }
    // インデント構文 (#596)
    const { code: code2, insertedLines, deletedLines } = NakoIndent.convert(code, filename)
    // DNCL構文 (#1140)
    const code3 = convertDNCL(code2, filename)
    // 全角半角の統一処理
    const preprocessed = this.prepare.convert(code3)

    const tokenizationSourceMapping = new SourceMappingOfTokenization(code2.length, preprocessed)
    const indentationSyntaxSourceMapping = new SourceMappingOfIndentSyntax(code2, insertedLines, deletedLines)
    const offsetToLineColumn = new OffsetToLineColumn(code)

    // トークン分割
    /** @type {import('./nako_lexer.mjs').Token[]} */
    let tokens
    try {
      tokens = this.lexer.tokenize(preprocessed.map((v) => v.text).join(''), line, filename)
    } catch (err) {
      if (!(err instanceof InternalLexerError)) {
        throw err
      }
      // エラー位置をソースコード上の位置に変換して返す
      const dest = indentationSyntaxSourceMapping.map(tokenizationSourceMapping.map(err.preprocessedCodeStartOffset), tokenizationSourceMapping.map(err.preprocessedCodeEndOffset))
      /** @type {number | undefined} */
      const line = dest.startOffset === null ? err.line : offsetToLineColumn.map(dest.startOffset, false).line
      const map = subtractSourceMapByPreCodeLength({ ...dest, line }, preCode)
      throw new NakoLexerError(err.msg, map.startOffset, map.endOffset, map.line, filename)
    }

    // ソースコード上の位置に変換
    return tokens.map((token, i) => {
      const dest = indentationSyntaxSourceMapping.map(
        tokenizationSourceMapping.map(token.preprocessedCodeOffset || 0),
        tokenizationSourceMapping.map((token.preprocessedCodeOffset || 0) + (token.preprocessedCodeLength || 0))
      )
      let line = token.line
      let column = 0
      if (token.type === 'eol' && dest.endOffset !== null) {
        // eolはparserで `line = ${eolToken.line};` に変換されるため、
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
   * 環境のリセット
   */
  reset () {
    /**
     * なでしこのローカル変数をスタックで管理
     * __varslist[0] プラグイン領域
     * __varslist[1] なでしこグローバル領域
     * __varslist[2] 最初のローカル変数 ( == __vars }
     * @type {Record<string, any>[]}
     */
    this.__varslist = [this.__varslist[0], {}, {}]
    this.__v0 = this.__varslist[0]
    this.__v1 = this.__varslist[1]
    this.__vars = this.__varslist[2]
    this.__locals = {}

    // プラグイン命令以外を削除する。
    this.funclist = {}
    for (const name of Object.keys(this.__v0)) {
      const original = this.pluginFunclist[name]
      if (!original) {
        continue
      }
      this.funclist[name] = JSON.parse(JSON.stringify(original))
    }

    this.lexer.setFuncList(this.funclist)
  }

  /**
   * typeがcodeのトークンを単語に分割するための処理
   * @param {string} code
   * @param {number} line
   * @param {string} filename
   * @param {number | null} startOffset
   * @returns
   * @private
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

  /**
   * 再帰的にrequire文を置換する。
   * .jsであれば削除し、.nako3であればそのファイルのトークン列で置換する。
   * @param {TokenWithSourceMap[]} tokens
   * @param {Set<string>} [includeGuard]
   * @returns {Token[]} 削除された取り込み文のトークン
   */
  replaceRequireStatements (tokens: Token[], includeGuard:Set<string> = new Set()): Token[] {
    /** @type {TokenWithSourceMap[]} */
    const deletedTokens = []
    for (const r of NakoCompiler.listRequireStatements(tokens).reverse()) {
      // C言語のinclude guardと同じ仕組みで無限ループを防ぐ。
      if (includeGuard.has(r.value)) {
        deletedTokens.push(...tokens.splice((r.start || 0), (r.end || 0) - (r.start || 0)))
        continue
      }
      const filePath = Object.keys(this.dependencies).find((key) => this.dependencies[key].alias.has(r.value))
      if (filePath === undefined) {
        if (!r.firstToken) { throw new Error(`ファイル『${r.value}』が読み込まれていません。`) }
        throw new NakoLexerError(`ファイル『${r.value}』が読み込まれていません。`,
          (r.firstToken as Token).startOffset || 0,
          (r.firstToken as Token).endOffset || 0,
          (r.firstToken as Token).line, (r.firstToken as Token).file)
      }
      this.dependencies[filePath].addPluginFile()
      const children = cloneAsJSON(this.dependencies[filePath].tokens)
      includeGuard.add(r.value)
      deletedTokens.push(...this.replaceRequireStatements(children, includeGuard))
      deletedTokens.push(...tokens.splice(r.start || 0, (r.end || 0) - (r.start || 0), ...children))
    }
    return deletedTokens
  }

  /**
   * replaceRequireStatementsのシンタックスハイライト用の実装。
   * @param {TokenWithSourceMap[]} tokens
   * @returns {TokenWithSourceMap[]} 削除された取り込み文のトークン
   */
  removeRequireStatements (tokens: Token[]): Token[] {
    /** @type {TokenWithSourceMap[]} */
    const deletedTokens = []
    for (const r of NakoCompiler.listRequireStatements(tokens).reverse()) {
      // プラグイン命令のシンタックスハイライトのために、addPluginFileを呼んで関数のリストをthis.dependencies[filePath].funclistに保存させる。
      const filePath = Object.keys(this.dependencies).find((key) => this.dependencies[key].alias.has(r.value))
      if (filePath !== undefined) {
        this.dependencies[filePath].addPluginFile()
      }

      // 全ての取り込み文を削除する。そうしないとトークン化に時間がかかりすぎる。
      deletedTokens.push(...tokens.splice(r.start || 0, (r.end || 0) - (r.start || 0)))
    }
    return deletedTokens
  }

  /**
   * @param {string} code
   * @param {string} filename
   * @param {string} [preCode]
   */
  lex (code: string, filename = 'main.nako3', preCode = '', syntaxHighlighting = false): LexResult {
    // 単語に分割
    let tokens = this.rawtokenize(code, 0, filename, preCode)

    // require文を再帰的に置換する
    const requireStatementTokens = syntaxHighlighting ? this.removeRequireStatements(tokens) : this.replaceRequireStatements(tokens, undefined)
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
    /** @type {TokenWithSourceMap[]} */
    const commentTokens = tokens.filter((t) => t.type === 'line_comment' || t.type === 'range_comment')
      .map((v) => ({ ...v })) // clone

    tokens = this.converttoken(tokens, true, filename)

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] && tokens[i].type === 'code') {
        const children = this.lexCodeToken(tokens[i].value, tokens[i].line, filename, tokens[i].startOffset || 0)
        commentTokens.push(...children.commentTokens)
        tokens.splice(i, 1, ...children.tokens)
        i--
      }
    }

    this.logger.trace('--- lex ---\n' + JSON.stringify(tokens, null, 2))

    return { commentTokens, tokens, requireTokens: requireStatementTokens }
  }

  /**
   * コードをパースしてASTにする
   * @param {string} code なでしこのプログラム
   * @param {string} filename
   * @param {string} [preCode]
   * @return {Ast}
   */
  parse (code: string, filename: string, preCode = '') {
    // 関数を字句解析と構文解析に登録
    this.lexer.setFuncList(this.funclist)
    this.parser.setFuncList(this.funclist)

    const lexerOutput = this.lex(code, filename, preCode)

    // 構文木を作成
    /** @type {Ast} */
    let ast
    try {
      this.parser.genMode = 'sync' // set default
      ast = this.parser.parse(lexerOutput.tokens, filename)
    } catch (err: any) {
      if (typeof err.startOffset !== 'number') {
        throw NakoSyntaxError.fromNode(err.message, lexerOutput.tokens[this.parser.getIndex()])
      }
      throw err
    }
    this.usedFuncs = this.getUsedFuncs(ast)
    this.logger.trace('--- ast ---\n' + JSON.stringify(ast, null, 2))
    return ast
  }

  /**
   * @param {Ast} ast
   */
  getUsedFuncs (ast: Ast): Set<string> {
    const queue = [ast]
    this.usedFuncs = new Set()

    while (queue.length > 0) {
      const ast_ = queue.pop()

      if (ast_ !== null && ast_ !== undefined && ast_.block !== null && ast_.block !== undefined) {
        this.getUsedAndDefFuncs(queue, JSON.parse(JSON.stringify(ast_.block)))
      }
    }

    return this.deleteUnNakoFuncs()
  }

  getUsedAndDefFuncs (astQueue: Ast[], blockQueue: Ast[]): void {
    while (blockQueue.length > 0) {
      const block = blockQueue.pop()

      if (block !== null && block !== undefined) {
        this.getUsedAndDefFunc(block, astQueue, blockQueue)
      }
    }
  }

  getUsedAndDefFunc (block: Ast, astQueue: any[], blockQueue: Ast[]): void {
    if (['func', 'func_pointer'].includes(block.type) && block.name !== null && block.name !== undefined) {
      this.usedFuncs.add(block.name as string)
    }
    astQueue.push([block, block.block as Ast])
    blockQueue.push.apply(blockQueue, [block.value].concat(block.args))
  }

  deleteUnNakoFuncs (): Set<string> {
    for (const func of this.usedFuncs) {
      if (!this.commandlist.has(func)) {
        this.usedFuncs.delete(func)
      }
    }
    return this.usedFuncs
  }

  /**
   * プログラムをコンパイルしてランタイム用のJavaScriptのコードを返す
   * @param {string} code コード (なでしこ)
   * @param {string} filename
   * @param {boolean | string} isTest テストかどうか。stringの場合は1つのテストのみ。
   * @param {string} [preCode]
   */
  compile (code: string, filename: string, isTest: boolean, preCode = ''): string {
    const ast = this.parse(code, filename, preCode)
    const codeObj = this.generateCode(ast, isTest, preCode)
    return codeObj.runtimeEnv
  }

  /**
   * プログラムをコンパイルしてJavaScriptのコードオブジェクトを返す
   * @param {AST} ast
   * @param {boolean | string} isTest テストかどうか。stringの場合は1つのテストのみ。
   * @param {string} [preCode]
   * @return {Object}
   */
  generateCode (ast: Ast, isTest: boolean, preCode = ''): NakoGenResult {
    // Select Code Generator #637
    switch (ast.genMode) {
      // ノーマルモード
      case 'sync':
        return generateJS(this, ast, isTest)
      // 『!非同期モード』は緩やかに非推奨にする
      case '非同期モード':
        return NakoGenASync.generate(this, ast, isTest)
      default:
        throw new Error(`コードジェネレータの「${ast.genMode}」はサポートされていません。`)
    }
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {boolean} isReset
   * @param {boolean | string} isTest テストかどうか。stringの場合は1つのテストのみ。
   * @param {string} [preCode]
   * @returns {nakoGlobal}
   */
  _run (code: string, fname: string, isReset: boolean, isTest: boolean, preCode = ''): NakoGlobal {
    const opts: CompilerOptions = {
      resetEnv: isReset,
      resetAll: isReset,
      testOnly: isTest
    }
    return this._runEx(code, fname, opts, preCode)
  }

  clearPlugins () {
    // 他に実行している「なでしこ」があればクリアする
    this.__globals.forEach((sys: NakoGlobal) => {
      sys.reset()
    })
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {Partial<CompilerOptions>} opts
   * @param {string} [preCode]
   * @param {NakoGlobal} [nakoGlobal] ナデシコ命令でスコープを共有するため
   * @returns {nakoGlobal}
   */
  _runEx (code: string, fname: string, opts: Partial<CompilerOptions>, preCode = '', nakoGlobal: NakoGlobal|undefined = undefined): NakoGlobal {
    // コンパイル
    let out
    try {
      const optsAll = Object.assign({ resetEnv: true, testOnly: false, resetAll: true }, opts)
      if (optsAll.resetEnv) { this.reset() }
      if (optsAll.resetAll) { this.clearPlugins() }
      const ast = this.parse(code, fname, preCode)
      out = this.generateCode(ast, optsAll.testOnly)
    } catch (e: any) {
      this.logger.error(e)
      throw e
    }
    // 実行
    nakoGlobal = nakoGlobal || new NakoGlobal(this, out.gen)
    if (this.__globals.indexOf(nakoGlobal) < 0) {
      this.__globals.push(nakoGlobal)
    }
    try {
      // eslint-disable-next-line no-new-func
      new Function(out.runtimeEnv).apply(nakoGlobal)
      return nakoGlobal
    } catch (e: any) {
      let err = e
      if (!(e instanceof NakoRuntimeError)) {
        err = new NakoRuntimeError(e, nakoGlobal.__varslist[0].line)
      }
      this.logger.error(err)
      throw err
    }
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {Partial<CompilerOptions>} opts
   * @param {string} [preCode]
   */
  runEx (code: string, fname: string, opts: Partial<CompilerOptions>, preCode = '') {
    return this._runEx(code, fname, opts, preCode)
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   * @param {string | undefined} [testName]
   */
  test (code: string, fname: string, preCode = '', testName: string|undefined = undefined) {
    return this._runEx(code, fname, { testOnly: testName || true }, preCode)
  }

  /**
   * なでしこのプログラムを実行（他に実行しているインスタンスはそのまま）
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   */
  run (code: string, fname = 'main.nako3', preCode = ''): NakoGlobal {
    return this._runEx(code, fname, { resetAll: false }, preCode)
  }

  /**
   * なでしこのプログラムを実行（他に実行しているインスタンスもリセットする)
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   */
  runReset (code: string, fname = 'main.nako3', preCode = '') {
    return this._runEx(code, fname, { resetAll: true }, preCode)
  }

  /**
   * JavaScriptのみで動くコードを取得する場合
   * @param {string} code
   * @param {string} filename
   * @param {boolean | string} isTest
   * @param {string} [preCode]
   */
  compileStandalone (code: string, filename: string, isTest: boolean, preCode = '') {
    const ast = this.parse(code, filename, preCode)
    return this.generateCode(ast, isTest).standalone
  }

  /**
   * プラグイン・オブジェクトを追加
   * @param po プラグイン・オブジェクト
   * @param {boolean} [persistent] falseのとき、次以降の実行では使えない
   */
  addPlugin (po: {[key: string]: any}, persistent = true) {
    // 変数のメタ情報を確認
    const __v0 = this.__varslist[0]
    if (__v0.meta === undefined) { __v0.meta = {} }

    // プラグインの値をオブジェクトにコピー
    for (const key in po) {
      const v = po[key]
      this.funclist[key] = v
      if (persistent) {
        this.pluginFunclist[key] = JSON.parse(JSON.stringify(v))
      }
      if (v.type === 'func') {
        __v0[key] = v.fn
      } else if (v.type === 'const' || v.type === 'var') {
        __v0[key] = v.value
        __v0.meta[key] = {
          readonly: (v.type === 'const')
        }
      } else {
        console.error('[プラグイン追加エラー]', v)
        throw new Error('プラグインの追加でエラー。')
      }
      // コマンドを登録するか?
      if (key === '初期化' || key.substring(0, 1) === '!') { // 登録しない関数名
        continue
      }
      this.commandlist.add(key)
    }
  }

  /**
   * プラグイン・オブジェクトを追加(ブラウザ向け)
   * @param objName オブジェクト名
   * @param po 関数リスト
   * @param {boolean} [persistent] falseのとき、次以降の実行では使えない
   */
  addPluginObject (objName: string, po: {[key: string]: any}, persistent = true) {
    this.__module[objName] = po
    this.pluginfiles[objName] = '*'
    // 初期化をチェック
    if (typeof (po['初期化']) === 'object') {
      const def = po['初期化']
      delete po['初期化']
      const initKey = `!${objName}:初期化`
      po[initKey] = def
    }
    // メタ情報をチェック (#1034)
    if (po.meta && po.meta.value && typeof (po.meta) === 'object') {
      const meta = po.meta
      delete po.meta
      const pluginName = meta.value.pluginName || objName
      const metaKey = `__${pluginName}`.replace('-', '__')
      po[metaKey] = meta
    }
    this.addPlugin(po, persistent)
  }

  /**
   * プラグイン・ファイルを追加(Node.js向け)
   * @param {string} objName オブジェクト名
   * @param {string} fpath ファイルパス
   * @param po 登録するオブジェクト
   * @param {boolean} [persistent] falseのとき、次以降の実行では使えない
   */
  addPluginFile (objName: string, fpath: string, po: {[key: string]: any}, persistent = true) {
    // Windowsのパスがあると、JSファイル書き出しでエラーになるので、置換する
    if (objName.indexOf('\\') >= 0) {
      objName = objName.replace(/\\/g, '/')
    }
    this.addPluginObject(objName, po, persistent)
    if (this.pluginfiles[objName] === undefined) {
      this.pluginfiles[objName] = fpath
    }
  }

  /**
   * 関数を追加する
   * @param {string} key 関数名
   * @param {string[][]} josi 助詞
   * @param {Function} fn 関数
   * @param {boolean} returnNone 値を返す関数の場合はfalseを指定
   * @param {boolean} asyncFn Promiseを返す関数かを指定
   */
  addFunc (key: string, josi: FuncArgs, fn: any, returnNone = true, asyncFn = false) {
    this.funclist[key] = { josi, fn, type: 'func', return_none: returnNone, asyncFn }
    this.pluginFunclist[key] = cloneAsJSON(this.funclist[key])
    this.__varslist[0][key] = fn
  }

  /**
   * プラグイン関数を参照する
   * @param {string} key プラグイン関数の関数名
   * @returns {NakoFunction} プラグイン・オブジェクト
   */
  getFunc (key: string) {
    return this.funclist[key]
  }
}
