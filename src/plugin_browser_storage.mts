// @ts-nocheck
export default {
  // @ローカルストレージ
  '保存': { // @ブラウザのlocalStorageのキーKに文字列Vを保存 // @ほぞん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    pure: true,
    fn: function (v: any, key: any, sys: any) {
      sys.__exec('ローカルストレージ保存', [v, key, sys])
    },
    return_none: true
  },
  '開': { // @ブラウザのlocalStorageからVを読む // @ひらく
    type: 'func',
    josi: [['を', 'から', 'の']],
    pure: true,
    fn: function (key: any, sys: any) {
      return sys.__exec('ローカルストレージ読', [key, sys])
    },
    return_none: false
  },
  '読': { // @ブラウザのlocalStorageからVを読む // @よむ
    type: 'func',
    josi: [['を', 'から', 'の']],
    pure: true,
    fn: function (key: any, sys: any) {
      return sys.__exec('ローカルストレージ読', [key, sys])
    },
    return_none: false
  },
  '存在': { // @ブラウザのlocalStorageにKEYが存在しているか調べる // @そんざい
    type: 'func',
    josi: [['が']],
    pure: true,
    fn: function (key: any) {
      const s = window.localStorage.getItem(key)
      return (s !== null)
    },
    return_none: false
  },
  'ローカルストレージ保存': { // @ブラウザのlocalStorageのKにVを保存 // @ろーかるすとれーじほぞん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    pure: true,
    fn: function (v: any, key: any, sys: any) {
      let body = v
      if (sys.__getSysVar('保存オプション')) {
        if ((sys.__getSysVar('保存オプション').indexOf('json') >= 0)) {
          body = JSON.stringify(body)
        } else if (sys.__getSysVar('保存オプション') === 'raw') {
          // なにもしない
        }
      }
      window.localStorage[key] = body
    },
    return_none: true
  },
  'ローカルストレージ読': { // @ブラウザのlocalStorageからVを読む // @ろーかるすとれーじよむ
    type: 'func',
    josi: [['を', 'から', 'の']],
    pure: true,
    fn: function (key: any, sys: any) {
      const v = window.localStorage[key]
      if (sys.__getSysVar('保存オプション') && (sys.__getSysVar('保存オプション').indexOf('json') >= 0)) {
        try {
          return JSON.parse(v)
        } catch (e) {
          console.log('ローカルストレージ『' + key + '』の読み込みに失敗')
        }
      }
      return v
    },
    return_none: false
  },
  'ローカルストレージキー列挙': { // @ブラウザのlocalStorageのキー一覧を返す // @ろーかるすとれーじきーれっきょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
      const keys = []
      for (const key in window.localStorage) { keys.push(key) }
      return keys
    },
    return_none: false
  },
  'ローカルストレージキー削除': { // @ブラウザのlocalStorageのkeyを削除 // @ろーかるすとれーじきーさくじょ
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (key: any) {
      window.localStorage.removeItem(key)
    },
    return_none: true
  },
  'ローカルストレージ全削除': { // @ブラウザのlocalStorageのデータを全部削除する // @ろーかるすとれーじぜんさくじょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      window.localStorage.clear()
    },
    return_none: true
  },
  'ローカルストレージ有効確認': { // @ブラウザのlocalStorageが使えるか確認 // @ろーかるすとれーじりようかくにん
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      return (typeof window.localStorage !== 'undefined')
    },
    return_none: false
  },
  '保存オプション': { type: 'const', value: 'json' }, // @ ほぞんおぷしょん
  '保存オプション設定': { // @ブラウザのlocalStorageへの保存オプション「json」または「raw」を設定する // @ほぞんおぷしょんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (v: any, sys: any) {
      v = v.toUpperCase(v)
      sys.__setSysVar('保存オプション', v)
    },
    return_none: true
  }
}
