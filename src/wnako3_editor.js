/** なでしこのtokenのtypeをscope（CSSのクラス名）に変換する。 */

const WebNakoCompiler = require("./wnako3")
const { OffsetToLineColumn } = require("./nako_source_mapping")
const { LexError } = require("./nako_lex_error")
const NakoIndentError = require("./nako_indent_error")

/**
 * @typedef {import("./nako_lexer").TokenWithSourceMap} TokenWithSourceMap
 * 
 * @typedef {{ getLine(row: number): string, getAllLines(): string[], getLength(): number }} Document
 * 
 * @typedef {new (startLine: number, startColumn: number, endLine: number, endColumn: number) => any} TypeofAceRange
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
        /** @type {{ type: string, value: string }[][]} */
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
                editorTokens[i].push({ type: getScope(tokens[tokenIndex]), value: lines[i] })
            } else {
                // 行頭をまたがっているトークンが存在する場合
                if (tokenIndex < tokens.length &&
                    tokens[tokenIndex].startOffset <= lineStartOffset) {
                    editorTokens[i].push({ type: getScope(tokens[tokenIndex]), value: code.slice(offset, tokens[tokenIndex].endOffset) })
                    offset = tokens[tokenIndex].endOffset
                    tokenIndex++
                }

                // 行頭も行末もまたがっていないトークンを処理する
                while (tokenIndex < tokens.length &&
                    tokens[tokenIndex].endOffset < lineEndOffset) {
                    // このトークンと直前のトークンの間に隙間があるなら、埋める
                    if (offset < tokens[tokenIndex].startOffset) {
                        editorTokens[i].push({ type: 'markup.other', value: code.slice(offset, tokens[tokenIndex].startOffset) })
                        offset = tokens[tokenIndex].startOffset
                    }

                    // 現在のトークンを使う
                    editorTokens[i].push({ type: getScope(tokens[tokenIndex]), value: code.slice(offset, tokens[tokenIndex].endOffset) })
                    offset = tokens[tokenIndex].endOffset
                    tokenIndex++
                }

                // 行末をまたがっているトークンが存在する場合
                if (tokenIndex < tokens.length &&
                    tokens[tokenIndex].startOffset < lineEndOffset) {
                    // トークンの前の隙間
                    if (offset < tokens[tokenIndex].startOffset) {
                        editorTokens[i].push({ type: 'markup.other', value: code.slice(offset, tokens[tokenIndex].startOffset) })
                        offset = tokens[tokenIndex].startOffset
                    }

                    // トークンを使う
                    editorTokens[i].push({ type: getScope(tokens[tokenIndex]), value: code.slice(tokens[tokenIndex].startOffset, lineEndOffset) })
                } else {
                    editorTokens[i].push({ type: 'markup.other', value: code.slice(offset, lineEndOffset) })
                }
            }

            lineStartOffset += lines[i].length + 1
        }

        return editorTokens
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
                    this.lines = tokenize(this.doc.getAllLines(), nako3)
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
    const editorMarkers = new EditorMarkers(
        editor.session,
        editor.session.bgTokenizer.doc,
        ace.require('ace/range').Range,
        !!element.dataset.nako3DisableMarker,
    )

    element.classList.add('nako3_editor')
    if (!!element.dataset.nako3Readonly) {
        element.classList.add('readonly')
        editor.setReadOnly(true)
    }
    editor.setFontSize(16)

    // 今走っている background tokenizer を止める
    editor.session.bgTokenizer.stop()

    // background tokenizer を上書きする
    editor.session.bgTokenizer = new BackgroundTokenizer(
        editor.session.bgTokenizer.doc,
        editor.session.bgTokenizer._signal.bind(editor.session.bgTokenizer),
        nako3,
        editorMarkers,
    )

    // セッションをリセットする
    editor.session.resetCaches()

    editor.setTheme("ace/theme/xcode")

    return { editor, editorMarkers }
}

module.exports = {
    tokenize,
    setupEditor,
}
