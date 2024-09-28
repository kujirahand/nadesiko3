/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('dncl2 (core #41)', async () => {
  const cmp = async (code, res) => {
    const nako = new NakoCompiler()
    const g = await nako.runAsync(code)
    const resultValue = g.log
    // console.log(resultValue, '=', res)
    assert.strictEqual(resultValue, res)
  }

  it('基本', async () => {
    await cmp('!DNCL2\n' +
      'A=3\nAを表示', '3')
  })
  it('繰り返し文([繰り返す]なし)', async () => {
    await cmp('!DNCL2\n' +
      'C=0\n' +
      'Iを1から10まで1ずつ増やしながら:\n' +
      '　　C=C+I\n' +
      'Cを表示', '55')
    await cmp('!DNCL2\n' +
      'C=10\n' +
      'Iを1から10まで1ずつ減らしながら:\n' +
      '　　C=C-1\n' +
      'Cを表示', '10')
  })
  it('繰り返し文([繰り返す]あり)', async () => {
    await cmp('!DNCL2\n' +
      'C=0\n' +
      'Iを1から10まで1ずつ増やしながら繰り返す:\n' +
      '　　C=C+I\n' +
      'Cを表示', '55')
    await cmp('!DNCL2\n' +
      'C=10\n' +
      'Iを1から10まで1ずつ減らしながら繰り返す:\n' +
      '　　C=C-1\n' +
      'Cを表示', '10')
    await cmp('!DNCL2\n' +
      'C=0\n' +
      'm を 1 から 3 まで 1 ずつ増やしながら繰り返す:\n' +
      '　　C=C+1\n' +
      'Cを表示', '3')
  })
  it('もし文', async () => {
    await cmp('!DNCL2\n' +
      'C=0\n' +
      'もし、C != 1ならば:\n' +
      '　　「OK」を表示。\n' +
      'そうでなければ:\n' +
      '　　「NG」を表示。\n' +
      '', 'OK')
    await cmp('' +
      '!DNCL2\n' +
      'C=2\n' +
      'もし、C == 1ならば:\n' +
      '　　「NG」を表示。\n' +
      'そうでなければ、もし、C==2ならば:\n' +
      '　　「OK」を表示。\n' +
      'そうでなければ、もし、C==3ならば:\n' +
      '　　「NG」を表示。\n' +
      '', 'OK')
    await cmp('!DNCL2\n' +
      'C=1\n' +
      'もし、C=0ならば:\n' +
      '　　「C0」を表示。\n' +
      'そうでなくもし、C=1ならば:\n' +
      '　　「C1」を表示。\n' +
      'そうでなくもし、C=2ならば:\n' +
      '　　「C2」を表示。\n' +
      '', 'C1')
  })
  it('もし文(ネスト)', async () => {
    await cmp('!DNCL2\n' +
      'A=1;B=1\n' +
      'もし、A == 1ならば:\n' +
      '　　もし、B==1ならば:\n' +
      '　　　　「11」と表示\n' +
      '　　そうでなければ:\n' +
      '　　　　「NG」を表示。\n' +
      'そうでなければ:\n' +
      '　　「NG」を表示\n' +
      '', '11')
    await cmp('!DNCL2\n' +
      'A=1;B=0\n' +
      'もし、A == 1ならば:\n' +
      '　　もし、B==1ならば:\n' +
      '　　　　「11」と表示\n' +
      '　　そうでなければ:\n' +
      '　　　　「OK」を表示。\n' +
      'そうでなければ:\n' +
      '　　「A!=1」を表示\n' +
      '', 'OK')
  })
  it('繰り返し文(ネスト)', async () => {
    await cmp('!DNCL2\n' +
      'C=""\n' +
      'Iを0から4まで1ずつ増やしながら繰り返す:\n' +
      '　　もし、I%2 == 0ならば:\n' +
      '　　　　C = C & I\n' +
      'Cを表示;', '024')
    //
    await cmp('!DNCL2\n' +
      'C=""\n' +
      'Yを0から1まで1ずつ増やしながら繰り返す:\n' +
      '　　Xを0から1まで1ずつ増やしながら繰り返す:\n' +
      '　　　　C=C&"Y{Y}X{X}"\n' +
      'Cを表示;', 'Y0X0Y0X1Y1X0Y1X1')
  })
  it('記号でインデント', async () => {
    await cmp('!DNCL2\n' +
      'C=0\n' +
      'もし、C != 1ならば:\n' +
      '⎿「OK」を表示。\n' +
      'そうでなければ:\n' +
      '⎿「NG」を表示。\n', 'OK')
    await cmp('!DNCL2\n' +
      'C=2\n' +
      'もし、C == 1ならば:\n' +
      '│└「NG」を表示。\n' +
      'そうでなければ、もし、C==2ならば:\n' +
      '│└「OK」を表示。\n' +
      'そうでなければ、もし、C==3ならば:\n' +
      '│└「NG」を表示。\n' +
      '', 'OK')
  })
  it('記号でインデント2', async () => {
    await cmp('!DNCL2\n' +
      'C=0\n' +
      'もし、C != 1ならば:\n' +
      '｜ 「OK」を表示。\n' +
      'そうでなければ:\n' +
      '｜ 「NG」を表示。\n' +
      '', 'OK')
    await cmp('!DNCL2\n' +
      'C=2\n' +
      'もし、C == 1ならば:\n' +
      '⎿ 「NG」を表示。\n' +
      'そうでなければ、もし、C==2ならば:\n' +
      '⎿ 「OK」を表示。\n' +
      'そうでなければ、もし、C==3ならば:\n' +
      '⎿ 「NG」を表示。\n' +
      '', 'OK')
  })
  it('配列の初期化', async () => {
    await cmp('!DNCL2\n' +
      '配列 Hindo のすべての要素に 10 を代入する\n' +
      'Hindo[0]を表示\n', '10')
    await cmp('!DNCL2\n' +
      '配列変数 Hirabun を初期化する\n' +
      'Hirabun[3]を表示\n', '0')
    await cmp('!DNCL2\n' +
      'Totuzen[3]=30\n' +
      'Totuzen[3]を表示\n', '30')
    await cmp('!DNCL2\n' +
      '配列 Hindo のすべての値に 55 を代入\n' +
      'Hindo[0]を表示\n', '55')
  })
  it('「情報」試作問題 (検討用イメージ)', async () => {
    await cmp(
      '!DNCL2\n' +
      'Angoubun = ["a","b"," ","a"]\n' +
      '配列 Hindo のすべての要素に 0 を代入する\n' +
      'i を 0 から (要素数(Angoubun)-1) まで 1 ずつ増やしながら:\n' +
      '　　bangou = 差分( Angoubun[i] )\n' +
      '　　もし,bangou != -1ならば:\n' +
      '　　　　Hindo[bangou] = Hindo[bangou] + 1\n' +
      'Hindoの0から3を配列取り出して、Hindoに代入。\n' +
      '表示する(Hindo)\n' +
      '●差分(CH)とは：\n' +
      '　　A=ASC("a"); Z=ASC("z"); C=ASC(CH)\n' +
      '　　もし、(A<=C)かつ(C<=Z)ならば、(C-A)を戻す。\n' +
      '　　それは-1\n' +
      '\n', '2,1,0')
  })
  it('「情報」サンプル問題-当選数を決めるプログラム2', async () => {
    await cmp(`
!DNCL2
Tomei = ["Ａ党", "Ｂ党", "Ｃ党", "Ｄ党"]
Tokuhyo = [1200, 660, 1440, 180]
sousuu = 0
giseki = 6
m を 0 から 3 まで 1 ずつ増やしながら繰り返す:
⎿ sousuu = sousuu + Tokuhyo[m]
kizyunsuu = sousuu / giseki
m を 0 から 3 まで 1 ずつ増やしながら繰り返す:
⎿ 表示する(Tomei[m], "：", Tokuhyo[m] / kizyunsuu)
    `, 'Ａ党：2.0689655172413794\nＢ党：1.1379310344827587\nＣ党：2.4827586206896552\nＤ党：0.3103448275862069')
  })
  it('「情報」サンプル問題-当選数を決めるプログラム2改', async () => {
    await cmp('' +
      '!DNCL2\n' +
      'Tomei = ["Ａ党", "Ｂ党", "Ｃ党", "Ｄ党"]\n' +
      'Tokuhyo = [1200, 660, 1440, 180]\n' +
      'Koho = [5, 4, 2, 3]\n' +
      'Tosen = [0, 0, 0, 0]\n' +
      'tosenkei = 0\n' +
      'giseki = 6\n' +
      'm を 0 から 3 まで 1 ずつ増やしながら繰り返す:\n' +
      '⎿ Hikaku[m] = Tokuhyo[m]\n' +
      'tosenkei < giseki の間繰り返す:\n' +
      '｜ max = 0\n' +
      '｜ i を 0 から 3 まで 1 ずつ増やしながら繰り返す:\n' +
      '｜ ｜ もし max < Hikaku[i] and Koho[i] >= Tosen[i] + 1 ならば:\n' +
      '｜ ｜ ｜ max = Hikaku[i]\n' +
      '｜ ⎿ ⎿ maxi = i\n' +
      '｜ Tosen[maxi] = Tosen[maxi] + 1\n' +
      '｜ tosenkei = tosenkei + 1\n' +
      '⎿ Hikaku[maxi] = 切り捨て(Tokuhyo[maxi] / tosenkei)\n' +
      'k を 0 から 3 まで 1 ずつ増やしながら繰り返す:\n' +
      '⎿ 表示する(Tomei[k], "：", Tosen[k], "名")\n' +
      '', 'Ａ党：3名\nＢ党：1名\nＣ党：2名\nＤ党：0名')
  })
  it('and/or/not', async () => {
    const TRUE = 'true'
    const FALSE = 'false'
    await cmp('' +
      '!DNCL2\n' +
      '(not 真)を表示' +
      '\n', FALSE)
    await cmp('' +
      '!DNCL2\n' +
      '(true and true)を表示' +
      '\n', TRUE)
    await cmp('' +
      '!DNCL2\n' +
      '(true and false)を表示' +
      '\n', FALSE)
    await cmp('' +
      '!DNCL2\n' +
      '(true or false)を表示' +
      '\n', TRUE)
    await cmp('' +
      '!DNCL2\n' +
      '(false or false)を表示' +
      '\n', FALSE)
  })
  it('演算子「**」(#1424)', async () => {
    await cmp('' +
      '!DNCL2\n' +
      '2**3を表示;' +
      '', '8')
  })
  it('関数・・・定義する (core #145)', async () => {
    await cmp(`
!DNCL2
関数の点数評価（tensu）を
  もし tensu >=85 ならば:
    表示する（"勝って兜の緒を締めよ"）
  そうでなく、もし 85 > tensu and tensu >65ならば:
    表示する（"ドンマイ：気持ちを切り替えよう。"）
  そうでなければ：
    表示する（"自分のこれからと真剣に向き合おう"）
と定義する
tensu = 60
点数評価（tensu）
    `, '自分のこれからと真剣に向き合おう')
    await cmp(`
!DNCL2
関数の点数評価（tensu）を
  もし tensu >=85 ならば:
    表示する（"勝って兜の緒を締めよ"）
  そうでなく、もし 85 > tensu and tensu >65ならば:
    表示する（"ドンマイ：気持ちを切り替えよう。"）
  そうでなければ：
    表示する（"自分のこれからと真剣に向き合おう"）
と定義する
tensu = 80
点数評価（tensu）
    `, 'ドンマイ：気持ちを切り替えよう。')
  })
})
