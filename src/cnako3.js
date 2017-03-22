// cnako3.js

const fs = require('fs')
const exec = require('child_process').exec

const path = require('path')
const NakoCompiler = require(path.join(__dirname, 'nako3'))
const PluginNode = require(path.join(__dirname, 'plugin_node'))

const nako = new NakoCompiler()
nako.silent = false
nako.addPluginFile('PluginNode', path.join(__dirname, 'plugin_node.js'), PluginNode)

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
  let mainfile = ''
  let output = ''
  let source = ''
  let flagCompile = false
  let flagRun = false
  let flagOneLiner = false
  let i = 2
  while (i < process.argv.length) {
    const arg = process.argv[i]
    if (arg === '-debug' || arg === '--debug') {
      nako.debug = true
      i++
      continue
    }
    // コンパイルモードを使うか
    if (arg === '-c' || arg === '--compile') {
      flagCompile = true
      i++
      continue
    }
    // コンパイルモードでも実行するか
    if (arg === '-run' || arg === '--run') {
      flagRun = true
      i++
      continue
    }
    // ワンライナー
    if (arg === '-e' || arg === '--eval') {
      flagOneLiner = true
      i++
      source = process.argv[i++]
      continue
    }
    if (arg === '-o') {
      i++
      output = arg
      i++
    }
    if (mainfile === '') {
      mainfile = process.argv[i]
      i++
      continue
    }
    i++
  }
  if (output === '') {
    output = mainfile + '.js'
  }
  return {
    'mainfile': mainfile,
    'compile': flagCompile,
    'run': flagRun,
    'output': output,
    'source': source,
    'one_liner': flagOneLiner,
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
