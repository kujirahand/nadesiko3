const assert = require('assert')
const WebNakoCompiler = require('../src/wnako3')
const { tokenize } = require('../src/wnako3_editor')

describe('wnako3_editor_test', () => {
    it('コードを分割する', () => {
        const tokens = tokenize('A=1\nA+1を表示'.split('\n'), new WebNakoCompiler())

        // 1行目
        assert.strictEqual(tokens[0][0].value, 'A')
        assert.strictEqual(tokens[0][1].value, '=')
        assert.strictEqual(tokens[0][2].value, '1')

        // 2行目
        assert.strictEqual(tokens[1][0].value, 'A')
        assert.strictEqual(tokens[1][1].value, '+')
        assert.strictEqual(tokens[1][2].value, '1を')
        assert.strictEqual(tokens[1][3].value, '表示')
    })
    it('scopeを割り当てる', () => {
        const tokens = tokenize('A=1\nA+1を表示'.split('\n'), new WebNakoCompiler())

        // 1行目
        assert(tokens[0][0].type.includes('variable'))
        assert(tokens[0][1].type.includes('operator'))
        assert(tokens[0][2].type.includes('numeric'))

        // 2行目
        assert(tokens[1][0].type.includes('variable'))
        assert(tokens[1][1].type.includes('operator'))
        assert(tokens[1][2].type.includes('numeric'))
        assert(tokens[1][3].type.includes('function'))
    })
})