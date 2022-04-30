// なでしこの字句解析を行う
// 既に全角半角を揃えたコードに対して字句解析を行う
import { opPriority } from './nako_parser_const.mjs'

// 予約語句
// (memo)「回」「間」「繰返」「反復」「抜」「続」「戻」「代入」などは _replaceWord で word から変換
/** @types {Record<string, string>} */
import reservedWords from './nako_reserved_words.mjs'

// 助詞の一覧
import { josiRE, removeJosiMap, tararebaMap } from './nako_josi_list.mjs'

// 字句解析ルールの一覧
import { rules, unitRE } from './nako_lex_rules.mjs'

import { NakoLexerError, InternalLexerError } from './nako_errors.mjs'

/**
 * @typedef {import('./nako3.mjs').TokenWithSourceMap} TokenWithSourceMap
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
 * @typedef {Record<string, (
 *     {
 *         type: 'func'
 *         josi: string[][]
 *         fn: null | ((...args: any[]) => any)
 *         varnames: string
 *         funcPointers: boolean[]
 *     } |
 *     {
  *         type: 'var' | 'const'
  *         value: unknown
  *    }
  * )>} FuncList
  */

export class NakoLexer {
  /**
   * @param {import("./nako_logger.mjs").NakoLogger} logger
   */
  constructor (logger) {
    /* @type {import("./nako_logger.mjs").NakoLogger} */
    this.logger = logger
    /** @type {FuncList} */
    this.funclist = {}
    /** @type {TokenWithSourceMap[]} */
    this.result = []
  }

  setFuncList (listObj) {
    this.funclist = listObj
  }

  /**
   * @param {TokenWithSourceMap[]} tokens
   * @param {boolean} isFirst
   */
  replaceTokens (tokens, isFirst) {
    this.result = tokens
    // 関数の定義があれば funclist を更新
    NakoLexer.preDefineFunc(tokens, this.logger, this.funclist)
    this._replaceWord(this.result)

    if (isFirst) {
      if (this.result.length > 0) {
        const eof = this.result[this.result.length - 1]
        this.result.push({
          type: 'eol',
          line: eof.line,
          column: 0,
          file: eof.file,
          josi: '',
          value: '---',
          startOffset: eof.startOffset,
          endOffset: eof.endOffset,
          rawJosi: ''
        }) // 改行
        this.result.push({
          type: 'eof',
          line: eof.line,
          column: 0,
          file: eof.file,
          josi: '',
          value: '',
          startOffset: eof.startOffset,
          endOffset: eof.endOffset,
          rawJosi: ''
        }) // ファイル末尾
      } else {
        this.result.push({
          type: 'eol',
          line: 0,
          column: 0,
          file: '',
          josi: '',
          value: '---',
          startOffset: 0,
          endOffset: 0,
          rawJosi: ''
        }) // 改行
        this.result.push({
          type: 'eof',
          line: 0,
          column: 0,
          file: '',
          josi: '',
          value: '',
          startOffset: 0,
          endOffset: 0,
          rawJosi: ''
        }) // ファイル末尾
      }
    }
    return this.result
  }

  /**
   * ファイル内で定義されている関数名を列挙する。結果はfunclistに書き込む。その他のトークンの置換処理も行う。
   * シンタックスハイライトの処理から呼び出すためにstaticメソッドにしている。
   * @param {TokenWithSourceMap[]} tokens
   * @param {import('./nako_logger.mjs')} logger
   * @param {FuncList} funclist
   */
  static preDefineFunc (tokens, logger, funclist) {
    // 関数を先読みして定義
    let i = 0
    let isFuncPointer = false
    const readArgs = () => {
      const args = []
      const keys = {}
      if (tokens[i].type !== '(') { return [] }
      i++
      while (tokens[i]) {
        const t = tokens[i]
        i++
        if (t.type === ')') { break }
        if (t.type === 'func') { isFuncPointer = true }
        else if (t.type !== '|' && t.type !== 'comma') {
          if (isFuncPointer) {
            t.funcPointer = true
            isFuncPointer = false
          }
          args.push(t)
          if (!keys[t.value]) { keys[t.value] = [] }

          keys[t.value].push(t.josi)
        }
      }
      const varnames = []
      const funcPointers = []
      const result = []
      const already = {}
      for (const arg of args) {
        if (!already[arg.value]) {
          const josi = keys[arg.value]
          result.push(josi)
          varnames.push(arg.value)
          if (arg.funcPointer) { funcPointers.push(arg.value) } else { funcPointers.push(null) }

          already[arg.value] = true
        }
      }

      return [result, varnames, funcPointers]
    }
    // トークンを一つずつ確認
    while (i < tokens.length) {
      // タイプの置換
      const t = tokens[i]
      // 無名関数の定義：「xxには**」があった場合 ... 暗黙的な関数定義とする
      if ((t.type === 'word' && t.josi === 'には') || (t.type === 'word' && t.josi === 'は~')) {
        t.josi = 'には'
        tokens.splice(i + 1, 0, { type: 'def_func', value: '関数', line: t.line, column: t.column, file: t.file, josi: '', startOffset: t.endOffset, endOffset: t.endOffset, rawJosi: '', tag: '無名関数' })
        i++
        continue
      }
      // N回をN|回に置換
      if (t.type === 'word' && t.josi === '' && t.value.length >= 2) {
        if (t.value.match(/回$/)) {
          t.value = t.value.substring(0, t.value.length - 1)
          tokens.splice(i + 1, 0, { type: '回', value: '回', line: t.line, column: t.column, file: t.file, josi: '', startOffset: t.endOffset - 1, endOffset: t.endOffset, rawJosi: '' })
          t.endOffset--
          i++
        }
      }
      // 予約語の置換
      if (t.type === 'word' && reservedWords[t.value]) {
        t.type = reservedWords[t.value]
        if (t.value === 'そう') { t.value = 'それ' }
      }
      // 関数定義の確認
      if (t.type !== 'def_test' && t.type !== 'def_func') {
        i++
        continue
      }
      // 無名関数か普通関数定義かを判定する (1つ前が改行かどうかで判定)
      let isMumei = true
      let prevToken = { type: 'eol' }
      if (i >= 1) { prevToken = tokens[i - 1] }
      if (prevToken.type === 'eol') { isMumei = false }
      // 関数名や引数を得る
      const defToken = t
      i++ // skip "●" or "関数"
      let josi = []
      let varnames = []
      let funcPointers = []
      let funcName = ''
      // 関数名の前に引数定義
      if (tokens[i] && tokens[i].type === '(') { [josi, varnames, funcPointers] = readArgs() }

      // 関数名を得る
      if (!isMumei && tokens[i] && tokens[i].type === 'word') {
        funcName = tokens[i++].value
      }

      // 関数名の後で引数定義
      if (josi.length === 0 && tokens[i] && tokens[i].type === '(') { [josi, varnames, funcPointers] = readArgs() }

      // 名前のある関数定義ならば関数テーブルに関数名を登録
      // 無名関数は登録しないように気をつける
      if (funcName !== '') {
        if (funcName in funclist) { // 関数の二重定義を警告
          logger.warn(`関数『${funcName}』は既に定義されています。`, defToken)
        }
        funclist[funcName] = {
          type: 'func',
          josi,
          fn: null,
          asyncFn: false,
          varnames,
          funcPointers
        }
      }
      // 無名関数のために
      defToken.meta = { josi, varnames, funcPointers }
    }
    // グローバル変数も登録する
    NakoLexer._preDefineFuncVars(tokens, logger, funclist)
  }
  /*
   * @param {TokenWithSourceMap[]} tokens
   * @param {import('./nako_logger.mjs')} logger
   * @param {FuncList} funclist
   */
  static _preDefineFuncVars (tokens, logger, funclist) {
    /** ブロック管理のためのスタック @type { string[] } */
    const blockStack = []
    let i = 0
    const skipToJosi = (josiList) => {
      while (i < tokens.length) {
        const t = tokens[i]
        if (t.type === 'eol') { // 改行まで調べる
          return false
        }
        if (t.josi === '') {
          i++
          continue
        }
        const fi = josiList.indexOf(t.josi)
        if (fi >= 0) {
          return true
        }
        i++
      }
      return false
    }
    let isJokenBunki = false

    // トークンを漏れなくチェックする
    while (i < tokens.length) {
      const t = tokens[i]
      // 条件分岐の「＊＊ならば」の場合
      if (isJokenBunki && t.josi === 'ならば') {
        blockStack.push('条件分岐:ならば')
        i++
        continue
      }
      if (isJokenBunki && t.type === '違えば') {
        blockStack.push('条件分岐:違えば')
        i++
        continue
      }
      if (t.type === 'ここまで') {
        if (blockStack.length == 0) {
          logger.warn(`ファイル『${t.file}』の${t.line}行目に不要な『ここまで』があります。`)
        }
        blockStack.pop()
        i++
        continue
      }
      if (t.type === 'もし') {
        const r = skipToJosi(['ならば', 'でなければ'])
        if (!r) {
          logger.warn(`ファイル『${t.file}』の${t.line}行目の『もし』に対応する『ならば』がありません。`)
          i++
          continue
        }
        const t2 = tokens[i + 1]
        if (t2 && t2.type === 'eol') {
          blockStack.push('もし') // 複文の場合
          i++
        }
        continue
      }
      if (t.type === '回') {
        const t3 = tokens[i + 1]
        if (t3 && t3.type === 'eol') {
          blockStack.push('回') // 複文の場合
        }
        i++
        continue
      }
      if (t.type === '反復') {
        const t3 = tokens[i + 1]
        if (t3 && t3.type === 'eol') {
          blockStack.push('反復') // 複文の場合
        }
        i++
        continue
      }
      if (t.type === '繰返') {
        blockStack.push('繰返')
        i++
        continue
      }
      if (t.type === '間') {
        blockStack.push('間')
        i++
        continue
      }
      if (t.type === '条件分岐') {
        blockStack.push('条件分岐')
        isJokenBunki = true
        i++
        continue
      }
      if (t.type === '実行速度優先') {
        blockStack.push('実行速度優先')
        i++
        continue
      }
      if (t.type === 'エラー監視') { // エラー監視
        blockStack.push('エラー監視')
        i++
        continue
      }
      
      if (t.type === 'def_func' || t.type === 'def_test') {
        blockStack.push('関数')
        i++
        continue
      }
      // グローバル変数の代入があるか
      if (t.type === 'word') {
        const t2 = tokens[i + 1]
        if (!t2) {
          i++
          continue
        }
        // 代入文の場合
        if (t.josi === 'は' || t2.type === 'eq') {
          // blockStackに関数があれば、グローバル変数ではない。グローバルか？
          if (blockStack.indexOf('関数') < 0) { // global
            funclist[t.value] = { type: 'var', value: '' }
          }
          i += 2
          continue
        }
        // Aとは変数
        if (t.josi === 'とは' && t2.type === '変数') {
          if (blockStack.indexOf('関数') < 0) { // global
            funclist[t.value] = { type: 'var', value: '' }
          }
          i+= 2
          continue
        }
        // Aとは定数
        if (t.josi === 'とは' && t2.type === '定数') {
          if (blockStack.indexOf('関数') < 0) { // global
            funclist[t.value] = { type: 'const', value: '' }
          }
          i+= 2
          continue
        }
      }
      i++
    }
  }

  /**
   * 文字列を{と}の部分で分割する。中括弧が対応していない場合nullを返す。
   * @param code {string}
   * @returns {string[] | null}
   */
  splitStringEx (code) {
    /** @type {string[]} */
    const list = []

    // "A{B}C{D}E" -> ["A", "B}C", "D}E"] -> ["A", "B", "C", "D", "E"]
    // "A{B}C}D{E}F" -> ["A", "B}C}D", "E}F"] -> ["A", "B", "C}D", "E", "F"]
    const arr = code.split(/[{｛]/)
    list.push(arr[0])
    for (const s of arr.slice(1)) {
      const end = s.replace('｝', '}').indexOf('}')
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
  _replaceWord (tokens) {
    let comment = []
    let i = 0
    const getLastType = () => {
      if (i <= 0) { return 'eol' }
      return tokens[i - 1].type
    }
    while (i < tokens.length) {
      const t = tokens[i]
      if (t.type === 'word' && t.value !== 'それ') {
        // 関数を変換
        const fo = this.funclist[t.value]
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
      if (t.josi === undefined) { t.josi = '' }
      if (t.josi === 'は') {
        const startOffset = t.endOffset === null ? null : t.endOffset - t.rawJosi.length
        tokens.splice(i + 1, 0, {
          type: 'eq',
          line: t.line,
          column: t.column,
          file: t.file,
          startOffset,
          endOffset: t.endOffset,
          josi: '',
          rawJosi: '',
          value: undefined
        })
        i += 2
        t.josi = t.rawJosi = ''
        t.endOffset = startOffset
        continue
      }
      // 「とは」を一つの単語にする
      if (t.josi === 'とは') {
        const startOffset = t.endOffset === null ? null : t.endOffset - t.rawJosi.length
        tokens.splice(i + 1, 0, {
          type: t.josi,
          line: t.line,
          column: t.column,
          file: t.file,
          startOffset,
          endOffset: t.endOffset,
          josi: '',
          rawJosi: '',
          value: undefined
        })
        t.josi = t.rawJosi = ''
        t.endOffset = startOffset
        i += 2
        continue
      }
      // 助詞のならばをトークンとする
      if (tararebaMap[t.josi]) {
        const josi = (t.josi === 'でなければ' || t.josi === 'なければ') ? 'でなければ' : 'ならば'
        const startOffset = t.endOffset === null ? null : t.endOffset - t.rawJosi.length
        tokens.splice(i + 1, 0, {
          type: 'ならば',
          value: josi,
          line: t.line,
          column: t.column,
          file: t.file,
          startOffset,
          endOffset: t.endOffset,
          josi: '',
          rawJosi: ''
        })
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
        if (!m) { continue }
        ok = true
        // 空白ならスキップ
        if (rule.name === 'space') {
          column += m[0].length
          src = src.substring(m[0].length)
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
            try {
              rp = rule.cbParser(src)
            } catch (e) {
              throw new NakoLexerError(
                e.message,
                srcLength - src.length,
                srcLength - src.length + 1,
                line,
                filename
              )
            }
          }

          if (rule.name === 'string_ex') {
            // 展開あり文字列 → aaa{x}bbb{x}cccc
            const list = this.splitStringEx(rp.res)
            if (list === null) {
              throw new InternalLexerError(
                '展開あり文字列で値の埋め込み{...}が対応していません。',
                srcLength - src.length,
                srcLength - rp.src.length,
                line,
                filename
              )
            }
            let offset = 0
            for (let i = 0; i < list.length; i++) {
              const josi = (i === list.length - 1) ? rp.josi : ''
              if (i % 2 === 0) {
                result.push({
                  type: 'string',
                  value: list[i],
                  file: filename,
                  josi,
                  line,
                  column,
                  preprocessedCodeOffset: srcLength - src.length + offset,
                  preprocessedCodeLength: list[i].length + 2 + josi.length
                })
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
        if (rule.cb) { value = rule.cb(value) }
        // ソースを進める
        columnCurrent = column
        lineCurrent = line
        column += m[0].length
        src = src.substring(m[0].length)
        if ((rule.name === 'eol' && value === '\n') || rule.name === '_eol') {
          value = line++
          column = 1
        }

        // 数値なら単位を持つか？ --- #994
        if (rule.name === 'number') {
          // 単位があれば読み飛ばす
          const um = unitRE.exec(src)
          if (um) {
            src = src.substring(um[0].length)
            column += m[0].length
          }
        }

        let josi = ''
        if (rule.readJosi) {
          const j = josiRE.exec(src)
          if (j) {
            josi = j[0].replace(/^\s+/, '')
            column += j[0].length
            src = src.substring(j[0].length)
            // 助詞の直後にあるカンマを無視 #877
            if (src.charAt(0) === ',') {
              src = src.substring(1)
            }
            // 「＊＊である」なら削除 #939 #974
            if (removeJosiMap[josi]) { josi = '' }
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
        if (rule.name === 'dec_lineno') {
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
          preprocessedCodeLength: (srcLength - src.length) - srcOffset
        })
        break
      }
      if (!ok) {
        throw new InternalLexerError('未知の語句: ' + src.substring(0, 3) + '...',
          srcLength - src.length,
          srcLength - srcLength + 3,
          line
        )
      }
    }
    return result
  }
  // トークン配列をtype文字列に変換
  static tokensToTypeStr(tokens, sep) {
    const a = tokens.map((v) => {
      return v.type
    })
    return a.join(sep)
  }
}
