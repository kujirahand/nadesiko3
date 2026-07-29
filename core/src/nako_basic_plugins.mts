// deno-lint-ignore-file no-explicit-any
/**
 * なでしこ3のコアに同梱する基本プラグインの一覧
 *
 * NakoCompiler から基本プラグインのimportと登録順を分離したモジュール (#2360)
 */
import PluginSystem from './plugin_system.mjs'
import PluginMath from './plugin_math.mjs'
import PluginCSV from './plugin_csv.mjs'
import PluginPromise from './plugin_promise.mjs'
import PluginTOML from './plugin_toml.mjs'
import PluginTest from './plugin_test.mjs'

/** 基本プラグインを登録する対象 */
export interface NakoBasicPluginHost {
  addPlugin (po: {[key: string]: any}, persistent?: boolean, fpath?: string): void;
}

/**
 * コアに同梱する基本プラグインの一覧(この順に登録する)
 */
export const basicPlugins: {[key: string]: any}[] = [
  PluginSystem,
  PluginMath,
  PluginPromise,
  PluginTest,
  PluginCSV,
  PluginTOML
]

/**
 * 基本的なプラグインをコンパイラへ登録する
 * @param host 登録先のコンパイラ
 */
export function registerBasicPlugins (host: NakoBasicPluginHost): void {
  for (const po of basicPlugins) {
    host.addPlugin(po)
  }
}
