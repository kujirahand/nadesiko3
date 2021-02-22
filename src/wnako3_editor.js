/** なでしこのtokenのtypeをscope（CSSのクラス名）に変換する。 */

const { OffsetToLineColumn } = require('./nako_source_mapping')
const { LexError, NakoIndentError } = require('./nako_errors')
const { getBlockStructure, getIndent, countIndent, isIndentSyntaxEnabled } = require('./nako_indent')
const NakoPrepare = require('./nako_prepare')

/**
 * @typedef {import('./nako3')} NakoCompiler
 * 
 * @typedef {{
 *     getValue(): string
 *     setValue(text: string): void
 *     session: Session
 *     execCommand(command: string): void
 *     setReadOnly(value: boolean): void
 *     setOption(key: string, value: unknown): void
 *     getOption(key: string): unknown
 *     setOptions(entries: Record<string, unknown>): void
 *     setFontSize(px: number): void
 *     setKeyboardHandler(name: string): void
 *     setTheme(name: string): void
 *     container: HTMLElement
 *     wnako3EditorId?: number
 *     getCursorPosition(): { row: number, column: number }
 * }} AceEditor
 * 
 * @typedef {import("./nako_lexer").TokenWithSourceMap} TokenWithSourceMap
 * 
 * @typedef {{
 *     getLine(row: number): string
 *     getAllLines(): string[]
 *     getLength(): number
 *     insertInLine(position: { row: number, column: number }, text: string): void
 *     removeInLine(row: number, columnStart: number, columnEnd: number): void
 *     replace(range: AceRange, text: string): void
 * }} AceDocument
 * 
 * @typedef {{
 *     doc: AceDocument
 *     bgTokenizer: BackgroundTokenizer
 *     getScrollTop(): number
 *     setScrollTop(x: number): void
 *     getScrollLeft(): number
 *     setScrollLeft(x: number): void
 *     getUndoManager(): any
 *     setUndoManager(x: any): void
 *     selection: { getRange(): AceRange, isBackwards(): boolean, setRange(range: AceRange, reversed: boolean): void, clearSelection(): void }
 *     setMode(mode: string | object): void
 * }} Session
 * 
 * @typedef {{}} AceRange
 * 
 * @typedef {new (startLine: number, startColumn: number, endLine: number, endColumn: number) => AceRange} TypeofAceRange
 * 
 * @typedef {'comment.line' | 'comment.block' | 'keyword.control' | 'entity.name.function' |
 *           'constant.numeric' | 'support.constant' | 'keyword.operator' |
 *           'string.other' | 'variable.language' | 'variable.other' | 'markup.other' |
 *           'composition_placeholder'} TokenType
 * @typedef {{ type: TokenType, value: string, docHTML: string | null }} EditorToken
 */

/**
 * シンタックスハイライトでは一般にテキストの各部分に 'comment.line' のようなラベルを付け、各エディタテーマがそのそれぞれの色を設定する。
 * ace editor では例えば 'comment.line' が付いた部分はクラス .ace_comment.ace_line が付いたHTMLタグで囲まれ、各テーマはそれに対応するCSSを実装する。
 * @param {TokenWithSourceMap} token
 * @returns {TokenType}
 */
function getScope(token) {
    switch (token.type) {
        case "line_comment": return 'comment.line'
        case "range_comment": return 'comment.block'
        case "def_test": return 'keyword.control'
        case "def_func": return 'keyword.control'
        case "func": return 'entity.name.function'
        case "number": return 'constant.numeric'
        // 独立した助詞
        case "とは":
        case "ならば":
        case "でなければ":
            return 'keyword.control'
        // 制御構文
        case "ここから":
        case "ここまで":
        case "もし":
        case "違えば":
        case "require":
            return 'keyword.control'
        // 予約語
        case "回":
        case "間":
        case "繰り返す":
        case "反復":
        case "抜ける":
        case "続ける":
        case "戻る":
        case "先に":
        case "次に":
        case "代入":
        case "逐次実行":
        case "条件分岐":
        case "取込":
        case "エラー監視":
        case "エラー":
        case "変数":
        case "実行速度優先":
            return 'keyword.control'
        case "定める":
        case "定数":
            return 'support.constant'
        // 演算子
        case "shift_r0":
        case "shift_r":
        case "shift_l":
        case "gteq":
        case "lteq":
        case "noteq":
        case "eq":
        case "not":
        case "gt":
        case "lt":
        case "and":
        case "or":
        case "@":
        case "+":
        case "-":
        case "*":
        case "/":
        case "%":
        case "^":
        case "&":
            return 'keyword.operator'
        case "string":
        case "string_ex":
            return 'string.other'
        case "word":
            if (token.value === 'そう' || token.value === 'それ') {
                return 'variable.language'
            } else {
                return 'variable.other'
            }
        default:
            return 'markup.other'
    }
}

/**
 * `name` が定義されたプラグインの名前を返す。
 * @param {string} name
 * @param {NakoCompiler} nako3
 * @returns {string | null}
 */
function findPluginName(name, nako3) {
    for (const pluginName of Object.keys(nako3.__module)) {
        if (Object.keys(nako3.__module[pluginName]).includes(name)) {
            return pluginName
        }
    }
    return null
}

/**
 * i = 0, 1, 2, ... に対して 'A', 'B', 'C', ... 'Z', 'AA', 'AB', ... を返す。
 * @param {number} i
 * @returns {string}
 */
function createParameterName(i) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
    return i.toString(26).split("").map((v) => alphabet[parseInt(v, 26)]).join("")
}

/**
 * パラメータの定義を表す文字列を生成する。例えば `[['と', 'の'], ['を']]` に対して `'（Aと|Aの、Bを）'` を返す、パラメータが無い場合、空文字列を返す。
 * @param {string[][]} josi
 * @retunrs {string}
 */
function createParameterDeclaration(josi) {
    const args = josi.map((union, i) => union.map((v) => `${createParameterName(i)}${v}`).join("|")).join("、")
    if (args !== "") {
        return `（${args}）`
    } else {
        return ``
    }
}

// https://stackoverflow.com/a/6234804
function escapeHTML(t) {
    return t
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * 関数のドキュメントを返す。
 * @param {TokenWithSourceMap} token
 * @param {NakoCompiler} nako3
 * @returns {string | null}
 */
function getDocumentationHTML(token, nako3) {
    if (token.type !== 'func') {
        return null
    }
    // 助詞を表示する。
    let text = escapeHTML(createParameterDeclaration(token.meta.josi) + token.value)
    const plugin = findPluginName(token.value + '', nako3)
    if (plugin !== null) {
        // 定義元のプラグインが分かる場合はそれも表示する。
        text += `<span class="tooltip-plugin-name">${plugin}</span>`
    }
    return text
}

/**
 * ace editor ではエディタの文字列の全ての部分に何らかの `type` を付けなければならない。
 * なでしこのエディタでは 'markup.other' をデフォルト値として使うことにした。
 * @param {number} row
 * @param {AceDocument} doc
 * @returns {EditorToken[]}
 */
const getDefaultTokens = (row, doc) => [{ type: 'markup.other', value: doc.getLine(row), docHTML: null }]

/**
 * プログラムをlexerでtokenizeした後、ace editor 用のトークン列に変換する。
 * @param {string[]} lines
 * @param {NakoCompiler} nako3
 */
function tokenize(lines, nako3) {
    const code = lines.join('\n')

    // lexerにかける
    nako3.reset()
    const lexerOutput = nako3.lex(code, 'main.nako3', undefined, true)

    // eol、eof、長さが1未満のトークン、位置を特定できないトークンを消す
    /** @type {(TokenWithSourceMap & { startOffset: number, endOffset: number })[]} */
    //@ts-ignore
    const tokens = [...lexerOutput.tokens, ...lexerOutput.commentTokens, ...lexerOutput.requireTokens].filter((t) =>
        t.type !== 'eol' && t.type !== 'eof' &&
        typeof t.startOffset === "number" && typeof t.endOffset === "number" &&
        t.startOffset < t.endOffset)

    // startOffsetでソートする
    tokens.sort((a, b) => (a.startOffset || 0) - (b.startOffset || 0))

    // 各行について、余る文字の無いようにエディタのトークンに変換する。
    // 複数のトークンが重なることはないと仮定する。
    let lineStartOffset = 0
    let tokenIndex = 0
    // 実際に必要なプロパティはtype, valueだけで、docは独自に追加した。
    /** @type {EditorToken[][]} */
    const editorTokens = [] // 各行のエディタのトークン
    for (let i = 0; i < lines.length; i++) {
        editorTokens.push([])
        const lineEndOffset = lineStartOffset + lines[i].length
        let offset = lineStartOffset

        // 現在の行にかかっているトークンまで飛ばす
        while (tokenIndex < tokens.length &&
            tokens[tokenIndex].endOffset <= lineStartOffset) {
            tokenIndex++
        }

        // 行全体を完全にまたがっているトークンが存在する場合
        if (tokenIndex < tokens.length &&
            tokens[tokenIndex].startOffset <= lineStartOffset &&
            tokens[tokenIndex].endOffset >= lineEndOffset) {
            editorTokens[i].push({
                type: getScope(tokens[tokenIndex]),
                docHTML: getDocumentationHTML(tokens[tokenIndex], nako3),
                value: lines[i],
            })
        } else {
            // 行頭をまたがっているトークンが存在する場合
            if (tokenIndex < tokens.length &&
                tokens[tokenIndex].startOffset <= lineStartOffset) {
                editorTokens[i].push({
                    type: getScope(tokens[tokenIndex]),
                    docHTML: getDocumentationHTML(tokens[tokenIndex], nako3),
                    value: code.slice(offset, tokens[tokenIndex].endOffset),
                })
                offset = tokens[tokenIndex].endOffset
                tokenIndex++
            }

            // 行頭も行末もまたがっていないトークンを処理する
            while (tokenIndex < tokens.length &&
                tokens[tokenIndex].endOffset < lineEndOffset) {
                // このトークンと直前のトークンの間に隙間があるなら、埋める
                if (offset < tokens[tokenIndex].startOffset) {
                    editorTokens[i].push({
                        type: 'markup.other',
                        docHTML: null,
                        value: code.slice(offset, tokens[tokenIndex].startOffset),
                    })
                    offset = tokens[tokenIndex].startOffset
                }

                // 現在のトークンを使う
                editorTokens[i].push({
                    type: getScope(tokens[tokenIndex]),
                    docHTML: getDocumentationHTML(tokens[tokenIndex], nako3),
                    value: code.slice(offset, tokens[tokenIndex].endOffset),
                })
                offset = tokens[tokenIndex].endOffset
                tokenIndex++
            }

            // 行末をまたがっているトークンが存在する場合
            if (tokenIndex < tokens.length &&
                tokens[tokenIndex].startOffset < lineEndOffset) {
                // トークンの前の隙間
                if (offset < tokens[tokenIndex].startOffset) {
                    editorTokens[i].push({
                        type: 'markup.other',
                        docHTML: null,
                        value: code.slice(offset, tokens[tokenIndex].startOffset),
                    })
                    offset = tokens[tokenIndex].startOffset
                }

                // トークンを使う
                editorTokens[i].push({
                    type: getScope(tokens[tokenIndex]),
                    docHTML: getDocumentationHTML(tokens[tokenIndex], nako3),
                    value: code.slice(tokens[tokenIndex].startOffset, lineEndOffset),
                })
            } else {
                editorTokens[i].push({
                    type: 'markup.other',
                    docHTML: null,
                    value: code.slice(offset, lineEndOffset),
                })
            }
        }

        lineStartOffset += lines[i].length + 1
    }

    return { editorTokens, lexerOutput }
}

/**
 * エディタ上にエラーメッセージの波線とgutterの赤いマークとエラーメッセージのポップアップを設定するためのクラス。
 */
class EditorMarkers {
    /**
     * @param {any} session
     * @param {AceDocument} doc
     * @param {TypeofAceRange} AceRange
     * @param {boolean} disable
     */
    constructor(session, doc, AceRange, disable) {
        this.session = session
        this.doc = doc
        this.AceRange = AceRange
        /** @type {any[]} */
        this.markers = []
        this.hasAnnotations = false
        this.disable = disable
    }

    /**
     * @param {number} startLine
     * @param {number | null} startColumn
     * @param {number | null} endLine
     * @param {number | null} endColumn
     * @param {(row: number) => string} getLine
     * @returns {[number, number, number, number]}
     */
    static fromNullable(startLine, startColumn, endLine, endColumn, getLine) {
        if (startColumn === null) {
            startColumn = 0
        }
        if (endLine === null) {
            endLine = startLine
        }
        if (endColumn === null) {
            endColumn = getLine(endLine).length
        }

        // 最低でも1文字分の長さをとる
        if (startLine === endLine && startColumn === endColumn) {
            endColumn++
        }

        return [startLine, startColumn, endLine, endColumn]
    }

    /**
     * @param {string} code @param {number} startOffset @param {number} endOffset
     * @returns {[number, number, number, number]}
     */
    static fromOffset(code, startOffset, endOffset) {
        const offsetToLineColumn = new OffsetToLineColumn(code)
        const start = offsetToLineColumn.map(startOffset, false)
        const end = offsetToLineColumn.map(endOffset, false)
        return [start.line, start.column, end.line, end.column]
    }

    /**
     * @param {string} code
     * @param {{ line?: number, startOffset?: number | null, endOffset?: number | null, message: string }} error
     * @param {(row: number) => string} getLine
     * @returns {[number, number, number, number]}
     */
    static fromError(code, error, getLine) {
        if (typeof error.startOffset === 'number' && typeof error.endOffset === 'number') {
            // 完全な位置を取得できる場合
            return this.fromOffset(code, error.startOffset, error.endOffset)
        } else if (typeof error.line === 'number') {
            // 行全体の場合
            return this.fromNullable(error.line, null, null, null, getLine)
        } else {
            // 位置が不明な場合
            return this.fromNullable(0, null, null, null, getLine)
        }
    }

    /**
     * @param {number} startLine
     * @param {number | null} startColumn
     * @param {number | null} endLine
     * @param {number | null} endColumn
     * @param {string} message
     */
    add(startLine, startColumn, endLine, endColumn, message) {
        if (this.disable) {
            return
        }
        const range = new this.AceRange(...EditorMarkers.fromNullable(startLine, startColumn, endLine, endColumn, (row) => this.doc.getLine(row)))
        this.markers.push(this.session.addMarker(range, "marker-red", "text", false))
        this.session.setAnnotations([{ row: startLine, column: startColumn, text: message, type: 'error' }])
        this.hasAnnotations = true
    }

    /**
     * @param {string} code
     * @param {{ line?: number, startOffset?: number | null, endOffset?: number | null, message: string }} error
     */
    addByError(code, error) {
        this.add(...EditorMarkers.fromError(code, error, (row) => this.doc.getLine(row)), error.message)
    }

    /**
     * 全てのエラーメッセージを削除する。
     */
    clear() {
        for (const marker of this.markers) {
            this.session.removeMarker(marker)
        }
        this.markers.length = 0
        if (this.hasAnnotations) {
            this.session.clearAnnotations()
            this.hasAnnotations = false
        }
    }
}

/**
 * ace editor のBackgroundTokenizerを上書きして、シンタックスハイライトを自由に表示するためのクラス。
 * ace editor ではシンタックスハイライトのために正規表現ベースのBackgroundTokenizerクラスを用意し定期的にトークン化を
 * 行っているが、正規表現ではなくなでしこのコンパイラの出力を使うためにはそれを上書きする必要がある。
 */
class BackgroundTokenizer {
    /**
     * @param {AceDocument} doc
     * @param {NakoCompiler} nako3
     * @param {(firstRow: number, lastRow: number, ms: number) => void} onTokenUpdate
     * @param {(code: string, err: Error) => void} onCompileError
     */
    constructor(doc, nako3, onTokenUpdate, onCompileError) {
        this.onUpdate = onTokenUpdate
        this.doc = doc
        this.dirty = true
        this.nako3 = nako3
        this.onCompileError = onCompileError

        // オートコンプリートで使うために、直近のtokenizeの結果を保存しておく
        /** @type {ReturnType<NakoCompiler['lex']> | null} */
        this.lastLexerOutput = null

        // 各行のパース結果。
        // typeはscopeのこと。配列の全要素のvalueを結合した文字列がその行の文字列と等しくなる必要がある。
        /** @type {EditorToken[][]} */
        this.lines = this.doc.getAllLines().map((line) => [{ type: 'markup.other', value: line, docHTML: null }])

        // this.lines は外部から勝手に編集されてしまうため、コピーを持つ
        /** @type {{ code: string, lines: string } | null} */
        this.cache = null

        this.deleted = false

        const update = () => {
            if (this.deleted) {
                return
            }
            if (this.dirty && this.enabled) {
                const startTime = Date.now()
                this.dirty = false
                const code = this.doc.getAllLines().join('\n')
                try {
                    const startTime = Date.now()
                    const out = tokenize(this.doc.getAllLines(), nako3)
                    this.lastLexerOutput = out.lexerOutput
                    this.lines = out.editorTokens
                    this.cache = { code, lines: JSON.stringify(this.lines) }

                    // ファイル全体の更新を通知する。
                    onTokenUpdate(0, this.doc.getLength() - 1, Date.now() - startTime)
                } catch (e) {
                    onCompileError(code, e)
                }
                // tokenizeに時間がかかる場合、文字を入力できるように次回の実行を遅くする。
                setTimeout(update, Math.max(100, Math.min(5000, (Date.now() - startTime) * 5)))
            } else {
                setTimeout(update, 100)
            }
        }
        update()

        /** @public */
        this.enabled = true
    }

    dispose() {
        this.deleted = true
    }

    /**
     * テキストに変更があったときに呼ばれる。IME入力中には呼ばれない。
     * @param {{ action: string, start: { row: number, column: number }, end: { row: number, column: number }, lines: string[] }} delta
     */
    $updateOnChange(delta) {
        this.dirty = true
        const startRow = delta.start.row
        const endRow = delta.end.row
        if (startRow === endRow) { // 1行の編集
            if (delta.action === 'insert' && this.lines[startRow]) { // 行内に文字列を挿入
                const columnStart = delta.start.column
                // updateOnChangeはIME入力中には呼ばれない。composition_placeholder を消さないとIME確定後の表示がずれる。
                const oldTokens = this.lines[startRow]
                    .filter((v) => v.type !== 'composition_placeholder')
                /** @type {EditorToken[]} */
                const newTokens = []
                let i = 0
                let offset = 0

                // columnStartより左のトークンはそのまま保持する
                while (i < oldTokens.length && offset + oldTokens[i].value.length <= columnStart) {
                    newTokens.push(oldTokens[i])
                    offset += oldTokens[i].value.length
                    i++
                }

                // columnStartに重なっているトークンがあれば、2つに分割する
                if (i < oldTokens.length && offset < columnStart) {
                    newTokens.push({ type: oldTokens[i].type, value: oldTokens[i].value.slice(0, columnStart - offset), docHTML: null })
                    newTokens.push({ type: 'markup.other', value: delta.lines[0], docHTML: null })
                    newTokens.push({ type: oldTokens[i].type, value: oldTokens[i].value.slice(columnStart - offset), docHTML: null　})
                    i++
                } else {
                    newTokens.push({ type: 'markup.other', value: delta.lines[0], docHTML: null })
                }

                // columnStartより右のトークンもそのまま保持する
                while (i < oldTokens.length) {
                    newTokens.push(oldTokens[i])
                    i++
                }

                this.lines[startRow] = newTokens
            } else {
                this.lines[startRow] = getDefaultTokens(startRow, this.doc)
            }
        } else if (delta.action === 'remove') { // 範囲削除
            this.lines.splice(startRow, endRow - startRow + 1, getDefaultTokens(startRow, this.doc))
        } else { // 行の挿入
            this.lines.splice(startRow, 1, ...Array(endRow - startRow + 1).fill(null).map((_, i) => getDefaultTokens(i + startRow, this.doc)))
        }
    }

    /**
     * tokenizerの出力を返す。文字入力したときに呼ばれる。
     * @param {number} row
     */
    getTokens(row) {
        // IME入力中はthis.lines[row]に自動的にnullが設定される。その場合新しく行のトークン列を生成して返さなければならない。
        // 返した配列には自動的にIMEの入力用のテキストボックスであるcomposition_placeholderが挿入される。
        if (!this.lines[row]) {
            let ok = false

            if (this.enabled) {
                // tokenizeは非常に遅いため、キャッシュを使えるならそれを使う。
                const code = this.doc.getAllLines().join('\n')
                if (this.cache !== null && this.cache.code === code) {
                    ok = true
                } else {
                    try {
                        const lines = tokenize(this.doc.getAllLines(), this.nako3)
                        this.cache = { code, lines: JSON.stringify(lines.editorTokens) }
                        ok = true
                    } catch (e) {
                        if (!(e instanceof NakoIndentError || e instanceof LexError)) {
                            console.error(e)
                        }
                    }
                }
            }

            if (ok && this.cache !== null) {
                this.lines[row] = JSON.parse(this.cache.lines)[row]
            } else {
                this.lines[row] = getDefaultTokens(row, this.doc)
            }
        }
        return this.lines[row]
    }

    // ace側から呼ばれるが無視するメソッド
    //@ts-ignore
    start(startRow) { /* pass */ }
    //@ts-ignore
    fireUpdateEvent(firstRow, lastRow) { /* pass */ }
    //@ts-ignore
    setDocument(doc) { /* pass */ }
    scheduleStart() { /* pass */ }
    //@ts-ignore
    setTokenizer(tokenizer) { /* pass */ }
    stop() { /* pass */ }
    //@ts-ignore
    getState(row) { return 'start' }
}

/**
 * シンタックスハイライト以外のエディタの挙動の定義。
 */
class LanguageFeatures {
    /**
     * @param {TypeofAceRange} AceRange
     * @param {NakoCompiler} nako3
     */
    constructor(AceRange, nako3) {
        this.AceRange = AceRange
        this.nako3 = nako3
    }

    /**
     * Ctrl + / の動作の定義。
     * @param {string} state
     * @param {Session} session
     * @param {number} startRow
     * @param {number} endRow
     */
    static toggleCommentLines(state, {doc}, startRow, endRow) {
        const prepare = new NakoPrepare()
        /**
         * @param {string} line
         * @returns {{ type: 'blank' | 'code' } | { type: 'comment', start: number, len: number }}
         */
        const parseLine = (line) => {
            // 先頭の空白を消す
            const indent = getIndent(line)
            if (indent === line) {
                return { type: 'blank' }
            }
            line = line.substr(indent.length)

            // 先頭がコメントの開始文字かどうか確認する
            const ch2 = line.substr(0, 2).split('').map((c) => prepare.convert1ch(c)).join('')
            if (ch2.substr(0, 1) === '#') {
                return { type: 'comment', start: indent.length, len: 1 + (line.charAt(1) === ' ' ? 1 : 0) }
            }
            if (ch2 === '//') {
                return { type: 'comment', start: indent.length, len: 2 + (line.charAt(2) === ' ' ? 1 : 0) }
            }

            return { type: 'code' }
        }

        /** @type {number[]} */
        const rows = []
        for (let i = startRow; i <= endRow; i++) {
            rows.push(i)
        }

        // 全ての行が空白行ならコメントアウト、全ての行が行コメントで始まるか空白行ならアンコメント、そうでなければコメントアウト。
        if (!rows.every((row) => parseLine(doc.getLine(row)).type === 'blank') &&
            rows.every((row) => parseLine(doc.getLine(row)).type !== 'code')) {
            // アンコメント
            for (const row of rows) {
                // 行コメントで始まる行ならアンコメントする。
                // 行コメントの直後にスペースがあるなら、それも1文字だけ削除する。
                const line = parseLine(doc.getLine(row))
                if (line.type === 'comment') {
                    doc.removeInLine(row, line.start, line.start + line.len)
                }
            }
        } else {
            // 最もインデントの低い行のインデント数を数える
            const minIndent = Math.min(...rows.map((row) => countIndent(doc.getLine(row))))

            // コメントアウトする
            for (const row of rows) {
                const line = doc.getLine(row)
                let column = line.length
                for (let i = 0; i < line.length; i++) {
                    if (countIndent(line.slice(0, i)) >= minIndent) {
                        column = i
                        break
                    }
                }
                doc.insertInLine({ row, column }, '// ')
            }
        }
    }

    /**
     * 文字を入力するたびに呼ばれる。trueを返すとautoOutdentが呼ばれる。
     * @param {string} state
     * @param {string} line
     * @param {string} input
     * @returns {boolean}
     */
    static checkOutdent(state, line, input) {
        // 特定のキーワードの入力が終わったタイミングでインデントを自動修正する。
        // '違えば'のautoOutdentは「もし」と「条件分岐」のどちらのものか見分けが付かないため諦める。
        // 「ここ|ま」（縦線がカーソル）の状態で「で」を打つとtrueになってしまう問題があるが、修正するには引数が足りない。
        return /^[ 　・\t]*ここまで$/.test(line + input)
    }

    /**
     * checkOutdentがtrueを返したときに呼ばれる。
     * @param {string} state
     * @param {{ doc: AceDocument }} session
     * @param {number} row
     * @returns {void}
     */
    autoOutdent(state, {doc}, row) {
        // 1行目なら何もしない
        if (row === 0) {
            return
        }
        const prevLine = doc.getLine(row - 1)
        let indent
        if (LanguageFeatures.isBlockStart(prevLine)) {
            // 1つ前の行が「〜ならば」などのブロック開始行なら、その行に合わせる。
            indent = getIndent(prevLine)
        } else {
            // そうでなければ、1つ前の行のインデントから1段階outdentした位置に合わせる。
            const s = this.getBlockStructure(doc.getAllLines().join('\n'))
            const parent = s.parents[row]
            indent = parent !== null ? s.spaces[parent] : ''
        }

        // 置換する
        const oldIndent = getIndent(doc.getLine(row))
        doc.replace(new this.AceRange(row, 0, row, oldIndent.length), indent)
    }

    /**
     * エンターキーを押して行が追加されたときに挿入する文字列を指定する。
     * @param {string} state
     * @param {string} line 改行前にカーソルがあった行の文字列
     * @param {string} tab タブ文字（デフォルトでは "    "）
     */
    static getNextLineIndent(state, line, tab) {
        // ●で始まるか、特定のキーワードで終わる場合にマッチする。
        if (this.isBlockStart(line)) {
            return getIndent(line) + tab
        }
        return getIndent(line)
    }

    /** @param {string} line */
    static isBlockStart(line) {
        return /^[ 　・\t]*●|(ならば|なければ|ここから|条件分岐|違えば|回|繰り返(す|し)|の間|反復|とは|には|エラー監視|エラーならば|実行速度優先)、?\s*$/.test(line)
    }

    /**
     * オートコンプリート
     * @param {number} row
     * @param {string} prefix getCompletionPrefixの出力
     * @param {NakoCompiler} nako3
     * @param {BackgroundTokenizer} backgroundTokenizer
     */
    static getCompletionItems(row, prefix, nako3, backgroundTokenizer) {
        /** @param {string} target */
        const getScore = (target) => {
            // 日本語の文字数は英語よりずっと多いため、ただ一致する文字数を数えるだけで十分。
            let n = 0
            for (let i = 0; i < prefix.length; i++) {
                if (target.includes(prefix[i])) {
                    n++
                }
            }
            return n
        }

        /**
         * metaは候補の横に薄く表示されるテキスト
         * @type {{ caption: string, value: string, meta: string, score: number }[]}
         */
        const result = []
        // プラグイン関数
        for (const name of Object.keys(nako3.__varslist[0])) {
            if (name.startsWith('!')) { // 「!PluginBrowser:初期化」などを除外
                continue
            }
            const f = nako3.funclist[name]
            if (typeof f !== 'object' || f === null) {
                continue
            }

            let pluginName = findPluginName(name, nako3) || 'プラグイン'
            if (f.type === 'func') {
                result.push({ caption: createParameterDeclaration(f.josi) + name, value: name, meta: pluginName, score: getScore(name) })
            } else {
                result.push({ caption: name, value: name, meta: pluginName, score: getScore(name) })
            }
        }

        // ユーザーが定義した名前
        if (backgroundTokenizer.lastLexerOutput !== null) {
            for (const token of backgroundTokenizer.lastLexerOutput.tokens) {
                // 同じ行のトークンの場合、自分自身にマッチしている可能性が高いため除外
                if (token.line === row) {
                    continue
                }
                const name = token.value + ''
                if (token.type === 'word') {
                    result.push({ caption: name, value: name, meta: '変数', score: getScore(name) })
                } else if (token.type === 'func') {
                    let josi = ''
                    const f = nako3.funclist[name]
                    if (f && f.type === 'func') {
                        josi = createParameterDeclaration(f.josi)
                    }
                    result.push({ caption: josi + name, value: name, meta: '関数', score: getScore(name) })
                }
            }
        }

        return result
    }

    /**
     * スニペット
     */
    /** @param {string} text */
    static getSnippets(text) {
        // インデント構文が有効化されているなら「ここまで」を消す
        const indentSyntax = isIndentSyntaxEnabled(text)

        /** @param {string} en @param {string} jp @param {string} snippet */
        const item = (en, jp, snippet) => indentSyntax ?
            { caption: en, meta: `\u21E5 ${jp}`, score: 1, snippet: snippet.replace(/\t*ここまで(\n|$)/g, '').replace(/\t/g, '    ') } :
            { caption: en, meta: `\u21E5 ${jp}`, score: 1, snippet: snippet.replace(/\t/g, '    ') }

        return [
            item('if', 'もし〜ならば', 'もし${1:1=1}ならば\n\t${2:1を表示}\n違えば\n\t${3:2を表示}\nここまで\n'),
            item('times', '〜回', '${1:3}回\n\t${2:1を表示}\nここまで\n'),
            item('for', '繰り返す', '${1:N}で${2:1}から${3:3}まで繰り返す\n\t${4:Nを表示}\nここまで\n'),
            item('while', '〜の間', '${1:N<2の間}\n\tN=N+1\nここまで\n'),
            item('foreach', '〜を反復', '${1:[1,2,3]}を反復\n\t${2:対象を表示}\nここまで\n'),
            item('switch', '〜で条件分岐', '${1:N}で条件分岐\n\t${2:1}ならば\n\t\t${3:1を表示}\n\tここまで\n\t${4:2}ならば\n\t\t${5:2を表示}\n\tここまで\n\t違えば\n\t\t${6:3を表示}\n\tここまで\nここまで\n'),
            item('function', '●〜とは', '●（${1:AとBを}）${2:足す}とは\n\t${3:A+Bを戻す}\nここまで\n'),
            item('try', 'エラー監視', 'エラー監視\n\t${1:1のエラー発生}\nエラーならば\n\t${2:2を表示}\nここまで\n'),
        ]
    }

    /**
     * @param {string} line
     * @param {NakoCompiler} nako3
     */
    static getCompletionPrefix(line, nako3) {
        /** @type {ReturnType<NakoCompiler['lex']>["tokens"] | null} */
        let tokens = null

        // ひらがなとアルファベットとカタカナと漢字のみオートコンプリートする。
        if (line.length === 0 || !/[ぁ-んa-zA-Zァ-ヶー\u3005\u4E00-\u9FCF]/.test(line[line.length - 1])) {
            return ''
        }

        // 現在の行のカーソルより前の部分をlexerにかける。速度を優先して1行だけ処理する。
        try {
            nako3.reset()
            tokens = nako3.lex(line, 'completion.nako3', undefined, true).tokens
                .filter((t) => t.type !== 'eol' && t.type !== 'eof')
        } catch (e) {
            if (!(e instanceof NakoIndentError || e instanceof LexError)) {
                console.error(e)
            }
        }
        if (tokens === null || tokens.length === 0 || !tokens[tokens.length - 1].value) {
            return ''
        }
        const prefix = tokens[tokens.length - 1].value + ''

        // 単語の先頭がひらがなではなく末尾がひらがなのとき、助詞を打っている可能性が高いためオートコンプリートしない。 
        if (/[ぁ-ん]/.test(prefix[prefix.length - 1]) && !/[ぁ-ん]/.test(prefix[0])) {
            return ''
        }

        // 最後のトークンの値を、オートコンプリートで既に入力した部分とする。
        return prefix
    }

    /**
     * 文字を打つたびに各行についてこの関数が呼ばれる。'start'を返した行はfold可能な範囲の先頭の行になる。
     * @param {Session} session
     * @param {string} foldStyle
     * @param {number} row
     * @returns {'start' | ''}
     */
    getFoldWidget({doc}, foldStyle, row) {
        // 速度が重要なため正規表現でマッチする。
        return LanguageFeatures.isBlockStart(doc.getLine(row)) ? 'start' : ''
    }

    /**
     * getFoldWidgetが'start'を返した行に設置されるfold用のボタンが押されたときに呼ばれる。
     * @param {Session} session
     * @param {string} foldStyle
     * @param {number} row
     * @returns {AceRange | null} foldする範囲
     */
    getFoldWidgetRange({doc}, foldStyle, row) {
        const pair = this.getBlockStructure(doc.getAllLines().join('\n')).pairs.find((v) => v[0] === row)
        if (pair !== undefined) {
            return new this.AceRange(pair[0], doc.getLine(pair[0]).length, pair[1] - 1, doc.getLine(pair[1] - 1).length)
        }
        return null
    }

    /**
     * @param {string} code
     * @returns {ReturnType<getBlockStructure>}
     * @private
     */
    getBlockStructure(code) {
        // キャッシュ
        if (!this.blockStructure || this.blockStructure.code !== code) {
            // @ts-ignore
            this.blockStructure = { code, data: getBlockStructure(code) }
        }
        return this.blockStructure.data
    }
}

/**
 * 複数ファイルを表示するための最低限のAPIを提供する。
 * @typedef {{ content: string, cursor: { range: AceRange, reversed: boolean }, scroll: { top: number, left: number }, undoManger: any }} EditorTabState
 */
class EditorTabs {
    /**
     * @param {AceEditor} editor
     * @param {TypeofAceRange} AceRange
     * @param {any} UndoManager
     */
    constructor(editor, AceRange, UndoManager) {
        this.editor = editor
        this.AceRange = AceRange
        this.UndoManager = UndoManager
    }
    /** @param {string} content @returns {EditorTabState} */
    newTab(content) {
        return {
            content,
            cursor: { range: new this.AceRange(0, 0, 0, 0), reversed: false },
            scroll: { left: 0, top: 0 },
            undoManger: new this.UndoManager(),
        }
    }
    /** @returns {EditorTabState} */
    getTab() {
        return {
            content: this.editor.getValue(),
            cursor: { range: this.editor.session.selection.getRange(), reversed: this.editor.session.selection.isBackwards() },
            scroll: { left: this.editor.session.getScrollLeft(), top: this.editor.session.getScrollTop() },
            undoManger: this.editor.session.getUndoManager(),
        }
    }
    /** @param {EditorTabState} state */
    setTab(state) {
        this.editor.setValue(state.content)
        this.editor.session.selection.setRange(state.cursor.range, state.cursor.reversed)
        this.editor.session.setScrollLeft(state.scroll.left)
        this.editor.session.setScrollTop(state.scroll.top)
        this.editor.session.setUndoManager(state.undoManger)
    }
}

/**
 * ace/ext/language_tools の設定がグローバル変数で保持されているため、こちら側でもグローバル変数で管理しないと、エディタが複数あるときに正しく動かない。
 * - captionはオートコンプリートの候補として表示されるテキスト
 * - metaはcaptionのテキストの右に薄く表示されるテキスト
 * - docHTMLはその更に右に独立したウィンドウで表示されるHTMLによる説明
 * - valueは決定したときに実際に挿入される文字列。プレースホルダーを配置するなら代わりにsnippetに値を設定する。
 * 
 * @typedef {{
 *     getCompletions(
 *         editor: any,
 *         session: Session,
 *         pos: { row: number, column: number },
 *         prefix: any,
 *         callback: (
 *             a: null,
 *             b: { meta: string, caption: string, value?: string, score: number, docHTML?: string, snippet?: string }[]
 *         ) => void
 *     ): void
 *     getDocTooltip?(item: any): void
 * }} Completer
 * @type {Completer[]}
 */
const completers = []

let editorIdCounter = 0
/**
 * 指定したidのHTML要素をなでしこ言語のエディタにする。
 * 
 * - ace editor がグローバルに読み込まれている必要がある。
 * - wnako3_editor.css を読み込む必要がある。
 * - readonly にするには data-nako3-readonly="true" を設定する。
 * - エラー位置の表示を無効化するには data-nako3-disable-marker="true" を設定する。
 * 
 * @param {string} id HTML要素のid
 * @param {NakoCompiler} nako3
 * @param {any} ace
 * @param {string} [defaultFileName]
 */
function setupEditor (id, nako3, ace, defaultFileName = 'main.nako3') {
    /** @type {AceEditor} */
    const editor = ace.edit(id)
    const element = document.getElementById(id)
    if (element === null) {
        throw new Error(`idが ${id} のHTML要素は存在しません。`)
    }

    /** @type {TypeofAceRange} */
    const AceRange = ace.require('ace/range').Range
    const editorMarkers = new EditorMarkers(
        editor.session,
        editor.session.bgTokenizer.doc,
        AceRange,
        !!element.dataset.nako3DisableMarker,
    )

    element.classList.add('nako3_editor')
    const readonly = element.dataset.nako3Readonly
    if (!!readonly) {
        element.classList.add('readonly')
        editor.setReadOnly(true)
    }
    editor.setFontSize(16)
    editor.setOptions({
        wrap: 'free',
        indentedSoftWrap: false,
        showPrintMargin: false,
    })
    ace.require('ace/keybindings/vscode')
    editor.setKeyboardHandler('ace/keyboard/vscode')

    // ドキュメントのホバー
    const Tooltip = ace.require('ace/tooltip').Tooltip
    const tooltip = new Tooltip(editor.container)
    const event = ace.require('ace/lib/event')
    event.addListener(editor.renderer.content, 'mouseout', () => {
        // マウスカーソルがエディタの外に出たら、tooltipを隠す
        tooltip.hide()
    })
    editor.on('mousemove', (e) => {
        // マウスカーソルがトークンに重なったときにtooltipを表示する。モバイル端末の場合はトークンにカーソルが当たったときに表示される。
        const pos = e.getDocumentPosition()
        // getTokenAtはcolumnが行末より大きいとき行末のトークンを返してしまう。
        if (pos.column >= e.editor.session.getLine(pos.row).length) {
            tooltip.hide()
            return
        }
        // getTokenAtは実際よりも1文字右のトークンを取得してしまうため、columnに1を足している。
        /** @type {EditorToken} */
        const token = e.editor.session.getTokenAt(pos.row, pos.column + 1)
        if (token === null || !token.docHTML) {
            // ドキュメントが存在しないトークンならtooltipを表示しない
            tooltip.hide()
            return
        }

        tooltip.setHtml(token.docHTML)
        tooltip.show(null, e.clientX, e.clientY)
    })
    editor.session.on('change', () => {
        // モバイル端末でドキュメントが存在するトークンを編集するときにツールチップが消えない問題を解消するために、文字を打ったらtooltipを隠す。
        tooltip.hide()

        // 文字入力したらマーカーを消す
        editorMarkers.clear()
    })

    let isFirstTime = true
    const oldBgTokenizer = editor.session.bgTokenizer
    const backgroundTokenizer = new BackgroundTokenizer(
        editor.session.bgTokenizer.doc,
        nako3,
        (firstRow, lastRow, ms) => {
            oldBgTokenizer._signal('update', { data: { first: firstRow, last: lastRow } })

            // 処理が遅い場合シンタックスハイライトを無効化する。
            if (ms > 220 && editor.getOption('syntaxHighlighting') && !readonly && isFirstTime) {
                isFirstTime = false
                slowSpeedMessage.classList.add('visible')
                editor.setOption('syntaxHighlighting', false)
                setTimeout(() => {
                    slowSpeedMessage.classList.remove('visible')
                }, 8000);
            }
        },
        (code, err) => { editorMarkers.addByError(code, err) },
    )

    // オートコンプリートを有効化する
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true,
    })

    const editorId = editorIdCounter++
    editor.wnako3EditorId = editorId

    // オートコンプリートのcompleterを設定する
    completers.push(
        {
            getCompletions(editor, session, pos, prefix, callback) {
                if (editor.wnako3EditorId !== editorId) {
                    callback(null, [])
                } else {
                    const items = LanguageFeatures.getCompletionItems(pos.row, prefix, nako3, backgroundTokenizer)
                    // 完全に一致する候補があればオートコンプリートしない。（Aceエディタでの挙動が微妙なため。）
                    if (items.some((v) => v.value === prefix)) {
                        callback(null, [])
                        return
                    }
                    callback(null, items)
                }
            },
        },
        { getCompletions(editor, session, pos, prefix, callback) { callback(null, (editor.wnako3EditorId !== editorId) ? [] : LanguageFeatures.getSnippets(editor.session.doc.getAllLines().join('\n'))) } },
    )
    ace.require('ace/ext/language_tools').setCompleters(completers)

    // オートコンプリートの単語の区切りが日本語に対応していないため、メソッドを上書きして対応させる。
    // 文字を入力するたびに呼ばれ、''以外を返すとその文字列をもとにしてautocompletionが始まる。
    ace.require('ace/autocomplete/util').getCompletionPrefix = (/** @type {AceEditor} */ editor) => {
        const pos = editor.getCursorPosition()
        return LanguageFeatures.getCompletionPrefix(editor.session.doc.getLine(pos.row).slice(0, pos.column), nako3)
    }

    // エディタの挙動の設定
    const languageFeatures = new LanguageFeatures(AceRange, nako3)
    const oop = ace.require('ace/lib/oop')
    const TextMode = ace.require('ace/mode/text').Mode
    const Mode = function() {
        this.HighlightRules = new TextMode().HighlightRules
        this.foldingRules = {
            getFoldWidget: languageFeatures.getFoldWidget.bind(languageFeatures),
            getFoldWidgetRange: languageFeatures.getFoldWidgetRange.bind(languageFeatures),
        }
    }
    oop.inherits(Mode, TextMode)
    Mode.prototype.toggleCommentLines = LanguageFeatures.toggleCommentLines.bind(LanguageFeatures)
    Mode.prototype.getNextLineIndent = LanguageFeatures.getNextLineIndent.bind(LanguageFeatures)
    Mode.prototype.checkOutdent = LanguageFeatures.checkOutdent.bind(LanguageFeatures)
    Mode.prototype.autoOutdent = languageFeatures.autoOutdent.bind(languageFeatures)
    editor.session.setMode(new Mode())

    // tokenizer （シンタックスハイライト）の上書き
    editor.session.bgTokenizer.stop()
    editor.session.bgTokenizer = backgroundTokenizer

    editor.setTheme("ace/theme/xcode")

    ace.require('ace/config').defineOptions(editor.constructor.prototype, 'editor', {
        syntaxHighlighting: {
            /** @type {(this: AceEditor, value: boolean) => void} */
            set: function(value) {
                this.session.bgTokenizer.enabled = value

                // 一旦テキスト全体を消してから、元に戻す
                /** @type {AceDocument} */
                const doc = this.session.doc
                const lines = doc.getAllLines()
                const range = this.session.selection.getRange()
                doc.removeFullLines(0, doc.getLength())
                doc.insert({ row: 0, column: 0 }, lines.join('\n'))
                this.session.selection.setRange(range, false)
            },
            initialValue: true
        }
    })

    // 設定メニューの上書き
    // なでしこ用に上書きした設定の削除やテキストの和訳をする。
    const OptionPanel = ace.require('ace/ext/options').OptionPanel
    {
        // renderメソッドを呼ぶとrenderOptionGroupにoptionGroups.Main、optionGroups.More が順に渡されることを利用して、optionGroupsを書き換える。
        const panel = new OptionPanel(editor)
        let i = 'Main'
        panel.renderOptionGroup = (/** @type {Record<string, object>} */ group) => {
            if (i === 'Main') { // Main
                for (const key of Object.keys(group)) {
                    delete group[key]
                }
                group['シンタックスハイライトを有効化する'] = {
                    path: 'syntaxHighlighting'
                }
                group['キーバインド'] = {
                    type: 'buttonBar',
                    path: 'keyboardHandler',
                    items: [
                        { caption: 'VSCode', value: 'ace/keyboard/vscode' },
                        { caption: 'Emacs', value: 'ace/keyboard/emacs' },
                        { caption: 'Sublime', value: 'ace/keyboard/sublime' },
                        { caption: 'Vim', value: 'ace/keyboard/vim' },
                    ]
                }
                group['文字サイズ'] = {
                    path: "fontSize",
                    type: "number",
                    defaultValue: 16,
                }
                group["行の折り返し"] = {
                    type: "buttonBar",
                    path: "wrap",
                    items: [
                        { caption: "オフ", value: "off" },
                        { caption: "オン", value: "free" },
                    ]
                }
                group["ソフトタブ"] = [{
                    path: "useSoftTabs"
                }, {
                    ariaLabel: "Tab Size",
                    path: "tabSize",
                    type: "number",
                    values: [2, 3, 4, 8, 16]
                }]
                group["空白文字を表示する"] = {
                    path: "showInvisibles"
                }
                group["常に自動補完する"] = {
                    path: "enableLiveAutocompletion"
                }
                group["折り返した行をインデントする"] = {
                    path: "indentedSoftWrap"
                }
                i = 'More'
            } else { // More
                for (const key of Object.keys(group)) {
                    delete group[key]
                }
            }
        }
        panel.render()
    }

    // 右下のボタン全体を囲むdiv
    const buttonContainer = document.createElement('div')
    buttonContainer.classList.add('button-container')
    editor.container.appendChild(buttonContainer)

    // 遅い端末へのメッセージのボタン
    const slowSpeedMessage = document.createElement('span')
    slowSpeedMessage.classList.add('slow-speed-message')
    slowSpeedMessage.innerHTML = '<span>エディタの|応答速度が|低下したため|シンタックス|ハイライトを|無効化|しました。</span>'.replace(/\|/g, '</span><span>')
    buttonContainer.appendChild(slowSpeedMessage)

    // 「設定を開く」ボタン
    const settingsButton = document.createElement('span')
    settingsButton.classList.add('settings-button')
    settingsButton.innerText = '設定を開く'
    settingsButton.addEventListener('click', (e) => {
        editor.execCommand("showSettingsMenu")
        e.preventDefault()
    })
    buttonContainer.appendChild(settingsButton)

    // 複数ファイルの切り替え
    const UndoManager = ace.require('ace/undomanager').UndoManager
    const editorTabs = new EditorTabs(editor, AceRange, UndoManager)

    return { editor, editorMarkers, editorTabs }
}

module.exports = {
    tokenize,
    setupEditor,
    LanguageFeatures,
    EditorMarkers,
    BackgroundTokenizer,
}
