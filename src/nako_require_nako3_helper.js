class NakoRequireNako3 {
  constructor (nako3) {
    this.nako3 = nako3
    this.reset()
  }

  reset () {
    this.fileset = new Set()
  }
  // ソースの取り込み命令から命令の場所にソースを取り込む
  affectRequireNako3 (tokens, filepath, resolveFunc, requireFunc) {
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
          const t3rd = tokens[i + 2]
          if ((i + 3) < l) {
            const t4th = tokens[i + 3]
            if ((t3rd.value === 'ファイル' || t3rd.value === 'ソース') &&
                t4th.value === '取込') {
              const filename = tFile.value
              proclist.push(tokens.slice(j, i)) // tNotの手前まで
              const resolvedPath = resolveFunc(filename, filepath)
              // 同じパスを持つファイルは１度しか取り込まないようにする
              if (!this.fileset.has(resolvedPath)) {
                this.fileset.add(resolvedPath)
                const rslt = requireFunc(resolvedPath)
                proclist.push(rslt)
                if (rslt instanceof Promise) {
                  hasAsync = true
                }
              }
              i += 4 // Not,File,3rd,4thの４つを読み飛ばす
              j = i
              continue
            }
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
}

module.exports = NakoRequireNako3
