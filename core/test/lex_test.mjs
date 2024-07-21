/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('lex_test', async () => {
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  // --- test ---
  it('送り仮名の省略テスト', async () => {
    await cmp('『abc』の『a』を「*」に置換。表示', '*bc')
    await cmp('『abc』の『a』を「*」に置換します。それを表示', '*bc')
    await cmp('『abc』の『a』を「*」に置換しろ。表示しろ。', '*bc')
  })
  it('仮名表記の曖昧', async () => {
    await cmp('『abc』の『a』を「*」に置き換え。表示', '*bc')
  })
  it('範囲コメントの処理', async () => {
    await cmp('1を表示\n/*2を表示\n3を表示\n*/\n4を表示\n', '1\n4')
    await cmp('1を表示\n/*2を表示\n3を表示\n4を表示\n5を表示\n*/\n6を表示\n', '1\n6')
  })
  it('文字列の埋め込み', async () => {
    await cmp('見出し=30;「--{見出し}--」を表示', '--30--')
  })
  it('文字列の埋め込み語句のかな省略', async () => {
    await cmp('見出し=30;「--{見出}--」を表示', '--30--')
  })
  it('文字列に式を埋め込む', async () => {
    await cmp('「--{3に2を掛ける}--」を表示', '--6--')
  })
  it('文字列の埋め込み変数名全角英数字', async () => {
    await cmp('N1=30;「--{Ｎ１}--」を表示', '--30--')
  })
  it('文字列の埋め込みで対応しない閉じ括弧がある場合', async () => {
    await cmp('B=1;E=2;「A{B}C}D{E}F」を表示', 'A1C}D2F')
  })
  it('文字列の埋め込み配列', async () => {
    await cmp('手説明＝["グー","チョキ","パー"];「自分は{手説明@1}、相手は{手説明@0}」と表示', '自分はチョキ、相手はグー')
  })
  it('はい/いいえ', async () => {
    await cmp('はいを表示', '1')
    await cmp('いいえを表示', '0')
  })
  it('A = 8の書き方', async () => {
    await cmp('A = 8;Aを表示', '8')
  })
  it('数値表現のテスト', async () => {
    await cmp('123e1を表示', '1230')
    await cmp('123E-1を表示', '12.3')
    await cmp('123e+1を表示', '1230')
    await cmp('.123e-1を表示', '0.0123')
    await cmp('123.e1を表示', '1230')
  })
  it('2進数/8進数/16進数のテスト', async () => {
    await cmp('0xFFを表示', '255')
    await cmp('0XFFを表示', '255')
    await cmp('0b11を表示', '3')
    await cmp('0B1111を表示', '15')
    await cmp('0o10を表示', '8')
    await cmp('0O11を表示', '9')
  })
  it('bigintのテスト', async () => {
    await cmp('12345678901234567890123nを表示', '12345678901234567890123')
    await cmp('-12345678901234567890123nを表示', '-12345678901234567890123')
    await cmp('0x123456789abcdefnを表示', '81985529216486895')
    await cmp('0o1234567123456712345671234567nを表示', '3158001080923004573399415')
    await cmp('0b1101011010100101101110100101000111011011010101011110011100111000110011100110110101101nを表示', '32436594107500554171829677')
    await cmp('1_2_3_4_5678_9_0_1_234_567_890_123nを表示', '12345678901234567890123')
  })
  it('《特別名トークン》のテスト', async () => {
    await cmp('《今日から明日》＝30；《今日から明日》を表示', '30')
    await cmp('《AからBまで》＝30；《AからBまで》を表示', '30')
  })
  it('以上、以下、超、未満 (#918)', async () => {
    await cmp('A=4;もし、Aが2以上ならば\nAを表示;\nここまで。', '4')
    await cmp('A=4;もし、30がA以上ならば\nAを表示;\nここまで。', '4')
  })
  it('ソースマップ - 単純な例', async () => {
    const nako = new NakoCompiler()
    const tokens = nako.lex('「こんにちは」と表示', 'main.nako3', '').tokens

    // 0-7文字目: 「こんにちは」と
    assert.strictEqual(tokens[0].startOffset, 0)
    assert.strictEqual(tokens[0].endOffset, 8)

    // 8-9文字目: 表示
    assert.strictEqual(tokens[1].startOffset, 8)
    assert.strictEqual(tokens[1].endOffset, 10)
  })
  it('ソースマップ - スペース扱いの文字', async () => {
    // '・'はスペース扱いであり、トークン化されない。
    const nako = new NakoCompiler()
    const tokens = nako.lex('ならば・A', 'main.nako3', '').tokens

    // 0-2文字目: ならば
    assert.strictEqual(tokens[0].startOffset, 0)
    assert.strictEqual(tokens[0].endOffset, 3)

    // 4文字目: A
    assert.strictEqual(tokens[1].startOffset, 4)
    assert.strictEqual(tokens[1].endOffset, 5)
  })
  it('ソースマップ - 複数行の場合', async () => {
    const nako = new NakoCompiler()
    const tokens = nako.lex('「こんにちは」を表示する。\n「こんにちは」を表示する。', 'main.nako3', '').tokens
    assert.strictEqual(tokens[0].startOffset, 0) // 0-7: 「こんにちは」を
    assert.strictEqual(tokens[1].startOffset, 8) // 8-11: 表示する
    assert.strictEqual(tokens[2].startOffset, 12) // 12: 。
    assert.strictEqual(tokens[3].startOffset, 13) // 13: eol
    assert.strictEqual(tokens[4].startOffset, 14) // 14-21: 「こんにちは」を
    assert.strictEqual(tokens[5].startOffset, 22) // 22-25: 表示する
    assert.strictEqual(tokens[6].startOffset, 26) // 26: 。
  })
  it('ソースマップ - 行コメント', async () => {
    const nako = new NakoCompiler()
    const tokens = nako.lex('# コメント').commentTokens
    assert.strictEqual(tokens[0].startOffset, 0)
    assert.strictEqual(tokens[0].endOffset, 6)
  })
  it('ソースマップ - 範囲コメント', async () => {
    const nako = new NakoCompiler()
    const tokens = nako.lex('/*\nここは全部コメント\nここは全部コメント\n*/').commentTokens
    assert.strictEqual(tokens[0].startOffset, 0)
    assert.strictEqual(tokens[0].endOffset, 25)
  })
  it('ソースマップ - 範囲コメントの直後に文字がある場合', async () => {
    const nako = new NakoCompiler()
    const result = nako.lex('/*\nここは全部コメント\nここは全部コメント\n*/a')

    // コメント
    assert.strictEqual(result.commentTokens[0].startOffset, 0)
    assert.strictEqual(result.commentTokens[0].endOffset, 25)

    // a
    assert.strictEqual(result.tokens[0].startOffset, 25)
    assert.strictEqual(result.tokens[0].endOffset, 26)
  })
  it('ソースマップ - "_"による改行', async () => {
    const nako = new NakoCompiler()
    const tokens = nako.lex('[_\n]\nりんごの値段は30').tokens
    const nedan = tokens.find((t) => t.value === '値段') || { startOffset: 0, endOffset: 0 }
    assert.strictEqual(nedan.startOffset, 9)
    assert.strictEqual(nedan.endOffset, 11)
  })
  it('ソースマップ - インデント構文', async () => {
    const nako = new NakoCompiler()
    const tokens = nako.lex('！インデント構文\n1回\n    「2」を表示\n\n「3」を表示').tokens
    // @ts-ignore
    assert.strictEqual(tokens.find((t) => t.value === '2').startOffset, 16) // 「1」を
    // @ts-ignore
    assert.strictEqual(tokens.find((t) => t.value === '3').startOffset, 24) // 「2」を
  })
  it('ソースマップ - string_ex', async () => {
    const nako = new NakoCompiler()
    const tokens = nako.lex('"{あ}"').tokens
    // @ts-ignore
    assert.strictEqual(tokens.find((t) => t.value === 'あ').startOffset, 2)
    // @ts-ignore
    assert.strictEqual(tokens.find((t) => t.value === 'あ').endOffset, 3)
  })
  it('「ならば」＋「(全角|半角)空白」直後の改行が消える問題 #1015', async () => {
    await cmp('もし、3=3ならば \n『OK』と表示;違えば;「NG」と表示;ここまで。', 'OK')
    await cmp('もし、3=3ならば　\n『OK』と表示;違えば;「NG」と表示;ここまで。', 'OK')
  })
  it('助詞の前後に空白があるとエラーになる問題 #1079', async () => {
    await cmp('x=1;x と 2 と "3" を連続表示', '123')
  })
  it('丸付き数字が変数名として使えない #1185', async () => {
    await cmp('⓪=0;①=1;㊿=50;❿=10;⓪+①+㊿+❿を表示', '61')
  })
  it('絵文字の四則演算を認識する #1183', async () => {
    await cmp('リンゴ🟰3✖5;ミカン🟰9➗3;リンゴ+ミカンを表示', '18')
  })
})
