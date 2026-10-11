/** JavaScript固有の連携命令。cnako/wnakoで標準登録する (#2577)。 */
import { NakoSystem } from '../core/src/plugin_api.mjs'

const PluginJS = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_js',
      description: 'JavaScriptとの連携命令を提供するプラグイン',
      pluginVersion: '3.8.9',
      nakoRuntime: ['wnako', 'cnako'],
      nakoVersion: '3.8.9'
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: false,
    fn: function(sys: NakoSystem) {
      // eval function #1733
      sys.__evalSafe = (src: string) => {
        // evalのスコープを変えるためのテクニック
        // https://esbuild.github.io/content-types/#direct-eval

        const _eval = eval // oxlint-disable-line no-eval
        try {
          return _eval(src)
        } catch (e) {
          console.warn('[eval]', e)
          return null
        }
      }
      // eval function #1733 - 互換性を優先するため、direct evalを使うことに
      sys.__evalJS = (src: string, sys?: NakoSystem) => {
        try {
          // まず従来通りevalで評価（式の値を返す互換性を維持）
          return eval(src) // oxlint-disable-line no-eval
        } catch (e) {
          // return文によるSyntaxErrorの場合のみIIFEで再試行 (#NE-006)
          if (e instanceof SyntaxError && e.message.includes('return')) {
            try {
              return (new Function('sys', `return (function(sys){\n${src}\n})(sys)`))(sys)
            } catch (e2) {
              console.warn('[eval]', e2)
              return null
            }
          }
          console.warn('[eval]', e)
          return null
        }
      }
    }
  },

  // @JavaScript連携
  'JS実行': { // @JavaScriptのコードSRCを実行する(変数sysでなでしこシステムを参照できる) // @JSじっこう
    type: 'func',
    josi: [['を', 'で']],
    pure: true,
    fn: function(src: string, sys: NakoSystem) {
      return sys.__evalJS(src, sys) // #1733
    }
  },
  'JSオブジェクト取得': { // @なでしこで定義した関数や変数nameのJavaScriptオブジェクトを取得する // @JSおぶじぇくとしゅとく
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function(name: string, sys: any) {
      return sys.__findVar(name, null)
    }
  },
  'JS関数実行': { // @JavaScriptの関数NAMEを引数ARGS(配列)で実行する // @JSかんすうじっこう
    type: 'func',
    josi: [['を'], ['で']],
    fn: function(name: any, args: any, sys: NakoSystem) {
      // nameが文字列ならevalして関数を得る

      if (typeof name === 'string') { name = sys.__evalJS(name, sys) }
      if (typeof name !== 'function') { throw new Error('JS関数取得で実行できません。') }

      // argsがArrayでなければArrayに変換する
      if (!(args instanceof Array)) { args = [args] }

      // 実行
      // eslint-disable-next-line prefer-spread
      return name.apply(null, args)
    }
  },
  'AWAIT実行': { // @JavaScriptの非同期関数(Promise/async関数)のFを引数ARGSでawait実行する // @AWAITじっこう
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    asyncFn: true,
    fn: async function(f: any, args: any, sys: any) {
      // nameが文字列ならevalして関数を得る
      if (typeof f === 'string') { f = sys.__findFunc(f, 'AWAIT実行') }
      if (!(f instanceof Function)) { throw new Error('『AWAIT実行』の第一引数はなでしこ関数名かFunction型で指定してください。') }
      // argsがArrayでなければArrayに変換する
      if (!(args instanceof Array)) { args = [args] }
      // 実行
      return await f(...args)
    }
  },
  'JSメソッド実行': { // @JavaScriptのオブジェクトOBJのメソッドMを引数ARGS(配列)で実行する // @JSめそっどじっこう
    type: 'func',
    josi: [['の'], ['を'], ['で']],
    fn: function(obj: any, m: any, args: any, sys: NakoSystem) {
      // objが文字列ならevalして関数を得る

      if (typeof obj === 'string') { obj = sys.__evalJS(obj, sys) }
      if (typeof obj !== 'object') { throw new Error('JSオブジェクトを取得できませんでした。') }

      // method を求める
      if (typeof m !== 'function') {
        m = obj[m]
      }

      // argsがArrayでなければArrayに変換する
      if (!(args instanceof Array)) { args = [args] }

      // 実行
      return m.apply(obj, args)
    }
  },

}

export default PluginJS
