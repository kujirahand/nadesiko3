/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import { dnclEnsureArray } from '../src/nako_dncl_ensure_array.mjs'

describe('dncl (#1140)', async () => {
  const cmpNako = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    const g = await nako.runAsync(code)
    assert.strictEqual(g.log, res)
  }

  it('代入文', async () => {
    await cmpNako('!DNCLモード\n' +
            'A←3\nAを表示', '3')
    await cmpNako('!DNCLモード\n' +
            'A←3, B←5\nAを表示\nBを表示', '3\n5')
  })
  it('もし文', async () => {
    await cmpNako('!DNCLモード\n' +
            'A←5\nもしA=5ならば\n「OK」と表示\nを実行する', 'OK')
  })
  // 実行テスト
  it('簡単な実行テスト', async () => {
    await cmpNako('!DNCLモード\nA←5,B←6,C←7。Cを表示する', '7')
    await cmpNako('!DNCLモード\nA=[]。A[1]=3;A[2]=3;Aの要素数を表示する', '2')
  })
  it('配列の入れ替え', async () => {
    await cmpNako('!DNCLモード\nA={{11,12,13},{21,22,23}}。A[1,2]を表示する', '21')
    await cmpNako('!DNCLモード\nA={}。A[1]={11,12,13}, A[2]={21,22,23};A[2,1]を表示する', '12')
    await cmpNako('!DNCLモード\nA={{11,12,13},{21,22,23}}。B=A[3,2];Bを表示する', '23')
    await cmpNako('!DNCLモード\nA={{11,12,13},{21,22,23}}。C=2;AA=A[1+C,1];AAを表示', '13')
    await cmpNako('!DNCLモード\nA={{11,12,13},{21,22,23}}。X=2;Y=1;AA=A[X,Y+1];AAを表示', '22')
  })
  it('配列の自動初期化(#1143)', async () => {
    await cmpNako('!DNCLモード\nA[1]←111。A[1]を表示する', '111')
    await cmpNako('!DNCLモード\nA[3,3]=3;A[3,3]を表示する', '3')
    await cmpNako('!DNCLモード\nA[3,2,1]=30;A[3,2,1]を表示する', '30')
    await cmpNako('!DNCLモード\nA[1,1]=11,A[1,2]=12;A[1,2]を表示する', '12')
    // 多次元アクセスで中間要素がスカラーの場合は既定配列で置き換える
    // (DNCL仕様として意図的に配列化する。読み取り側でも書き込み側と
    //  同じくオブジェクト以外は初期化対象)
    await cmpNako('!DNCLモード\nA[1]←5。A[1,2]を表示する', '0')
    // 関数内からグローバル変数への配列代入 (初期化も代入と同じスコープに行う)
    await cmpNako(
      '!DNCLモード\n' +
      'A←5\n' +
      '●Fとは\n' +
      'A[1]←7\n' +
      'ここまで\n' +
      'F()\n' +
      'A[1]を表示', '7')
    // スカラー値を保持する変数への増減は代入と同じく配列化してから行う
    await cmpNako('!DNCLモード\nD←5\nD[1]を1増やす\nD[1]を表示', '1')
    // 文字列を保持する変数への読み取りは文字列のまま (初期化しない)
    await cmpNako('!DNCLモード\nA←「あいう」\nA[2]を表示\nAを表示', 'い\nあいう')
    // PI等のシステム定数と同名の変数への添字代入は自動初期化しない (定数を保護)
    await cmpNako('!DNCLモード\nPI[1] ← 5\nPIを表示', String(Math.PI))
  })
  it('インデントを｜で表現する', async () => {
    await cmpNako('!DNCLモード\nA=3;もしA>1ならば\n｜A←A+1\nを実行する。\nAを表示する。', '4')
  })
  it('表示エミュレート', async () => {
    await cmpNako('!DNCLモード\nx←10,y←20\nxと"-"とyを表示する。', '10-20')
    await cmpNako('!DNCLモード\nx←10,y←20\n"("とxと","とyと")"を表示する。', '(10,20)')
    await cmpNako('!DNCLモード\nx←10,y←20,z←30\n"("とxと","とyと","とzと")"を表示する。', '(10,20,30)')
    await cmpNako('!DNCLモード\nx←10,y←20\n「<」とxと","とyと「>」を表示する。', '<10,20>')
    // #1079
    await cmpNako('!DNCLモード\nx←10,y←20\n「<」 と x と "," と y と 「>」 を 表示する。', '<10,20>')
  })
  it('乱数エミュレート #1146', async () => {
    await cmpNako('!DNCLモード\nr ← 乱数 (5，10)\nもし(rが5以上)かつ(rが10以下)ならば「OK」と表示する。', 'OK')
    await cmpNako('!DNCLモード\nr ← 乱数 (1，6)\nもし(rが1以上)かつ(rが6以下)ならば「OK」と表示する。', 'OK')
  })
  it('二進 #1146', async () => {
    await cmpNako('!DNCLモード\nA← 二進 (9)\nAを表示する。', '1001')
    await cmpNako('!DNCLモード\nA← 二進 (255)\nAを表示する。', '11111111')
    await cmpNako('!DNCLモード\n二進で表示 (255)', '11111111')
  })
  it('減らす・増やす #1149', async () => {
    await cmpNako('!DNCLモード\nsaihu←1000。syuppi←500。saihuをsyuppi減らす。saihuを表示する。', '500')
    await cmpNako('!DNCLモード\nsaihu←1000。syuppi←500。saihuをsyuppi増やす。saihuを表示する。', '1500')
  })
  it('DNCLで「もし」文の否定形が動かない #1148', async () => {
    await cmpNako('!DNCLモード\nkosu←1\nもし、kosu>27でないならば\n|「OK」を表示する。\nを実行する。\n', 'OK')
  })
  it('DNCLで後判定のループが動かない #1147', async () => {
    await cmpNako('!DNCLモード\nA←1\n繰り返し，\nAを表示する\nAを1増やす\nを，A>3になるまで実行する\n', '1\n2\n3')
    await cmpNako('!DNCLモード\nA←1\n繰り返し，\nAを表示する\nAを1だけ増やす\nを，A>3になるまで実行する\n', '1\n2\n3')
  })
  it('DNCLで÷は整数の割り算 #1152', async () => {
    await cmpNako('!DNCLモード\n7/2を表示する', '3.5')
    await cmpNako('!DNCLモード\n7÷2を表示する', '3')
  })
  it('「!」を💡で書けるようにする #1184', async () => {
    await cmpNako('💡DNCLモード\n7/2を表示する', '3.5')
    await cmpNako('💡DNCLモード\n7÷2を表示する', '3')
  })
  it('DNCL - を実行し,そうでなければ', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←3\nもし、x≧2ならば\n' +
      '|  「ok」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|  「ng」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - を実行し,そうでなくもし', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←3\nもし、x≧5ならば\n' +
      '|  「ng1」と表示\n' +
      'を実行し,そうでなくもし,x>1ならば\n' +
      '|  「ok」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|  「ng2」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - を実行し,そうでなくもし - の後にカンマがないときも動くように', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←3\nもし、x≧5ならば\n' +
      '|  「ng1」と表示\n' +
      'を実行し,そうでなくもしx>1ならば\n' +
      '|  「ok」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|  「ng2」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - でないならば', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←3\nもし、x=1でないならば\n' +
      '|  「ok」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|  「ng」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - 増やしながら', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'A←0\nIを1から10まで1ずつ増やしながら\n' +
      '|  A←A+I\n' +
      'を実行する。\n' +
      'Aを表示する', '55')
  })
  it('DNCL - 減らしながら', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'A←10\nIを2から1まで1ずつ減らしながら\n' +
      '|  A←A-I\n' +
      'を実行する。\n' +
      'Aを表示する', '7')
  })
  it('DNCL - 増やす、減らす', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'A←3\n' +
      'Aを3増やす\n' +
      'Aを表示する', '6')
    await cmpNako(
      '!DNCLモード\n' +
      'A←3\n' +
      'Aを3減らす\n' +
      'Aを表示する', '0')
  })
  it('DNCL - 増やしながら', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'A←0\nIを1から10まで1ずつ増やしながら\n' +
      '|  A←A+I\n' +
      'を繰り返す。\n' +
      'Aを表示する', '55')
  })
  it('DNCL - すべての要素を0にする', async () => {
    // 'のすべての値を0にする'
    // 'のすべての要素を0にする'
    // 'のすべての要素に0を代入する'
    await cmpNako(
      '!DNCLモード\n' +
      'Aのすべての値を0にする\n' +
      'A{1}を表示\n' +
      'A{2}を表示\n' +
      '', '0\n0')
    await cmpNako(
      '!DNCLモード\n' +
      'Aのすべての要素を3にする\n' +
      'A{1}を表示\n' +
      'A{2}を表示\n' +
      '', '3\n3')
    await cmpNako(
      '!DNCLモード\n' +
      'Aのすべての要素を0に代入\n' +
      'A{1}を表示\n' +
      'A{2}を表示\n' +
      '', '0\n0')
  })
  it('DNCL - 「全て」の要素・値 #1140', async () => {
    // 'の全ての要素を0にする'
    // 'の全ての値を0にする'
    await cmpNako(
      '!DNCLモード\n' +
      'Aの全ての要素を0にする\n' +
      'A{1}を表示\n' +
      'A{2}を表示\n' +
      '', '0\n0')
    await cmpNako(
      '!DNCLモード\n' +
      'Aの全ての値を3にする\n' +
      'A{1}を表示\n' +
      'A{2}を表示\n' +
      '', '3\n3')
  })
  it('DNCL - 初期化していない配列の読み取り #1140', async () => {
    // 1次元
    await cmpNako('!DNCLモード\nA[2]を表示', '0')
    // 多次元
    await cmpNako('!DNCLモード\nA[2,3]を表示', '0')
    await cmpNako('!DNCLモード\nA[2,3,4]を表示', '0')
    // 式の中や条件の中で使う場合
    await cmpNako('!DNCLモード\nx←A[1]+A[2]\nxを表示', '0')
    await cmpNako('!DNCLモード\nもしA[1]=0ならば\n|「ok」と表示\nを実行する', 'ok')
    // 読み取りで初期化された配列へその後書き込めること
    await cmpNako('!DNCLモード\nB←A[2]\nA[1]←5\nA[1]を表示', '5')
  })
  it('DNCL - 初期化していない配列の要素を増減する #1140', async () => {
    await cmpNako('!DNCLモード\nA[1]を1増やす\nA[1]を表示', '1')
    await cmpNako('!DNCLモード\nA[1]を2減らす\nA[1]を表示', '-2')
    // 多次元配列の途中要素も自動初期化されること
    await cmpNako('!DNCLモード\nA[2,3]を5増やす\nA[2,3]を表示', '5')
  })
  it('DNCL - 「でない」の条件 #1140', async () => {
    // (条件)でないの間
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nx=3でないの間，\n' +
      '|xを1増やす\n' +
      'を繰り返す\n' +
      'xを表示', '3')
    // (条件)でないになるまで
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\n繰り返し，\n' +
      '|xを1増やす\n' +
      'を，x=3でないになるまで実行する\n' +
      'xを表示', '2')
    // 複合条件の中の「でない」
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nもしx=2でないかつx=1ならば\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
    await cmpNako(
      '!DNCLモード\n' +
      'A←1\nB←2\nもしAがBでないならば\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - を実行し、そうでなければ(同じ行に処理が続く) #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nもしx≧2ならば\n' +
      '|「ng」と表示\n' +
      'を実行し、そうでなければ「ok」と表示\n' +
      'を実行する', 'ok')
    // 「を実行しそうでなければ」(「そう」が「を実行」に取り込まれる形)
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nもしx≧2ならば\n' +
      '|「ng」と表示\n' +
      'を実行しそうでなければ\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - もしの条件が次の行に続く #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←3\nもし、\n' +
      '|x=3ならば\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - 増やしながら/減らしながらを「を繰り返す」で閉じる #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'iを1から3まで1ずつ増やしながら，\n' +
      '|iを表示\n' +
      'を繰り返す', '1\n2\n3')
    await cmpNako(
      '!DNCLモード\n' +
      'iを3から1まで1ずつ減らしながら，\n' +
      '|iを表示\n' +
      'を繰り返す', '3\n2\n1')
  })
  it('DNCL - 「の間」を「を繰り返す」で閉じる #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nx<3の間，\n' +
      '|xを1増やす\n' +
      'を繰り返す\n' +
      'xを表示', '3')
  })
  it('DNCL - ファイル末尾に改行がなくても動く #1140', async () => {
    await cmpNako('!DNCLモード\nx←1\nxを表示', '1')
    await cmpNako(
      '!DNCLモード\n' +
      'iを1から3まで1ずつ増やしながら，\n' +
      '|iを表示\n' +
      'を繰り返す', '1\n2\n3')
  })
  it('DNCL - 「を実行する」がブロック終端以外で誤変換されない #1140', async () => {
    // 関数呼び出し「Fを実行する」を「ここまで」に変換しない
    // (関数名の文字列を代入し、「実行(F)」で実際に呼ばれることを検証する)
    await cmpNako(
      '!DNCLモード\n' +
      '●テスト\n' +
      '「F呼出」と表示\n' +
      'ここまで\n' +
      'F←「テスト」\n' +
      'Fを実行する', 'F呼出')
    // 単文の「もし〜ならば(処理)を実行する」では「ここまで」を挿入しない
    await cmpNako(
      '!DNCLモード\n' +
      'x←3\nもしx>1ならば「ok」と表示を実行する', 'ok')
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\nもしx>1ならば「ng」と表示を実行する\n' +
      '「end」と表示', 'end')
  })
  it('DNCL - 「AがBでない」は等しくない条件になる #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'A←2\nB←0\n' +
      'AがBでないの間，\n' +
      '|Bを1増やす\n' +
      'を繰り返す\n' +
      'Bを表示', '2')
    // 「Aが3以上でない」のような比較を含む否定はこれまで通り全体を否定する
    await cmpNako(
      '!DNCLモード\n' +
      'A←2\nもしAが3以上でないならば\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - 複合条件の中の「でない」は直前の項だけを否定する #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'A←1\nB←2\nもしA=1でないかつB=2でないならば\n' +
      '|「BUG」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
    await cmpNako(
      '!DNCLモード\n' +
      'A←2\nB←1\nもしA=1でないまたはB=1でないならば\n' +
      '|「ok」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|「BUG」と表示\n' +
      'を実行する', 'ok')
    await cmpNako(
      '!DNCLモード\n' +
      'A←1\nB←1\n' +
      'A=2でないかつB=2でないの間，\n' +
      '|Aを1増やす\n' +
      '|Bを1増やす\n' +
      'を繰り返す\n' +
      'Bを表示', '2')
  })
  it('DNCL - 「を，条件になるまで」の区切りが助詞に取り込まれた形 #1140', async () => {
    // 「増やすを，A>3になるまで」のように「を，」が語句に取り込まれた形でも
    // 処理と条件の区切りとして認識する
    await cmpNako(
      '!DNCLモード\n' +
      'A←1\n繰り返し，\n' +
      '|Aを表示\n' +
      '|Aを1増やすを，A>3になるまで実行する', '1\n2\n3')
  })
  it('DNCL - 「の間」に同じ行で処理が続く #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nx<3の間，xを1増やすを繰り返す\n' +
      'xを表示', '3')
    await cmpNako(
      '!DNCLモード\n' +
      'A←0\nIを1から3まで1ずつ増やしながら，A←A+Iを繰り返す\n' +
      'Aを表示', '6')
  })
  it('DNCL - 「そうでなく」のあとに「もし」がない形 #1140', async () => {
    // 「そうでなく、もし」のように「なく」と「もし」の間にカンマがある形
    await cmpNako(
      '!DNCLモード\n' +
      'x←3\nもしx≧5ならば\n' +
      '|「ng1」と表示\n' +
      'を実行し、そうでなく、もしx>1ならば\n' +
      '|「ok」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|「ng2」と表示\n' +
      'を実行する', 'ok')
    // 「そうでなく」のあとに「もし」がない形
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nもしx>5ならば\n' +
      '|「ng」と表示\n' +
      'を実行し、そうでなく\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - 括弧を含む式の「でない」 #1140', async () => {
    // 括弧の中の「かつ」「または」やカンマは式の区切りにしない
    await cmpNako(
      '!DNCLモード\n' +
      'A←0\nB←2\nx←(A=1かつB=2)でない\n' +
      'xを表示', 'true')
    await cmpNako(
      '!DNCLモード\n' +
      'A←0\nB←2\nもし(A=1かつB=2)でないならば\n' +
      '|「not」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|「yes」と表示\n' +
      'を実行する', 'not')
  })
  it('DNCL - 「を ,」のように助詞とカンマの間に空白がある区切り #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'A←1\n繰り返し，\n' +
      '|Aを表示\n' +
      '|Aを1増やすを , A>3になるまで実行する', '1\n2\n3')
  })
  it('DNCL - 「繰り返し」に同じ行で処理が続く #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\n繰り返し，xを1増やすを，x>3になるまで実行する\n' +
      'xを表示', '4')
  })
  it('DNCL - 「を実行し、」で終わる行の次行が「そうでなければ」 #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nもしx>5ならば\n' +
      '|「ng」と表示\n' +
      'を実行し、\n' +
      'そうでなければ\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - 括弧・配列を含む式の「でない」の範囲 #1140', async () => {
    // 括弧や添字の内側の「かつ」「または」やカンマは式の区切りにしない
    await cmpNako(
      '!DNCLモード\n' +
      'A[1]←0\nx←(A[1]=0)でない\n' +
      'xを表示', 'false')
    // グルーピング括弧内の「が」も「≠」に変換される (「Aが0でない」は「A≠0」の意)
    await cmpNako(
      '!DNCLモード\n' +
      'A←0\nx←(Aが0)でない\n' +
      'xを表示', 'false')
    // 「が」の後が式の場合も「A≠(式)」の意になる
    await cmpNako(
      '!DNCLモード\n' +
      'A←5\nB←0\nx←AがB+1でない\n' +
      'xを表示', 'true')
    // 閉じ括弧や添字・関数呼出に「が」が取り込まれる形 (「(式)が値でない」)
    await cmpNako(
      '!DNCLモード\n' +
      'x←(1+2)が5でない\n' +
      'xを表示', 'true')
    await cmpNako(
      '!DNCLモード\n' +
      'A[1]←1\nx←A[1]が2でない\n' +
      'xを表示', 'true')
    // 「A[i]が0でないの間」が無限ループにならないこと
    await cmpNako(
      '!DNCLモード\n' +
      'A[1]←2\nA[2]←0\ni←1\n' +
      'A[i]が0でないの間，\n' +
      '|iを1増やす\n' +
      'を繰り返す\n' +
      'iを表示', '2')
    // 引数を取るユーザー定義述語の否定 (「xがyを同値でない」)
    await cmpNako(
      '!DNCLモード\n' +
      '●(AがBを)同値\n' +
      'もしA=Bならば\n' +
      '|それは1\n' +
      'ここまで\n' +
      'それは0\n' +
      'ここまで\n' +
      'x←1\ny←2\nz←xがyを同値でない\n' +
      'zを表示', 'true')
    // 複合条件の末尾にある引数を取る述語の否定は直前の項だけに及ぶ
    // (「P=0かつxがyを同値でないならば」→「P=0かつ!(同値(x,y))」)
    await cmpNako(
      '!DNCLモード\n' +
      '●(AがBを)同値\n' +
      'もしA=Bならば\n' +
      '|それは1\n' +
      'ここまで\n' +
      'それは0\n' +
      'ここまで\n' +
      'P←1\nx←2\ny←3\n' +
      'もしP=0かつxがyを同値でないならば\n' +
      '|「F」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
    // 主語が添字・括弧・関数呼出の場合の引数述語の否定
    await cmpNako(
      '!DNCLモード\n' +
      '●(AがBを)同値\n' +
      'もしA=Bならば\n' +
      '|それは1\n' +
      'ここまで\n' +
      'それは0\n' +
      'ここまで\n' +
      'A[1]←1\nx←2\nz←A[1]がxを同値でない\n' +
      'zを表示', 'true')
    // 「Aがそうでなければ」は「そう」が被比較対象の値 (elseへの変換をしない)
    await cmpNako(
      '!DNCLモード\n' +
      'A←0\n' +
      'もしAがそうでなければ\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
    // 「は」主語の「Aはそうでなければ」も同様
    await cmpNako(
      '!DNCLモード\n' +
      'A←0\n' +
      'もしAはそうでなければ\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
    // 「AがB以上でない」のような比較句は式全体の否定
    await cmpNako(
      '!DNCLモード\n' +
      'A←1\nB←2\nもしAがB以上でないならば\n' +
      '|「ok」と表示\n' +
      'を実行する', 'ok')
  })
  it('DNCL - 「の間」とインラインの「ならば」が同居する行の「を実行する」 #1140', async () => {
    // 繰り返し開始が先にある行末の「を実行する」は繰り返しの終端
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nx<3の間，もしx>0ならばxを1増やすを実行する\n' +
      'xを表示', '3')
  })
  it('DNCL - オブジェクト要素を持つ配列へのアクセス #1140', async () => {
    // 中間要素がオブジェクトの場合は既定配列で上書きしない
    await cmpNako(
      '!DNCLモード\n' +
      'O=空オブジェクト\nO$n=5\nA=[O]\n' +
      'A[1]$nを表示', '5')
    await cmpNako(
      '!DNCLモード\n' +
      'O=空オブジェクト\nO$n=5\nA=[O]\n' +
      'A[1]$nを1増やす\n' +
      'A[1]$nを表示', '6')
  })
  it('DNCL - 「を実行し、」と「そうでなければ」の間にコメント行や空行がある #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\nもしx=1ならば\n' +
      '|「a」と表示\n' +
      'を実行し、\n' +
      '#コメント\n' +
      'そうでなければ\n' +
      '|「b」と表示\n' +
      'を実行する', 'a')
    await cmpNako(
      '!DNCLモード\n' +
      'x←9\nもしx=1ならば\n' +
      '|「a」と表示\n' +
      'を実行し、\n' +
      '\n' +
      'そうでなければ\n' +
      '|「b」と表示\n' +
      'を実行する', 'b')
    // 「そうでなく」の行末コメントと次行の「もし」の間にコメントが残る場合
    // (コメントを間に残すと後段でeolに変換され「違えば→もし」のelse ifが崩れるため
    //  コメントは行末へ移す)
    await cmpNako(
      '!DNCLモード\n' +
      'x←2\nもしx>5ならば\n' +
      '|「a」と表示\n' +
      'を実行し、そうでなく # 次の条件\n' +
      'もしx=2ならば\n' +
      '|「b」と表示\n' +
      'を実行する', 'b')
    // 「そうでなく(条件)でなければ」は else if not (否定条件のelse if)
    const elseIfNot = (/** @type {number} */ x, /** @type {string} */ res) => cmpNako(
      '!DNCLモード\n' +
      `x←${x}\nもしx=1ならば\n` +
      '|「a」と表示\n' +
      'を実行し、そうでなくx=2でなければ\n' +
      '|「b」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|「c」と表示\n' +
      'を実行する', res)
    await elseIfNot(1, 'a')
    await elseIfNot(2, 'c')
    await elseIfNot(3, 'b')
    // else if の条件のあとに同行で処理が続く場合もブロック形式へ変換する
    // (「違えば、もし(条件)ならば」はブロック形式必須のため条件終端の直後に改行を挿入)
    const elseIfInline = (/** @type {number} */ x, /** @type {string} */ res) => cmpNako(
      '!DNCLモード\n' +
      `x←${x}\nもしx=1ならば\n` +
      '|「a」と表示\n' +
      'を実行し、そうでなくx=2でなければ「b」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|「c」と表示\n' +
      'を実行する', res)
    await elseIfInline(1, 'a')
    await elseIfInline(2, 'c')
    await elseIfInline(3, 'b')
    await cmpNako(
      '!DNCLモード\n' +
      'x←2\nもしx=1ならば\n' +
      '|「a」と表示\n' +
      'を実行し、そうでなくx=2ならば「b」と表示\n' +
      'を実行する', 'b')
    await cmpNako(
      '!DNCLモード\n' +
      'x←2\nもしx=1ならば\n' +
      '|「a」と表示\n' +
      'を実行し、そうでなくもしx=2ならば「b」と表示\n' +
      'を実行する', 'b')
    // else if の処理と「を実行する」が同一行にある場合
    // (ブロック形式化した「もし」は終端を「ここまで」へ変換する必要がある)
    await cmpNako(
      '!DNCLモード\n' +
      'x←2\nもしx=1ならば「a」と表示を実行し、そうでなくx=2ならば「b」と表示を実行する', 'b')
    await cmpNako(
      '!DNCLモード\n' +
      'x←9\nもしx=1ならば「a」と表示を実行し、そうでなくx=2ならば「b」と表示を実行し、そうでなければ「c」と表示を実行する', 'c')
  })
  it('DNCL - 「ならばFを実行する」(処理部が関数呼出) #1140', async () => {
    // 処理部が単独の語の場合は関数呼び出し「実行(F)」のまま残す
    // (関数名の文字列を代入し、「実行(F)」で実際に呼ばれることを検証する)
    await cmpNako(
      '!DNCLモード\n' +
      '●テスト\n' +
      '「F呼出」と表示\n' +
      'ここまで\n' +
      'x←1\n' +
      'F←「テスト」\n' +
      'もしx=1ならばFを実行する', 'F呼出')
    // 「でなければ」の処理部が単独の語の場合も同様
    await cmpNako(
      '!DNCLモード\n' +
      '●テスト\n' +
      '「F呼出」と表示\n' +
      'ここまで\n' +
      'x←1\n' +
      'F←「テスト」\n' +
      'もしx=2でなければFを実行する', 'F呼出')
  })
  it('DNCL - 「!厳しくチェック」併用時は自動初期化する配列参照で警告が出ない #1140', async () => {
    const nako = new NakoCompiler()
    const warns = []
    nako.logger.addListener('warn', (d) => { if (d.level === 'warn') { warns.push(d.noColor) } })
    const g = await nako.runAsync(
      '!厳しくチェック\n!DNCLモード\n' +
      'A[1]を表示\n' +
      'A[2]←9', 'main.nako3')
    assert.strictEqual(g.log, '0')
    assert.strictEqual(warns.length, 0)
    // 無関係な未定義変数では引き続き警告が出ること
    const nako2 = new NakoCompiler()
    const warns2 = []
    nako2.logger.addListener('warn', (d) => { if (d.level === 'warn') { warns2.push(d.noColor) } })
    await nako2.runAsync('!厳しくチェック\n!DNCLモード\nXを表示', 'main.nako3')
    assert.ok(warns2.length >= 1)
  })
  it('DNCL - 「そうでなく(条件)ならば」で条件が単語1語でも「ならば」が残る #1140', async () => {
    // 「なくxならば」のように「ならば」が助詞として語に取り込まれる形
    await cmpNako(
      '!DNCLモード\n' +
      'x←2\n' +
      'もしx=1ならば\n' +
      '|「a」と表示\n' +
      'を実行し、そうでなくxならば\n' +
      '|「b」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|「c」と表示\n' +
      'を実行する', 'b')
    // 「そうでなくもしxならば」も同様
    await cmpNako(
      '!DNCLモード\n' +
      'x←2\n' +
      'もしx=1ならば\n' +
      '|「a」と表示\n' +
      'を実行し、そうでなくもしxならば\n' +
      '|「b」と表示\n' +
      'を実行し、そうでなければ\n' +
      '|「c」と表示\n' +
      'を実行する', 'b')
  })
  it('DNCL - 「を，」で終わる行と「になるまで実行する」が別行の後判定 #1140', async () => {
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      '繰り返し，\n' +
      '|xを1増やす\n' +
      'を，\n' +
      'x>3になるまで実行する\n' +
      'xを表示', '4')
    // 「増やすを，」のように「を，」が語句に取り込まれる形で終わる場合も同様
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      '繰り返し，\n' +
      '|xを1増やすを，\n' +
      'x>3になるまで実行する\n' +
      'xを表示', '4')
    // 「を ,」のように助詞とカンマの間に空白がある場合も同様
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      '繰り返し，\n' +
      '|xを1増やすを ,\n' +
      'x>3になるまで実行する\n' +
      'xを表示', '4')
    // 「を，」終端の行は次行の内容を見ずに連結する (mergeDNCLLines)。
    // 後判定ループでない行でもカンマは文の区切りとして残るため、
    // 連結されても意味は変わらない (誤連結の反例として固定)
    await cmpNako(
      '!DNCLモード\n' +
      '「あ」を，\n' +
      '「い」と連続表示', 'あい')
  })
  it('DNCL - 文字列を保持する変数への添字アクセスで上書きされない #1140', async () => {
    // 読み取り側の自動初期化は未定義の場合のみ行う
    await cmpNako('!DNCLモード\nA←「あいう」\nA[2]を表示\nAを表示', 'い\nあいう')
  })
  it('DNCL - 「!厳しくチェック」併用時は自動初期化する配列の増減で警告が出ない #1140', async () => {
    const nako = new NakoCompiler()
    const warns = []
    nako.logger.addListener('warn', (d) => { if (d.level === 'warn') { warns.push(d.noColor) } })
    const g = await nako.runAsync(
      '!厳しくチェック\n!DNCLモード\n' +
      'A[1]を1増やす\n' +
      'A[1]を表示', 'main.nako3')
    assert.strictEqual(g.log, '1')
    assert.strictEqual(warns.length, 0)
  })
  it('DNCL - 副作用のある添字式は一度だけ評価される #1140', async () => {
    // 多次元配列の中間添字式が初期化チェックと代入で再評価されないこと
    const nako = new NakoCompiler()
    const g = await nako.runAsync(
      '!DNCLモード\n' +
      'C←0\n' +
      '●F\n' +
      'Cを1増やす\n' +
      'それはC\n' +
      'ここまで\n' +
      'A[F(),F()]←9\n' +
      'A[2,1]を表示\n' +
      'Cを表示', 'main.nako3')
    // F()は添字ごとに1回だけ呼ばれる (なでしこの多次元配列は
    // A[i,j]→A[j-1][i-1] に対応するため A[2,1] が同じ要素を指す)
    assert.strictEqual(g.log, '9\n2')
  })
  it('DNCL - 既知の制限(曖昧な「を実行する」)を固定する #1140', async () => {
    // 「Fを実行する」(関数呼出)の次行が「そう」で始まる場合、
    // トークン上「実行し」「実行する」を区別できないためブロック終端+「そう」
    // として連結されエラーになる (nako_from_dncl.mts のコメント参照)
    const errNako = async (/** @type {string} */ code, /** @type {RegExp} */ pattern) => {
      const nako = new NakoCompiler()
      await assert.rejects(
        async () => { await nako.runAsync(code, 'main.nako3') },
        pattern)
    }
    await errNako(
      '!DNCLモード\n' +
      '●テスト\n「F呼出」と表示\nここまで\n' +
      'F←「テスト」\nFを実行する\n' +
      'そうでなければ「x」と表示', /単語『F』が解決していません/)
    // 「x<3の間，Fを実行するを繰り返す」のようにインラインループの
    // 処理部が「Fを実行する」関数呼出の場合、行末の「を繰り返す」のみが終端になる
    // (「x←0」は関数定義より先に書く。後に書くと関数内の「x」は
    //  関数ローカルに解決されてループが終わらない)
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      '●テストとは\nx←x+1\nここまで\n' +
      'F←「テスト」\n' +
      'x<3の間，Fを実行するを繰り返す\n' +
      'xを表示', '3')
    // 終端が「を実行する」の場合も同様
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      '●テストとは\nx←x+1\nここまで\n' +
      'F←「テスト」\n' +
      'x<3の間，Fを実行するを実行する\n' +
      'xを表示', '3')
    // 関数呼出と終端の間にカンマがある形 (「を」が語句に取り込まれる)
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      '●テストとは\nx←x+1\nここまで\n' +
      'F←「テスト」\n' +
      'x<3の間，Fを実行する，を繰り返す\n' +
      'xを表示', '3')
    // 後判定ループの処理部が関数呼出の場合
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      '●テストとは\nx←x+1\nここまで\n' +
      'F←「テスト」\n' +
      '繰り返し，Fを実行するを，\n' +
      'x>3になるまで実行する\n' +
      'xを表示', '4')
    // 入れ子: 「ならばFを実行する」の関数呼出・内側「ならば」の終端・
    // 外側ループの終端が同行に並ぶ場合、後方の終端は外側のブロックを閉じる
    // (「x←1」は関数定義より先に書く。後に書くと関数内の「x」は
    //  関数ローカルに解決されてループが終わらない)
    await cmpNako(
      '!DNCLモード\n' +
      'x←1\n' +
      '●テストとは\nx←x+1\nここまで\n' +
      'F←「テスト」\n' +
      'x<3の間，もしx>0ならばFを実行するを実行するを繰り返す\n' +
      'xを表示', '3')
    // 逆方向の入れ子: インライン「ならば」の処理部がループの場合、
    // 行末の終端は内側のループを閉じる (インライン「ならば」は終端不要)
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      'もしx=0ならばx<3の間，xを1増やすを繰り返す\n' +
      'xを表示', '3')
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      'もしx=0ならばx<3の間，xを1増やすを実行する\n' +
      'xを表示', '3')
    // ループ内のインラインif/else: 「を実行する」でelse部が閉じたあと
    // 「を繰り返す」がループを閉じる (終端が連続する形)
    await cmpNako(
      '!DNCLモード\n' +
      'x←0\n' +
      'x<5の間，もしx>2ならばxを1増やすを実行し、そうでなければxを2増やすを実行するを繰り返す\n' +
      'xを表示', '5')
  })
  it('DNCL - 中間要素の初期化は実行環境のヘルパー関数が担う #2545', async () => {
    // __dncl_ensure_array は生成コードから呼ばれる実行環境のヘルパー。
    // 多次元配列の中間要素を既定配列で初期化する (リファクタリングで
    // 生成コード内のIIFEから分離したもの)
    const nako = new NakoCompiler()
    const g = await nako.runAsync('!DNCLモード\nA[1,2]←30\nA[1,2]を表示', 'main.nako3')
    assert.strictEqual(g.log, '30')
    assert.strictEqual(typeof g.__dncl_ensure_array, 'function')
  })
  it('DNCL - __dncl_ensure_array は書き込み不可の要素への代入失敗で止まらない #2545', () => {
    // ESモジュールの関数は厳格モードで動くため、素の代入だと凍結要素への
    // 書き込みでTypeErrorを投げる。従来の非厳格IIFEと同じく例外を投げず
    // 既定配列を返すことをReflect.setで担保する。
    // 凍結配列の未定義要素: 代入は失敗するが既定配列が返る
    const frozen = Object.freeze([1, 2])
    const r1 = dnclEnsureArray(frozen, 5)
    assert.deepStrictEqual(r1, Array(30).fill(0))
    // setトラップで代入を拒否するProxyでも同様
    const deny = new Proxy([1], { set: () => false })
    const r2 = dnclEnsureArray(deny, 5)
    assert.deepStrictEqual(r2, Array(30).fill(0))
    // 通常の配列では要素が実際に既定配列で初期化される
    const arr = [1, 2]
    const r3 = dnclEnsureArray(arr, 5)
    assert.strictEqual(arr[5], r3)
    assert.deepStrictEqual(r3, Array(30).fill(0))
    // 既存のオブジェクト要素は上書きしない
    const obj = { a: 1 }
    assert.strictEqual(dnclEnsureArray([obj], 0), obj)
    // baseがオブジェクトでない場合はそのままの添字アクセス結果を返す
    assert.strictEqual(dnclEnsureArray('abc', 1), 'b')
  })
})
