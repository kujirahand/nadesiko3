class NakoRequirePlugin {
  constructor (nako3) {
    this.nako3 = nako3
  }

  // プラグインの取り込み命令からplugin名のリストを取り出し返す
  checkAndPickupRequirePlugin (tokens) {
    let i = 0
    const pluginlist = []
    const l = tokens.length
    while ((i + 2) < l) {
      const tNot = tokens[i]
      if (tNot.type === 'not') {
        const tFile = tokens[i + 1]
        if (tFile.type === 'string' || tFile.type === 'string_ex') {
          const t3rd = tokens[i + 2]
          if (t3rd.value === '取込') {
            pluginlist.push(tFile.value)
            tNot.type = 'eol'
            tFile.type = 'eol'
            t3rd.type = 'eol'
            i += 3
            continue
          } else
          if ((i + 3) < l) {
            const t4th = tokens[i + 3]
            if (t3rd.value === 'プラグイン' &&
                t4th.value === '取込') {
              pluginlist.push(tFile.value)
              tNot.type = 'eol'
              tFile.type = 'eol'
              t3rd.type = 'eol'
              t4th.type = 'eol'
              i += 4
              continue
            }
          }
        }
      }
      i++
    }
    return pluginlist
  }

/*
  // todo:for browser
  // todo:merge logic from cnako
  async preImport(nako3, tokens) {
    const importlist = this.pickupImport( tokens )
    
    if (importlist.length > 0) {
      const pluginpromise = []
      importlist.forEach(filename => {
        pluginpromise.push(import(filename));
      });

      const modules = await Promise.all(pluginpromise)
      modules.forEach(module => {
        Object.keys(module).forEach((key) => {
          console.log('[Plugin]'+key)
          nako3.addPluginObject(key, module[key])
          this.result.push(key)
        })
      })
    }
    return this.result
  }
*/
}

module.exports = NakoRequirePlugin
