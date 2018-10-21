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
const trimOkurigana = lexRules.trimOkurigana

class NakoLexer {
  constructor () {
    this.funclist = {}
    this.result = []
  }

  // プラグインの取り込みを行う
  static checkRequire (tokens) {
    let i = 0
    while ((i + 2) < tokens.length) {
      const tNot = tokens[i]
      const tFile = tokens[i + 1]
      const tTorikomu = tokens[i + 2]
      if (tNot.type === 'not' && tTorikomu.value === '取込') {
        tNot.type = 'require'
        if (tFile.type === 'string' || tFile.type === 'string_ex') {
          tFile.type = 'string'
        } else {
          throw new Error('[字句解析エラー] 『!「ファイル」を取り込む』の書式で記述してください。')
        }
        i += 3
        continue
      }
      i++
    }
  }

  setFuncList (listObj) {
    this.funclist = listObj
  }

  setInput (code, isFirst, line) {
    // 最初に全部を区切ってしまう
    this.tokenize(code, line)
    // 関数の定義があれば funclist を更新
    NakoLexer.checkRequire(this.result)
    this.preDefineFunc(this.result)
    this.replaceWord(this.result)

    if (isFirst) {
      const eofLine = (this.result.length > 0) ? this.result[this.result.length - 1].line : 0
      this.result.push({type: 'eol', line: eofLine, josi: '', value: '---'}) // 改行
      this.result.push({type: 'eof', line: eofLine, josi: '', value: ''}) // ファイル末尾
    }
    return this.result
  }

  preDefineFunc (tokens) {
    // 関数を先読みして定義
    let i = 0
    let isFuncPointer = false
    const readArgs = () => {
      const args = []
      const keys = {}
      if (tokens[i].type !== '(') {
        return []
      }
      i++
      while (tokens[i]) {
        const t = tokens[i]
        i++
        if (t.type === ')') {
          break
        } else if (t.type === 'func') {
          isFuncPointer = true
        } else if (t.type !== '|' && t.type !== 'comma') {
          if (isFuncPointer) {
            t.funcPointer = true
            isFuncPointer = false
          }
          args.push(t)
          if (!keys[t.value]) {
            keys[t.value] = []
          }
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
          if (arg.funcPointer) {
            funcPointers.push(arg.value)
          } else {
            funcPointers.push(null)
          }
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
        tokens.splice(i + 1, 0, {type: 'def_func', value: '関数', line: t.line, josi: ''})
        i++
        continue
      }
      // 予約語の置換
      if (t.type === 'word' && reservedWords[t.value]) {
        t.type = reservedWords[t.value]
        if (t.value === 'そう') {
          t.value = 'それ'
        }
      }
      // 関数定義の確認
      if (t.type !== 'def_func') {
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
      if (tokens[i] && tokens[i].type === '(') {
        [josi, varnames, funcPointers] = readArgs()
      }
      // 関数名
      if (tokens[i] && tokens[i].type === 'word') {
        funcName = tokens[i++].value
      }
      // 関数名の後で引数定義
      if (josi.length === 0 && tokens[i] && tokens[i].type === '(') {
        [josi, varnames, funcPointers] = readArgs()
      }
      // 関数定義か？
      if (funcName !== '') {
        this.funclist[funcName] = {
          type: 'func',
          josi,
          fn: null,
          varnames,
          funcPointers
        }
      }
      // 無名関数のために
      defToken.meta = {josi, varnames, funcPointers}
    }
  }

  replaceWord (tokens) {
    let comment = []
    let i = 0
    const getLastType = () => {
      if (i <= 0) {
        return 'eol'
      }
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
      if (t.josi === undefined) {
        t.josi = ''
      }
      if (t.josi === 'は') {
        tokens.splice(i + 1, 0, {type: 'eq', line: t.line})
        i += 2
        t.josi = ''
        continue
      }
      // 「とは」を一つの単語にする
      if (t.josi === 'とは') {
        tokens.splice(i + 1, 0, {type: t.josi, line: t.line})
        t.josi = ''
        i += 2
        continue
      }
      // 助詞のならばをトークンとする
      if (josi.tarareba[t.josi]) {
        const josi = (t.josi !== 'でなければ') ? 'ならば' : 'でなければ'
        t.josi = ''
        tokens.splice(i + 1, 0, {type: 'ならば', value: josi, line: t.line})
        i += 2
        continue
      }
      // _ 改行 を飛ばす
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

  tokenize (src, line) {
    this.result = []
    while (src !== '') {
      let ok = false
      for (const rule of rules) {
        const m = rule.pattern.exec(src)
        if (!m) {
          continue
        }
        ok = true
        if (rule.name === 'space') {
          src = src.substr(m[0].length)
          continue
        }
        // 『関数(』の『関数』のtypeを『def_func』に書き換え
        if (rule.name === '(' && 0 < this.result.length && this.result[this.result.length - 1].type === 'func') {
          this.result[this.result.length - 1].type = 'def_func'
        }
        // 特別なパーサを通すか？
        if (rule.cbParser) {
          const rp = rule.cbParser(src)
          if (rule.name === 'string_ex') {
            // 展開あり文字列 → aaa{x}bbb{x}cccc
            const list = rp.res.split(/[{}｛｝]/)
            if (list.length >= 1 && list.length % 2 === 0) {
              throw new Error('字句解析エラー(' + (line + 1) + '): 展開あり文字列で値の埋め込み{...}が対応していません。')
            }
            for (let i = 0; i < list.length; i++) {
              const josi = (i === list.length - 1) ? rp.josi : ''
              if (i % 2 === 0) {
                const rr = {type: 'string', value: list[i], josi, line}
                this.result.push(rr)
              } else {
                list[i] = trimOkurigana(list[i])
                this.result.push({type: '&', value: '&', josi: '', line})
                this.result.push({type: 'code', value: list[i], josi: '', line})
                this.result.push({type: '&', value: '&', josi: '', line})
              }
            }
            line += rp.numEOL
            src = rp.src
            break
          }
          src = rp.src
          const rr = {type: rule.name, value: rp.res, josi: rp.josi, line: line}
          this.result.push(rr)
          line += rp.numEOL
          break
        }
        // 値を変換する必要があるか？
        let value = m[0]
        if (rule.cb) {
          value = rule.cb(value)
        }
        // ソースを進める
        src = src.substr(m[0].length)
        if (rule.name === 'eol' && value === '\n') {
          value = line++
        }
        let josi = ''
        if (rule.readJosi) {
          const j = josiRE.exec(src)
          if (j) {
            josi = j[0]
            src = src.substr(j[0].length)
          }
        }
        this.result.push({
          type: rule.name,
          value: value,
          line: line,
          josi: josi
        })
        break
      }
      if (!ok) {
        throw new Error('字句解析で未知の語句(' + (line + 1) + '): ' + src.substr(0, 3) + '...')
      }
    }
  }
}

module.exports = NakoLexer
