/** なでしこのtokenのtypeをscope（CSSのクラス名）に変換する。 */

const WebNakoCompiler = require("./wnako3")
const { OffsetToLineColumn } = require("./nako_source_mapping")
const { LexError } = require("./nako_lex_error")
const NakoIndentError = require("./nako_indent_error")
const { getBlockStructure, getIndent, countIndent } = require('./nako_indent')
const NakoPrepare = require('./nako_prepare')

/**
 * @typedef {import("./nako_lexer").TokenWithSourceMap} TokenWithSourceMap
 * 
 * @typedef {{
 *     getLine(row: number): string
 *     getAllLines(): string[]
 *     getLength(): number
 *     insertInLine(position: { row: number, column: number }, text: string): void
 *     removeInLine(row: number, columnStart: number, columnEnd: number): void
 *     replace(range: AceRange, text: string): void
 * }} Document
 * 
 * @typedef {{ doc: Document }} Session
 * 
 * @typedef {{}} AceRange
 * 
 * @typedef {new (startLine: number, startColumn: number, endLine: number, endColumn: number) => AceRange} TypeofAceRange
 * 
 * @typedef {{ type: string, value: string, docHTML: string | null }} EditorToken
 */

/**
 * @param {TokenWithSourceMap} token
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
        case "とは": return 'keyword.other'
        case "ならば":
        case "でなければ":
            return 'keyword.control'
        // 制御構文
        case "ここから":
        case "ここまで":
        case "もし":
        case "違えば":
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
 * @param {WebNakoCompiler} nako3
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
 * A, B, C, ... Z, AA, AB, ... を返す。
 * @param {number} i
 * @returns {string}
 */
function createParameterName(i) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
    return i.toString(26).split("").map((v) => alphabet[parseInt(v, 26)]).join("")
}

/**
 * "（Aと|Aの、Bを）"の形式の、パラメータの定義を表す文字列を生成する。パラメータが無い場合、空文字列を返す。
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

/**
 * @param {TokenWithSourceMap} token
 * @param {WebNakoCompiler} nako3
 * @returns {string | null}
 */
function getDocumentationHTML(token, nako3) {
    if (token.type !== 'func') {
        return null
    }
    let text = (createParameterDeclaration(token.meta.josi) + token.value)
        .replace(/&/g, '&amp;') // https://stackoverflow.com/a/6234804
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    const plugin = findPluginName(token.value + '', nako3)
    if (plugin !== null) {
        text += `<span class="tooltip-plugin-name">(${plugin})</span>`
    }
    return text
}

/**
 * @param {number} row
 * @param {Document} doc
 */
const getDefaultTokens = (row, doc) => [{ type: 'markup.other', value: doc.getLine(row) }]

/**
 * 一時的にbeforeParseCallbackを無効化する。
 * @type {<T>(nako3: WebNakoCompiler, f: () => T) => T}
 */
function withoutBeforeParseCallback (nako3, f) {
    const tmp = nako3.beforeParseCallback
    nako3.beforeParseCallback = (opts) => opts.tokens
    try {
        return f()
    } finally {
        nako3.beforeParseCallback = tmp
    }
}

/**
 * プログラムをlexerでtokenizeした後、ace editor 用のトークン列に変換する。
 * @param {string[]} lines
 * @param {WebNakoCompiler} nako3
 */
function tokenize (lines, nako3) {
    const code = lines.join('\n')

    // 重要: beforeParseCallbackを無効化しないと、ページを見ただけでシンタックスハイライトのために
    // 取り込み文が実行されてfetchが飛んでしまい、セキュリティ的に危険。
    return withoutBeforeParseCallback(nako3, () => {
        // lexerにかける
        nako3.reset()
        nako3.lexer.setFuncList(nako3.funclist)
        const lexerOutput = nako3.lex(code, 'main.nako3')

        // eol、eof、長さが1未満のトークン、位置を特定できないトークンを消す
        /** @type {(TokenWithSourceMap & { startOffset: number, endOffset: number })[]} */
        //@ts-ignore
        const tokens = [...lexerOutput.tokens, ...lexerOutput.commentTokens].filter((t) =>
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
    })
}

/**
 * エディタ上にエラーメッセージの波線とgutterの赤いマークとエラーメッセージのポップアップを設定するためのクラス。
 */
class EditorMarkers {
    /**
     * @param {any} session
     * @param {Document} doc
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
     * @param {string} message
     */
    add(startLine, startColumn, endLine, endColumn, message) {
        if (this.disable) {
            return
        }
        if (startColumn === null) {
            startColumn = 0
        }
        if (endLine === null) {
            endLine = startLine
        }
        if (endColumn === null) {
            endColumn = this.doc.getLine(startLine).length
        }

        // 最低でも1文字分の長さをとる
        if (startLine === endLine && startColumn === endColumn) {
            endColumn++
        }

        this.markers.push(this.session.addMarker(new this.AceRange(startLine, startColumn, endLine, endColumn), "marker-red", "text", false))
        this.session.setAnnotations([{ row: startLine, column: startColumn, text: message, type: 'error' }])
        this.hasAnnotations = true
    }

    /**
     * @param {string} code
     * @param {number} startOffset
     * @param {number} endOffset
     * @param {string} message
     */
    addByOffset(code, startOffset, endOffset, message) {
        const offsetToLineColumn = new OffsetToLineColumn(code)
        const start = offsetToLineColumn.map(startOffset, false)
        const end = offsetToLineColumn.map(endOffset, false)
        this.add(start.line, start.column, end.line, end.column, message)
    }

    /**
     * @param {string} code
     * @param {{
     *     line?: number
     *     startOffset?: number | null
     *     endOffset?: number | null
     *     message: string
     * }} error
     */
    addByError(code, error) {
        if (typeof error.startOffset === 'number' && typeof error.endOffset === 'number') {
            // 完全な位置を取得できる場合
            this.addByOffset(code, error.startOffset, error.endOffset, error.message)
        } else if (typeof error.line === 'number') {
            // 行全体の場合
            this.add(error.line, null, null, null, error.message)
        } else {
            // 位置が不明な場合
            this.add(0, null, null, null, error.message)
        }
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
 */
class BackgroundTokenizer {
    /**
     * @param {Document} doc
     * @param {any} _signal
     * @param {WebNakoCompiler} nako3
     * @param {EditorMarkers} editorMarkers
     */
    constructor(doc, _signal, nako3, editorMarkers) {
        this._signal = _signal
        this.doc = doc
        this.dirty = true
        this.nako3 = nako3
        this.editorMarkers = editorMarkers

        // オートコンプリートで使うために、直近のtokenizeの結果を保存しておく
        /** @type {ReturnType<WebNakoCompiler['lex']> | null} */
        this.lastLexerOutput = null

        // 各行のパース結果。
        // typeはscopeのこと。配列の全要素のvalueを結合した文字列がその行の文字列と等しくなる必要がある。
        /** @type {{ type: string, value: string }[][]} */
        this.lines = this.doc.getAllLines().map((line) => [{ type: 'markup.other', value: line }])

        // this.lines は外部から勝手に編集されてしまうため、コピーを持つ
        /** @type {{ code: string, lines: string } | null} */
        this.cache = null

        const update = () => {
            // 6000行以上は時間がかかりすぎるためシンタックスハイライトを行わない。
            if (this.dirty && this.doc.getLength() < 6000) {
                const startTime = Date.now()
                this.dirty = false
                const code = this.doc.getAllLines().join('\n')
                try {
                    const out = tokenize(this.doc.getAllLines(), nako3)
                    this.lastLexerOutput = out.lexerOutput
                    this.lines = out.editorTokens
                    this.cache = { code, lines: JSON.stringify(this.lines) }

                    // ファイル全体の更新を通知する。
                    _signal('update', { data: { first: 0, last: this.doc.getLength() - 1 } })
                } catch (e) {
                    editorMarkers.addByError(code, e)
                }
                // tokenizeに時間がかかる場合、文字を入力できるように次回の実行を遅くする。最大で5秒まで遅らせる。
                setTimeout(update, Math.max(100, Math.min(5000, (Date.now() - startTime) * 5)))
            } else {
                setTimeout(update, 100)
            }
        }
        update()
    }

    /**
     * テキストに変更があったときに呼ばれる。IME入力中には呼ばれない。
     * @param {{ action: string, start: { row: number, column: number }, end: { row: number, column: number }, lines: string[] }} delta
     */
    $updateOnChange(delta) {
        this.editorMarkers.clear()
        this.dirty = true
        const startRow = delta.start.row
        const endRow = delta.end.row
        if (startRow === endRow) { // 1行の編集
            if (delta.action === 'insert' && this.lines[startRow]) { // 行内に文字列を挿入
                const columnStart = delta.start.column
                // updateOnChangeはIME入力中には呼ばれない。composition_placeholder を消さないとIME確定後の表示がずれる。
                const oldTokens = this.lines[startRow]
                    .filter((v) => v.type !== 'composition_placeholder')
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
                    newTokens.push({ type: oldTokens[i].type, value: oldTokens[i].value.slice(0, columnStart - offset) })
                    newTokens.push({ type: 'markup.other', value: delta.lines[0] })
                    newTokens.push({ type: oldTokens[i].type, value: oldTokens[i].value.slice(columnStart - offset)　})
                    i++
                } else {
                    newTokens.push({ type: 'markup.other', value: delta.lines[0] })
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

            // 2000行以下のときは、1文字打つたびにシンタックスハイライトを更新する。
            if (this.doc.getLength() < 2000) {
                // tokenizeは非常に遅いため、キャッシュを使えるならそれを使う。
                const code = this.doc.getAllLines().join('\n')
                if (this.cache !== null && this.cache.code === code) {
                    ok = true
                } else {
                    try {
                        const lines = tokenize(this.doc.getAllLines(), this.nako3)
                        this.cache = { code, lines: JSON.stringify(lines) }
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
     * @param {WebNakoCompiler} nako3
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
        return /^\s*ここまで$/.test(line + input)
    }

    /**
     * checkOutdentがtrueを返したときに呼ばれる。
     * @param {string} state
     * @param {{ doc: Document }} session
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
     * 各行についてこの関数が呼ばれる。'start'を返した行はfold可能な範囲の先頭の行になる。
     * @param {Session} session
     * @param {string} foldStyle
     * @param {number} row
     * @returns {'start' | ''}
     */
    getFoldWidget({doc}, foldStyle, row) {
        return this.getBlockStructure(doc.getAllLines().join('\n')).pairs.some((v) => v[0] === row) ? 'start' : ''
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
 * ace/ext/language_tools の設定がグローバル変数で保持されているため、こちら側でもグローバル変数で管理しないと、エディタが複数あるときに正しく動かない。
 * @type {{
 *     getCompletions(
 *         editor: any,
 *         session: Session,
 *         pos: { row: number, column: number },
 *         prefix: any,
 *         callback: (
 *             a: null,
 *             b: { meta: string, caption: string, value: string, score: number }[]
 *         ) => void
 *     ): void
 *     getDocTooltip?(item: any): void
 * }[]}
 */
const completers = []

/**
 * 指定したidのHTML要素をなでしこ言語のエディタにする。
 * 
 * - ace editor がグローバルに読み込まれている必要がある。
 * - wnako3_editor.css を読み込む必要がある。
 * - readonly にするには data-nako3-readonly="true" を設定する。
 * - エラー位置の表示を無効化するには data-nako3-disable-marker="true" を設定する。
 * 
 * @param {string} id HTML要素のid
 * @param {WebNakoCompiler} nako3
 * @param {any} ace
 */
function setupEditor (id, nako3, ace) {
    const editor = ace.edit(id)
    const element = document.getElementById(id)
    if (element === null) {
        throw new Error(`idが ${id} のHTML要素は存在しません。`)
    }

    const AceRange = ace.require('ace/range').Range
    const editorMarkers = new EditorMarkers(
        editor.session,
        editor.session.bgTokenizer.doc,
        AceRange,
        !!element.dataset.nako3DisableMarker,
    )

    element.classList.add('nako3_editor')
    if (!!element.dataset.nako3Readonly) {
        element.classList.add('readonly')
        editor.setReadOnly(true)
    }
    editor.setFontSize(16)
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
    })

    const backgroundTokenizer = new BackgroundTokenizer(
        editor.session.bgTokenizer.doc,
        editor.session.bgTokenizer._signal.bind(editor.session.bgTokenizer),
        nako3,
        editorMarkers,
    )

    // オートコンプリートを有効化する
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true,
    })

    const editorId = Math.floor(Math.random() * 1000000)
    editor.wnako3_editor_id = editorId

    // オートコンプリートのcompleterを設定する
    completers.push({
        getCompletions(editor, session, pos, prefix, callback) {
            // 全てのエディタのcompleterが呼ばれてしまうため、ここで他のエディタを除外する
            if (editor.wnako3_editor_id !== editorId) {
                callback(null, [])
                return
            }

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
                    result.push({ caption: createParameterDeclaration(f.josi) + name, value: name, meta: `関数 (${pluginName})`, score: getScore(name) })
                } else {
                    result.push({ caption: name, value: name, meta: (f.type === 'const' ? '定数' : '変数') + `(${pluginName})`, score: getScore(name) })
                }
            }

            // ユーザーが定義した名前
            if (backgroundTokenizer.lastLexerOutput !== null) {
                for (const token of backgroundTokenizer.lastLexerOutput.tokens) {
                    if (token.type === 'word' || token.type === 'func') {               
                        // 同じ行のトークンの場合、自分自身にマッチしている可能性が高いため除外
                        if (token.line === pos.row) {
                            continue
                        }
                        const name = token.value + ''
                        result.push({ caption: name, value: name, meta: token.type === 'word' ? '変数' : '関数', score: getScore(name) })
                    }
                }
            }

            // 完全に一致する候補があればオートコンプリートしない
            if (result.some((v) => v.value === prefix)) {
                console.log('完全一致')
                console.log(result)
                callback(null, [])
                return
            }

            callback(null, result)
        }
    })
    ace.require('ace/ext/language_tools').setCompleters(completers)

    // オートコンプリートの単語の区切りが日本語に対応していないため、メソッドを上書きして対応させる。
    // この関数は文字を入力するたびに呼ばれ、''以外を返すとその文字列を基にしてautocompletionが始まる。
    ace.require('ace/autocomplete/util').getCompletionPrefix = (editor) => {
        /** @type {{ row: number, column: number }} */
        const pos = editor.getCursorPosition()
        /** @type {string} */
        const line = editor.session.getLine(pos.row).slice(0, pos.column)
        /** @type {ReturnType<WebNakoCompiler['lex']>["tokens"] | null} */
        let tokens = null

        // アルファベットとカタカナと漢字のみオートコンプリートする。
        // - ひらがなは助詞を打っているときに邪魔になるため除外する。
        // - 数値も必要性が薄いため除外する。
        // - アンダースコアは改行のための演算子で使うときに邪魔になるため除外する。
        if (line.length === 0 || !/[a-zA-Zァ-ヶー\u3005\u4E00-\u9FCF]/.test(line[line.length - 1])) {
            console.log('ひらがなや数値')
            return ''
        }

        // 現在の行のカーソルより前の部分をlexerにかける。速度を優先して1行だけ処理する。
        try {
            tokens = nako3.lex(line, 'completion.nako3').tokens
                .filter((t) => t.type !== 'eol' && t.type !== 'eof')
        } catch (e) {
            if (!(e instanceof NakoIndentError || e instanceof LexError)) {
                console.error(e)
            }
        }
        if (tokens === null || tokens.length === 0 || !tokens[tokens.length - 1].value) {
            console.log('no token')
            return ''
        }

        // 最後のトークンの値を、オートコンプリートで既に入力した部分とする。
        return tokens[tokens.length - 1].value + ''
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
    editor.session.resetCaches()

    editor.setTheme("ace/theme/xcode")

    return { editor, editorMarkers }
}

module.exports = {
    tokenize,
    setupEditor,
    LanguageFeatures,
}
