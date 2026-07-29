/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * 辞書型変数の操作・ハッシュの命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
export default {
  // @辞書型変数の操作
  '辞書キー列挙': { // @辞書型変数Aのキーの一覧を配列で返す。 // @じしょきーれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      const keys = []
      if (a instanceof Object) { // オブジェクトのキーを返す
        for (const key in a) { keys.push(key) }
        return keys
      }
      if (a instanceof Array) { // 配列なら数字を返す
        for (let i = 0; i < a.length; i++) { keys.push(i) }
        return keys
      }
      throw new Error('『辞書キー列挙』でハッシュ以外が与えられました。')
    }
  },
  '辞書キー削除': { // @辞書型変数AからキーKEYを削除して返す（A自体を変更する）。 // @じしょきーさくじょ
    type: 'func',
    josi: [['から', 'の'], ['を']],
    pure: true,
    fn: function(a: any, key: any) {
      if (a instanceof Object) { // オブジェクトのキーを返す
        if (key in a) { delete a[key] }
        return a
      }
      throw new Error('『辞書キー削除』でハッシュ以外が与えられました。')
    }
  },
  '辞書キー存在': { // @辞書型変数AのキーKEYが存在するか確認 // @じしょきーそんざい
    type: 'func',
    josi: [['の', 'に'], ['が']],
    pure: true,
    fn: function(a: any, key: any) {
      return key in a
    }
  },

  // @ハッシュ
  'ハッシュキー列挙': { // @ハッシュAのキー一覧を配列で返す。 // @はっしゅきーれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any, sys: any) {
      return sys.__exec('辞書キー列挙', [a, sys])
    }
  },
  'ハッシュ内容列挙': { // @ハッシュAの内容一覧を配列で返す。 // @はっしゅないようれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      const body = []
      if (a instanceof Object) { // オブジェクトのキーを返す
        for (const key in a) { body.push(a[key]) }
        return body
      }
      throw new Error('『ハッシュ内容列挙』でハッシュ以外が与えられました。')
    }
  },
  'ハッシュキー削除': { // @ハッシュAからキーKEYを削除して返す。 // @はっしゅきーさくじょ
    type: 'func',
    josi: [['から', 'の'], ['を']],
    pure: true,
    fn: function(a: any, key: any, sys: any) {
      return sys.__exec('辞書キー削除', [a, key, sys])
    }
  },
  'ハッシュキー存在': { // @ハッシュAのキーKEYが存在するか確認 // @はっしゅきーそんざい
    type: 'func',
    josi: [['の', 'に'], ['が']],
    pure: true,
    fn: function(a: any, key: any) {
      return key in a
    }
  },
}
