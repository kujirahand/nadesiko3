/**
 * nadesiko v3
 */
const Parser = require('./nako_parser3')
const Lexer = require('./nako_lexer')
const Prepare = require('./nako_prepare')
const NakoGen = require('./nako_gen')
const NakoRuntimeError = require('./nako_runtime_error')
const PluginSystem = require('./plugin_system')

const prepare = new Prepare()
const parser = new Parser()
const lexer = new Lexer()

class NakoCompiler {
  constructor () {
    this.debug = false
    this.silent = true
    this.debugParser = false
    this.debugJSCode = true
    this.debugLexer = false
    this.filename = 'inline'
    // 環境のリセット
    this.__varslist = [{}, {}, {}] // このオブジェクトは変更しないこと (this.gen.__varslist と共有する)
    this.__self = this
    this.__vars = this.__varslist[2]
    this.__module = {} // requireなどで取り込んだモジュールの一覧
    this.funclist = {} // プラグインで定義された関数
    this.pluginfiles = {} // 取り込んだファイル一覧
    this.isSetter = false // 代入的関数呼び出しを管理(#290)
    // 必要なオブジェクトを覚えておく
    this.prepare = prepare
    this.lexer = lexer
    this.parser = parser
    // set this
    this.gen = new NakoGen(this)
    this.addPluginObject('PluginSystem', PluginSystem)
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
   * コードを単語に分割する
   * @param code なでしこのプログラム
   * @param isFirst 最初の呼び出しかどうか
   * @param line なでしこのプログラムの行番号
   * @returns コード (なでしこ)
   */
  tokenize (code, isFirst, line = 0) {
    const code2 = this.prepare.convert(code)
    return this.lexer.setInput(code2, isFirst, line)
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
  reset () {
    // スタックのグローバル変数とローカル変数を初期化
    this.__varslist = [this.__varslist[0], {}, {}]
    this.__vars = this.__varslist[2]
    this.gen.reset()
    this.clearLog()
  }

  /**
   * コードを生成
   * @param ast AST
   */
  generate (ast) {
    // 先になでしこ自身で定義したユーザー関数をシステムに登録
    this.gen.registerFunction(ast)
    // JSコードを生成する
    const js = this.gen.convGen(ast)
    // JSコードを実行するための事前ヘッダ部分の生成
    const def = this.gen.getDefFuncCode()
    if (this.debug && this.debugJSCode) {
      console.log('--- generate ---')
      console.log(def + js)
    }
    return def + js
  }

  /**
   * コードをパースしてASTにする
   * @param code なでしこのプログラム
   * @return AST
   */
  parse (code) {
    // 関数を字句解析と構文解析に登録
    lexer.setFuncList(this.funclist)
    parser.setFuncList(this.funclist)
    parser.debug = this.debug
    // 単語に分割
    const tokens = this.tokenize(code, true)
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i]['type'] === 'code') {
        tokens.splice(i, 1, ...this.tokenize(tokens[i]['value'], false, tokens[i]['line']))
        i--
      }
    }
    if (this.debug && this.debugLexer) {
      console.log('--- lex ---')
      console.log(JSON.stringify(tokens, null, 2))
    }
    // 構文木を作成
    const ast = parser.parse(tokens)
    if (this.debug && this.debugParser) {
      console.log('--- ast ---')
      console.log(JSON.stringify(ast, null, 2))
    }
    return ast
  }

  /**
   * プログラムをコンパイルしてJavaScriptのコードを返す
   * @param code コード (なでしこ)
   * @returns コード (JavaScript)
   */
  compile (code) {
    const ast = this.parse(code)
    const js = this.generate(ast)
    return js
  }

  _run (code, isReset) {
    if (isReset) this.reset()
    let js = this.compile(code)
    let __varslist = this.__varslist
    let __vars = this.__vars = this.__varslist[2] // eslint-disable-line
    let __self = this.__self // eslint-disable-line
    let __module = this.__module // eslint-disable-line
    try {
      __varslist[0].line = -1 // コンパイルエラーを調べるため
      eval(js) // eslint-disable-line
    } catch (e) {
      this.js = js
      throw new NakoRuntimeError(
        e.name + ':' +
        e.message, this)
    }
    return this
  }

  run (code) {
    return this._run(code, false)
  }

  runReset (code) {
    return this._run(code, true)
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
   */
  addPlugin (po) {
    // 変数のメタ情報を確認
    const __v0 = this.__varslist[0]
    if (__v0.meta === undefined) {
      __v0.meta = {}
    }
    // プラグインの値をオブジェクトにコピー
    for (const key in po) {
      const v = po[key]
      this.funclist[key] = v
      if (v.type === 'func') {
        __v0[key] = v.fn
      } else if (v.type === 'const' || v.type === 'var') {
        __v0[key] = v.value
        __v0.meta[key] = {
          readonly: (v.type === 'const')
        }
      } else {
        throw new Error('プラグインの追加でエラー。', null)
      }
    }
  }

  /**
   * プラグイン・オブジェクトを追加(ブラウザ向け)
   * @param objName オブジェクト名
   * @param po 関数リスト
   */
  addPluginObject (objName, po) {
    this.__module[objName] = po
    this.pluginfiles[objName] = '*'
    if (typeof (po['初期化']) === 'object') {
      const def = po['初期化']
      delete po['初期化']
      const initkey = `!${objName}:初期化`
      po[initkey] = def
      this.gen.used_func[initkey] = true
    }
    this.addPlugin(po)
  }

  /**
   * プラグイン・ファイルを追加(Node.js向け)
   * @param objName オブジェクト名
   * @param path ファイルパス
   * @param po 登録するオブジェクト
   */
  addPluginFile (objName, path, po) {
    this.addPluginObject(objName, po)
    if (this.pluginfiles[objName] === undefined) {
      this.pluginfiles[objName] = path
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
