/**
 * コマンドライン版のなでしこ3をモジュールとして定義
 * 実際には cnako3.js から読み込まれる
 */
import fs from 'fs'
import { exec } from 'child_process'
import path, { resolve } from 'path'
import { NakoCompiler } from './nako3.mjs'
import PluginNode from './plugin_node.mjs'
import { NakoImportError } from './nako_errors.mjs'
import app from './commander_ja.mjs'
import nakoVersion from './nako_version.mjs'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CNako3 extends NakoCompiler {
  /** @param {{ nostd?: boolean }} [opts] */
  constructor (opts = {}) {
    super({ useBasicPlugin: true })
    this.silent = false
    if (!opts.nostd) {
      this.addPluginFile('PluginNode', path.join(__dirname, 'plugin_node.mjs'), PluginNode)
    }
    this.__varslist[0]['ナデシコ種類'] = 'cnako3'
  }

  // CNAKO3で使えるコマンドを登録する
  registerCommands () {
    // コマンド引数がないならば、ヘルプを表示(-hはcommandarにデフォルト用意されている)
    if (process.argv.length <= 2) { process.argv.push('-h') }

    // commanderを使って引数を解析する
    app
      .title('日本語プログラミング言語「なでしこ」v' + nakoVersion.version)
      .version(nakoVersion.version, '-v, --version')
      .usage('[オプション] 入力ファイル.nako3')
      .option('-h, --help', 'コマンドの使い方を表示')
      .option('-w, --warn', '警告を表示する')
      .option('-d, --debug', 'デバッグモードの指定')
      .option('-D, --trace', '詳細デバッグモードの指定')
      .option('-c, --compile', 'コンパイルモードの指定')
      .option('-t, --test', 'コンパイルモードの指定 (テスト用コードを出力)')
      .option('-r, --run', 'コンパイルモードでも実行する')
      .option('-e, --eval [src]', '直接プログラムを実行するワンライナーモード')
      .option('-o, --output', '出力ファイル名の指定')
      .option('-s, --silent', 'サイレントモードの指定')
      .option('-l, --repl', '対話シェル(REPL)の実行')
      .option('-b, --browsers', '対応機器/Webブラウザを表示する')
      .option('-m, --man [command]', 'マニュアルを表示する')
      .option('-p, --speed', 'スピード優先モードの指定')
      .option('-A, --ast', 'パースした結果をASTで出力する')
      // .option('-h, --help', '使い方を表示する')
      // .option('-v, --version', 'バージョンを表示する')
      .parse(process.argv)
    return app
  }

  /**
   * コマンドライン引数を解析
   * @returns {{
   *  warn: boolean, 
   *  debug: boolean, 
   *  compile: any | boolean, 
   *  test: any | boolean, 
   *  one_liner: any | boolean, 
   *  trace: any | boolean, 
   *  run: any | boolean, 
   *  repl: any | boolean, 
   *  source: any | string,
   *  mainfile: any | string,
   * }}
   */
  checkArguments () {
    const app = this.registerCommands()

    /** @type {import('./nako_logger.mjs').LogLevel} */
    let logLevel = 'error'
    if (app.trace) {
      logLevel = 'trace'
    } else if (app.debug) {
      logLevel = 'debug'
    } else if (app.warn) {
      logLevel = 'warn'
    }
    this.logger.addListener(logLevel, ({ level, nodeConsole }) => {
      if (this.silent && level === 'stdout') {
        return
      }
      console.log(nodeConsole)
    })

    const args = {
      compile: app.compile || false,
      run: app.run || false,
      source: app.eval || '',
      man: app.man || '',
      one_liner: app.eval || false,
      debug: this.debug || false,
      trace: app.trace,
      warn: app.warn,
      repl: app.repl || false,
      test: app.test || false,
      browsers: app.browsers || false,
      speed: app.speed || false,
      ast: app.ast || false
    }
    args.mainfile = app.args[0]
    args.output = app.output
    
    // todo: ESModule 対応の '.mjs' のコードを履く #1217
    const ext = '.js'
    if (/\.(nako|nako3|txt|bak)$/.test(args.mainfile)) {
      if (!args.output) {
        if (args.test) {
          args.output = args.mainfile.replace(/\.(nako|nako3)$/, '.spec' + ext)
        } else {
          args.output = args.mainfile.replace(/\.(nako|nako3)$/, ext)
        }
      }
    } else {
      if (!args.output) {
        if (args.test) {
          args.output = args.mainfile + '.spec' + ext
        } else {
          args.output = args.mainfile + ext
        }
      }
      args.mainfile += '.nako3'
    }
    return args
  }

  // 実行する
  async execCommand () {
    // コマンドを解析
    const opt = this.checkArguments()
    // 使い方の表示か？
    if (opt.man) {
      this.cnakoMan(opt.man)
      return
    }
    // 対応ブラウザを表示する
    if (opt.browsers) {
      this.cnakoBrowsers()
      return
    }
    if (opt.mainfile) { this.filename = opt.mainfile }
    // REPLを実行する
    if (opt.repl) {
      this.cnakoRepl(opt)
      return
    }
    // ワンライナーで実行する
    if (opt.one_liner) {
      this.cnakoOneLiner(opt)
      return
    }

    // メインプログラムを読み込む
    const src = fs.readFileSync(opt.mainfile, 'utf-8')
    if (opt.compile) {
      await this.nakoCompile(opt, src, false)
      return
    }
    
    // ASTを出力する
    if (opt.ast) {
      try {
        await this.loadDependencies(src, opt.mainfile, '')
      } catch (e) {
        if (this.numFailures > 0) { process.exit(1) }
      }
      this.outputAST(opt, src)
      return
    }

    // テストを実行する
    if (opt.test) {
      try {
        await this.loadDependencies(src, opt.mainfile, '')
        this.test(src, opt.mainfile)
        return
      } catch (e) {
        process.exit(1)
      }
    }

    // ファイルを読んで実行する
    try {
      await this.run(src, opt.mainfile) // run はコンパイルと実行を行うメソッド
      if (this.numFailures > 0) { process.exit(1) }
    } catch (e) {
      // エラーメッセージはloggerへ送られるため無視してよい
      if (opt.debug || opt.trace) {
        throw e
      }
    }
  }

  /**
   * コンパイルモードの場合
   * @param opt
   * @param {string} src
   * @param {boolean} isTest
   */
  async nakoCompile (opt, src, isTest) {
    // 依存ライブラリなどを読み込む
    await this.loadDependencies(src, this.filename, '')
    // JSにコンパイル
    const jscode = this.compileStandalone(src, this.filename, isTest)
    console.log(opt.output)
    fs.writeFileSync(opt.output, jscode, 'utf-8')
    
    /*
    // 実行に必要なファイルをコピー
    const nakoRuntime = __dirname
    const outRuntime = path.join(path.dirname(opt.output), 'nako3runtime')
    if (!fs.existsSync(outRuntime)) { fs.mkdirSync(outRuntime) }
    for (let mod of ['nako_version.mjs', 'nako_errors.mjs', 'plugin_node.mjs']) {
      fs.copyFileSync(path.join(nakoRuntime, mod), path.join(outRuntime, mod))
    }
    // todo: 必要に応じてnode_modulesをコピー (時間が掛かりすぎるのでコピーしない)
    const dstModule = path.join(path.dirname(opt.output), 'node_modules')
    const orgModule = path.join(__dirname, '..', 'node_modules')
    if (!fs.existsSync(dstModule)) { 
      fs.mkdirSync(dstModule)
      fse.copySync(path.join(orgModule), path.join(dstModule))
    }
    // or 以下のコピーだと依存ファイルがコピーされない package.jsonを見てコピーする必要がある
    for (let mod of ['fs-extra', 'iconv-lite', 'opener', 'clipboardy', 'sendkeys-js']) {
      fse.copySync(path.join(orgModule, mod), path.join(dstModule, mod))
    }
    */
    
    if (opt.run) {
      exec(`node ${opt.output}`, function (err, stdout, stderr) {
        if (err) { console.log('[ERROR]', stderr) }
        console.log(stdout)
      })
    }
  }

  // ワンライナーの場合
  cnakoOneLiner (opt) {
    const org = opt.source
    try {
      if (opt.source.indexOf('表示') < 0) {
        opt.source = '' + opt.source + 'を表示。'
      }
      this.run(opt.source)
    } catch (e) {
      // エラーになったら元のワンライナーで再挑戦
      try {
        if (opt.source !== org) {
          this.run(org)
        } else {
          throw e
        }
      } catch (e) {
        if (this.debug) {
          throw e
        } else {
          console.error(e.message)
        }
      }
    }
  }

  /**
   * ASTを出力
   * @param opt
   * @param {string} src
   * @param {boolean} isTest
   */
  outputAST (opt, src) {
    const ast = this.parse(src, opt.mainfile)
    const makeIndent = (level) => {
      let s = ''
      for (let i = 0; i < level; i++) { s += '  ' }
      return s
    }
    const trim = (s) => { return s.replace(/(^\s+|\s+$)/g, '') }
    /**
     * AST文字列に変換して返す
     * @param {*} ast
     * @param {number} level
     * @return {string}
     */
    const outAST = (ast, level) => {
      if (typeof (ast) === 'string') {
        return makeIndent(level) + '"' + ast + '"'
      }
      if (typeof (ast) === 'number') {
        return makeIndent(level) + ast
      }
      if (ast instanceof Array) {
        const s = makeIndent(level) + '[\n'
        const sa = []
        ast.forEach((a) => {
          sa.push(outAST(a, level + 1))
        })
        return s + sa.join(',\n') + '\n' + makeIndent(level) + ']'
      }
      if (ast instanceof Object) {
        const s = makeIndent(level) + '{\n'
        const sa = []
        for (const key in ast) {
          const sv = trim(outAST(ast[key], level + 1))
          const so = makeIndent(level + 1) + '"' + key + '": ' + sv
          sa.push(so)
        }
        return s + sa.join(',\n') + '\n' + makeIndent(level) + '}'
      }
      return makeIndent(level) + ast
    }
    console.log(outAST(ast, 0))
  }

  // REPL(対話実行環境)の場合
  cnakoRepl (opt) {
    const fname = path.join(__dirname, 'repl.nako3')
    const src = fs.readFileSync(fname, 'utf-8')
    this.run(src, true)
  }

  // マニュアルを表示する
  cnakoMan (command) {
    try {
      const path_commands = path.join(__dirname, '../release/command_cnako3.json')
      const commands = JSON.parse(fs.readFileSync(path_commands, 'utf-8'))
      const data = commands[command]
      for (const key in data) {
        console.log(`${key}: ${data[key]}`)
      }
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        console.log('コマンド一覧がないため、マニュアルを表示できません。以下のコマンドでコマンド一覧を生成してください。\n$ npm run build')
      } else {
        throw e
      }
    }
  }

  // 対応機器/Webブラウザを表示する
  cnakoBrowsers () {
    const fileMD = path.resolve(__dirname, '../doc', 'browsers.md')
    console.log(fs.readFileSync(fileMD, 'utf-8'))
  }

  // (js|nako3) loader
  getLoaderTools() {
    /** @type {string[]} */
    const log = []
    const tools = {}
    tools.resolvePath = (name, token, fromFile) => {
      // JSプラグインのパスを解決する
      if (/\.(js|mjs)(\.txt)?$/.test(name) || /^[^.]*$/.test(name)) {
        const jspath = CNako3.findJSPluginFile(name, this.filename, __dirname, log)
        if (jspath === '') {
          throw new NakoImportError(`ファイル『${name}』が見つかりません。以下のパスを検索しました。\n${log.join('\n')}`, token.file, token.line)
        }
        return { filePath: jspath, type: 'js' }
      }
      // なでしこプラグインのパスを解決する
      if (/\.nako3?(\.txt)?$/.test(name)) {
        if (path.isAbsolute(name)) {
          return { filePath: path.resolve(name), type: 'nako3' }
        } else {
          // filename が undefined のとき token.file が undefined になる。
          if (token.file === undefined) { throw new Error('ファイル名を指定してください。') }
          const dir = path.dirname(fromFile)
          return { filePath: path.resolve(path.join(dir, name)), type: 'nako3' }
        }
      }
      return { filePath: name, type: 'invalid' }
    }
    tools.readNako3 = (name, token) => {
      // ファイルチェックだけ先に実行
      if (!fs.existsSync(name)) {
        throw new NakoImportError(`ファイル ${name} が存在しません。`, token.file, token.line)
      }
      // 非同期で読み込む
      const loader = {task: null}
      loader.task = (new Promise((resolve, reject) => {
        fs.readFile(name, {encoding: 'utf-8'}, (err, data) => {
          if (err) { return reject(err) }
          resolve(data)
        })
      }))
      return loader
    }
    tools.readJs = (filePath, token) => {
      const loader = {task: null}
      if (process.platform === 'win32') {
        if (filePath.substring(1, 3) === ':\\') {
          filePath = 'file://' + filePath
        }
      }
      loader.task = (
        new Promise((resolve, reject) => {
          import(filePath).then((mod) => {
            // プラグインは export default で宣言されている? (moduleプラグインの場合)
            const obj = Object.assign({}, mod)
            resolve(() => { return obj.default })
          }).catch((err) => {
            const err2 = new NakoImportError(`ファイル『${filePath}』が読み込めません。${err}`, token.file, token.line)
            reject(err2)
          })
        })
      )
      return loader
    }
    return tools
  }

  /**
   * @param {string} code
   * @param {string} filename
   * @param {string} preCode
   * @returns {Promise<void>}
   */
  async loadDependencies (code, filename, preCode) {
    const tools = this.getLoaderTools()
    await super._loadDependencies(code, filename, preCode, tools)
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   * @returns {Promise<nakoGlobal>}
   */
  async run (code, fname, preCode = '') {
    // 取り込む文の処理
    try {
      await this.loadDependencies(code, fname, preCode)
    } catch(err) {
      this.logger.error(err)
    }
    // 実行
    return this._runEx(code, fname, {}, preCode)
  }

  /**
   * プラグインファイルの検索を行う
   * @param {string} pname プラグインの名前
   * @param {string} filename 取り込み元ファイル名
   * @param {string} srcDir このファイルが存在するディレクトリ
   * @param {string[]} [log]
   * @return {string} フルパス、失敗した時は、''を返す
   */
  static findJSPluginFile (pname, filename, srcDir, log = []) {
    log.length = 0
    const cachePath = {}
    /** @type {string[]} */
    const exists = (f, _desc) => {
      // 同じパスを何度も検索することがないように
      if (cachePath[f]) { return false }
      cachePath[f] = true
      log.push(f)
      const stat = fs.statSync(f, {throwIfNoEntry: false})
      if (!stat) { return false }
      return stat.isFile()
    }
    // 普通にファイルをチェック
    const fCheck = (pathTest) => {
      // 素直に指定されたパスをチェック
      let fpath = path.join(pathTest, pname)
      if (exists(fpath, 'direct')) { return fpath }
      return false
    }
    // ファイル および node_modules 以下を調べる
    const fCheckEx = (pathTest) => {
      const defPath = fCheck(pathTest)
      if (defPath) { return defPath }
      const fpath = path.join(pathTest, 'node_modules', pname)
      const json = path.join(fpath, 'package.json')
      if (exists(json)) {
        // package.jsonを見つけたので、メインファイルを調べて取り込む (CommonJSモジュール対策)
        const json_txt = fs.readFileSync(json, 'utf-8')
        const obj = JSON.parse(json_txt)
        if (!obj['main']) { return false } 
        const mainFile = path.join(pathTest, 'node_modules', pname, obj['main'])
        return mainFile
      }
      return false
    }
    // 各パスを検索していく
    const p1 = pname.substring(0, 1)
    // フルパス指定か?
    if (p1 === '/' || pname.substring(1, 3).toLowerCase() === ':\\') {
      if (exists(pname)) { return pname }
      const fileFullpath = fCheckEx(pname)
      if (fileFullpath) { return fileFullpath }
      return '' // フルパスの場合別のフォルダは調べない
    }
    // 相対パスか?
    if (p1 === '.' || pname.indexOf('/') >= 0) {
      // 相対パス指定なので、なでしこのプログラムからの相対指定を調べる
      const pathRelative = path.resolve(path.dirname(filename))
      const fileRelative = fCheckEx(pathRelative)
      if (fileRelative) { return fileRelative }
      return '' // 相対パスの場合も別のフォルダは調べない
    }
    // plugin_xxx.mjs のようにファイル名のみが指定された場合のみ、いくつかのパスを調べる
    // 母艦パス(元ファイルと同じフォルダ)か?
    const pathScript = path.resolve(path.dirname(filename))
    const fileScript = fCheckEx(pathScript)
    if (fileScript) { return fileScript }

    // ランタイムパス/src
    const pathRuntimeSrc = path.resolve(srcDir) // cnako3mod.mjs は ランタイム/src に配置されていることが前提
    const fileRuntimeSrc = fCheck(pathRuntimeSrc)
    if (fileRuntimeSrc) { return fileRuntimeSrc }

    // ランタイムパス
    const pathRuntime = path.resolve(path.dirname(srcDir))
    const fileRuntime = fCheckEx(pathRuntime)
    if (fileRuntime) { return fileRuntime }

    // 環境変数 NAKO_HOMEか?
    if (process.env.NAKO_HOME) {
      const NAKO_HOME = path.resolve(process.env.NAKO_HOME)
      const fileHome = fCheckEx(NAKO_HOME)
      if (fileHome) { return fileHome }
      // NAKO_HOME/src ?
      const pathNakoHomeSrc = path.join(NAKO_HOME, 'src')
      const fileNakoHomeSrc = fCheck(pathNakoHomeSrc)
      if (fileNakoHomeSrc) { return fileNakoHomeSrc }
    }
    // 環境変数 NODE_PATH (global) 以下にあるか？
    if (process.env.NODE_PATH) {
      const pathNode = path.resolve(process.env.NODE_PATH)
      const fileNode = fCheckEx(pathNode)
      if (fileNode) { return fileNode }
    }
    // Nodeのパス検索には任せない(importで必ず失敗するので)
    return ''
  }
}
