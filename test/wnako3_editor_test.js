const assert = require('assert')
const WebNakoCompiler = require('../src/wnako3')
const { tokenize, LanguageFeatures } = require('../src/wnako3_editor')

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
    const log = []
    const doc = {
        lines: [],
        getLine: (row) => doc.lines[row],
        insertInLine(position, text) { log.push(['insertInLine', position, text]) },
        removeInLine(row, columnStart, columnEnd) { log.push(['removeInLine', row, columnStart, columnEnd]) },
    }
    it('行コメントのトグル - コメントアウト', () => {
        log.length = 0
        doc.lines = ['abc', '']
        LanguageFeatures.toggleCommentLines('', { doc }, 0, 1)
        assert.deepStrictEqual(log, [
            [ 'insertInLine', { row: 0, column: 0 }, '// ' ],
            [ 'insertInLine', { row: 1, column: 0 }, '// ' ],
        ])
    })
    it('行コメントのトグル - アンコメント', () => {
        log.length = 0
        doc.lines = ['// abc', '', '※def']
        LanguageFeatures.toggleCommentLines('', { doc }, 0, 2)
        assert.deepStrictEqual(log, [
            [ 'removeInLine', 0, 0, 3 ], // '// ' を削除
            [ 'removeInLine', 2, 0, 1 ], // '※' を削除
        ])
    })
    it('行コメントのトグル - 中黒のある場合', () => {
        log.length = 0
        doc.lines = ['・・abc']
        LanguageFeatures.toggleCommentLines('', { doc }, 0, 0)
        assert.deepStrictEqual(log, [
            [ 'insertInLine', { row: 0, column: 2 }, '// ' ], // 'abc' の直前に挿入
        ])
    })
})