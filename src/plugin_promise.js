const PluginPromise = {
  // @非同期処理
  'そ': {type: 'const', value: ''}, // @そ
  // @非同期処理
  '動時': { // @非同期処理を作成する。非同期処理オブジェクト(Promise)を返す。 // @うごくとき
    type: 'func',
    josi: [['を', 'で']],
    pure: true,
    fn: function (callback, sys) {
      return sys.__promise.setLastPromise(new Promise((resolve, reject) => {
        return callback(resolve, reject)
      }))
    },
    return_none: false
  },
  '成功時': { // @非同期処理で成功したときにcallbackが実行される。その際『対象』にデータが代入される。 // @せいこうしたとき
    type: 'func',
    josi: [['を'], ['の', 'が', 'に']],
    pure: true,
    fn: function (callback, promise, sys) {
      return sys.__promise.setLastPromise(promise.then(result => {
        sys.__v0['対象'] = result
        return callback(result)
      }))
    },
    return_none: false
  },
  '処理時': { // @非同期処理で終了した時にcallbackが実行される。引数と『対象』は、成功時は真とデータが設定され、失敗時は、偽と理由が設定される。は偽が渡される。 // @しょりしたとき
    type: 'func',
    josi: [['を'], ['の', 'が', 'に']],
    pure: true,
    fn: function (callback, promise, sys) {
      return sys.__promise.setLastPromise(promise.then(result => {
        sys.__v0['対象'] = result
        return callback(true, result, sys)
      }, reason => {
        sys.__v0['対象'] = reason
        return callback(false, reason, sys)
      }))
    },
    return_none: false
  },
  '失敗時': { // @非同期処理で失敗したときにcallbackが実行される。その際『対象』にエラーが代入される。 // @しっぱいしたとき
    type: 'func',
    josi: [['を'], ['の', 'が', 'に']],
    pure: true,
    fn: function (callback, promise, sys) {
      return sys.__promise.setLastPromise(promise.catch(err => {
        sys.__v0['対象'] = err
        return callback(err)
      }))
    },
    return_none: false
  },
  '終了時': { // @非同期処理で終了したときにcallbackが実行される。成功時・失敗時・処理時とは別に実行される。 // @しゅうりょうしたとき
    type: 'func',
    josi: [['を'], ['の', 'が', 'に']],
    pure: true,
    fn: function (callback, promise, sys) {
      return sys.__promise.setLastPromise(promise.finally(() => {
        return callback()
      }))
    },
    return_none: false
  },
  '束': { // @非同期処理をまとめる。 // @たばねる
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    fn: function (...args) {
      sys = args.pop()
      return sys.__promise.setLastPromise(Promise.all(args))
    },
    return_none: false
  }
}

module.exports = PluginPromise
