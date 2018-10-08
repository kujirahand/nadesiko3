// 構文解析を行う前に全角文字を半角に揃える
// ただし、文字列部分だけは、そのまま全角で出力するようにする
// for https://github.com/kujirahand/nadesiko3/issues/94

class NakoPrepare {
  constructor () {
    // 参考) https://hydrocul.github.io/wiki/blog/2014/1101-hyphen-minus-wave-tilde.html
    this.HYPHENS = { // ハイフン問題
      0x2d: true, // ASCIIのハイフン
      0x2010: true, // 別のハイフン
      0x2011: true, // 改行しないハイフン
      0x2013: true, // ENダッシュ
      0x2014: true, // EMダッシュ
      0x2015: true, // 全角のダッシュ
      0x2212: true // 全角のマイナス
    }
    this.TILDES = { // チルダ問題
      0x7e: true,
      0x02dc: true, // 小さなチルダ
      0x02F7: true, // Modifier Letter Low Tilde
      0x2053: true, // Swung Dash - 辞書のみだし
      0x223c: true, // Tilde Operator: 数学で Similar to
      0x301c: true, // Wave Dash(一般的な波ダッシュ)
      0xFF5E: true // 全角チルダ
    }
    // スペース問題
    // 参考) http://anti.rosx.net/etc/memo/002_space.html
    this.SPACES = {
      0x20: true,
      0x2000: true, // EN QUAD
      0x2002: true, // EN SPACE
      0x2003: true, // EM SPACE
      0x2004: true, // THREE-PER-EM SPACE
      0x2005: true, // FOUR-PER-EM SPACE
      0x2006: true, // SIX-PER-EM SPACE
      0x2007: true, // FIGURE SPACE
      0x2009: true, // THIN SPACE
      0x200A: true, // HAIR SPACE
      0x200B: true, // ZERO WIDTH SPACE
      0x202F: true, // NARROW NO-BREAK SPACE
      0x205F: true, // MEDIUM MATHEMATICAL SPACE
      0x3000: true, // 全角スペース
      0x3164: true // HANGUL FILLER
    }
    // その他の変換
    this.convertTable = {
      0x09: ' ', // TAB --> SPC
      0x203B: '#', // '※' --- コメント
      // 0x3001: ',', // 句点 --- JSON記法で「,」と「、」を区別したいので句点は変換しないことに。
      0x3002: ';', // 読点
      0x3010: '[', // '【'
      0x3011: ']' // '】'
    }
  }

  // 一文字だけ変換
  convert1ch (ch) {
    const c = ch.codePointAt(0)
    // テーブルによる変換
    if (this.convertTable[c]) {
      return this.convertTable[c]
    }
    // ASCIIエリア
    if (c < 0x7F) {
      return ch
    }
    // 全角半角単純変換可能 --- '！' - '～'
    if (c >= 0xFF01 && c <= 0xFF5E) {
      const c2 = c - 0xFEE0
      return String.fromCodePoint(c2)
    }
    // 問題のエリア
    if (this.HYPHENS[c]) {
      return '-'
    }
    if (this.TILDES[c]) {
      return '~'
    }
    if (this.SPACES[c]) {
      return ' '
    }
    return ch
  }

  convert (src) {
    if (!src) {
      return ''
    }
    let flagStr = false
    let flagStr2 = false
    let endOfStr
    let res = ''
    // 改行コードを統一
    src = src.replace(/(\r\n|\r)/g, '\n')
    let i = 0
    while (i < src.length) {
      const c = src.charAt(i)
      // 一般的な文字列のとき
      if (flagStr) {
        res += c
        i++
        if (c === endOfStr) {
          flagStr = false
        }
        continue
      }
      // 多重波括弧の文字列
      if (flagStr2) {
        if (src.substr(i, endOfStr.length) === endOfStr) {
          flagStr2 = false
          res += endOfStr
          i += endOfStr.length
          continue
        }
        res += c
        i++
        continue
      }
      // 文字列判定
      if (c === '「') {
        res += c
        i++
        flagStr = true
        endOfStr = '」'
        continue
      }
      if (c === '『') {
        res += c
        i++
        flagStr = true
        endOfStr = '』'
        continue
      }
      if (c === '“') {
        res += c
        i++
        flagStr = true
        endOfStr = '”'
        continue
      }
      const c1 = this.convert1ch(c)
      if (c1 === '"' || c1 === '\'') {
        res += c1
        i++
        flagStr = true
        endOfStr = c
        continue
      }
      if (c1 === 'S' || c1 === 'R') {
        res += c1
        i++
        if (src.substr(i, 5) === '{{{{{') {
          flagStr2 = true
          endOfStr = '}}}}}'
          continue
        }
        if (src.substr(i, 4) === '{{{{') {
          flagStr2 = true
          endOfStr = '}}}}'
          continue
        }
        if (src.substr(i, 3) === '{{{') {
          flagStr2 = true
          endOfStr = '}}}'
          continue
        }
        continue
      }
      // 変換したものを追加
      res += c1
      i++
    }
    return res
  }
}

module.exports = NakoPrepare
