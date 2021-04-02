/**
 * nadesiko v3
 */
const Parser = require('./nako_parser3')
const NakoLexer = require('./nako_lexer')
const Prepare = require('./nako_prepare')
const NakoGen = require('./nako_gen')
const NakoIndent = require('./nako_indent')
const PluginSystem = require('./plugin_system')
const PluginMath = require('./plugin_math')
const PluginTest = require('./plugin_test')
const { SourceMappingOfTokenization, SourceMappingOfIndentSyntax, OffsetToLineColumn, subtractSourceMapByPreCodeLength } = require("./nako_source_mapping")
const { NakoRuntimeError, NakoLexerError, NakoImportError, NakoSyntaxError, InternalLexerError } = require('./nako_errors')
const NakoLogger = require('./nako_logger')
const NakoGlobal = require('./nako_global')

/** @type {<T>(x: T) => T} */
const cloneAsJSON = (x) => JSON.parse(JSON.stringify(x))

/**
 * @typedef {{
 *   type: string
 *   value: any
 *   line: number
 *   column: number
 *   file: string
 *   josi: string
 *   meta?: any
 *   rawJosi: string
 *   startOffset: number | null
 *   endOffset: number | null
 *   isDefinition?: boolean
 * }} TokenWithSourceMap
 * 
 * @typedef {{
 *     resetEnv: boolean
 *     testOnly: boolean | string
 *     resetAll: boolean
 * }} CompilerOptions
 */

/**
 * 一部のプロパティのみ。
 * @typedef {{
 *   type: string
 *   cond?: TokenWithSourceMap | Ast
 *   block?: (TokenWithSourceMap | Ast)[] | TokenWithSourceMap | Ast
 *   false_block?: TokenWithSourceMap | Ast
 *   name?: TokenWithSourceMap | Ast
 *   josi?: string
 *   value?: unknown
 *   line?: number
 *   column?: number
 *   file?: string
 *   startOffset: number | null
 *   endOffset: number | null
 *   rawJosi?: string
 *   end?: {
 *     startOffset: number | null
 *     endOffset: number | null
 *     line?: number
 *     column?: number
 *   }
 * }} Ast
 * 
 * @typedef {(
 *     | { type: 'func', josi: string[][], pure?: boolean, fn?: Function, return_none: boolean }
 *     | { type: 'var' | 'const', value: any}
 * )} NakoFunction
 */

class NakoCompiler {
  constructor () {
    this.silent = true
    this.filename = 'inline'
    this.options = {}
    // 環境のリセット
    /** @type {Record<string, any>[]} */
    this.__varslist = [{}, {}, {}] // このオブジェクトは変更しないこと (this.gen.__varslist と共有する)
    this.__locals = {}  // ローカル変数
    this.__self = this
    this.__vars = this.__varslist[2]
    this.__globals = [] // 生成した NakoGlobalのインスタンスを保持
    /** @type {Record<string, Record<string, NakoFunction>>} */
    this.__module = {} // requireなどで取り込んだモジュールの一覧
    /** @type {Record<string, NakoFunction>} */
    this.pluginFunclist = {} // プラグインで定義された関数
    /** @type {Record<string, NakoFunction>} */
    this.funclist = {} // プラグインで定義された関数 + ユーザーが定義した関数
    this.pluginfiles = {} // 取り込んだファイル一覧
    this.isSetter = false // 代入的関数呼び出しを管理(#290)
    this.commandlist = new Set() // プラグインで定義された定数・変数・関数の名前
    /** @type {Record<string, { josi: string[][], fn: string, type: 'func' }>} */
    this.nako_func = {}  // __v1に配置するJavaScriptのコードで定義された関数

    this.logger = new NakoLogger()

    // 必要なオブジェクトを覚えておく
    this.prepare = new Prepare(this.logger)
    this.parser = new Parser(this.logger)
    this.lexer = new NakoLexer(this.logger)
    
    // set this
    this.addPluginObject('PluginSystem', PluginSystem)
    this.addPluginObject('PluginMath', PluginMath)
    this.addPluginObject('PluginAssert', PluginTest)

    /**
     * 取り込み文を置換するためのオブジェクト。
     * 正規化されたファイル名がキーになり、取り込み文の引数に指定された正規化されていないファイル名はaliasに入れられる。
     * JavaScriptファイルによるプラグインの場合、contentは空文字列。
     * funclistはシンタックスハイライトの高速化のために事前に取り出した、ファイルが定義する関数名のリスト。
     * @type {Record<string, { tokens: TokenWithSourceMap[], alias: Set<string>, addPluginFile: () => void, funclist: Record<string, object> }>}
     */
    this.dependencies = {}

    /** @type {Set<string>} */
    this.usedFuncs = new Set()

    this.setFunc = this.addFunc  // エイリアス

    this.numFailures = 0
  }

  /**
   * loggerを新しいインスタンスで置き換える。
   */
  replaceLogger() {
    return this.prepare.logger = this.lexer.logger = this.parser.logger = this.logger = new NakoLogger()
  }

  /**
   * ファイル内のrequire文の位置を列挙する。出力の配列はstartでソートされている。
   * @param {TokenWithSourceMap[]} tokens rawtokenizeの出力
   */
  static listRequireStatements(tokens) {
    /** @type {{ start: number, end: number, value: string, firstToken: TokenWithSourceMap, lastToken: TokenWithSourceMap }[]} */
    const requireStatements = []
    for (let i = 0; i + 2 < tokens.length; i++) {
      // not (string|string_ex) '取り込み'
      if (!(tokens[i].type === 'not' &&
        (tokens[i + 1].type === 'string' || tokens[i + 1].type === 'string_ex') &&
        tokens[i + 2].value === '取込')) {
        continue
      }
      requireStatements.push({ start: i, end: i + 3, value: tokens[i + 1].value + '', firstToken: tokens[i], lastToken: tokens[i + 2] })
      i += 2
    }
    return requireStatements
  }

  /**
   * プログラムが依存するファイルを再帰的に取得する。
   * - .jsであれば評価してthis.addPluginFileを呼び出し、.nako3であればファイルをfetchしてdependenciesに保存し再帰する。
   * - resolvePathはファイルを検索して正規化する必要がある。
   * - needNako3やneedJsがPromiseを返すなら並列処理し、処理の終了を知らせるためのPromiseを返す。そうでなければ同期的に処理する。
   *   （`instanceof Promise` はpolyfillで動作しない場合があるため、Promiseかどうかを明示する必要がある。）
   * - readNako3はソースコードを返す。readJsはrequireあるいはevalする関数を返す。
   * @param {string} code
   * @param {string} filename
   * @param {string} preCode
   * @param {{
   *     resolvePath: (name: string, token: TokenWithSourceMap) => { type: 'nako3' | 'js' | 'invalid', filePath: string }
   *     readNako3: (filePath: string, token: TokenWithSourceMap) => { sync: true, value: string } | { sync: false, value: Promise<string> }
   *     readJs: (filePath: string, token: TokenWithSourceMap) => { sync: true, value: () => object } | { sync: false, value: Promise<() => object> }
   * }} tools
   * @returns {Promise<unknown> | void}
   */
  loadDependencies(code, filename, preCode, tools) {
    /** @type {NakoCompiler['dependencies']} */
    const dependencies = {}
    const compiler = new NakoCompiler()

    /** @param {string} code @param {string} filename @param {string} preCode @returns {Promise<unknown> | void} */
    const inner = (code, filename, preCode) => {
      /** @type {Promise<unknown>[]} */
      const tasks = []
      for (const item of NakoCompiler.listRequireStatements(compiler.rawtokenize(code, 0, filename, preCode)).map((v) => ({ ...v, ...tools.resolvePath(v.value, v.firstToken) }))) {
        // 2回目以降の読み込み
        if (dependencies.hasOwnProperty(item.filePath)) {
          dependencies[item.filePath].alias.add(item.value)
          continue
        }

        // 初回の読み込み
        dependencies[item.filePath] = { tokens: [], alias: new Set([item.value]), addPluginFile: () => {}, funclist: {} }
        if (item.type === 'js') {
          // jsならプラグインとして読み込む。
          const obj = tools.readJs(item.filePath, item.firstToken)
          if (obj.sync) {
            dependencies[item.filePath].addPluginFile = () => { this.addPluginFile(item.value, item.filePath, dependencies[item.filePath].funclist = obj.value(), false) }
          } else {
            tasks.push(obj.value.then((res) => {
              dependencies[item.filePath].addPluginFile = () => { this.addPluginFile(item.value, item.filePath, dependencies[item.filePath].funclist = res(), false) }
            }))
          }
        } else if (item.type === 'nako3') {
          // nako3ならファイルを読んでdependenciesに保存する。
          const content = tools.readNako3(item.filePath, item.firstToken)
          /** @param {string} code */
          const registerFile = (code) => {
            // シンタックスハイライトの高速化のために、事前にファイルが定義する関数名のリストを取り出しておく。
            // preDefineFuncはトークン列に変更を加えるため、事前にクローンしておく。
            const tokens = this.rawtokenize(code, 0, item.filePath)
            dependencies[item.filePath].tokens = tokens
            /** @type {import('./nako_lexer').FuncList} */
            const funclist = {}
            NakoLexer.preDefineFunc(cloneAsJSON(tokens), this.logger, funclist)
            dependencies[item.filePath].funclist = funclist

            // 再帰
            return inner(code, item.filePath, '')
          }
          if (content.sync) {
            return registerFile(content.value)
          } else {
            tasks.push(content.value.then((res) => registerFile(res)))
          }
        } else {
          throw new NakoImportError(`ファイル ${item.value} を読み込めません。未対応の拡張子です。`, item.firstToken.line, item.firstToken.file)
        }
      }

      if (tasks.length > 0) {
        return Promise.all(tasks)
      }
    }

    try {
      const result = inner(code, filename, preCode)

      // 非同期な場合のエラーハンドリング
      if (result !== undefined) {
        result.catch((err) => { this.logger.error(err); throw err })
      }

      // すべてが終わってからthis.dependenciesに代入する。そうしないと、「実行」ボタンを連打した場合など、
      // loadDependencies() が並列実行されるときに正しく動作しない。
      this.dependencies = dependencies
      return result
    } catch (err) { // 同期的な場合のエラーハンドリング
      this.logger.error(err)
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
  rawtokenize (code, line, filename, preCode = '') {
    if (!code.startsWith(preCode)) {
      throw new Error('codeの先頭にはpreCodeを含める必要があります。')
    }
    // インデント構文 (#596)
    const { code: code2, insertedLines, deletedLines } = NakoIndent.convert(code, filename)

    // 全角半角の統一処理
    const preprocessed = this.prepare.convert(code2)

    const tokenizationSourceMapping = new SourceMappingOfTokenization(code2.length, preprocessed)
    const indentationSyntaxSourceMapping = new SourceMappingOfIndentSyntax(code2, insertedLines, deletedLines)
    const offsetToLineColumn = new OffsetToLineColumn(code)

    // トークン分割
    /** @type {import('./nako_lexer').Token[]} */
    let tokens
    try {
      tokens = this.lexer.setInput(preprocessed.map((v) => v.text).join(""), line, filename)
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
        tokenizationSourceMapping.map(token.preprocessedCodeOffset),
        tokenizationSourceMapping.map(token.preprocessedCodeOffset + token.preprocessedCodeLength),
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
        rawJosi: token.josi,
      }
    })
  }

  /**
   * 単語の属性を構文解析に先立ち補正する
   * @param {TokenWithSourceMap[]} tokens トークンのリスト
   * @param {boolean} isFirst 最初の呼び出しかどうか
   * @returns コード (なでしこ)
   */
  converttoken (tokens, isFirst) {
    return this.lexer.setInput2(tokens, isFirst)
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
   * @returns {{ commentTokens: TokenWithSourceMap[], tokens: TokenWithSourceMap[] }}
   * @private
   */
  lexCodeToken(code, line, filename, startOffset) {
    // 単語に分割
    let tokens = this.rawtokenize(code, line, filename, '')

    // 文字列内位置からファイル内位置へ変換
    if (startOffset === null) {
        for (const token of tokens) {
            token.startOffset = null
            token.endOffset = null
        }
    } else {
        for (const token of tokens) {
            if (token.startOffset !== null) {
                token.startOffset += startOffset
            }
            if (token.endOffset !== null) {
                token.endOffset += startOffset
            }
        }
    }

    // convertTokenで消されるコメントのトークンを残す
    const commentTokens = tokens.filter((t) => t.type === "line_comment" || t.type === "range_comment")
      .map((v) => ({ ...v }))  // clone

    tokens = this.converttoken(tokens, false)

    return { tokens, commentTokens }
  }

  /**
   * 再帰的にrequire文を置換する。
   * .jsであれば削除し、.nako3であればそのファイルのトークン列で置換する。
   * @param {TokenWithSourceMap[]} tokens
   * @param {Set<string>} [includeGuard]
   * @returns {TokenWithSourceMap[]} 削除された取り込み文のトークン
   */
  replaceRequireStatements(tokens, includeGuard = new Set()) {
    /** @type {TokenWithSourceMap[]} */
    const deletedTokens = []
    for (const r of NakoCompiler.listRequireStatements(tokens).reverse()) {
      // C言語のinclude guardと同じ仕組みで無限ループを防ぐ。
      if (includeGuard.has(r.value)) {
        deletedTokens.push(...tokens.splice(r.start, r.end - r.start))
        continue
      }
      const filePath = Object.keys(this.dependencies).find((key) => this.dependencies[key].alias.has(r.value))
      if (filePath === undefined) {
        throw new NakoLexerError(`ファイル ${r.value} が読み込まれていません。`, r.firstToken.startOffset, r.firstToken.endOffset, r.firstToken.line, r.firstToken.file)
      }
      this.dependencies[filePath].addPluginFile()
      const children = cloneAsJSON(this.dependencies[filePath].tokens)
      includeGuard.add(r.value)
      deletedTokens.push(...this.replaceRequireStatements(children, includeGuard))
      deletedTokens.push(...tokens.splice(r.start, r.end - r.start, ...children))
    }
    return deletedTokens
  }

  /**
   * replaceRequireStatementsのシンタックスハイライト用の実装。
   * @param {TokenWithSourceMap[]} tokens
   * @returns {TokenWithSourceMap[]} 削除された取り込み文のトークン
   */
  removeRequireStatements(tokens) {
    /** @type {TokenWithSourceMap[]} */
    const deletedTokens = []
    for (const r of NakoCompiler.listRequireStatements(tokens).reverse()) {
      // プラグイン命令のシンタックスハイライトのために、addPluginFileを呼んで関数のリストをthis.dependencies[filePath].funclistに保存させる。
      const filePath = Object.keys(this.dependencies).find((key) => this.dependencies[key].alias.has(r.value))
      if (filePath !== undefined) {
        this.dependencies[filePath].addPluginFile()
      }

      // 全ての取り込み文を削除する。そうしないとトークン化に時間がかかりすぎる。
      deletedTokens.push(...tokens.splice(r.start, r.end - r.start))
    }
    return deletedTokens
  }

  /**
   * @param {string} code
   * @param {string} filename
   * @param {string} [preCode]
   * @returns {{ commentTokens: TokenWithSourceMap[], tokens: TokenWithSourceMap[], requireTokens: TokenWithSourceMap[] }}
   */
  lex(code, filename, preCode = '', syntaxHighlighting = false) {
    // 単語に分割
    let tokens = this.rawtokenize(code, 0, filename, preCode)

    // require文を再帰的に置換する
    const requireStatementTokens = syntaxHighlighting ? this.removeRequireStatements(tokens) : this.replaceRequireStatements(tokens, undefined)
    for (const t of requireStatementTokens) {
      if (t.type === 'word' || t.type === 'not') {
        t.type = 'require'
      }
    }

    // convertTokenで消されるコメントのトークンを残す
    /** @type {TokenWithSourceMap[]} */
    const commentTokens = tokens.filter((t) => t.type === "line_comment" || t.type === "range_comment")
        .map((v) => ({ ...v }))  // clone

    tokens = this.converttoken(tokens, true)

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i]['type'] === 'code') {
        const children = this.lexCodeToken(tokens[i].value, tokens[i].line, filename, tokens[i].startOffset)
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
  parse (code, filename, preCode = '') {
    // 関数を字句解析と構文解析に登録
    this.lexer.setFuncList(this.funclist)
    this.parser.setFuncList(this.funclist)

    const lexerOutput = this.lex(code, filename, preCode)

    // 構文木を作成
    /** @type {Ast} */
    let ast
    try {
      ast = this.parser.parse(lexerOutput.tokens)
    } catch (err) {
      if (typeof err.startOffset !== 'number') {
        throw NakoSyntaxError.fromNode(err.message, lexerOutput.tokens[this.parser.index])
      }
      throw err
    }
    this.usedFuncs = this.getUsedFuncs(ast)
    this.logger.trace('--- ast ---\n' + JSON.stringify(ast, null, 2))
    return ast
  }

  getUsedFuncs (ast) {
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

  getUsedAndDefFuncs (astQueue, blockQueue) {
    while (blockQueue.length > 0) {
      const block = blockQueue.pop()

      if (block !== null && block !== undefined) {
        this.getUsedAndDefFunc(block, astQueue, blockQueue)
      }
    }
  }

  getUsedAndDefFunc (block, astQueue, blockQueue) {
    if (['func', 'func_pointer'].includes(block.type) && block.name !== null && block.name !== undefined) {
      this.usedFuncs.add(block.name)
    }

    astQueue.push.apply(astQueue, [block, block.block])
    blockQueue.push.apply(blockQueue, [block.value].concat(block.args))
  }

  deleteUnNakoFuncs () {
    for (const func of this.usedFuncs) {
      if (!this.commandlist.has(func)) {
        this.usedFuncs.delete(func)
      }
    }

    return this.usedFuncs
  }

  /**
   * プログラムをコンパイルしてJavaScriptのコードを返す
   * @param {string} code コード (なでしこ)
   * @param {string} filename
   * @param {boolean | string} isTest テストかどうか。stringの場合は1つのテストのみ。
   * @param {string} [preCode]
   */
  compile(code, filename, isTest, preCode = '') {
    return NakoGen.generate(this, this.parse(code, filename, preCode), isTest).runtimeEnv
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {boolean} isReset
   * @param {boolean | string} isTest テストかどうか。stringの場合は1つのテストのみ。
   * @param {string} [preCode]
   */
  _run(code, fname, isReset, isTest, preCode = '') {
    const opts = {
      resetLog: isReset,
      testOnly: isTest
    }
    return this._runEx(code, fname, opts, preCode)
  }

  clearPlugins () {
    // 他に実行している「なでしこ」があればクリアする
    this.__globals.forEach((sys) => {
      sys.reset()
    })
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {Partial<CompilerOptions>} opts
   * @param {string} [preCode]
   * @param {NakoGlobal} [nakoGlobal] ナデシコ命令でスコープを共有するため
   */
  _runEx(code, fname, opts, preCode = '', nakoGlobal) {
    // コンパイル
    let out
    try {
      const optsAll = Object.assign({ resetEnv: true, testOnly: false, resetAll: true }, opts)
      if (optsAll.resetEnv) {this.reset()}
      if (optsAll.resetAll) {this.clearPlugins()}
      out = NakoGen.generate(this, this.parse(code, fname, preCode), optsAll.testOnly)
    } catch (e) {
      this.logger.error(e)
      throw e
    }
    // 実行
    nakoGlobal = nakoGlobal || new NakoGlobal(this, out.gen)
    if (this.__globals.indexOf(nakoGlobal) < 0) {
      this.__globals.push(nakoGlobal)
    }
    try {
      new Function(out.runtimeEnv).apply(nakoGlobal)
      return nakoGlobal
    } catch (e) {
      if (!(e instanceof NakoRuntimeError)) {
        e = new NakoRuntimeError(e, nakoGlobal.__varslist[0].line)
      }
      this.logger.error(e)
      throw e
    }
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {Partial<CompilerOptions>} opts
   * @param {string} [preCode]
   */
  runEx(code, fname, opts, preCode = '') {
    return this._runEx(code, fname, opts, preCode)
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   * @param {string | undefined} [testName]
   */
  test(code, fname, preCode = '', testName = undefined) {
    return this._runEx(code, fname, { testOnly: testName || true }, preCode)
  }

  /**
   * なでしこのプログラムを実行（他に実行しているインスタンスはそのまま）
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   */
  run(code, fname, preCode = '') {
    return this._runEx(code, fname, {resetAll: false}, preCode)
  }

  /**
   * なでしこのプログラムを実行（他に実行しているインスタンスもリセットする)
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   */
  runReset(code, fname, preCode = '') {
    return this._runEx(code, fname, {resetAll: true}, preCode)
  }

  /**
   * JavaScriptのみで動くコードを取得する場合
   * @param {string} code
   * @param {string} filename
   * @param {boolean | string} isTest
   * @param {string} [preCode]
   */
  compileStandalone(code, filename, isTest, preCode = '') {
    return NakoGen.generate(this, this.parse(code, filename, preCode), isTest).standalone
  }

  /**
   * プラグイン・オブジェクトを追加
   * @param po プラグイン・オブジェクト
   * @param {boolean} [persistent] falseのとき、次以降の実行では使えない
   */
  addPlugin (po, persistent = true) {
    // 変数のメタ情報を確認
    const __v0 = this.__varslist[0]
    if (__v0.meta === undefined){ __v0.meta = {} }

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
        throw new Error('プラグインの追加でエラー。')
      }
      // コマンドを登録するか?
      if (key === '初期化' || key.substr(0, 1) === '!' ) { // 登録しない関数名
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
  addPluginObject (objName, po, persistent = true) {
    this.__module[objName] = po
    this.pluginfiles[objName] = '*'
    if (typeof (po['初期化']) === 'object') {
      const def = po['初期化']
      delete po['初期化']
      const initkey = `!${objName}:初期化`
      po[initkey] = def
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
  addPluginFile (objName, fpath, po, persistent = true) {
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
   * @param {boolean} returnNone 値を返す関数の場合はfalseを設定する。
   */
  addFunc (key, josi, fn, returnNone = true) {
    this.funclist[key] = {josi, fn, type: 'func', return_none: returnNone}
    this.pluginFunclist[key] = cloneAsJSON(this.funclist[key])
    this.__varslist[0][key] = fn
  }

  /**
   * プラグイン関数を参照する
   * @param {string} key プラグイン関数の関数名
   * @returns {NakoFunction} プラグイン・オブジェクト
   */
  getFunc (key) {
    return this.funclist[key]
  }
}

module.exports = NakoCompiler
