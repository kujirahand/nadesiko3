/* eslint-disable @typescript-eslint/no-explicit-any */
// なでしこの字句解析を行う
// 既に全角半角を揃えたコードに対して字句解析を行う
import { opPriority } from './nako_parser_const.mjs'

// 予約語句
// (memo)「回」「間」「繰返」「反復」「抜」「続」「戻」「代入」などは _replaceWord で word から変換
/** @types {Record<string, string>} */
import reservedWords from './nako_reserved_words.mjs'
import { NakoLogger } from './nako_logger.mjs'
import { isIndentChars } from './nako_indent_chars.mjs'

// 助詞の一覧
import { josiRE, removeJosiMap, tararebaMap, josiListExport } from './nako_josi_list.mjs'

// 字句解析ルールの一覧
import { rules, unitRE, cssUnitRE, NakoLexParseResult } from './nako_lex_rules.mjs'
import { NakoLexerError, InternalLexerError } from './nako_errors.mjs'

import { FuncList, FuncArgs, ExportMap, FuncListItem } from './nako_types.mjs'
import { Token, TokenDefFunc } from './nako_token.mjs'

export class NakoLexer {
  public logger: NakoLogger
  public funclist: FuncList // 先読みした関数の一覧
  public modList: string[]
  public result: Token[]
  public modName: string
  public moduleExport: ExportMap
  public reservedWords: string[]
  public josiList: string[]
  /**
   * @param logger
   */
  constructor (logger: NakoLogger) {
    this.logger = logger // 字句解析した際,確認された関数の一覧
    this.funclist = new Map()
    this.modList = [] // 字句解析した際,取り込むモジュール一覧 --- nako3::lex で更新される
    this.result = []
    this.modName = 'main.nako3' // モジュール名
    this.moduleExport = new Map()
    this.reservedWords = Array.from(reservedWords.keys()) // for plugin_system::予約語一覧取得
    this.josiList = josiListExport // for plugin_system::助詞一覧取得
  }

  /** 関数一覧をセット */
  setFuncList (listMap: FuncList) {
    this.funclist = listMap
  }

  /** モジュール公開既定値一覧をセット */
  setModuleExport (exportObj: ExportMap) {
    this.moduleExport = exportObj
  }

  /**
   * @param tokens
   * @param {boolean} isFirst
   * @param {string} filename
   */
  replaceTokens (tokens: Token[], isFirst: boolean, filename: string) {
    this.result = tokens
    this.modName = NakoLexer.filenameToModName(filename)
    // 関数の定義があれば funclist を更新
    NakoLexer.preDefineFunc(tokens, this.logger, this.funclist, this.moduleExport)
    this._replaceWord(this.result)

    if (isFirst) {
      if (this.result.length > 0) {
        const eof = this.result[this.result.length - 1]
        this.result.push({
          type: 'eol',
          line: eof.line,
          column: 0,
          indent: -1,
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
          indent: -1,
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
          indent: -1,
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
          indent: -1,
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
   */
  static preDefineFunc (tokens: Token[], logger: NakoLogger, funclist: FuncList, moduleexport: ExportMap) {
    // 関数を先読みして定義
    let i = 0
    let isFuncPointer = false
    const readArgs = () => {
      const args: Token[] = []
      const keys:{[key:string]: string[]} = {}
      if (tokens[i].type !== '(') { return [] }
      i++
      while (tokens[i]) {
        const t = tokens[i]
        i++
        if (t.type === ')') { break }
        if (t.type === 'func') { isFuncPointer = true } else if (t.type !== '|' && t.type !== 'comma') {
          if (isFuncPointer) {
            t.funcPointer = true
            isFuncPointer = false
          }
          args.push(t)
          if (!keys[t.value]) { keys[t.value] = [] }

          keys[t.value].push(t.josi)
        }
      }
      const varnames: string[] = []
      const funcPointers: any[] = []
      const result: FuncArgs = []
      const already: {[key: string]: boolean} = {}
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
      if (t.type === 'not' && tokens.length - i > 3) {
        let prevToken = { type: 'eol' }
        if (i >= 1) { prevToken = tokens[i - 1] }
        if (prevToken.type === 'eol') {
          let nextToken = tokens[i + 1]
          if (nextToken.type === 'word' && nextToken.value === 'モジュール公開既定値') {
            nextToken.type = 'モジュール公開既定値'
            nextToken = tokens[i + 2]
            if (nextToken.type === 'string' && nextToken.value === '非公開') {
              const modName = NakoLexer.filenameToModName(t.file)
              moduleexport.set(modName, false)
              i += 3
              continue
            } else
              if (nextToken.type === 'string' && nextToken.value === '公開') {
                const modName = NakoLexer.filenameToModName(t.file)
                moduleexport.set(modName, true)
                i += 3
                continue
              }
          }
        }
      }
      // 無名関数の定義：「xxには**」があった場合 ... 暗黙的な関数定義とする
      if ((t.type === 'word' && t.josi === 'には') || (t.type === 'word' && t.josi === 'は~')) {
        t.josi = 'には'
        tokens.splice(i + 1, 0, { type: 'def_func', value: '関数', indent: t.indent, line: t.line, column: t.column, file: t.file, josi: '', startOffset: t.endOffset, endOffset: t.endOffset, rawJosi: '', tag: '無名関数' })
        i++
        continue
      }
      // 永遠に繰り返す→永遠の間に置換 #1686
      if (t.type === 'word' && t.value === '永遠' && t.josi === 'に') {
        const t2 = tokens[i + 1]
        if (t2.value === '繰返') {
          t2.value = '間'
          t2.josi = 'の'
        }
        i++
        continue
      }
      // N回をN|回に置換
      if (t.type === 'word' && t.josi === '' && t.value.length >= 2) {
        if (t.value.match(/回$/)) {
          t.value = t.value.substring(0, t.value.length - 1)
          // N回を挿入
          if (!t.endOffset) { t.endOffset = 1 }
          const kai: Token = { type: '回', value: '回', indent: t.indent, line: t.line, column: t.column, file: t.file, josi: '', startOffset: t.endOffset - 1, endOffset: t.endOffset, rawJosi: '' }
          tokens.splice(i + 1, 0, kai)
          t.endOffset--
          i++
        }
      }
      // 予約語の置換
      if (t.type === 'word') {
        const rtype = reservedWords.get(t.value)
        if (rtype) { t.type = rtype }
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
      const defToken = t as TokenDefFunc
      i++ // skip "●" or "関数"
      let josi = []
      let varnames = []
      let funcPointers = []
      let funcName = ''
      let funcNameToken: Token | null = null
      let isExport : null|boolean = null
      // 関数の属性指定
      if (tokens[i] && tokens[i].type === '{') {
        i++
        const attr = tokens[i] && tokens[i].type === 'word' ? tokens[i].value : ''
        if (attr === '公開') { isExport = true } else if (attr === '非公開') { isExport = false } else if (attr === 'エクスポート') { isExport = true } else { logger.warn(`不明な関数属性『${attr}』が指定されています。`) }
        i++
        if (tokens[i] && tokens[i].type === '}') { i++ }
      }
      // 関数名の前に引数定義
      if (tokens[i] && tokens[i].type === '(') { [josi, varnames, funcPointers] = readArgs() }

      // 関数名を得る
      if (!isMumei && tokens[i] && tokens[i].type === 'word') {
        funcNameToken = tokens[i++]
        funcName = funcNameToken.value
      }

      // 関数名の後で引数定義
      if (josi.length === 0 && tokens[i] && tokens[i].type === '(') { [josi, varnames, funcPointers] = readArgs() }

      // 名前のある関数定義ならば関数テーブルに関数名を登録
      // 無名関数は登録しないように気をつける
      if (funcName !== '' && funcNameToken) {
        const modName = NakoLexer.filenameToModName(t.file)
        funcName = modName + '__' + funcName
        if (funclist.has(funcName)) { // 関数の二重定義を警告
          // main__は省略 #1223
          const dispName = funcName.replace(/^main__/, '')
          logger.warn(`関数『${dispName}』は既に定義されています。`, defToken)
        }
        funcNameToken.value = funcName
        funclist.set(funcName, {
          type: 'func',
          josi,
          fn: null,
          asyncFn: false,
          isExport,
          varnames,
          funcPointers
        })
      }
      // 無名関数のために
      const metaValue: FuncListItem = {
        'type': 'func',
        josi,
        varnames,
        funcPointers
      }
      defToken.meta = metaValue
    }
  }

  /** 文字列を{と}の部分で分割する。中括弧が対応していない場合nullを返す。 */
  splitStringEx (code: string): string[] | null {
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

  _replaceWord (tokens: Token[]): void {
    let comment = []
    let i = 0
    let isFuncPointer = false
    const namespaceStack = []
    const getLastType = () => {
      if (i <= 0) { return 'eol' }
      return tokens[i - 1].type
    }
    let modSelf = (tokens.length > 0) ? NakoLexer.filenameToModName(tokens[0].file) : 'main'
    while (i < tokens.length) {
      const t = tokens[i]
      // モジュール名の変更に対応
      if ((t.type === 'word' || t.type === 'func') && t.value === '名前空間設定') {
        if (isFuncPointer) {
          throw new InternalLexerError(
            '名前空間設定の関数参照を取得することはできません。',
            t.startOffset === undefined ? 0 : t.startOffset,
            t.endOffset === undefined ? 0 : t.endOffset,
            t.line,
            t.file
          )
        }
        namespaceStack.push(modSelf)
        modSelf = tokens[i - 1].value
      }
      if ((t.type === 'word' || t.type === 'func') && t.value === '名前空間ポップ') {
        if (isFuncPointer) {
          throw new InternalLexerError(
            '名前空間ポップの関数参照を取得することはできません。',
            t.startOffset === undefined ? 0 : t.startOffset,
            t.endOffset === undefined ? 0 : t.endOffset,
            t.line,
            t.file
          )
        }
        const space = namespaceStack.pop()
        if (space) { modSelf = space }
      }
      // 関数を強制的に置換( word => func )
      if (t.type === 'word' && t.value !== 'それ') {
        // 関数を変換
        const funcName = t.value
        if (funcName.indexOf('__') < 0) {
          // 自身のモジュール名を検索
          const gname1 = `${modSelf}__${funcName}`
          const gfo1 = this.funclist.get(gname1)
          if (gfo1 && gfo1.type === 'func') {
            const tt = t as TokenDefFunc
            tt.type = isFuncPointer ? 'func_pointer' : 'func'
            tt.meta = gfo1
            tt.value = gname1
            if (isFuncPointer) {
              isFuncPointer = false
              tokens.splice(i - 1, 1)
            }
            continue
          }
          // モジュール関数を置換
          for (const mod of this.modList) {
            const gname = `${mod}__${funcName}`
            const gfo = this.funclist.get(gname)
            const exportDefault = this.moduleExport.get(mod)
            if (gfo && gfo.type === 'func' && (gfo.isExport === true || (gfo.isExport !== false && exportDefault !== false))) {
              const tt = t as TokenDefFunc
              tt.type = isFuncPointer ? 'func_pointer' : 'func'
              tt.meta = gfo
              tt.value = gname
              if (isFuncPointer) {
                isFuncPointer = false
                tokens.splice(i - 1, 1)
              }
              break
            }
          }
        }
        const fo = this.funclist.get(funcName)
        if (fo && fo.type === 'func') {
          const tt = t as TokenDefFunc
          tt.type = isFuncPointer ? 'func_pointer' : 'func'
          tt.meta = fo
          if (isFuncPointer) {
            isFuncPointer = false
            tokens.splice(i - 1, 1)
            continue
          }
        }
      }
      // 関数ポインタの前置詞を検出
      if (isFuncPointer) {
        // 無効な関数参照の指定がある。
      }
      isFuncPointer = false
      if (t.type === 'func' && t.value === '{関数}') {
        i++
        isFuncPointer = true
        continue
      }
      // 数字につくマイナス記号を判定
      // (ng) 5 - 3 || word - 3
      // (ok) (行頭)-3 || 1 * -3 || Aに -3を 足す
      if (t.type === '-' && tokens[i + 1]) {
        const tokenType = tokens[i + 1].type
        if (tokenType === 'number' || tokenType === 'bigint') {
          // 一つ前の語句が、(行頭|演算子|助詞付きの語句)なら 負数である
          const ltype = getLastType()
          if (ltype === 'eol' || opPriority[ltype] || tokens[i - 1].josi !== '') {
            tokens.splice(i, 1) // remove '-'
            if (tokenType === 'number') {
              tokens[i].value *= -1
            } else {
              tokens[i].value = '-' + tokens[i].value
            }
          }
        }
      }
      // 助詞の「は」を = に展開
      if (t.josi === undefined) { t.josi = '' }
      if (t.josi === 'は') {
        if (!t.rawJosi) { t.rawJosi = t.josi }
        const startOffset = (t.endOffset === undefined) ? undefined : t.endOffset - t.rawJosi.length
        tokens.splice(i + 1, 0, {
          type: 'eq',
          indent: t.indent,
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
        if (!t.rawJosi) { t.rawJosi = t.josi }
        const startOffset = t.endOffset === undefined ? undefined : t.endOffset - t.rawJosi.length
        tokens.splice(i + 1, 0, {
          type: 'とは',
          indent: t.indent,
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
        if (!t.rawJosi) { t.rawJosi = josi }
        const startOffset = t.endOffset === undefined ? undefined : t.endOffset - t.rawJosi.length
        tokens.splice(i + 1, 0, {
          type: 'ならば',
          value: josi,
          indent: t.indent,
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
   * インデントの個数を数える
   * @returns 戻り値として[インデント数, 読み飛ばすべき文字数]を返す
   */
  countIndent (src: string): number[] {
    let indent = 0
    for (let i = 0; i < src.length; i++) {
      const c = src.charAt(i)
      const n = isIndentChars(c)
      if (n === 0) {
        return [indent, i]
      }
      indent += n
    }
    return [indent, src.length]
  }

  /**
   * ソースコードをトークンに分割する
   * @param src なでしこのソースコード
   * @param line 先頭行の行番号
   * @param filename ファイル名
   */
  tokenize (src: string, line: number, filename: string): Token[] {
    const srcLength: number = src.length
    const result: Token[] = []
    let columnCurrent
    let lineCurrent
    let column = 1
    let isDefTest = false
    let indent = 0
    // 最初にインデントを数える
    const ia: number[] = this.countIndent(src)
    indent = ia[0] // インデント数
    src = src.substring(ia[1]) // 読み飛ばす文字数
    column += ia[1]
    while (src !== '') {
      let ok = false
      // 各ルールについて
      for (const rule of rules) {
        // 正規表現でマッチ
        const m = rule.pattern.exec(src)
        if (!m) { continue }
        let ruleName = rule.name
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
          let rp: NakoLexParseResult

          if (isDefTest && rule.name === 'word') {
            rp = rule.cbParser(src, false)
          } else {
            try {
              rp = rule.cbParser(src)
            } catch (e: any) {
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
                  indent,
                  line,
                  column,
                  preprocessedCodeOffset: srcLength - src.length + offset,
                  preprocessedCodeLength: list[i].length + 2 + josi.length
                })
                // 先頭なら'"...{'、それ以外なら'}...{'、最後は何でも良い
                offset += list[i].length + 2
              } else {
                result.push({ type: '&', value: '&', josi: '', indent, file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: 0 })
                result.push({ type: '(', value: '(', josi: '', indent, file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: 0 })
                result.push({ type: 'code', value: list[i], josi: '', indent, file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset, preprocessedCodeLength: list[i].length })
                result.push({ type: ')', value: ')', josi: '', indent, file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset + list[i].length, preprocessedCodeLength: 0 })
                result.push({ type: '&', value: '&', josi: '', indent, file: filename, line, column, preprocessedCodeOffset: srcLength - src.length + offset + list[i].length, preprocessedCodeLength: 0 })
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
          result.push({ type: rule.name, value: rp.res, josi: rp.josi, indent, line, column: columnCurrent, file: filename, preprocessedCodeOffset: srcLength - src.length, preprocessedCodeLength: src.length - rp.src.length })
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
        let value: any = m[0]
        if (rule.cb) { value = rule.cb(value) }
        // ソースを進める
        columnCurrent = column
        lineCurrent = line
        column += m[0].length
        src = src.substring(m[0].length)
        // 改行の時の処理
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
          // CSSの単位なら自動的に文字列として認識させる #1811
          const cssUnit = cssUnitRE.exec(src)
          if (cssUnit) {
            ruleName = 'string'
            src = src.substring(cssUnit[0].length)
            column += m[0].length
            value += cssUnit[0]
          }
        }

        let josi = ''
        if (rule.readJosi) {
          // 正規表現で助詞があるか読み取る
          const j = josiRE.exec(src)
          if (j) {
            column += j[0].length
            josi = j[0].replace(/^\s+/, '')
            src = src.substring(j[0].length)
            // 助詞の直後にあるカンマを無視 #877
            if (src.charAt(0) === ',') {
              src = src.substring(1)
            }
            // 「＊＊である」なら削除 #939 #974
            if (removeJosiMap[josi]) { josi = '' }
            // 「もの」構文 (#1614)
            if (josi.substring(0, 2) === 'もの') {
              josi = josi.substring(2)
            }
          }
        }

        switch (ruleName) {
          case 'def_test': {
            isDefTest = true
            break
          }
          case 'eol': { // eolの処理はほかに↑と↓にある
            isDefTest = false
            break
          }
          default: {
            break
          }
        }
        // ここまで‰(#682) を処理
        if (ruleName === 'dec_lineno') {
          line--
          continue
        }

        result.push({
          type: ruleName,
          value,
          indent,
          line: lineCurrent,
          column: columnCurrent,
          file: filename,
          josi,
          preprocessedCodeOffset: srcOffset,
          preprocessedCodeLength: (srcLength - src.length) - srcOffset
        })
        // 改行のとき次の行のインデントを調べる。なお、改行の後は必ずcolumnが1になる。インデント構文のため、一行に2つ以上の文を含むときを考慮する。(core #66)
        if (ruleName === 'eol' && column === 1) {
          const ia = this.countIndent(src)
          indent = ia[0]
          column += ia[1]
          src = src.substring(ia[1]) // インデントを飛ばす
        }
        break
      }
      if (!ok) {
        throw new InternalLexerError('未知の語句: ' + src.substring(0, 3) + '...',
          srcLength - src.length,
          srcLength - srcLength + 3,
          line,
          filename
        )
      }
    }
    return result
  }

  // トークン配列をtype文字列に変換
  static tokensToTypeStr (tokens: Token[], sep: string) {
    const a = tokens.map((v) => {
      return v.type
    })
    return a.join(sep)
  }

  /**
   * ファイル名からモジュール名へ変換
   * @param {string} filename
   * @returns {string}
   */
  static filenameToModName (filename: string) {
    if (!filename) { return 'main' }
    // パスがあればパスを削除
    filename = filename.replace(/[\\:]/g, '/') // Windowsのpath記号を/に置換
    if (filename.indexOf('/') >= 0) {
      const a = filename.split('/')
      filename = a[a.length - 1]
    }
    filename = filename.replace(/\.nako3?$/, '')
    return filename
  }
}
