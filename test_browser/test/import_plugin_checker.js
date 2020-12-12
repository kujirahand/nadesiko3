if (typeof (navigator) === 'object' && typeof (navigator.nako3) === 'undefined') {
  navigator.nako3 = {
    autoImport: {},
    addPluginObject: function (pluginName, pluginObject) {
      this.autoImport[pluginName] = {
        name: pluginName,
        obj: pluginObject,
        imported: true
      }
    },
    getAutoImport: function (pluginName) {
      return this.autoImport[pluginName]
    },
    hasImport: function (pluginName) {
      return this.autoImport.hasOwnProperty(pluginName)
    }
  }
}

const importStatus = {
  getAutoImport: navigator.nako3.getAutoImport.bind(navigator.nako3),
  hasImport: navigator.nako3.hasImport.bind(navigator.nako3)
}
export { importStatus }
