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
    if (/\.(nako|nako3|txt|bak)$/.test(mainfile)) {
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
    if (opt.mainfile) this.filename = opt.mainfile
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
      this.nakoCompile(opt, src)
      return
    }
    this.runReset(src)
  }
  /** コンパイル(override) */
  compile (src) {
    const code = this.includePlugin(src)
    const ast = this.parse(code)
    const js = this.generate(ast)
    return js
  }
  /**
   * コンパイルモードの場合
   * @param opt
   * @param src
   */
  nakoCompile (opt, src) {
    // system
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
  /**
   * プラグインの取込チェック
   * @param src
   * @return プリプロセスを除去したソースコード
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
      const m = s.match(/["'『「](.+)["'』」]を(取り込|取込)/)
      if (!m) continue
      // プラグインの取り込み
      const pname = m[1]
      let fullpath = pname
      try {
        let plugmod = {}
        if (fullpath.substr(0, 1) === '.') { // 相対パス指定
          const basedir = path.dirname(this.filename)
          fullpath = path.resolve(path.join(basedir, pname))
        }
        plugmod = require(fullpath)
        this.addPluginFile(pname, fullpath, plugmod)
        // this.funclistを更新する
        for (const key in plugmod) {
          this.funclist[key] = plugmod[key]
        }
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
