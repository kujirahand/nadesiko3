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
const { NakoRuntimeError, LexError, LexErrorWithSourceMap, NakoImportError, NakoSyntaxError } = require('./nako_errors')

/**
 * @typedef {{
 *   type: string;
 *   value: unknown;
 *   line: number;
 *   column: number;
 *   file: string;
 *   josi: string;
 *   meta?: any;
 *   rawJosi: string
 *   startOffset: number | null
 *   endOffset: number | null
 *   isDefinition?: boolean
 * }} TokenWithSourceMap
 * 
 * @typedef {{
 *     resetEnv: boolean
 *     resetLog: boolean
 *     testOnly: boolean
 * }} CompilerOptions
 */

const prepare = new Prepare()
const parser = new Parser()
const lexer = new NakoLexer()

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
 *     | { type: 'func', josi: string[][], pure?: boolean, fn?: Function }
 *     | { type: 'var' | 'const', value: any}
 * )} NakoFunction
 */

class NakoCompiler {
  constructor () {
    this.debugAll = false
    this.debug = false || this.debugAll
    this.silent = true
    this.debugParser = false || this.debugAll
    this.debugJSCode = true || this.debugAll
    this.debugLexer = false || this.debugAll
    this.filename = 'inline'
    this.options = {}
    // 環境のリセット
    /** @type {Record<string, any>[]} */
    this.__varslist = [{}, {}, {}] // このオブジェクトは変更しないこと (this.gen.__varslist と共有する)
    this.__locals = {}  // ローカル変数
    this.__self = this
    this.__vars = this.__varslist[2]
    /** @type {Record<string, Record<string, NakoFunction>>} */
    this.__module = {} // requireなどで取り込んだモジュールの一覧
    /** @type {Record<string, NakoFunction>} */
    this.pluginFunclist = {} // プラグインで定義された関数
    /** @type {Record<string, NakoFunction>} */
    this.funclist = {} // プラグインで定義された関数 + ユーザーが定義した関数
    this.pluginfiles = {} // 取り込んだファイル一覧
    this.isSetter = false // 代入的関数呼び出しを管理(#290)
    this.commandlist = new Set() // プラグインで定義された定数・変数・関数の名前
    // 必要なオブジェクトを覚えておく
    this.prepare = prepare
    this.lexer = lexer
    this.parser = parser
    // set this
    this.gen = new NakoGen(this)
    this.addPluginObject('PluginSystem', PluginSystem)
    this.addPluginObject('PluginMath', PluginMath)
    this.addPluginObject('PluginAssert', PluginTest)

    /**
     * 取り込み文を置換するためのオブジェクト。
     * 正規化されたファイル名がキーになり、取り込み文の引数に指定された正規化されていないファイル名はaliasに入れられる。
     * JavaScriptファイルによるプラグインの場合、contentは空文字列。
     * @type {Record<string, { content: string, alias: Set<string> }>}
     */
    this.dependencies = {}
  }

  get log () {
    let s = this.__varslist[0]['表示ログ']
    s = s.replace(/\s+$/, '')
    return s
  }

  static getHeader () {
    return NakoGen.getHeader()
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
   * @param {string} code
   * @param {string} filename
   * @param {string} preCode
   * @param {{
   *     resolvePath: (name: string, token: TokenWithSourceMap) => { type: 'nako3' | 'js' | 'invalid', filePath: string }
   *     readNako3: (filePath: string, token: TokenWithSourceMap) => { sync: true, value: string } | { sync: false, value: Promise<string> }
   *     readJs: (filePath: string, token: TokenWithSourceMap) => { sync: true, value: string } | { sync: false, value: Promise<object> }
   * }} tools
   * @returns {Promise<unknown> | void}
   */
  loadDependencies(code, filename, preCode, tools, useCache = false) {
    /** @type {NakoCompiler['dependencies']} */
    const dependencies = {}
    const compiler = new NakoCompiler()

    /** @param {string} code @param {string} filename @param {string} preCode */
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
        dependencies[item.filePath] = { content: '', alias: new Set([item.value]) }
        if (item.type === 'js') {
          // jsならプラグインとして読み込む。
          const obj = tools.readJs(item.filePath, item.firstToken)
          if (obj.sync) {
            this.addPluginFile(item.value, item.filePath, obj.value, false)
          } else {
            tasks.push(obj.value.then((res) => { this.addPluginFile(item.value, item.filePath, res, false) }))
          }
        } else if (item.type === 'nako3') {
          // nako3ならファイルを読んでdependenciesに保存する。
          const content = tools.readNako3(item.filePath, item.firstToken)
          if (content.sync) {
            dependencies[item.filePath].content = content.value
          } else {
            tasks.push(content.value.then((res) => {
              dependencies[item.filePath].content = res
              return inner(res, item.filePath, '')
            }))
          }
        } else {
          throw new NakoImportError(`ファイル ${item.value} を読み込めません。未対応の拡張子です。`, item.firstToken.line, item.firstToken.file)
        }
      }

      if (tasks.length > 0) {
        return Promise.all(tasks)
      }
    }

    const result = inner(code, filename, preCode)

    // すべてが終わってからthis.dependenciesに代入する。そうしないと、「実行」ボタンを連打した場合など、
    // loadDependencies() が並列実行されるときに正しく動作しない。
    this.dependencies = dependencies
    return result
  }

  /**
   * コードを単語に分割する
   * @param {string} code なでしこのプログラム
   * @param {number} line なでしこのプログラムの行番号
   * @param {string} filename
   * @param {string} [preCode]
   * @returns {TokenWithSourceMap[]} トークンのリスト
   * @throws {LexErrorWithSourceMap}
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
      if (!(err instanceof LexError)) {
        throw err
      }

      // エラー位置をソースコード上の位置に変換して返す
      const dest = indentationSyntaxSourceMapping.map(tokenizationSourceMapping.map(err.preprocessedCodeStartOffset), tokenizationSourceMapping.map(err.preprocessedCodeEndOffset))
      /** @type {number | undefined} */
      const line = dest.startOffset === null ? err.line : offsetToLineColumn.map(dest.startOffset, false).line
      const map = subtractSourceMapByPreCodeLength({ ...dest, line }, preCode)
      throw new LexErrorWithSourceMap(err.msg, err.preprocessedCodeStartOffset, err.preprocessedCodeEndOffset, map.startOffset, map.endOffset, map.line, filename)
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
   * デバッグモードに設定する
   * @param flag デバッグモード
   */
  useDebug (flag = true) {
    this.debug = flag
  }

  /**
   * 環境のリセット
   */
  reset (leaveDependencies = false) {
    // スタックのグローバル変数とローカル変数を初期化
    this.__varslist = [this.__varslist[0], {}, {}]
    this.__v0 = this.__varslist[0]
    this.__v1 = this.__varslist[1]
    this.__vars = this.__varslist[2]
    this.__locals = {}
    this.gen.reset()
    this.lexer.setFuncList(this.funclist)

    if (!leaveDependencies) {
      // ユーザー定義の関数の削除と、プラグイン変数の値の初期化を行う。
      // 実行前に行うとloadDependenciesで読み込んだ依存まで消されてしまうことに注意
      this.funclist = {}
      for (const name of Object.keys(this.__v0)) {
        const original = this.pluginFunclist[name]
        if (!original) {
          continue
        }

        // プラグイン命令以外を削除
        this.funclist[name] = JSON.parse(JSON.stringify(original))

        // プラグイン変数の値を初期化
        if (original.type === 'var') {
          this.__v0[name] = original.value
        }
      }
    }
  }

  /**
   * コードを生成
   * @param {Ast} ast AST
   * @param {boolean} isTest テストかどうか
   */
  generate(ast, isTest) {
    // 先になでしこ自身で定義したユーザー関数をシステムに登録
    this.gen.registerFunction(ast)
    // JSコードを生成する
    let js = this.gen.convGen(ast, isTest)
    // JSコードを実行するための事前ヘッダ部分の生成
    js = this.gen.getDefFuncCode(isTest) + js
    if (this.debug && this.debugJSCode) {
      console.log('--- generate ---')
      console.log(js)
    }
    return js
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
  replaceRequireStatements(tokens, ignoreRequireStatements = false, includeGuard = new Set()) {
    /** @type {TokenWithSourceMap[]} */
    const deletedTokens = []
    for (const r of NakoCompiler.listRequireStatements(tokens).reverse()) {
      // C言語のinclude guardと同じ仕組みで無限ループを防ぐ。
      if (includeGuard.has(r.value) || ignoreRequireStatements) {
        deletedTokens.push(...tokens.splice(r.start, r.end - r.start))
        continue
      }
      const filePath = Object.keys(this.dependencies).find((key) => this.dependencies[key].alias.has(r.value))
      if (filePath === undefined) {
        throw new LexErrorWithSourceMap(`ファイル ${r.value} が読み込まれていません。`, 0, 1, r.firstToken.startOffset, r.firstToken.endOffset, r.firstToken.line, r.firstToken.file)
      }
      const children = this.rawtokenize(this.dependencies[filePath].content, 0, filePath)
      includeGuard.add(r.value)
      deletedTokens.push(...this.replaceRequireStatements(children, ignoreRequireStatements, includeGuard))
      deletedTokens.push(...tokens.splice(r.start, r.end - r.start, ...children))
    }
    return deletedTokens
  }

  /**
   * @param {string} code
   * @param {string} filename
   * @param {string} [preCode]
   * @returns {{ commentTokens: TokenWithSourceMap[], tokens: TokenWithSourceMap[], requireTokens: TokenWithSourceMap[] }}
   */
  lex(code, filename, preCode = '', ignoreRequireStatements = false) {
    // 単語に分割
    let tokens = this.rawtokenize(code, 0, filename, preCode)

    // require文を再帰的に置換する
    const requireStatementTokens = this.replaceRequireStatements(tokens, ignoreRequireStatements, undefined)
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

    if (this.debug && this.debugLexer) {
      console.log('--- lex ---')
      console.log(JSON.stringify(tokens, null, 2))
    }

    return { commentTokens, tokens, requireTokens: requireStatementTokens }
  }

  /**
   * コードをパースしてASTにする
   * @param {string} code なでしこのプログラム
   * @param {string} filename
   * @param {string} [preCode]
   * @return {Ast}
   * @throws {LexErrorWithSourceMap | NakoSyntaxError}
   */
  parse (code, filename, preCode = '') {
    // 関数を字句解析と構文解析に登録
    lexer.setFuncList(this.funclist)
    parser.setFuncList(this.funclist)
    parser.debug = this.debug
    this.parser.filename = filename

    const lexerOutput = this.lex(code, filename, preCode)

    // 構文木を作成
    /** @type {Ast} */
    let ast
    try {
      ast = parser.parse(lexerOutput.tokens)
    } catch (err) {
      if (typeof err.startOffset !== 'number') {
        throw NakoSyntaxError.fromNode(err.message, lexerOutput.tokens[parser.index])
      }
      throw err
    }
    this.usedFuncs = this.getUsedFuncs(ast)
    if (this.debug && this.debugParser) {
      console.log('--- ast ---')
      console.log(JSON.stringify(ast, null, 2))
    }
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
   * @param {boolean} isTest テストかどうか
   * @param {string} [preCode]
   * @returns コード (JavaScript)
   */
  compile(code, filename, isTest, preCode = '') {
    const ast = this.parse(code, filename, preCode)
    return this.generate(ast, isTest)
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {boolean} isReset
   * @param {boolean} isTest
   * @param {string} [preCode]
   */
  _run(code, fname, isReset, isTest, preCode = '') {
    const opts = {
      resetLog: isReset,
      testOnly: isTest
    }
    return this._runEx(code, fname, opts, preCode)
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {Partial<CompilerOptions>} opts
   * @param {string} [preCode]
   */
  _runEx(code, fname, opts, preCode = '') {
    const optsAll = Object.assign({ resetEnv: true, resetLog: true, testOnly: false }, opts)
    if (optsAll.resetEnv) {this.reset(true)}
    if (optsAll.resetLog) {this.clearLog()}
    let js = this.compile(code, fname, optsAll.testOnly, preCode)
    try {
      try {
        this.__varslist[0].line = -1 // コンパイルエラーを調べるため
        const func = new Function(js) // eslint-disable-line
        func.apply(this)
      } catch (e) {
        this.js = js
        if (e instanceof NakoRuntimeError) {
          throw e
        } else {
          throw new NakoRuntimeError(
            e,
            this.__v0 ? this.__v0.line : undefined,
          )
        }
      }
    } finally {
      if (optsAll.resetEnv) {
        this.reset(false)
      }
    }
    return this
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
   */
  test(code, fname, preCode = '') {
    return this._runEx(code, fname, { testOnly: true }, preCode)
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   */
  run(code, fname, preCode = '') {
    return this._runEx(code, fname, { resetLog: false }, preCode)
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   */
  runReset (code, fname, preCode = '') {
    return this._runEx(code, fname, { resetLog: true }, preCode)
  }

  clearLog () {
    this.__varslist[0]['表示ログ'] = ''
  }

  /**
   * eval()実行前に直接JSのオブジェクトを取得する場合
   * @returns {[*,*,*]}
   */
  getVarsList () {
    const v = this.gen.getVarsList()
    return [v[0], v[1], []]
  }

  /**
   * 完全にJSのコードを取得する場合
   * @returns {string}
   */
  getVarsCode () {
    return this.gen.getVarsCode()
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
        __v0[key] = (...args) => {
          try {
            return v.fn(...args)
          } catch (e) {
            throw new NakoRuntimeError(
              e,
              this.__v0 ? this.__v0.line : undefined,
              `関数『${key}』`,
            )
          }
        }
      } else if (v.type === 'const' || v.type === 'var') {
        __v0[key] = v.value
        __v0.meta[key] = {
          readonly: (v.type === 'const')
        }
      } else {
        throw new Error('プラグインの追加でエラー。')
      }
      if (key !== '初期化') {
        this.commandlist.add(key)
      }
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
      this.gen.used_func[initkey] = true
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
   * @param key 関数名
   * @param josi 助詞
   * @param fn 関数
   */
  addFunc (key, josi, fn) {
    this.funclist[key] = {'josi': josi, 'fn': fn, 'type': 'func'}
    this.pluginFunclist[key] = JSON.parse(JSON.stringify(this.funclist[key]))
    this.__varslist[0][key] = fn
  }

  /**
   * 関数をセットする
   * @param key 関数名
   * @param josi 助詞
   * @param fn 関数
   */
  setFunc (key, josi, fn) {
    this.addFunc(key, josi, fn)
  }

  /**
   * プラグイン関数を参照する
   * @param key プラグイン関数の関数名
   * @returns プラグイン・オブジェクト
   */
  getFunc (key) {
    return this.funclist[key]
  }
}

module.exports = NakoCompiler
