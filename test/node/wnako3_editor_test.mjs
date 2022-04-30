import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { expect } from 'chai'

import { NakoCompiler } from '../../src/nako3.mjs'
import { tokenize, LanguageFeatures, BackgroundTokenizer } from '../../src/wnako3_editor.mjs'
import { CNako3 } from '../../src/cnako3mod.mjs'
import { NakoLexerError } from '../../src/nako_errors.mjs'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


describe('wnako3_editor_test', () => {
    class AceRange {
        constructor(/** @type {number} */startLine, /** @type {number} */startColumn, /** @type {number} */endLine, /** @type {number} */endColumn) {
            this.startLine = startLine
            this.startColumn = startColumn
            this.endLine = endLine
            this.endColumn = endColumn
        }
    }
    /** @implements {IAceDocument} */
    class AceDocument {
        constructor(/** @type {string} */text) {
            this.lines = text.split('\n')
            /** @type {any[]} */
            this.log = []
        }
        getLine(/** @type {number} */row) { return this.lines[row] }
        getLength() { return this.lines.length }
        getAllLines() { return [...this.lines] }
        insertInLine(/** @type {{ row: number, column: number }} */position, /** @type {string} */text) { this.log.push(['insertInLine', position, text]) }
        removeInLine(/** @type {number} */row, /** @type {number} */columnStart, /** @type {number} */columnEnd) { this.log.push(['removeInLine', row, columnStart, columnEnd]) }
        replace(/** @type {AceRange} */range, /** @type {string} */text) { this.log.push(['replace', range, text]) }
        /** @returns {ISession} */
        asSession() { // テスト用
            // @ts-ignore
            return { doc: this }
        }
    }
    /** @returns {Promise<BackgroundTokenizer>} */
    const createBackgroundTokenizer = (/** @type {string} */text, compiler = new NakoCompiler()) => {
        return new Promise((resolve, reject) => {
            const tokenizer = new BackgroundTokenizer(
                new AceDocument(text),
                compiler,
                () => { resolve(tokenizer) }, // ok
                (_, err) => { reject(err) }, // err
                true,
            )
        })
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
        // todo
        /*
        it('依存ファイルのキャッシュを利用する', () => {
            const nako3 = new CNako3()
            const code = '!「./requiretest_indirect.nako3」を取り込む\n1と2の痕跡演算'
            const file = path.join(__dirname, 'main.nako3')
            nako3.loadDependencies(code, file, '')
            const tokens = tokenize(code.split('\n'), nako3, true)

            // 「痕跡演算」が関数として認識されていることを確認する。
            const token = tokens.editorTokens[1].find((token) => token.value === '痕跡演算')
            expect(token).to.have.property('type').and.to.include('function')
        })
        it('シンタックスハイライトにかかる時間が依存ファイルの行数に依存しないことを確認', () => {
            // 一時的に大きいファイルを作成
            const largeFile = path.join(__dirname, 'large_file.nako3')
            assert(!fs.existsSync(largeFile))
            fs.writeFileSync(largeFile, '●（Aを）large_fileとは\nここまで\nA=1+2+3+4+5\n'.repeat(1000))
            try {
                // 大きいファイルを取り込むコードを実行
                const code = '!「./large_file.nako3」を取り込む\n1をlarge_file'
                const file = path.join(__dirname, 'main.nako3')

                const nako3 = new CNako3()
                console.time('loadDependencies')
                nako3.loadDependencies(code, file, '')  // この行は遅いが、取り込み文に変更が合った時しか呼ばれない
                console.timeEnd('loadDependencies')

                const startTime = process.hrtime.bigint()
                console.time('tokenize')
                const tokens = tokenize(code.split('\n'), nako3, true)  // この行は速い必要がある
                const delta = process.hrtime.bigint() - startTime
                console.timeEnd('tokenize')

                // 200ms以下で終わることを確認
                // GitHub Actions で10〜40msくらいかかる。
                assert(delta <= BigInt(200000000))

                // 取り込みが行われたことを確認する
                const token = tokens.editorTokens[1].find((token) => token.value === 'large_file')
                expect(token).to.have.property('type').and.to.include('function')
            } finally {
                fs.unlinkSync(largeFile)
            }
        })
        */
        it('明示的に取り込んだプラグインの関数', async () => {
            const compiler = new CNako3()
            const code = `!「plugin_csv.mjs」を取り込む\n「1」のCSV取得`
            await compiler.loadDependencies(code, '', '')
            const token = tokenize(code.split('\n'), compiler, false).editorTokens[1][1]
            expect(token.type).to.include('function')
            expect(token.docHTML).to.include('CSV取得')
            expect(token.value).to.equal('CSV取得')
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
            expect(token).to.have.property('docHTML').and.to.include('（Aを|Aと、Bに|Bは）')
            expect(token).to.have.property('docHTML').and.to.include('PluginEditorTest')
        })
        it('ユーザー定義関数の助詞のドキュメントを表示する', () => {
            const token = tokenize('●（Aを）Fとは\nここまで\n1をF'.split('\n'), new NakoCompiler(), false)
                .editorTokens[2]
                .find((t) => t.value === 'F')
            expect(token).to.have.property('docHTML').and.to.include('（Aを）')
        })
        it('前回の実行結果の影響を受けない', () => {
            const nako3 = new NakoCompiler()
            tokenize('●（Aを）Fとは\nここまで\n1をF'.split('\n'), nako3, false)
            const token = tokenize('1をF'.split('\n'), nako3, false)
                .editorTokens[0]
                .find((t) => t.value === 'F')
            expect(token).to.have.property('docHTML').and.is.null
        })
    })
    describe('行コメントのトグル', () => {
        it('コメントアウト', () => {
            const doc = new AceDocument('abc\n')
            LanguageFeatures.toggleCommentLines('', doc.asSession(), 0, 1)
            assert.deepStrictEqual(doc.log, [
                [ 'insertInLine', { row: 0, column: 0 }, '// ' ],
                [ 'insertInLine', { row: 1, column: 0 }, '// ' ],
            ])
        })
        it('アンコメント', () => {
            const doc = new AceDocument('// abc\n\n※def')
            LanguageFeatures.toggleCommentLines('', doc.asSession(), 0, 2)
            assert.deepStrictEqual(doc.log, [
                [ 'removeInLine', 0, 0, 3 ], // '// ' を削除
                [ 'removeInLine', 2, 0, 1 ], // '※' を削除
            ])
        })
        it('中黒のある場合', () => {
            const doc = new AceDocument('・・abc')
            LanguageFeatures.toggleCommentLines('', doc.asSession(), 0, 0)
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
            new LanguageFeatures(AceRange, new NakoCompiler()).autoOutdent('start', doc.asSession(), 1)
            // 2行目の0-8文字目が '    ' で置換される
            assert.deepStrictEqual(doc.log, [[ 'replace', new AceRange(1, 0, 1, 8), '    ']])
        })
        it('1つ前の行がブロックの開始行でなければ、1段階インデントを下げる', () => {
            const doc = new AceDocument('もしはいならば\n    もしはいならば\n        1を表示\n        ここまで')
            // 4行目にauto outdentを実行
            new LanguageFeatures(AceRange, new NakoCompiler()).autoOutdent('start', doc.asSession(), 3)
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
    describe('バックグラウンドでコードをトークン化する', () => {
        it('成功時', async () => {
            const t = await createBackgroundTokenizer('1を表示')
            // 0行目の0、1、2個目のトークン
            expect(t.lines[0][0]).to.include({ type: 'constant.numeric', docHTML: null, value: '1' })
            expect(t.lines[0][1]).to.include({ type: 'constant.numeric.markup.underline', value: 'を' })
            expect(t.lines[0][2]).to.include({ type: 'entity.name.function', value: '表示' })
        })
        it('失敗時', async () => {
            let ok = false
            try {
                await createBackgroundTokenizer('「{」')
            } catch (err) {
                expect(err).to.be.instanceOf(NakoLexerError)
                ok = true
            }
            if (!ok) { throw new Error() }
        })
    })
    describe('オートコンプリート', () => {
        //todo
        /*
        it('同一ファイル内の関数', async () => {
            const compiler = new NakoCompiler()
            const tokenizer = await createBackgroundTokenizer('●（Aを）テスト用関数とは\nここまで\n', compiler)
            expect(LanguageFeatures.getCompletionItems(2, '', compiler, tokenizer)).to.deep.include({
                caption: "（Aを）テスト用関数",
                value: "テスト用関数",
                meta: "関数",
                score: 0,
            })
        })
        */
        it('同一ファイルの変数', async () => {
            const compiler = new NakoCompiler()
            const tokenizer = await createBackgroundTokenizer('テスト用変数=10\nここまで\n', compiler)
            expect(LanguageFeatures.getCompletionItems(2, '', compiler, tokenizer)).to.deep.include({
                caption: "テスト用変数",
                value: "テスト用変数",
                meta: "変数",
                score: 0,
            })
        })
        it('組み込みのプラグイン関数', async () => {
            const compiler = new NakoCompiler()
            compiler.addPluginObject('PluginEditorTest', { 'テスト用プラグイン関数': { type: 'func', josi: [['を'], ['に']], pure: true, fn: () => {} } })
            const tokenizer = await createBackgroundTokenizer('', compiler)
            expect(LanguageFeatures.getCompletionItems(0, '', compiler, tokenizer)).to.deep.include({
                caption: "（Aを、Bに）テスト用プラグイン関数",
                value: "テスト用プラグイン関数",
                meta: "PluginEditorTest",
                score: 0,
            })
        })
        it('組み込みのプラグイン変数', async () => {
            const compiler = new NakoCompiler()
            compiler.addPluginObject('PluginEditorTest', { 'テスト用プラグイン変数': { type: 'var', value: 0 } })
            const tokenizer = await createBackgroundTokenizer('', compiler)
            expect(LanguageFeatures.getCompletionItems(0, '', compiler, tokenizer)).to.deep.include({
                caption: "テスト用プラグイン変数",
                value: "テスト用プラグイン変数",
                meta: "PluginEditorTest",
                score: 0,
            })
        })
        //todo
        /*
        it('別ファイルの関数', async () => {
            const compiler = new CNako3()
            const code = `!「${__dirname}/requiretest.nako3」を取り込む\n`
            compiler.loadDependencies(code, '', '')
            const tokenizer = await createBackgroundTokenizer(code, compiler)
            const result = LanguageFeatures.getCompletionItems(0, '', compiler, tokenizer)
            assert(result.some((v) => v.caption === '（Aと、Bを）痕跡演算'))
        })
        */
        it('関数の呼び出しはmetaの値に影響を与えない', async () => {
            const compiler = new NakoCompiler()
            compiler.addPluginObject('PluginEditorTest', { 'テスト用プラグイン関数': { type: 'func', josi: [['を'], ['に']], pure: true, fn: () => {} } })
            const tokenizer = await createBackgroundTokenizer('テスト用プラグイン関数\n', compiler)
            const result = LanguageFeatures.getCompletionItems(1, '', compiler, tokenizer)
            assert.deepStrictEqual(result.filter((v) => v.value === "テスト用プラグイン関数"), [
                {
                    caption: '（Aを、Bに）テスト用プラグイン関数',
                    value: 'テスト用プラグイン関数',
                    meta: 'PluginEditorTest',  // ここに `関数` が表示されないことを確認する
                    score: 0
                }
            ])
        })
        //todo
        /*
        it('同一名の関数の定義が複数あるとき、候補には1つしか表示しない', async () => {
            const compiler = new NakoCompiler()
            const tokenizer = await createBackgroundTokenizer('●（Aを）テスト用関数とは\nここまで\n●（Aを）テスト用関数とは\nここまで\n', compiler)
            expect(LanguageFeatures.getCompletionItems(2, '', compiler, tokenizer)).to.deep.include({
                caption: "（Aを）テスト用関数",
                value: "テスト用関数",
                meta: "関数", // `関数, 関数` にならないことを確認する
                score: 0,
            })
        })
        */
    })
    it('テスト定義に実行ボタンを表示する', () => {
        const out = LanguageFeatures.getCodeLens(new AceDocument(
            '●テスト:足すとは\n' +
            'ここまで\n' +
            '●（AとBを）足すとは\n' +
            'ここまで\n' +
            '●テスト:引くとは\n' +
            'ここまで\n',
        ))
        assert.deepStrictEqual(out, [
            { start: { row: 0 }, command: { title: 'テストを実行', id: 'runTest', arguments: ['足す'] } },
            { start: { row: 4 }, command: { title: 'テストを実行', id: 'runTest', arguments: ['引く'] } },
        ])
    })
})