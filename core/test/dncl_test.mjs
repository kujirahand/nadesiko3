/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

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
})
