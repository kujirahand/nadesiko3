// なでしこの字句解析を行う
// 既に全角半角を揃えたコードに対して字句解析を行う
const {opPriority} = require('./nako_parser_const')

// 予約語句
const reserveWords = {
  '回': '回',
  '間': '間',
  '繰返': '繰り返す',
  '反復': '反復',
  '抜': '抜ける',
  '続': '続ける',
  '戻': '戻る',
  '代入': '代入',
  '変数': '変数',
  '定数': '定数',
  'エラー監視': 'エラー監視', // 例外処理:エラーならばと対
  'エラー': 'エラー',
  'それ': 'word',
  'そう': 'word', // 「それ」のエイリアス
  '関数': 'def_func' // 無名関数の定義用
}
// 「回」「間」「繰返」「反復」「抜」「続」「戻」「代入」などは replaceWord で word から変換

// 助詞の一覧
const josiList = [
  'について', 'くらい', 'なのか', 'までを', 'までの',
  'とは', 'から', 'まで', 'だけ', 'より', 'ほど', 'など',
  'いて', 'えて', 'きて', 'けて', 'して', 'って', 'にて', 'みて',
  'めて', 'ねて', 'では', 'には', 'は~',
  'は', 'を', 'に', 'へ', 'で', 'と', 'が', 'の'
]
const tararebaJosiList = [
  'でなければ', 'ならば', 'なら', 'たら', 'れば'
]
// 一覧をプログラムで扱いやすいよう変換
const tararebaJosiMap = []
tararebaJosiList.forEach(e => {
  josiList.push(e)
  tararebaJosiMap[e] = true
})
josiList.sort((a, b) => b.length - a.length) // 文字数の長い順に並び替え
const josiRE = new RegExp('^(' + josiList.join('|') + ')')
const kanakanji = /^[\u3005\u4E00-\u9FCF_a-zA-Z0-9ァ-ヶー]+/
const hira = /^[ぁ-ん]/
// 字句解析ルールの一覧
const rules = [
  // 上から順にマッチさせていく
  {name: 'eol', pattern: /^\n/},
  {name: 'eol', pattern: /^;/},
  {name: 'space', pattern: /^(\s+|,)/},
  {name: 'line_comment', pattern: /^#[^\n]*/},
  {name: 'line_comment', pattern: /^\/\/[^\n]*/},
  {name: 'range_comment', pattern: /^\/\*/, cbParser: cbRangeComment},
  {name: 'def_func', pattern: /^●/},
  {name: 'number', pattern: /^0x[0-9a-fA-F]+/, readJosi: true, cb: parseInt},
  {name: 'number', pattern: /^[0-9]+\.[0-9]+[eE][+|-][0-9]+/, readJosi: true, cb: parseFloat},
  {name: 'number', pattern: /^[0-9]+\.[0-9]+/, readJosi: true, cb: parseFloat},
  {name: 'number', pattern: /^[0-9]+/, readJosi: true, cb: parseInt},
  {name: 'ここから', pattern: /^(ここから|→)/},
  {name: 'ここまで', pattern: /^(ここまで|←|-{3,})/},
  {name: 'もし', pattern: /^もしも?/},
  // ならば ← 助詞として定義
  {name: '違えば', pattern: /^違(えば)?/},
  // 「回」「間」「繰返」「反復」「抜」「続」「戻」「代入」などは replaceWord で word から変換
  {name: 'gteq', pattern: /^(≧|>=|=>)/},
  {name: 'lteq', pattern: /^(≦|<=|=<)/},
  {name: 'noteq', pattern: /^(≠|<>|!=)/},
  {name: 'eq', pattern: /^=/},
  {name: 'not', pattern: /^!/},
  {name: 'gt', pattern: /^>/},
  {name: 'lt', pattern: /^</},
  {name: 'and', pattern: /^(かつ|&&)/},
  {name: 'or', pattern: /^(または|\|\|)/},
  {name: '@', pattern: /^@/},
  {name: '+', pattern: /^\+/},
  {name: '-', pattern: /^-/},
  {name: '*', pattern: /^(×|\*)/},
  {name: '/', pattern: /^(÷|\/)/},
  {name: '%', pattern: /^%/},
  {name: '^', pattern: /^\^/},
  {name: '&', pattern: /^&/},
  {name: '[', pattern: /^\[/},
  {name: ']', pattern: /^]/, readJosi: true},
  {name: '(', pattern: /^\(/},
  {name: ')', pattern: /^\)/, readJosi: true},
  {name: '|', pattern: /^\|/},
  {name: 'embed_code', pattern: /^JS\{{3}/, cbParser: src => cbString('JS', '}}}', src)},
  {name: 'string', pattern: /^R\{{3}/, cbParser: src => cbString('R', '}}}', src)},
  {name: 'string_ex', pattern: /^S\{{3}/, cbParser: src => cbString('S', '}}}', src)},
  {name: 'string_ex', pattern: /^文字列\{{3}/, cbParser: src => cbString('文字列', '}}}', src)},
  {name: 'string_ex', pattern: /^「/, cbParser: src => cbString('「', '」', src)},
  {name: 'string', pattern: /^『/, cbParser: src => cbString('『', '』', src)},
  {name: 'string_ex', pattern: /^“/, cbParser: src => cbString('“', '”', src)},
  {name: 'string_ex', pattern: /^"/, cbParser: src => cbString('"', '"', src)},
  {name: 'string', pattern: /^'/, cbParser: src => cbString('\'', '\'', src)},
  {name: '」', pattern: /^」/}, // error
  {name: '』', pattern: /^』/}, // error
  {name: '{', pattern: /^\{/},
  {name: '}', pattern: /^\}/, readJosi: true},
  {name: ':', pattern: /^:/},
  {name: '_eol', pattern: /^_\s*\n/},
  // 絵文字変数 = (絵文字)英数字*
  {name: 'word', pattern: /^[\uD800-\uDBFF][\uDC00-\uDFFF][_a-zA-Z0-9]*/, readJosi: true},
  {name: 'word', pattern: /^[\u1F60-\u1F6F][_a-zA-Z0-9]*/, readJosi: true}, // 絵文字
  // 単語句
  {
    name: 'word',
    pattern: /^[_a-zA-Z\u3005\u4E00-\u9FCFぁ-んァ-ヶ]/,
    cbParser: cbWordParser
  }
]

class NakoLexer {
  constructor () {
    this.funclist = {}
  }

  setFuncList (list) {
    this.funclist = list
  }

  setInput (code, isFirst, line) {
    // 最初に全部を区切ってしまう
    this.tokenize(code, line)
    // 関数の定義があれば funclist を更新
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
    const readArgs = () => {
      const args = []
      const keys = {}
      if (tokens[i].type !== '(') return []
      i++
      while (tokens[i]) {
        if (tokens[i].type === ')') {
          i++
          break
        }
        if (tokens[i].type === '|') {
          i++
          continue
        }
        const t = tokens[i]
        args.push(t)
        if (!keys[t.value]) keys[t.value] = []
        keys[t.value].push(t.josi)
        i++
      }
      const varnames = []
      const result = []
      const already = {}
      for (const arg of args) {
        if (!already[arg.value]) {
          const josi = keys[arg.value]
          result.push(josi)
          varnames.push(arg.value)
          already[arg.value] = true
        }
      }
      return [result, varnames]
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
      if (t.type === 'word' && reserveWords[t.value]) {
        t.type = reserveWords[t.value]
        if (t.value === 'そう') t.value = 'それ'
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
      let funcName = ''
      // 関数名の前に引数定義
      if (tokens[i] && tokens[i].type === '(') {
        [josi, varnames] = readArgs()
      }
      // 関数名
      if (tokens[i] && tokens[i].type === 'word') {
        funcName = tokens[i++].value
      }
      // 関数名の後で引数定義
      if (josi.length === 0 && tokens[i] && tokens[i].type === '(') {
        [josi, varnames] = readArgs()
      }
      // 関数定義か？
      if (funcName !== '') {
        this.funclist[funcName] = {
          type: 'func',
          josi,
          fn: null,
          varnames
        }
      }
      // 無名関数のために
      defToken.meta = {josi, varnames}
    }
  }

  replaceWord (tokens) {
    let comment = []
    let i = 0
    const getLastType = () => {
      if (i <= 0) return 'eol'
      return tokens[i - 1].type
    }
    while (i < tokens.length) {
      const t = tokens[i]
      if (t.type === 'word') {
        if (t.value !== 'それ') {
          // 関数を変換
          const f = this.funclist[t.value]
          if (f && f.type === 'func') {
            t.type = 'func'
            t.meta = f
            continue
          }
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
      if (t.josi === undefined) t.josi = ''
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
      if (tararebaJosiMap[t.josi]) {
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
        if (!m) continue
        ok = true
        if (rule.name === 'space') {
          src = src.substr(m[0].length)
          continue
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
        if (rule.cb) value = rule.cb(value)
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
      if (!ok) throw new Error('字句解析で未知の語句(' + (line + 1) + '): ' + src.substr(0, 3) + '...')
    }
  }
}

function trimOkurigana (s) {
  if (!hira.test(s)) {
    s = s.replace(/[ぁ-ん]+/g, '')
  }
  return s
}

function cbWordParser (src) {
  /*
    kanji    = [\u3005\u4E00-\u9FCF]
    hiragana = [ぁ-ん]
    katakana = [ァ-ヶー]
    emoji    = [\u1F60-\u1F6F]
    uni_extra = [\uD800-\uDBFF] [\uDC00-\uDFFF]
    alphabet = [_a-zA-Z]
    numchars = [0-9]
  */
  let res = ''
  let josi = ''
  while (src !== '') {
    // カタカナ漢字英数字か？
    const m = kanakanji.exec(src)
    if (m) {
      res += m[0]
      src = src.substr(m[0].length)
      continue
    }
    // 助詞？
    if (res.length > 0) {
      const j = josiRE.exec(src)
      if (j) {
        josi = j[0]
        src = src.substr(j[0].length)
        break
      }
    }
    // ひらがな？
    const h = hira.test(src)
    if (h) {
      res += src.charAt(0)
      src = src.substr(1)
      continue
    }
    break // other chars
  }
  // 漢字カタカナ英語から始まる語句 --- 送り仮名を省略
  res = trimOkurigana(res)
  // 助詞だけの語句の場合
  if (res === '' && josi !== '') {
    res = josi
    josi = ''
  }
  return {src: src, res: res, josi: josi, numEOL: 0}
}

function cbString (beginTag, closeTag, src) {
  let res = ''
  let josi = ''
  let numEOL = 0
  src = src.substr(beginTag.length) // skip beginTag
  if (closeTag === '}}}') { // 可変閉じタグ
    const sm = src.match(/^\{{3,}/)
    const cnt = sm[0].length
    closeTag = ''
    for (let i = 0; i < cnt; i++) closeTag += '}'
    src = src.substr(cnt)
  }
  const i = src.indexOf(closeTag)
  if (i < 0) { // not found
    res = src
    src = ''
  } else {
    res = src.substr(0, i)
    src = src.substr(i + closeTag.length)
  }
  // 文字列直後の助詞を取得
  const j = josiRE.exec(src)
  if (j) {
    josi = j[0]
    src = src.substr(j[0].length)
  }
  // 改行を数える
  for (let i = 0; i < res.length; i++) {
    if (res.charAt(i) === '\n') numEOL++
  }

  return {src: src, res: res, josi: josi, numEOL: numEOL}
}

function cbRangeComment (src) {
  let res = ''
  let josi = ''
  let numEOL = 0
  src = src.substr(2) // skip /*
  const i = src.indexOf('*/')
  if (i < 0) { // not found
    res = src
    src = ''
  } else {
    res = src.substr(0, i)
    src = src.substr(i + 2)
  }
  res = res.replace(/(^\s+|\s+$)/, '') // trim
  // 改行を数える
  for (let i = 0; i < res.length; i++) {
    if (res.charAt(i) === '\n') numEOL++
  }
  return {src: src, res: res, josi: josi, numEOL: numEOL}
}

module.exports = NakoLexer
