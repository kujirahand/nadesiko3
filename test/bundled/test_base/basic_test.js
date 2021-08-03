const TestEnv = require('./test_utils').TestEnv

describe('basic', () => {
  const env = new TestEnv()
  before(function () {
    env.getEnv()
  })

  const cmp = (code, res) => {
    env.cmpInfo(code, res)
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
  it('空白で区切って文をつなげた場合', () => {
    cmp('1と2を足す 1と2を足す', '')
  })
  it('制御構文で一語関数を使う', () => {
    cmp('●一とは\n1を戻す\nここまで\nもし一ならば\n1を表示\nここまで', '1') // if
    cmp('●一とは\n1を戻す\nここまで\n一回\n1を表示\nここまで', '1') // times
    cmp('●一とは\n1を戻す\nここまで\n一の間\n1を表示\n抜ける\nここまで', '1') // while
    cmp('●一とは\n[1]を戻す\nここまで\n一を反復\n1を表示\nここまで', '1') // foreach
    cmp('●一とは\n1を戻す\nここまで\n一で条件分岐\n1ならば\n1を表示\nここまで\nここまで', '1') // switch
  })
  it('そう', () => {
    // 「そう」は「それ」のエイリアス
    cmp('それ＝1;そうを表示', '1')
    cmp('1に3を足す;そうを表示', '4')
  })
  it('「〜時間」の「間」を制御構文として認識させない #831', () => {
    cmp('時間=1\n（時間）を表示', '1')
  })
  it('「もしFが存在するならば」がFと「存在する」の比較になる問題の修正 #830', () => {
    cmp('●（Aが）hogeとは\n' +
        '    1を戻す\n' +
        'ここまで\n' +
        'もし、Fがhogeならば\n' +
        '    1を表示\n' +
        'ここまで',
    // ---
    '1')
  })
})
