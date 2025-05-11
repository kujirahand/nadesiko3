/**
 * DNCLに対応する構文
 */
// import { NakoIndentError } from './nako_errors.mjs'
import { Token, NewEmptyToken } from './nako_types.mjs'
import { joinTokenLines, splitTokens } from './nako_indent_inline.mjs'
import { TokenType } from './nako_token.mjs'

// DNCLモードのキーワード
const DNCL_KEYWORDS = ['!DNCLモード', '💡DNCLモード']

// 単純な置換チェック
const DNCL_SIMPLES: { [key: string]: string[] } = {
  '←:←': ['eq', '='],
  '÷:÷': ['÷÷', '÷÷'],
  '{:{': ['[', '['],
  '}:}': [']', ']'],
  'word:を実行': ['ここまで', 'ここまで'],
  'word:乱数': ['word', '乱数範囲'],
  'word:表示': ['word', '連続表示']
}

/**
 * DNCLのソースコードをなでしこに変換する
 */
export function convertDNCL (tokens: Token[]): Token[] {
  if (!useDNCLmode(tokens)) { return tokens }

  // 一行ずつに分ける
  const lines = splitTokens(tokens, 'eol')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.length <= 1) { continue } // 空行は飛ばす
    // 行頭の | はただのインデント
    for (let j = 0; j < line.length; j++) {
      if (line[j].type === '|') {
        line[j].type = 'range_comment'
        continue
      }
      break
    }
    // 後判定の繰り返しの実装のため
    const t = line[0]
    if (t.type === 'word' && t.value === '繰返') {
      line.splice(0, line.length,
        NewEmptyToken('word', '後判定', t.indent, t.line, t.file),
        NewEmptyToken('word', '繰返', t.indent, t.line, t.file))
    }
    // ^\s*を,?(.+)になるまで(繰り返す|実行する)/
    const fi = findTokens(line, ['word:なる', 'word:繰返'])
    if (fi > 0) { replaceAtohantei(line, fi) }
    const fi2 = findTokens(line, ['word:なる', 'word:実行'])
    if (fi2 > 0) { replaceAtohantei(line, fi2) }

    // もし(条件)でないならば → もし(条件)でなければ
    const nai = findTokens(line, ['word:ない'])
    if (nai >= 1) {
      const tt = line[nai]
      if (tt.josi === 'ならば') {
        line[nai - 1].josi = 'でなければ'
        line.splice(nai, 1)
      }
    }
    // 二進で表示 (255) → 二進表示(255)
    for (;;) {
      const ni = findTokens(line, ['word:二進', 'word:表示'])
      if (ni < 0) { break }
      line[ni].value = '二進表示'
      line[ni].josi = ''
      line.splice(ni + 1, 1)
    }
    // '改行なしで表示' → '連続無改行表示'
    for (;;) {
      const ni = findTokens(line, ['word:改行', 'word:表示'])
      if (ni < 0) { break }
      // ここ「改行なしで表示」でも「改行ありで表示」でも同じになってしまう
      // なでしこの制限のため仕方なし
      // 「改行ありで表示」は今のところDNCLに存在しないので無視する
      // もし将来的に区別が必要なら、プリプロセス処理でマクロ的に置換処理を行うことで対応できると思う
      const t = line[ni]
      t.value = '連続無改行表示'
      t.josi = ''
      line.splice(ni + 1, 1)
    }
    // 'を実行し,そうでなければ': '違えば',
    for (;;) {
      const ni = findTokens(line, ['word:を実行', 'comma:,', 'word:そう'])
      if (ni < 0) { break }
      const sou = line[ni + 2]
      if (sou.josi === 'でなければ') {
        sou.type = '違えば'
        sou.value = '違えば'
        sou.josi = ''
        line.splice(ni, 3, sou)
        continue
      } else if (sou.josi === 'で') {
        const nakumosi = line[ni + 3]
        if (nakumosi.value.substring(0, 4) === 'なくもし') {
          sou.type = '違えば'
          sou.value = '違えば'
          sou.josi = ''
          line.splice(ni, 3, sou)
          if (nakumosi.value.length > 4) {
            const nakumosiTudukiStr = nakumosi.value.substring(4)
            const nakumosiToken = NewEmptyToken('word', nakumosiTudukiStr, nakumosi.indent, nakumosi.line, nakumosi.file)
            if (nakumosiTudukiStr.match(/^\d/)) { nakumosiToken.type = 'number' }
            line.splice(ni + 2, 0, nakumosiToken)
            nakumosi.value = nakumosi.value.substring(0, 4)
          }
          nakumosi.type = 'もし'
          nakumosi.value = 'もし'
          nakumosi.josi = ''
          continue
        }
      }
      break
    }

    // Iを1から100まで1(ずつ)|増やしな(が)|ら
    for (;;) {
      const ni = findTokens(line, ['word:増', 'word:ら'])
      if (ni < 0) { break }
      const fu = line[ni]
      fu.type = 'word'
      fu.value = '増繰返'
      fu.josi = ''
      line.splice(ni, 2, fu)
    }

    // Iを1から100まで1(ずつ)|増やしな(が)|ら
    for (;;) {
      const ni = findTokens(line, ['word:減', 'word:ら'])
      if (ni < 0) { break }
      const fu = line[ni]
      fu.type = 'word'
      fu.value = '減繰返'
      fu.josi = ''
      line.splice(ni, 2, fu)
    }

    // を繰り返す → ここまで
    for (;;) {
      const ni = findTokens(line, ['word:を繰り返'])
      if (ni < 0) { break }
      const fu = line[ni]
      fu.type = 'ここまで'
      fu.value = 'ここまで'
      fu.josi = ''
    }

    // 'のすべての要素を0にする'
    // 'のすべての要素に0を代入する'
    for (;;) {
      const ni = findTokens(line, ['word:すべて', 'word:要素'])
      if (ni >= 1) { replaceAllElementV(line, ni) } else { break }
    }
    // 'のすべての値を0にする'
    for (;;) {
      const ni = findTokens(line, ['word:すべて', 'word:値'])
      if (ni >= 1) { replaceAllElementV(line, ni) } else { break }
    }

    // 一つずつチェック
    let j = 0
    while (j < line.length) {
      const t = line[j]
      // 減と増の分割
      if (t.type === 'word' && t.value.length >= 2) {
        const c = t.value.charAt(t.value.length - 1)
        if (c === '減' || c === '増') {
          t.value = t.value.substring(0, t.value.length - 1)
          t.josi = 'だけ'
          line.splice(j + 1, 0, NewEmptyToken('word', c, t.indent, t.line, t.file))
        }
        j++
        continue
      }
      j++
    }
  }

  // 最後に単純な置換を行う
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const a = DNCL_SIMPLES[String(t.type) + ':' + String(t.value)]
    if (a !== undefined) {
      t.type = a[0] as TokenType
      t.value = a[1]
    }
  }
  tokens = joinTokenLines(lines)
  return tokens
}

function replaceAllElementV (line: Token[], ni: number): void {
  //
  // const ni = findTokens(line, ['word:すべて', 'word:要素'])
  //
  const t = line[ni]
  line[ni - 1].josi = ''
  const eq = NewEmptyToken('eq', '=', t.indent, t.line, t.file)
  const begin = NewEmptyToken('[', '[', t.indent, t.line, t.file)
  const end = NewEmptyToken(']', ']', t.indent, t.line, t.file)
  end.josi = 'に'
  const val = line[ni + 2]
  val.josi = ''
  const times = NewEmptyToken('number', 100, t.indent, t.line, t.file)
  times.josi = 'を'
  const mul = NewEmptyToken('word', '掛', t.indent, t.line, t.file)
  line.splice(ni, 4, eq, begin, val, end, times, mul)
}

function replaceAtohantei (tokens: Token[], fi: number): void {
  // `ここまで、(${r[1]})になるまでの間`
  const wo = findTokens(tokens, ['word:を'])
  if (wo >= 0) {
    tokens[wo].type = 'ここまで'
    tokens[wo].value = 'ここまで'
  }
  const ga = findTokens(tokens, ['word:が'])
  if (ga >= 0) {
    tokens[ga].type = 'ここまで'
    tokens[ga].value = 'ここまで'
  }
  // なる:まで(fi) 実行(fi+1)
  tokens[fi + 1].value = '間'
}

function findTokens (tokens: Token[], findTypeValue: string[]): number {
  const findA = findTypeValue.map(s => s.split(':'))
  for (let i = 0; i < tokens.length; i++) {
    let flag = true
    for (let j = 0; j < findA.length; j++) {
      const f = findA[j]
      const idx = i + j
      if (idx >= tokens.length) { return -1 }
      if (tokens[idx].type === f[0] && tokens[idx].value === f[1]) {
        continue
      } else {
        flag = false
        break
      }
    }
    if (flag) { return i }
  }
  return -1
}

function useDNCLmode (tokens: Token[]): boolean {
  // 先頭の100語調べる
  for (let i = 0; i < tokens.length; i++) {
    if (i > 100) { break }
    const t = tokens[i]
    if (t.type === 'line_comment' && DNCL_KEYWORDS.indexOf(t.value) >= 0) {
      t.type = 'DNCLモード'
      return true
    }
  }
  return false
}

export const NakoDncl = {
  convert: convertDNCL
}
