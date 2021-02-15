module.exports = {
  // @ローカルストレージ
  '保存': { // @ブラウザのlocalStorageのキーKに文字列Vを保存 // @ほぞん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    pure: true,
    fn: function (v, key) {
      window.localStorage[key] = JSON.stringify(v)
    },
    return_none: true
  },
  '開': { // @ブラウザのlocalStorageからVを読む // @ひらく
    type: 'func',
    josi: [['を', 'から', 'の']],
    pure: true,
    fn: function (key) {
      const v = window.localStorage[key]
      try {
        return JSON.parse(v)
      } catch (e) {
        console.log('ローカルストレージ『' + key + '』の読み込みに失敗')
      }
      return v
    },
    return_none: false
  },
  '存在': { // @ブラウザのlocalStorageにKEYが存在しているか調べる // @そんざい
    type: 'func',
    josi: [['が']],
    pure: true,
    fn: function (key) {
      const s = window.localStorage.getItem(key)
      return (s !== null)
    },
    return_none: false
  },
  'ローカルストレージ保存': { // @ブラウザのlocalStorageのKにVを保存 // @ろーかるすとれーじほぞん
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    pure: true,
    fn: function (key, v) {
      window.localStorage[key] = JSON.stringify(v)
    },
    return_none: true
  },
  'ローカルストレージ読': { // @ブラウザのlocalStorageからVを読む // @ろーかるすとれーじよむ
    type: 'func',
    josi: [['を', 'から', 'の']],
    pure: true,
    fn: function (key) {
      const v = window.localStorage[key]
      try {
        return JSON.parse(v)
      } catch (e) {
        console.log('ローカルストレージ『' + key + '』の読み込みに失敗')
      }
      return v
    },
    return_none: false
  },
  'ローカルストレージキー列挙': { // @ブラウザのlocalStorageのキー一覧を返す // @ろーかるすとれーじきーれっきょ
    type: 'func',
    josi: [[]],
    pure: true,
    fn: function (key) {
      const keys = []
      for (const key in window.localStorage)
        {keys.push(key)}

      return keys
    },
    return_none: false
  },
  'ローカルストレージキー削除': { // @ブラウザのlocalStorageのkeyを削除 // @ろーかるすとれーじきーさくじょ
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (key) {
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
  }
}
