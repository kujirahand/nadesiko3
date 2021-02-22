// なでしこの字句解析を行う
// 既に全角半角を揃えたコードに対して字句解析を行う
const {opPriority} = require('./nako_parser_const')

// 予約語句
// (memo)「回」「間」「繰返」「反復」「抜」「続」「戻」「代入」などは replaceWord で word から変換
const reservedWords = require('./nako_reserved_words')

// 助詞の一覧
const josi = require('./nako_josi_list')
const josiRE = josi.josiRE

// 字句解析ルールの一覧
const lexRules = require('./nako_lex_rules')
const rules = lexRules.rules

const {LexError} = require('./nako_errors')

/**
 * @typedef {import('./nako3').TokenWithSourceMap} TokenWithSourceMap
 * @typedef {{
 *   type: string;
 *   value: unknown;
 *   line: number;
 *   column: number;
 *   file: string;
 *   josi: string;
 *   preprocessedCodeOffset: number;
 *   preprocessedCodeLength: number;
 *   meta?: any;
 * }} Token
 */
 
class NakoLexer {
  constructor () {
    this.funclist = {}
    /** @type {TokenWithSourceMap[]} */
    this.result = []
  }

  setFuncList (listObj) {
    this.funclist = listObj
  }

  setInput (code, line, filename) {
    // 最初に全部を区切ってしまう
    return this.tokenize(code, line, filename)
  }

  /**
   * @param {TokenWithSourceMap[]} tokens
   */
  setInput2 (tokens, isFirst) {
    this.result = tokens
    // 関数の定義があれば funclist を更新
    this.preDefineFunc(this.result)
    this.replaceWord(this.result)

    if (isFirst) {
      if (this.result.length > 0) {
        const eof = this.result[this.result.length - 1]
        this.result.push({type: 'eol', line: eof.line, column: 0, file: eof.file, josi: '', value: '---',
          startOffset: eof.startOffset, endOffset: eof.endOffset, rawJosi: '' }) // 改行
        this.result.push({type: 'eof', line: eof.line, column: 0, file: eof.file, josi: '', value: '',
          startOffset: eof.startOffset, endOffset: eof.endOffset, rawJosi: '' }) // ファイル末尾
      } else {
        this.result.push({type: 'eol', line: 0, column: 0, file: '', josi: '', value: '---',
          startOffset: 0, endOffset: 0, rawJosi: '' }) // 改行
        this.result.push({type: 'eof', line: 0, column: 0, file: '', josi: '', value: '',
          startOffset: 0, endOffset: 0, rawJosi: ''}) // ファイル末尾
      }
    }
    return this.result
  }

  /**
   * @param {TokenWithSourceMap[]} tokens
   */
  preDefineFunc (tokens) {
    // 関数を先読みして定義
    let i = 0
    let isFuncPointer = false
    const readArgs = () => {
      const args = []
      const keys = {}
      if (tokens[i].type !== '(') {return []}
      i++
      while (tokens[i]) {
        const t = tokens[i]
        i++
        if (t.type === ')')
          {break}
         else if (t.type === 'func')
          {isFuncPointer = true}
         else if (t.type !== '|' && t.type !== 'comma') {
          if (isFuncPointer) {
            t.funcPointer = true
            isFuncPointer = false
          }
          args.push(t)
          if (!keys[t.value])
            {keys[t.value] = []}

          keys[t.value].push(t.josi)
        }
      }
      const varnames = []
      const funcPointers = []
      const result = []
      const already = {}
      for (const arg of args)
        {if (!already[arg.value]) {
          const josi = keys[arg.value]
          result.push(josi)
          varnames.push(arg.value)
          if (arg.funcPointer)
            {funcPointers.push(arg.value)}
           else
            {funcPointers.push(null)}

          already[arg.value] = true
        }}

      return [result, varnames, funcPointers]
    }
    // トークンを一つずつ確認
    while (i < tokens.length) {
      // タイプの置換
      const t = tokens[i]
      // 無名関数の定義：「xxには**」があった場合 ... 暗黙的な関数定義とする
      if ((t.type === 'word' && t.josi === 'には') || (t.type === 'word' && t.josi === 'は~')) {
        t.josi = 'には'
        tokens.splice(i + 1, 0, {type: 'def_func', value: '関数', line: t.line, column: t.column, file: t.file, josi: '', startOffset: t.endOffset, endOffset: t.endOffset, rawJosi: ''})
        i++
        continue
      }
      // N回をN|回に置換
      if (t.type === 'word' && t.josi === '' && t.value.length >= 2) {
        if (t.value.match(/回$/)) {
          t.value = t.value.substr(0, t.value.length - 1)
          tokens.splice(i + 1, 0, {type: '回', value: '回', line: t.line, column: t.column, file: t.file, josi: '', startOffset: t.endOffset, endOffset: t.endOffset, rawJosi: ''})
          i++
        }
      }
      // 予約語の置換
      if (t.type === 'word' && reservedWords[t.value]) {
        t.type = reservedWords[t.value]
        if (t.value === 'そう') {t.value = 'それ'}
      }
      // 関数定義の確認
      if (t.type !== 'def_test' && t.type !== 'def_func') {
        i++
        continue
      }
      const defToken = t
      i++ // skip "●"
      let josi = []
      let varnames = []
      let funcPointers = []
      let funcName = ''
      // 関数名の前に引数定義
      if (tokens[i] && tokens[i].type === '(')
        {[josi, varnames, funcPointers] = readArgs()}

      // 関数名
      if (tokens[i] && tokens[i].type === 'word')
        {funcName = tokens[i++].value}

      // 関数名の後で引数定義
      if (josi.length === 0 && tokens[i] && tokens[i].type === '(')
        {[josi, varnames, funcPointers] = readArgs()}

      // 関数定義か？
      if (funcName !== '')
        {this.funclist[funcName] = {
          type: 'func',
          josi,
          fn: null,
          varnames,
          funcPointers
        }}

      // 無名関数のために
      defToken.meta = {josi, varnames, funcPointers}
    }
  }

  /**
   * 文字列を{と}の部分で分割する。中括弧が対応していない場合nullを返す。
   * @param code {string}
   * @returns {string[] | null}
   */
  splitStringEx(code) {
    /** @type {string[]} */
    const list = []

    // "A{B}C{D}E" -> ["A", "B}C", "D}E"] -> ["A", "B", "C", "D", "E"]
    // "A{B}C}D{E}F" -> ["A", "B}C}D", "E}F"] -> ["A", "B", "C}D", "E", "F"]
    const arr = code.split(/[{｛]/)
    list.push(arr[0])
    for (const s of arr.slice(1)) {
      const end = s.replace("｝", "}").indexOf("}")
      if (end === -1) {
        return null
      }
      list.push(s.slice(0, end), s.slice(end + 1))
    }

    return list
  }

  /**
   * @param {TokenWithSourceMap[]} tokens
   */
  replaceWord (tokens) {
    let comment = []
    let i = 0
    const getLastType = () => {
      if (i <= 0) {return 'eol'}
      return tokens[i - 1].type
    }
    while (i < tokens.length) {
      const t = tokens[i]
      if (t.type === 'word' && t.value !== 'それ') {
        // 関数を変換
        let fo = this.funclist[t.value]
        if (fo && fo.type === 'func') {
          t.type = 'func'
          t.meta = fo
          continue
        }
      }
      // 数字につくマイナス記号を判定
      // (ng) 5 - 3 || word - 3
      // (ok) (行頭)-3 || 1 * -3 || Aに -3を 足す
      if (t.type === '-' && tokens[i + 1] && tokens[i + 1].type === 'number') {
        // 一つ前の語句が、(行頭|演算子|助詞付きの語句)なら 負数である
        const ltype = getLastType()
        if (ltype === 'eol' || opPriority[ltype] || tokens[i - 1].josi !== '') {
          tokens.splice(i, 1) // remove '-'
          tokens[i].value *= -1
        }
      }
      // 助詞の「は」を = に展開
      if (t.josi === undefined) {t.josi = ''}
      if (t.josi === 'は') {
        const startOffset = t.endOffset === null ? null : t.endOffset - t.rawJosi.length
        tokens.splice(i + 1, 0, {type: 'eq', line: t.line, column: t.column, file: t.file,
          startOffset, endOffset: t.endOffset, josi: '', rawJosi: '', value: undefined})
        i += 2
        t.josi = t.rawJosi = ''
        t.endOffset = startOffset
        continue
      }
      // 「とは」を一つの単語にする
      if (t.josi === 'とは') {
        const startOffset = t.endOffset === null ? null : t.endOffset - t.rawJosi.length
        tokens.splice(i + 1, 0, {type: t.josi, line: t.line, column: t.column, file: t.file,
          startOffset, endOffset: t.endOffset, josi: '', rawJosi: '', value: undefined})
        t.josi = t.rawJosi = ''
        t.endOffset = startOffset
        i += 2
        continue
      }
      // 助詞のならばをトークンとする
      if (josi.tarareba[t.josi]) {
        const josi = (t.josi === 'でなければ' || t.josi === 'なければ') ? 'でなければ' : 'ならば'
        const startOffset = t.endOffset === null ? null : t.endOffset - t.rawJosi.length
        tokens.splice(i + 1, 0, {type: 'ならば', value: josi, line: t.line, column: t.column, file: t.file,
          startOffset, endOffset: t.endOffset, josi: '', rawJosi: ''})
        t.josi = t.rawJosi = ''
        t.endOffset = startOffset
        i += 2
        continue
      }
      // '_' + 改行 を飛ばす (演算子直後に改行を入れたい場合に使う)
      if (t.type === '_eol') {
        tokens.splice(i, 1)
        continue
      }
      // コメントを飛ばす
      if (t.type === 'line_comment' || t.type === 'range_comment') {
        comment.push(t.value)
        tokens.splice(i, 1)
        continue
      }
      // 改行にコメントを埋め込む
      if (t.type === 'eol') {
        t.value = comment.join('/')
        comment = []
      }
      i++
    }
  }

  /**
   * @param {string} src
   * @param {number} line
   * @param {string} filename
   * @returns {Token[]}
   * @throws {LexError}
   */
  tokenize (src, line, filename) {
    const srcLength = src.length
    /** @type {Token[]} */
    const result = []
    let columnCurrent
    let lineCurrent
    let column = 1
    let isDefTest = false
    while (src !== '') {
      let ok = false
      // 各ルールについて
      for (const rule of rules) {
        // 正規表現でマッチ
        const m = rule.pattern.exec(src)
        if (!m) {continue}
        ok = true
        // 空白ならスキップ
        if (rule.name === 'space') {
          column += m[0].length
          src = src.substr(m[0].length)
          continue
        }
        // マッチしたルールがコールバックを持つなら
        if (rule.cbParser) {
          // コールバックを呼ぶ
          /** @type {{ src: string, res: string, josi: string, numEOL: number }} */
          let rp

          if (isDefTest && rule.name === 'word') {
            rp = rule.cbParser(src, false)
          } else {
            rp = rule.cbParser(src)
          }

          if (rule.name === 'string_ex') {
            // 展開あり文字列 → aaa{x}bbb{x}cccc
            const list = this.splitStringEx(rp.res)
            if (list === null) {
              throw new LexError(
                '展開あり文字列で値の埋め込み{...}が対応していません。',
                srcLength - src.length,
                srcLength - rp.src.length,
                line,
                filename,
              )
            }

            let offset = 0
            for (let i = 0; i < list.length; i++) {
              const josi = (i === list.length - 1) ? rp.josi : ''
              if (i % 2 === 0) {
                result.push({type: 'string', value: list[i], file: filename, josi, line, column,
                             preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: list[i].length + 2 + josi.length})
                // 先頭なら'"...{'、それ以外なら'}...{'、最後は何でも良い
                offset += list[i].length + 2
              } else {
                result.push({ type: '&', value: '&', josi: '', file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: 0 })
                result.push({ type: '(', value: '(', josi: '', file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: 0 })
                result.push({ type: 'code', value: list[i], josi: '', file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: list[i].length })
                result.push({ type: ')', value: ')', josi: '', file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset + list[i].length, preprocessedCodeLength: 0 })
                result.push({ type: '&', value: '&', josi: '', file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset + list[i].length, preprocessedCodeLength: 0 })
                offset += list[i].length
              }
            }
            line += rp.numEOL
            column += src.length - rp.src.length
            src = rp.src
            if (rp.numEOL > 0) {
              column = 1
            }
            break
          }
          columnCurrent = column
          column += src.length - rp.src.length
          result.push({ type: rule.name, value: rp.res, josi: rp.josi, line: line, column: columnCurrent, file: filename, preprocessedCodeOffset: srcLength - src.length, preprocessedCodeLength: src.length - rp.src.length })
          src = rp.src
          line += rp.numEOL
          if (rp.numEOL > 0) {
            column = 1
          }
          break
        }

        // ソースを進める前に位置を計算
        const srcOffset = srcLength - src.length

        // 値を変換する必要があるか？
        /** @type {unknown} */
        let value = m[0]
        if (rule.cb) {value = rule.cb(value)}
        // ソースを進める
        columnCurrent = column
        lineCurrent = line
        column += m[0].length
        src = src.substr(m[0].length)
        if (rule.name === 'eol' && value === '\n') {
          value = line++
          column = 1
        }

        let josi = ''
        if (rule.readJosi) {
          const j = josiRE.exec(src)
          if (j) {
            josi = j[0]
            column += j[0].length
            src = src.substr(j[0].length)
          }
        }

        switch (rule.name) {
          case 'def_test': {
            isDefTest = true
            break
          }
          case 'eol': {
            isDefTest = false
            break
          }
          default: {
            break
          }
        }
        // ここまで‰(#682) を処理
        if (rule.name == 'dec_lineno') {
          line--
          continue
        }

        result.push({
          type: rule.name,
          value: value,
          line: lineCurrent,
          column: columnCurrent,
          file: filename,
          josi: josi,
          preprocessedCodeOffset: srcOffset,
          preprocessedCodeLength: (srcLength - src.length) - srcOffset,
        })
        break
      }
      if (!ok) {
        throw new LexError('未知の語句: ' + src.substr(0, 3) + '...',
          srcLength - src.length,
          srcLength - srcLength + 3,
          line,
        )
      }
    }
    return result
  }
}

module.exports = NakoLexer
