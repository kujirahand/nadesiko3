/** インデント構文を処理するモジュール */

import { Token, NewEmptyToken } from './nako_types.mjs'
import { NakoIndentError } from '../src/nako_errors.mjs'
import { debugTokens, newToken } from './nako_tools.mjs'

const IS_DEBUG = false

function isSkipWord (t: Token): boolean {
  if (t.type === '違えば') { return true }
  if (t.type === 'word' && t.value === 'エラー' && t.josi === 'ならば') { return true }
  return false
}

// 前処理として、JSONオブジェクト内に改行があれば削除する処理を追加
function removeJsonEol(tokens: Token[]) {
  let jsonObjLevel = 0
  let jsonArrayLevel = 0
  let jsonStartIndent = -1
  let flagNeedResetIndent = false
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    // start of JSON
    if (t.type == '{') {
      jsonObjLevel++
      if (jsonStartIndent == -1) {
        jsonStartIndent = t.indent
      }
      continue
    }
    if (t.type == '[') {
      jsonArrayLevel++
      if (jsonStartIndent == -1) {
        jsonStartIndent = t.indent
      }
      continue
    }
    // end of JSON
    if (t.type == '}') {
      jsonObjLevel--
      if (jsonObjLevel == 0 && jsonArrayLevel == 0) {
        flagNeedResetIndent = true
      }
      continue
    }
    if (t.type == ']') {
      jsonArrayLevel--
      if (jsonObjLevel == 0 && jsonArrayLevel == 0) {
        flagNeedResetIndent = true
      }
      continue
    }
    if (jsonObjLevel > 0 || jsonArrayLevel > 0) {
      t.indent = jsonStartIndent
      if (t.type == 'eol') {
        // replace eol to comment
        t.type = 'range_comment'
        t.value = 'json::eol'
      }
      continue
    }
    if (flagNeedResetIndent) {
      t.indent = jsonStartIndent
      if (t.type == 'eol') {
        flagNeedResetIndent = false
        jsonStartIndent = -1
      }
    }
  }
}

/** インラインインデント構文 --- 末尾の":"をインデントを考慮して"ここまで"を挿入 (#1215) */
export function convertInlineIndent (tokens: Token[]): Token[] {
  //
  // 0:もし、A=0ならば:
  // 2:  もし、B=0ならば:
  // 4:    「A=0,B=0」を表示。
  // 2:  違えば:
  // 4:    「A=0,B!=0」を表示。
  // 5:違えば:
  // 6:  「A!=0」を表示。

  // 前処理
  removeJsonEol(tokens)

  // 一行ずつ処理する
  const lines: Token[][] = splitTokens(tokens, 'eol')
  const blockIndents: number[] = []
  let checkICount = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 空行は飛ばす || コメント行だけの行も飛ばす
    if (IsEmptyLine(line)) { continue }
    const leftToken = GetLeftTokens(line)
    // インデントの終了を確認する必要があるか？
    if (checkICount >= 0) {
      const lineICount: number = leftToken.indent
      while (checkICount >= lineICount) {
        const tFirst: Token = leftToken
        // console.log('@@', lineICount, '>>', checkICount, tFirst.type)
        if (isSkipWord(tFirst) && (checkICount === lineICount)) { // 「違えば」や「エラーならば」
          // 「ここまで」の挿入不要 / ただしネストした際の「違えば」(上記の5の状態なら必要)
        } else {
          // ここまでを挿入する
          lines[i - 1].push(newToken('ここまで', 'ここまで', tFirst))
          lines[i - 1].push(newToken('eol', '\n', tFirst))
        }
        blockIndents.pop()
        if (blockIndents.length > 0) {
          checkICount = blockIndents[blockIndents.length - 1]
        } else {
          checkICount = -1
          break
        }
      }
    }
    // 末尾の「:」をチェック
    const tLast: Token = getLastTokenWithoutEOL(line)
    if (tLast.type === ':') {
      // 末尾の「:」を削除
      lines[i] = lines[i].filter(t => t !== tLast)
      checkICount = tLast.indent
      blockIndents.push(checkICount)
    }
  }
  if (lines.length > 0 && blockIndents.length > 0) {
    // トークン情報を得るため、直近のトークンを得る
    let t = tokens[0]
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]
      if (line.length > 0) {
        t = line[line.length - 1]
        break
      }
    }
    // ここまでを差し込む
    for (let i = 0; i < blockIndents.length; i++) {
      lines[lines.length - 1].push(newToken('ここまで', 'ここまで', t))
      lines[lines.length - 1].push(newToken('eol', '\n', t))
    }
  }
  const result = joinTokenLines(lines)
  if (IS_DEBUG) {
    console.log('###', debugTokens(result))
  }
  return result
}

/** 行ごとに分割していたトークンをくっつける */
export function joinTokenLines (lines: Token[][]): Token[] {
  const r: Token[] = []
  for (const line of lines) {
    for (const t of line) {
      r.push(t)
    }
  }
  return r
}

// トークン行の最後のトークンを取得する
function getLastTokenWithoutEOL (line: Token[]): Token {
  const len: number = line.length
  let res: Token = NewEmptyToken('?')
  if (len === 0) { return res }
  // 改行やコメントならば、前のトークンを取得
  for (let i = 0; i < len; i++) {
    // 行末のトークンを取得
    res = line[len - i - 1]
    if (res.type === 'eol') { continue }
    if (res.type === 'line_comment' || res.type === 'range_comment') { continue }
    break
  }
  return res
}

export function splitTokens (tokens: Token[], delimiter: string): Token[][] {
  const result: Token[][] = []
  let line: Token[] = []
  let kakko = 0
  for (const t of tokens) {
    line.push(t)
    if (t.type === '{') {
      kakko++
    } else if (t.type === '}') {
      kakko--
    } else if (kakko === 0 && t.type === delimiter) {
      result.push(line)
      line = []
    }
  }
  if (line.length > 0) {
    result.push(line)
  }
  return result
}

/** トークン行が空かどうか調べる */
function IsEmptyLine (line: Token[]): boolean {
  if (line.length === 0) { return true }
  for (let j = 0; j < line.length; j++) {
    const ty = line[j].type
    if (ty === 'eol' || ty === 'line_comment' || ty === 'range_comment') { continue }
    return false
  }
  return true
}

/** コメントを除去した最初のトークンを返す */
function GetLeftTokens (line: Token[]): Token {
  for (let i = 0; i < line.length; i++) {
    const t = line[i].type
    if (t === 'eol' || t === 'line_comment' || t === 'range_comment') { continue }
    return line[i]
  }
  return line[0]
}

// インデント構文のキーワード
const INDENT_MODE_KEYWORDS = ['!インデント構文', '!ここまでだるい', '💡インデント構文', '💡ここまでだるい']

/** インデント構文 --- インデントを見て"ここまで"を自動挿入 (#596) */
export function convertIndentSyntax (tokens: Token[]): Token[] {
  // インデント構文の変換が必要か?
  if (!useIndentSynax(tokens)) { return tokens }
  // 『ここまで』があったらエラーを出す
  for (const t of tokens) {
    if (t.type === 'ここまで') {
      // エラーを出す
      throw new NakoIndentError('インデント構文が有効化されているときに『ここまで』を使うことはできません。', t.line, t.file)
    }
  }
  // JSON構文のチェック
  let jsonObjLevel = 0
  let jsonArrayLevel = 0
  const checkJsonSyntax = (line: Token[]) => {
    // JSONのオブジェクトがあるか？
    line.forEach((t: Token) => {
      if (t.type === '{') { jsonObjLevel++ }
      if (t.type === '}') { jsonObjLevel-- }
      if (t.type === '[') { jsonArrayLevel++ }
      if (t.type === ']') { jsonArrayLevel-- }
    })
  }
  // 行ごとにトークンを分割
  const blockIndents: number[][] = []
  const lines = splitTokens(tokens, 'eol')
  let lastI = 0
  // 各行を確認する
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 空行は飛ばす || コメント行だけの行も飛ばす
    if (IsEmptyLine(line)) { continue }
    // JSON構文のチェック
    if (jsonArrayLevel > 0 || jsonObjLevel > 0) {
      checkJsonSyntax(line)
      continue
    }
    const leftToken = GetLeftTokens(line)
    const curI: number = leftToken.indent
    if (curI === lastI) { continue }
    // ブロックの終了?
    // 0: 3回
    // 2:   もし、1 > 1ならば
    // 4:     1を表示
    // 2:   違えば
    // 4:     2を表示
    // 0:
    // ブロックの終了?
    if (lastI >= 0) {
      while (lastI > curI) {
        const blockIndentTopLast = blockIndents[blockIndents.length - 1][1]
        // console.log('@@[', i, ']', lastI, '>', curI, '@', blockIndentTopLast, leftToken.type)
        if (isSkipWord(leftToken) && blockIndentTopLast === curI) {
          // 「違えば」などなら不要 (ただし、違えばがネストしている場合は必要)
        } else {
          const t = lines[i - 1][0]
          lines[i - 1].push(newToken('ここまで', 'ここまで', t))
          lines[i - 1].push(newToken('eol', '\n', t))
        }
        blockIndents.pop()
        if (blockIndents.length > 0) {
          lastI = blockIndents[blockIndents.length - 1][0]
        } else {
          lastI = 0
          break
        }
      }
    }
    if (jsonArrayLevel > 0 || jsonObjLevel > 0) { continue }
    // JSON構文のチェック
    checkJsonSyntax(line)
    // ブロックの開始？
    if (curI > lastI) {
      blockIndents.push([curI, lastI])
      lastI = curI
      continue
    }
  }
  // 末尾に「ここまで」を追加する
  for (let i = 0; i < blockIndents.length; i++) {
    // トークン情報を得るため、直近のトークンを得る
    let t = tokens[0]
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i]
      if (line.length > 0) {
        // テンプレートとなるトークンを行の後方から順に探す
        for (let j = 0; j < line.length; j++) {
          const tt = line[line.length - j - 1]
          if (tt.line > 0) {
            t = tt
            break
          }
        }
        break
      }
    }
    lines[lines.length - 1].push(newToken('ここまで', 'ここまで', t))
    lines[lines.length - 1].push(newToken('eol', '\n', t))
  }
  const result = joinTokenLines(lines)
  return result
}

function useIndentSynax (tokens: Token[]) : boolean {
  // インデント構文が必要かチェック (最初の100個をチェック)
  for (let i = 0; i < tokens.length; i++) {
    if (i > 100) { break }
    const t = tokens[i]
    if (t.type === 'line_comment' && (INDENT_MODE_KEYWORDS.indexOf(t.value) >= 0)) {
      return true
    }
  }
  return false
}
