const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('basic', () => {
  const nako = new NakoCompiler()
  // nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    assert.strictEqual(nako.runReset(code).log, res)
  }
  const cmpNakoFuncs = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }

    nako.runReset(code)
    assert.deepStrictEqual(nako.usedFuncs, res)
  }
  // --- test ---
  it('print simple', () => {
    cmp('3を表示', '3')
  })
  it('print', () => {
    cmp('3を表示', '3')
    cmp('100を表示', '100')
    cmp('0xFFを表示', '255')
  })
  it('string', () => {
    cmp('「abc」を表示', 'abc')
    cmp('"abc"を表示', 'abc')
    cmp('“あいう”を表示', 'あいう')
  })
  it('rawstring', () => {
    cmp('『abc』を表示', 'abc')
    cmp('\'abc\'を表示', 'abc')
    cmp('『abc{30}abc』を表示', 'abc{30}abc')
  })
  it('exstring', () => {
    cmp('a=30;「abc{a}abc」を表示', 'abc30abc')
    cmp('a=30;「abc｛a｝abc」を表示', 'abc30abc')
  })
  it('raw string - 🌿 .. 🌿', () => {
    cmp('a=🌿abc🌿;aを表示', 'abc')
  })
  it('EX string - 🌴 .. 🌴', () => {
    cmp('v=30;a=🌴abc{v}abc🌴;aを表示', 'abc30abc')
  })
  it('string - LF', () => {
    cmp('a=30;「abc\nabc」を表示', 'abc\nabc')
  })
  it('space 「・」', () => {
    cmp('・a=30;・b=50「{a}-{b}」を表示', '30-50')
  })
  it('string - 🌴 ... 🌴', () => {
    cmp('🌴aaa🌴を表示', 'aaa')
    cmp('a=30;🌴aaa{a}bbb🌴を表示', 'aaa30bbb')
    cmp('a=30;🌿aaa{a}bbb🌿を表示', 'aaa{a}bbb')
  })
  it('システム定数', () => {
    cmp('ナデシコエンジンを表示', 'nadesi.com/v3')
  })
  it('助詞の後に句読点', () => {
    cmp('「こんにちは」と、表示。', 'こんにちは')
  })
  it('代入文', () => {
    cmp('3000を値段に代入。値段を表示', '3000')
    cmp('値段に3000を代入。値段を表示', '3000')
    cmp('々=3000。々を表示', '3000')
    cmp('々に3000を代入。々を表示', '3000')
  })
  it('連文後の代入文', () => {
    cmp('「aabbcc」の「aa」を「」に置換してFに代入。Fを表示', 'bbcc')
    cmp('「aabbcc」の「aa」を「」に置換して「bb」を「」に置換してFに代入。Fを表示', 'cc')
  })
  it('〜を〜に定める', () => {
    cmp('Aを0.8に定めてAを表示', '0.8')
  })
  it('文字列 - &と改行', () => {
    cmp('「aaa」& _\n「bbb」を表示。', 'aaabbb')
    cmp('A= 1 + 1 + 1 + 1 + 1 + _\n1 + 1\nAを表示', '7')
    cmp('A= 1 + 1 + 1 + 1 + 1 + _\r\n1 + 1 + 1\r\nAを表示', '8')
    cmp('A= 1 + 1 + 1 + 1 + 1 + _  \r\n1 + 3  \r\nAを表示', '9')
    cmp('A = 1 + _\n' +
      '    5 + _\n' +
      '    10\n' +
      'Aを表示。', '16')
  })
  it('名前に数字を持つ変数を使う', () => {
    cmp('A1=30;B1=20;「{A1}{B1}」を表示。', '3020')
  })
  it('名前に絵文字を持つ変数を使う', () => {
    cmp('\u1F60=30;\u1F60を表示。', '30')
    cmp('😄=30;😄を表示。', '30')
  })
  it('ラインコメントが正しく処理されない問題 (#112)', () => {
    cmp('A=50 # hogehoge\nAを表示', '50')
    cmp('A=50 ＃ hogehoge\nAを表示', '50')
    cmp('A=50 ※ hogehoge\nAを表示', '50')
    cmp('A=50 // hogehoge\nAを表示', '50')
    cmp('A=50 ／／ hogehoge\nAを表示', '50')
    cmp('A=50\nもしA=50ならば # hogehoge\nAを表示\nここまで\n', '50')
    cmp('A=50\nもしA=50ならば ＃ hogehoge\nAを表示\nここまで\n', '50')
    cmp('A=50\nもしA=50ならば ※ hogehoge\nAを表示\nここまで\n', '50')
    cmp('A=50\nもしA=50ならば // hogehoge\nAを表示\nここまで\n', '50')
    cmp('A=50\nもしA=50ならば ／／ hogehoge\nAを表示\nここまで\n', '50')
  })
  it('ラインコメントに文字列記号があり閉じていないとエラーになる(#725)', () => {
    cmp('A=50 # \"hogehoge\nAを表示', '50')
  })
  it('範囲コメントに文字列記号があり閉じていないとエラーになる(#731)', () => {
    cmp('A=50 /* " */Aを表示', '50')
    cmp('A=50 /* \' */Aを表示', '50')
  })
  it('usedFuncs', () => {
    cmpNakoFuncs('●({関数}fでaを)演算処理とは;それは、f(a);ここまで;●(aを)二倍処理とは;それはa*2;ここまで;二倍処理で2を演算処理して表示', new Set(['表示']))
  })
  it('論文などで使われる句読点「，」を「、」(#735)', () => {
    cmp('A1=30;B1=20;(A1+B1)を，表示', '50')
    cmp('A=３．１４;Aを，表示', '3.14')
  })
  it('条件分岐のインデント構文', () => {
    cmp(
      '！インデント構文\n' +
      '3で条件分岐\n' +
      '    2ならば\n' +
      '        1を表示\n' +
      '    3ならば\n' +
      '        2を表示\n' +
      '    違えば\n' +
      '        3を表示\n',
      '2'
    )
  })
  it('独立した助詞『ならば』の位置の取得', () => {
    const out = nako.lex('もし存在するならば\nここまで')
    const sonzai = out.tokens.find((t) => t.value === '存在')
    const naraba = out.tokens.find((t) => t.type === 'ならば')

    // 「存在する」
    assert.strictEqual(sonzai.startOffset, 2)
    assert.strictEqual(sonzai.endOffset, 6)

    // ならば
    assert.strictEqual(naraba.startOffset, 6)
    assert.strictEqual(naraba.endOffset, 9)
  })
  it('preCodeを考慮したソースマップ', () => {
    const preCode = '1を表示\n2を表示\n3を'
    const tokens = nako.lex(preCode + '表示', 'main.nako3', preCode).tokens

    // '3' は-2から0文字目
    const three = tokens.findIndex((t) => t.value === 3)
    assert.strictEqual(tokens[three].startOffset, -2)
    assert.strictEqual(tokens[three].endOffset, 0)
    assert.strictEqual(tokens[three].line, 0)
    assert.strictEqual(tokens[three].column, -2)

    // '表示' は0~1文字目
    assert.strictEqual(tokens[three + 1].startOffset, 0)
    assert.strictEqual(tokens[three + 1].endOffset, 2)
    assert.strictEqual(tokens[three + 1].line, 0)
    assert.strictEqual(tokens[three + 1].column, 0)
  })
  it('実行速度優先 - 1行のみ', () => {
    nako.reset()
    cmp(`
「全て」で実行速度優先して1を表示
「全て」で実行速度優先して2を表示
`, '1\n2')
  })
  it('実行速度優先 - ブロック内に適用', () => {
    // エラーが起きなければ、「実行速度優先」が無い場合と同じ動作をする。
    cmp(`\
「全て」で実行速度優先
    ●Fとは
        2を表示
        3を表示
    ここまで
    1を表示
    F
ここまで
4を表示
`, '1\n2\n3\n4')
  })
})
