import PluginJS from '../../../src/plugin_js.mjs'

// 共通命令はコアだけで検証し、JS連携を使うテストコードにだけプラグインを登録する。
export function registerJSForTest (compiler, code) {
  if (/JS実行|JS関数実行|JSメソッド実行|JSオブジェクト取得|AWAIT実行|JS:/.test(code)) {
    compiler.addPlugin(PluginJS)
  }
}
