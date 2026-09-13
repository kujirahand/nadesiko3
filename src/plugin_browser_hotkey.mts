// @ts-nocheck
import hotkeys from 'hotkeys-js'

export default {
  // @ホットキー
  'ホットキー登録': { // @ホットキーKEYにEVENTを登録する // @ほっときーとうろく
    type: 'func',
    josi: [['に', 'で'], ['を']],
    pure: true,
    fn: function(key: any, fname: any, sys: any) {
      const f = sys.__findFunc(fname, 'ホットキー登録') // 登録時に解決・検証する
      hotkeys(key, function(event: any, _handler: any) {
        event.preventDefault()
        f(sys)
      })
    }
  },
  'ホットキー解除': { // @ホットキーKEYを解除する // @ほっときーかいじょ
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(key: any) {
      hotkeys.unbind(key)
    }
  }
}
