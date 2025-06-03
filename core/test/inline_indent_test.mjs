import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('inline_indent_test', async () => {
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  it('繰り返す', async () => {
    await cmp('Nを1から3まで繰り返す:\n  Nを表示\n', '1\n2\n3')
    await cmp('Nを１から３まで繰り返す:\n　　Nを表示\n', '1\n2\n3')
  })
  it('繰り返す2', async () => {
    await cmp('1から3まで繰り返す\nそれを表示\nここまで', '1\n2\n3')
  })
  it('もし-日本語による比較', async () => {
    await cmp('もし3が3と等しいならば:\n　　「OK」と表示。', 'OK')
    await cmp('もし(3+2)が5と等しいならば:\n　　「OK」と表示。', 'OK')
  })
  it('回-break', async () => {
    await cmp('3回:\n' +
              '　　\'a\'と表示。\n' +
              '　　もし(回数=2)ならば、抜ける\n', 'a\na')
  })
  it('反復 - 配列', async () => {
    await cmp('[1,2,3]を反復:\n  対象を表示\n', '1\n2\n3')
  })
  it('反復 - オブジェクト', async () => {
    await cmp('{\'a\':1,\'b\':2,\'c\':3}を反復:\n  対象を表示\n', '1\n2\n3')
    await cmp('{\'a\':1,\'b\':2,\'c\':3}を反復:\n  対象キーを表示\n', 'a\nb\nc')
  })
  it('反復 - 変数付き', async () => {
    await cmp('A=[1,2,3];NでAを反復:\n  Nを表示\n', '1\n2\n3')
    await cmp('Nで[1,2,3]を反復:\n  Nを表示\n', '1\n2\n3')
  })
  it('繰り返しのネスト', async () => {
    await cmp('C=0;Iを0から3まで繰り返す:\n  Jを0から3まで繰り返す:\n    C=C+1;\nCを表示', '16')
  })
  it('もし、と戻るの組み合わせ', async () => {
    await cmp('●テスト処理:\n' +
              '　　「あ」と表示\n' +
              '　　もし、3=3ならば、戻る。\n' +
              '　　「ここには来ない」と表示\n' +
              '\n' +
              'テスト処理。', 'あ')
  })
  it('もし文のエラー(#378)', async () => {
    await cmp('●AAAとは:\n' +
              '　　列を1から3まで繰り返す:\n' +
              '　　　　列を表示。' +
              '　　　　もし、列=2ならば、「*」と表示。\n' +
              'AAA', '1\n2\n*\n3')
  })
  it('「増繰り返す」「減繰り返す」を追加#1140', async () => {
    await cmp('Nを0から4まで2ずつ増やし繰り返す:\n　　Nを表示\n', '0\n2\n4')
  })
  // inline indent
  it('#1215 インラインインデント構文 - 回', async () => {
    await cmp('3回:\n' +
              '  "a"と表示\n', 'a\na\na')
  })
  it('#1215 インラインインデント構文 - もし', async () => {
    await cmp(
      'A=5;B=3;もし,A>Bならば:\n' +
      '  "ok"と表示\n' +
      '違えば:\n' +
      '  "ng"と表示\n', 'ok')
  })
  it('#1215 インラインインデント構文 - エラー監視', async () => {
    await cmp(
      'エラー監視:\n' +
      '  "ok"と表示\n' +
      'エラーならば:\n' +
      '  "err"と表示\n',
      'ok')
    await cmp(
      'エラー監視:\n' +
      '  "aaa"のエラー発生\n' +
      'エラーならば:\n' +
      '  "err"と表示\n',
      'err')
  })
  it('#1215 インラインインデント構文3 - ネスト', async () => {
    await cmp(
      '3回:\n' +
      '  もし、5>3ならば:\n' +
      '    「a」と表示\n' +
      '  違えば:\n' +
      '    「b」と表示\n',
      'a\na\na')
  })
  it('#1273 インラインインデントで無駄な区切り文字の問題', async () => {
    await cmp(
      '3回:\n' +
      '  もし、5>3ならば:\n' +
      '    「a」と表示。\n' +
      '  違えば:\n' +
      '    「b」と表示。\n',
      'a\na\na')
  })
  it('2つ目の関数の定義が失敗する(#40)', async () => {
    await cmp('' +
        '●AAAとは:\n' +
        '　　それは30\n' +
        '●BBBとは:\n' +
        '　　それは50\n' +
        'BBBを表示。', '50')
  })
  it('「もし」のネスト', async () => {
    await cmp('' +
        'A=1;B=1;\n' +
        'もし,A=1ならば:\n' +
        '　　もし,B=1ならば:\n' +
        '　　　　「A=1,B=1」と表示\n' +
        '　　違えば:\n' +
        '　　　　「A=1,B=0」と表示\n' +
        '違えば:\n' +
        '　　もし,B=1ならば:\n' +
        '　　　　「A=0,B=1」と表示\n' +
        '　　違えば:\n' +
        '　　　　「A=0,B=0」と表示\n' +
        '', 'A=1,B=1')
    await cmp('' +
        'A=0;B=0;\n' +
        'もし,A=1ならば:\n' +
        '　　もし,B=1ならば:\n' +
        '　　　　「A=1,B=1」と表示\n' +
        '　　違えば:\n' +
        '　　　　「A=1,B=0」と表示\n' +
        '違えば:\n' +
        '　　もし,B=1ならば:\n' +
        '　　　　「A=0,B=1」と表示\n' +
        '　　違えば:\n' +
        '　　　　「A=0,B=0」と表示\n' +
        '', 'A=0,B=0')
  })
  it('インラインインデントでJSON(core #46)', async () => {
    await cmp('' +
      'A=[99]\nもしA[0]=99ならば:\n' +
      '　　A=[0,\n0]\n' +
      'A[0]を表示\n', '0')
    await cmp('' +
      'A={"a":0,"b":0}\nもし1ならば:\n' +
      '　　A={"a":99,\n"b":99}\n' +
      'A["b"]を表示\n', '99')
  })
  it('行頭のインデント記号が増える件について #1333(core #46)', async () => {
    await cmp('' +
      '3回:\n' +
      '　┗━「1」と表示。\n' +
      '', '1\n1\n1')
    await cmp('' +
      '3回:\n' +
      '    「1」と表示。\n' +
      '\t「2」と表示。\n' +
      '', '1\n2\n1\n2\n1\n2')
    await cmp('' +
      '3回:\n' +
      '　┗━「1」と表示。\n' +
      '    「2」と表示。\n' +
      '', '1\n2\n1\n2\n1\n2')
    await cmp('' +
      '3回:\n' +
      '| ┗━「1」と表示。\n' +
      '| └─「2」と表示。\n' +
      '', '1\n2\n1\n2\n1\n2')
  })
  it('一行に2つの文を書いたときのインデントがおかしい。 #1333(core #66)', async () => {
    await cmp('' +
      'B=0;\n' +
      '●hogeとは:\n' +
      '　　A=3;B=3;\n' +
      'Bを表示。', '0')
  })
  it('インラインインデントの記号「：」の後ろにコメントを書けない #2046', async () => {
    await cmp('' +
      'B=0;\n' +
      '2回: //ここ\n' +
      '　　B=B+1;\n' +
      'Bを表示。', '2')
  })
})
