import { CompilerOptions, NakoCompiler } from './nako3.mjs'
import { NakoColors } from './nako_colors.mjs'
import { NakoRuntimeError } from './nako_errors.mjs'
import { NakoGen } from './nako_gen.mjs'
import { NakoLogger } from './nako_logger.mjs'
import { FuncList } from './nako_types.mjs'

/**
 * コンパイルされたなでしこのプログラムで、グローバル空間のthisが指すオブジェクト
 */
export class NakoGlobal {
  __locals: {[key: string]: any};
  __varslist: {[key: string]: any}[];
  index: number;
  nextIndex: number;
  numFailures: number;
  __code: string[];
  __callstack: any[];
  __stack: any[];
  __labels: {[key: string]: any};
  __genMode: string;
  __module: {[key: string]: any};
  pluginfiles: {[key: string]: FuncList};
  gen: NakoGen;
  logger: NakoLogger;
  compiler: NakoCompiler;
  /**
   * @param compiler
   * @param gen
   */
  constructor (compiler: NakoCompiler, gen: NakoGen) {
    // ユーザーのプログラムから編集される変数
    this.__locals = {}
    this.__varslist = [
      { ...compiler.__varslist[0] }, // system
      { ...compiler.__varslist[1] }, // global
      { ...compiler.__varslist[2] } // local [2][3][4][5] ...
    ]
    this.numFailures = 0
    this.index = 0
    this.nextIndex = -1
    this.__code = []
    this.__callstack = []
    this.__stack = []
    this.__labels = []
    this.__genMode = gen.genMode

    // PluginSystemとdestroy()から参照するため
    this.__module = { ...compiler.__module } // shallow copy
    this.pluginfiles = { ...compiler.pluginfiles }

    // PluginWorkerでユーザー定義関数のJavaScriptコードをworkerのコンパイラのインスタンスへコピーするため
    this.gen = gen

    // 以下のメソッドで使うため
    this.logger = compiler.logger
    this.compiler = compiler
  }

  clearLog () {
    this.__varslist[0]['表示ログ'] = ''
  }

  get log () {
    let s = this.__varslist[0]['表示ログ']
    s = s.replace(/\s+$/, '')
    return s
  }

  /**
   * 「ナデシコ」命令のためのメソッド
   * @param {string} code
   * @param {string} fname
   * @param {CompilerOptions} opts
   * @param {string} [preCode]
   */
  runEx (code: string, fname: string, opts: CompilerOptions, preCode = '') {
    // スコープを共有して実行
    return this.compiler._runEx(code, fname, opts, preCode, this)
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
    this.logger.log(text)
  }

  /**
   * 毎プラグインの「!クリア」関数を実行
   */
  clearPlugins () {
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
