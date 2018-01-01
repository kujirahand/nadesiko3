/**
 * なでしこの文法エラーを表示するクラス
 */
class NakoSyntaxError extends Error {
  constructor (msg, line) {
    const title = `[文法エラー](` + (line + 1) + `): ${msg}`
    super(title)
  }
}

