// @ts-nocheck
import hotkeys from 'hotkeys-js'

export default {
  // @ホットキー
  'ホットキー登録': { // @ホットキーKEYにEVENTを登録する // @ほっときーとうろく
    type: 'func',
    josi: [['に', 'で'], ['を']],
    pure: true,
    fn: function (key: any, fname: any, sys: any) {
      hotkeys(key, function (event: any, handler: any) {
        event.preventDefault()
        const f = sys.__findFunc(fname)
        f(sys)
      })
    }
  },
  'ホットキー解除': { // @ホットキーKEYを解除する // @ほっときーかいじょ
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (key: any) {
      hotkeys.unbind(key)
    }
  }
}
