#!/usr/bin/env node
/**
 * コマンドライン版のなでしこ3
 */
const fs = require('fs')
const exec = require('child_process').exec

const path = require('path')
const NakoCompiler = require(path.join(__dirname, 'nako3'))
const PluginNode = require(path.join(__dirname, 'plugin_node'))

class CNako3 extends NakoCompiler {
  constructor () {
    super()
    this.silent = false
    this.addPluginFile('PluginNode', path.join(__dirname, 'plugin_node.js'), PluginNode)
    this.__varslist[0]['ナデシコ種類'] = 'cnako3'
  }

  // CNAKO3で使えるコマンドを登録する
  registerCommands () {
    // コマンド引数がないならば、ヘルプを表示(-hはcommandarにデフォルト用意されている)
    if (process.argv.length <= 2)
      {process.argv.push('-h')}

    // commanderを使って引数を解析する
    const app = require('commander')
    const packages = require('../package.json')
    app
      .version(packages.version, '-v, --version')
      .usage('[Options] nakofile')
      .option('-d, --debug', 'デバッグモードの指定')
      .option('-D, --debugAll', '詳細デバッグモードの指定')
      .option('-c, --compile', 'コンパイルモードの指定')
      .option('-t, --test', 'コンパイルモードの指定 (テスト用コードを出力)')
      .option('-r, --run', 'コンパイルモードでも実行する')
      .option('-e, --eval [src]', '直接プログラムを実行するワンライナーモード')
      .option('-o, --output', '出力ファイル名の指定')
      .option('-s, --silent', 'サイレントモードの指定')
      .option('-l, --repl', '対話シェル(REPL)の実行')
      .option('-b, --browsers', '対応機器/Webブラウザを表示する')
      .option('-m, --man [command]', 'マニュアルを表示する')
      // .option('-h, --help', '使い方を表示する')
      // .option('-v, --version', 'バージョンを表示する')
      .parse(process.argv)
    return app
  }

  /**
   * コマンドライン引数を解析
   * @returns {{debug: boolean, compile: any | boolean, test: any | boolean, one_liner: any | boolean, debugAll: any, run: any | boolean, repl: any | boolean, source: any | string}}
   */
  checkArguments () {
    const app = this.registerCommands()
    // デバッグモードの指定
    this.debug = app.debugAll || app.debug || false
    if (app.debugAll) {
      this.debugLexer = true
      this.debugParser = true
      this.debugJSCode = true
    }
    let args = {
      'compile': app.compile || false,
      'run': app.run || false,
      'source': app.eval || '',
      'man': app.man || '',
      'one_liner': app.eval || false,
      'debug': this.debug,
      'debugAll': app.debugAll,
      'repl': app.repl || false,
      'test': app.test || false,
      'browsers': app.browsers || false
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
    if (opt.browsers) {
      this.cnakoBrowsers()
      return
    }
    if (opt.mainfile) {this.filename = opt.mainfile}
    if (opt.repl) {
      this.cnakoRepl(opt)
      return
    }
    if (opt.one_liner) {
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
    } catch (e) {
      if (this.debug) {
          throw e
      } else {
        console.error(e.message)
      }
    }
  }

  /** コンパイル(override) */
  compile(src, isTest) {
    const code = this.includePlugin(src)
    const ast = this.parse(code)
    return this.generate(ast, isTest)
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
    try {
      this.runReset(opt.source)
    } catch (e) {
      if (this.debug) {
        throw e
      } else {
        console.error(e.message)
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
        console.log('コマンド一覧がないため、マニュアルを表示できません。以下のコマンドでコマンド一覧を生成してください。\n$ npm run build:command')
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
   * プラグインファイルの検索を行う
   * @param path
   * @return string フルパス
   */
  findPluginFile (pname) {
    // フルパス指定か?
    const p1 = pname.substr(0, 1)
    if (p1 === '/') {
      // フルパス指定なので何もしない
      return pname
    }
    // 相対パスか?
    if (p1 === '.') {
      // 相対パス指定なので、なでしこのプログラムからの相対指定を調べる
      const basedir = path.dirname(this.filename)
      return path.resolve(path.join(basedir, pname))
    }
    // 同じフォルダか?
    const basedir = path.dirname(this.filename)
    let fullpath = path.resolve(path.join(basedir, pname))
    if (fs.existsSync(fullpath)) {
        return fullpath
    }
    // node_modules 以下にあるか？
    fullpath = path.resolve(path.join(basedir, 'node_modules', pname))
    if (fs.existsSync(fullpath)) {
        return fullpath
    }
    // NAKO_HOMEか?
    if (process.env['NAKO_HOME']) {
      const NAKO_HOME = process.env['NAKO_HOME']
      // NAKO_HOME/node_modules?
      fullpath = path.resolve(path.join(NAKO_HOME, 'node_modules', pname))
      if (fs.existsSync(fullpath)) {
          return fullpath
      }
      // NAKO_HOME/src ?
      fullpath = path.resolve(path.join(NAKO_HOME, 'src', pname))
      if (fs.existsSync(fullpath)) {
          return fullpath
      }
    }
    // NODE_PATH (global) 以下にあるか？
    fullpath = path.resolve(path.join(process.env.NODE_PATH, 'node_modules', pname))
    if (fs.existsSync(fullpath)) {
        return fullpath
    }
  }
  /**
   * プラグインの取込チェック
   * @param src
   * @return string プリプロセスを除去したソースコード
   */
  includePlugin (src) {
    let result = ''
    const srcLF = src.replace(/(\r\n|\r)/g, '\n')
    const lines = srcLF.split('\n')
    for (let line of lines) {
      let s = line.replace(/^\s+/, '') // trim
      const ch = s.substr(0, 1)
      if (ch !== '!' && ch !== '！') {
        result += line + '\n'
        continue
      }
      const m = s.match(/[\"'『「](.+)["'』」]を(取り込|取込)/)
      if (!m) {continue}
      // プラグインの取り込み
      const pname = m[1]
      let fullpath = pname
      try {
        let plugmod = {}
        // プラグインフォルダを検索
        fullpath = this.findPluginFile(fullpath)
        // モジュールを実際に取り込む
        plugmod = require(fullpath)
        this.addPluginFile(pname, fullpath, plugmod)
        // this.funclistを更新する
        for (const key in plugmod)
          {this.funclist[key] = plugmod[key]}

      } catch (e) {
        throw new Error(
          '[取込エラー] プラグイン『' + pname + '』を取り込めません。' +
          '(path=' + fullpath + ') ' + e.message)
      }
    }
    return result
  }
}

// メイン
if (require.main === module) { // 直接実行する
  const cnako3 = new CNako3()
  cnako3.execCommand()
} else { // モジュールとして使う場合
  module.exports = CNako3
}
