const PluginActiveCheck = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__active = true
      if (sys.__tid !== undefined) {
        clearInterval(sys.__tid)
      }
      sys.__tid = setInterval(()=>{
        console.log('__active=', sys.__active)
      },1000)
    }
  },
  '!クリア': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__active = false
      clearInterval(sys.__tid)
    }
  }
}

// CommonJS方式で自動登録を実装
if (typeof (navigator) === 'object') {
  navigator.nako3.addPluginObject("PluginActiveCheck", PluginActiveCheck)
} else {
  module.exports = pluginObj
}