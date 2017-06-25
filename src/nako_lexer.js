// なでしこの字句解析を行う
// 既に全角半角を揃えたコードに対して字句解析を行う

const josiList = [
  'について', 'くらい', 'なのか', 'までを', 'までの',
  'とは', 'から', 'まで', 'だけ', 'より', 'ほど', 'など',
  'いて', 'えて', 'きて', 'けて', 'して', 'って', 'にて', 'みて',
  'めて', 'ねて', 'では',
  'は', 'を', 'に', 'へ', 'で', 'と', 'が', 'の'
]
const josiRE = new RegExp('^(' + josiList.join('|') + ')')
const rules = [
  // 上から順にマッチさせていく
  { name: 'eol', pattern: /^\n/ },
  { name: 'eol', pattern: /^;/ },
  { name: 'space', pattern: /^(\s+|,)/ },
  { name: 'line_comment', pattern: /^#[^\n]+/ },
  { name: 'line_comment', pattern: /^\/\/[^\n]+/ },
  { name: 'range_comment', pattern: /^\/\*/, cbParser: cbRangeComment },
  { name: 'def_func', pattern: /^(●|関数)/ },
  { name: 'number', pattern: /^0x[0-9a-fA-F]+/, readJosi: true, cb: parseInt },
  { name: 'number', pattern: /^[0-9]+\.[0-9]+[eE][+|-][0-9]+/, readJosi: true, cb: parseFloat },
  { name: 'number', pattern: /^[0-9]+\.[0-9]+/, readJosi: true, cb: parseFloat },
  { name: 'number', pattern: /^[0-9]+/, readJosi: true, cb: parseInt },
  { name: 'ここから', pattern: /^(ここから|→)/ },
  { name: 'ここまで', pattern: /^(ここまで|←|-{3,})/ },
  { name: '代入', pattern: /^代入/, readJosi: true },
  { name: 'もし', pattern: /^もしも?/ },
  { name: 'ならば', pattern: /^(ならば|なら|でなければ)/ },
  { name: '違えば', pattern: /^違(えば)?/ },
  { name: '回', pattern: /^回/ },
  { name: 'while', pattern: /^間/ },
  { name: 'each', pattern: /^反復/, readJosi: true },
  { name: 'for', pattern: /^(繰返|繰り返)/, readJosi: true },
  { name: 'gteq', pattern: /^(>=|=>)/ },
  { name: 'lteq', pattern: /^(<=|=<)/ },
  { name: 'noteq', pattern: /^(<>|!=)/ },
  { name: 'eq', pattern: /^=/ },
  { name: 'not', pattern: /^!/ },
  { name: 'gt', pattern: /^>/ },
  { name: 'lt', pattern: /^</ },
  { name: 'and', pattern: /^&&/ },
  { name: 'or', pattern: /^\|\|/ },
  { name: '=', pattern: /^=/ },
  { name: '@', pattern: /^@/ },
  { name: '+', pattern: /^\+/ },
  { name: '-', pattern: /^-/ },
  { name: '*', pattern: /^\*/ },
  { name: '/', pattern: /^\// },
  { name: '%', pattern: /^%/ },
  { name: '^', pattern: /^\^/ },
  { name: '&', pattern: /^&/ },
  { name: '[', pattern: /^\[/ },
  { name: ']', pattern: /^]/, readJosi: true },
  { name: '(', pattern: /^\(/ },
  { name: ')', pattern: /^\)/, readJosi: true },
  { name: 'embed_code', pattern: /^JS\{{3}/, cbParser: src => cbString('JS', '}}}', src) },
  { name: 'string', pattern: /^R\{{3}/, cbParser: src => cbString('R', '}}}', src) },
  { name: 'string_ex', pattern: /^S\{{3}/, cbParser: src => cbString('S', '}}}', src) },
  { name: 'string_ex', pattern: /^文字列\{{3}/, cbParser: src => cbString('文字列', '}}}', src) },
  { name: 'string_ex', pattern: /^「/, cbParser: src => cbString('「', '」', src) },
  { name: 'string', pattern: /^『/, cbParser: src => cbString('『', '』', src) },
  { name: 'string_ex', pattern: /^"/, cbParser: src => cbString('"', '"', src) },
  { name: 'string', pattern: /^'/, cbParser: src => cbString('\'', '\'', src) },
  { name: '{', pattern: /^\{/ },
  { name: '}', pattern: /^\}/, readJosi: true },
  { name: ':', pattern: /^:/ },
  { name: '_eol', pattern: /^_\s*\n/ },
  // 絵文字変数 = (絵文字)英数字*
  { name: 'word', pattern: /^[\uD800-\uDBFF][\uDC00-\uDFFF][_a-zA-Z0-9]*/, readJosi: true },
  { name: 'word', pattern: /^[\u1F60-\u1F6F][_a-zA-Z0-9]*/, readJosi: true }, // 絵文字
  // 単語句
  {
    name: 'word',
    pattern: /^[_a-zA-Z\u4E00-\u9FCFぁ-んァ-ヶ]/,
    cbParser: cbWordParser
  }
]

class NakoLexer {
  constructor () {
    this.yytext = {}
    this.yyloc = this.yylloc = {
      first_column: 0,
      first_line: 0,
      last_column: 0,
      last_line: 0
    }
    this.funclist = {}
  }
  setFuncList (list) {
    this.funclist = list
  }
  setInput (code) {
    // 最初に全部を区切ってしまう
    this.tokenize(code)
    // 関数の定義があれば funclist を更新
    this.preDefineFunc(this.result)
    this.replaceWord(this.result)
    this.checkSyntaxMark(this.result)
    this.result.push({type: 'eof'})
    return this.result
  }

  lex () {
    if (this.result.length > 0) {
      const t = this.result.shift()
      console.log('...', t)
      this.yytext = t
      this.yyloc.first_line = this.yyloc.last_line = t.line
      this.yylineno = t.line
      return t.type
    }
    return 'eof'
  }

  preDefineFunc (tokens) {
    // 関数を先読みして定義 TODO
    let i = 0
    while (i < tokens.length) {
      if (tokens[i].type !== 'def_func') {
        i++
        continue
      }
      i++ // skip "●"
      if (tokens[i] && tokens[i].type === 'pa_b') {
        while (tokens[i]) {
          if (tokens[i] === 'pa_e') {
            i++
            break
          }
          i++
        }
      }
      if (tokens[i] && tokens[i].type === 'word') {
        const key = tokens[i].value
        this.funclist[key] = []
      }
    }
  }

  replaceWord (tokens) {
    let comment = []
    let i = 0
    while (i < tokens.length) {
      const t = tokens[i]
      // 関数の認識と、もし文の単文と複文の判別処理
      if (t.type === 'word') {
        const f = this.funclist[t.value]
        if (f && f.type === 'func') {
          t.type = 'func'
          t.meta = f
          continue
        }
      }
      // 助詞の「は」を = に展開
      if (t.josi === undefined) t.josi = ''
      if (t.josi === 'は') {
        t.josi = ''
        tokens.splice(i + 1, 0, {type: 'eq', line: t.line})
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

  checkSyntaxMark (tokens) {
  }

  tokenize (src) {
    this.result = []
    let line = 0
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
              throw new Error('字句解析エラー(' + line + '): 展開あり文字列で値の埋め込み{...}が対応していません。')
            }
            for (let i = 0; i < list.length; i++) {
              const josi = (i === list.length - 1) ? rp.josi : ''
              if (i % 2 === 0) {
                const rr = { type: 'string', value: list[i], josi, line }
                this.result.push(rr)
              } else {
                this.result.push({ type: '&', value: '&', josi: '', line })
                this.result.push({ type: 'word', value: list[i], josi: '', line })
                this.result.push({ type: '&', value: '&', josi: '', line })
              }
            }
            line += rp.numEOL
            src = rp.src
            break
          }
          src = rp.src
          const rr = { type: rule.name, value: rp.res, josi: rp.josi, line: line }
          this.result.push(rr)
          line += rp.numEOL
          break
        }
        // 値を変換する必要があるか？
        let value = m[0]
        if (rule.cb) value = rule.cb(value)
        // ソースを進める
        src = src.substr(m[0].length)
        if (rule.name === 'eol' && rule.value === '\n') {
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
      if (!ok) throw new Error(`字句解析で未知の語句(${line}): ` + src.substr(0, 3) + '...')
    }
  }
}

function cbWordParser (src) {
  /*
    kanji    = [\u4E00-\u9FCF]
    hiragana = [ぁ-ん]
    katakana = [ァ-ヶー]
    emoji    = [\u1F60-\u1F6F]
    uni_extra = [\uD800-\uDBFF] [\uDC00-\uDFFF]
    alphabet = [_a-zA-Z]
    numchars = [0-9]
  */
  const kanakanji = /^[\u4E00-\u9FCF_a-zA-Z0-9ァ-ヶー]+/
  const hira = /^[ぁ-ん]/
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
    const j = josiRE.exec(src)
    if (j) {
      josi = j[0]
      src = src.substr(j[0].length)
      break
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
  if (!hira.test(res)) {
    res = res.replace(/[ぁ-ん]+/g, '')
  }
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
