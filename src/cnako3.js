#!/usr/bin/env node
/**
 * コマンドライン版のなでしこ3
 */
const fs = require('fs')
const exec = require('child_process').exec

const path = require('path')
const NakoCompiler = require('./nako3')
const PluginNode = require('./plugin_node')
const { NakoImportError } = require('./nako_errors')
const NakoLogger = require('./nako_logger')

class CNako3 extends NakoCompiler {
  /** @param {{ nostd?: boolean }} [opts] */
  constructor (opts = {}) {
    super()
    this.silent = false
    if (!opts.nostd) {
      this.addPluginFile('PluginNode', path.join(__dirname, 'plugin_node.js'), PluginNode)
    }
    this.__varslist[0]['ナデシコ種類'] = 'cnako3'
  }

  // CNAKO3で使えるコマンドを登録する
  registerCommands () {
    // コマンド引数がないならば、ヘルプを表示(-hはcommandarにデフォルト用意されている)
    if (process.argv.length <= 2)
      {process.argv.push('-h')}

    // commanderを使って引数を解析する
    const app = require('./commander_ja.js')
    const nako_version = require('./nako_version.js')
    app
      .title('日本語プログラミング言語「なでしこ」v' + nako_version.version)
      .version(nako_version.version, '-v, --version')
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
    this.logger.addListener(logLevel, (data) => {
      if (this.silent && data.level === 'stdout') {
        return
      }
      NakoLogger.getSimpleLogger()(data)
    })

    let args = {
      'compile': app.compile || false,
      'run': app.run || false,
      'source': app.eval || '',
      'man': app.man || '',
      'one_liner': app.eval || false,
      'debug': this.debug,
      'trace': app.trace,
      'warn': app.warn,
      'repl': app.repl || false,
      'test': app.test || false,
      'browsers': app.browsers || false,
      'speed': app.speed || false
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
    this.gen.setOptions(args) // 実行時オプションを覚えておく
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
    if (opt.mainfile) {this.filename = opt.mainfile}
    if (opt.repl) { // REPLを実行する
      this.cnakoRepl(opt)
      return
    }
    if (opt.one_liner) { // ワンライナーで実行する
      this.cnakoOneLiner(opt)
      return
    }

    // メインプログラムを読み込む
    let src = fs.readFileSync(opt.mainfile, 'utf-8')
    if (opt.compile) {
      this.nakoCompile(opt, src, false)
      return
    }
    if (opt.test) {
      this.nakoCompile(opt, src, true)
      return
    }
    try {
      this.runReset(src, opt.mainfile)
      this.clearEachPlugins()
    } catch (e) {
      if (opt.debug || opt.trace) {
        throw e
      } else {
        console.error(e.message)
      }
    }
  }

  /**
   * コンパイルモードの場合
   * @param opt
   * @param src
   * @param isTest
   */
  nakoCompile(opt, src, isTest) {
    // system
    const js = this.compile(src, isTest)
    const jscode =
      NakoCompiler.getHeader() +
      this.getVarsCode() +
      js
    fs.writeFileSync(opt.output, jscode, 'utf-8')
    if (opt.run)
      {exec(`node ${opt.output}`, function (err, stdout, stderr) {
        if (err) {console.log('[ERROR]', stderr)}
        console.log(stdout)
      })}

  }

  // ワンライナーの場合
  cnakoOneLiner (opt) {
    const org = opt.source
    try {
      if (opt.source.indexOf('表示') < 0) {
        opt.source = '' + opt.source + 'を表示。'
      }
      this.runReset(opt.source)
    } catch (e) {
      // エラーになったら元のワンライナーで再挑戦
      try {
        if (opt.source != org) {
          this.runReset(org)
        }　else {
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

  // REPL(対話実行環境)の場合
  cnakoRepl (opt) {
    const fname = path.join(__dirname, 'repl.nako3')
    const src = fs.readFileSync(fname, 'utf-8')
    this.run(src, true)
  }

  // マニュアルを表示する
  cnakoMan(command) {
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
    console.log(fs.readFileSync(path.join(__dirname, 'browsers.md'), 'utf-8'))
  }

  /**
   * @param {string} code
   * @param {string} filename
   * @param {string} preCode
   */
  loadDependencies(code, filename, preCode) {
    /** @type {string[]} */
    const log = []
    // 同期的に読み込む
    const tasks = super.loadDependencies(code, filename, preCode, {
      resolvePath: (name, token) => {
        if (/\.js(\.txt)?$/.test(name) || /^[^\.]*$/.test(name)) {
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
        return { sync: true, value: fs.readFileSync(name).toString()}
      },
      readJs: (name, token) => {
        try {
          return { sync: true, value: () => require(name) }
        } catch (err) {
          throw new NakoImportError(`プラグイン ${name} が存在しません。次の場所を検索しました: ${log.join(', ')}`, token.line, token.file)
        }
      },
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
  runReset(code, fname, preCode = '') {
    const tasks = this.loadDependencies(code, fname, preCode)
    if (tasks !== undefined) {
      throw new Error('assertion error')
    }
    return super.runReset(code, fname, preCode)
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
    const f_check = (pathTest) => {
      // 素直にチェック
      let fpath = path.join(pathTest, pname)
      if (exists(fpath, 'direct')) { return fpath }
      
      // プラグイン名を分解してチェック
      const m = pname.match(/^(plugin_|nadesiko3\-)([a-zA-Z0-9_-]+)/)
      if (!m) { return false }
      const name = m[2]
      // plugin_xxx.js
      const plugin_xxx_js = 'plugin_' + name + '.js'
      fpath = path.join(pathTest, plugin_xxx_js)
      if (exists(fpath, 'plugin_xxx.js')) { return fpath }
      fpath = path.join(pathTest, 'src', plugin_xxx_js)
      if (exists(fpath, 'src/plugin_xxx.js')) { return fpath }
      // nadesiko3-xxx
      const nadesiko3_xxx = 'nadesiko3-' + name
      fpath = path.join(pathTest, nadesiko3_xxx)
      if (exists(fpath, 'nadesiko3-xxx')) { return fpath }
      fpath = path.join(pathTest, 'node_modules', nadesiko3_xxx)
      if (exists(fpath, 'node_modules/nadesiko3-xxx')) { return fpath }
      return false
    }
    let fullpath
    // 相対パスか?
    if (p1 === '.') {
      // 相対パス指定なので、なでしこのプログラムからの相対指定を調べる
      const pathRelative = path.resolve(path.dirname(filename))
      const fileRelative = f_check(pathRelative)
      if (fileRelative) { return fileRelative }
    }
    // nako3スクリプトパスか?
    const pathScript = path.resolve(path.dirname(filename))
    const fileScript = f_check(pathScript)
    if (fileScript) { return fileScript }
        
    // ランタイムパス/src
    const pathRuntimeSrc = path.resolve(srcDir)
    const fileRuntimeSrc = f_check(pathRuntimeSrc)
    if (fileRuntimeSrc) { return fileRuntimeSrc }
    // ランタイムパス
    const pathRuntime = path.dirname(pathRuntimeSrc)
    const fileRuntime = f_check(pathRuntime)
    if (fileRuntime) { return fileRuntime }
        
    // 環境変数 NAKO_HOMEか?
    if (process.env['NAKO_HOME']) {
      const NAKO_HOME = path.resolve(process.env['NAKO_HOME'])
      const fileHome = f_check(NAKO_HOME)
      if (fileHome) { return fileHome }
      // NAKO_HOME/src ?
      const pathNakoHomeSrc = path.join(NAKO_HOME, 'src')
      const fileNakoHomeSrc = f_check(pathNakoHomeSrc)
      if (fileNakoHomeSrc) { return fileNakoHomeSrc }
    }
    // 環境変数 NODE_PATH (global) 以下にあるか？
    if (process.env['NODE_PATH']) {
      const pathNode = path.resolve(process.env['NODE_PATH'])
      const fileNode = f_check(pathNode)
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
