const hotkeys = require('hotkeys-js')

module.exports = {
  // @ホットキー
  'ホットキー登録': { // @ホットキーKEYにEVENTを登録する // @ほっときーとうろく
    type: 'func',
    josi: [['に', 'で'], ['を']],
    pure: true,
    fn: function (key, fname, sys) {
      hotkeys(key, function (event, handler) {
        event.preventDefault()
        sys.__v1[fname]()
      })
    }
  },
  'ホットキー解除': { // @ホットキーKEYを解除する // @ほっときーかいじょ
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (key) {
      hotkeys.unbind(key)
    }
  }
}
