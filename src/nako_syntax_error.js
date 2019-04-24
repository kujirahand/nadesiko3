/**
 * なでしこの文法エラーを表示するクラス
 */
class NakoSyntaxError extends Error {
  constructor (msg, line, fname) {
    const line2 = line + 1
    const fname2 = (fname === undefined) ? '' : fname
    const title = `[文法エラー]${fname}(${line2}行目): ${msg}`
    super(title)
  }
}

module.exports = NakoSyntaxError
