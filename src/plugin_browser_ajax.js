module.exports = {
  // @AJAXとHTTP
  'AJAX送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @AJAXそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    pure: true,
    fn: function (callback, url, sys) {
      let options = sys.__v0['AJAXオプション']
      if (options === '') {options = {method: 'GET'}}
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        callback(text)
      }).catch(err => {
        console.log('[fetch.error]', err)
        sys.__v0['AJAX:ONERROR'](err)
      })
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
  'POSTデータ生成': { // @連想配列をkey=value&key=value...の形式に変換する // @POSTでーたせいせい
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (params, sys) {
      let flist = []
      for (let key in params) {
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
      let bodyData = sys.__exec('POSTデータ生成', [params, sys])
      console.log("bodyData=", bodyData)
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
      for (let key in params)
        {fd.set(key, params[key])}

      let options = {
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
  'AJAXオプション': {type: 'const', value: ''}, // @AJAXおぷしょん
  'AJAXオプション設定': { // @Ajax命令でオプションを設定 // @AJAXおぷしょんせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    pure: true,
    fn: function (option, sys) {
      sys.__v0['AJAXオプション'] = option
    },
    return_none: true
  },
  'AJAX送信': { // @逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。失敗すると『AJAX失敗時』を実行。 // @AJAXそうしんした
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    fn: function (url, sys) {
      if (!sys.resolve) {throw new Error('『AJAX送信』は『逐次実行』構文内で利用する必要があります。')}
      sys.resolveCount++
      const resolve = sys.resolve
      let options = sys.__v0['AJAXオプション']
      if (options === '') {options = {method: 'GET'}}
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        resolve()
      }).catch(err => {
        console.error('[fetch.error]', err)
        sys.__v0['AJAX:ONERROR'](err)
      })
    },
    return_none: true
  },
  'HTTP取得': { // @逐次実行構文にて、非同期通信(Ajax)でURLにデータを送信する。成功すると『対象』にデータが代入される。失敗すると『AJAX失敗時』を実行。 // @HTTPしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    pure: false,
    fn: function (url, sys) {
      if (!sys.resolve) {throw new Error('『HTTP取得』は『逐次実行』構文内で利用する必要があります。')}
      sys.__exec('AJAX送信', [url, sys])
    },
    return_none: true
  },
  'POST送信': { // @逐次実行構文にて、AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: false,
    fn: function (url, params, sys) {
      if (!sys.resolve) {throw new Error('『POST送信』は『逐次実行』構文内で利用する必要があります。')}
      sys.resolveCount++
      const resolve = sys.resolve
      let bodyData = sys.__exec('POSTデータ生成', [params, sys])
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
        console.error('[fetch.error]', err)
        sys.__v0['AJAX:ONERROR'](err)
      })
    }
  },
  'POSTフォーム送信': { // @逐次実行構文にて、AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定。失敗すると『AJAX失敗時』を実行。 // @POSTふぉーむそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (url, params, sys) {
      if (!sys.resolve) {throw new Error('『POSTフォーム送信』は『逐次実行』構文内で利用する必要があります。')}
      sys.resolveCount++
      const resolve = sys.resolve
      const fd = new FormData()
      for (let key in params)
        {fd.set(key, params[key])}

      let options = {
        method: 'POST',
        body: fd
      }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        resolve(text)
      }).catch(err => {
        console.error('[fetch.error]', err)
        sys.__v0['AJAX:ONERROR'](err)
      })
    }
  }
}
