const assert = require('assert')
const NakoDncl = require('../../src/nako_from_dncl')
const NakoCompiler = require('../../src/nako3')

describe('dncl (#1140)', () => {
    const cmp = (src, expected) => {
        src = NakoDncl.convert(src)
        src = src.replace(/\s+$/, '')
        expected = expected.replace(/\s+$/, '')
        assert.strictEqual(src, expected)
    }
    const nako = new NakoCompiler()
    const cmpNako = (code, res) => {
      nako.logger.debug('code=' + code)
      assert.strictEqual(nako.run(code).log, res)
    }
  
    it('代入文', () => {
        cmp('!DNCLモード\n'+
            'A←3\n',
            //---
            '!DNCLモード\n'+
            'A=3\n')
        cmp('!DNCLモード\n'+
            'A←3, B←5\n',
            //---
            '!DNCLモード\n'+
            'A=3, B=5\n')
    })
    it('もし文', () => {
        cmp('!DNCLモード\n'+
            'もしA=5ならば\n「OK」と表示\nを実行する',
            //---
            '!DNCLモード\n'+
            'もしA=5ならば\n「OK」と表示\nここまで')
    })
    // 実行テスト
    it('簡単な実行テスト', () => {
        cmpNako('!DNCLモード\nA←5,B←6,C←7。Cを表示する', '7')
        cmpNako('!DNCLモード\nA=[]。A[1]=3;A[2]=3;Aの要素数を表示する', '2')
    })
    it('配列の入れ替え', () => {
        cmpNako('!DNCLモード\nA={{11,12,13},{21,22,23}}。A[1,2]を表示する', '21')
        cmpNako('!DNCLモード\nA={}。A[1]={11,12,13}, A[2]={21,22,23};A[2,1]を表示する', '12')
        cmpNako('!DNCLモード\nA={{11,12,13},{21,22,23}}。B=A[3,2];Bを表示する', '23')
        cmpNako('!DNCLモード\nA={{11,12,13},{21,22,23}}。C=2;AA=A[1+C,1];AAを表示', '13')
        cmpNako('!DNCLモード\nA={{11,12,13},{21,22,23}}。X=2;Y=1;AA=A[X,Y+1];AAを表示', '22')
    })
    it('配列の自動初期化(#1143)', () => {
        cmpNako('!DNCLモード\nA[1]←111。A[1]を表示する', '111')
        cmpNako('!DNCLモード\nA[3,3]=3;A[3,3]を表示する', '3')
        cmpNako('!DNCLモード\nA[3,2,1]=30;A[3,2,1]を表示する', '30')
        cmpNako('!DNCLモード\nA[1,1]=11,A[1,2]=12;A[1,2]を表示する', '12')
    })
    it('インデントを｜で表現する', () => {
        cmpNako('!DNCLモード\nA=3;もしA>1ならば\n｜A←A+1\nを実行する。\nAを表示する。', '4')
    })
    it('表示エミュレート', () => {
        cmpNako('!DNCLモード\nx←10,y←20\nxと"-"とyを表示する。', '10-20')
        cmpNako('!DNCLモード\nx←10,y←20\n"("とxと","とyと")"を表示する。', '(10,20)')
        cmpNako('!DNCLモード\nx←10,y←20,z←30\n"("とxと","とyと","とzと")"を表示する。', '(10,20,30)')
        cmpNako('!DNCLモード\nx←10,y←20\n「<」とxと","とyと「>」を表示する。', '<10,20>')
        // #1079
        cmpNako('!DNCLモード\nx←10,y←20\n「<」 と x と "," と y と 「>」 を 表示する。', '<10,20>')
    })
    it('乱数エミュレート #1146', () => {
        cmpNako('!DNCLモード\nr ← 乱数 (5，10)\nもし(rが5以上)かつ(rが10以下)ならば「OK」と表示する。', 'OK')
        cmpNako('!DNCLモード\nr ← 乱数 (1，6)\nもし(rが1以上)かつ(rが6以下)ならば「OK」と表示する。', 'OK')
    })
    it('二進 #1146', () => {
        cmpNako('!DNCLモード\nA← 二進 (9)\nAを表示する。', '1001')
        cmpNako('!DNCLモード\nA← 二進 (255)\nAを表示する。', '11111111')
        cmpNako('!DNCLモード\n二進で表示 (255)', '11111111')
    })
    it('減らす・増やす #1149', () => {
        cmpNako('!DNCLモード\nsaihu←1000。syuppi←500。saihuをsyuppi減らす。saihuを表示する。', '500')
        cmpNako('!DNCLモード\nsaihu←1000。syuppi←500。saihuをsyuppi増やす。saihuを表示する。', '1500')
    })
    it('DNCLで「もし」文の否定形が動かない #1148', () =>{
        cmpNako('!DNCLモード\nkosu←1\nもし、kosu>27でないならば\n|「OK」を表示する。\nを実行する。\n', 'OK')
    })
    it('DNCLで後判定のループが動かない #1147', () =>{
        cmpNako('!DNCLモード\nA←1\n繰り返し，\nAを表示する\nAを1増やす\nを，A>3になるまで繰り返す\n', '1\n2\n3')
        cmpNako('!DNCLモード\nA←1\n繰り返し，\nAを表示する\nAを1だけ増やす\nを，A>3になるまで繰り返す\n', '1\n2\n3')
    })
})

