import { NakoIndentError } from './nako_errors.mjs'
import { NakoPrepare, checkNakoMode } from './nako_prepare.mjs'

// インデント構文のキーワード
const INDENT_MODE_KEYWORDS = ['!インデント構文', '!ここまでだるい']

interface DeletedLine {
  lineNumber: number;
  len: number;
}

interface ConvertResult {
  code: string;
  insertedLines: number[];
  deletedLines: DeletedLine[]
}

interface BlockStruct {
  lines: number[];
  pairs: [number, number][];
  parents: (number | null)[];
  spaces: string[];
}

/**
 * インデント構文指定があればコードを変換する
 */
function convert(code: string, filename = 'main.nako3'): ConvertResult {
  // インデント構文の適用が必要か？
  if (checkNakoMode(code, INDENT_MODE_KEYWORDS)) {
    return convertForIndentMode(code, filename)
  }
  return { code, insertedLines: [], deletedLines: [] }
}

/**
 * インデント構文指定があるかチェックする
 */
function isIndentSyntaxEnabled(code: string): boolean {
  return checkNakoMode(code, INDENT_MODE_KEYWORDS)
}

/** ありえない改行マークを定義 */
const defSpecialRetMark = '🍷🍷改行🍹黐黑鼘鼶齈▨🍺🍺🍶🍶'
let SpecialRetMark = defSpecialRetMark

/** code中にありえない改行マーク生成しモジュール内の変数SpecialRetMarkに設定 */
export function checkSpecialRetMark(code: string): string {
  SpecialRetMark = defSpecialRetMark
  while (code.indexOf(SpecialRetMark) >= 0) {
    // 適当な文字を足してユニークにする(一応漢字領域で生成)
    const c = String.fromCodePoint(Math.floor(Math.random() * 40952) + 0x4E00)
    SpecialRetMark += c + c
  }
  return SpecialRetMark
}

/**
 * ソースコードのある1行の中のコメントを全て取り除く。
 * 事前にreplaceRetMarkによって文字列や範囲コメント内の改行文字が置換されている必要がある。
 */
export function removeCommentsFromLine(src: string): string {
  const prepare = NakoPrepare.getInstance() // `※`, `／/`, `／＊` といったパターン全てに対応するために必要
  const len = src.length
  let result = ''
  let eos = ''
  let i = 0
  let isComment = false
  while (i < len) {
    const c = src.charAt(i)
    const ch2 = src.substring(i, 2)
    const cPrepared = prepare.convert1ch(c)
    const ch2Prepared = ch2.split('').map((c) => prepare.convert1ch(c)).join('')

    // eosか?
    if (eos !== '') {
      // srcのi文字目以降がeosで始まるなら文字列を終了、そうでなければ1文字進める
      if (eos === (eos.length === 1 ? cPrepared : ch2Prepared)) {
        if (!isComment) {
          result += src.substr(i, eos.length)
        }
        i += eos.length
        isComment = false
        eos = ''
      } else {
        if (!isComment) {
          result += c
        }
        i++
      }
      continue
    }
    // 文字列の改行も無視する
    switch (cPrepared) {
    case '"':
    case '\'':
      eos = c
      result += c
      i++
      continue
    case '「':
      eos = '」'
      result += c
      i++
      continue
    case '『':
      eos = '』'
      result += c
      i++
      continue
    case '“':
      eos = '”'
      result += c
      i++
      continue
    case '{':
      eos = '}'
      result += c
      i++
      continue
    case '[':
      eos = ']'
      result += c
      i++
      continue
    }

    switch (ch2) {
    case '🌴':
      eos = '🌴'
      result += ch2
      i += 2
      continue
    case '🌿':
      eos = '🌿'
      result += ch2
      i += 2
      continue
    }

    // 行コメント
    if (cPrepared === '#') {
      eos = '\n'
      isComment = true
      i++
      continue
    }
    if (ch2Prepared === '//') {
      eos = '\n'
      isComment = true
      i += 2
      continue
    }

    // 範囲コメント
    if (ch2Prepared === '/*') {
      eos = '*/'
      isComment = true
      i += 2
      continue
    }

    result += c
    i++
  }
  return result
}

/** インデントモードのための変換処理 */
function convertForIndentMode(code: string, filename: string): any {
  // returns => {{ code: string, insertedLines: number[], deletedLines: { lineNumber: number, len: number }[] }}
  const insertedLines: number[] = []
  const deletedLines: DeletedLine[] = []

  const END = 'ここまで‰'
  const code2 = replaceRetMark(code) // 文字列の中などの改行を置換
  const lines = code2.split('\n')
  const lines2: string[] = []
  const indentStack: number[] = []
  let lastIndent = 0

  // 元ソースコードの中に特殊改行マークが含まれるかチェックして含まれるならもっと複雑な特殊マークを動的に生成
  checkSpecialRetMark(code)

  let lineCount = -1
  lines.forEach((line) => {
    lineCount += line.split(SpecialRetMark).length
    // trim line
    // eslint-disable-next-line no-irregular-whitespace
    if (/^[ 　・\t]*$/.test(line)) {
      deletedLines.push({ lineNumber: lines2.length, len: line.length })
      return
    }
    // eslint-disable-next-line no-irregular-whitespace
    const lineTrimed = removeCommentsFromLine(line).replace(/^[ 　・\t]+/, '').replace(/\s+$/, '')
    if (lineTrimed === '') {
      lines2.push(line)
      return
    }
    if (lineTrimed === 'ここまで') {
      throw new NakoIndentError('インデント構文が有効化されているときに『ここまで』を使うことはできません。', lineCount, filename)
    }

    // check indent
    const indent = countIndent(line)
    if (lastIndent === indent) {
      lines2.push(line)
      return
    }

    // indent
    if (lastIndent < indent) {
      indentStack.push(lastIndent)
      lastIndent = indent
      lines2.push(line)
      return
    }
    // unindent
    if (lastIndent > indent) {
      // 5回
      //   3回
      //     1を表示
      //   |
      // |
      lastIndent = indent
      while (indentStack.length > 0) {
        const n: number = indentStack.pop() || 0
        if (n === indent) {
          if (lineTrimed.substring(0, 3) !== '違えば') {
            insertedLines.push(lines2.length)
            lines2.push(makeIndent(n) + END)
          }
          lines2.push(line)
          return
        }
        if (indent < n) {
          insertedLines.push(lines2.length)
          lines2.push(makeIndent(n) + END)
          continue
        }
      }
    }
  })
  // 残りのインデントを処理
  while (indentStack.length > 0) {
    const n = indentStack.pop() || 0
    insertedLines.push(lines2.length)
    lines2.push(makeIndent(n) + END)
  }
  // 特別マーカーを改行に置換
  const lines3: string[] = []
  for (let i = 0; i < lines2.length; i++) {
    if (lines2[i].includes(SpecialRetMark)) {
      const lines4 = lines2[i].split(SpecialRetMark)

      // 置換されたマーカーの数だけ、それ以降の行数をずらす。
      // unindentによって挿入された行がSpecialRetMarkを含むことはない。
      for (let j = 0; j < insertedLines.length; j++) {
        if (lines3.length < insertedLines[j]) {
          insertedLines[j] += lines4.length - 1
        }
      }
      for (let j = 0; j < deletedLines.length; j++) {
        if (lines3.length < deletedLines[j].lineNumber) {
          deletedLines[j].lineNumber += lines4.length - 1
        }
      }

      lines3.push(...lines4)
    } else {
      lines3.push(lines2[i])
    }
  }

  return { code: lines3.join('\n'), insertedLines, deletedLines }
}

/**
 * count分だけ字下げする
 * @param {number} count
 */
function makeIndent(count: number): string {
  let s = ''
  for (let i = 0; i < count; i++) {
    s += ' '
  }
  return s
}

/**
 * インデント部分を取り出す
 */
export function getIndent(line: string): string {
  // eslint-disable-next-line no-irregular-whitespace
  const m = /^([ 　・\t]*)/.exec(removeCommentsFromLine(line))
  if (!m) { return '' }
  return m[1]
}

/**
 * インデントの個数を数える
 */
export function countIndent(line: string): number {
  let cnt = 0
  for (let i = 0; i < line.length; i++) {
    const ch = line.charAt(i)
    if (ch === ' ') {
      cnt++
      continue
    }
    if (ch === '　') {
      cnt += 2
      continue
    }
    if (ch === '・') {
      cnt += 2
      continue
    }
    if (ch === '\t') {
      cnt += 4
      continue
    }
    break
  }
  return cnt
}

export function replaceRetMark(src: string): string {
  const prepare = NakoPrepare.getInstance() // `※`, `／/`, `／＊` といったパターン全てに対応するために必要
  const len = src.length
  let result = ''
  let eos = ''
  let i = 0
  while (i < len) {
    const c = src.charAt(i)
    const ch2 = src.substr(i, 2)
    const cPrepared = prepare.convert1ch(c)
    const ch2Prepared = ch2.split('').map((c) => prepare.convert1ch(c)).join('')

    // eosか?
    if (eos !== '') {
      // srcのi文字目以降がeosで始まるなら文字列を終了、そうでなければ1文字進める
      if (eos === (eos.length === 1 ? cPrepared : ch2Prepared)) {
        result += src.substr(i, eos.length)
        i += eos.length
        eos = ''
      } else {
        if (c === '\n') {
          result += SpecialRetMark
        } else {
          result += c
        }
        i++
      }
      continue
    }
    // 文字列の改行も無視する
    switch (cPrepared) {
    case '"':
    case '\'':
      eos = c
      result += c
      i++
      continue
    case '「':
      eos = '」'
      result += c
      i++
      continue
    case '『':
      eos = '』'
      result += c
      i++
      continue
    case '“':
      eos = '”'
      result += c
      i++
      continue
    case '{':
      eos = '}'
      result += c
      i++
      continue
    case '[':
      eos = ']'
      result += c
      i++
      continue
    }

    switch (ch2) {
    case '🌴':
      eos = '🌴'
      result += ch2
      i += 2
      continue
    case '🌿':
      eos = '🌿'
      result += ch2
      i += 2
      continue
    }

    // 行コメント
    if (cPrepared === '#') {
      eos = '\n'
      result += c
      i++
      continue
    }
    if (ch2Prepared === '//') {
      eos = '\n'
      result += ch2
      i += 2
      continue
    }

    // 範囲コメント
    if (ch2Prepared === '/*') {
      eos = '*/'
      result += ch2
      i += 2
      continue
    }

    result += c
    i++
  }
  return result
}

/**
 * コードのインデントの構造を取得する。
 * 空白行や複数行にまたがる構文を考慮する。
 * インデント構文が有効化されていない場合にも使われる。
 */
export function getBlockStructure(code: string): BlockStruct {
  const result: BlockStruct = {
    lines: [], // 各行のインデント量
    pairs: [],
    parents: [], // 各行の親の行
    spaces: [] // 各行のインデントの文字列
  }

  const lines = replaceRetMark(code).split('\n')

  const stack: number[] = []
  let lineCount = 0
  let prev = countIndent(lines[0])
  for (const line of lines) {
    const numLines = line.split(SpecialRetMark).length
    const line2 = removeCommentsFromLine(line)
    // eslint-disable-next-line no-irregular-whitespace
    const current = (line2.replace(/^[ 　・\t]+/, '') === '')
      ? prev
      : countIndent(line2)
    result.lines.push(...Array(numLines).fill(current))
    result.spaces.push(...Array(numLines).fill(getIndent(line2)))

    if (prev < current) {
      stack.push(lineCount - 1)
    } else if (prev > current) {
      const last = stack.pop()
      if (last !== undefined) {
        result.pairs.push([last, lineCount])
      }
    }

    const parent = stack[stack.length - 1] !== undefined ? stack[stack.length - 1] : null
    result.parents.push(...Array(numLines).fill(parent))

    prev = current
    lineCount += numLines
  }

  // スタックが余ったらコードの末尾とペアにする。
  for (const item of stack) {
    result.pairs.push([item, lineCount])
  }

  return result
}

export default {
  convert,
  getBlockStructure,
  getIndent,
  countIndent,
  isIndentSyntaxEnabled
}
