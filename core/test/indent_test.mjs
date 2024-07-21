/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import NakoIndent from '../src/nako_indent.mjs'

describe('indent', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    const g = await nako.runAsync(code)
    assert.strictEqual(g.log, res)
  }
  it('もし', async () => {
    await cmp('!インデント構文\n' +
        'もし1=1ならば\n' +
        '　　1を表示\n', '1')
    await cmp('!インデント構文\n' +
        'もし1=1ならば\n' +
        '　　「わん」と表示。\n', 'わん')
  })
  it('もし 違えば', async () => {
    await cmp('!インデント構文\n' +
            'A=1\nもしA=1ならば\n' +
            '　　1を表示\n' +
            '違えば\n' +
            '　　2を表示\n', '1')
    await cmp('!インデント構文\n' +
        'A=2\nもしA=1ならば\n' +
        '　　1を表示\n' +
        '違えば\n' +
        '　　2を表示\n', '2')
  })
  it('5回', async () => {
    await cmp('!インデント構文\n' +
        'N=0;5回\n' +
        '　　　　N=N+1\n' +
        'Nを表示;', '5')
  })
  it('3回と5回', async () => {
    await cmp('!インデント構文\n' +
        'N=0;5回\n' +
        '　　3回\n' +
        '　　　　N=N+1\n' +
        'Nを表示;', '15')
  })
  it('もし 違えば 入れ子', async () => {
    await cmp('!インデント構文\n' +
        'A=1;B=1;もしA=1ならば\n' +
        '　　もしB=1ならば\n' +
        '　　　　1を表示\n' +
        '　　違えば\n' +
        '　　　　2を表示\n' +
        '違えば\n' +
        '　　3を表示\n', '1')
    await cmp('!インデント構文\n' +
        'A=2;B=1;もしA=1ならば\n' +
        '　　もしB=1ならば\n' +
        '　　　　1を表示\n' +
        '　　違えば\n' +
        '　　　　2を表示\n' +
        '違えば\n' +
        '　　3を表示\n', '3')
  })
  it('JSONで改行がある場合(#699)(core #46)', async () => {
    await cmp(
      '!インデント構文\n' +
      'J={"taro":30,\n' +
      '　　"jiro":50}\n' +
      'J@"jiro"を表示\n' +
      '', '50')
    await cmp('' +
      '!インデント構文\n' +
      'A=[99]\nもしA[0]=99ならば\n' +
      '　　A=[0,\n0]\n' +
      'A[0]を表示\n', '0')
    await cmp('' +
      '!インデント構文\n' +
      'A={"a":0,"b":0}\nもし1ならば\n' +
      '　　A={"a":99,\n"b":99}\n' +
      'A["b"]を表示\n', '99')
  })
  it('文字列内に改行がある場合', async () => {
    await cmp('!インデント構文\n' +
        'S=「aaa\n' +
        'bbb」\n' +
        'もしS=30ならば\n' +
        '　　「あ」と表示\n' +
        '違えば\n' +
        '　　「o」と表示', 'o')
  })
  it('コメント内に文字列リテラルの開始記号がある場合', async () => {
    await cmp('!インデント構文\n' +
        'A=9;もしA=1ならば\n' +
        '　　1を表示 # 「\n' +
        '2を表示\n', '2')
    await cmp('!インデント構文\n' +
        'A=1;もしA=1ならば\n' +
        '　　1を表示 // 「\n' +
        '2を表示\n', '1\n2')
  })
  it('複数行コメント内に文字列リテラルの開始記号がある場合', async () => {
    await cmp('!インデント構文\n' +
        'A=9;もしA=1ならば\n' +
        '　　1を表示 /* 「 */\n' +
        '2を表示\n', '2')
    await cmp('!インデント構文\n' +
        'A=1;もしA=1ならば\n' +
        '　　1を表示 ／＊ 「 ＊／\n' +
        '2を表示\n', '1\n2')
  })
  it('改行を含む、絵文字による文字列がある場合', async () => {
    await cmp(
      '!インデント構文\n' +
      '2回\n' +
      '    🌴1\n' +
      '🌴を表示\n' +
      '「2」を表示\n', '1\n\n1\n\n2')
  })
  it('前後が一致しない括弧がある場合', async () => {
    await cmp('!インデント構文\n' +
        '2回\n' +
        '   A=｛\n' +
        '}\n' +
        '1を表示\n', '1')
  })
  it('「違えば」に行コメントがある場合', async () => {
    await cmp('!インデント構文\n' +
        'A=2;もしA=1ならば\n' +
        '　　1を表示\n' +
        '違えば # コメント\n' +
        '　　2を表示\n', '2')
  })
  it('「違えば」に範囲コメントがある場合', async () => {
    await cmp('!インデント構文\n' +
        'A=2;もしA=1ならば\n' +
        '　　1を表示\n' +
        '/* foo \n' +
        '*/違えば /* bar */\n' +
        '　　2を表示\n', '2')
  })
  it('コメントのみの行がある場合', async () => {
    await cmp('!インデント構文\n' +
        'A=2;もしA=1ならば\n' +
        '　　　　# コメント\n' +
        '　　1を表示\n' +
        '違えば\n' +
        '/*        */\n' +
        '/*       */ \n' +
        '　　2を表示\n', '2')
  })
  it('"・"がある場合', async () => {
    await cmp('!インデント構文\n' +
        '1回\n' +
        '・1回\n' +
        '・・1を表示\n' +
        '・\n' +
        '・・2を表示\n', '1\n2')
  })
  it('「違えばもし」の場合(#940)', async () => {
    await cmp('!インデント構文\n' +
        'A=2;もしA=1ならば\n' +
        '　　1を表示\n' +
        '違えば、もしA=2ならば\n' +
        '　　2を表示\n' +
        '違えば\n' +
        '　　3を表示\n', '2')
  })
  // #1269 によりソースマップの確認は不要になりつつある
  it('ソースマップ', async () => {
    const result = NakoIndent.convert(
      '！インデント構文\n' +
            '\n' +
            '●（nを）階乗とは\n' +
            '    もしnが1と等しいならば\n' +
            '        それは1\n' +
            '    違えば\n' +
            '        それは((n - 1)を階乗) * n\n' +
            '\n' +
            'もし１＝１なら\n' +
            '    「こんに\n' +
            'ちは」と表示\n' +
            '\n' +
            '「こんにちは」と表示\n' +
            '\n' +
            ''
    )
    /**
         * 出力されるべきコード:
         * ```
         *  0！インデント構文
         *  1 ●（nを）階乗とは
         *  2     もしnが1と等しいならば
         *  3         それは1
         *  4     違えば
         *  5         それは((n - 1)を階乗) * n
         *  6     ここまで‰
         *  7 ここまで‰
         *  8 もし１＝１なら
         *  9     「こんに
         * 10 ちは」と表示
         * 11 ここまで‰
         * 12 「こんにちは」と表示
         * ```
         */
    // 6, 7, 11 行目に「ここまで‰」が挿入された。
    assert.deepStrictEqual(result.insertedLines, [6, 7, 11])

    // 1, 6, 11, 13, 13行目の直前の空白行が消された。
    // ※ 正確には、各空白行を消したときに、それまでに出力した行数（「ここまで‰」を含む）が 1, 6, 11, 13, 13 行。
    assert.deepStrictEqual(result.deletedLines, [
      { lineNumber: 1, len: 0 },
      { lineNumber: 6, len: 0 },
      { lineNumber: 11, len: 0 },
      { lineNumber: 13, len: 0 },
      { lineNumber: 13, len: 0 }
    ])
  })
  it('ブロック構造の取得', async () => {
    assert.deepStrictEqual(
      NakoIndent.getBlockStructure(
        'もしはいならば\n' +
                '    「こん\n' +
                'にちは」を表示\n' +
                'ここまで'
      ),
      {
        lines: [0, 4, 4, 0], // 各行の高さは 0, 4, 4, 0
        pairs: [[0, 3]], // 0行目と3行目のペアがブロックを構成している。
        parents: [null, 0, 0, null],
        spaces: ['', '    ', '    ', '']
      }
    )
  })
  it('ブロック構造の取得 - 複数行にまたがる構文', async () => {
    // 複数行にまたがる文の2行目以降のインデントは、先頭行のインデントと等しいものとする。
    // コメントのみの行のインデントは、直近の通常の行のインデントと等しいものとする。
    assert.deepStrictEqual(
      NakoIndent.getBlockStructure(
        '！インデント構文\n' +
                'Nを1から3まで繰り返す\n' +
                '    「1行目\n' +
                '2行目」を表示\n' +
                '/*範囲コメント\n' +
                '*/'
      ),
      {
        lines: [0, 0, 4, 4, 4, 4],
        pairs: [[1, 6]],
        parents: [null, null, 1, 1, 1, 1],
        spaces: ['', '', '    ', '    ', '', '']
      }
    )
  })
  it('ブロック構造の取得 - 違えば', async () => {
    assert.deepStrictEqual(
      NakoIndent.getBlockStructure(
        'もしはいならば\n' +
                '    a\n' +
                '違えば\n' +
                '    b\n' +
                'ここまで'
      ).pairs,
      [[0, 2], [2, 4]]
    )
  })
  it('2つ目の関数の定義が失敗する(#40)', async () => {
    await cmp('!インデント構文\n' +
        '●AAAとは\n' +
        '　　それは30\n' +
        '●BBBとは\n' +
        '　　それは50\n' +
        'BBBを表示。', '50')
  })
})
