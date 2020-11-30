const assert = require('assert')
const NakoIndent = require('../src/nako_indent')

describe('indent', () => {
    const cmp = (src, expected) => {
        src = NakoIndent.convert(src)
        src = src.replace(/\s+$/, '')
        expected = expected.replace(/\s+$/, '')
        assert.strictEqual(src, expected)
    }
    it('もし', () => {
        cmp('##インデント構文\n'+
            'もしA=1ならば\n'+
            '　　1を表示\n',
            // ---
            'もしA=1ならば\n' +
            '　　1を表示\n' +
            'ここまで\n')
    })
  /*
    it('もし 違えば', () => {
        cmp('##インデント構文\n'+
            'もしA=1ならば\n'+
            '　　1を表示\n' +
            '違えば\n'+
            '　　2を表示\n',
            // ---
            'もしA=1ならば\n' +
            '　　1を表示\n' +
            'ここまで\n' +
            '違えば\n' +
            '　　2を表示\n',
            'ここまで\n')
    })
  */
})
