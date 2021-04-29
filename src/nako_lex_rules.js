/**
 * なでしこ3字句解析のためのルール
 */

const kanakanji = /^[\u3005\u4E00-\u9FCF_a-zA-Z0-9ァ-ヶー]+/
const josi = require('./nako_josi_list')
const josiRE = josi.josiRE
const hira = /^[ぁ-ん]/
const allHiragana = /^[ぁ-ん]+$/
const wordHasIjoIka = /^.+(以上|以下|超|未満)$/

const errorRead = (ch) =>{ 
  return (function() { throw new Error('突然の『' + ch + '』があります。')})
}

module.exports = {
  rules: [
    // 上から順にマッチさせていく
    {name: 'ここまで', pattern: /^;;;/}, // #925
    {name: 'eol', pattern: /^\n/},
    {name: 'eol', pattern: /^;/},
    {name: 'space', pattern: /^(\s+|・)/}, // #877
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
    {name: 'ここから', pattern: /^(ここから),?/},
    {name: 'ここまで', pattern: /^(ここまで|💧)/},
    {name: 'もし', pattern: /^もしも?/},
    // 「ならば」は助詞として定義している
    {name: '違えば', pattern: /^違(えば)?/},
    // 「回」「間」「繰返」「反復」「抜」「続」「戻」「代入」「条件分岐」などは replaceWord で word から変換
    // @see nako_reserved_words.js
    {name: 'shift_r0', pattern: /^>>>/},
    {name: 'shift_r', pattern: /^>>/},
    {name: 'shift_l', pattern: /^<</},
    {name: 'gteq', pattern: /^(≧|>=|=>)/},
    {name: 'lteq', pattern: /^(≦|<=|=<)/},
    {name: 'noteq', pattern: /^(≠|<>|!=)/},
    {name: '←', pattern: /^(←|<--)/}, // 関数呼び出し演算子 #891 #899
    {name: 'eq', pattern: /^=/},
    {name: 'line_comment', pattern: /^!(インデント構文|ここまでだるい)[^\n]*/},
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
    {name: 'string', pattern: /^🌿/, cbParser: src => cbString('🌿', '🌿', src)},
    {name: 'string_ex', pattern: /^🌴/, cbParser: src => cbString('🌴', '🌴', src)},
    {name: 'string_ex', pattern: /^「/, cbParser: src => cbString('「', '」', src)},
    {name: 'string', pattern: /^『/, cbParser: src => cbString('『', '』', src)},
    {name: 'string_ex', pattern: /^“/, cbParser: src => cbString('“', '”', src)},
    {name: 'string_ex', pattern: /^"/, cbParser: src => cbString('"', '"', src)},
    {name: 'string', pattern: /^'/, cbParser: src => cbString('\'', '\'', src)},
    {name: '」', pattern: /^」/, cbParser: errorRead('」')}, // error
    {name: '』', pattern: /^』/, cbParser: errorRead('』')}, // error
    {name: 'func', pattern: /^\{関数\},?/},
    {name: '{', pattern: /^\{/},
    {name: '}', pattern: /^\}/, readJosi: true},
    {name: ':', pattern: /^:/},
    {name: '_eol', pattern: /^_\s*\n/},
    {name: 'dec_lineno', pattern: /^‰/},
    // 絵文字変数 = (絵文字)英数字*
    {name: 'word', pattern: /^[\uD800-\uDBFF][\uDC00-\uDFFF][_a-zA-Z0-9]*/, readJosi: true},
    {name: 'word', pattern: /^[\u1F60-\u1F6F][_a-zA-Z0-9]*/, readJosi: true}, // 絵文字
    {name: 'word', pattern: /^《.+?》/, readJosi: true}, // 《特別名前トークン》(#672)
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

/**
 * @param {string} src
 */
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
    if (res.length > 0) {
      // 助詞の判定
      const j = josiRE.exec(src)
      if (j) {
        josi = j[0]
        src = src.substr(j[0].length)
        // 助詞の直後にある「,」を飛ばす #877
        if (src.charAt(0) == ',') {src = src.substr(1)}
        break
      }
    }
    // カタカナ漢字英数字か？
    const m = kanakanji.exec(src)
    if (m) {
      res += m[0]
      src = src.substr(m[0].length)
      continue
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
  // 「間」の特殊ルール (#831)
  // 「等しい間」や「一致する間」なら「間」をsrcに戻す。ただし「システム時間」はそのままにする。 
  if (/[ぁ-ん]間$/.test(res)) {
    src = res.charAt(res.length - 1) + src
    res = res.slice(0, -1)
  }
  // 「以上」「以下」「超」「未満」 #918
  const ii = wordHasIjoIka.exec(res)
  if (ii) {
    src = ii[1] + josi + src
    josi = ''
    res = res.substr(0, res.length - ii[1].length)
  }
  // 助詞「こと」は「＊＊すること」のように使うので削除 #936
  if (josi === 'こと') {josi = ''}
  // 「＊＊である」も削除 #939
  if (josi === 'である') {josi = ''}

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
  const i = src.indexOf(closeTag)
  if (i < 0) { // not found
    res = src
    src = ''
  } else {
    res = src.substr(0, i)
    src = src.substr(i + closeTag.length)
    // res の中に beginTag があればエラーにする #953
    if (res.indexOf(beginTag) >= 0) {
      if (beginTag == '『') {
        throw new Error('「『」で始めた文字列の中に「『」を含めることはできません。')
      } else {
        throw new Error(`『${beginTag}』で始めた文字列の中に『${beginTag}』を含めることはできません。`)
      }
    }
  }
  // 文字列直後の助詞を取得
  const j = josiRE.exec(src)
  if (j) {
    josi = j[0]
    src = src.substr(j[0].length)
    // 助詞の後のカンマ #877
    if (src.charAt(0) == ',') {src = src.substr(1)}
  }
  // 「＊＊である」なら削除 #939
  if (josi === 'である') {josi = ''}

  // 改行を数える
  for (let i = 0; i < res.length; i++)
    {if (res.charAt(i) === '\n') {numEOL++}}

  return {src: src, res: res, josi: josi, numEOL: numEOL}
}

function trimOkurigana (s) {
  // ひらがなから始まらない場合、送り仮名を削除。(例)置換する
  if (!hira.test(s)) {
    return s.replace(/[ぁ-ん]+/g, '')
  }
  // 全てひらがな？ (例) どうぞ
  if (allHiragana.test(s)) {return s}
  // 末尾のひらがなのみ (例)お願いします →お願
  return s.replace(/[ぁ-ん]+$/g, '')
}

function parseNumber (n) {
  return Number(n.replace(/_/g,''))
}
