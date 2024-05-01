export default {
  // @HTTPとAJAX
  'HTTP取得': { // @「AJAXテキスト取得」と同じ。非同期通信(AJAX)でURLからテキストデータを取得する。 // @HTTPしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    pure: true,
    asyncFn: true,
    fn: async function (url: any, sys: any) {
      return sys.__exec('AJAXテキスト取得', [url, sys])
    }
  },
  'AJAX受信': { // @「AJAXテキスト取得」と同じ。非同期通信(AJAX)でURLからテキストデータを取得する。 // @AJAXじゅしん
    type: 'func',
    josi: [['から', 'を']],
    pure: true,
    asyncFn: true,
    fn: async function (url: any, sys: any) {
      return sys.__exec('AJAXテキスト取得', [url, sys])
    }
  },
  'AJAX受信時': { // @「AJAX送信時」と同じ。非同期通信(AJAX)を利用してURLからデータを受信した時callbackが実行される。その際『対象』にデータが代入される。『AJAXオプション』を指定できる。 // @AJAXじゅしんしたとき
    type: 'func',
    josi: [['で'], ['から', 'を']],
    pure: true,
    fn: function (callback: any, url: any, sys: any) {
      sys.__exec('AJAX送信時', [callback, url, sys])
    },
    return_none: true
  },
  'AJAX送信': { // @「AJAXテキスト取得」と同じ。非同期通信(AJAX)でURLからテキストデータを取得する。// @AJAXそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    asyncFn: true,
    fn: async function (url: any, sys: any) {
      return sys.__exec('AJAXテキスト取得', [url, sys])
    }
  },
  'AJAX送信時': { // @非同期通信(AJAX)でURLにアクセスし成功するとCALLBACKを実行。『対象』にデータを代入。『AJAXオプション』が指定可能。エラーなら『AJAX失敗時』を実行。 // @AJAXそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    pure: true,
    fn: function (callback: any, url: any, sys: any) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      fetch(url, options).then(res => {
        // もし301であれば自動でリダイレクトするため,200だけをチェックすれば良い
        if (res.status !== 200) {
          return sys.__getSysVar('AJAX:ONERROR')(res.status)
        }
        return res.text()
      }).then(text => {
        sys.__setSysVar('対象', text)
        callback(text, sys)
      }).catch(err => {
        sys.__getSysVar('AJAX:ONERROR')(err)
      })
    },
    return_none: true
  },
  'AJAXオプション': { type: 'const', value: '' }, // @AJAXおぷしょん
  'AJAXオプション設定': { // @AJAX命令でオプションを設定 // @AJAXおぷしょんせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    pure: true,
    fn: function (option: any, sys: any) {
      sys.__setSysVar('AJAXオプション', option)
    },
    return_none: true
  },
  'AJAXオプションPOST設定': { // @AJAXオプションにPOSTメソッドとパラメータPARAMSを設定 // @AJAXおぷしょんPOSTせってい
    type: 'func',
    josi: [['を', 'で']],
    pure: true,
    fn: function (params: any, sys: any) {
      const bodyData = sys.__exec('POSTデータ生成', [params, sys])
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData
      }
      sys.__setSysVar('AJAXオプション', options)
    },
    return_none: true
  },
  'AJAX失敗時': { // @AJAX命令でエラーが起きたとき // @AJAXえらーしっぱいしたとき
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (callback: any, sys: any) {
      sys.__setSysVar('AJAX:ONERROR', callback)
    }
  },
  'AJAXテキスト取得': { // @AJAXでURLにアクセスしテキスト形式で結果を得る。送信時『AJAXオプション』の値を参照。 // @AJAXてきすとしゅとく
    type: 'func',
    josi: [['から', 'を']],
    pure: true,
    asyncFn: true,
    fn: async function (url: any, sys: any) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      const res = await fetch(url, options)
      const txt = await res.text()
      return txt
    },
    return_none: false
  },
  'AJAX_JSON取得': { // @AJAXでURLにアクセスしJSONの結果を得て、送信時『AJAXオプション』の値を参照。 // @AJAX_JSONしゅとく
    type: 'func',
    josi: [['から']],
    pure: true,
    asyncFn: true,
    fn: async function (url: any, sys: any) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      const res = await fetch(url, options)
      const txt = await res.json()
      return txt
    },
    return_none: false
  },
  'AJAXバイナリ取得': { // @AJAXでURLにアクセスしバイナリ(blob)形式で結果を得る。送信時『AJAXオプション』の値を参照。 // @AJAXばいなりしゅとく
    type: 'func',
    josi: [['から']],
    pure: true,
    asyncFn: true,
    fn: async function (url: any, sys: any) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      const res = await fetch(url, options)
      const bin = await res.blob()
      return bin
    },
    return_none: false
  },
  // @GETとPOST
  'GET送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @GETそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    pure: true,
    fn: function (callback: any, url: any, sys: any) {
      sys.__exec('AJAX送信時', [callback, url, sys])
    },
    return_none: true
  },
  'POST送信時': { // @AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定 // @POSTそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (callback: any, url: any, params: any, sys: any) {
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
        sys.__setSysVar('対象', text)
        callback(text)
      }).catch(err => {
        sys.__getSysVar('AJAX:ONERROR')(err)
      })
    }
  },
  'POSTフォーム送信時': { // @AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定 // @POSTふぉーむそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (callback: any, url: any, params: any, sys: any) {
      const fd = new FormData()
      for (const key in params) { fd.set(key, params[key]) }

      const options = {
        method: 'POST',
        body: fd
      }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__setSysVar('対象', text)
        callback(text)
      }).catch(err => {
        sys.__getSysVar('AJAX:ONERROR')(err)
      })
    }
  },
  'POSTデータ生成': { // @辞書形式のデータPARAMSをkey=value&key=value...の形式に変換する // @POSTでーたせいせい
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (params: any, sys: any) {
      const flist: string[] = []
      for (const key in params) {
        const v = params[key]
        const kv: string = encodeURIComponent(key) + '=' + encodeURIComponent(v)
        flist.push(kv)
      }
      return flist.join('&')
    }
  },
  'POST送信': { // @非同期通信(AJAX)でPOSTメソッドにてURLへPARAMS(辞書型)を送信して応答を戻す。 // @POSTそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    asyncFn: true,
    fn: function (url: any, params: any, sys: any) {
      return new Promise((resolve, reject) => {
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
          resolve(text)
        }).catch(err => {
          reject(err.message)
        })
      })
    }
  },
  'POSTフォーム送信': { // @非同期通信(AJAX)でURLにPARAMS(辞書型)をフォームとしてPOSTメソッドにてURLへ送信し応答を返す。 // @POSTふぉーむそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    asyncFn: true,
    fn: function (url: any, params: any, sys: any) {
      return new Promise((resolve, reject) => {
        const fd = new FormData()
        for (const key in params) { fd.set(key, params[key]) }
        const options = {
          method: 'POST',
          body: fd
        }
        fetch(url, options).then(res => {
          return res.text()
        }).then(text => {
          resolve(text)
        }).catch(err => {
          reject(err.message)
        })
      })
    }
  },
  // @HTTPとAJAX(保証)
  'AJAX保障送信': { // @非同期通信(Ajax)でURLにデータの送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @AJAXほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    fn: function (url: any, sys: any) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      return fetch(url, options)
    },
    return_none: false
  },
  'HTTP保障取得': { // @非同期通信(Ajax)でURLにデータの送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @HTTPほしょうしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    pure: true,
    fn: function (url: any, sys: any) {
      return sys.__exec('AJAX保障送信', [url, sys])
    },
    return_none: false
  },
  'POST保障送信': { // @非同期通信(Ajax)でURLにPARAMSをPOST送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @POSTほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url: any, params: any, sys: any) {
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
  'POSTフォーム保障送信': { // @非同期通信(Ajax)でURLにPARAMSをフォームとしてPOST送信を開始する非同期処理オブジェクト(Promise)を作成する。  // @POSTふぉーむほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url: any, params: any, sys: any) {
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
  'AJAX内容取得': { // @「保証」を使った非同期通信(Ajax)の応答から内容を指定した形式で取り出すための非同期処理オブジェクト(Promise)を返す。 // @AJAXないようしゅとく
    type: 'func',
    josi: [['から'], ['で']],
    pure: true,
    fn: function (res: any, type: any, sys: any) {
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
  // @Blob
  'BLOB作成': { // @DATA(配列型)をOPTIONS(辞書型)でBlobオブジェクトを作成する。 // @BLOBさくせい
    type: 'func',
    josi: [['を', 'から'], ['で']],
    pure: true,
    fn: function (data: any, options: any) {
      if (!(data instanceof Array)) { data = [data] }
      return new Blob(data, options)
    }
  },
  // @HTTPとAJAX(非推奨)
  'AJAX逐次送信': { // @(非推奨)『AJAXテキスト取得』をご利用ください。- 逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。 // @AJAXちくじそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    fn: function (url: any, sys: any) {
      if (!sys.resolve) { throw new Error('『AJAX逐次送信』は『逐次実行』構文内で利用する必要があります。') }
      sys.resolveCount++
      const resolve = sys.resolve
      const reject = sys.reject
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__setSysVar('対象', text)
        resolve()
      }).catch(err => {
        reject(err.message)
      })
    },
    return_none: true
  },
  'HTTP逐次取得': { // @(非推奨)『AJAXテキスト取得』をご利用ください。- 逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。失敗すると『AJAX失敗時』を実行。 // @HTTPちくじしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    pure: true,
    fn: function (url: any, sys: any) {
      if (!sys.resolve) { throw new Error('『HTTP逐次取得』は『逐次実行』構文内で利用する必要があります。') }
      sys.__exec('AJAX逐次送信', [url, sys])
    },
    return_none: true
  },
  'POST逐次送信': { // @(非推奨)逐次実行構文にて、AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTちくじそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url: any, params: any, sys: any) {
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
        sys.__setSysVar('対象', text)
        resolve(text)
      }).catch(err => {
        reject(err.message)
      })
    },
    return_none: true
  },
  'POSTフォーム逐次送信': { // @(非推奨)逐次実行構文にて、AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTふぉーむちくじそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url: any, params: any, sys: any) {
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
        sys.__setSysVar('対象', text)
        resolve(text)
      }).catch(err => {
        reject(err.message)
      })
    },
    return_none: true
  }
}
