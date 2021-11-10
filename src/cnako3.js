#!/usr/bin/env node
// @ts-nocheck
/**
 * コマンドライン版のなでしこ3
 */
const fetch = require('node-fetch')
if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch
} else
if (typeof global !== 'undefined' && typeof global.fetch === 'undefined') {
  global.fetch = fetch
}

const fs = require('fs')
const exec = require('child_process').exec

const path = require('path')
const NakoCompiler = require('./nako3')
const PluginNode = require('./plugin_node')
const { NakoImportError } = require('./nako_errors')
const NakoGenASync = require('./nako_gen_async')

class CNako3 extends NakoCompiler {
  /** @param {{ nostd?: boolean }} [opts] */
  constructor (opts = {}) {
    super({ useBasicPlugin: true })
    this.silent = false
    this.addCodeGenerator('非同期モード', NakoGenASync) // 「!非同期モード」をサポート
    if (!opts.nostd) {
      this.addPluginFile('PluginNode', path.join(__dirname, 'plugin_node.js'), PluginNode)
    }
    this.__varslist[0]['ナデシコ種類'] = 'cnako3'
  }

  // CNAKO3で使えるコマンドを登録する
  registerCommands () {
    // コマンド引数がないならば、ヘルプを表示(-hはcommandarにデフォルト用意されている)
    if (process.argv.length <= 2) { process.argv.push('-h') }

    // commanderを使って引数を解析する
    const app = require('./commander_ja.js')
    const nakoVersion = require('./nako_version.js')
    app
      .title('日本語プログラミング言語「なでしこ」v' + nakoVersion.version)
      .version(nakoVersion.version, '-v, --version')
      .usage('[オプション] 入力ファイル.nako3')
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
   * @returns {{warn: boolean, debug: boolean, compile: any | boolean, test: any | boolean, one_liner: any | boolean, trace: any, run: any | boolean, repl: any | boolean, source: any | string}}
   */
  checkArguments () {
    const app = this.registerCommands()

    /** @type {import('./nako_logger').LogLevel} */
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
      debug: this.debug,
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
    if (/\.(nako|nako3|txt|bak)$/.test(args.mainfile)) {
      if (!args.output) {
        if (args.test) {
          args.output = args.mainfile.replace(/\.(nako|nako3)$/, '.spec.js')
        } else {
          args.output = args.mainfile.replace(/\.(nako|nako3)$/, '.js')
        }
      }
    } else {
      if (!args.output) {
        if (args.test) {
          args.output = args.mainfile + '.spec.js'
        } else {
          args.output = args.mainfile + '.js'
        }
      }
      args.mainfile += '.nako3'
    }
    return args
  }

  // 実行する
  execCommand () {
    const opt = this.checkArguments()
    if (opt.man) {
      this.cnakoMan(opt.man)
      return
    }
    if (opt.browsers) { // 対応ブラウザを表示する
      this.cnakoBrowsers()
      return
    }
    if (opt.mainfile) { this.filename = opt.mainfile }
    if (opt.repl) { // REPLを実行する
      this.cnakoRepl(opt)
      return
    }
    if (opt.one_liner) { // ワンライナーで実行する
      this.cnakoOneLiner(opt)
      return
    }

    // メインプログラムを読み込む
    const src = fs.readFileSync(opt.mainfile, 'utf-8')
    if (opt.compile) {
      this.nakoCompile(opt, src, false)
      return
    }
    if (opt.ast) {
      this.outputAST(opt, src)
      return
    }
    try {
      if (opt.test) {
        this.loadDependencies(src, opt.mainfile, '')
        this.test(src, opt.mainfile)
      } else {
        this.run(src, opt.mainfile)
      }
      if (opt.test && this.numFailures > 0) {
        process.exit(1)
      }
    } catch (e) {
      if (opt.debug || opt.trace) {
        throw e
      }
      // エラーメッセージはloggerへ送られるため無視してよい
    }
  }

  /**
   * コンパイルモードの場合
   * @param opt
   * @param {string} src
   * @param {boolean} isTest
   */
  nakoCompile (opt, src, isTest) {
    // system
    const jscode = this.compileStandalone(src, this.filename, isTest)
    console.log(opt.output)
    fs.writeFileSync(opt.output, jscode, 'utf-8')
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
      const commands = require('../release/command_cnako3.json')
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

  /**
   * @param {string} code
   * @param {string} filename
   * @param {string} preCode
   */
  loadDependencies (code, filename, preCode) {
    /** @type {string[]} */
    const log = []
    // 同期的に読み込む
    const tasks = super._loadDependencies(code, filename, preCode, {
      resolvePath: (name, token) => {
        if (/\.js(\.txt)?$/.test(name) || /^[^.]*$/.test(name)) {
          return { filePath: path.resolve(CNako3.findPluginFile(name, this.filename, __dirname, log)), type: 'js' }
        }
        if (/\.nako3?(\.txt)?$/.test(name)) {
          if (path.isAbsolute(name)) {
            return { filePath: path.resolve(name), type: 'nako3' }
          } else {
            // filename が undefined のとき token.file が undefined になる。
            if (token.file === undefined) {
              throw new Error('ファイル名を指定してください。')
            }
            return { filePath: path.resolve(path.join(path.dirname(token.file), name)), type: 'nako3' }
          }
        }
        return { filePath: name, type: 'invalid' }
      },
      readNako3: (name, token) => {
        if (!fs.existsSync(name)) {
          throw new NakoImportError(`ファイル ${name} が存在しません。`, token.line, token.file)
        }
        return { sync: true, value: fs.readFileSync(name).toString() }
      },
      readJs: (name, token) => {
        return {
          sync: true,
          value: () => {
            try {
              return require(name)
            } catch (/** @type {unknown} */err) {
              let msg = `プラグイン ${name} の取り込みに失敗: ${err instanceof Error ? err.message : err + ''}`
              if (err instanceof Error && err.message.startsWith('Cannot find module')) {
                msg += `\n次の場所を検索しました: ${log.join(', ')}`
              }
              throw new NakoImportError(msg, token.line, token.file)
            }
          }
        }
      }
    })
    if (tasks !== undefined) {
      throw new Error('assertion error')
    }
  }

  /**
   * @param {string} code
   * @param {string} fname
   * @param {string} [preCode]
   */
  run (code, fname, preCode = '') {
    const tasks = this.loadDependencies(code, fname, preCode)
    if (tasks !== undefined) {
      throw new Error('assertion error')
    }
    return this._runEx(code, fname, {}, preCode)
  }

  /**
   * プラグインファイルの検索を行う
   * @param {string} pname
   * @param {string} filename
   * @param {string} srcDir このファイルが存在するディレクトリ
   * @param {string[]} [log]
   * @return {string} フルパス
   */
  static findPluginFile (pname, filename, srcDir, log = []) {
    log.length = 0
    /** @type {string[]} */
    // フルパス指定か?
    const p1 = pname.substr(0, 1)
    if (p1 === '/') {
      // フルパス指定なので何もしない
      return pname
    }
    // 各パスを調べる
    const exists = (f, desc) => {
      const result = fs.existsSync(f)
      log.push(f)
      // console.log(result, 'exists[', desc, '] =', f)
      return result
    }
    const fCheck = (pathTest) => {
      // 素直にチェック
      let fpath = path.join(pathTest, pname)
      if (exists(fpath, 'direct')) { return fpath }

      // プラグイン名を分解してチェック
      const m = pname.match(/^(plugin_|nadesiko3-)([a-zA-Z0-9_-]+)/)
      if (!m) { return false }
      const name = m[2]
      // plugin_xxx.js
      // eslint-disable-next-line camelcase
      const plugin_xxx_js = 'plugin_' + name + '.js'
      fpath = path.join(pathTest, plugin_xxx_js)
      if (exists(fpath, 'plugin_xxx.js')) { return fpath }
      fpath = path.join(pathTest, 'src', plugin_xxx_js)
      if (exists(fpath, 'src/plugin_xxx.js')) { return fpath }
      // nadesiko3-xxx
      // eslint-disable-next-line camelcase
      const nadesiko3_xxx = 'nadesiko3-' + name
      fpath = path.join(pathTest, nadesiko3_xxx)
      if (exists(fpath, 'nadesiko3-xxx')) { return fpath }
      fpath = path.join(pathTest, 'node_modules', nadesiko3_xxx)
      if (exists(fpath, 'node_modules/nadesiko3-xxx')) { return fpath }
      return false
    }
    // 相対パスか?
    if (p1 === '.') {
      // 相対パス指定なので、なでしこのプログラムからの相対指定を調べる
      const pathRelative = path.resolve(path.dirname(filename))
      const fileRelative = fCheck(pathRelative)
      if (fileRelative) { return fileRelative }
    }
    // nako3スクリプトパスか?
    const pathScript = path.resolve(path.dirname(filename))
    const fileScript = fCheck(pathScript)
    if (fileScript) { return fileScript }

    // ランタイムパス/src
    const pathRuntimeSrc = path.resolve(srcDir)
    const fileRuntimeSrc = fCheck(pathRuntimeSrc)
    if (fileRuntimeSrc) { return fileRuntimeSrc }
    // ランタイムパス
    const pathRuntime = path.dirname(pathRuntimeSrc)
    const fileRuntime = fCheck(pathRuntime)
    if (fileRuntime) { return fileRuntime }

    // 環境変数 NAKO_HOMEか?
    if (process.env.NAKO_HOME) {
      const NAKO_HOME = path.resolve(process.env.NAKO_HOME)
      const fileHome = fCheck(NAKO_HOME)
      if (fileHome) { return fileHome }
      // NAKO_HOME/src ?
      const pathNakoHomeSrc = path.join(NAKO_HOME, 'src')
      const fileNakoHomeSrc = fCheck(pathNakoHomeSrc)
      if (fileNakoHomeSrc) { return fileNakoHomeSrc }
    }
    // 環境変数 NODE_PATH (global) 以下にあるか？
    if (process.env.NODE_PATH) {
      const pathNode = path.resolve(process.env.NODE_PATH)
      const fileNode = fCheck(pathNode)
      if (fileNode) { return fileNode }
    }
    // Nodeのパス検索に任せる
    return pname
  }
}

// メイン
if (require.main === module) { // 直接実行する
  const cnako3 = new CNako3()
  cnako3.execCommand()
} else { // モジュールとして使う場合
  module.exports = CNako3
}
