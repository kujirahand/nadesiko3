/**
 * なでしこ3字句解析のためのルール
 */

const kanakanji = /^[\u3005\u4E00-\u9FCF_a-zA-Z0-9ァ-ヶー]+/
const josi = require('./nako_josi_list')
const josiRE = josi.josiRE
const hira = /^[ぁ-ん]/

module.exports = {
  rules: [
    // 上から順にマッチさせていく
    {name: 'eol', pattern: /^\n/},
    {name: 'eol', pattern: /^;/},
    {name: 'space', pattern: /^(\s+|、)/},
    {name: 'comma', pattern: /^,/},
    {name: 'line_comment', pattern: /^#[^\n]*/},
    {name: 'line_comment', pattern: /^\/\/[^\n]*/},
    {name: 'range_comment', pattern: /^\/\*/, cbParser: cbRangeComment},
    {name: 'def_test', pattern: /^●テスト:/},
    {name: 'def_func', pattern: /^●/},
    {name: 'number', pattern: /^非数/, readJosi: true, cb: () => { return NaN } },
    {name: 'number', pattern: /^無限大/, readJosi: true, cb: () => { return Infinity } },
    {name: 'number', pattern: /^0[xX][0-9a-fA-F]+(_[0-9a-fA-F]+)*/, readJosi: true, cb: parseNumber},
    {name: 'number', pattern: /^0[oO][0-7]+(_[0-7]+)*/, readJosi: true, cb: parseNumber},
    {name: 'number', pattern: /^0[bB][0-1]+(_[0-1]+)*/, readJosi: true, cb: parseNumber},
    //下の三つは小数点が挟まっている場合、小数点から始まっている場合、小数点がない場合の十進法の数値にマッチします
    {name: 'number', pattern: /^\d+(_\d+)*\.(\d+(_\d+)*)?([eE][+|-]?\d+(_\d+)*)?/, readJosi: true, cb: parseNumber},
    {name: 'number', pattern: /^\.\d+(_\d+)*([eE][+|-]?\d+(_\d+)*)?/, readJosi: true, cb: parseNumber},
    {name: 'number', pattern: /^\d+(_\d+)*([eE][+|-]?\d+(_\d+)*)?/, readJosi: true, cb: parseNumber},
    {name: 'ここから', pattern: /^(ここから)/},
    {name: 'ここまで', pattern: /^(ここまで)/},
    {name: 'もし', pattern: /^もしも?/},
    // ならば ← 助詞として定義
    {name: '違えば', pattern: /^違(えば)?/},
    // 「回」「間」「繰返」「反復」「抜」「続」「戻」「代入」などは replaceWord で word から変換
    {name: 'shift_r0', pattern: /^>>>/},
    {name: 'shift_r', pattern: /^>>/},
    {name: 'shift_l', pattern: /^<</},
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
    {name: 'func', pattern: /^\{関数\}/},
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
  ],
  trimOkurigana
}

function parseInt2(s) {
    const ss = s.substring(2)
    return parseInt(ss, 2)
}
function parseInt8(s) {
    const ss = s.substring(2)
    return parseInt(ss, 8)
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
  // 改行を数える
  for (let i = 0; i < res.length; i++)
    {if (res.charAt(i) === '\n') {numEOL++}}

  res = res.replace(/(^\s+|\s+$)/, '') // trim
  return {src: src, res: res, josi: josi, numEOL: numEOL}
}

function cbWordParser(src, isTrimOkurigana = true) {
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
  if (isTrimOkurigana) {
    res = trimOkurigana(res)
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
    for (let i = 0; i < cnt; i++) {closeTag += '}'}
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
  for (let i = 0; i < res.length; i++)
    {if (res.charAt(i) === '\n') {numEOL++}}

  return {src: src, res: res, josi: josi, numEOL: numEOL}
}

function trimOkurigana (s) {
  if (!hira.test(s))
    {s = s.replace(/[ぁ-ん]+/g, '')}

  return s
}

function parseNumber (n) {
  return Number(n.replace(/_/g,''))
}
