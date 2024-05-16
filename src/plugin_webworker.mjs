// @ts-nocheck
const PluginWebWorker = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_webworker', // プラグインの名前
      description: 'ブラウザのWebWorkerのためのプラグイン', // 説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },

  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
      sys._webworker = {
        setNakoHandler: function (work) {
          work.onmessage = (event) => {
            const data = event.data || { type: '', data: '' }
            const type = data.type || ''
            const value = data.data || ''
            switch (type) {
              case 'output':
                if (work.onoutput) {
                  work.onoutput.apply(sys, [value, event])
                }
                break
              case 'data':
                if (work.ondata) {
                  work.ondata.apply(sys, [value, event])
                }
                break
              case 'error':
                sys.logger.error(value.noColor)
                break
            }
          }
          work.onerror = (event) => {
            const e = new Error(typeof event.message !== 'undefined' ? event.message : 'no message')
            sys.logger.error(e)
          }
          work.onerrormessage = (event) => {
            const e = new Error(typeof event.message !== 'undefined' ? event.message : 'no message')
            sys.logger.error(e)
          }
        },
        inWorker: () => {
          // eslint-disable-next-line no-undef
          return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope
        },
        getBaseUrlFromTag: () => {
          if (!self.document) { return '' }
          const pluginName = 'plugin_webworker.js'
          let path = location.pathname
          if (path.substr(path.length - 1, 1) !== '/') {
            const paths = path.split('/')
            path = paths.slice(paths.length - 1, 1).join('/') & '/'
          }
          const scripts = document.querySelectorAll('script')
          for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i]
            let src = script.src || ''
            const index = src.indexOf(pluginName)
            if (index >= 0) {
              if (src.length - index === pluginName.length ||
                  '?&#'.indexOf(src.substr(index + pluginName.length, 1)) >= 0) {
                src = src.substring(0, index)
                if (src.substring(0, 1) === '/') {
                  // スクリプトソースはorigin無しの絶対パス
                  return location.origin + src
                }
                if (/^[a-zA-Z]+:\/\//.test(src)) {
                  // スクリプトソースは絶対URI
                  return src
                }
                // スクリプトソースはorigin無しの相対パス
                return location.origin + path + src
              }
            }
          }
          // スクリプトソースが見つからなかったのでドキュメントのURIを返す
          return location.origin + path
        }
      }
      sys.__v0['ワーカーURL'] = sys._webworker.getBaseUrlFromTag()
    }
  },
  // @イベント定数
  '対象イベント': { type: 'const', value: '' }, // @たいしょういべんと
  '受信データ': { type: 'const', value: '' }, // @たいしょういべんと

  'ワーカーURL': { type: 'const', value: '' }, // @わーかーURL
  'ワーカーURL設定': { // @なでしこv3のファイルのあるURLを設定 // @わーかーURLせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    pure: true,
    fn: function (url, sys) {
      if (url && url.substring(url.length - 1) !== '/') {
        url += '/'
      }
      sys.__v0['ワーカーURL'] = url
    },
    return_none: true
  },

  // @NAKOワーカー
  'ワーカー起動': { // @指定したURLでWebWorkerを起動する。ワーカオブジェクトを返す。 // @わーかーきどう
    type: 'func',
    josi: [['で', 'を', 'の']],
    pure: true,
    fn: function (url, sys) {
      return new Worker(url)
    },
    return_none: false
  },
  'ワーカーJS起動': { // @指定したJavascriptのソースでWebWorkerを起動する。ワーカオブジェクトを返す。 // @わーかーJSきどう
    type: 'func',
    josi: [['で', 'を', 'の']],
    pure: true,
    fn: function (src, sys) {
      const blob = new Blob([src], { type: 'application/javascript' })
      const url = URL.createObjectURL(blob)
      return new Worker(url)
    },
    return_none: false
  },
  'NAKOワーカー起動': { // @指定したなでしこ３のWebWorkerを起動する。ワーカオブジェクトを返す。 // @NAKOわーかーきどう
    type: 'func',
    josi: [['で']],
    isVariableJosi: true,
    pure: true,
    fn: function (plugins, sys) {
      let url
      if (typeof sys === 'undefined') { sys = plugins; plugins = undefined }
      if (plugins !== undefined) {
        if (!(plugins instanceof Array)) {
          throw new Error('プラグインはファイル名を配列で指定してください')
        }
        const baseurl = sys.__v0['ワーカーURL']
        let code = `importScripts('${baseurl}wnako3webworker.js')\n`
        const l = plugins.length
        let i
        for (i = 0; i < l; i++) {
          code += `importScripts('${baseurl}${plugins[i]}')\n`
        }
        const blob = new Blob([code], { type: 'application/javascript' })
        url = URL.createObjectURL(blob)
      } else {
        url = sys.__v0['ワーカーURL'] + 'wnako3webworker.js'
      }
      const myWorker = new Worker(url)
      if (myWorker) {
        sys._webworker.setNakoHandler(myWorker)
      }
      return myWorker
    },
    return_none: false
  },
  'NAKOワーカーハンドラ設定': { // @ワーカーにNAKOワーカーのための設定を行う。 // @NAKOわーかーはんどらせってい
    type: 'func',
    josi: [['に', 'へ', 'の']],
    pure: true,
    fn: function (work, sys) {
      sys._webworker.setNakoHandler(work)
    },
    return_none: true
  },
  'NAKOワーカーデータ受信時': { // @無名関数Fでなでしこv3エンジンに対してワーカーメッセージによりデータを受信した時に実行するイベントを設定。『受信データ』に受信したデータ。『対象イベント』にイベント引数。 // @NAKOわーかーでーたじゅしんしたとき
    type: 'func',
    josi: [['で'], ['から']],
    isVariableJosi: true,
    pure: false,
    fn: function (func, work, sys) {
      if (typeof sys === 'undefined') { sys = work; work = self }
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      work.ondata = (data, e) => {
        sys.__v0['受信データ'] = data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'NAKOワーカー表示時': { // @無名関数Fでなでしこv3エンジンに対してワーカーメッセージにより表示データを受信した時に実行するイベントを設定。『受信データ』に表示しようとしたデータ。『対象イベント』にイベント引数。 // @NAKOわーかーひょうじしたとき
    type: 'func',
    josi: [['で'], ['から']],
    pure: false,
    fn: function (func, work, sys) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      work.onoutput = (data, e) => {
        sys.__v0['受信データ'] = data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'ワーカーメッセージ受信時': { // @無名関数Fでworkに対してメッセージを受信した時に実行するイベントを設定。『受信データ』に受信したデータ。『対象イベント』にイベント引数。 // @わーかーめっせーじじゅしんしたとき
    type: 'func',
    josi: [['で'], ['から']],
    isVariableJosi: true,
    pure: false,
    fn: function (func, work, sys) {
      if (typeof sys === 'undefined') { sys = work; work = self }
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換
      work.onmessage = (e) => {
        sys.__v0['受信データ'] = e.data
        sys.__v0['対象イベント'] = e
        return func(e, sys)
      }
    },
    return_none: true
  },
  'NAKOワーカープログラム起動': { // @WORKERに固有の形式でプログラムの転送と実行行う。 // @NAKOわーかーぷろぐらむきどう
    type: 'func',
    josi: [['に', 'で'], ['を']],
    pure: true,
    fn: function (work, data, sys) {
      const msg = {
        type: 'run',
        data: data
      }
      work.postMessage(msg)
    },
    return_none: true
  },
  'NAKOワーカーリセット': { // @WORKERに固有の形式でプログラムの転送と実行行う。 // @わーかーりせっと
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (work, sys) {
      const msg = {
        type: 'reset',
        data: ''
      }
      work.postMessage(msg)
    },
    return_none: true
  },
  'ワーカー終了': { // @WORKERを終了する。 // @わーかーしゅうりょう
    type: 'func',
    josi: [['を']],
    isVariableJosi: true,
    pure: true,
    fn: function (work, sys) {
      if (typeof sys === 'undefined') { sys = work; work = self }
      work.terminate()
    },
    return_none: true
  },
  'NAKOワーカー終了': { // @WORKERを終了する。 // @NAKOわーかーしゅうりょう
    type: 'func',
    josi: [['を']],
    isVariableJosi: true,
    pure: true,
    fn: function (work, sys) {
      if (typeof sys === 'undefined') {
        self.close()
        return
      }
      const msg = {
        type: 'close',
        data: ''
      }
      work.postMessage(msg)
    },
    return_none: true
  },
  'NAKOワーカーデータ送信': { // @WORKERに固有の形式でデータを送信する。 // @NAKOわーかーでーたそうしん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    isVariableJosi: true,
    pure: true,
    fn: function (data, work, sys) {
      if (typeof sys === 'undefined') { sys = work; work = self }
      const msg = {
        type: 'data',
        data: data
      }
      work.postMessage(msg)
    },
    return_none: true
  },
  'ワーカーメッセージ送信': { // @WORKERにメッセージを送信する。 // @わーかーめっせーじそうしん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    isVariableJosi: true,
    pure: true,
    fn: function (msg, work, sys) {
      if (typeof sys === 'undefined') { sys = work; work = self }
      work.postMessage(msg)
    },
    return_none: true
  },
  'NAKOワーカー転送': { // @WORKERにユーザー定義関数またはユーザ定義のグローバル変数を転送する。 // @NAKOわーかーてんそう
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    isVariableJosi: true,
    pure: false,
    fn: function (datas, work, sys) {
      if (typeof sys === 'undefined') { sys = work; work = self }
      const modNameList = []
      const obj = []
      if (typeof datas === 'string') { datas = [datas] }
      datas.forEach(data => {
        if (data.indexOf('__') === -1) {
          for (const modname of sys.__modList) {
            const varname = modname + '__' + data
            if (typeof sys.__varslist[2].get(varname) !== 'undefined' || typeof sys.__varslist[1].get(varname) !== 'undefined') {
              data = varname
              break
            }
          }
        }
        if (data.indexOf('__') > -1) {
          const modname = data.split('__')[0]
          if (modNameList.indexOf(modname) === -1) {
            modNameList.push(modname)
          }
        }
        if (typeof sys.__varslist[2].get(data) !== 'undefined') {
          obj.push({
            type: 'val',
            name: data,
            content: sys.__varslist[2].get(data)
          })
        } else
        if (typeof sys.__varslist[1].get(data) !== 'undefined') {
          obj.push({
            type: 'func',
            name: data,
            content: {
              meta: sys.gen.nakoFuncList[data],
              func: Object.assign({}, sys.compiler.funclist[data], { fn: null })
            }
          })
        } else {
          console.error('指定した名前のユーザ関数もしくはグローバル変数がありません:' + data)
          throw new Error('指定した名前のユーザ関数もしくはグローバル変数がありません:' + data)
        }
      })
      if (obj.length > 0) {
        const modInfoList = []
        for (const modname of modNameList) {
          modInfoList.push({
            name: modname,
            export: sys.compiler.moduleExport[modname]
          })
        }
        obj.push({
          type: 'env',
          name: 'modlist',
          content: modInfoList
        })
        obj.push({
          type: 'env',
          name: 'constPools',
          content: sys.constPools
        })
        obj.push({
          type: 'env',
          name: 'constPoolsTemplate',
          content: sys.constPoolsTemplate
        })
        const msg = {
          type: 'trans',
          data: obj
        }
        work.postMessage(msg)
      }
    },
    return_none: true
  }
}

export default PluginWebWorker

if (typeof (navigator) === 'object' && typeof (navigator.nako3) === 'object') {
  navigator.nako3.addPluginObject('PluginWebWorker', PluginWebWorker)
}

