// @ts-nocheck
/* eslint-disable quote-props */
export default {
  // @AJAXとHTTP
  'AJAX送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。『AJAXオプション』を指定できる。 // @AJAXそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    pure: true,
    fn: function (callback, url, sys) {
      let options = sys.__v0['AJAXオプション']
      if (options === '') { options = { method: 'GET' } }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        if (sys.__genMode === '非同期モード') { sys.newenv = true }
        callback(text, sys)
      }).catch(err => {
        console.log('[fetch.error]', err)
        sys.__v0['AJAX:ONERROR'](err)
      })
    },
    return_none: true
  },
  'AJAX受信': { // @ (非推奨)『AJAXテキスト取得』をご利用ください。-「!非同期モード」で非同期通信(Ajax)でURLからデータを受信する。『AJAXオプション』を指定できる。結果は変数『対象』に入る// @AJAXじゅしん
    type: 'func',
    josi: [['から', 'を']],
    pure: true,
    fn: function (url, sys) {
      if (sys.__genMode !== '非同期モード') {
        throw new Error('『AJAX受信』を使うには、プログラムの冒頭で「!非同期モード」と宣言してください。')
      }
      const sysenv = sys.setAsync(sys)
      let options = sys.__v0['AJAXオプション']
      if (options === '') { options = { method: 'GET' } }
      // fetch 実行
      fetch(url, options).then(res => {
        if (res.ok) { // 成功したとき
          return res.text()
        } else { // 失敗したとき
          throw new Error('status=' + res.status)
        }
      }).then(text => {
        sys.__v0['対象'] = text
        sys.compAsync(sys, sysenv)
      }).catch(err => {
        console.error('[AJAX受信のエラー]', err)
        sys.__errorAsync(err, sys)
      })
    },
    return_none: true
  },
  'AJAX受信時': { // @非同期通信(Ajax)を利用してURLからデータを受信した時callbackが実行される。その際『対象』にデータが代入される。『AJAXオプション』を指定できる。 // @AJAXじゅしんしたとき
    type: 'func',
    josi: [['で'], ['から', 'を']],
    pure: true,
    fn: function (callback, url, sys) {
      sys.__exec('AJAX送信時', [callback, url, sys])
    },
    return_none: true
  },
  'GET送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @GETそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    pure: false,
    fn: function (callback, url, sys) {
      sys.__exec('AJAX送信時', [callback, url, sys])
    },
    return_none: true
  },
  'POSTデータ生成': { // @辞書形式のデータPARAMSをkey=value&key=value...の形式に変換する // @POSTでーたせいせい
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (params, sys) {
      const flist = []
      for (const key in params) {
        const v = params[key]
        const kv = encodeURIComponent(key) + '=' + encodeURIComponent(v)
        flist.push(kv)
      }
      return flist.join('&')
    }
  },
  'POST送信時': { // @AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定 // @POSTそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    pure: false,
    fn: function (callback, url, params, sys) {
      const bodyData = sys.__exec('POSTデータ生成', [params, sys])
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData
      }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        callback(text)
      }).catch(err => {
        sys.__v0['AJAX:ONERROR'](err)
      })
    }
  },
  'POSTフォーム送信時': { // @AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定 // @POSTふぉーむそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (callback, url, params, sys) {
      const fd = new FormData()
      for (const key in params) { fd.set(key, params[key]) }

      const options = {
        method: 'POST',
        body: fd
      }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        callback(text)
      }).catch(err => {
        sys.__v0['AJAX:ONERROR'](err)
      })
    }
  },
  'AJAX失敗時': { // @Ajax命令でエラーが起きたとき // @AJAXえらーしっぱいしたとき
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (callback, sys) {
      sys.__v0['AJAX:ONERROR'] = callback
    }
  },
  'AJAXオプション': { type: 'const', value: '' }, // @AJAXおぷしょん
  'AJAXオプション設定': { // @AJAX命令でオプションを設定 // @AJAXおぷしょんせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    pure: true,
    fn: function (option, sys) {
      sys.__v0['AJAXオプション'] = option
    },
    return_none: true
  },
  'AJAXオプションPOST設定': { // @AJAXオプションにPOSTメソッドとパラメータPARAMSを設定 // @AJAXおぷしょんPOSTせってい
    type: 'func',
    josi: [['を', 'で']],
    pure: true,
    fn: function (params, sys) {
      const bodyData = sys.__exec('POSTデータ生成', [params, sys])
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData
      }
      sys.__v0['AJAXオプション'] = options
    },
    return_none: true
  },
  'AJAX送信': { // @(非推奨)『AJAXテキスト取得』をご利用ください。- 逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。 // @AJAXそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    fn: function (url, sys) {
      if (!sys.resolve) { throw new Error('『AJAX送信』は『逐次実行』構文内で利用する必要があります。') }
      sys.__exec('AJAX逐次送信', [url, sys])
    },
    return_none: true
  },
  'AJAX逐次送信': { // @(非推奨)『AJAXテキスト取得』をご利用ください。- 逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。 // @AJAXちくじそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    fn: function (url, sys) {
      if (!sys.resolve) { throw new Error('『AJAX逐次送信』は『逐次実行』構文内で利用する必要があります。') }
      sys.resolveCount++
      const resolve = sys.resolve
      const reject = sys.reject
      let options = sys.__v0['AJAXオプション']
      if (options === '') { options = { method: 'GET' } }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        resolve()
      }).catch(err => {
        reject(err.message)
      })
    },
    return_none: true
  },
  'AJAX保障送信': { // @非同期通信(Ajax)でURLにデータの送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @AJAXほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    fn: function (url, sys) {
      let options = sys.__v0['AJAXオプション']
      if (options === '') { options = { method: 'GET' } }
      return fetch(url, options)
    },
    return_none: false
  },
  'HTTP取得': { // @(非推奨)『AJAXテキスト取得』をご利用ください。- 逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。失敗すると『AJAX失敗時』を実行。 // @HTTPしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    pure: true,
    fn: function (url, sys) {
      if (!sys.resolve) { throw new Error('『HTTP取得』は『逐次実行』構文内で利用する必要があります。') }
      sys.__exec('AJAX逐次送信', [url, sys])
    },
    return_none: true
  },
  'HTTP逐次取得': { // @(非推奨)『AJAXテキスト取得』をご利用ください。- 逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。失敗すると『AJAX失敗時』を実行。 // @HTTPちくじしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    pure: false,
    fn: function (url, sys) {
      if (!sys.resolve) { throw new Error('『HTTP逐次取得』は『逐次実行』構文内で利用する必要があります。') }
      sys.__exec('AJAX逐次送信', [url, sys])
    },
    return_none: true
  },
  'HTTP保障取得': { // @非同期通信(Ajax)でURLにデータの送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @HTTPほしょうしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    pure: true,
    fn: function (url, sys) {
      return sys.__exec('AJAX保障送信', [url, sys])
    },
    return_none: false
  },
  'POST逐次送信': { // @逐次実行構文にて、AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTちくじそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: false,
    fn: function (url, params, sys) {
      if (!sys.resolve) { throw new Error('『POST送信』は『逐次実行』構文内で利用する必要があります。') }
      sys.resolveCount++
      const resolve = sys.resolve
      const reject = sys.reject
      const bodyData = sys.__exec('POSTデータ生成', [params, sys])
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData
      }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        resolve(text)
      }).catch(err => {
        reject(err.message)
      })
    },
    return_none: true
  },
  'POST送信': { // @逐次実行構文にて、AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: false,
    fn: function (url, params, sys) {
      if (!sys.resolve) { throw new Error('『POST送信』は『逐次実行』構文内で利用する必要があります。') }
      sys.__exec('POST逐次送信', [url, params, sys])
    },
    return_none: true
  },
  'POST保障送信': { // @非同期通信(Ajax)でURLにPARAMSをPOST送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @POSTほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url, params, sys) {
      const bodyData = sys.__exec('POSTデータ生成', [params, sys])
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
  'POSTフォーム逐次送信': { // @逐次実行構文にて、AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTふぉーむちくじそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url, params, sys) {
      if (!sys.resolve) { throw new Error('『POSTフォーム逐次送信』は『逐次実行』構文内で利用する必要があります。') }
      sys.resolveCount++
      const resolve = sys.resolve
      const reject = sys.reject
      const fd = new FormData()
      for (const key in params) { fd.set(key, params[key]) }

      const options = {
        method: 'POST',
        body: fd
      }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        resolve(text)
      }).catch(err => {
        reject(err.message)
      })
    },
    return_none: true
  },
  'POSTフォーム送信': { // @逐次実行構文にて、AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTふぉーむそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: false,
    fn: function (url, params, sys) {
      if (!sys.resolve) { throw new Error('『POSTフォーム送信』は『逐次実行』構文内で利用する必要があります。') }
      sys.__exec('POSTフォーム逐次送信', [url, params, sys])
    },
    return_none: true
  },
  'POSTフォーム保障送信': { // @非同期通信(Ajax)でURLにPARAMSをフォームとしてPOST送信を開始する非同期処理オブジェクト(Promise)を作成する。  // @POSTふぉーむほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url, params, sys) {
      const fd = new FormData()
      for (const key in params) { fd.set(key, params[key]) }

      const options = {
        method: 'POST',
        body: fd
      }
      return fetch(url, options)
    },
    return_none: false
  },
  'AJAX内容取得': { // @非同期通信(Ajax)の応答から内容を指定した形式で取り出すための非同期処理オブジェクト(Promise)を返す。  // @AJAXないようしゅとく
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
  },
  // @新AJAX
  'AJAXテキスト取得': { // @AJAXでURLにアクセスしテキスト形式で結果を得る。送信時AJAXオプションの値を参照。 // @AJAXてきすとしゅとく
    type: 'func',
    josi: [['から']],
    pure: true,
    asyncFn: true,
    fn: async function (url, sys) {
      let options = sys.__v0['AJAXオプション']
      if (options === '') { options = { method: 'GET' } }
      const res = await fetch(url, options)
      const txt = await res.text()
      return txt
    },
    return_none: false
  },
  'AJAX_JSON取得': { // @AJAXでURLにアクセスしJSONの結果を得て、送信時AJAXオプションの値を参照。 // @AJAX_JSONしゅとく
    type: 'func',
    josi: [['から']],
    pure: true,
    asyncFn: true,
    fn: async function (url, sys) {
      let options = sys.__v0['AJAXオプション']
      if (options === '') { options = { method: 'GET' } }
      const res = await fetch(url, options)
      const txt = await res.json()
      return txt
    },
    return_none: false
  },
}
