// deno-lint-ignore-file no-explicit-any
/**
 * なでしこ3 の「取り込み」文(require)に関する処理
 *
 * NakoCompiler から依存ファイルの読み込み処理を分離したモジュール (#2360)
 * 循環参照を避けるため、このモジュールは nako3.mts を参照せず、
 * 必要な機能は NakoRequireHost インターフェイス経由で受け取る。
 */
import { Token } from './nako_types.mjs'
import { NakoLexer } from './nako_lexer.mjs'
import { NakoImportError, NakoLexerError } from './nako_errors.mjs'
import { NakoLogger } from './nako_logger.mjs'

const cloneAsJSON = (x: any): any => JSON.parse(JSON.stringify(x))

/** インタプリタに「取り込み」文を追加するために用意するオブジェクト */
export interface LoaderToolTask<T> {
  task: Promise<T>;
}
export interface LoaderTool {
  // type: 'nako3' | 'js' | 'invalid' | 'mjs'
  resolvePath: (name: string, token: Token, fromFile: string) => { type: string, filePath: string };
  readNako3: (filePath: string, token: Token) => LoaderToolTask<string>;
  readJs: (filePath: string, token: Token) => LoaderToolTask<any>;
}

export interface DependenciesItem {
  tokens: Token[];
  alias: Set<string>;
  addPluginFile: () => void;
  funclist: any;
  moduleExport: any;
}
export type Dependencies = { [key:string]:DependenciesItem }

/** 取り込み文を処理する際に必要となるコード分割機能 */
export interface NakoRequireScanner {
  rawtokenize (code: string, line: number, filename: string, preCode?: string): Token[];
}

/**
 * NakoRequireLoader がホスト(NakoCompiler)に要求する最小限の機能
 */
export interface NakoRequireHost extends NakoRequireScanner {
  /** JSプラグインを登録する */
  addPluginFromFile (fpath: string, po: { [key: string]: any }, persistent?: boolean): void;
  getLogger (): NakoLogger;
  /** 名前空間(modList)を汚さずにトークン化するための一時的なコンパイラを作る */
  createScanner (): NakoRequireScanner;
  /** 非同期読み込みに失敗した回数を数える */
  countFailure (): void;
}

/**
 * ファイル内のrequire文の位置を列挙する。出力の配列はstartでソートされている。
 * @param {Token[]} tokens rawtokenizeの出力
 */
export function listRequireStatements (tokens: Token[]): Token[] {
  const requireStatements: Token[] = []
  for (let i = 0; i + 2 < tokens.length; i++) {
    // not (string|string_ex) '取り込み'
    if (!(tokens[i].type === 'not' &&
      (tokens[i + 1].type === 'string' || tokens[i + 1].type === 'string_ex') &&
      tokens[i + 2].value === '取込')) {
      continue
    }
    // 取り込むライブラリ
    let filename = String(tokens[i + 1].value) + ''
    // 全角コロン「：」を半角コロン「:」に正規化する（「貯蔵庫：」「拡張プラグイン：」の記法に対応 #2282）
    filename = filename.replace(/^(貯蔵庫|拡張プラグイン)：/, '$1:')
    // 『取り込む』文で「拡張プラグイン:」機構を追加する #139
    // (ex) !『貯蔵庫:ojyo-sama.nako3』を取り込む → https://n3s.nadesi.com/plain/ojyo-sama.nako3
    if (filename.startsWith('貯蔵庫:') || filename.startsWith('貯蔵庫：')) {
      filename = `https://n3s.nadesi.com/plain/${filename.substring(4)}`
    }
    // (ex) !『拡張プラグイン:music.js@1.0.2』を取り込む → https://cdn.jsdelivr.net/npm/nadesiko3-music@1.0.2/nadesiko3-music.js
    if (filename.startsWith('拡張プラグイン:') || filename.startsWith('拡張プラグイン：')) {
      const name = filename.substring('拡張プラグイン:'.length)
      const m = name.match(/^([a-zA-Z0-9_-]+)\.(js|mjs|nako3)(@[0-9.]+)?$/)
      if (m) {
        let basename = m[1]
        const ext = m[2]
        const version = m[3] || '@latest'
        if (ext === 'js' || ext === 'mjs') {
          // JSプラグイン
          if (!basename.startsWith('nadesiko3-')) {
            basename = `nadesiko3-${basename}`
          }
          filename = `https://cdn.jsdelivr.net/npm/${basename}${version}/${basename}.${ext}`
        } else {
          // なでしこ3プラグイン
          filename = `https://n3s.nadesi.com/plain/${basename}.${ext}`
        }
      } else {
        throw new NakoImportError('『取込』の指定エラー。『拡張プラグイン:(ファイル名).(js|nako3)(@ver)』の書式で指定してください。', tokens[i].file, tokens[i].line)
      }
    }
    // push
    requireStatements.push({
      ...tokens[i],
      start: i,
      end: i + 3,
      value: filename,
      firstToken: tokens[i],
      lastToken: tokens[i + 2]
    })
    i += 2
  }
  return requireStatements
}

/**
 * 「取り込み」文で指定された依存ファイルを読み込み、トークン列を置換するクラス
 */
export class NakoRequireLoader {
  /**
   * 取り込み文を置換するためのオブジェクト。
   * 正規化されたファイル名がキーになり、取り込み文の引数に指定された正規化されていないファイル名はaliasに入れられる。
   * JavaScriptファイルによるプラグインの場合、contentは空文字列。
   * funclistはシンタックスハイライトの高速化のために事前に取り出した、ファイルが定義する関数名のリスト。
   */
  dependencies: Dependencies
  private host: NakoRequireHost

  constructor (host: NakoRequireHost) {
    this.host = host
    this.dependencies = {}
  }

  /**
   * プログラムが依存するファイルを再帰的に取得する。
   * - 依存するファイルがJavaScriptファイルの場合、そのファイルを実行して評価結果をaddPluginFromFileに渡す。
   * - 依存するファイルがなでしこ言語の場合、ファイルの中身を取得して変数に保存し、再帰する。
   *
   * @param {string} code
   * @param {string} filename
   * @param {string} preCode
   * @param {LoaderTool} tools 実行環境 (ブラウザ or Node.js) によって外部ファイルの取得・実行方法は異なるため、引数でそれらを行う関数を受け取る。
   *  - resolvePath は指定した名前をもつファイルを検索し、正規化されたファイル名を返す関数。返されたファイル名はreadNako3かreadJsの引数になる。
   *  - readNako3は指定されたファイルの中身を返す関数。
   *  - readJsは指定したファイルをJavaScriptのプログラムとして実行し、`export default` でエクスポートされた値を返す関数。
   * @returns {Promise<unknown> | void}
   */
  load (code: string, filename: string, preCode: string, tools: LoaderTool): Promise<unknown>|void {
    const dependencies: Dependencies = {}
    const host = this.host
    // 名前空間(modList)を汚さないように、取り込み文の検出には別のコンパイラを使う
    const scanner = host.createScanner()
    /**
     * @param {any} item
     * @param {any} tasks
     */
    const loadJS = (item: any, tasks: any) => {
      // jsならプラグインとして読み込む。(ESMでは必ず動的に読む)
      const obj = tools.readJs(item.filePath, item.firstToken)
      tasks.push(obj.task.then((res: any) => {
        const pluginFuncs = res()
        host.addPluginFromFile(item.filePath, pluginFuncs)
        dependencies[item.filePath].funclist = pluginFuncs
        dependencies[item.filePath].moduleExport = {}
        dependencies[item.filePath].addPluginFile = () => { host.addPluginFromFile(item.filePath, pluginFuncs) }
      }))
    }
    const loadNako3 = (item: any, tasks: any) => {
      // nako3ならファイルを読んでdependenciesに保存する。
      const content = tools.readNako3(item.filePath, item.firstToken)
      const registerFile = (code: string) => {
        // シンタックスハイライトの高速化のために、事前にファイルが定義する関数名のリストを取り出しておく。
        // preDefineFuncはトークン列に変更を加えるため、事前にクローンしておく。
        // 「プラグイン名設定」を行う (#956)
        const modName = NakoLexer.filenameToModName(item.filePath)
        code = `『${modName}』に名前空間設定;『${modName}』にプラグイン名設定;` + code + ';名前空間ポップ;'
        const tokens = host.rawtokenize(code, 0, item.filePath)
        dependencies[item.filePath].tokens = tokens
        const funclist = new Map()
        const moduleexport = new Map()
        NakoLexer.preDefineFunc(cloneAsJSON(tokens), host.getLogger(), funclist, moduleexport)
        dependencies[item.filePath].funclist = funclist
        dependencies[item.filePath].moduleExport = moduleexport
        // 再帰
        return loadRec(code, item.filePath, '')
      }
      // 取り込み構文における問題を減らすため、必ず非同期でプログラムを読み込む仕様とした #1219
      tasks.push(content.task.then((res) => registerFile(res)))
    }
    const loadRec = (code: string, filename: string, preCode: string): Promise<unknown>|void => {
      const tasks: Promise<unknown>[] = []
      // 取り込みが必要な情報一覧を調べる(トークン分割して、取り込みタグを得る)
      const tags = listRequireStatements(scanner.rawtokenize(code, 0, filename, preCode))
      // パスを解決する
      const tagsResolvePath = tags.map((v) => ({ ...v, ...tools.resolvePath(v.value, v.firstToken as Token, filename) }))
      // 取り込み開始
      for (const item of tagsResolvePath) {
        // 2回目以降の読み込み
        // eslint-disable-next-line no-prototype-builtins
        if (dependencies.hasOwnProperty(item.filePath)) {
          dependencies[item.filePath].alias.add(item.value)
          continue
        }

        // 初回の読み込み
        dependencies[item.filePath] = { tokens: [], alias: new Set([item.value]), addPluginFile: ():void => {}, funclist: {}, moduleExport: {} }
        if (item.type === 'js' || item.type === 'mjs') {
          loadJS(item, tasks)
        } else if (item.type === 'nako3') {
          loadNako3(item, tasks)
        } else {
          throw new NakoImportError(`ファイル『${String(item.value)}』を読み込めません。ファイルが存在しないか未対応の拡張子です。`,
            (item.firstToken as Token).file, (item.firstToken as Token).line)
        }
      }
      if (tasks.length > 0) {
        return Promise.all(tasks)
      }
      return undefined
    }

    try {
      const result = loadRec(code, filename, preCode)

      // 非同期な場合のエラーハンドリング
      if (result !== undefined) {
        result.catch((err) => {
          // 読み込みに失敗したら処理を中断する
          host.getLogger().error(err.msg)
          host.countFailure()
        })
      }

      // すべてが終わってからthis.dependenciesに代入する。そうしないと、「実行」ボタンを連打した場合など、
      // load() が並列実行されるときに正しく動作しない。
      this.dependencies = dependencies
      return result
    } catch (err) {
      // 同期処理では素直に例外を投げる
      host.getLogger().error(String(err))
      throw err
    }
  }

  /**
   * 再帰的にrequire文を置換する。
   * .jsであれば削除し、.nako3であればそのファイルのトークン列で置換する。
   * @param {Token[]} tokens
   * @param {Set<string>} [includeGuard]
   * @returns {Token[]} 削除された取り込み文のトークン
   */
  replaceRequireStatements (tokens: Token[], includeGuard: Set<string> = new Set()): Token[] {
    const deletedTokens: Token[] = []
    for (const r of listRequireStatements(tokens).reverse()) {
      // C言語のinclude guardと同じ仕組みで無限ループを防ぐ。
      if (includeGuard.has(r.value)) {
        deletedTokens.push(...tokens.splice((r.start || 0), (r.end || 0) - (r.start || 0)))
        continue
      }
      const filePath = Object.keys(this.dependencies).find((key) => this.dependencies[key].alias.has(r.value))
      if (filePath === undefined) {
        if (!r.firstToken) { throw new Error(`ファイル『${String(r.value)}』が読み込まれていません。`) }
        throw new NakoLexerError(`ファイル『${String(r.value)}』が読み込まれていません。`,
          (r.firstToken).startOffset || 0,
          (r.firstToken).endOffset || 0,
          (r.firstToken).line, (r.firstToken).file)
      }
      this.dependencies[filePath].addPluginFile()
      const children = cloneAsJSON(this.dependencies[filePath].tokens)
      includeGuard.add(r.value)
      deletedTokens.push(...this.replaceRequireStatements(children, includeGuard))
      deletedTokens.push(...tokens.splice(r.start || 0, (r.end || 0) - (r.start || 0), ...children))
    }
    return deletedTokens
  }

  /**
   * replaceRequireStatementsのシンタックスハイライト用の実装。
   * @param {Token[]} tokens
   * @returns {Token[]} 削除された取り込み文のトークン
   */
  removeRequireStatements (tokens: Token[]): Token[] {
    const deletedTokens: Token[] = []
    for (const r of listRequireStatements(tokens).reverse()) {
      // プラグイン命令のシンタックスハイライトのために、addPluginFileを呼んで関数のリストをthis.dependencies[filePath].funclistに保存させる。
      const filePath = Object.keys(this.dependencies).find((key) => this.dependencies[key].alias.has(r.value))
      if (filePath !== undefined) {
        this.dependencies[filePath].addPluginFile()
      }

      // 全ての取り込み文を削除する。そうしないとトークン化に時間がかかりすぎる。
      deletedTokens.push(...tokens.splice(r.start || 0, (r.end || 0) - (r.start || 0)))
    }
    return deletedTokens
  }
}
