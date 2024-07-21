import { NakoLogger } from './nako_logger.mjs'
import { FuncList, FuncListItem, Token, Ast, SourceMap, NewEmptyToken, ExportMap } from './nako_types.mjs'

/**
 * なでしこの構文解析のためのユーティリティクラス
 */
export class NakoParserBase {
  public logger: NakoLogger
  protected stackList: any[]
  protected tokens: Token[]
  protected stack: any[]
  protected index: number
  protected y: any[]
  public modName: string
  public namespaceStack: string[]
  public modList: string[]
  public funclist: FuncList
  public usedFuncs: Set<string>
  public moduleExport: ExportMap
  protected funcLevel: number
  protected usedAsyncFn: boolean
  protected localvars: FuncList
  public genMode: string
  protected arrayIndexFrom: number
  protected flagReverseArrayIndex: boolean
  protected flagCheckArrayInit: boolean
  protected recentlyCalledFunc: FuncListItem[]
  protected isReadingCalc: boolean
  protected isExportDefault: boolean
  protected isExportStack: boolean[]

  constructor (logger: NakoLogger) {
    this.logger = logger
    this.stackList = [] // 関数定義の際にスタックが混乱しないように整理する
    this.tokens = []
    this.usedFuncs = new Set()
    /** @type {import('./nako3.mjs').Ast[]} */
    this.stack = []
    this.index = 0
    /** トークン出現チェック(accept関数)に利用する
     * @type {import('./nako3.mjs').Ast[]}
     */
    this.y = []
    /** モジュル名 @type {string} */
    this.modName = 'inline'
    this.namespaceStack = []
    /**
     * 利用するモジュールの名前一覧
     * @type {Array<string>}
     */
    this.modList = []
    /** グローバル変数・関数の確認用 */
    this.funclist = new Map()
    this.funcLevel = 0
    this.usedAsyncFn = false // asyncFnの呼び出しがあるかどうか
    /**
     * ローカル変数の確認用
     * @type {Object.<string,Object>}
     */
    this.localvars = new Map([['それ', { type: 'var', value: '' }]])
    /** コード生成器の名前 @type {string} */
    this.genMode = 'sync' // #637
    /** 配列のインデックスが先頭要素(#1140) @type {int} */
    this.arrayIndexFrom = 0
    /** 配列のインデックス順序を反対にするか(#1140) @type {boolean} */
    this.flagReverseArrayIndex = false
    /** 配列を自動的に初期化するか(#1140) @type {boolean} */
    this.flagCheckArrayInit = false
    /** 最近呼び出した関数(余剰エラーの報告に使う) */
    this.recentlyCalledFunc = []
    // 構文解析に利用する - 現在計算式を読んでいるかどうか
    this.isReadingCalc = false
    // エクスポート設定が未設定の関数・変数に対する既定値
    this.isExportDefault = true
    this.isExportStack = []
    this.moduleExport = new Map()

    this.init()
  }

  init () {
    this.funclist = new Map() // 関数の一覧
    this.moduleExport = new Map()
    this.reset()
  }

  reset () {
    this.tokens = [] // 字句解析済みのトークンの一覧を保存
    this.index = 0 // tokens[] のどこまで読んだかを管理する
    this.stack = [] // 計算用のスタック ... 直接は操作せず、pushStack() popStack() を介して使う
    this.y = [] // accept()で解析済みのトークンを配列で得るときに使う
    this.genMode = 'sync' // #637, #1056
  }

  setFuncList (funclist: FuncList) {
    this.funclist = funclist
  }

  setModuleExport (moduleexport: ExportMap) {
    this.moduleExport = moduleexport
  }

  /**
   * 特定の助詞を持つ要素をスタックから一つ下ろす、指定がなければ末尾を下ろす
   * @param {string[]} josiList 下ろしたい助詞の配列
   */
  popStack (josiList: string[]|undefined = undefined): Ast | null {
    if (!josiList) {
      const t = this.stack.pop()
      if (t) { return t }
      return null
    }

    // josiList にマッチする助詞を探す
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const t = this.stack[i]
      if (josiList.length === 0 || josiList.indexOf(t.josi) >= 0) {
        this.stack.splice(i, 1) // remove stack
        this.logger.trace('POP :' + JSON.stringify(t))
        return t
      }
    }
    // 該当する助詞が見つからなかった場合
    return null
  }

  /**
   * saveStack と loadStack は対で使う。
   * 関数定義などでスタックが混乱しないように配慮するためのもの
   */
  saveStack () {
    this.stackList.push(this.stack)
    this.stack = []
  }

  loadStack () {
    this.stack = this.stackList.pop()
  }

  /** 変数名を探す
   * @param {string} name
   * @returns {any}変数名の情報
   */
  findVar (name: string): any {
    // ローカル変数？
    if (this.localvars.get(name)) {
      return {
        name,
        scope: 'local',
        info: this.localvars.get(name)
      }
    }
    // モジュール名を含んでいる?
    if (name.indexOf('__') >= 0) {
      if (this.funclist.get(name)) {
        return {
          name,
          scope: 'global',
          info: this.funclist.get(name)
        }
      } else { return undefined }
    }
    // グローバル変数（自身）？
    const gnameSelf = `${this.modName}__${name}`
    if (this.funclist.get(gnameSelf)) {
      return {
        name: gnameSelf,
        scope: 'global',
        info: this.funclist.get(gnameSelf)
      }
    }
    // グローバル変数（モジュールを検索）？
    for (const mod of this.modList) {
      const gname = `${mod}__${name}`
      const exportDefault = this.moduleExport.get(mod)
      const funcObj: FuncListItem|undefined = this.funclist.get(gname)
      if (funcObj && (funcObj.isExport === true || (funcObj.isExport !== false && exportDefault !== false))) {
        return {
          name: gname,
          scope: 'global',
          info: this.funclist.get(gname)
        }
      }
    }
    // システム変数 (funclistを普通に検索)
    if (this.funclist.get(name)) {
      return {
        name,
        scope: 'system',
        info: this.funclist.get(name)
      }
    }
    return undefined
  }

  /**
   * 計算用に要素をスタックに積む
   */
  pushStack (item: any) {
    this.logger.trace('PUSH:' + JSON.stringify(item))
    this.stack.push(item)
  }

  /**
   * トークンの末尾に達したか
   */
  isEOF (): boolean {
    return (this.index >= this.tokens.length)
  }

  getIndex (): number {
    return this.index
  }

  /**
   * カーソル位置にある単語の型を確かめる
   */
  check (ttype: string): boolean {
    return (this.tokens[this.index].type === ttype)
  }

  /**
   * カーソル位置以降にある単語の型を確かめる 2単語以上に対応
   * @param a [単語1の型, 単語2の型, ... ]
   */
  check2 (a: any[]): boolean {
    for (let i = 0; i < a.length; i++) {
      const idx = i + this.index
      if (this.tokens.length <= idx) { return false }
      if (a[i] === '*') { continue } // ワイルドカード(どんなタイプも許容)
      const t = this.tokens[idx]
      if (a[i] instanceof Array) {
        if (a[i].indexOf(t.type) < 0) { return false }
        continue
      }
      if (t.type !== a[i]) { return false }
    }
    return true
  }

  /**
   * カーソル位置の型を確認するが、複数の種類を確かめられる
   */
  checkTypes (a: string[]): boolean {
    const type = this.tokens[this.index].type
    return (a.indexOf(type) >= 0)
  }

  /**
   * check2の高度なやつ、型名の他にコールバック関数を指定できる
   * 型にマッチしなければ false を返し、カーソルを巻き戻す
   */
  accept (types: any[]): boolean {
    const y = []
    const tmpIndex = this.index
    const rollback = () => {
      this.index = tmpIndex
      return false
    }
    for (let i = 0; i < types.length; i++) {
      if (this.isEOF()) { return rollback() }
      const type = types[i]
      if (type == null) { return rollback() }
      if (typeof type === 'string') {
        const token = this.get()
        if (token && token.type !== type) { return rollback() }
        y[i] = token
        continue
      }
      if (typeof type === 'function') {
        const f = type.bind(this)
        const r: any = f(y)
        if (r === null) { return rollback() }
        y[i] = r
        continue
      }
      if (type instanceof Array) {
        if (!this.checkTypes(type)) { return rollback() }
        y[i] = this.get()
        continue
      }
      throw new Error('System Error : accept broken : ' + typeof type)
    }
    this.y = y
    return true
  }

  /**
   * カーソル語句を取得して、カーソルを後ろに移動する
   */
  get (): Token | null {
    if (this.isEOF()) { return null }
    return this.tokens[this.index++]
  }

  /** カーソル語句を取得してカーソルを進める、取得できなければエラーを出す */
  getCur (): Token {
    if (this.isEOF()) { throw new Error('トークンが取得できません。') }
    const t = this.tokens[this.index++]
    if (!t) { throw new Error('トークンが取得できません。') }
    return t
  }

  unget () {
    if (this.index > 0) { this.index-- }
  }

  /** 解析中のトークンを返す */
  peek (i = 0): Token|null {
    if (this.isEOF()) { return null }
    return this.tokens[this.index + i]
  }

  /** 解析中のトークンを返す、無理なら def を返す */
  peekDef (def: Token|null = null): Token {
    if (this.isEOF()) {
      if (!def) { def = NewEmptyToken() }
      return def
    }
    return this.tokens[this.index]
  }

  /**
   * 現在のカーソル語句のソースコード上の位置を取得する。
   */
  peekSourceMap (): SourceMap {
    const token = this.peek()
    if (token === null) {
      return { startOffset: undefined, endOffset: undefined, file: undefined, line: 0, column: 0 }
    }
    return { startOffset: token.startOffset, endOffset: token.endOffset, file: token.file, line: token.line, column: token.column }
  }

  /**
   * depth: 表示する深さ
   * typeName: 先頭のtypeの表示を上書きする場合に設定する
   * @param {{ depth: number, typeName?: string }} opts
   * @param {boolean} debugMode
   */
  nodeToStr (node: Ast|Token|null, opts: {depth: number, typeName?: string}, debugMode: boolean): string {
    const depth = opts.depth - 1
    const typeName = (name: string) => (opts.typeName !== undefined) ? opts.typeName : name
    const debug = debugMode ? (' debug: ' + JSON.stringify(node, null, 2)) : ''
    if (!node) { return '(NULL)' }
    switch (node.type) {
      case 'not':
        if (depth >= 0) {
          const subNode: Ast = node.value as Ast
          return `${typeName('')}『${this.nodeToStr(subNode, { depth }, debugMode)}に演算子『not』を適用した式${debug}』`
        } else {
          return `${typeName('演算子')}『not』`
        }
      case 'op': {
        const node2: Ast = node as Ast
        let operator: string = node2.operator || ''
        const table:{[key: string]: string} = { eq: '＝', not: '!', gt: '>', lt: '<', and: 'かつ', or: 'または' }
        if (operator in table) {
          operator = table[operator]
        }
        if (depth >= 0) {
          const left: string = this.nodeToStr(node2.left as Ast, { depth }, debugMode)
          const right: string = this.nodeToStr(node2.right as Ast, { depth }, debugMode)
          if (node2.operator === 'eq') {
            return `${typeName('')}『${left}と${right}が等しいかどうかの比較${debug}』`
          }
          return `${typeName('')}『${left}と${right}に演算子『${operator}』を適用した式${debug}』`
        } else {
          return `${typeName('演算子')}『${operator}${debug}』`
        }
      }
      case 'number':
        return `${typeName('数値')}${node.value}`
      case 'bigint':
        return `${typeName('巨大整数')}${node.value}`
      case 'string':
        return `${typeName('文字列')}『${node.value}${debug}』`
      case 'word':
        return `${typeName('単語')}『${node.value}${debug}』`
      case 'func':
        return `${typeName('関数')}『${node.name || node.value}${debug}』`
      case 'eol':
        return '行の末尾'
      case 'eof':
        return 'ファイルの末尾'
      default: {
        let name:any = node.name
        if (name) { name = node.value }
        if (typeof name !== 'string') { name = node.type }
        return `${typeName('')}『${name}${debug}』`
      }
    }
  }
}
