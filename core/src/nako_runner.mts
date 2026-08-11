// deno-lint-ignore-file no-explicit-any
/**
 * なでしこ3のプログラム実行部
 *
 * NakoCompiler から実行系(evalJS / runSync / runAsync など)を分離したモジュール (#2360)
 * 循環参照を避けるため、このモジュールは nako3.mts を参照せず、
 * 必要な機能は NakoRunnerHost インターフェイス経由で受け取る。
 */
import { CompilerOptions, NakoComEventName } from './nako_types.mjs'
import { NakoLexer } from './nako_lexer.mjs'
import { NakoLogger } from './nako_logger.mjs'
import { NakoGlobal } from './nako_global.mjs'
import { NakoGen, NakoGenResult } from './nako_gen.mjs'

/** Promise互換のthenableか判定 */
function isThenable (value: unknown): value is PromiseLike<unknown> {
  if (value === null) { return false }
  if (typeof value !== 'object' && typeof value !== 'function') { return false }
  return typeof (value as { then?: unknown }).then === 'function'
}

/** コンパイラ実行オプションを生成 */
export function newCompilerOptions (initObj: Partial<CompilerOptions> = {}): CompilerOptions {
  if (initObj === null || typeof initObj !== 'object') { initObj = {} }
  initObj.testOnly = initObj.testOnly || false
  initObj.resetEnv = initObj.resetEnv || false
  initObj.resetAll = initObj.resetAll || false
  initObj.preCode = initObj.preCode || ''
  initObj.nakoGlobal = initObj.nakoGlobal || null
  return initObj as CompilerOptions
}

/**
 * NakoRunner がホスト(NakoCompiler)に要求する最小限の機能
 */
export interface NakoRunnerHost {
  /** なでしこのプログラムをコンパイルする */
  compileFromCode (code: string, filename: string, options?: CompilerOptions): NakoGenResult;
  /** 実行環境(NakoGlobal)を生成する */
  createNakoGlobal (gen: NakoGen, guid: number): NakoGlobal;
  getLogger (): NakoLogger;
  /** コンパイラのイベントを発火する */
  fireEvent (eventName: NakoComEventName, event: any): void;
}

/**
 * コンパイル済みのJavaScriptを実行し、実行環境(NakoGlobal)を管理するクラス
 */
export class NakoRunner {
  /** 生成した NakoGlobal のインスタンスを保持 */
  globals: NakoGlobal[]
  /** 現在の NakoGlobal オブジェクト */
  currentGlobal: NakoGlobal|null
  private host: NakoRunnerHost

  constructor (host: NakoRunnerHost) {
    this.host = host
    this.globals = []
    this.currentGlobal = null
  }

  /** 各プラグインをリセットする */
  clearPlugins (): void {
    // 他に実行している「なでしこ」があればクリアする
    this.globals.forEach((sys: NakoGlobal) => {
      if (!sys) { return }
      // core #56
      sys.__setSysVar('__forceClose', true)
      sys.reset()
    })
    this.globals = [] // clear
  }

  /**
   * 環境を指定してJavaScriptのコードを実行する
   * @param code JavaScriptのコード
   * @param nakoGlobal 実行環境
   * @param waitForAsyncCompletion 非同期処理の完了後にfinishを発火するか
   */
  evalJS (code: string, nakoGlobal: NakoGlobal, waitForAsyncCompletion = false): unknown {
    this.currentGlobal = nakoGlobal // 現在のnakoGlobalを記録
    this.currentGlobal.lastJSCode = code
    // 実行前に環境を初期化するイベントを実行(beforeRun)
    this.host.fireEvent('beforeRun', nakoGlobal)
    let result: unknown
    try {
      const f = new Function(nakoGlobal.lastJSCode)
      result = f.apply(nakoGlobal)
    } catch (err: any) {
      // なでしこコードのエラーは抑止してログにのみ記録
      nakoGlobal.numFailures++
      this.host.getLogger().error(err)
      throw err
    }
    // runAsyncからの呼び出しではthenableの成功・失敗を問わず完了後に発火する
    if (waitForAsyncCompletion && isThenable(result)) {
      return Promise.resolve(result).finally(() => {
        this.host.fireEvent('finish', nakoGlobal)
      })
    }
    // runSyncでは非同期プログラムでも従来通り、この場で発火する
    this.host.fireEvent('finish', nakoGlobal)
    return result
  }

  /**
   * (非推奨) 同期的になでしこのプログラムcodeを実行する
   * @param code なでしこのプログラム
   * @param filename ファイル名
   * @param options オプション
   * @returns 実行に利用したグローバルオブジェクト
   * @remarks 非同期プログラムでは完了を待たず、従来通り実行中のPromiseを破棄する。
   * @deprecated 代わりにrunAsyncメソッドを使ってください。(core #52)
   */
  runSync (code: string, filename: string, options: CompilerOptions|undefined = undefined): NakoGlobal {
    // コンパイル
    options = newCompilerOptions(options)
    const out = this.host.compileFromCode(code, filename, options)
    // 実行前に環境を生成
    const nakoGlobal = this.getNakoGlobal(options, out.gen, filename)
    // 実行
    this.evalJS(out.runtimeEnv, nakoGlobal)
    return nakoGlobal
  }

  /**
   * 非同期になでしこのプログラムcodeを実行する
   * @param code なでしこのプログラム
   * @param filename ファイル名
   * @param options オプション
   * @returns 実行に利用したグローバルオブジェクト
   */
  async runAsync (code: string, filename: string, options: CompilerOptions|undefined = undefined): Promise<NakoGlobal> {
    // コンパイル
    options = newCompilerOptions(options)
    const compiledCode = this.host.compileFromCode(code, filename, options)
    // 実行前に環境を生成
    const nakoGlobal = this.getNakoGlobal(options, compiledCode.gen, filename)
    // 実行
    await this.evalJS(compiledCode.runtimeEnv, nakoGlobal, true)
    return nakoGlobal
  }

  /** 実行環境(NakoGlobal)を取得する。指定が無ければ前回の値を再利用する */
  getNakoGlobal (options: CompilerOptions, gen: NakoGen, filename: string): NakoGlobal {
    // オプションを参照
    let g: NakoGlobal|null = options.nakoGlobal
    if (!g) {
      // 空ならば前回の値を参照(リセットするなら新規で作成する)
      if (this.globals.length > 0 && options.resetAll === false && options.resetEnv === false) {
        g = this.globals[this.globals.length - 1]
      } else {
        g = this.host.createNakoGlobal(gen, this.globals.length + 1)
      }
      // 名前空間を設定
      g.__varslist[0].set('名前空間', NakoLexer.filenameToModName(filename))
    }
    if (this.globals.indexOf(g) < 0) { this.globals.push(g) }
    return g
  }

  /**
   * (非推奨) 同期的になでしこのプログラムcodeを実行する
   * @deprecated 代わりにrunAsyncメソッドを使ってください。(core #52)
   */
  runEx (code: string, filename: string, opts: CompilerOptions, preCode = '', nakoGlobal: NakoGlobal|undefined = undefined): NakoGlobal {
    // コンパイル
    opts.preCode = preCode
    if (nakoGlobal) { opts.nakoGlobal = nakoGlobal }
    return this.runSync(code, filename, opts)
  }

  /**
   * (非推奨) 非同期でなでしこのプログラムを実行する
   * @deprecated 代わりにrunAsyncメソッドを使ってください。(core #52)
   */
  async run (code: string, fname: string, isReset: boolean, isTest: boolean, preCode = ''): Promise<NakoGlobal> {
    const opts: CompilerOptions = newCompilerOptions({
      resetEnv: isReset,
      resetAll: isReset,
      testOnly: isTest,
      preCode
    })
    return this.runEx(code, fname, opts)
  }

  /**
   * (非推奨) なでしこのプログラムを実行（他に実行しているインスタンスもリセットする)
   */
  async runReset (code: string, fname = 'main.nako3', preCode = ''): Promise<NakoGlobal> {
    const opts = newCompilerOptions({ resetAll: true, resetEnv: true, preCode })
    return this.runAsync(code, fname, opts)
  }

  /**
   * テストを実行する
   * @param code
   * @param fname
   * @param preCode
   * @param testOnly
   */
  test (code: string, fname: string, preCode = '', testOnly = false): NakoGlobal {
    const options = newCompilerOptions()
    options.preCode = preCode
    options.testOnly = testOnly
    return this.runSync(code, fname, options)
  }
}
