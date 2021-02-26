const assert = require('assert')
const NakoCompiler = require('../src/nako3')
const { tokenize, LanguageFeatures } = require('../src/wnako3_editor')

describe('wnako3_editor_test', () => {
    class AceRange {
        constructor(startLine, startColumn, endLine, endColumn) {
            this.startLine = startLine
            this.startColumn = startColumn
            this.endLine = endLine
            this.endColumn = endColumn
        }
    }
    class AceDocument {
        constructor(text) {
            this.lines = text.split('\n')
            this.log = []
        }
        getLine(row) { return this.lines[row] }
        getAllLines() { return [...this.lines] }
        insertInLine(position, text) { this.log.push(['insertInLine', position, text]) }
        removeInLine(row, columnStart, columnEnd) { this.log.push(['removeInLine', row, columnStart, columnEnd]) }
        replace(range, text) { this.log.push(['replace', range, text]) }
    }
    
    describe('シンタックスハイライト', () => {
        it('コードを分割する', () => {
            const tokens = tokenize('A=1\nA+1を表示'.split('\n'), new NakoCompiler(), false).editorTokens

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
            const tokens = tokenize('A=1\nA+1を表示'.split('\n'), new NakoCompiler(), false).editorTokens
    
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
        it('取り込み文を無視する', () => {
            tokenize('!「http://www.example.com/non_existent_file.nako3」を取り込む。'.split('\n'), new NakoCompiler(), false)
        })
        it('助詞に下線を引く', () => {
            const tokens = tokenize('「\n」を表示'.split('\n'), new NakoCompiler(), true).editorTokens
            assert.strictEqual(tokens[1][0].value, '」')
            assert(tokens[1][0].type.includes('string'))

            assert.strictEqual(tokens[1][1].value, 'を')
            assert(tokens[1][1].type.includes('underline'))

            assert.strictEqual(tokens[1][2].value, '表示')
            assert(tokens[1][2].type.includes('function'))
        })
    })
    describe('ドキュメントのホバー', () => {
        it('プラグイン関数の助詞のドキュメントを表示する', () => {
            const nako3 = new NakoCompiler()
            nako3.addPluginObject('PluginEditorTest', {
                'プラグイン関数テスト': {
                    type: 'func',
                    josi: [['を', 'と'], ['に', 'は']],
                    fn: () => {}
                }
            })

            const token = tokenize('XをYにプラグイン関数テスト'.split('\n'), nako3, false)
                .editorTokens[0]
                .find((t) => t.value === 'プラグイン関数テスト')
            assert(token.docHTML.includes('（Aを|Aと、Bに|Bは）'))
            assert(token.docHTML.includes('PluginEditorTest'))
        })
        it('ユーザー定義関数の助詞のドキュメントを表示する', () => {
            const token = tokenize('●（Aを）Fとは\nここまで\n1をF'.split('\n'), new NakoCompiler(), false)
                .editorTokens[2]
                .find((t) => t.value === 'F')
            assert(token.docHTML.includes('（Aを）'))
        })
        it('前回の実行結果の影響を受けない', () => {
            const nako3 = new NakoCompiler()
            tokenize('●（Aを）Fとは\nここまで\n1をF'.split('\n'), nako3, false)
            const token = tokenize('1をF'.split('\n'), nako3, false)
                .editorTokens[0]
                .find((t) => t.value === 'F')
            assert.strictEqual(token.docHTML, null)
        })
    })
    describe('行コメントのトグル', () => {
        it('コメントアウト', () => {
            const doc = new AceDocument('abc\n')
            LanguageFeatures.toggleCommentLines('', { doc }, 0, 1)
            assert.deepStrictEqual(doc.log, [
                [ 'insertInLine', { row: 0, column: 0 }, '// ' ],
                [ 'insertInLine', { row: 1, column: 0 }, '// ' ],
            ])
        })
        it('アンコメント', () => {
            const doc = new AceDocument('// abc\n\n※def')
            LanguageFeatures.toggleCommentLines('', { doc }, 0, 2)
            assert.deepStrictEqual(doc.log, [
                [ 'removeInLine', 0, 0, 3 ], // '// ' を削除
                [ 'removeInLine', 2, 0, 1 ], // '※' を削除
            ])
        })
        it('中黒のある場合', () => {
            const doc = new AceDocument('・・abc')
            LanguageFeatures.toggleCommentLines('', { doc }, 0, 0)
            assert.deepStrictEqual(doc.log, [
                [ 'insertInLine', { row: 0, column: 2 }, '// ' ], // 'abc' の直前に挿入
            ])
        })
    })
    describe('auto outdent', () => {
        it('「ここまで」を入力し終わった瞬間に発火する', () => {
            assert(!LanguageFeatures.checkOutdent('start', '　ここ', 'ま'))
            assert(LanguageFeatures.checkOutdent('start', '　ここま', 'で'))
            assert(!LanguageFeatures.checkOutdent('start', '　ここまで', '\n'))

            assert(!LanguageFeatures.checkOutdent('start', '・ここ', 'ま'))
            assert(LanguageFeatures.checkOutdent('start', '・ここま', 'で'))
            assert(!LanguageFeatures.checkOutdent('start', '・ここまで', '\n'))
        })
        it('1つ前の行がブロックの開始行なら、その行に合わせる', () => {
            const doc = new AceDocument('    もしはいならば\n        ここまで')
            // 2行目にauto outdentを実行
            new LanguageFeatures(AceRange, new NakoCompiler()).autoOutdent('start', { doc }, 1)
            // 2行目の0-8文字目が '    ' で置換される
            assert.deepStrictEqual(doc.log, [[ 'replace', new AceRange(1, 0, 1, 8), '    ']])
        })
        it('1つ前の行がブロックの開始行でなければ、1段階インデントを下げる', () => {
            const doc = new AceDocument('もしはいならば\n    もしはいならば\n        1を表示\n        ここまで')
            // 4行目にauto outdentを実行
            new LanguageFeatures(AceRange, new NakoCompiler()).autoOutdent('start', { doc }, 3)
            // 2行目の0-8文字目が '    ' で置換される
            assert.deepStrictEqual(doc.log, [[ 'replace', new AceRange(3, 0, 3, 8), '    ']])
        })
    })
    describe('auto indent', () => {
        it('0列目の場合', () => {
            // 1段階インデントする
            assert.strictEqual(
                LanguageFeatures.getNextLineIndent('start', 'もしはいならば', '    '),
                '    ',
            )
        })
        it('4列目の場合', () => {
            // 1段階インデントする
            assert.strictEqual(
                LanguageFeatures.getNextLineIndent('start', '    もしはいならば', '    '),
                '        ',
            )
        })
        it('ブロックの開始行ではない場合', () => {
            // 1つ前の行と同じインデント幅を返す
            assert.strictEqual(
                LanguageFeatures.getNextLineIndent('start', '    もしはい', '    '),
                '    ',
            )
        })
    })
})