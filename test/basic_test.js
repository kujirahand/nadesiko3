const assert = require('assert')
const NakoCompiler = require('../src/nako3')

describe('basic', () => {
  const nako = new NakoCompiler()
  // nako.debug = true;
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    assert.equal(nako.runReset(code).log, res)
  }
  const cmpNakoFuncs = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }

    nako.runReset(code)
    assert.deepEqual(nako.usedFuncs, res)
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
  it('usedFuncs', () => {
    cmpNakoFuncs('●({関数}fでaを)演算処理とは;それは、f(a);ここまで;●(aを)二倍処理とは;それはa*2;ここまで;二倍処理で2を演算処理して表示', new Set(['表示']))
  })
})
