const PluginPromise = {
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (sys.__promise == null) {
        sys.__promise = {
          clearTimeoutAll: function () {
            for (const t of this.__timeoutList) { clearTimeout(t) }
          },
          clearTimeoutById: function (timerId) {
            const i = this.__timeoutList.indexOf(timerId)
            if (i >= 0) {this.__timeoutList.splice(i, 1)}
          },
          addTimeoutId: function (timerId) {
            this.__timeoutList.unshift(timerId)
          },
          setLastPromise: function (promise) {
            sys.__v0['そ'] = promise
            return promise
          }
        }
      }
      sys.__promise.__timeoutList = []
    }
  },
  '!クリア': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      if (sys.__promise == null) {return}
      sys.__promise.clearTimeoutAll()
    }
  },
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
  },

  // @非同期処理/システム系入れ替え
  '秒後': { // @N秒後に成功する非同期処理オブジェクト(Promise)を作成する // @びょうご
    type: 'func',
    josi: [['']],
    pure: true,
    fn: function (n, sys) {
      return new Promise(resolve => {
        // 1回限りのタイマーをセット
        const timerId = setTimeout(() => {
          // 使用中リストから完了したIDを削除
          sys.__promise.clearTimeoutById(timerId)
          resolve(timerId)
        }, parseFloat(n) * 1000)
        // 使用中リストに開始したIDを追加
        sys.__promise.addTimeoutId(timerId)
      })
    },
    return_none: false
  },
  // @非同期処理/ajax系入れ替え
  'AJAX送信': { // @非同期通信(Ajax)でURLにデータの送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @AJAXそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    fn: function (url, sys) {
      let options = sys.__v0['AJAXオプション']
      if (options === '') {options = {method: 'GET'}}
      return fetch(url, options)
    },
    return_none: false
  },
  'HTTP取得': { // @非同期通信(Ajax)でURLにデータの送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @HTTPしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    pure: true,
    fn: function (url, sys) {
      return sys.__exec('AJAX送信', [url, sys])
    },
    return_none: false
  },
  'POST送信': { // @非同期通信(Ajax)でURLにPARAMSをPOST送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @POSTそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url, params, sys) {
      let bodyData = sys.__exec('POSTデータ生成', [params, sys])
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData
      }
      return fetch(url, options)
    },
    return_none: false
  },
  'POSTフォーム送信': { // @非同期通信(Ajax)でURLにPARAMSをフォームとしてPOST送信を開始する非同期処理オブジェクト(Promise)を作成する。  // @POSTふぉーむそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url, params, sys) {
      const fd = new FormData()
      for (let key in params)
        {fd.set(key, params[key])}

      let options = {
        method: 'POST',
        body: fd
      }
      return fetch(url, options)
    },
    return_none: false
  },
  '内容取得': { // @非同期通信(Ajax)の応答から内容を指定した形式で取り出すための非同期処理オブジェクト(Promise)を返す。  // @内容取り出す
    type: 'func',
    josi: [['から'], ['で']],
    pure: true,
    fn: function (res, type, sys) {
      type = type.toString().toUpperCase()
      if (type === 'TEXT' || type === 'テキスト') {
        return res.text()
      } else
      if (type === 'JSON') {
        return res.json()
      } else
      if (type === 'BLOB') {
        return res.blob()
      } else
      if (type === 'ARRAY' || type === '配列') {
        return res.arrayBuffer()
      } else
      if (type === 'BODY' || type === '本体') {
        return res.body
      }
      return res.body()
    },
    return_none: false
  }  
}

if (typeof global === 'object' && typeof global.module !== 'undefiled') {
  module.exports = PluginPromise
}
// scriptタグで取り込んだ時、自動で登録する
/* istanbul ignore else */
if (typeof (navigator) === 'object' && typeof (navigator.nako3) === 'object') 
  {navigator.nako3.addPluginObject('PluginPromise', PluginPromise)}



