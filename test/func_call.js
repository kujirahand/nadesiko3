const assert = require('assert')
const NakoCompiler = require('../src/nako3')
const NakoSyntaxError = require('../src/nako_parser_base').NakoSyntaxError

describe('関数呼び出しテスト', () => {
  const nako = new NakoCompiler()
  nako.debugParser = false
  nako.debug = false
  const cmp = (code, res) => {
    if (nako.debug)
      console.log('code=' + code)

    assert.equal(nako.runReset(code).log, res)
  }
  const cmd = (code) => {
    if (nako.debug) console.log('code=' + code)
    nako.runReset(code)
  }
  // --- test ---
  it('関数式の呼び出し - 足す(2,3)を表示。', () => {
    cmp('足す(2,3)を表示。', '5')
  })
  it('四則演算を連文で', () => {
    cmp('1に2を足して3を掛けて3で割って2を引いて表示', '1')
  })
  it('「そう」のテスト', () => {
    cmp('３が１以上。もしそうならば「真」と表示。', '真')
  })
  it('後方で定義した関数を前方で使う1', () => {
    cmp('HOGE(3,4)を表示;●(A,B)HOGEとは;それはA+B;ここまで;', '7')
    cmp('「姫」と「殿」が出会って表示;●(AとBが)出会うとは;それはA&B;ここまで;', '姫殿')
  })
  it('後方で定義した関数を前方で使う2', () => {
    cmp('Nとは変数=30;HOGE(3,4)を表示;●(A,B)HOGEとは;それはA+B+N;ここまで;', '37')
  })
  it('代入と表示', () => {
    cmp('A=今日;もし(今日=A)ならば「1」と表示', '1')
  })
  it('代入1', () => {
    cmp('A=今日の曜日番号取得;B=(今日)の曜日番号取得;もしA=Bならば「等しい」を表示。', '等しい')
  })
  it('代入2', () => {
    cmp('Aは、今日の曜日番号取得;Bは、(今日)の曜日番号取得;もしA=Bならば「等しい」を表示。', '等しい')
  })
  it('代入3', () => {
    cmp('A=(今日の曜日番号取得)+1;B=((今日)の曜日番号取得)+1;もしA=Bならば「等しい」を表示。', '等しい')
  })
  it('配列への代入', () => {
    cmp('値段は空配列。値段[0]に3000を代入。値段[0]を表示。', '3000')
  })
  it('**には**構文 - 基本', () => {
    cmp('実行には;「あ」と表示;ここまで', 'あ')
  })
  it('**には**構文 - 配列カスタムソート', () => {
    cmp('A=[5,1,3];Aを配列カスタムソートするには(a,b)それはb-a;ここまで;Aを「:」で配列結合して表示', '5:3:1')
  })
  it('階乗計算 - 再帰', () => {
    cmp('●(VをAのBで)階乗計算とは;' +
      'もし、Bが0以下ならば、Vを戻す。;(V*A)をAの(B-1)で階乗計算して戻す。' +
      'ここまで。;1を2の3で階乗計算して表示。', 8)
  })
  it('連続文後の代入', () => {
    cmp('「2017/09/01T00:00:99」の「T」を「 」に置換して「 」まで切り取り、対象日に代入。対象日を表示。', '2017/09/01')
  })
  it('連続文後の=代入', () => {
    cmp('対象日=「2017/09/01T00:00:99」の「T」を「 」に置換して「 」まで切り取る。対象日を表示。', '2017/09/01')
  })
  it('関数の代入的呼び出し(#290)その1', () => {
    cmp('INTに3.5を代入;それを表示;', '3')
  })
  it('関数の代入的呼び出し(#290)その2', () => {
    cmp('INT=3.5;それを表示;', '3')
    cmp('INTは3.5;それを表示;', '3')
  })
  it('関数の代入的呼び出しその3', () => {
    const funcName = 'テスト'
    assert.throws(
      () => cmd(`●${funcName};それは5;ここまで;${funcName}=8`),
      err => {
        assert(err instanceof NakoSyntaxError)

        // エラーメッセージの内容が正しいか
        assert(err.message.indexOf(`引数がない関数『${funcName}』を代入的呼び出しすることはできません。`) > -1)
        return true
      }
    )
  })
  it('関数の代入的呼び出しその4', () => {
    const funcName = 'テスト'
    assert.throws(
      () => cmd(`●${funcName}(aとbを);それはa+b;ここまで;${funcName}=8`),
      err => {
        assert(err instanceof NakoSyntaxError)

        // エラーメッセージの内容が正しいか
        assert(err.message.indexOf(`引数が2つ以上ある関数『${funcName}』を代入的呼び出しすることはできません。`) > -1)

        return true
      }
    )
  })
  it('関数の代入的呼び出しその5', () => {
    const funcName = 'テスト'
    assert.throws(
      () => cmd(`●${funcName};それは5;ここまで;${funcName}に8を代入`),
      err => {
        assert(err instanceof NakoSyntaxError)

        // エラーメッセージの内容が正しいか
        assert(err.message.indexOf(`引数がない関数『${funcName}』を代入的呼び出しすることはできません。`) > -1)
        return true
      }
    )
  })
  it('関数の代入的呼び出しその6', () => {
    const funcName = 'テスト'
    assert.throws(
      () => cmd(`●${funcName}(aとbを);それはa+b;ここまで;${funcName}に8を代入`),
      err => {
        assert(err instanceof NakoSyntaxError)

        // エラーメッセージの内容が正しいか
        assert(err.message.indexOf(`引数が2つ以上ある関数『${funcName}』を代入的呼び出しすることはできません。`) > -1)

        return true
      }
    )
  })
  it('関数の代入的呼び出しその7', () => {
    const funcName = 'テスト'
    assert.throws(
      () => cmd(`●${funcName};それは5;ここまで;${funcName}は8`),
      err => {
        assert(err instanceof NakoSyntaxError)

        // エラーメッセージの内容が正しいか
        assert(err.message.indexOf(`引数がない関数『${funcName}』を代入的呼び出しすることはできません。`) > -1)
        return true
      }
    )
  })
  it('関数の代入的呼び出しその8', () => {
    const funcName = 'テスト'
    assert.throws(
      () => cmd(`●${funcName}(aとbを);それはa+b;ここまで;${funcName}は8`),
      err => {
        assert(err instanceof NakoSyntaxError)

        // エラーメッセージの内容が正しいか
        assert(err.message.indexOf(`引数が2つ以上ある関数『${funcName}』を代入的呼び出しすることはできません。`) > -1)

        return true
      }
    )
  })
  it('関数の引数に関数呼び出しがある場合', () => {
    cmp('A=「ab」;「abcd」の1から(Aの文字数)だけ文字削除。それを表示。', 'cd')
  })
  it('配列カスタムソートの基本的な使い方例', ()=> {
    cmp('●MYSORT(a,b)とは\n' +
        '(INT(a) - INT(b))で戻る。\n' +
        'ここまで。\n' +
        'ARY=[8,3,4];' +
        '「MYSORT」でARYを配列カスタムソートしてJSONエンコードして表示', '[3,4,8]')
  })
  it('引数の順番を入れ替えて呼び出す(#342)その1', () => {
    cmp('『abc』の『a』を「*」に置換。表示', '*bc')
    cmp('『a』を「*」に『abc』の置換。表示', '*bc')
    cmp('「*」へ『a』から『abc』の置換。表示', '*bc')
    cmp('「abcdefg」の1から3だけ文字削除して表示。', 'defg')
    cmp('「abcdefg」の1から3を文字削除して表示。', 'defg')
    cmp('1から3を「abcdefg」の文字削除して表示。', 'defg')
    cmp('3を「abcdefg」の1から文字削除して表示。', 'defg')
    cmp('3だけ「abcdefg」の1から文字削除して表示。', 'defg')
  })
  it('引数の順番を入れ替えて呼び出す(#342)その2', () => {
    cmp('[8,3,4]の配列カスタムソートには(a,b)\nそれは(a - b)\nここまで。それをJSONエンコードして表示', '[3,4,8]')
    cmp('[8,3,4]を配列カスタムソートには(a,b)\nそれは(a - b)\nここまで。それをJSONエンコードして表示', '[3,4,8]')
    cmp('[8,3,4]の配列カスタムソートには(a,b)\nそれは(INT(a) - INT(b))\nここまで。それをJSONエンコードして表示', '[3,4,8]')
  })
  it('引数の順番を入れ替えて呼び出す(#342)その3', () => {
    cmp('ARY=[8,3,4];' +
        'ARYの配列カスタムソートには(a,b)\n' +
        'aと255のXORをAに代入。bと255のXORをBに代入。' +
        'それは(INT(a) - INT(b))\n' +
        'ここまで。\n' +
        'ARYをJSONエンコードして表示', '[3,4,8]')
  })
  it('可変長引数', () => { // 経緯 #501 → #729 
    cmp('連続加算(1,2,3)を表示。', '6')
    cmp('1と2と3を連続加算して表示。', '6')
    cmp('1に2と3を連続加算して表示。', '6')
  })
  // ---
})
