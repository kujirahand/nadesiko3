/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('basic', async () => {
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */code, /** @type {string} */res) => {
    const nako = new NakoCompiler()
    // nako.logger.debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code, 'main.nako3')).log, res)
  }
  const cmpNakoFuncs = (/** @type {string} */code, /** @type {Set<string>} */res) => {
    const nako = new NakoCompiler()
    // nako.logger.debug('code=' + code)
    const ast = nako.parse(code, 'main.nako3')
    assert.deepStrictEqual(nako.getUsedFuncs(ast), res)
  }
  // --- test ---
  it('print simple', async () => {
    await cmp('3を表示', '3')
  })
  it('print', async () => {
    await cmp('3を表示', '3')
    await cmp('100を表示', '100')
    await cmp('0xFFを表示', '255')
  })
  it('string', async () => {
    await cmp('「abc」を表示', 'abc')
    await cmp('"abc"を表示', 'abc')
    await cmp('“あいう”を表示', 'あいう')
  })
  it('rawstring', async () => {
    await cmp('『abc』を表示', 'abc')
    await cmp('\'abc\'を表示', 'abc')
    await cmp('『abc{30}abc』を表示', 'abc{30}abc')
  })
  it('string_ex1', async () => {
    await cmp('a=30;「abc{a}abc」を表示', 'abc30abc')
    await cmp('a=30;「abc｛a｝abc」を表示', 'abc30abc')
  })
  it('string_ex2', async () => {
    await cmp('a=30;「abc{a+1}abc」を表示', 'abc31abc')
    await cmp('a=30;「abc｛a+1｝abc」を表示', 'abc31abc')
  })
  it('string_ex3', async () => {
    await cmp('a=30;「abc{aに2を掛ける}abc」を表示', 'abc60abc')
    await cmp('s=「  @   」;「abc{sをトリム}abc」を表示', 'abc@abc')
  })
  it('raw string - 🌿 .. 🌿', async () => {
    await cmp('a=🌿abc🌿;aを表示', 'abc')
  })
  it('EX string - 🌴 .. 🌴', async () => {
    await cmp('v=30;a=🌴abc{v}abc🌴;aを表示', 'abc30abc')
  })
  it('string - LF', async () => {
    await cmp('a=30;「abc\nabc」を表示', 'abc\nabc')
  })
  it('space 「・」', async () => {
    await cmp('・a=30;・b=50「{a}-{b}」を表示', '30-50')
  })
  it('string - 🌴 ... 🌴', async () => {
    await cmp('🌴aaa🌴を表示', 'aaa')
    await cmp('a=30;🌴aaa{a}bbb🌴を表示', 'aaa30bbb')
    await cmp('a=30;🌿aaa{a}bbb🌿を表示', 'aaa{a}bbb')
  })
  it('システム定数', async () => {
    await cmp('ナデシコエンジンを表示', 'nadesi.com/v3')
  })
  it('助詞の後に句読点', async () => {
    await cmp('「こんにちは」と、表示。', 'こんにちは')
  })
  it('代入文', async () => {
    await cmp('3000を値段に代入。値段を表示', '3000')
    await cmp('値段に3000を代入。値段を表示', '3000')
    await cmp('々=3000。々を表示', '3000')
    await cmp('々に3000を代入。々を表示', '3000')
  })
  it('連文後の代入文', async () => {
    await cmp('「aabbcc」の「aa」を「」に置換してFに代入。Fを表示', 'bbcc')
    await cmp('「aabbcc」の「aa」を「」に置換して「bb」を「」に置換してFに代入。Fを表示', 'cc')
  })
  it('〜を〜に定める', async () => {
    await cmp('Aを0.8に定めてAを表示', '0.8')
  })
  it('文字列 - &と改行', async () => {
    await cmp('「aaa」& _\n「bbb」を表示。', 'aaabbb')
    await cmp('A= 1 + 1 + 1 + 1 + 1 + _\n1 + 1\nAを表示', '7')
    await cmp('A= 1 + 1 + 1 + 1 + 1 + _\r\n1 + 1 + 1\r\nAを表示', '8')
    await cmp('A= 1 + 1 + 1 + 1 + 1 + _  \r\n1 + 3  \r\nAを表示', '9')
    await cmp('A = 1 + _\n' +
      '    5 + _\n' +
      '    10\n' +
      'Aを表示。', '16')
  })
  it('名前に数字を持つ変数を使う', async () => {
    await cmp('A1=30;B1=20;「{A1}{B1}」を表示。', '3020')
  })
  it('名前に絵文字を持つ変数を使う', async () => {
    await cmp('\u1F60=30;\u1F60を表示。', '30')
    await cmp('😄=30;😄を表示。', '30')
  })
  it('ラインコメントが正しく処理されない問題 (#112)', async () => {
    await cmp('A=50 # hogehoge\nAを表示', '50')
    await cmp('A=50 ＃ hogehoge\nAを表示', '50')
    await cmp('A=50 ※ hogehoge\nAを表示', '50')
    await cmp('A=50 // hogehoge\nAを表示', '50')
    await cmp('A=50 ／／ hogehoge\nAを表示', '50')
    await cmp('A=50\nもしA=50ならば # hogehoge\nAを表示\nここまで\n', '50')
    await cmp('A=50\nもしA=50ならば ＃ hogehoge\nAを表示\nここまで\n', '50')
    await cmp('A=50\nもしA=50ならば ※ hogehoge\nAを表示\nここまで\n', '50')
    await cmp('A=50\nもしA=50ならば // hogehoge\nAを表示\nここまで\n', '50')
    await cmp('A=50\nもしA=50ならば ／／ hogehoge\nAを表示\nここまで\n', '50')
  })
  it('ラインコメントに文字列記号があり閉じていないとエラーになる(#725)', async () => {
    await cmp('A=50 # "hogehoge\nAを表示', '50')
  })
  it('範囲コメントに文字列記号があり閉じていないとエラーになる(#731)', async () => {
    await cmp('A=50 /* " */Aを表示', '50')
    await cmp('A=50 /* \' */Aを表示', '50')
  })
  // #1229
  it('usedFuncs', async () => {
    cmpNakoFuncs('3を表示', new Set(['表示']))
    cmpNakoFuncs('●({関数}fでaを)演算処理とは;それは、f(a);ここまで;●(aを)二倍処理とは;それはa*2;ここまで;二倍処理で2を演算処理して表示', new Set(['表示']))
  })
  it('論文などで使われる句読点「，」を「、」(#735)', async () => {
    await cmp('A1=30;B1=20;(A1+B1)を，表示', '50')
    await cmp('A=３．１４;Aを，表示', '3.14')
  })
  it('条件分岐のインデント構文', async () => {
    await cmp(
      '！インデント構文\n' +
      '3で条件分岐\n' +
      '    2ならば\n' +
      '        2を表示\n' +
      '    3ならば\n' +
      '        3を表示\n' +
      '    違えば\n' +
      '        4を表示\n', '3')
  })
  it('💡のインデント構文 #1184', async () => {
    await cmp(
      '💡インデント構文\n' +
      '3で条件分岐\n' +
      '    2ならば\n' +
      '        2を表示\n' +
      '    3ならば\n' +
      '        3を表示\n' +
      '    違えば\n' +
      '        5を表示\n',
      '3'
    )
  })
  it('独立した助詞『ならば』の位置の取得', async () => {
    const nako = new NakoCompiler()
    const out = nako.lex('もし存在するならば\nここまで', '')
    const sonzai = out.tokens.find((t) => t.value === '存在')
    const naraba = out.tokens.find((t) => t.type === 'ならば')

    // 「存在する」
    assert.strictEqual(sonzai.startOffset, 2)
    assert.strictEqual(sonzai.endOffset, 6)

    // ならば
    assert.strictEqual(naraba.startOffset, 6)
    assert.strictEqual(naraba.endOffset, 9)
  })
  it('preCodeを考慮したソースマップ', async () => {
    const nako = new NakoCompiler()
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
  it('実行速度優先 - 1行のみ', async () => {
    const nako = new NakoCompiler()
    nako.reset()
    await cmp(`
「全て」で実行速度優先して1を表示
「全て」で実行速度優先して2を表示
`, '1\n2')
  })
  it('実行速度優先 - ブロック内に適用', async () => {
    // エラーが起きなければ、「実行速度優先」が無い場合と同じ動作をする。
    await cmp(`\
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
  it('実行速度優先 - 関数宣言の上方下方参照', async () => {
    // エラーが起きなければ、「実行速度優先」が無い場合と同じ動作をする。
    await cmp(`\
「全て」で実行速度優先
    ●Gとは
        2を表示
        3を表示
    ここまで
    ●Fとは
        Eする
    ここまで
    ●Eとは
        Gする
    ここまで
    1を表示
    F
ここまで
4を表示
`, '1\n2\n3\n4')
  })
  it('空白で区切って文をつなげた場合', async () => {
    await cmp('1と2を足す 1と2を足す', '')
  })
  it('return_none: true のaddFuncで定義した関数が「それ」に値を代入しないことを確認する', async () => {
    const nako = new NakoCompiler()
    nako.addFunc('hoge', [], () => { return 0 }, true)
    const g = await nako.run('1と2を足す\nhoge\nそれを表示')
    assert.strictEqual(g.log, '3')
  })
  it('制御構文で一語関数を使う', async () => {
    await cmp('●一とは\n1を戻す\nここまで\nもし一ならば\n1を表示\nここまで', '1') // if
    await cmp('●一とは\n1を戻す\nここまで\n一回\n1を表示\nここまで', '1') // times
    await cmp('●一とは\n1を戻す\nここまで\n一の間\n1を表示\n抜ける\nここまで', '1') // while
    await cmp('●一とは\n[1]を戻す\nここまで\n一を反復\n1を表示\nここまで', '1') // foreach
    await cmp('●一とは\n1を戻す\nここまで\n一で条件分岐\n1ならば\n1を表示\nここまで\nここまで', '1') // switch
  })
  it('そう', async () => {
    // 「そう」は「それ」のエイリアス
    await cmp('それ＝1;そうを表示', '1')
    await cmp('1に3を足す;そうを表示', '4')
  })
  it('「〜時間」の「間」を制御構文として認識させない #831', async () => {
    await cmp('時間=1\n（時間）を表示', '1')
  })
  it('「もしFが存在するならば」がFと「存在する」の比較になる問題の修正 #830', async () => {
    await cmp(
      '●（Aが）hogeとは\n' +
      '    1を戻す\n' +
      'ここまで\n' +
      'もし、Fがhogeならば\n' +
      '    1を表示\n' +
      'ここまで',
      '1')
  })
  it('無名関数が警告を出す問題の修正 #841', async () => {
    let log = ''
    const nako = new NakoCompiler()
    nako.getLogger().addListener('warn', ({ noColor }) => { log += noColor })
    nako.parse(
      'f = 関数(x) それは、x。ここまで。\n' +
      'g = 関数(x) それは、x。ここまで。\n'
      , 'main.nako3')
    assert.strictEqual(log, '')
  })
  /*
  it('resetされた後に関数名を取得できない問題の修正 #849', (done) => {
    const nako = new NakoCompiler()
    nako.getLogger().addListener('stdout', (data) => {
      const { noColor } = data
      assert(noColor.includes('function')) // JavaScriptのコード function() { var ... } が表示されるはず
      done()
    })
    nako.run(`
●Aとは
ここまで
0.0001秒後には
    「A」のJSオブジェクト取得して表示
ここまで。
`, '')
    nako.reset()
    console.log(nako.compile(`\
●テスト:足すとは
    1と2を足す
    それと3がASSERT等しい
ここまで

●テスト:引くとは
    1と2を足す
    それと3がASSERT等しい
ここまで
`, 'main.nako3', true))
  })
  */
  //
  it('「AはBである」構文 #939', async () => {
    await cmp('Aは9である。Aを表示', '9')
    await cmp('Bは「あ」である。Bを表示', 'あ')
    await cmp('Cは[1,2,3]である;C[2]を表示', '3')
  })
  it('「AはBです」構文 #974', async () => {
    await cmp('Aは9です。Aを表示', '9')
    await cmp('Bは「あ」でした。Bを表示してください。', 'あ')
    await cmp('Cは[1,2,3]である;C[2]を表示', '3')
  })
  it('複数変数代入構文 #563', async () => {
    await cmp('A,B=[1,2];Aを表示;Bを表示', '1\n2')
    await cmp('A,B,C=[1,2,3];Aを表示;Bを表示;Cを表示', '1\n2\n3')
    await cmp('A,B=[1];Aを表示;Bを表示;', '1\nundefined')
    await cmp('A,B,C,D=[1,2,3,4];Dを表示;', '4')
  })
  it('複数定数代入構文 #563', async () => {
    await cmp('定数[A,B]=[1,2];Aを表示;Bを表示', '1\n2')
    await cmp('定数[A,B,C]=[1,2,3];Aを表示;Bを表示;Cを表示', '1\n2\n3')
    await cmp('定数[A,B]=[1];Aを表示;Bを表示;', '1\nundefined')
    await cmp('定数[A,B,C,D]=[1,2,3,4];Dを表示;', '4')
  })
  it('複数定数代入構文その2 #563', async () => {
    await cmp('変数[A,B]=[1,2];Aを表示;Bを表示', '1\n2')
    await cmp('変数[A,B,C]=[1,2,3];Aを表示;Bを表示;Cを表示', '1\n2\n3')
    await cmp('変数[A,B]=[1];Aを表示;Bを表示;', '1\nundefined')
    await cmp('変数[A,B,C,D]=[1,2,3,4];Dを表示;', '4')
  })
  it('定数複数代入', async () => {
    await cmp('定数[A,B] = [1,2]; 「{A}:{B}」を表示', '1:2')
    await cmp('定数[A,B,C] = [1,2,3]; 「{A}:{B}:{C}」を表示', '1:2:3')
    await cmp('定数[A,B,C,D] = [1,2,3,4,5]; 「{A}:{B}:{C}:{D}」を表示', '1:2:3:4')
    await cmp('定数[A,B,C,D,E] = [1,2,3,4,5]; 「{A}:{B}:{C}:{D}:{E}」を表示', '1:2:3:4:5')
  })
  it('複数代入文の問題 #1027', async () => {
    await cmp('塊=[[0,0],[1,1]];塊を反復\nx,y=対象;💧;塊をJSONエンコードして表示。', '[[0,0],[1,1]]')
    await cmp('x=1;y=2;x,y=[y,x];xを表示', '2')
  })
  it('変数の複数代入', async () => {
    await cmp('A,B = [1,2]; 「{A}:{B}」を表示', '1:2')
    await cmp('A,B,C = [1,2,3]; 「{A}:{B}:{C}」を表示', '1:2:3')
    await cmp('A,B,C,D = [1,2,3,4,5]; 「{A}:{B}:{C}:{D}」を表示', '1:2:3:4')
    await cmp('A,B,C,D,E = [1,2,3,4,5]; 「{A}:{B}:{C}:{D}:{E}」を表示', '1:2:3:4:5')
  })
  it('もし文で「ならば」の前の空行でエラー #1079', async () => {
    await cmp('A=5;もし、A > 3　ならば「OK」と表示;', 'OK')
  })
  it('『増やす』『減らす』文の追加 #1145', async () => {
    // 増やす
    await cmp('A=0;Aを1増やす。Aと表示;', '1')
    await cmp('A=0;Aを123だけ増やす。Aと表示;', '123')
    // 減らす
    await cmp('A=10;Aを1減らす。Aと表示;', '9')
    await cmp('A=10;Aを5だけ減らす。Aと表示;', '5')
    // 初期化しないで使うと0になる
    await cmp('Aを3増やす;Aと表示;', '3')
    await cmp('Aを3減らす;Aと表示;', '-3')
    // 配列要素を増やす
    await cmp('A = [0,1,2];A[1]を3増やす;A[1]と表示;', '4')
  })
  it('『増やす』『減らす』文の追加 #1386 (core #86)', async () => {
    // 増やす
    await cmp('A=[5,5,5];A[0]を1増やす。A[0]と表示;', '6')
    await cmp('A={"R":15};A["R"]を1増やす。A["R"]と表示;', '16')
    // 減らす
    await cmp('A=[5,5,5];A[0]を1減らす。A[0]と表示;', '4')
    await cmp('A={"R":15};A["R"]を1減らす。A["R"]と表示;', '14')
  })
  it('オブジェクトプロパティ構文に増減文を使う', async () => {
    // $記法で増やす
    await cmp('A＝{"a":0};A$aを1増やす。A$aを表示。', '1')
    await cmp('A＝{"a":5};A$aを3だけ増やす。A$aを表示。', '8')
    // $記法で減らす
    await cmp('A＝{"a":10};A$aを1減らす。A$aを表示。', '9')
    await cmp('A＝{"a":10};A$aを5だけ減らす。A$aを表示。', '5')
    // ネスト$記法で増やす・減らす
    await cmp('A={"猫":{"日本猫":10}};A$猫$日本猫を5増やす。A$猫$日本猫を表示。', '15')
    await cmp('A={"猫":{"日本猫":10}};A$猫$日本猫を3減らす。A$猫$日本猫を表示。', '7')
    // __getProp/__setPropを持つオブジェクトでの増減
    await cmp(
      '『 (function(prop, sys){ return this[prop] })』をJS実行してF_GETに代入。\n' +
      '『 (function(prop, val, sys){ this[prop] = val })』をJS実行してF_SETに代入。\n' +
      'A={"幅": 3, "__setProp": F_SET, "__getProp": F_GET};\n' +
      'A$幅を2増やす。A$幅を表示。', '5')
    await cmp(
      '『 (function(prop, sys){ return this[prop] })』をJS実行してF_GETに代入。\n' +
      '『 (function(prop, val, sys){ this[prop] = val })』をJS実行してF_SETに代入。\n' +
      'A={"幅": 10, "__setProp": F_SET, "__getProp": F_GET};\n' +
      'A$幅を3減らす。A$幅を表示。', '7')
  })
  it('文字列記号と全角コメント閉じ記号の組み合わせがある時うまく動いていない(core #45)', async () => {
    await cmp(
      'もし1ならば\n' +
      '　　1を表示 ／＊ 「 ＊／\n' +
      '　　2を表示\n' +
      'ここまで。\n' +
      '', '1\n2')
  })
  it('「もの」構文(#1614)', async () => {
    await cmp('1に2を足したものを表示', '3')
    await cmp('1に2を足したものに3を足して表示', '6')
  })
  it('変数をObjectからMapに変更する(core#152)', async () => {
    await cmp('constructor=10;constructorを表示', '10')
    await cmp('super=10;superを表示', '10')
  })
  it('オブジェクトを手軽に設定する-通常(#1793)', async () => {
    await cmp('A={"幅":30};A$幅=50;A$幅を表示', '50')
    await cmp('A={"高":30};A$高さ=50;A$高さを表示', '50') // 送り仮名の省略
  })
  it('オブジェクトを手軽に設定する-ドットアクセス(#1807)', async () => {
    await cmp('A={"高":30};A.高=50;A.高を表示', '50') // 
    await cmp('A={"A":30,"B":50};A.A=500;A.Aを表示', '500') // 
  })
  it('オブジェクトを手軽に設定する-プロパティ関数(#1793)', async () => {
    // プロパティの値を取得して10倍にして返す
    await cmp(
      '『 (function(prop, sys){ return this[prop] * 10 })』をJS実行してF_GETに代入。\n' +
      '『 (function(prop, val, sys){ this[prop] = val })』をJS実行してF_SETに代入。\n' +
      'A={"幅": 3, "__setProp": F_SET, "__getProp": F_GET};\n' +
      'A$幅=5; A$幅を表示', '50')
    // 値を10倍にして格納
    await cmp(
      '『 (function(prop, sys){ return this[prop] })』をJS実行してF_GETに代入。\n' +
      '『 (function(prop, val, sys){ this[prop] = val*10 })』をJS実行してF_SETに代入。\n' +
      'A={"幅": 3, "__setProp": F_SET, "__getProp": F_GET};\n' +
      'A$幅=5; A$幅を表示', '50')
  })
  it('オブジェクトを手軽に設定する-文字列 (#1793)', async () => {
    await cmp('A={"幅":30};A$"幅"=50;A$"幅"を表示', '50')
    await cmp('A={"高":30};A$"高"=50;A$"高"を表示', '50') // 送り仮名の省略
  })
  it('オブジェクトプロパティ構文$でネスト可能にする #1805', async () => {
    await cmp('A={"スタイル":{"幅":300}};A$スタイル$幅=1;A$スタイル$幅を表示', '1')
    await cmp('A={"猫":{"三毛猫":1, "日本猫":2}};A$猫$日本猫=123;A$猫$日本猫を表示', '123')
  })
  it('CSSの単位付き数値を文字列として認識させる #1811', async () => {
    await cmp('(TYPEOF(30px))を表示', 'string')
    await cmp('A=30em;Aを表示', '30em')
    await cmp('A=30px;AをJSONエンコードして表示', '"30px"')
  })
  it('特別名前トークンのテスト #672 #1836', async () => {
    await cmp('《リンゴの値段》=500;《リンゴの値段》を表示', '500') // #672 大なり記号ではなく、二重カッコであることに注意
    await cmp('${リンゴの値段}=500;${リンゴの値段}を表示', '500') // #1836
  })
  it('特別名前トークンのテスト #672 #1836', async () => {
    await cmp('《リンゴの値段》=500;《リンゴの値段》を表示', '500') // #672 大なり記号ではなく、二重カッコであることに注意
    await cmp('${リンゴの値段}=500;${リンゴの値段}を表示', '500') // #1836
  })
  it('無効助詞のテスト #2178', async () => {
    await cmp('「吾輩は猫」と表示にゃん', '吾輩は猫')
    await cmp('「吾輩は猫」と表示するにゃん', '吾輩は猫')
    await cmp('50を表示でした', '50')
  })
  it('助詞に「として」を追加 #2180', async () => {
    await cmp('●(Sとして)二倍処理とは;それは、S*2。。。10として二倍処理して表示にゃん', '20')
    await cmp('●(Sとして)正すとは;それは「{S}を正す」。。。「人」として正して表示', '人を正す')
  })
})
