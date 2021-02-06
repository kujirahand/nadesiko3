const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('lex_test', () => {
  const nako = new NakoCompiler()
  nako.debug = false
  const cmp = (code, res) => {
    if (nako.debug)
      console.log('code=' + code)

    assert.strictEqual(nako.runReset(code).log, res)
  }
  // --- test ---
  it('送り仮名の省略テスト', () => {
    cmp('『abc』の『a』を「*」に置換。表示', '*bc')
    cmp('『abc』の『a』を「*」に置換します。それを表示', '*bc')
    cmp('『abc』の『a』を「*」に置換しろ。表示しろ。', '*bc')
  })
  it('仮名表記の曖昧', () => {
    cmp('『abc』の『a』を「*」に置き換え。表示', '*bc')
  })
  it('範囲コメントの処理', () => {
    cmp('1を表示\n/*2を表示\n3を表示\n*/\n4を表示\n', '1\n4')
    cmp('1を表示\n/*2を表示\n3を表示\n4を表示\n5を表示\n*/\n6を表示\n', '1\n6')
  })
  it('文字列の埋め込み', () => {
    cmp('見出し=30;「--{見出し}--」を表示', '--30--')
  })
  it('文字列の埋め込み語句のかな省略', () => {
    cmp('見出し=30;「--{見出}--」を表示', '--30--')
  })
  it('文字列に式を埋め込む', () => {
    cmp('「--{3に2を掛ける}--」を表示', "--6--")
  })
  it('文字列の埋め込み変数名全角英数字', () => {
    cmp('N1=30;「--{Ｎ１}--」を表示', '--30--')
  })
  it('文字列の埋め込みで対応しない閉じ括弧がある場合', () => {
    cmp('B=1;E=2;「A{B}C}D{E}F」を表示', 'A1C}D2F')
  })
  it('文字列の埋め込み配列', () => {
    cmp('手説明＝["グー","チョキ","パー"];「自分は{手説明@1}、相手は{手説明@0}」と表示', '自分はチョキ、相手はグー')
  })
  it('はい/いいえ', () => {
    cmp('はいを表示', '1')
    cmp('いいえを表示', '0')
  })
  it('A = 8の書き方', () => {
    cmp('A = 8;Aを表示', '8')
  })
  it('数値表現のテスト', () => {
    cmp('123e1を表示', '1230')
    cmp('123E-1を表示', '12.3')
    cmp('123e+1を表示', '1230')
    cmp('.123e-1を表示', '0.0123')
    cmp('123.e1を表示', '1230')
  })
  it('2進数/8進数/16進数のテスト', () => {
    cmp('0xFFを表示', '255')
    cmp('0XFFを表示', '255')
    cmp('0b11を表示', '3')
    cmp('0B1111を表示', '15')
    cmp('0o10を表示', '8')
    cmp('0O11を表示', '9')
  })
  it('《特別名トークン》のテスト', () => {
    cmp('《今日から明日》＝30；《今日から明日》を表示', '30')
    cmp('《AからBまで》＝30；《AからBまで》を表示', '30')
  })
  it('ソースマップ - 単純な例', () => {
    const tokens = nako.lex('「こんにちは」と表示').tokens

    // 0-7文字目: 「こんにちは」と
    assert.strictEqual(tokens[0].startOffset, 0)
    assert.strictEqual(tokens[0].endOffset, 8)

    // 8-9文字目: 表示
    assert.strictEqual(tokens[1].startOffset, 8)
    assert.strictEqual(tokens[1].endOffset, 10)
  })
  it('ソースマップ - スペース扱いの文字', () => {
    // '、'はスペース扱いであり、トークン化されない。
    const tokens = nako.lex('ならば、A').tokens

    // 0-2文字目: ならば
    assert.strictEqual(tokens[0].startOffset, 0)
    assert.strictEqual(tokens[0].endOffset, 3)

    // 4文字目: A
    assert.strictEqual(tokens[1].startOffset, 4)
    assert.strictEqual(tokens[1].endOffset, 5)
  })
  it('ソースマップ - 複数行の場合', () => {
    const tokens = nako.lex('「こんにちは」を表示する。\n「こんにちは」を表示する。').tokens
    assert.strictEqual(tokens[0].startOffset, 0)  // 0-7: 「こんにちは」を
    assert.strictEqual(tokens[1].startOffset, 8)  // 8-11: 表示する
    assert.strictEqual(tokens[2].startOffset, 12) // 12: 。
    assert.strictEqual(tokens[3].startOffset, 13) // 13: eol
    assert.strictEqual(tokens[4].startOffset, 14)  // 14-21: 「こんにちは」を
    assert.strictEqual(tokens[5].startOffset, 22)  // 22-25: 表示する
    assert.strictEqual(tokens[6].startOffset, 26)  // 26: 。
  })
  it('ソースマップ - 行コメント', () => {
    const tokens = nako.lex(`# コメント`).commentTokens
    assert.strictEqual(tokens[0].startOffset, 0)
    assert.strictEqual(tokens[0].endOffset, 6)
  })
  it('ソースマップ - 範囲コメント', () => {
    const tokens = nako.lex(`/*\nここは全部コメント\nここは全部コメント\n*/`).commentTokens
    assert.strictEqual(tokens[0].startOffset, 0)
    assert.strictEqual(tokens[0].endOffset, 25)
  })
  it('ソースマップ - 範囲コメントの直後に文字がある場合', () => {
    const result = nako.lex(`/*\nここは全部コメント\nここは全部コメント\n*/a`)

    // コメント
    assert.strictEqual(result.commentTokens[0].startOffset, 0)
    assert.strictEqual(result.commentTokens[0].endOffset, 25)

    // a
    assert.strictEqual(result.tokens[0].startOffset, 25)
    assert.strictEqual(result.tokens[0].endOffset, 26)
  })
  it('ソースマップ - "_"による改行', () => {
    const tokens = nako.lex(`[_\n]\nりんごの値段は30`).tokens
    const nedan = tokens.find((t) => t.value === '値段')
    assert.strictEqual(nedan.startOffset, 9)
    assert.strictEqual(nedan.endOffset, 12)
  })
  it('ソースマップ - インデント構文', () => {
    const tokens = nako.lex(`！インデント構文\n1回\n    「2」を表示\n\n「3」を表示`).tokens
    assert.strictEqual(tokens.find((t) => t.value === '2').startOffset, 16) // 「1」を
    assert.strictEqual(tokens.find((t) => t.value === '3').startOffset, 24) // 「2」を
  })
  it('ソースマップ - string_ex', () => {
    const tokens = nako.lex(`"{あ}"`).tokens
    assert.strictEqual(tokens.find((t) => t.value === 'あ').startOffset, 2)
    assert.strictEqual(tokens.find((t) => t.value === 'あ').endOffset, 3)
  })
})
