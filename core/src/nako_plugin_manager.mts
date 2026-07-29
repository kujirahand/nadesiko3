// deno-lint-ignore-file no-explicit-any
/**
 * なでしこ3 のプラグイン管理
 *
 * NakoCompiler からプラグイン登録処理を分離したモジュール (#2360)
 * 循環参照を避けるため、このモジュールは nako3.mts を参照せず、
 * 必要な機能は NakoPluginHost インターフェイス経由で受け取る。
 */
import { FuncArgs, FuncList, FuncListItem, NakoVars } from './nako_types.mjs'
import { NakoLogger } from './nako_logger.mjs'

const cloneAsJSON = (x: any): any => JSON.parse(JSON.stringify(x))

/** プラグインが要求するランタイムの最低バージョン (= minor * 100 + patch) */
export const PLUGIN_MIN_VERSION_INT = 600

/** プラグインのメタ情報 */
export interface NakoPluginMeta {
  pluginName: string;
  nakoVersionResult?: boolean;
  nakoVersion: string;
  path?: string;
}

/**
 * NakoPluginManager がホスト(NakoCompiler)に要求する最小限の機能
 */
export interface NakoPluginHost {
  /** プラグインで定義された関数 + ユーザーが定義した関数。reset() で差し替わるため都度取得する */
  getFuncList (): FuncList;
  /** システム領域の変数 (= __varslist[0]) */
  getSysVars (): NakoVars;
  getLogger (): NakoLogger;
}

/**
 * プラグインの登録と、プラグインが定義した関数・変数・定数の管理を行うクラス
 */
export class NakoPluginManager {
  /** プラグインで定義された関数 (reset() でユーザー定義関数を消すときに使う) */
  readonly pluginFunclist: Record<string, FuncListItem>
  /** 取り込んだファイル一覧 */
  readonly pluginfiles: Record<string, any>
  /** プラグインで定義された定数・変数・関数の名前 */
  readonly commandlist: Set<string>
  /** requireなどで取り込んだモジュールの一覧 (NakoCompiler.__module と同一オブジェクト) */
  readonly modules: Record<string, Record<string, FuncListItem>>
  private host: NakoPluginHost

  constructor (host: NakoPluginHost) {
    this.host = host
    this.pluginFunclist = {}
    this.pluginfiles = {}
    this.commandlist = new Set()
    this.modules = {}
  }

  /**
   * プラグイン・オブジェクトを追加
   * @param po プラグイン・オブジェクト
   * @param persistent falseのとき、次以降の実行では使えない
   * @param fpath ファイルパス
   */
  addPlugin (po: {[key: string]: any}, persistent = true, fpath = ''): void {
    // __v0を取得
    const __v0 = this.host.getSysVars()
    // プラグインのメタ情報をチェック (#1034) (#1647)
    let __pluginInfo = __v0.get('__pluginInfo')
    if (!__pluginInfo) {
      __pluginInfo = {}
      __v0.set('__pluginInfo', __pluginInfo)
    }
    // メタ情報を読み取る
    const meta = this.readPluginMeta(po, fpath)
    let pluginName = meta.pluginName
    const metaValue = meta.metaValue
    // プラグイン名の重複を確認
    if (__pluginInfo[pluginName] !== undefined) {
      // プラグイン名が重複した場合はプラグインとして登録しない
      return
    }
    pluginName = NakoPluginManager.removeInvalidFilenameChars(pluginName)
    // プラグイン情報を記録
    __pluginInfo[pluginName] = metaValue
    // バージョンチェック
    pluginName = this.checkPluginVersion(pluginName, meta.intVersion, po, metaValue)
    // 初期化とクリアを変換する
    this.modules[pluginName] = po
    this.pluginfiles[pluginName] = '*'
    // `初期化`と`クリア`をチェック
    if (typeof (po['初期化']) === 'object') {
      const def = po['初期化']
      delete po['初期化']
      const initKey = `!${pluginName}:初期化`
      po[initKey] = def
    }
    // プラグインの値を、なでしこシステム変数(Map)にコピー
    this.registerPluginEntries(po, persistent, __v0)
  }

  /**
   * プラグインのメタ情報を読み取る
   * @param po プラグイン・オブジェクト
   * @param fpath ファイルパス
   */
  private readPluginMeta (po: {[key: string]: any}, fpath: string): { pluginName: string, intVersion: number, metaValue: NakoPluginMeta } {
    let intVersion = 0
    let pluginName = 'unknown'
    let metaValue: NakoPluginMeta = { pluginName: 'unknown', nakoVersionResult: true, nakoVersion: '0.0.0', path: '' }
    if (po.meta) {
      if (po.meta.value && typeof (po.meta) === 'object') {
        const meta = po.meta
        metaValue = meta.value || { pluginName: 'unknown', nakoVersion: '0.0.0' }
        pluginName = metaValue.pluginName || 'unknown'
        // version check
        const nakoVersion = (metaValue.nakoVersion || '0.0.0') + '.0.0'
        const versions = nakoVersion.split('.').map((v) => parseInt(v))
        intVersion = versions[1] * 100 + versions[2]
        // fpath
        metaValue.path = fpath
      }
    }
    // unknown の場合は、関数名からプラグイン名を自動生成する
    if (pluginName === 'unknown') {
      pluginName = Object.keys(po).join('-')
    }
    return { pluginName, intVersion, metaValue }
  }

  /**
   * プラグインが要求するランタイムのバージョンを確認する
   * @returns プラグイン名 (古い形式で名前が不明な場合は関数名から生成した名前)
   */
  private checkPluginVersion (pluginName: string, intVersion: number, po: {[key: string]: any}, metaValue: NakoPluginMeta): string {
    if (PLUGIN_MIN_VERSION_INT <= intVersion) { return pluginName }
    const keyStr: string = Object.keys(po).join(',')
    if (pluginName === 'unknown') {
      pluginName = keyStr.substring(0, 30) + '...'
    }
    if (pluginName !== '') {
      const errMsg = `なでしこプラグイン『${pluginName}』は古い形式なので正しく動作しない可能性があります。` +
        `(ランタイムの要求: ${PLUGIN_MIN_VERSION_INT}/プラグイン: ${intVersion})`
      console.warn(errMsg, 'see', 'https://github.com/kujirahand/nadesiko3/issues/1647')
      this.host.getLogger().warn(errMsg)
      metaValue.nakoVersionResult = false
    }
    return pluginName
  }

  /**
   * プラグインの値を、なでしこシステム変数(Map)にコピーする
   * @param po プラグイン・オブジェクト
   * @param persistent falseのとき、次以降の実行では使えない
   * @param __v0 システム領域の変数
   */
  private registerPluginEntries (po: {[key: string]: any}, persistent: boolean, __v0: NakoVars): void {
    const funclist = this.host.getFuncList()
    for (const key in po) {
      const v = po[key]
      funclist.set(key, v)
      if (persistent) {
        this.pluginFunclist[key] = cloneAsJSON(v)
      }
      if (v.type === 'func') {
        __v0.set(key, v.fn)
        if (v.asyncFn) { // asyncFn を正しく実行するために pure に変更する (core#142)
          v.pure = true
        }
      } else if (v.type === 'const' || v.type === 'var') {
        // メタ情報としての const | var は現在利用していない
        // meta[key] = { readonly: v.type === 'const' }
        __v0.set(key, v.value)
      } else {
        console.error('[プラグイン追加エラー]', v)
        throw new Error('プラグインの追加でエラー。')
      }
      // コマンドを登録するか?
      if (key === '初期化' || key.substring(0, 1) === '!') { // 登録しない関数名
        continue
      }
      this.commandlist.add(key)
    }
  }

  /**
   * Windowsのパスやファイル名に使えない文字列があると、JSファイル書き出しでエラーになるので置換する
   */
  static removeInvalidFilenameChars (str: string): string {
    return str.replace(/[^a-zA-z0-9\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\uF900-\uFAFF]/g, '_')
  }

  /**
   * プラグイン・オブジェクトを追加(ブラウザ向け)
   * @param objName オブジェクト名 (今後プラグイン名は、meta.value.pluginNameに指定する)
   * @param po 関数リスト
   * @param persistent falseのとき、次以降の実行では使えない
   */
  addPluginObject (objName: string, po: {[key: string]: any}, persistent = true): void {
    // metaプロパティがなければ互換性のため適当に追加
    if (po.meta === undefined) {
      po.meta = { type: 'const', value: { pluginName: objName, nakoVersion: '0.0.0' } }
    }
    this.addPlugin(po, persistent)
  }

  /**
   * プラグイン・ファイルを追加(Node.js向け)
   * @param fpath ファイルパス
   * @param po 登録するオブジェクト
   * @param persistent falseのとき、次以降の実行では使えない
   */
  addPluginFromFile (fpath: string, po: { [key: string]: any }, persistent = true): void {
    this.addPlugin(po, persistent, fpath)
  }

  /**
   * 関数を追加する
   * @param key 関数名
   * @param josi 助詞
   * @param fn 関数
   * @param returnNone 値を返す関数の場合はfalseを指定
   * @param asyncFn Promiseを返す関数かを指定
   */
  addFunc (key: string, josi: FuncArgs, fn: any, returnNone = true, asyncFn = false): void {
    const funcObj: FuncListItem = { josi, fn, type: 'func', return_none: returnNone, asyncFn, pure: true }
    this.host.getFuncList().set(key, funcObj)
    this.pluginFunclist[key] = cloneAsJSON(funcObj)
    this.host.getSysVars().set(key, fn)
  }

  /**
   * プラグイン関数を参照する
   * @param key プラグイン関数の関数名
   * @returns プラグイン・オブジェクト
   */
  getFunc (key: string): FuncListItem|undefined {
    return this.host.getFuncList().get(key)
  }

  /** プラグインで定義された定数・変数・関数の名前かどうかを返す */
  hasCommand (name: string): boolean {
    return this.commandlist.has(name)
  }

  /**
   * プラグイン由来の命令だけを含む関数一覧を新規に作る (reset() 用)
   * @param sysVars システム領域の変数 (= __varslist[0])
   */
  createFuncListFromPlugins (sysVars: NakoVars): FuncList {
    const funclist: FuncList = new Map()
    for (const name of sysVars.keys()) {
      const original = this.pluginFunclist[name] // record
      if (!original) {
        continue
      }
      funclist.set(name, cloneAsJSON(original))
    }
    return funclist
  }
}
