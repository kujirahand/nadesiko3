 
/**
 * なでしこ3字句解析のためのルール
 */

import { josiRE, removeJosiMap } from './nako_josi_list.mjs'
import { TokenType } from './nako_token.mjs'

const kanakanji = /^[\u3005\u4E00-\u9FCF_a-zA-Z0-9ァ-ヶー\u2460-\u24FF\u2776-\u277F\u3251-\u32BF]+/
const hira = /^[ぁ-ん]/
const allHiragana = /^[ぁ-ん]+$/
const wordHasIjoIka = /^.+(以上|以下|超|未満)$/
const wordSpecial = /^(かつ|または)/
const errorRead = (ch: string): any => {
  return function() { throw new Error('突然の『' + ch + '』があります。') }
}

// 数値の後の単位は自動的に省略されるルール (#994)
export const unitRE = /^(円|ドル|元|歩|㎡|坪|度|℃|°|個|つ|本|冊|才|歳|匹|枚|皿|セット|羽|人|件|行|列|機|品|m|mm|cm|km|g|kg|t|b|mb|kb|gb)/
// CSSの単位であれば自動的に文字列に変換するルール (#1811)
export const cssUnitRE = /^(px|em|ex|rem|vw|vh|vmin|vmax)/

export interface NakoLexParseResult {
  src: string;
  res: string;
  josi: string;
  numEOL: number;
}

export interface NakoLexRule {
  name: TokenType;
  pattern: RegExp;
  readJosi?: boolean;
  cb?: (v: string) => any;
  cbParser?: (v: string, b?: boolean) => NakoLexParseResult;
}

/** トークンに区切るルールの一覧 */
export const rules: NakoLexRule[] = [
  // 上から順にマッチさせていく
  { name: 'ここまで', pattern: /^;;;/ }, // #925
  { name: 'eol', pattern: /^\n/ },
  { name: 'eol', pattern: /^;/ },
  // eslint-disable-next-line no-irregular-whitespace
  { name: 'space', pattern: /^(\x20|\x09|　|・|⎿ |└|｜)+/ }, // #877,#1015
  { name: 'comma', pattern: /^,/ },
  { name: 'line_comment', pattern: /^#[^\n]*/ },
  { name: 'line_comment', pattern: /^\/\/[^\n]*/ },
  { name: 'range_comment', pattern: /^\/\*/, cbParser: cbRangeComment },
  { name: 'def_test', pattern: /^●テスト:/ },
  { name: 'def_func', pattern: /^●/ },
  { name: '…', pattern: /^…/ }, // 範囲オブジェクト(#1704)
  { name: '…', pattern: /^\.{2,3}/ }, // 範囲オブジェクト(#1704)
  // 多倍長整数リテラルの判定。整数の末尾に「n」がついているだけな為、数値判定より上に書かないとただの整数にされる
  { name: 'bigint', pattern: /^0[xX][0-9a-fA-F]+(_[0-9a-fA-F]+)*n/, readJosi: true },
  { name: 'bigint', pattern: /^0[oO][0-7]+(_[0-7]+)*n/, readJosi: true },
  { name: 'bigint', pattern: /^0[bB][0-1]+(_[0-1]+)*n/, readJosi: true },
  { name: 'bigint', pattern: /^\d+(_\d+)*?n/, readJosi: true },
  // 16進/8進/2進法の数値判定 --- この後nako_lexerにて単位を読む処理が入る(#994)
  { name: 'number', pattern: /^0[xX][0-9a-fA-F]+(_[0-9a-fA-F]+)*/, readJosi: true, cb: parseNumber },
  { name: 'number', pattern: /^0[oO][0-7]+(_[0-7]+)*/, readJosi: true, cb: parseNumber },
  { name: 'number', pattern: /^0[bB][0-1]+(_[0-1]+)*/, readJosi: true, cb: parseNumber },
  // 下の三つは小数点が挟まっている場合、小数点から始まっている場合、小数点がない場合の十進法の数値にマッチする
  { name: 'number', pattern: /^\d+(_\d+)*\.(\d+(_\d+)*)?([eE][+|-]?\d+(_\d+)*)?/, readJosi: true, cb: parseNumber },
  { name: 'number', pattern: /^\.\d+(_\d+)*([eE][+|-]?\d+(_\d+)*)?/, readJosi: true, cb: parseNumber },
  { name: 'number', pattern: /^\d+(_\d+)*([eE][+|-]?\d+(_\d+)*)?/, readJosi: true, cb: parseNumber },
  { name: 'ここから', pattern: /^(ここから),?/ },
  { name: 'ここまで', pattern: /^(ここまで|💧)/ },
  { name: 'もし', pattern: /^もしも?/ },
  // 「ならば」は助詞として定義している
  { name: '違えば', pattern: /^違(えば)?/ },
  // 「回」「間」「繰返」「反復」「抜」「続」「戻」「代入」「条件分岐」などは NakoLexer._replaceWord で word から変換
  // @see nako_reserved_words.js
  { name: 'shift_r0', pattern: /^>>>/ },
  { name: 'shift_r', pattern: /^>>/ },
  { name: 'shift_l', pattern: /^<</ },
  { name: '===', pattern: /^===/ }, // #999
  { name: '!==', pattern: /^!==/ }, // #999
  { name: 'gteq', pattern: /^(≧|>=|=>)/ },
  { name: 'lteq', pattern: /^(≦|<=|=<)/ },
  { name: 'noteq', pattern: /^(≠|<>|!=)/ },
  { name: '←', pattern: /^(←|<--)/ }, // 矢印 --- ただし(core#140)で廃止された演算子(#891,#899)
  { name: 'eq', pattern: /^(==|🟰🟰)/ },
  { name: 'eq', pattern: /^(=|🟰)/ },
  { name: 'line_comment', pattern: /^(!|💡)(インデント構文|ここまでだるい|DNCLモード|DNCL2モード|DNCL2)[^\n]*/ }, // #1184
  { name: 'not', pattern: /^(!|💡)/ }, // #1184 #1457
  { name: 'gt', pattern: /^>/ },
  { name: 'lt', pattern: /^</ },
  { name: 'and', pattern: /^(かつ|&&|and\s)/ },
  { name: 'or', pattern: /^(または|或いは|あるいは|or\s|\|\|)/ },
  { name: '@', pattern: /^@/ },
  { name: '+', pattern: /^\+/ },
  { name: '-', pattern: /^-/ },
  { name: '**', pattern: /^(××|\*\*)/ }, // Python風べき乗演算子
  { name: '*', pattern: /^(×|\*)/ },
  { name: '÷÷', pattern: /^÷÷/ }, // 整数の割り算
  { name: '÷', pattern: /^(÷|\/)/ }, // 普通の割り算
  { name: '%', pattern: /^%/ },
  { name: '^', pattern: /^\^/ },
  { name: '&', pattern: /^&/ },
  { name: '[', pattern: /^\[/ },
  { name: ']', pattern: /^]/, readJosi: true },
  { name: '(', pattern: /^\(/ },
  { name: ')', pattern: /^\)/, readJosi: true },
  { name: '|', pattern: /^\|/ },
  { name: '??', pattern: /^\?\?/ }, // 「表示」のエイリアス #1745
  { name: 'word', pattern: /^\$\{.+?\}/, cbParser: src => cbExtWord(src) }, // 特別名前トークン(#1836)(#672)
  { name: '$', pattern: /^(\$|\.)/ }, // プロパティアクセス (#1793)(#1807)
  { name: 'string', pattern: /^🌿/, cbParser: src => cbString('🌿', '🌿', src) },
  { name: 'string_ex', pattern: /^🌴/, cbParser: src => cbString('🌴', '🌴', src) },
  { name: 'string_ex', pattern: /^「/, cbParser: src => cbString('「', '」', src) },
  { name: 'string', pattern: /^『/, cbParser: src => cbString('『', '』', src) },
  { name: 'string_ex', pattern: /^“/, cbParser: src => cbString('“', '”', src) },
  { name: 'string_ex', pattern: /^"/, cbParser: src => cbString('"', '"', src) },
  { name: 'string', pattern: /^'/, cbParser: src => cbString('\'', '\'', src) },
  { name: '」', pattern: /^」/, cbParser: errorRead('」') }, // error
  { name: '』', pattern: /^』/, cbParser: errorRead('』') }, // error
  { name: 'func', pattern: /^\{関数\},?/ },
  { name: '{', pattern: /^\{/ },
  { name: '}', pattern: /^\}/, readJosi: true },
  { name: ':', pattern: /^:/ },
  { name: '_eol', pattern: /^_\s*\n/ },
  { name: 'dec_lineno', pattern: /^‰/ },
  // 絵文字変数 = (絵文字)英数字*
  { name: 'word', pattern: /^[\uD800-\uDBFF][\uDC00-\uDFFF][_a-zA-Z0-9]*/, readJosi: true },
  { name: 'word', pattern: /^[\u1F60-\u1F6F][_a-zA-Z0-9]*/, readJosi: true }, // 絵文字
  { name: 'word', pattern: /^《.+?》/, readJosi: true }, // 《特別名前トークン》(#672)
  // 単語句
  {
    name: 'word',
    pattern: /^[_a-zA-Z\u3005\u4E00-\u9FCFぁ-んァ-ヶ\u2460-\u24FF\u2776-\u277F\u3251-\u32BF]/,
    cbParser: cbWordParser
  }
]

export function trimOkurigana(s: string): string {
  // ひらがなから始まらない場合、送り仮名を削除。(例)置換する
  if (!hira.test(s)) {
    return s.replace(/[ぁ-ん]+/g, '')
  }
  // 全てひらがな？ (例) どうぞ
  if (allHiragana.test(s)) { return s }
  // 末尾のひらがなのみ (例)お願いします →お願
  return s.replace(/[ぁ-ん]+$/g, '')
}

// Utility for Rule
function cbRangeComment(src: string): NakoLexParseResult {
  let res = ''
  const josi = ''
  let numEOL = 0
  src = src.substring(2) // skip /*
  const i = src.indexOf('*/')
  if (i < 0) { // not found
    res = src
    src = ''
  } else {
    res = src.substring(0, i)
    src = src.substring(i + 2)
  }
  // 改行を数える
  for (let i = 0; i < res.length; i++) { if (res.charAt(i) === '\n') { numEOL++ } }

  res = res.replace(/(^\s+|\s+$)/, '') // trim
  return { src, res, josi, numEOL }
}

/**
 * @param {string} src
 */
function cbWordParser(src: string, isTrimOkurigana = true): NakoLexParseResult {
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
    // 1文字以上のとき
    if (res.length > 0) {
      // 「かつ」「または」なら分割する (#1379 core#84)
      const jsw = wordSpecial.exec(src)
      if (jsw) { break }
      // 助詞の判定
      const j = josiRE.exec(src)
      if (j) {
        josi = j[0].replace(/^\s+/, '')
        src = src.substring(j[0].length)
        // 助詞の直後にある「,」を飛ばす #877
        if (src.charAt(0) === ',') { src = src.substring(1) }
        break
      }
    }
    // カタカナ漢字英数字か？
    const m = kanakanji.exec(src)
    if (m) {
      res += m[0]
      src = src.substring(m[0].length)
      continue
    }
    // ひらがな？
    const h = hira.test(src)
    if (h) {
      res += src.charAt(0)
      src = src.substring(1)
      continue
    }
    break // other chars
  }
  // --- 単語分割における特殊ルール ---
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
    res = res.substring(0, res.length - ii[1].length)
  }
  // 「もの」構文 #1614
  if (josi.substring(0, 2) === 'もの') {
    josi = josi.substring(2)
  }
  // 助詞「こと」「である」「です」などは「＊＊すること」のように使うので削除 #936 #939 #974
  if (removeJosiMap[josi]) { josi = '' }

  // 送り仮名の省略ルール
  // 漢字カタカナ英語から始まる語句 --- 送り仮名を省略
  if (isTrimOkurigana) {
    res = trimOkurigana(res)
  }
  // 助詞だけの語句の場合
  if (res === '' && josi !== '') {
    res = josi
    josi = ''
  }
  return { src, res, josi, numEOL: 0 }
}

function cbString(beginTag: string, closeTag: string, src: string): NakoLexParseResult {
  let res = ''
  let josi = ''
  let numEOL = 0
  src = src.substring(beginTag.length) // skip beginTag
  const i = src.indexOf(closeTag)
  if (i < 0) { // not found
    res = src
    src = ''
    throw new Error(`『${beginTag}』で始めた文字列の終端記号『${closeTag}』が見つかりません。`)
  } else {
    res = src.substring(0, i)
    src = src.substring(i + closeTag.length)
    // res の中に beginTag があればエラーにする #953
    if (res.indexOf(beginTag) >= 0) {
      if (beginTag === '『') {
        throw new Error('「『」で始めた文字列の中に「『」を含めることはできません。')
      } else {
        throw new Error(`『${beginTag}』で始めた文字列の中に『${beginTag}』を含めることはできません。`)
      }
    }
  }
  // 文字列直後の助詞を取得
  const j = josiRE.exec(src)
  if (j) {
    josi = j[0].replace(/^\s+/, '')
    src = src.substring(j[0].length)
    // 助詞の後のカンマ #877
    if (src.charAt(0) === ',') { src = src.substring(1) }
  }
  // 助詞「こと」「である」「です」などは「＊＊すること」のように使うので削除 #936 #939 #974
  if (removeJosiMap[josi]) { josi = '' }
  // 「もの」構文 (#1614)
  if (josi.substring(0, 2) === 'もの') {
    josi = josi.substring(2)
  }

  // 改行を数える
  for (let i = 0; i < res.length; i++) { if (res.charAt(i) === '\n') { numEOL++ } }

  return { src, res, josi, numEOL }
}

function cbExtWord(src: string): NakoLexParseResult {
  let res = ''
  let josi = ''
  let numEOL = 0

  src = src.substring(2) // skip '${'
  const i = src.indexOf('}')
  if (i < 0) { // not found
    throw new Error('変数名の終わりが見つかりません。')
  }
  res = src.substring(0, i)
  src = src.substring(i + 1)

  // 文字列直後の助詞を取得
  const j = josiRE.exec(src)
  if (j) {
    josi = j[0].replace(/^\s+/, '')
    src = src.substring(j[0].length)
    // 助詞の後のカンマ #877
    if (src.charAt(0) === ',') { src = src.substring(1) }
  }

  // 改行を数える(あり得ないけど)
  for (let i = 0; i < res.length; i++) { if (res.charAt(i) === '\n') { numEOL++ } }
  if (numEOL > 0) { throw new Error('変数名に改行を含めることはできません。') }

  return { src, res, josi, numEOL }
}

function parseNumber(n: string): number {
  return Number(n.replace(/_/g, ''))
}
