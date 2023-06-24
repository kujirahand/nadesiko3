const pluginObj = {
  'テスト加算': {
      type: 'func',
      josi: [['と'],['を']],
      fn: function (a, b) {
        return a + b
      }
  },
  'テスト減算': {
      type: 'func',
      josi: [['から'],['を']],
      fn: function (a, b) {
        return a - b
      }
  }
}
if (typeof (navigator) === 'object') {
  navigator.nako3.addPluginObject("pluginHello", pluginObj)
} else {
  module.exports = pluginObj
}

