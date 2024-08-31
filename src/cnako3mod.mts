/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any
/**
 * コマンドライン版のなでしこ3をモジュールとして定義
 * 実際には cnako3.mjs から読み込まれる
 */
import fs from 'node:fs'
import fse from 'fs-extra'
import { exec } from 'node:child_process'
import path from 'node:path'

import { NakoCompiler, LoaderTool, newCompilerOptions } from '../core/src/nako3.mjs'
import { NakoImportError } from '../core/src/nako_errors.mjs'

import { Ast, CompilerOptions } from '../core/src/nako_types.mjs'
import { NakoGlobal } from '../core/src/nako_global.mjs'
import nakoVersion from './nako_version.mjs'

import PluginNode from './plugin_node.mjs'
import app from './commander_ja.mjs'
import fetch from 'node-fetch'

import { NakoGenOptions } from '../core/src/nako_gen.mjs'

import { getEnv, isWindows, getCommandLineArgs, exit } from './deno_wrapper.mjs'

// __dirname のために
import url from 'node:url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** コマンドラインアクション */
interface CNako3ArgOptions {
  warn: boolean
  debug: boolean
  compile: any | boolean
  test: any | boolean
  one_liner: any | boolean
  trace: any | boolean
  run: any | boolean
  repl: any | boolean
  source: any | string
  mainfile: any | string
  man: string
  browsers: boolean
  ast: boolean
  lex: boolean
}

interface CNako3Options {
  nostd: boolean
}

/** CNako3 */
export class CNako3 extends NakoCompiler {
  debug: boolean
  version: string

  constructor (opts:CNako3Options = { nostd: false }) {
    super({ useBasicPlugin: !opts.nostd })
    this.debug = false
    this.filename = 'main.nako3'
    this.version = nakoVersion.version
    if (!opts.nostd) {
      this.addPluginFromFile('PluginNode', PluginNode, true)
    }
    // 必要な定数を設定
    this.addListener('beforeRun', (g: NakoGlobal) => {
      g.__varslist[0].set('ナデシコ種類', 'cnako3')
      g.__varslist[0].set('ナデシコバージョン', this.version)
    })
  }

  // CNAKO3で使えるコマンドを登録する
  registerCommands () {
    // コマンドライン引数を得る
    const args: string[] = getCommandLineArgs()
    // コマンド引数がないならば、ヘルプを表示(-hはcommandarにデフォルト用意されている)
    if (args.length <= 2) { args.push('-h') }

    const verInfo = `v${nakoVersion.version}`
    // commanderを使って引数を解析する
    app
      .title('日本語プログラミング言語「なでしこ」' + verInfo)
      .version(verInfo, '-v, --version')
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
      .option('-A, --ast', '構文解析した結果をASTで出力する')
      .option('-X, --lex', '字句解析した結果をJSONで出力する')
      // .option('-h, --help', '使い方を表示する')
      // .option('-v, --version', 'バージョンを表示する')
      .parse(args)
    return app
  }

  /** コマンドライン引数を解析 */
  checkArguments (): CNako3ArgOptions {
    const app: any = this.registerCommands()

    let logLevel = 'error'
    if (app.trace) {
      logLevel = 'trace'
    } else if (app.debug) {
      logLevel = 'debug'
    } else if (app.warn) {
      logLevel = 'warn'
    }
    this.getLogger().addListener(logLevel, ({ nodeConsole }) => {
      console.log(nodeConsole)
    })

    const args: any = {
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
      ast: app.ast || false,
      lex: app.lex || false
    }
    args.mainfile = app.args[0]
    args.output = app.output

    // todo: ESModule 対応の '.mjs' のコードを吐くように修正 #1217
    const ext = '.mjs'
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
    const opt: CNako3ArgOptions = this.checkArguments()
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
    // REPLを実行する
    if (opt.repl) {
      this.cnakoRepl()
      return
    }
    // ワンライナーで実行する
    if (opt.one_liner) {
      this.cnakoOneLiner(opt)
      return
    }

    // メインプログラムを読み込む
    this.filename = opt.mainfile
    const src = fs.readFileSync(opt.mainfile, 'utf-8')
    if (opt.compile) {
      await this.nakoCompile(opt, src, false)
      return
    }
    // 字句解析の結果をJSONで出力
    if (opt.lex) {
      const lex = this.lex(src, opt.mainfile)
      console.log(this.outputJSON(lex, 0))
      return
    }
    // ASTを出力する
    if (opt.ast) {
      try {
        await this.loadDependencies(src, opt.mainfile, '')
      } catch (err: any) {
        if (this.numFailures > 0) {
          this.logger.error(err)
          exit(1)
        }
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
      } catch (e: any) {
        if (this.numFailures > 0) {
          this.logger.error(e)
          exit(1)
        }
      }
    }

    // ファイルを読んで実行する
    try {
      // コンパイルと実行を行うメソッド
      const g = await this.runAsync(src, opt.mainfile)
      return g
    } catch (e: any) {
      // 文法エラーなどがあった場合
      if (opt.debug || opt.trace) {
        throw e
      }
    }
  }

  /**
   * コンパイルモードの場合
   */
  async nakoCompile (opt: any, src: string, isTest: boolean) {
    // 依存ライブラリなどを読み込む
    await this.loadDependencies(src, this.filename, '')
    // JSにコンパイル
    const genOpt = new NakoGenOptions(
      isTest,
      ['plugin_node.mjs'],
      'self.__setSysVar(\'ナデシコ種類\', \'cnako3\');'
    )
    const jscode = this.compileStandalone(src, this.filename, genOpt)
    console.log(opt.output)
    fs.writeFileSync(opt.output, jscode, 'utf-8')

    // 実行に必要なファイルをコピー
    const nakoRuntime = __dirname
    const outRuntime = path.join(path.dirname(opt.output), 'nako3runtime')
    if (!fs.existsSync(outRuntime)) { fs.mkdirSync(outRuntime) }
    // from ./src
    for (const mod of ['nako_version.mjs', 'plugin_node.mjs', 'deno_wrapper.mjs']) {
      fs.copyFileSync(path.join(nakoRuntime, mod), path.join(outRuntime, mod))
    }
    // from nadesiko3core/src
    const srcDir = path.join(__dirname, '..', 'core', 'src')
    const baseFiles = ['nako_errors.mjs', 'nako_core_version.mjs',
      'plugin_system.mjs', 'plugin_math.mjs', 'plugin_promise.mjs', 'plugin_test.mjs', 'plugin_csv.mjs', 'nako_csv.mjs']
    for (const mod of baseFiles) {
      fs.copyFileSync(path.join(srcDir, mod), path.join(outRuntime, mod))
    }
    // or 以下のコピーだと依存ファイルがコピーされない package.jsonを見てコピーする必要がある
    const orgModule = path.join(__dirname, '..', 'node_modules')
    const dirNodeModules = path.join(path.dirname(opt.output), 'node_modules')
    const modlist = ['fs-extra', 'iconv-lite', 'opener', 'node-fetch', 'shell-quote']
    const copied: { [key: string]: boolean } = {}
    // 再帰的に必要なモジュールをコピーする
    const copyModule = (mod: string) => {
      if (copied[mod]) { return }
      copied[mod] = true
      // ライブラリ自身をコピー
      fse.copySync(path.join(orgModule, mod), path.join(dirNodeModules, mod))
      // 依存ライブラリをコピー
      const packageFile = path.join(orgModule, mod, 'package.json')
      const jsonStr = fs.readFileSync(packageFile, 'utf-8')
      const jsonData = JSON.parse(jsonStr)
      // サブモジュールをコピー
      for (const smod in jsonData.dependencies) {
        copyModule(smod)
      }
    }
    for (const mod of modlist) {
      copyModule(mod)
    }

    if (opt.run) {
      exec(`node ${opt.output}`, function (err, stdout, stderr) {
        if (err) { console.log('[ERROR]', stderr) }
        console.log(stdout)
      })
    }
  }

  // ワンライナーの場合
  async cnakoOneLiner (opt: any) {
    const org = opt.source
    try {
      if (opt.source.indexOf('表示') < 0) {
        opt.source = '' + opt.source + 'を表示。'
      }
      await this.runAsync(opt.source, 'main.nako3')
    } catch (e) {
      // エラーになったら元のワンライナーで再挑戦
      try {
        if (opt.source !== org) {
          await this.runAsync(org, 'main.nako3')
        } else {
          throw e
        }
      } catch (e: any) {
        if (this.debug) {
          throw e
        } else {
          console.error(e.message)
        }
      }
    }
  }

  /**
   * JSONを出力
   */
  outputJSON (ast: any, level: number): string {
    const makeIndent = (level: number) => {
      let s = ''
      for (let i = 0; i < level; i++) { s += '  ' }
      return s
    }
    const trim = (s: string) => { return s.replace(/(^\s+|\s+$)/g, '') }

    if (typeof (ast) === 'string') {
      return makeIndent(level) + '"' + ast + '"'
    }
    if (typeof (ast) === 'number') {
      return makeIndent(level) + ast
    }
    if (ast instanceof Array) {
      const s = makeIndent(level) + '[\n'
      const sa: string[] = []
      ast.forEach((a: Ast) => {
        sa.push(this.outputJSON(a, level + 1))
      })
      return s + sa.join(',\n') + '\n' + makeIndent(level) + ']'
    }
    if (ast instanceof Object) {
      const s = makeIndent(level) + '{\n'
      const sa = []
      for (const key in ast) {
        const sv = trim(this.outputJSON((ast as any)[key], level + 1))
        const so = makeIndent(level + 1) + '"' + key + '": ' + sv
        sa.push(so)
      }
      return s + sa.join(',\n') + '\n' + makeIndent(level) + '}'
    }
    return makeIndent(level) + ast
  }

  /**
   * ASTを出力
   */
  outputAST (opt: any, src: string) {
    const ast = this.parse(src, opt.mainfile)
    console.log(this.outputJSON(ast, 0))
  }

  // REPL(対話実行環境)の場合
  async cnakoRepl () {
    const fname = path.join(__dirname, 'repl.nako3')
    const src = fs.readFileSync(fname, 'utf-8')
    await this.runAsync(src, 'main.nako3')
  }

  // マニュアルを表示する
  cnakoMan (command: string) {
    try {
      const pathCommands = path.join(__dirname, '../release/command_cnako3.json')
      const commands = JSON.parse(fs.readFileSync(pathCommands, 'utf-8'))
      const data = commands[command]
      for (const key in data) {
        console.log(`${key}: ${data[key]}`)
      }
    } catch (e: any) {
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
  getLoaderTools () {
    /** @type {string[]} */
    const log: string[] = []
    const tools: LoaderTool = {
      resolvePath: (name: string, token: any, fromFile: string): {filePath: string, type: string} => {
        // 最初に拡張子があるかどうかをチェック
        // JSプラグインか？
        if (/\.(js|mjs)(\.txt)?$/.test(name)) {
          const jspath = CNako3.findJSPluginFile(name, fromFile, __dirname, log)
          if (jspath === '') {
            throw new NakoImportError(`JSプラグイン『${name}』が見つかりません。コマンドラインで『npm install ${name}』を実行してみてください。以下のパスを検索しました。\n${log.join('\n')}`, token.file, token.line)
          }
          return { filePath: jspath, type: 'js' }
        }
        // なでしこプラグインか？
        if (/\.(nako3|nako)(\.txt)?$/.test(name)) {
          // ファイルかHTTPか
          if (name.startsWith('http://') || name.startsWith('https://')) {
            return { filePath: name, type: 'nako3' }
          }
          if (path.isAbsolute(name)) {
            return { filePath: path.resolve(name), type: 'nako3' }
          } else {
            // filename が undefined のとき token.file が undefined になる。
            if (token.file === undefined) { throw new Error('ファイル名を指定してください。') }
            const dir = path.dirname(fromFile)
            return { filePath: path.resolve(path.join(dir, name)), type: 'nako3' }
          }
        }
        // 拡張子がない、あるいは、(.js|.mjs|.nako3|.nako)以外はJSモジュールと見なす
        const jspath2 = CNako3.findJSPluginFile(name, fromFile, __dirname, log)
        if (jspath2 === '') {
          throw new NakoImportError(`JSプラグイン『${name}』が見つかりません。コマンドラインで『npm install ${name}』を実行してみてください。以下のパスを検索しました。\n${log.join('\n')}`, token.file, token.line)
        }
        return { filePath: jspath2, type: 'js' }
      },
      readNako3: (name, token) => {
        const loader:any = { task: null }
        // ファイルかHTTPか
        if (name.startsWith('http://') || name.startsWith('https://')) {
          // Webのファイルを非同期で読み込む
          loader.task = (async () => {
            const res = await fetch(name)
            if (!res.ok) {
              throw new NakoImportError(`『${name}』からのダウンロードに失敗しました: ${res.status} ${res.statusText}`, token.file, token.line)
            }
            return await res.text()
          })()
        } else {
          // ファイルを非同期で読み込む
          // ファイルチェックだけ先に実行
          if (!fs.existsSync(name)) {
            throw new NakoImportError(`ファイル ${name} が存在しません。`, token.file, token.line)
          }
          loader.task = (new Promise((resolve, reject) => {
            fs.readFile(name, { encoding: 'utf-8' }, (err, data) => {
              if (err) { return reject(err) }
              resolve(data)
            })
          }))
        }
        // 非同期で読み込む
        return loader
      },
      readJs: (filePath, token) => {
        const loader: any = { task: null }
        if (isWindows()) {
          if (filePath.substring(1, 3) === ':\\') {
            filePath = 'file://' + filePath
          }
        }
        // + プラグインの読み込みタスクを生成する
        // | プラグインがWeb(https?://...)に配置されている場合
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
          // 動的 import が http 未対応のため、一度、Webのファイルを非同期で読み込んで/tmpに保存してから動的importを行う
          loader.task = (
            new Promise((resolve, reject) => {
              // 一時フォルダを得る
              const tempDir = getEnv('TEMP')
              const osTmpDir = isWindows() ? tempDir : '/tmp'
              const osTmpDir2 = (osTmpDir) || path.join('./tmp')
              const tmpDir = path.join(osTmpDir2, 'com.nadesi.v3.cnako')
              const tmpFile = path.join(tmpDir, filePath.replace(/[^a-zA-Z0-9_.]/g, '_'))
              if (!fs.existsSync(tmpDir)) { fs.mkdirSync(tmpDir, { recursive: true }) }
              // WEBからダウンロード
              fetch(filePath)
                .then((res: any) => {
                  return res.text()
                })
                .then((txt: string) => {
                  // ダウンロード
                  if (txt.indexOf('Failed to fetch') >= 0) {
                    const errFetch = new NakoImportError(`URL『${filePath}』のライブラリが存在しないか、指定のバージョンが間違っています。`, token.file, token.line)
                    reject(errFetch)
                  }
                  // 一時ファイルに保存
                  try {
                    fs.writeFileSync(tmpFile, txt, 'utf-8')
                  } catch (err) {
                    const err2 = new NakoImportError(`URL『${filePath}』からダウンロードしたJSファイルがキャッシュに書き込めません。${err}`, token.file, token.line)
                    reject(err2)
                  }
                })
                .then(() => {
                // 一時ファイルから読み込む
                  import(tmpFile).then((mod) => {
                  // プラグインは export default で宣言
                    const obj = Object.assign({}, mod)
                    resolve(() => {
                      return obj.default
                    })
                  }).catch((err) => {
                    const errS = '' + err
                    if (errS.indexOf('SyntaxError:') >= 0) {
                      const err2 = new NakoImportError(`URL『${filePath}』からダウンロードしたJSファイルに文法エラーがあります。${err}`, token.file, token.line)
                      reject(err2)
                    } else {
                      const err3 = new NakoImportError(`URL『${filePath}』からダウンロードしたはずのJSファイル読み込めません。${err}`, token.file, token.line)
                      reject(err3)
                    }
                  })
                })
                .catch((err: any) => {
                  const err2 = new NakoImportError(`URL『${filePath}』からJSファイルが読み込めません。${err}`, token.file, token.line)
                  reject(err2)
                })
            })
          )
          return loader
        }
        // | プラグインがファイル上に配置されている場合
        loader.task = (
          new Promise((resolve, reject) => {
            import(filePath).then((mod) => {
              // プラグインは export default で宣言
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
    }
    return tools
  }

  /** 『!「xxx」を取込』の処理 */
  async loadDependencies (code: string, filename: string, preCode: string) {
    const tools = this.getLoaderTools()
    await super._loadDependencies(code, filename, preCode, tools)
  }

  /**
   * 非同期でなでしこのコードを実行する
   */
  async runAsync (code: string, fname: string, options: CompilerOptions|undefined = undefined): Promise<NakoGlobal> {
    // オプション
    const opt = newCompilerOptions(options)
    // 取り込む文
    await this.loadDependencies(code, fname, opt.preCode)
    // 実行
    return await super.runAsync(code, fname, options)
  }

  /**
   * プラグインファイルの検索を行う
   * @param pname プラグインの名前
   * @param filename 取り込み元ファイル名
   * @param srcDir このファイルが存在するディレクトリ
   * @param log
   * @return フルパス、失敗した時は、''を返す
   */
  static findJSPluginFile (pname: string, filename: string, srcDir: string, log: string[] = []): string {
    log.length = 0
    const cachePath: {[key: string]: boolean} = {}
    /** キャッシュ付きでファイルがあるか検索 */
    const exists = (f: string): boolean => {
      // 同じパスを何度も検索することがないように
      if (cachePath[f]) { return cachePath[f] }
      try {
        // ファイルがないと例外が出る
        const stat = fs.statSync(f)
        const b = !!(stat && stat.isFile())
        cachePath[f] = b
        return b
      } catch (_e: any) {
        return false
      }
    }
    /** 普通にファイルをチェック */
    const fCheck = (pathTest: string, desc: string): boolean => {
      // 素直に指定されたパスをチェック
      const bExists = exists(pathTest)
      log.push(`- (${desc}) ${pathTest}, ${bExists}`)
      return bExists
    }
    /** 通常 + package.json のパスを調べる */
    const fCheckEx = (pathTest: string, desc: string): string => {
      // 直接JSファイルが指定された？
      if (/\.(js|mjs)$/.test(pathTest)) {
        if (fCheck(pathTest, desc)) { return pathTest }
      }
      // 指定パスのpackage.jsonを調べる
      const json = path.join(pathTest, 'package.json')
      if (fCheck(json, desc + '/package.json')) {
        // package.jsonを見つけたので、メインファイルを調べて取り込む (CommonJSモジュール対策)
        const jsonText = fs.readFileSync(json, 'utf-8')
        const obj = JSON.parse(jsonText)
        if (!obj.main) { return '' }
        const mainFile = path.resolve(path.join(pathTest, obj.main))
        return mainFile
      }
      return ''
    }

    // URL指定か?
    if (pname.substring(0, 8) === 'https://') {
      return pname
    }
    // 各パスを検索していく
    const p1 = pname.substring(0, 1)
    // フルパス指定か?
    if (p1 === '/' || pname.substring(1, 3).toLowerCase() === ':\\' || pname.substring(0, 6) === 'file:/') {
      const fileFullpath = fCheckEx(pname, 'フルパス')
      if (fileFullpath) { return fileFullpath }
      return '' // フルパスの場合別のフォルダは調べない
    }
    // 相対パスか?
    if (p1 === '.' || pname.indexOf('/') >= 0) {
      // 相対パス指定なので、なでしこのプログラムからの相対指定を調べる
      const pathRelative = path.join(path.resolve(path.dirname(filename)), pname)
      const fileRelative = fCheckEx(pathRelative, '相対パス')
      if (fileRelative) { return fileRelative }
      return '' // 相対パスの場合も別のフォルダは調べない
    }
    // plugin_xxx.mjs のようにファイル名のみが指定された場合のみ、いくつかのパスを調べる
    // 母艦パス(元ファイルと同じフォルダ)か?
    const testScriptPath = path.join(path.resolve(path.dirname(filename)), pname)
    const fileScript = fCheckEx(testScriptPath, '母艦パス')
    if (fileScript) { return fileScript }

    // ランタイムパス/src/<plugin>
    if (pname.match(/^plugin_[a-z0-9_]+\.mjs/)) {
      // cnako3mod.mjs は ランタイム/src に配置されていることが前提
      const pathRoot = path.resolve(__dirname, '..')
      const pathRuntimeSrc = path.join(pathRoot, 'src', pname)
      const fileRuntimeSrc = fCheckEx(pathRuntimeSrc, 'CNAKO3パス')
      if (fileRuntimeSrc) { return fileRuntimeSrc }
      // ランタイム/core/src/<plugin>
      const pathCore = path.join(pathRoot, 'core', 'src', pname)
      const fileCore = fCheckEx(pathCore, 'CNAKO3パス')
      if (fileCore) { return fileCore }
    }

    // 環境変数をチェック
    // 環境変数 NAKO_LIB か?
    const nako_lib = getEnv('NAKO_LIB')
    if (nako_lib) {
      const nako_lib_full = path.join(path.resolve(nako_lib), pname)
      const nako_lib_full2 = fCheckEx(nako_lib_full, 'NAKO_LIB')
      if (nako_lib_full2) { return nako_lib_full2 }
    }

    // ランタイムパス/node_modules/<plugin>
    const pathRuntime = path.join(path.dirname(path.resolve(__dirname)))
    const pathRuntimePname = path.join(pathRuntime, 'node_modules', pname)
    const fileRuntime = fCheckEx(pathRuntimePname, 'runtime')
    if (fileRuntime) { return fileRuntime }

    // ランタイムと同じ配置 | ランタイムパス/../<plugin>
    const runtimeLib = path.join(pathRuntime, '..', pname)
    const fileLib = fCheckEx(runtimeLib, 'runtimeLib')
    if (fileLib) { return fileLib }

    // nadesiko3core | ランタイムパス/node_modules/nadesiko3core/src/<plugin>
    const pathRuntimeSrc2 = path.join(pathRuntime, 'node_modules', 'nadesiko3core', 'src', pname) // cnako3mod.mjs は ランタイム/src に配置されていることが前提
    const fileRuntimeSrc2 = fCheckEx(pathRuntimeSrc2, 'nadesiko3core')
    if (fileRuntimeSrc2) { return fileRuntimeSrc2 }

    // 環境変数 NAKO_HOMEか?
    const nako_home = getEnv('NAKO_HOME')
    if (nako_home) {
      const nako_home_full = path.join(path.resolve(nako_home), 'node_modules', pname)
      const nako_home_full2 = fCheckEx(nako_home_full, 'NAKO_HOME')
      if (nako_home_full2) { return nako_home_full2 }
      // NAKO_HOME/src ?
      const pathNakoHomeSrc = path.join(nako_home, 'src', pname)
      const fileNakoHomeSrc = fCheckEx(pathNakoHomeSrc, 'NAKO_HOME/src')
      if (fileNakoHomeSrc) { return fileNakoHomeSrc }
    }
    // 環境変数 NODE_PATH (global) 以下にあるか？
    const node_path = getEnv('NODE_PATH')
    if (node_path) {
      const pathNode = path.join(path.resolve(node_path), pname)
      const fileNode = fCheckEx(pathNode, 'NODE_PATH')
      if (fileNode) { return fileNode }
    }
    // Nodeのパス検索には任せない(importで必ず失敗するので)
    return ''
  }
}
