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
    it('配列の自動初期化', () => {
        cmpNako('!DNCLモード\nA[1]←111。AをJSONエンコードして表示する', '[111]')
        cmpNako('!DNCLモード\nA[1]=1,A[2]=2;AをJSONエンコードして表示する', '[1,2]')
    })
    it('インデントを｜で表現する', () => {
        cmpNako('!DNCLモード\nA=3;もしA>1ならば\n｜A←A+1\nを実行する。\nAを表示する。', '4')
    })
})

