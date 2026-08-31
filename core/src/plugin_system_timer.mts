/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * タイマー処理の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
import { NakoRuntimeError } from './nako_errors.mjs'
import { NakoSystem } from './plugin_api.mjs'

export default {
  // @タイマー
  '秒待': { // @ N秒の間待機する // @びょうまつ
    type: 'func',
    josi: [['']],
    pure: true,
    asyncFn: true,
    fn: function(n: any, sys:any): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          // タイマーを仕掛ける
          const timerId = setTimeout(() => {
            // タイマー使用中リストに追加したIDを削除
            const i = sys.__timeout.indexOf(timerId)
            if (i >= 0) { sys.__timeout.splice(i, 1) }
            // Promiseを終了
            resolve()
          }, parseFloat(n) * 1000)
          // タイマー使用中リストに追加
          sys.__timeout.push(timerId)
        } catch (err: any) {
          reject(err)
        }
      })
    },
    return_none: true
  },
  '秒待機': { // @ N秒の間待機する(『秒待』と同じ) // @びょうたいき
    type: 'func',
    josi: [['']],
    pure: true,
    asyncFn: true,
    fn: async function(n: any, sys: any) {
      const p = sys.__exec('秒待', [n, sys])
      return await p
    },
    return_none: true
  },
  '秒後': { // @無名関数（あるいは、文字列で関数名を指定）FをN秒後に実行する。変数『対象』にタイマーIDを代入する。 // @びょうご
    type: 'func',
    josi: [['を'], ['']],
    pure: true,
    fn: function(f: any, n: any, sys: any) {
      // 文字列で指定された関数をオブジェクトに変換
      if (typeof f === 'string') { f = sys.__findFunc(f, '秒後') }
      // 1回限りのタイマーをセット
      const timerId = setTimeout(() => {
        // 使用中リストに追加したIDを削除
        const i = sys.__timeout.indexOf(timerId)
        if (i >= 0) { sys.__timeout.splice(i, 1) }
        try {
          f(timerId, sys)
        } catch (e: any) {
          let err = e
          if (!(e instanceof NakoRuntimeError)) {
            err = new NakoRuntimeError(e, sys.__getSysVar('__line'))
          }
          sys.logger.error(err)
        }
      }, parseFloat(n) * 1000)
      sys.__timeout.unshift(timerId)
      sys.__setSysVar('対象', timerId)
      return timerId
    }
  },
  '秒毎': { // @無名関数（あるいは、文字列で関数名を指定）FをN秒ごとに実行する(『タイマー停止』で停止できる)。変数『対象』にタイマーIDを代入する。 // @びょうごと
    type: 'func',
    josi: [['を'], ['']],
    pure: false,
    fn: function(f: any, n: any, sys: any) {
      // 文字列で指定された関数をオブジェクトに変換
      if (typeof f === 'string') { f = sys.__findFunc(f, '秒毎') }
      // タイマーをセット
      const timerId = setInterval(() => {
        f(timerId, sys)
      }, parseFloat(n) * 1000)
      // タイマーIDを追加
      sys.__interval.unshift(timerId)
      sys.__setSysVar('対象', timerId)
      return timerId
    }
  },
  '秒タイマー開始時': { // @無名関数（あるいは、文字列で関数名を指定）FをN秒ごとに実行する(『秒毎』と同じ) // @びょうたいまーかいししたとき
    type: 'func',
    josi: [['を'], ['']],
    pure: false,
    fn: function(f: any, n: any, sys: any) {
      return sys.__exec('秒毎', [f, n, sys])
    }
  },
  'タイマー停止': { // @『秒毎』『秒後』や『秒タイマー開始』で開始したタイマーを停止する // @たいまーていし
    type: 'func',
    josi: [['の', 'で']],
    pure: true,
    fn: function(timerId: any, sys: any) {
      const i = sys.__interval.indexOf(timerId)
      if (i >= 0) {
        sys.__interval.splice(i, 1)
        clearInterval(timerId)
        return true
      }
      const j = sys.__timeout.indexOf(timerId)
      if (j >= 0) {
        sys.__timeout.splice(j, 1)
        clearTimeout(timerId)
        return true
      }
      return false
    },
    return_none: false
  },
  '全タイマー停止': { // @『秒毎』『秒後』や『秒タイマー開始』で開始したタイマーを全部停止する // @ぜんたいまーていし
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      // clearInterval
      for (let i = 0; i < sys.__interval.length; i++) {
        const timerId = sys.__interval[i]
        clearInterval(timerId)
      }
      sys.__interval = []
      // clearTimeout
      for (let i = 0; i < sys.__timeout.length; i++) {
        const timerId = sys.__timeout[i]
        clearTimeout(timerId)
      }
      sys.__timeout = []
    },
    return_none: true
  },
}
