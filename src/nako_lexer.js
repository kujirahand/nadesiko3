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
  { name: 'EOL', pattern: /^\n/ },
  { name: 'EOL', pattern: /^;/ },
  { name: 'SPACE', pattern: /^(\s+|,)/ },
  { name: 'DEF_FUNC', pattern: /^(●|関数)/ },
  { name: 'NUMBER', pattern: /^[0-9]+\.[0-9]+[eE][+|-][0-9]+/, cb: parseFloat },
  { name: 'NUMBER', pattern: /^[0-9]+\.[0-9]+/, cb: parseFloat },
  { name: 'NUMBER', pattern: /^[0-9]+/, cb: parseInt },
  { name: 'NUMBER', pattern: /^0x[0-9a-fA-F]/, cb: parseInt },
  { name: 'KOKOKARA', pattern: /^(ここから|→)/ },
  { name: 'KOKOMADE', pattern: /^(ここまで|←|-{3,})/ },
  { name: 'IF', pattern: /^もし/ },
  { name: 'THEN', pattern: /^(ならば|なら)/ },
  { name: 'ELSE', pattern: /^違[ぁ-ん]*/ },
  { name: '回', pattern: /^回/ },
  { name: 'WHILE', pattern: /^間/ },
  { name: 'EACH', pattern: /^反復[ぁ-ん]*/ },
  { name: 'FOR', pattern: /^(繰返|繰り返)[ぁ-ん]*/ },
  { name: 'GTEQ', pattern: /^(>=|=>)/ },
  { name: 'LTEQ', pattern: /^(<=|=<)/ },
  { name: 'NOTEQ', pattern: /^(<>|!=)/ },
  { name: 'EQ', pattern: /^=/ },
  { name: 'GT', pattern: /^>/ },
  { name: 'LT', pattern: /^</ },
  { name: '=', pattern: /^=/ },
  { name: '@', pattern: /^@/ },
  { name: '+', pattern: /^\+/ },
  { name: '-', pattern: /^-/ },
  { name: '*', pattern: /^\*/ },
  { name: '/', pattern: /^\// },
  { name: '%', pattern: /^%/ },
  { name: '[', pattern: /^\[/ },
  { name: ']', pattern: /^]/ },
  { name: '(', pattern: /^\(/ },
  { name: ')', pattern: /^\)/ },
  { name: 'STRING', pattern: /^\{{3}/, cbParser: src => cbString('{{{', '}}}', src) },
  { name: 'STRING', pattern: /^「/, cbParser: src => cbString('「', '」', src) },
  { name: 'STRING', pattern: /^『/, cbParser: src => cbString('『', '』', src) },
  { name: 'STRING', pattern: /^"/, cbParser: src => cbString('"', '"', src) },
  { name: 'STRING', pattern: /^'/, cbParser: src => cbString('\'', '\'', src) },
  { name: '{', pattern: /^\{/ },
  { name: '}', pattern: /^\}/ },
  { name: ':', pattern: /^:/ },
  // 絵文字変数 = (絵文字)英数字*
  { name: 'WORD', pattern: /^[\uD800-\uDBFF][\uDC00-\uDFFF][_a-zA-Z0-9]*/ },
  { name: 'WORD', pattern: /^[\u1F60-\u1F6F][_a-zA-Z0-9]*/ }, // 絵文字
  // 単語句
  {
    name: 'WORD',
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
    this.result = []
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
    this.result.push({type: 'EOF'})
    console.log(this.result)
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
    return 'EOF'
  }

  preDefineFunc (tokens) {
    // 関数を先読みして定義 TODO
    let i = 0
    while (i < tokens.length) {
      if (tokens[i].type !== 'DEF_FUNC') {
        i++
        continue
      }
      i++ // skip "●"
      if (tokens[i] && tokens[i].type === 'PA_B') {
        while (tokens[i]) {
          if (tokens[i] === 'PA_E') {
            i++
            break
          }
          i++
        }
      }
      if (tokens[i] && tokens[i].type === 'WORD') {
        const key = tokens[i].value
        this.funclist[key] = []
      }
    }
  }

  replaceWord (tokens) {
    let i = 0
    while (i < tokens.length) {
      const t = tokens[i]
      // 関数の認識と、もし文の単文と複文の判別処理
      if (t.type === 'WORD') {
        const f = this.funclist[t.value]
        if (f) {
          t.type = 'FUNC'
          t.meta = f
          continue
        }
      }
      // 助詞の「は」を = に展開
      if (t.josi === undefined) t.josi = ''
      if (t.josi === 'は') {
        t.josi = ''
        tokens.splice(i + 1, 0, {type: 'EQ', line: t.line})
        continue
      }
      i++
    }
  }

  checkSyntaxMark (tokens) {
    // FOR文のMARKをチェック
    let i = 0
    let eolMarker = 0
    while (i < tokens.length) {
      const t = tokens[i]
      if (t.type === 'EOL') eolMarker = i
      if (t.type === 'FOR') {
        tokens.splice(eolMarker, 0, {type: 'FOR_MARKER', line: t.line})
        i += 2
        continue
      }
      i++
    }
  }

  tokenize (src) {
    let line = 0
    while (src !== '') {
      let ok = false
      for (const rule of rules) {
        const m = rule.pattern.exec(src)
        if (!m) continue
        ok = true
        if (rule.name === 'SPACE') {
          src = src.substr(m[0].length)
          continue
        }
        // 特別なパーサを通すか？
        if (rule.cbParser) {
          const rp = rule.cbParser(src)
          const word = rp.res
          src = rp.src
          const rr = { type: rule.name, value: word, josi: rp.josi, line: line }
          this.result.push(rr)
          line += rp.numEOL
          break
        }
        // 値を変換する必要があるか？
        let value = m[0]
        if (rule.cb) value = rule.cb(value)
        // ソースを進める
        src = src.substr(m[0].length)
        if (rule.name === 'EOL') {
          value = line++
        }
        let josi = ''
        if (rule.name === 'NUMBER') {
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
      if (!ok) throw new Error(`字句解析で未知の語句(${line}):` + src.substr(0, 3) + '...')
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
  const kanakanji = /^[\u4E00-\u9FCF_a-zA-Z0-9ァ-ヶ]+/
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
  return { src: src, res: res, josi: josi, numEOL: 0 }
}

function cbString (beginTag, closeTag, src) {
  let res = ''
  let josi = ''
  let numEOL = 0
  src = src.substr(beginTag.length) // skip beginTag
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

  return { src: src, res: res, josi: josi, numEOL: numEOL }
}

module.exports = NakoLexer
