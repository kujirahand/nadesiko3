#!/usr/bin/env node
const fs = require('fs')
const exec = require('child_process').exec

const path = require('path')
const NakoCompiler = require(path.join(__dirname, 'nako3'))
const PluginNode = require(path.join(__dirname, 'plugin_node'))

const nako = new NakoCompiler()
nako.silent = false
nako.addPluginFile('PluginNode', path.join(__dirname, 'plugin_node.js'), PluginNode)

// コマンド引数がないならば、ヘルプを表示
if (process.argv.length <= 2) {
  process.argv.push('-h')
}

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
  .parse(process.argv)

const opt = checkArguments()
nakoRun(opt)

/**
 * コマンドライン引数を解析
 * @returns {{mainfile: string, compile: boolean, run: boolean, output: string, source: string, one_liner: boolean, debug: (boolean|*)}}
 */
function checkArguments () {
  let mainfile = app.args[0]
  let output = app.output
  if (/\.(nako|nako3)$/.test(mainfile)) {
    if (!output) output = mainfile.replace(/\.(nako|nako3)$/, '.js')
  } else {
    if (!output) output = mainfile + '.js'
    mainfile += '.nako3'
  }
  // デバッグモードの指定
  nako.debug = app.debugAll || app.debug || false
  if (app.debugAll) {
    nako.debugLexer = true
    nako.debugParser = true
    nako.debugJSCode = true
  }
  return {
    'mainfile': mainfile,
    'output': output,
    'compile': app.compile || false,
    'run': app.run || false,
    'source': app.eval || '',
    'one_liner': app.eval || false,
    'debug': nako.debug,
    'debugAll': app.debugAll,
    'repl': app.repl || false
  }
}

/**
 * なでしこを実行
 * @param opt
 */
function nakoRun (opt) {
  if (opt.repl) {
    nakoRepl(opt)
    return
  }
  if (opt.one_liner) {
    nakoOneLiner(opt)
    return
  }

  const src = fs.readFileSync(opt.mainfile, 'utf-8')
  if (opt.compile) {
    nakoCompile(opt, src)
    return
  }
  nako.runReset(src)
}

/**
 * コンパイルモードの場合
 * @param opt
 * @param src
 */
function nakoCompile (opt, src) {
  // system
  const js = nako.compile(src)
  const jscode =
    nako.getHeader() +
    nako.getVarsCode() +
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
function nakoOneLiner (opt) {
  nako.runReset(opt.source)
}

// REPL(対話実行環境)の場合
function nakoRepl (opt) {
  const fname = path.join(__dirname, 'repl.nako3')
  const src = fs.readFileSync(fname, 'utf-8')
  nako.run(src, true)
}
