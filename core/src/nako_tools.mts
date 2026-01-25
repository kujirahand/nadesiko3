 
/**
 * よく使う処理をまとめたもの
 */
import { Token, NewEmptyToken } from './nako_types.mjs'
import { TokenType } from './nako_token.mjs'

/**
 * トークンの内容をデバッグ出力する関数
 * @param tokens トークンの一覧
 * @returns 文字列
 */
export function debugTokens(tokens: Token[]) {
  const result = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const ftype = t.type
    const fvalue = t.value
    let s = `[${ftype}:${fvalue}]`
    if (ftype === fvalue) { s = ftype }
    if (ftype === 'comma') { s = ',' }
    if (ftype === 'string') { s = `"${fvalue}"` }
    if (ftype === 'number') { s = `(${fvalue})` }
    if (ftype === 'word') { s = `[word:${fvalue}]` }
    if (!result[t.line]) {
      result[t.line] = makeIndent(t.indent)
    }
    result[t.line] += s + t.josi + '|'
  }
  return result.join('\n')
}

export function makeIndent(n: number): string {
  let s = ''
  for (let i = 0; i < n; i++) {
    s += ' '
  }
  return s
}

let lastTokenInfo = NewEmptyToken()
export function newToken(type: TokenType, value: any, templateToken: Token|undefined = undefined): Token {
  if (templateToken) {
    lastTokenInfo = templateToken
  }
  const t = NewEmptyToken(type, value, lastTokenInfo.indent, lastTokenInfo.line, lastTokenInfo.file)
  return t
}
