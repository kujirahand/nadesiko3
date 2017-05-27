// cnako3.js

const fs = require('fs')
const exec = require('child_process').exec

const path = require('path')
const NakoCompiler = require(path.join(__dirname, 'nako3'))
const PluginNode = require(path.join(__dirname, 'plugin_node'))

const nako = new NakoCompiler()
nako.silent = false
nako.addPluginFile('PluginNode', path.join(__dirname, 'plugin_node.js'), PluginNode)

const app = require('commander')
const packages = require('../package.json')
app
  .version(packages.version, '-v, --version')
  .usage('[options] nakofile')
  .option('-d, --debug', 'デバッグモードの指定')
  .option('-c, --compile', 'コンパイルモードの指定')
  .option('-r, --run', 'コンパイルモードでも実行する')
  .option('-e, --eval [src]', '直接プログラムを実行するワンライナーモード')
  .option('-o, --output', '出力ファイル名の指定')
  .option('-s, --silent', 'サイレントモードの指定')
  .parse(process.argv)

const opt = checkArguments()
nakoRun(opt)

/**
 * コマンドライン引数を解析
 * @returns {{mainfile: string, compile: boolean, run: boolean, output: string, source: string, one_liner: boolean, debug: (boolean|*)}}
 */
function checkArguments () {
  if (process.argv.length <= 2) {
    console.log('cnako3 nakofile')
    process.exit()
  }
  let mainfile = app.args[0]
  let output = app.output
  if (/\.(nako|nako3)$/.test(mainfile)) {
    if (!output) output = mainfile.replace(/\.(nako|nako3)$/, '.js')
  } else {
    if (!output) output = mainfile + '.js'
    mainfile += '.nako3'
  }
  nako.debug = app.debug || false
  return {
    'mainfile': mainfile,
    'output': output,
    'compile': app.compile || false,
    'run': app.run || false,
    'source': app.eval || '',
    'one_liner': app.eval || false,
    'debug': nako.debug
  }
}

/**
 * なでしこを実行
 * @param opt
 */
function nakoRun (opt) {
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
