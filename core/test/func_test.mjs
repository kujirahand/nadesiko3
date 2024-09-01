/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('func_test', async () => {
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.getLogger().debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code, 'main.nako3')).log, res)
  }
  // --- test ---

  it('簡単な関数定義', async () => {
    await cmp('●HOGE()\n「あ」と表示\nここまで\nHOGE。', 'あ')
    await cmp('関数 HOGE()\n「あ」と表示\nここまで\nHOGE。', 'あ')
  })
  it('引数付き関数定義', async () => {
    await cmp('●(Sの)表示処理とは\nSを表示\nここまで\n「殿」の表示処理。', '殿')
    await cmp('●(AとBの)加算処理とは;それはA+B;ここまで;3と8の加算処理して表示', '11')
    await cmp('●(AにBをCと)連続加算処理\nそれはA+B+C\nここまで\n100に20を3と連続加算処理して表示。', '123')
  })
  it('引数付き関数定義(互換性のため)', async () => {
    await cmp('●表示処理(Sの)\nSを表示\nここまで\n「殿」の表示処理。', '殿')
    await cmp('●加算処理(AとBの);それはA+B;ここまで;3と8の加算処理して表示', '11')
    await cmp('●HOGE(Aに)\nAと表示\nここまで\n「姫」にHOGE。', '姫')
  })
  it('三つの引数', async () => {
    await cmp('●踊る(AとBがCを)\n「{A}:{B}:{C}」と表示\nここまで\n「姫」と「殿」が「タンゴ」を踊る。', '姫:殿:タンゴ')
    await cmp('●踊る(AとBとCが)\n「{A}:{B}:{C}」と表示\nここまで\n「姫」と「殿」と「息子」が踊る。', '姫:殿:息子')
  })
  it('戻るのテスト', async () => {
    await cmp('●加算(AにBを)\n(A+B)で戻る\nここまで\n2に3を加算して表示。', '5')
  })
  it('再帰テスト', async () => {
    await cmp('●NN(vとlevelで)\n' +
      'もしlevel<=0ならば、vで戻る。\n' +
      '(v+1)と(level-1)でNN。\n' +
      'それで戻る。\nここまで\n' +
      '0と5でNN。それを表示。', '5')
  })
  it('ローカル変数1', async () => {
    await cmp('N=30\n' +
      '●テスト\n' +
      '  Nとは変数\n' +
      '  N=10\n' +
      'ここまで\n' +
      'テスト。\n' +
      'Nを表示。', '30')
  })
  it('ローカル変数2', async () => {
    await cmp('N=30\n' +
      '●テスト\n' +
      '  Nとは変数=10\n' +
      'ここまで\n' +
      'テスト。\n' +
      'Nを表示。', '30')
  })
  it('ローカル変数3', async () => {
    await cmp('N=300\n' +
      '●テスト(AにBを)\n' +
      '  変数のN=A+B\n' +
      'ここまで\n' +
      '1に2をテスト。\n' +
      'Nを表示。', '300')
  })
  it('ローカル定数1', async () => {
    await cmp('定数のN=30\n' +
      'Nを表示。', '30')
  })
  it('ローカル定数2', async () => {
    const expected = '30'
    const nako = new NakoCompiler()
    for (let i = 0; i < 2; i++) {
      const env = await nako.run('定数のN=30\nNを表示。', 'main.nako3')
      assert.strictEqual(env.log, expected)
      env.reset()
    }
  })
  it('助詞の複数定義', async () => {
    await cmp('●加算処理（AにBを|AとBの）\n' +
      '(A+B)を戻す。\n' +
      'ここまで\n' +
      '10に20を加算処理して表示。\n' +
      '20と10の加算処理して表示。\n', '30\n30')
  })
  it('それを関数の戻り値とする', async () => {
    await cmp('●加算処理（AにBを|AとBの）\n' +
      'それは、A+B。\n' +
      'ここまで\n' +
      '10に20を加算処理して表示。\n' +
      '20と10の加算処理して表示。\n', '30\n30')
  })
  it('英語言語っぽい関数定義', async () => {
    await cmp('●加算処理（A,B）\n' +
      'それは、A+B。\n' +
      'ここまで\n' +
      '加算処理(10,20)を表示。\n' +
      '加算処理(20,10)を表示。\n', '30\n30')
  })
  it('関数の参照渡し', async () => {
    await cmp('●({関数}fで)演算処理とは\n' +
      '  それは、f()\n' +
      'ここまで\n' +
      '●二倍処理とは\n' +
      '  それは2\n' +
      'ここまで\n' +
      '二倍処理で演算処理して表示。', '2')
    await cmp('●({関数}fでaを)演算処理とは\n' +
      '  それは、f(a)\n' +
      'ここまで\n' +
      '●(aを)二倍処理とは\n' +
      '  それはa*2\n' +
      'ここまで\n' +
      '二倍処理で2を演算処理して表示。', '4')
    await cmp('●({関数}fでaとbを)演算処理とは\n' +
      '  それは、f(a,b)\n' +
      'ここまで\n' +
      '●(aとbを)二倍処理とは\n' +
      '  それはa*b*2\n' +
      'ここまで\n' +
      '二倍処理で2と3を演算処理して表示。', '12')
  })
  it('無名関数', async () => {
    await cmp('F=関数(a,b)それはa+b;ここまで。\n' +
      'F(3,5)を表示。\n', '8')
    await cmp('F=関数(a,b)それは(a+b);ここまで\n' +
      'F(3,5)を表示。\n', '8')
    await cmp('(関数(a,b)それは(a+b);ここまで)をFに代入。\n' +
      'F(1,2)を表示。\n', '3')
    await cmp('(●(a,b)それは(a+b);ここまで)をFに代入。\n' +
      'F(1,2)を表示。\n', '3')
  })
  it('暗黙的な無名関数「には」', async () => {
    await cmp('●(Fを)処理した時\nF()を表示\nここまで\n' +
      '処理した時には\nそれは「OK」\nここまで。', 'OK')
    await cmp('●(fでaを)演算処理とは\nf(a)を表示\nここまで\n' +
      '2を演算処理には(a)\nそれはa*2\nここまで\n', '4')
  })
  it('暗黙的な無名関数「は〜」', async () => {
    await cmp('●(Fを)処理した時\nF()を表示\nここまで\n' +
      '処理した時は〜\nそれは「OK」\nここまで。', 'OK')
    await cmp('●(fでaを)演算処理とは\nf(a)を表示\nここまで\n' +
      '2を演算処理は~(a)\nそれはa*2\nここまで\n', '4')
  })
  it('**すること #936', async () => {
    await cmp('●(AとBを)加算処理とは\nAとBを足すこと。。。3と5を加算処理して表示。', '8')
    await cmp('●(Nを)二乗処理とは;A=0；N回,AにNを足してAに代入すること。それはA。。。5を二乗処理して表示。', '25')
  })
  it('関数で使える「引数」が使えなくなっている #1741', async () => {
    await cmp('●(AとBを)加算処理とは\n引数[0]と引数[1]を足すこと。。。3と5を加算処理して表示。', '8')
    await cmp('●(AとBをCで)加算処理とは\nそれ=引数[0]+引数[1]+引数[2]。。。3と5を2で加算処理して表示。', '10')
  })
})
