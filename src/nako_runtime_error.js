/**
 * NakoRuntimeError
 * 実行時エラーのためのクラス
 */

class NakoRuntimeError extends Error {
  constructor (msg, env) {
    const title = '[実行時エラー]'
    if (env && env.__varslist && env.__varslist[0].line) {
      const line = env.__varslist[0].line + 1
      msg = title + '(' + line + ') ' + msg
      super(msg, line)
    } else {
      msg = title + ' ' + msg
      super(msg)
    }
  }
}

module.exports = NakoRuntimeError
