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
 * @param tokens トークンのリスト
 * @param src 字句解析後(プリプロセス後)のソースコード。
 *            「(処理)を，(条件)」のように語句に取り込まれて消えたカンマを
 *            検出するために使う (省略するとその検出は無効になる)
 */
export function convertDNCL(tokens: Token[], src = ''): Token[] {
  if (!useDNCLmode(tokens)) { return tokens }

  // 一行ずつに分ける
  const lines = splitTokens(tokens, 'eol')
  // 行末が「もし」「を実行し,」「そうでなく(もし)」で、条件や「そうでなければ」が
  // 次の行に続く一般形をサポートするため行を連結する (#1140)
  mergeDNCLLines(lines, src)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 空行(eolやコメントのみの行)は飛ばす
    // ファイル末尾に改行が無い場合、最終行がeolを伴わない1トークンの行になり得るため
    // トークン数ではなく意味のあるトークンの有無で判定する (#1140)
    let hasMeaningful = false
    for (const t of line) {
      if (t.type !== 'eol' && t.type !== 'line_comment' && t.type !== 'range_comment' && t.type !== 'eof') {
        hasMeaningful = true
        break
      }
    }
    if (!hasMeaningful) { continue }
    // 行頭の | はただのインデント
    for (let j = 0; j < line.length; j++) {
      if (line[j].type === '|') {
        line[j].type = 'range_comment'
        continue
      }
      break
    }
    // 後判定の繰り返しの実装のため
    // (「繰返」トークンのみを置き換える。行全体を置き換えると
    //  「繰り返し，(処理)」のように同じ行に続く処理が消えてしまう)
    const t = line[0]
    if (t.type === 'word' && t.value === '繰返') {
      line.splice(0, 1,
        NewEmptyToken('word', '後判定', t.indent, t.line, t.file),
        NewEmptyToken('word', '繰返', t.indent, t.line, t.file))
    }
    // ^\s*を,?(.+)になるまで(繰り返す|実行する)/
    const fi = findTokens(line, ['word:なる', 'word:繰返'])
    if (fi > 0) { replaceAtohantei(line, fi, src) }
    const fi2 = findTokens(line, ['word:なる', 'word:実行'])
    if (fi2 > 0) { replaceAtohantei(line, fi2, src) }

    // 'そうでなければ': '違えば' / 'そうでなく(もし)': '違えば(、もし)'
    // 'を実行しそうでなければ'(「そう」が送り仮名として取り込まれた形)にも対応 (#1140)
    for (let j = 0; j < line.length; j++) { convertSou(line, j) }
    // 「を実行し(,)」や「(処理)を 実行し(,)」が「違えば」の直前に残る場合は除去する
    for (let j = 0; j < line.length; j++) { removeJikkouBeforeTigaeba(line, j) }
    // 「違えば」に同じ行で処理が続く場合は改行を挿入してブロックとして読ませる (#1140)
    // (例: 『を実行し、そうでなければ(処理)』...『を実行する』)
    for (let j = 0; j < line.length; j++) {
      if (line[j].type !== '違えば') { continue }
      let k = j + 1
      while (k < line.length && line[k].type === 'comma') { k++ }
      if (k >= line.length) { continue }
      const t = line[k]
      // 「違えばもし」のような「違えば」+「もし」の組み合わせは対象外
      if (t.type === 'eol' || t.type === 'もし' || t.type === 'ここまで') { continue }
      const eol = NewEmptyToken('eol', '\n', t.indent, t.line, t.file)
      line.splice(k, 0, eol)
    }
    // 'でない' の処理 (#1140)
    for (let j = 1; j < line.length; j++) {
      const tt = line[j]
      if (tt.type !== 'word' || tt.value !== 'ない') { continue }
      const prev = line[j - 1]
      // もし(条件)でないならば → もし(条件)でなければ
      if (tt.josi === 'ならば') {
        // 「AかつBでないならば」のように複合条件の末尾にある「でない」は
        // 直前の項のみを否定する (「でなければ」にすると条件全体に及んでしまう)
        // 「xがyを同値でない」のような引数を取る述語は主語まで巻き戻してから判定する
        const start = rewindDenaiStart(line, denaiExprStart(line, j - 1))
        if (start > 0 && (line[start - 1].type === 'and' || line[start - 1].type === 'or')) {
          // 挿入で位置がずれるため式の先頭からスキャンし直す
          j = wrapDenai(line, j)
          continue
        }
        prev.josi = 'でなければ'
        line.splice(j, 1)
        j--
        continue
      }
      // 「(式)でない」→「not((式))」 (例: 『x=3でないの間』『x=3でないになるまで』)
      if (prev.josi === 'で' || prev.josi === 'では') {
        // 挿入で位置がずれるため式の先頭からスキャンし直す
        j = wrapDenai(line, j)
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

    // 「(条件)の間，(処理)を繰り返す」のように「間」や繰り返し開始の直後に
    // 同じ行で処理が続く場合は改行を挿入してブロックとして読ませる (#1140)
    // (「間」はこの段階ではword型、繰り返し開始はword値で判定する。
    //  「後判定」は「繰返」と対になる接頭辞なので対象外)
    for (let j = 0; j < line.length; j++) {
      const t = line[j]
      const isLoopStart = (t.type === '間') ||
        (t.type === 'word' && (t.value === '間' || t.value === '繰返' || t.value === '増繰返' || t.value === '減繰返'))
      if (!isLoopStart) { continue }
      let k = j + 1
      // 「間」の直後にカンマがあると『間』の直後は改行が必要ですとなるため取り除く
      while (k < line.length && line[k].type === 'comma') { line.splice(k, 1) }
      if (k >= line.length || line[k].type === 'eol' || line[k].type === 'ここまで') { continue }
      line.splice(k, 0, NewEmptyToken('eol', '\n', line[k].indent, line[k].line, line[k].file))
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
    // 「(処理)を実行する」「(処理)を繰り返す」のように助詞「を」が
    // 直前の語句に取り込まれた場合 → ここまで (#1140)
    // ただし行中の「実行」「繰返」がブロックの終端である場合のみ。
    // (関数呼び出し「Fを実行する」を壊さないよう、行内にブロック構文が
    //  あるときに限定する)
    for (let j = 1; j < line.length; j++) {
      const t = line[j]
      if (t.type !== 'word' || (t.value !== '実行' && t.value !== '繰返')) { continue }
      if (line[j - 1].josi !== 'を') { continue }
      // 行内にブロック構文があるか調べる
      // (「間」などの繰り返し開始が「ならば」より前にあっても、行末の
      //  「を実行する」は繰り返しの終端とみなすため loop が最優先)
      // なお「x<3の間，Fを実行するを繰り返す」のように行内の繰り返しで
      // 処理部が関数呼出1語の場合は区別できず終端と誤判定する既知の制限がある
      let block = ''
      let narabaIdx = -1 // 「ならば」助詞を持つトークンの位置
      for (let k = 0; k < j; k++) {
        const u = line[k]
        if (u.type === '間' || (u.type === 'word' &&
            (u.value === '間' || u.value === '後判定' || u.value === '繰返' ||
            u.value === '増繰返' || u.value === '減繰返'))) {
          block = 'loop'
        } else if (u.type === 'ならば' || u.josi === 'ならば' || u.josi === 'でなければ') {
          narabaIdx = k
          if (block !== 'loop') { block = 'ならば' }
        } else if (u.type === 'もし' || u.type === '違えば' ||
            (u.type === 'word' && u.value === 'もし')) {
          if (block === '') { block = 'block' }
        }
      }
      if (block === '') { continue }
      if (block === 'ならば') {
        // 「ならばFを実行する」のように処理部が単独の語(関数呼出)の場合は
        // 終端とみなさず関数呼び出し「実行(F)」のまま残す
        if (narabaIdx >= 0 && j - 1 === narabaIdx + 1) { continue }
        line[j - 1].josi = ''
        // 「ならば」の直後がeolの場合はブロック形式の「もし」なので
        // 終端は「ここまで」に変換する (insertEolAfterNarabaでブロック化された場合)
        if (narabaIdx >= 0 && line[narabaIdx + 1] && line[narabaIdx + 1].type === 'eol') {
          t.type = 'ここまで'
          t.value = 'ここまで'
          t.josi = ''
          continue
        }
        // 「もし〜ならば(処理)を実行する」の終端「を実行する」は単に除去する
        // (インラインの「ならば」文に「ここまで」は使えないため)
        line.splice(j, 1)
        j--
        continue
      }
      line[j - 1].josi = ''
      t.type = 'ここまで'
      t.value = 'ここまで'
      t.josi = ''
    }

    // 'のすべての要素を0にする' / 'の全ての要素に0を代入する'
    for (;;) {
      const ni = findTokens(line, ['word:すべて', 'word:要素'])
      if (ni >= 1) { replaceAllElementV(line, ni) } else { break }
    }
    for (;;) {
      const ni = findTokens(line, ['word:全', 'word:要素'])
      if (ni >= 1) { replaceAllElementV(line, ni) } else { break }
    }
    // 'のすべての値を0にする' / 'の全ての値を0にする'
    for (;;) {
      const ni = findTokens(line, ['word:すべて', 'word:値'])
      if (ni >= 1) { replaceAllElementV(line, ni) } else { break }
    }
    for (;;) {
      const ni = findTokens(line, ['word:全', 'word:値'])
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

function replaceAllElementV(line: Token[], ni: number): void {
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

/** トークンのソース範囲の末尾がカンマかどうか調べる (「を，」のカンマは字句解析で語句に取り込まれて消えるため) */
function tokenEndsWithComma(t: Token, src: string): boolean {
  const off = t.preprocessedCodeOffset
  const len = t.preprocessedCodeLength
  if (typeof off !== 'number' || typeof len !== 'number' || len === 0) { return false }
  const c = src.charAt(off + len - 1)
  return c === ',' || c === '、' || c === '，'
}

function replaceAtohantei(tokens: Token[], fi: number, src: string): void {
  // `ここまで、(${r[1]})になるまでの間`
  const jikkou = tokens[fi + 1] // 挿入で位置がずれるため先に参照を得る
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
  // 「(処理)を，(条件)になるまで」のように助詞「を」や「が」が
  // 直前の語句に取り込まれた場合 (#1140)
  // 区切りとなるのは語句の直後にカンマが書かれている場合のみ
  // (「Aが3以上」「Aがxを含む」のような条件式中の助詞を誤って
  //  区切りにしないため。字句解析で「を，」のカンマは語句に
  //  取り込まれて消えるためソース範囲を参照する)
  if (wo < 0 && ga < 0) {
    let depth = 0 // 括弧の内側にある「を」「が」は対象外とする
    for (let i = fi - 1; i >= 0; i--) {
      const t = tokens[i]
      // なお閉じ括弧自身に助詞が取り込まれた形(例:「(処理)を，」)は
      // 区切りとして検出しない。DNCLの正規構文では処理部が括弧で
      // 括られた単一式にならないため実害はない
      if (t.type === ')' || t.type === ']' || t.type === '}') { depth++; continue }
      if (t.type === '(' || t.type === '[' || t.type === '{') { depth--; continue }
      if (depth !== 0) { continue }
      if (t.type === 'eol' || t.type === 'ここまで' || t.type === 'ここから') { break }
      if (t.josi === 'を' || t.josi === 'が') {
        // 「を ,」(助詞とカンマの間に空白)の場合はカンマが独立したトークンになる
        const nextIsComma = tokens[i + 1] && tokens[i + 1].type === 'comma'
        if (!nextIsComma && !tokenEndsWithComma(t, src)) { continue }
        t.josi = ''
        if (nextIsComma) { tokens.splice(i + 1, 1) }
        tokens.splice(i + 1, 0, NewEmptyToken('ここまで', 'ここまで', t.indent, t.line, t.file))
        break
      }
    }
  }
  // なる:まで(fi) 実行:間(fi+1)
  jikkou.value = '間'
}

/** 行末(fromで位置指定可)から意味のあるトークン(eol/コメント以外)を探す。末尾のカンマは1つ読み飛ばす */
function lastMeaningfulToken(line: Token[], skip = 0, from = line.length - 1): Token | null {
  let skippedComma = false
  for (let i = from; i >= 0; i--) {
    const t = line[i]
    if (t.type === 'eol' || t.type === 'line_comment' || t.type === 'range_comment') { continue }
    if (t.type === 'comma' && !skippedComma) { skippedComma = true; continue }
    if (skip > 0) { skip--; continue }
    return t
  }
  return null
}

/** 行頭から意味のあるトークン(eol/コメント/インデントの「|」以外)を探す */
function firstMeaningfulToken(line: Token[]): Token | null {
  for (const t of line) {
    if (t.type === 'eol' || t.type === 'line_comment' || t.type === 'range_comment' || t.type === '|') { continue }
    return t
  }
  return null
}

/**
 * DNCLの一般形で「もし」「を実行し,」「そうでなく(もし)」などが行末に来て、
 * 条件や「そうでなければ」が次の行に書かれる場合に備えて行を連結する (#1140)
 */
function mergeDNCLLines(lines: Token[][], src: string): void {
  for (let i = 0; i < lines.length; i++) {
    for (;;) {
      if (i + 1 >= lines.length) { break }
      const line = lines[i]
      const last = lastMeaningfulToken(line)
      if (!last) { break }
      let needMerge = false
      // 「(処理)を，」で終わる行は「(条件)になるまで実行する」が次の行に続く
      // (「を，」のカンマは語句に取り込まれるか独立したトークンになる)
      // なお次行の内容は見ずに無条件で連結する (後判定ループ以外で
      // 「を，」終端の行が現れることは稀なため、連結しても実害はないと判断)
      const afterLast = line.slice(line.lastIndexOf(last) + 1).filter((t) =>
        t.type !== 'eol' && t.type !== 'line_comment' && t.type !== 'range_comment')
      const trailingComma = afterLast.length === 1 && afterLast[0].type === 'comma'
      if ((last.josi === 'を' || last.josi === 'が') &&
          (tokenEndsWithComma(last, src) || trailingComma)) { needMerge = true }
      if (last.type === 'word' && last.value === 'を' && trailingComma) { needMerge = true }
      // 「もし」で終わる行は条件が次の行に続く
      if (last.type === 'もし') { needMerge = true }
      // 「そうでなく(もし)」で終わる行は「もし」や条件が次の行に続く
      // (「そうで」が先行しない行末の「なく」は対象外とする)
      if (last.type === 'word' && (last.value === 'なくもし' || last.value === 'なく')) {
        const prev2 = lastMeaningfulToken(line, 1)
        if (prev2 && prev2.type === 'word' && (prev2.value === 'そう' || prev2.value === 'を実行') &&
            prev2.josi.substring(0, 1) === 'で') { needMerge = true }
      }
      // 「(を)実行し(,)」で終わる行は次の行が「そう」で始まるときだけ連結する
      // (「実行し」と「実行する」はトークン上区別できないため、DNCLで
      //  「Fを実行する」のような関数呼び出しの次行が「そう」で始まる場合も
      //  連結される。DNCLでは「を実行する」自体がブロック終端なので
      //  「終端+そうでなければ」と解釈するのが妥当と判断)
      if (last.type === 'word' && (last.value === 'を実行' || last.value === '実行')) {
        const next = firstMeaningfulToken(lines[i + 1])
        // 次行が「そう」で始まる場合は連結する
        if (next && next.type === 'word' && next.value === 'そう') { needMerge = true }
        // 次行がコメント・空行のみの場合も取り込む (「そう」行まで順に連結される)
        if (!next) { needMerge = true }
      }
      if (!needMerge) { break }
      // 行末のeolを除去して次の行のトークンを全て連結する
      if (line.length > 0 && line[line.length - 1].type === 'eol') { line.pop() }
      const nextLine = lines.splice(i + 1, 1)[0]
      // 連結する行の行頭の「|」はインデントなので範囲コメントにしておく
      for (const t of nextLine) {
        if (t.type === '|') { t.type = 'range_comment' } else { break }
      }
      line.push(...nextLine)
    }
  }
}

/**
 * 「そうでなければ」「そうでなく(もし)」を「違えば(、もし)」に変換する (#1140)
 * 「を実行しそうでなければ」のように「そう」が「を実行」に取り込まれた形や、
 * 「(処理)を 実行し、そうで〜」のように「を」が直前の語句に取り込まれた形にも対応する。
 */
function convertSou(line: Token[], j: number): void {
  const sou = line[j]
  if (sou.type !== 'word') { return }
  const isSou = (sou.value === 'そう')
  const isWoJikko = (sou.value === 'を実行')
  const isJikko = (sou.value === '実行' && j - 1 >= 0 && line[j - 1].josi === 'を')
  if (!isSou && !isWoJikko && !isJikko) { return }
  // 「Aがそうでなければ」のように「そう」が被比較対象の値として使われる場合は
  // 変換しない (「もしそうでなければ」のように制御構文の直後や、
  // 「が」「は」「で」等の助詞を持つ語の直後にある「そう」は値の位置にある)
  if (isSou) {
    const prev = lastMeaningfulToken(line, 0, j - 1)
    if (prev) {
      if (['もし', '違えば', 'ならば', 'ここまで', 'ここから'].indexOf(prev.type) >= 0) { return }
      if (['が', 'と', 'の', 'へ', 'に', 'で', 'より', 'から', 'は'].indexOf(prev.josi) >= 0) { return }
    }
  }
  const toTigaeba = (): void => {
    if (isJikko) { line[j - 1].josi = '' }
    sou.type = '違えば'
    sou.value = '違えば'
    sou.josi = ''
  }
  // 「そうでなければ」→「違えば」 (「そうでなく」は「で」+「なく」に分かれて後段で処理する)
  if (sou.josi === 'でなければ') { toTigaeba(); return }
  if (sou.josi !== 'で') { return }
  const nx = line[j + 1]
  if (!nx || nx.type !== 'word') { return }
  // 「そうでなくもし」→「違えば、もし」
  if (nx.value.substring(0, 4) === 'なくもし') {
    toTigaeba()
    // 「なくもし(、)もし」のような重複する「もし」は除去する (コメントは読み飛ばす)
    if (nx.value === 'なくもし') {
      let mi = j + 2
      while (mi < line.length && (line[mi].type === 'comma' || line[mi].type === 'line_comment' || line[mi].type === 'range_comment')) { mi++ }
      if (line[mi] && line[mi].type === 'もし') { line.splice(mi, 1) }
    }
    // 「なくもしX」のように語が続く場合は分割して元に戻す
    if (nx.value.length > 4) {
      const restStr = nx.value.substring(4)
      const restToken = NewEmptyToken('word', restStr, nx.indent, nx.line, nx.file)
      if (restStr.match(/^\d/)) { restToken.type = 'number' }
      // 「xならば」のように助詞が取り込まれている場合は分割先へ移す
      restToken.josi = nx.josi
      nx.josi = ''
      line.splice(j + 2, 0, restToken)
      nx.value = 'なくもし'
    }
    nx.type = 'もし'
    nx.value = 'もし'
    nx.josi = ''
    insertEolAfterNaraba(line, j + 1)
    return
  }
  // 「そうでなく(条件)」のように「なく」に語が続く場合は分割する
  if (nx.value.substring(0, 2) === 'なく' && nx.value !== 'なく' && nx.value.substring(0, 4) !== 'なくもし') {
    const restStr = nx.value.substring(2)
    const restToken = NewEmptyToken('word', restStr, nx.indent, nx.line, nx.file)
    if (restStr.match(/^\d/)) { restToken.type = 'number' }
    // 「xならば」のように助詞が取り込まれている場合は分割先へ移す
    restToken.josi = nx.josi
    nx.josi = ''
    line.splice(j + 2, 0, restToken)
    nx.value = 'なく'
  }
  // 「そうでなく」→「違えば」 (「もし」が続く場合は残し、続かない場合は「なく」を「もし」に変える)
  if (nx.value === 'なく') {
    toTigaeba()
    // 「なく(、)(コメント)もし」のカンマやコメントは読み飛ばして「もし」の有無を確認する
    // (「そうでなく # コメント」の次行が「もし」で始まる場合に連結済みの行へコメントが残り得る)
    let mi = j + 2
    while (mi < line.length && (line[mi].type === 'comma' || line[mi].type === 'line_comment' || line[mi].type === 'range_comment')) { mi++ }
    const nn = line[mi]
    // 「なく」とカンマだけを除去し、コメントは残す (コメントは後段のconvertTokenで除去される)
    const removeNakuAndCommas = (): void => {
      for (let k = mi - 1; k > j; k--) {
        if (line[k].type === 'line_comment' || line[k].type === 'range_comment') { continue }
        line.splice(k, 1)
      }
    }
    if (nn && nn.type === 'もし') {
      // 「なく(、)もし」→「違えば、もし」 (「なく」とカンマを除去する。
      // コメントは行末(eolの直前)へ移す。間に残すと後段でeolに変換され
      // 「違えば→もし」の連続(else if)が崩れてしまうため)
      const comments: Token[] = []
      for (let k = mi - 1; k > j; k--) {
        if (line[k].type === 'line_comment' || line[k].type === 'range_comment') { comments.unshift(line[k]) }
        line.splice(k, 1)
      }
      if (comments.length > 0) {
        let moved = false
        for (let k = j + 1; k < line.length; k++) {
          if (line[k].type === 'eol') { line.splice(k, 0, ...comments); moved = true; break }
        }
        // 行末にeolが無い場合(改行無しの最終行)は末尾へ移す
        if (!moved) { line.push(...comments) }
      }
      insertEolAfterNaraba(line, j + 1)
      return
    }
    // 「なく」のあとに続くものが条件式(ならばで終わる)か調べる
    let hasNaraba = false
    if (nn && nn.type !== 'eol') {
      for (let k = mi; k < line.length; k++) {
        const u = line[k]
        if (u.type === 'eol' || u.type === 'ここまで' || u.type === 'ここから') { break }
        // 「もし」「違えば」「間」などのブロック構文が先に来たら条件式ではない
        if (u.type === 'もし' || u.type === '違えば' || u.type === '間') { break }
        if (u.type === 'word' && (u.value === 'もし' || u.value === '間')) { break }
        // 「ならば」「でなければ」で終わる式は条件式 (「そうでなく(条件)でなければ」= else if not)
        if (u.type === 'ならば' || u.josi === 'ならば' || u.josi === 'でなければ') { hasNaraba = true; break }
      }
    }
    if (hasNaraba) {
      // 「そうでなく(条件)ならば」→ else if
      nx.type = 'もし'
      nx.value = 'もし'
      nx.josi = ''
      insertEolAfterNaraba(line, j + 1)
    } else {
      // 条件が無い(処理ブロックが続く)場合は「違えば」だけにし、
      // 連結済みの行がある場合はブロックの前に改行を挿入する
      removeNakuAndCommas()
      if (nn && nn.type !== 'eol') {
        line.splice(j + 1, 0, NewEmptyToken('eol', '\n', nn.indent, nn.line, nn.file))
      }
    }
  }
}

/**
 * else if化した「もし(条件)ならば/でなければ」の後に処理が同行で続く場合、
 * ブロック形式にするため条件終端(「ならば」「でなければ」の直後)へ改行を挿入する (#1140)
 * (「違えば、もし(条件)ならば」はブロック形式必須のため、
 *  「そうでなく(条件)ならば(処理)」+「を実行する」が受理できない)
 */
function insertEolAfterNaraba(line: Token[], from: number): void {
  for (let k = from; k < line.length; k++) {
    const u = line[k]
    if (u.type === 'eol') { return }
    if (u.type === 'ならば' || u.josi === 'ならば' || u.josi === 'でなければ') {
      const nx = line[k + 1]
      if (nx && nx.type !== 'eol') {
        line.splice(k + 1, 0, NewEmptyToken('eol', '\n', nx.indent, nx.line, nx.file))
      }
      return
    }
  }
}

/** 「違えば」の直前にある「を実行し(,)」「(処理)を 実行し(,)」を除去する (#1140) */
function removeJikkouBeforeTigaeba(line: Token[], j: number): void {
  if (line[j].type !== '違えば') { return }
  let k = j - 1
  // 「を実行し、(コメント)そうでなければ」のようにカンマやコメントが挟まる場合がある
  while (k >= 0 && (line[k].type === 'comma' || line[k].type === 'line_comment' || line[k].type === 'range_comment')) { k-- }
  if (k < 0) { return }
  const t = line[k]
  // 範囲 k..j-1 (「を実行し(,)」等) を除去する。コメントは残す
  // (コメントも消すとcommentTokensから失われてしまうため)
  const removeRangeKeepComments = (): void => {
    for (let m = j - 1; m >= k; m--) {
      if (line[m].type === 'line_comment' || line[m].type === 'range_comment') { continue }
      line.splice(m, 1)
    }
  }
  // 「を実行し(,)そうで〜」→「違えば」
  if (t.type === 'word' && t.value === 'を実行') {
    removeRangeKeepComments()
    return
  }
  // 「(処理)を 実行し(,)そうで〜」→「違えば」
  if (t.type === 'word' && t.value === '実行' && k - 1 >= 0 && line[k - 1].josi === 'を') {
    line[k - 1].josi = ''
    removeRangeKeepComments()
  }
}

/**
 * 「でない」が修飾する式の開始位置を返す (#1140)
 * 「かつ」「または」は常に式の区切りとみなす (複合条件の末尾の「でない」が
 * 条件全体に及ばないようにするため)
 * なお算術演算子は区切りにしない (「AがB+1以上でない」を「!(A≧B+1)」の意と
 * 解釈するため)。そのため「A=0でない+B=0でない」のように算術式と「でない」が
 * 混在する式では末尾だけでなく前方の式全体を否定対象に取る場合がある。
 * (DNCLの条件式は「かつ」「または」で区切るのが正規の形である)
 */
function denaiExprStart(line: Token[], from: number): number {
  const boundaryTypes = ['comma', 'eol', 'ここまで', 'ここから', 'もし', '違えば', 'ならば', '←']
  // なお「そう」は境界に含めない (「Aがそうでない」の「そう」を式として残すため。
  // 「そうでなければ」「そうでなく」は先にconvertSouで「違えば」へ変換済みのため到達しない)
  const boundaryWords = ['間', 'なる', 'を実行', '実行', 'を繰り返', '繰返', 'なく', 'なくもし', '後判定', '増繰返', '減繰返']
  let depth = 0 // 括弧の内側にある「かつ」「または」やカンマは式の区切りとしない
  for (let i = from; i >= 0; i--) {
    const t = line[i]
    if (t.type === ')' || t.type === ']' || t.type === '}') { depth++; continue }
    if (t.type === '(' || t.type === '[' || t.type === '{') {
      if (depth === 0) { return i } // 開き括弧までが式 (括弧ごと否定対象)
      depth--
      continue
    }
    if (depth !== 0) { continue }
    if (t.type === 'and' || t.type === 'or') { return i + 1 }
    if (boundaryTypes.indexOf(t.type) >= 0) { return i + 1 }
    // 「に」「へ」「を」の助詞を持つ語は引数や代入先の末尾であり式の一部になり得ない
    if (t.josi === 'に' || t.josi === 'へ' || t.josi === 'を') { return i + 1 }
    // 「ならば」「でなければ」は助詞として付く (type化は後段のため) ので条件式の区切り
    if (t.josi === 'ならば' || t.josi === 'でなければ') { return i + 1 }
    if (t.type === 'word' && boundaryWords.indexOf(String(t.value)) >= 0) { return i + 1 }
  }
  return 0
}

/**
 * 「でない」の否定範囲の開始位置を巻き戻す (#1140)
 * 「xがyを同値でない」のように引数を取る述語を否定する場合、
 * 助詞境界で切られた範囲の直前にある主語(「が」を持つ語や式)まで広げる。
 * 主語が「A[i]が」「F()が」「(式)が」のように閉じ括弧に付く場合は
 * 対応する開き括弧(と呼出名)まで戻る。
 */
function rewindDenaiStart(line: Token[], start: number): number {
  const argJosi = ['を', 'と', 'の', 'へ', 'に', 'より', 'から']
  for (let i = start - 1; i >= 0; i--) {
    const t = line[i]
    if (argJosi.indexOf(t.josi) >= 0) { continue }
    if (t.josi === 'が') {
      if (t.type === ')' || t.type === ']' || t.type === '}') {
        // 閉じ括弧に「が」が付く場合は対応する開き括弧(と呼出名)まで戻る。
        // 「F()[i]が」のように括弧が連続する場合は繰り返し戻る。
        let pos = i
        while (pos >= 0 && (line[pos].type === ')' || line[pos].type === ']' || line[pos].type === '}')) {
          let d = 0
          let open = -1
          for (let k = pos; k >= 0; k--) {
            const u = line[k]
            if (u.type === ')' || u.type === ']' || u.type === '}') { d++; continue }
            if (u.type === '(' || u.type === '[' || u.type === '{') {
              if (--d === 0) { open = k; break }
            }
          }
          if (open < 0) { break }
          start = open
          pos = open - 1
          // 開き括弧の直前が呼出名(関数名や配列名)ならそれも含める
          if (pos >= 0 && (line[pos].type === 'word' || line[pos].type === 'func')) {
            start = pos
            pos--
          }
        }
      } else {
        start = i
      }
    }
    break
  }
  return start
}

/**
 * 「(式)でない」→「not((式))」に変換する (#1140)
 * 「ならば」以外の助詞が続く場合 (例:『x=3でないの間』『x=3でないになるまで』) が対象。
 * 式の途中にある場合は直前の項だけを否定する (例:『AでないかつB』→『not(A)かつB』)。
 * また「AがBでない」は「A≠B」の意であり、「が」は演算子ではなく助詞のため、
 * 式全体を !() で包むと「が」より前が捨てられてしまう。「が」を「≠」に変換する。
 * (「Aが3以上でない」のような比較句は「!(A≧3)」の意なので式全体を包む)
 * 戻り値は「でない」が修飾する式の開始位置 (呼び出し側でスキャン位置の巻き戻しに使う)
 */
function wrapDenai(line: Token[], nai: number): number {
  const naiToken = line[nai]
  const prev = line[nai - 1]
  prev.josi = ''
  let start = denaiExprStart(line, nai - 1)
  // 「AがBでない」→「A≠B」 (範囲の末尾が比較語でない場合)
  const compSuffix = ['以上', '以下', '未満', '等', 'より',
    '大きい', '小さい', '等しい', '多い', '少ない',
    '大きく', '小さく', '等しく', '多く', '少なく']
  const isComp = prev.type === 'word' && compSuffix.indexOf(String(prev.value)) >= 0
  if (!isComp) {
    // 「AがBでない」→「A≠B」に変換する。
    // ただし「Aがxを含むでない」「AがBと同じでない」のように「が」の後が
    // 引数を取る述語の場合は「が」を「≠」にできないため式全体を否定する。
    let depth = 0
    const callParen: { [key: number]: boolean } = {} // 各階層の括弧が関数呼出か
    for (let i = start; i < nai; i++) {
      const t = line[i]
      if (t.type === '(' || t.type === '[' || t.type === '{') {
        // 直前が語句/関数なら引数を取る呼出や添字の括弧とみなす
        callParen[depth] = i > start && (line[i - 1].type === 'word' || line[i - 1].type === 'func')
        depth++
        continue
      }
      if (t.type === ')' || t.type === ']' || t.type === '}') {
        depth--
        // 「(1+2)が5でない」「A[1]が2でない」のように閉じ括弧に「が」が
        // 取り込まれる場合は括弧全体が左辺になる
        if (depth !== 0 || t.josi !== 'が') { continue }
      } else {
        if (t.josi !== 'が') { continue }
        // 関数呼出や添字の括弧の内側にある「が」は対象外とする
        if (depth > 0 && callParen[depth - 1]) { continue }
      }
      // 「が」の後に「を」「と」等の助詞を持つ語があれば引数を取る述語とみなす
      const rest = line.slice(i + 1, nai)
      if (rest.some((u) => ['を', 'と', 'の', 'へ', 'に', 'より', 'から'].indexOf(u.josi) >= 0)) { break }
      const ga = t
      ga.josi = ''
      prev.josi = naiToken.josi
      line.splice(nai, 1)
      line.splice(i + 1, 0, NewEmptyToken('noteq', '≠', ga.indent, ga.line, ga.file))
      return i
    }
  }
  // 「xがyを同値でない」のように引数を取る述語を否定する場合、
  // 助詞境界で切られた範囲の直前に「が」を持つ主語があれば式の先頭まで巻き戻す
  // (「xが yを !(同値)」のように主語・引数が宙に浮くのを防ぐ)
  start = rewindDenaiStart(line, start)
  const notTok = NewEmptyToken('not', '!', prev.indent, prev.line, prev.file)
  const lp = NewEmptyToken('(', '(', prev.indent, prev.line, prev.file)
  const rp = NewEmptyToken(')', ')', naiToken.indent, naiToken.line, naiToken.file)
  rp.josi = naiToken.josi
  line.splice(nai, 1, rp)
  line.splice(start, 0, notTok, lp)
  return start
}

function findTokens(tokens: Token[], findTypeValue: string[]): number {
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

function useDNCLmode(tokens: Token[]): boolean {
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
