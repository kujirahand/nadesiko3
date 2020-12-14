class NakoRequireHelper {
  constructor (nako3) {
    this.nako3 = nako3
    this.reset()
  }

  // 重複取込みチェック用の記憶域をクリアする
  reset () {
    this.fileset = new Set()
    this.pluginlist = []
  }

  // ソースの取り込み命令から命令の場所にソースを取り込む
  affectRequire (tokens, filepath, resolveFunc, requireFunc) {
    let i = 0
    let j = 0
    const l = tokens.length
    let hasAsync = false
    const proclist = []
    while ((i + 2) < l) {
      const tNot = tokens[i]
      if (tNot.type === 'not') {
        const tFile = tokens[i + 1]
        if (tFile.type === 'string' || tFile.type === 'string_ex') {
          const tTorikomi = tokens[i + 2]
          if (tTorikomi.value === '取込') {
            const filename = tFile.value
            proclist.push(tokens.slice(j, i)) // tNotの手前まで
            const resolvedPath = resolveFunc(filename, filepath)
            if (resolvedPath !== false) {
              // 同じパスを持つファイルは１度しか取り込まないようにする
              if (!this.fileset.has(resolvedPath)) {
                this.fileset.add(resolvedPath)
                const rslt = requireFunc(resolvedPath)
                proclist.push(rslt)
                if (rslt instanceof Promise) {
                  hasAsync = true
                }
              }
            }
            i += 3 // Not,File,Torikomiの３つを読み飛ばす
            j = i
            continue
          }
        }
      }
      i++
    }
    if (j === 0) {
      // ファイル取込みは無かった
      return tokens
    }
    proclist.push(tokens.slice(j)) // tNotの手前まで
    if (hasAsync) {
      // ファイル取込みがあって、かつ、非同期で取り込まれようとしている
      return new Promise((resolve, reject) => {
        Promise.all(proclist).then(subtokens => {
          let alltokens = []
          subtokens.forEach(a => {
            alltokens = alltokens.concat(a)
          })
          resolve(alltokens)
        }).catch(err => {
          reject(err)
        })
      })
    }
    // ファイル取込みがあってが、同期的に取り込まれている
    let alltokens = []
    proclist.forEach(a => {
      alltokens = alltokens.concat(a)
    })
    return alltokens
  }

  // .nakoか.nako3か.nako.txtか.nako3.txtならばなでしこソースと仮定する
  isNako3 (filename) {
    return /\.nako3?(\.txt)?$/.test(filename)
  }

  // .jsか.js.txtならばpluginと仮定する
  isPlugin (filename) {
    return /\.js(\.txt)?$/.test(filename)
  }

  resolveNako3Basic (filename, basepath) {
    if (this.isPlugin(filename)) {
      this.pluginlist.push(filename)
      return false
    }
    if (this.isNako3(filename)) {
      return filename
    }
    // その他はエラー。
    throw new Error(
      '[取込エラー] 扱いが不明なため『' + filename + '』を取り込めません。')
    return false
  }

  resolveNako3forNodejs (filename, basepath) {
    if (!/\./.test(filename)) {
      this.pluginlist.push(filename)
      return false
    }
    return this.resolveNako3Basic(filename, basepath)
  }

  resolveNako3forBrowser (filename, basepath) {
    return this.resolveNako3Basic(filename, basepath)
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

module.exports = NakoRequireHelper
