import { NakoSystem } from './plugin_api.mjs'

export default {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_promise', // プラグインの名前
      description: 'promise関連の命令を提供するプラグイン', // プラグインの説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako', 'cnako'], // 対象ランタイム
      nakoVersion: '^3.6.0' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      if ((sys as any).__promise == null) {
        (sys as any).__promise = {
          setLastPromise: function (promise: any) {
            sys.__setSysVar('そ', promise)
            return promise
          }
        }
      }
    }
  },
  // @非同期処理の保証の定数
  'そ': { type: 'const', value: '' }, // @そ
  // @非同期処理の保証
  '動時': { // @非同期処理を作成する。非同期処理オブジェクト(Promise)を返す。 // @うごくとき
    type: 'func',
    josi: [['を', 'で']],
    pure: true,
    fn: function (callback: any, sys: NakoSystem) {
      return (sys as any).__promise.setLastPromise(new Promise((resolve, reject) => {
        return callback(resolve, reject)
      }))
    },
    return_none: false
  },
  '成功時': { // @非同期処理で成功したときにcallbackが実行される。その際『対象』にデータが代入される。 // @せいこうしたとき
    type: 'func',
    josi: [['を'], ['の', 'が', 'に']],
    pure: true,
    fn: function (callback: any, promise: any, sys: NakoSystem) {
      return (sys as any).__promise.setLastPromise(promise.then((result:any) => {
        sys.__setSysVar('対象', result)
        return callback(result)
      }))
    },
    return_none: false
  },
  '処理時': { // @非同期処理で終了した時にcbFuncが実行される。引数と『対象』は、成功時は真とデータが設定され、失敗時は、偽と理由が設定される。 // @しょりしたとき
    type: 'func',
    josi: [['を'], ['の', 'が', 'に']],
    pure: true,
    fn: function (cbFunc: any, promise: any, sys: NakoSystem): any {
      return (sys as any).__promise.setLastPromise(promise.then((result: any) => {
        sys.__setSysVar('対象', result)
        return cbFunc(true, result, sys)
      }, (reason: any) => {
        sys.__setSysVar('対象', reason)
        return cbFunc(false, reason, sys)
      }))
    },
    return_none: false
  },
  '失敗時': { // @非同期処理で失敗したときにcallbackが実行される。その際『対象』に理由が代入される。 // @しっぱいしたとき
    type: 'func',
    josi: [['を'], ['の', 'が', 'に']],
    pure: true,
    fn: function (callback: any, promise: any, sys: NakoSystem): any {
      return (sys as any).__promise.setLastPromise(promise.catch((err: any) => {
        sys.__setSysVar('対象', err)
        return callback(err)
      }))
    },
    return_none: false
  },
  '終了時': { // @非同期処理で終了したときにcallbackが実行される。成功時・失敗時・処理時とは別に実行される。 // @しゅうりょうしたとき
    type: 'func',
    josi: [['を'], ['の', 'が', 'に']],
    pure: true,
    fn: function (callback: any, promise: any, sys: NakoSystem): any {
      return (sys as any).__promise.setLastPromise(promise.finally(() => {
        return callback()
      }))
    },
    return_none: false
  },
  '束': { // @非同期処理をまとめる。 // @たばねる
    type: 'func',
    josi: [['と', 'を']],
    isVariableJosi: true,
    pure: true,
    fn: function (...args:any): any {
      const sys = args.pop()
      return (sys).__promise.setLastPromise(Promise.all(args))
    },
    return_none: false
  }
}
