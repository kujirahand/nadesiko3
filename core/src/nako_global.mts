import { NakoCompiler } from './nako3.mjs'
import { NakoColors } from './nako_colors.mjs'
import { NakoGen } from './nako_gen.mjs'
import { NakoLogger } from './nako_logger.mjs'
import { CompilerOptions, NakoVars } from './nako_types.mjs'

/**
 * コンパイルされたなでしこのプログラムで、グローバル空間のthisが指すオブジェクト
 */
export class NakoGlobal {
  guid: number
  version: string
  coreVersion: string
  __locals: NakoVars
  __varslist: NakoVars[]
  __code: string[]
  __callstack: any[]
  __stack: any[]
  __labels: {[key: string]: any}
  __genMode: string
  __module: {[key: string]: any}
  pluginfiles: Record<string, any>
  index: number
  nextIndex: number
  numFailures: number
  gen: NakoGen
  logger: NakoLogger
  compiler: NakoCompiler
  lastJSCode: string
  public josiList: string[]
  public reservedWords: string[]
  /**
   * @param compiler
   * @param gen
   */
  constructor (compiler: NakoCompiler, gen: NakoGen, guid = 0) {
    this.guid = guid
    this.lastJSCode = ''
    // ユーザーのプログラムから編集される変数
    this.__locals = new Map()
    this.__varslist = [
      compiler.newVaiables(compiler.__varslist[0]), // system
      compiler.newVaiables(compiler.__varslist[1]), // global
      compiler.newVaiables(compiler.__varslist[2]) // local [2][3][4][5] ...
    ]
    this.numFailures = 0
    this.index = 0
    this.nextIndex = -1
    this.__code = []
    this.__callstack = []
    this.__stack = []
    this.__labels = []
    this.__genMode = gen.genMode

    // バージョン情報の引き継ぎ
    this.version = compiler.version
    this.coreVersion = compiler.coreVersion

    // PluginSystemとdestroy()から参照するため
    this.__module = { ...compiler.__module } // shallow copy
    this.pluginfiles = { ...compiler.getPluginfiles() }

    // PluginWorkerでユーザー定義関数のJavaScriptコードをworkerのコンパイラのインスタンスへコピーするため
    this.gen = gen

    // 以下のメソッドで使うため
    this.logger = compiler.getLogger()
    this.compiler = compiler
    this.josiList = compiler.josiList
    this.reservedWords = compiler.reservedWords
  }

  clearLog () {
    this.__varslist[0].set('表示ログ', '')
  }

  get log () {
    let s = this.__varslist[0].get('表示ログ')
    s = s.replace(/\s+$/, '')
    return s
  }

  /**
   * システム変数を設定する
   * @param name システム変数名
   * @param value 設定したい値
   */
  __setSysVar (name: string, value: any) {
    this.__varslist[0].set(name, value)
  }

  /**
   * システム変数を取得する
   * @param name システム変数名
   * @returns システム変数の値
   */
  __getSysVar (name: string): any {
    return this.__varslist[0].get(name)
  }

  /**
   * 「ナデシコ」命令のためのメソッド
   */
  runEx (code: string, fname: string, opts: CompilerOptions, preCode = ''): NakoGlobal {
    // スコープを共有して実行
    opts.preCode = preCode
    opts.nakoGlobal = this
    return this.compiler.runSync(code, fname, opts)
  }

  async runAsync (code: string, fname: string, opts: CompilerOptions, preCode = ''): Promise<NakoGlobal> {
    // スコープを共有して実行
    opts.preCode = preCode
    opts.nakoGlobal = this
    return await this.compiler.runAsync(code, fname, opts)
  }

  /**
   * テスト実行のためのメソッド
   * @param {{ name: string, f: () => void }[]} tests
   */
  _runTests (tests: {name: string, f: () => void }[]): void {
    let text = `${NakoColors.color.bold}テストの実行結果${NakoColors.color.reset}\n`
    let pass = 0
    let numFailures = 0
    for (const t of tests) {
      try {
        t.f()
        text += `${NakoColors.color.green}✔${NakoColors.color.reset} ${t.name}\n`
        pass++
      } catch (err: any) {
        text += `${NakoColors.color.red}☓${NakoColors.color.reset} ${t.name}: ${err.message}\n`
        numFailures++
      }
    }
    if (numFailures > 0) {
      text += `${NakoColors.color.green}成功 ${pass}件 ${NakoColors.color.red}失敗 ${numFailures}件`
    } else {
      text += `${NakoColors.color.green}成功 ${pass}件`
    }
    this.numFailures = numFailures
    this.logger.stdout(text)
  }

  /**
   * 毎プラグインの「!クリア」関数を実行
   */
  clearPlugins () {
    // 実行している関数をすべて終了させる
    // プラグインのクリア関数を呼び出す
    const clearName = '!クリア'
    for (const pname in this.pluginfiles) {
      const po = this.__module[pname]
      if (po[clearName] && po[clearName].fn) {
        po[clearName].fn(this)
      }
    }
  }

  /**
   * 各種リセット処理
   */
  reset () {
    this.clearPlugins()
  }

  destroy () {
    this.reset()
  }
}
