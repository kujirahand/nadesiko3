const assert = require('assert')
const NakoDncl = require('../../src/nako_from_dncl')

describe('dncl (#1140)', () => {
    const cmp = (src, expected) => {
        src = NakoDncl.convert(src)
        src = src.replace(/\s+$/, '')
        expected = expected.replace(/\s+$/, '')
        assert.strictEqual(src, expected)
    }
    it('代入文', () => {
        cmp('!DNCLモード\n'+
            'A←3\n',
            //---
            '\n'+
            'A=3\n')
            cmp('!DNCLモード\n'+
            'A←3, B←5\n',
            //---
            '\n'+
            'A=3; B=5\n')
    })
    it('もし文', () => {
        cmp('!DNCLモード\n'+
            'もしA=5ならば\n「OK」と表示\nを実行する',
            //---
            '\n'+
            'もしA=5ならば\n「OK」と表示\nここまで')
            cmp('!DNCLモード\n'+
            'A←3, B←5\n',
            //---
            '\n'+
            'A=3; B=5\n')
    })
})
