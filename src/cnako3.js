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
  }
  // CNAKO3で使えるコマンドを登録する
  registerCommands () {
    // コマンド引数がないならば、ヘルプを表示(-hはcommandarにデフォルト用意されている)
    if (process.argv.length <= 2) {
      process.argv.push('-h')
    }
    // commanderを使って引数を解析する
    const app = require('commander')
    const packages = require('../package.json')
    app
      .version(packages.version, '-v, --version')
      .usage('[Options] nakofile')
      .option('-d, --debug', 'デバッグモードの指定')
      .option('-D, --debugAll', '詳細デバッグモードの指定')
      .option('-c, --compile', 'コンパイルモードの指定')
      .option('-r, --run', 'コンパイルモードでも実行する')
      .option('-e, --eval [src]', '直接プログラムを実行するワンライナーモード')
      .option('-o, --output', '出力ファイル名の指定')
      .option('-s, --silent', 'サイレントモードの指定')
      .option('-l, --repl', '対話シェル(REPL)の実行')
      // .option('-h, --help', '使い方を表示する')
      // .option('-v, --version', 'バージョンを表示する')
      .parse(process.argv)
    return app
  }
  /**
   * コマンドライン引数を解析
   * @returns {{mainfile: string, compile: boolean, run: boolean, output: string, source: string, one_liner: boolean, debug: (boolean|*)}}
   */
  checkArguments () {
    const app = this.registerCommands()
    let mainfile = app.args[0]
    let output = app.output
    if (/\.(nako|nako3)$/.test(mainfile)) {
      if (!output) output = mainfile.replace(/\.(nako|nako3)$/, '.js')
    } else {
      if (!output) output = mainfile + '.js'
      mainfile += '.nako3'
    }
    // デバッグモードの指定
    this.debug = app.debugAll || app.debug || false
    if (app.debugAll) {
      this.debugLexer = true
      this.debugParser = true
      this.debugJSCode = true
    }
    return {
      'mainfile': mainfile,
      'output': output,
      'compile': app.compile || false,
      'run': app.run || false,
      'source': app.eval || '',
      'one_liner': app.eval || false,
      'debug': this.debug,
      'debugAll': app.debugAll,
      'repl': app.repl || false
    }
  }
  // 実行する
  execCommand () {
    const opt = this.checkArguments()
    if (opt.repl) {
      this.cnakoRepl(opt)
      return
    }
    if (opt.one_liner) {
      this.cnakoOneLiner(opt)
      return
    }

    const src = fs.readFileSync(opt.mainfile, 'utf-8')
    if (opt.compile) {
      this.nakoCompile(opt, src)
      return
    }
    this.runReset(src)
  }
  /**
   * コンパイルモードの場合
   * @param opt
   * @param src
   */
  nakoCompile (opt, src) {
    // system
    this.filename = opt.mainfile
    const js = this.compile(src)
    const jscode =
      NakoCompiler.getHeader() +
      this.getVarsCode() +
      js
    fs.writeFileSync(opt.output, jscode, 'utf-8')
    if (opt.run) {
      exec(`node ${opt.output}`, function (err, stdout, stderr) {
        if (err) console.log('[ERROR]', stderr)
        console.log(stdout)
      })
    }
  }
  // ワンライナーの場合
  cnakoOneLiner (opt) {
    this.runReset(opt.source)
  }
  // REPL(対話実行環境)の場合
  cnakoRepl (opt) {
    const fname = path.join(__dirname, 'repl.nako3')
    const src = fs.readFileSync(fname, 'utf-8')
    this.run(src, true)
  }
}

// メイン
const cnako3 = new CNako3()
cnako3.execCommand()
