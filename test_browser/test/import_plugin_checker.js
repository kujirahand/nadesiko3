const autoImport = {
  name: '',
  obj: undefined,
  imported: false
}

if (typeof (navigator) === 'object' && typeof (navigator.nako3) === 'undefined') {
  navigator.nako3 = {
    addPluginObject: function (pluginName, pluginObject) {
      autoImport.name = pluginName
      autoImport.obj = pluginObject
      autoImport.imported = true
    }
  }
}

const getAutoImport = () => {
  return autoImport
}

const importStatus = {
  getAutoImport: getAutoImport
}
export { importStatus }
