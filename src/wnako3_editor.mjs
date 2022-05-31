// @ts-nocheck
/* eslint-disable no-template-curly-in-string */
/** なでしこのtokenのtypeをscope（CSSのクラス名）に変換する。 */
import { OffsetToLineColumn } from '../core/src/nako_source_mapping.mjs';
import { NakoError } from '../core/src/nako_errors.mjs';
import NakoIndent from '../core/src/nako_indent.mjs';
import { NakoPrepare } from '../core/src/nako_prepare.mjs';
// alias
const getBlockStructure = NakoIndent.getBlockStructure;
const getIndent = NakoIndent.getIndent;
const countIndent = NakoIndent.countIndent;
const isIndentSyntaxEnabled = NakoIndent.isIndentSyntaxEnabled;
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
 *     commands: { addCommand(data: { name: string, exec: (editor: AceEditor, args: any[]) => void }): void }
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
 * @typedef {string} TokenType
 * @typedef {{ type: TokenType, value: string, docHTML: string | null }} EditorToken
 *
 * @typedef {{ start: { row: number }, command: { id: string, title: string, arguments: string[] } }} CodeLens
 */
/**
 * シンタックスハイライトでは一般にテキストの各部分に 'comment.line' のようなラベルを付け、各エディタテーマがそのそれぞれの色を設定する。
 * ace editor では例えば 'comment.line' が付いた部分はクラス .ace_comment.ace_line が付いたHTMLタグで囲まれ、各テーマはそれに対応するCSSを実装する。
 * @param {TokenWithSourceMap} token
 * @returns {TokenType}
 */
export function getScope(token) {
    switch (token.type) {
        case 'line_comment': return 'comment.line';
        case 'range_comment': return 'comment.block';
        case 'def_test': return 'keyword.control';
        case 'def_func': return 'keyword.control';
        case 'func': return 'entity.name.function';
        case 'number': return 'constant.numeric';
        // 独立した助詞
        case 'とは':
        case 'ならば':
        case 'でなければ':
            return 'keyword.control';
        // 制御構文
        case 'ここから':
        case 'ここまで':
        case 'もし':
        case '違えば':
        case 'require':
            return 'keyword.control';
        // 予約語
        case '回':
        case '間':
        case '繰り返す':
        case '反復':
        case '抜ける':
        case '続ける':
        case '戻る':
        case '先に':
        case '次に':
        case '代入':
        case '逐次実行':
        case '条件分岐':
        case '取込':
        case 'エラー監視':
        case 'エラー':
        case '変数':
        case '実行速度優先':
            return 'keyword.control';
        case '定める':
        case '定数':
            return 'support.constant';
        // 演算子
        case 'shift_r0':
        case 'shift_r':
        case 'shift_l':
        case 'gteq':
        case 'lteq':
        case 'noteq':
        case 'eq':
        case 'not':
        case 'gt':
        case 'lt':
        case 'and':
        case 'or':
        case '@':
        case '+':
        case '-':
        case '*':
        case '/':
        case '%':
        case '^':
        case '&':
            return 'keyword.operator';
        case 'string':
        case 'string_ex':
            return 'string.other';
        case 'word':
            if (['そう', 'それ', '回数', '対象キー', '対象'].includes(token.value)) {
                return 'variable.language';
            }
            else {
                return 'variable.other';
            }
        default:
            return 'markup.other';
    }
}
/**
 * @param {TokenWithSourceMap} compilerToken
 * @param {NakoCompiler} nako3
 * @param {string} value
 * @param {boolean} includesLastCharacter
 * @param {boolean} underlineJosi
 */
export function getEditorTokens(compilerToken, nako3, value, includesLastCharacter, underlineJosi) {
    const type = getScope(compilerToken);
    const docHTML = getDocumentationHTML(compilerToken, nako3);
    // 助詞があれば助詞の部分を分割する。
    // 最後の文字が現在の行に含まれないときは助詞を表示しない。そうしないと例えば `「文字列\n」を表示` の「列」の部分に下線が引かれてしまう。
    if (compilerToken.rawJosi && value.length >= compilerToken.rawJosi.length && includesLastCharacter && underlineJosi) {
        return [
            { type, docHTML, value: value.slice(0, -compilerToken.rawJosi.length) },
            { type: type + '.markup.underline', docHTML, value: value.slice(-compilerToken.josi.length) }
        ];
    }
    return [
        { type, docHTML, value }
    ];
}
/**
 * `name` が定義されたプラグインの名前を返す。
 * @param {string} name
 * @param {NakoCompiler} nako3
 * @returns {string | null}
 */
export function findPluginName(name, nako3) {
    for (const pluginName of Object.keys(nako3.__module)) {
        if (Object.keys(nako3.__module[pluginName]).includes(name)) {
            return pluginName;
        }
    }
    return null;
}
/**
 * i = 0, 1, 2, ... に対して 'A', 'B', 'C', ... 'Z', 'AA', 'AB', ... を返す。
 * @param {number} i
 * @returns {string}
 */
export function createParameterName(i) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return i.toString(26).split('').map((v) => alphabet[parseInt(v, 26)]).join('');
}
/**
 * パラメータの定義を表す文字列を生成する。例えば `[['と', 'の'], ['を']]` に対して `'（Aと|Aの、Bを）'` を返す、パラメータが無い場合、空文字列を返す。
 * @param {string[][]} josi
 * @retunrs {string}
 */
export function createParameterDeclaration(josi) {
    const args = josi.map((union, i) => union.map((v) => `${createParameterName(i)}${v}`).join('|')).join('、');
    if (args !== '') {
        return `（${args}）`;
    }
    else {
        return '';
    }
}
// https://stackoverflow.com/a/6234804
/** @param {string} t */
export function escapeHTML(t) {
    return t
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
/**
 * 関数のドキュメントを返す。
 * @param {TokenWithSourceMap} token
 * @param {NakoCompiler} nako3
 * @returns {string | null}
 */
export function getDocumentationHTML(token, nako3) {
    /** @param {string} text */
    const meta = (text) => `<span class="tooltip-plugin-name">${escapeHTML(text)}</span>`;
    if (token.type === 'func') {
        /** @type {string | null} */
        const pluginName = findPluginName(token.value + '', nako3) || (token.meta && token.meta.file ? token.meta.file : null);
        const josi = (token.meta && token.meta.josi) ? createParameterDeclaration(token.meta.josi) : ''; // {関数} のとき token.meta.josi が存在しない
        if (pluginName) {
            return escapeHTML(josi + token.value) + meta(pluginName);
        }
        return escapeHTML(josi + token.value);
    }
    else if (token.type === 'word') {
        /** @type {string | null} */
        const pluginName = findPluginName(token.value + '', nako3) || (token.meta && token.meta.file ? token.meta.file : null);
        if (pluginName) {
            return escapeHTML(token.value + '') + meta(pluginName);
        }
    }
    return null;
}
/**
 * ace editor ではエディタの文字列の全ての部分に何らかの `type` を付けなければならない。
 * なでしこのエディタでは 'markup.other' をデフォルト値として使うことにした。
 * @param {number} row
 * @param {AceDocument} doc
 * @returns {EditorToken[]}
 */
const getDefaultTokens = (row, doc) => [{ type: 'markup.other', value: doc.getLine(row), docHTML: null }];
/**
 * 一時的にloggerを無効化する。そうしないとシンタックスハイライトの更新のたびにloggerへコンパイルエラーや警告が送られて、結果のボックスに行が追加されてしまう。
 * @type {<T>(nako3: NakoCompiler, f: () => T) => T}
 */
const withoutLogger = (nako3, f) => {
    const logger = nako3.logger;
    try {
        nako3.replaceLogger();
        return f();
    }
    finally {
        nako3.logger = logger;
    }
};
/**
 * プログラムをlexerでtokenizeした後、ace editor 用のトークン列に変換する。
 * @param lines
 * @param nako3
 * @param underlineJosi
 */
export function tokenize(lines, nako3, underlineJosi) {
    const code = lines.join('\n');
    // 取り込み文を含めてしまうと依存ファイルが大きい時に時間がかかってしまうため、
    // 取り込み文を無視してトークン化してから、依存ファイルで定義された関数名と一致するトークンを関数のトークンへ変換する。
    nako3.reset({ needToClearPlugin: false });
    const lexerOutput = withoutLogger(nako3, () => nako3.lex(code, 'main.nako3', undefined, true));
    lexerOutput.commentTokens = lexerOutput.commentTokens.filter((t) => t.file === 'main.nako3');
    lexerOutput.requireTokens = lexerOutput.requireTokens.filter((t) => t.file === 'main.nako3');
    lexerOutput.tokens = lexerOutput.tokens.filter((t) => t.file === 'main.nako3');
    // 外部ファイルで定義された関数名に一致するトークンのtypeをfuncに変更する。
    // 取り込んでいないファイルも参照される問題や、関数名の重複がある場合に正しくない情報を表示する問題がある。
    // eslint-disable-next-line no-lone-blocks
    {
        /** @type {Record<string, object>} */
        for (const [file, { funclist }] of Object.entries(nako3.dependencies)) {
            for (const token of lexerOutput.tokens) {
                if (token.type === 'word' && token.value !== 'それ' && funclist[token.value]) {
                    token.type = 'func';
                    // meta.file に定義元のファイル名を持たせる。
                    token.meta = { ...funclist[token.value + ''], file };
                }
            }
        }
    }
    // eol、eof、長さが1未満のトークン、位置を特定できないトークンを消す
    /** @type {(TokenWithSourceMap & { startOffset: number, endOffset: number })[]} */
    // @ts-ignore
    const tokens = [...lexerOutput.tokens, ...lexerOutput.commentTokens, ...lexerOutput.requireTokens].filter((t) => t.type !== 'eol' && t.type !== 'eof' &&
        typeof t.startOffset === 'number' && typeof t.endOffset === 'number' &&
        t.startOffset < t.endOffset);
    // startOffsetでソートする
    tokens.sort((a, b) => (a.startOffset || 0) - (b.startOffset || 0));
    // 各行について、余る文字の無いようにエディタのトークンに変換する。
    // 複数のトークンが重なることはないと仮定する。
    let lineStartOffset = 0;
    let tokenIndex = 0;
    // 実際に必要なプロパティはtype, valueだけで、docは独自に追加した。
    /** @type {EditorToken[][]} */
    const editorTokens = []; // 各行のエディタのトークン
    for (let i = 0; i < lines.length; i++) {
        editorTokens.push([]);
        const lineEndOffset = lineStartOffset + lines[i].length;
        let offset = lineStartOffset;
        // 現在の行にかかっているトークンまで飛ばす
        while (tokenIndex < tokens.length &&
            tokens[tokenIndex].endOffset <= lineStartOffset) {
            tokenIndex++;
        }
        // 行全体を完全にまたがっているトークンが存在する場合
        if (tokenIndex < tokens.length &&
            tokens[tokenIndex].startOffset <= lineStartOffset &&
            tokens[tokenIndex].endOffset >= lineEndOffset) {
            editorTokens[i].push(...getEditorTokens(tokens[tokenIndex], nako3, lines[i], tokens[tokenIndex].endOffset <= lineEndOffset, underlineJosi));
        }
        else {
            // 行頭をまたがっているトークンが存在する場合
            if (tokenIndex < tokens.length &&
                tokens[tokenIndex].startOffset <= lineStartOffset) {
                editorTokens[i].push(...getEditorTokens(tokens[tokenIndex], nako3, code.slice(offset, tokens[tokenIndex].endOffset), true, underlineJosi));
                offset = tokens[tokenIndex].endOffset;
                tokenIndex++;
            }
            // 行頭も行末もまたがっていないトークンを処理する
            while (tokenIndex < tokens.length &&
                tokens[tokenIndex].endOffset < lineEndOffset) {
                // このトークンと直前のトークンの間に隙間があるなら、埋める
                if (offset < tokens[tokenIndex].startOffset) {
                    editorTokens[i].push({
                        type: 'markup.other',
                        docHTML: null,
                        value: code.slice(offset, tokens[tokenIndex].startOffset)
                    });
                    offset = tokens[tokenIndex].startOffset;
                }
                // 現在のトークンを使う
                editorTokens[i].push(...getEditorTokens(tokens[tokenIndex], nako3, code.slice(offset, tokens[tokenIndex].endOffset), true, underlineJosi));
                offset = tokens[tokenIndex].endOffset;
                tokenIndex++;
            }
            // 行末をまたがっているトークンが存在する場合
            if (tokenIndex < tokens.length &&
                tokens[tokenIndex].startOffset < lineEndOffset) {
                // トークンの前の隙間
                if (offset < tokens[tokenIndex].startOffset) {
                    editorTokens[i].push({
                        type: 'markup.other',
                        docHTML: null,
                        value: code.slice(offset, tokens[tokenIndex].startOffset)
                    });
                    offset = tokens[tokenIndex].startOffset;
                }
                // トークンを使う
                editorTokens[i].push(...getEditorTokens(tokens[tokenIndex], nako3, code.slice(tokens[tokenIndex].startOffset, lineEndOffset), tokens[tokenIndex].endOffset <= lineEndOffset, underlineJosi));
            }
            else {
                editorTokens[i].push({
                    type: 'markup.other',
                    docHTML: null,
                    value: code.slice(offset, lineEndOffset)
                });
            }
        }
        lineStartOffset += lines[i].length + 1;
    }
    return { editorTokens, lexerOutput };
}
/**
 * エディタ上にエラーメッセージの波線とgutterの赤いマークとエラーメッセージのポップアップを設定するためのクラス。
 */
export class EditorMarkers {
    /**
       * @param {any} session
       * @param {AceDocument} doc
       * @param {TypeofAceRange} AceRange
       * @param {boolean} disable
       */
    constructor(session, doc, AceRange, disable) {
        this.session = session;
        this.doc = doc;
        this.AceRange = AceRange;
        /** @type {any[]} */
        this.markers = [];
        this.hasAnnotations = false;
        this.disable = disable;
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
            startColumn = 0;
        }
        if (endLine === null) {
            endLine = startLine;
        }
        if (endColumn === null) {
            endColumn = getLine(endLine).length;
        }
        // 最低でも1文字分の長さをとる
        if (startLine === endLine && startColumn === endColumn) {
            endColumn++;
        }
        return [startLine, startColumn, endLine, endColumn];
    }
    /**
       * @param {string} code @param {number} startOffset @param {number} endOffset
       * @returns {[number, number, number, number]}
       */
    static fromOffset(code, startOffset, endOffset) {
        const offsetToLineColumn = new OffsetToLineColumn(code);
        const start = offsetToLineColumn.map(startOffset, false);
        const end = offsetToLineColumn.map(endOffset, false);
        return [start.line, start.column, end.line, end.column];
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
            return this.fromOffset(code, error.startOffset, error.endOffset);
        }
        else if (typeof error.line === 'number') {
            // 行全体の場合
            return this.fromNullable(error.line, null, null, null, getLine);
        }
        else {
            // 位置が不明な場合
            return this.fromNullable(0, null, null, null, getLine);
        }
    }
    /**
       * @param {number} startLine
       * @param {number | null} startColumn
       * @param {number | null} endLine
       * @param {number | null} endColumn
       * @param {string} message
       * @param {'warn' | 'error'} type
       */
    add(startLine, startColumn, endLine, endColumn, message, type) {
        if (this.disable) {
            return;
        }
        const range = new this.AceRange(...EditorMarkers.fromNullable(startLine, startColumn, endLine, endColumn, (row) => this.doc.getLine(row)));
        this.markers.push(this.session.addMarker(range, 'marker-' + (type === 'warn' ? 'yellow' : 'red'), 'text', false));
        // typeは 'error' | 'warning' | 'info'
        this.session.setAnnotations([{ row: startLine, column: startColumn, text: message, type: type === 'warn' ? 'warning' : 'error' }]);
        this.hasAnnotations = true;
    }
    /**
       * @param {string} code
       * @param {{ line?: number, startOffset?: number | null, endOffset?: number | null, message: string }} error
       * @param {'warn' | 'error'} type
       */
    addByError(code, error, type) {
        this.add(...EditorMarkers.fromError(code, error, (row) => this.doc.getLine(row)), error.message, type);
    }
    /**
       * 全てのエラーメッセージを削除する。
       */
    clear() {
        for (const marker of this.markers) {
            this.session.removeMarker(marker);
        }
        this.markers.length = 0;
        if (this.hasAnnotations) {
            this.session.clearAnnotations();
            this.hasAnnotations = false;
        }
    }
}
/**
 * ace editor のBackgroundTokenizerを上書きして、シンタックスハイライトを自由に表示するためのクラス。
 * ace editor ではシンタックスハイライトのために正規表現ベースのBackgroundTokenizerクラスを用意し定期的にトークン化を
 * 行っているが、正規表現ではなくなでしこのコンパイラの出力を使うためにはそれを上書きする必要がある。
 */
export class BackgroundTokenizer {
    /**
       * @param {AceDocument} doc
       * @param {NakoCompiler} nako3
       * @param {(firstRow: number, lastRow: number, ms: number) => void} onTokenUpdate
       * @param {(code: string, err: Error) => void} onCompileError
       * @param {boolean} underlineJosi
       */
    constructor(doc, nako3, onTokenUpdate, onCompileError, underlineJosi) {
        this.onUpdate = onTokenUpdate;
        this.doc = doc;
        this.dirty = true;
        this.nako3 = nako3;
        this.onCompileError = onCompileError;
        this.underlineJosi = underlineJosi;
        // オートコンプリートで使うために、直近のtokenizeの結果を保存しておく
        /** @type {ReturnType<NakoCompiler['lex']> | null} */
        this.lastLexerOutput = null;
        // 各行のパース結果。
        // typeはscopeのこと。配列の全要素のvalueを結合した文字列がその行の文字列と等しくなる必要がある。
        /** @type {EditorToken[][]} */
        this.lines = this.doc.getAllLines().map((line) => [{ type: 'markup.other', value: line, docHTML: null }]);
        // this.lines は外部から勝手に編集されてしまうため、コピーを持つ
        /** @type {{ code: string, lines: string } | null} */
        this.cache = null;
        this.deleted = false;
        /** @public */
        this.enabled = true;
        const update = () => {
            if (this.deleted) {
                return;
            }
            if (this.dirty && this.enabled) {
                const startTime = Date.now();
                this.dirty = false;
                const code = this.doc.getAllLines().join('\n');
                try {
                    const startTime = Date.now();
                    const out = tokenize(this.doc.getAllLines(), nako3, this.underlineJosi);
                    this.lastLexerOutput = out.lexerOutput;
                    this.lines = out.editorTokens;
                    this.cache = { code, lines: JSON.stringify(this.lines) };
                    // ファイル全体の更新を通知する。
                    onTokenUpdate(0, this.doc.getLength() - 1, Date.now() - startTime);
                }
                catch (e) {
                    onCompileError(code, e);
                }
                // tokenizeに時間がかかる場合、文字を入力できるように次回の実行を遅くする。
                setTimeout(update, Math.max(100, Math.min(5000, (Date.now() - startTime) * 5)));
            }
            else {
                setTimeout(update, 100);
            }
        };
        // コンストラクタが返る前にコールバックを呼ぶのはバグの元になるため一瞬待つ。
        // たとえば `const a = new BackgroundTokenizer(..., () => { /* aを使った処理 */ }, ...)` がReferenceErrorになる。
        setTimeout(() => { update(); }, 0);
    }
    dispose() {
        this.deleted = true;
    }
    /**
       * テキストに変更があったときに呼ばれる。IME入力中には呼ばれない。
       * @param {{ action: string, start: { row: number, column: number }, end: { row: number, column: number }, lines: string[] }} delta
       */
    $updateOnChange(delta) {
        this.dirty = true;
        const startRow = delta.start.row;
        const endRow = delta.end.row;
        if (startRow === endRow) { // 1行の編集
            if (delta.action === 'insert' && this.lines[startRow]) { // 行内に文字列を挿入
                const columnStart = delta.start.column;
                // updateOnChangeはIME入力中には呼ばれない。composition_placeholder を消さないとIME確定後の表示がずれる。
                const oldTokens = this.lines[startRow]
                    .filter((v) => v.type !== 'composition_placeholder');
                /** @type {EditorToken[]} */
                const newTokens = [];
                let i = 0;
                let offset = 0;
                // columnStartより左のトークンはそのまま保持する
                while (i < oldTokens.length && offset + oldTokens[i].value.length <= columnStart) {
                    newTokens.push(oldTokens[i]);
                    offset += oldTokens[i].value.length;
                    i++;
                }
                // columnStartに重なっているトークンがあれば、2つに分割する
                if (i < oldTokens.length && offset < columnStart) {
                    newTokens.push({ type: oldTokens[i].type, value: oldTokens[i].value.slice(0, columnStart - offset), docHTML: null });
                    newTokens.push({ type: 'markup.other', value: delta.lines[0], docHTML: null });
                    newTokens.push({ type: oldTokens[i].type, value: oldTokens[i].value.slice(columnStart - offset), docHTML: null });
                    i++;
                }
                else {
                    newTokens.push({ type: 'markup.other', value: delta.lines[0], docHTML: null });
                }
                // columnStartより右のトークンもそのまま保持する
                while (i < oldTokens.length) {
                    newTokens.push(oldTokens[i]);
                    i++;
                }
                this.lines[startRow] = newTokens;
            }
            else {
                this.lines[startRow] = getDefaultTokens(startRow, this.doc);
            }
        }
        else if (delta.action === 'remove') { // 範囲削除
            this.lines.splice(startRow, endRow - startRow + 1, getDefaultTokens(startRow, this.doc));
        }
        else { // 行の挿入
            this.lines.splice(startRow, 1, ...Array(endRow - startRow + 1).fill(null).map((_, i) => getDefaultTokens(i + startRow, this.doc)));
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
            let ok = false;
            if (this.enabled) {
                // tokenizeは非常に遅いため、キャッシュを使えるならそれを使う。
                const code = this.doc.getAllLines().join('\n');
                if (this.cache !== null && this.cache.code === code) {
                    ok = true;
                }
                else {
                    try {
                        const lines = tokenize(this.doc.getAllLines(), this.nako3, this.underlineJosi);
                        this.cache = { code, lines: JSON.stringify(lines.editorTokens) };
                        ok = true;
                    }
                    catch (e) {
                        if (!(e instanceof NakoError)) {
                            console.error(e);
                        }
                    }
                }
            }
            if (ok && this.cache !== null) {
                this.lines[row] = JSON.parse(this.cache.lines)[row];
            }
            else {
                this.lines[row] = getDefaultTokens(row, this.doc);
            }
        }
        return this.lines[row];
    }
    // ace側から呼ばれるが無視するメソッド
    // @ts-ignore
    start(startRow) { }
    // @ts-ignore
    fireUpdateEvent(firstRow, lastRow) { }
    // @ts-ignore
    setDocument(doc) { }
    scheduleStart() { }
    // @ts-ignore
    setTokenizer(tokenizer) { }
    stop() { }
    // @ts-ignore
    getState(row) { return 'start'; }
}
/**
 * シンタックスハイライト以外のエディタの挙動の定義。
 */
export class LanguageFeatures {
    /**
       * @param {TypeofAceRange} AceRange
       * @param {NakoCompiler} nako3
       */
    constructor(AceRange, nako3) {
        this.AceRange = AceRange;
        this.nako3 = nako3;
    }
    /**
       * Ctrl + / の動作の定義。
       * @param {string} state
       * @param {Session} session
       * @param {number} startRow
       * @param {number} endRow
       */
    static toggleCommentLines(state, { doc }, startRow, endRow) {
        const prepare = NakoPrepare.getInstance();
        /**
             * @param {string} line
             * @returns {{ type: 'blank' | 'code' } | { type: 'comment', start: number, len: number }}
             */
        const parseLine = (line) => {
            // 先頭の空白を消す
            const indent = getIndent(line);
            if (indent === line) {
                return { type: 'blank' };
            }
            line = line.substring(indent.length);
            // 先頭がコメントの開始文字かどうか確認する
            const ch2 = line.substring(0, 2).split('').map((c) => prepare.convert1ch(c)).join('');
            if (ch2.substring(0, 1) === '#') {
                return { type: 'comment', start: indent.length, len: 1 + (line.charAt(1) === ' ' ? 1 : 0) };
            }
            if (ch2 === '//') {
                return { type: 'comment', start: indent.length, len: 2 + (line.charAt(2) === ' ' ? 1 : 0) };
            }
            return { type: 'code' };
        };
        /** @type {number[]} */
        const rows = [];
        for (let i = startRow; i <= endRow; i++) {
            rows.push(i);
        }
        // 全ての行が空白行ならコメントアウト、全ての行が行コメントで始まるか空白行ならアンコメント、そうでなければコメントアウト。
        if (!rows.every((row) => parseLine(doc.getLine(row)).type === 'blank') &&
            rows.every((row) => parseLine(doc.getLine(row)).type !== 'code')) {
            // アンコメント
            for (const row of rows) {
                // 行コメントで始まる行ならアンコメントする。
                // 行コメントの直後にスペースがあるなら、それも1文字だけ削除する。
                const line = parseLine(doc.getLine(row));
                if (line.type === 'comment') {
                    doc.removeInLine(row, line.start, line.start + line.len);
                }
            }
        }
        else {
            // 最もインデントの低い行のインデント数を数える
            const minIndent = Math.min(...rows.map((row) => countIndent(doc.getLine(row))));
            // コメントアウトする
            for (const row of rows) {
                const line = doc.getLine(row);
                let column = line.length;
                for (let i = 0; i < line.length; i++) {
                    if (countIndent(line.slice(0, i)) >= minIndent) {
                        column = i;
                        break;
                    }
                }
                doc.insertInLine({ row, column }, '// ');
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
        // eslint-disable-next-line no-irregular-whitespace
        return /^[ 　・\t]*ここまで$/.test(line + input);
    }
    /**
       * checkOutdentがtrueを返したときに呼ばれる。
       * @param {string} state
       * @param {Session} session
       * @param {number} row
       * @returns {void}
       */
    autoOutdent(state, { doc }, row) {
        // 1行目なら何もしない
        if (row === 0) {
            return;
        }
        const prevLine = doc.getLine(row - 1);
        let indent;
        if (LanguageFeatures.isBlockStart(prevLine)) {
            // 1つ前の行が「〜ならば」などのブロック開始行なら、その行に合わせる。
            indent = getIndent(prevLine);
        }
        else {
            // そうでなければ、1つ前の行のインデントから1段階outdentした位置に合わせる。
            const s = this.getBlockStructure(doc.getAllLines().join('\n'));
            const parent = s.parents[row];
            indent = parent !== null ? s.spaces[parent] : '';
        }
        // 置換する
        const oldIndent = getIndent(doc.getLine(row));
        doc.replace(new this.AceRange(row, 0, row, oldIndent.length), indent);
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
            return getIndent(line) + tab;
        }
        return getIndent(line);
    }
    /** @param {string} line */
    static isBlockStart(line) {
        // eslint-disable-next-line no-irregular-whitespace
        return /^[ 　・\t]*●|(ならば|なければ|ここから|条件分岐|違えば|回|繰り返(す|し)|の間|反復|とは|には|エラー監視|エラーならば|実行速度優先)、?\s*$/.test(line);
    }
    /**
       * オートコンプリート
       * @param {number} row
       * @param {string} prefix getCompletionPrefixの出力
       * @param {NakoCompiler} nako3
       * @param {BackgroundTokenizer} backgroundTokenizer
       */
    static getCompletionItems(row, prefix, nako3, backgroundTokenizer) {
        /**
             * keyはcaption。metaは候補の横に薄く表示されるテキスト。
             * @type {Map<string, { value: string, meta: Set<string>, score: number }>}
             */
        const result = new Map();
        /** 引数のリストを含まない、関数名だけのリスト @type {Set<string>} */
        const values = new Set();
        /**
             * オートコンプリートの項目を追加する。すでに存在するならマージする。
             * @param {string} caption @param {string} value @param {string} meta
             */
        const addItem = (caption, value, meta) => {
            const item = result.get(caption);
            if (item) {
                item.meta.add(meta);
            }
            else {
                // 日本語の文字数は英語よりずっと多いため、ただ一致する文字数を数えるだけで十分。
                const score = prefix.split('').filter((c) => value.includes(c)).length;
                result.set(caption, { value, meta: new Set([meta]), score });
                values.add(value);
            }
        };
        // プラグイン関数
        for (const name of Object.keys(nako3.__varslist[0])) {
            if (name.startsWith('!')) { // 「!PluginBrowser:初期化」などを除外
                continue;
            }
            const f = nako3.funclist[name];
            if (typeof f !== 'object' || f === null) {
                continue;
            }
            const pluginName = findPluginName(name, nako3) || 'プラグイン';
            if (f.type === 'func') {
                addItem(createParameterDeclaration(f.josi) + name, name, pluginName);
            }
            else {
                addItem(name, name, pluginName);
            }
        }
        // 依存ファイルが定義した関数名
        for (const [file, { funclist }] of Object.entries(nako3.dependencies)) {
            for (const [name, f] of Object.entries(funclist)) {
                const josi = (f && f.type === 'func') ? createParameterDeclaration(f.josi) : '';
                addItem(josi + name, name, file);
            }
        }
        // 現在のファイル内に存在する名前
        if (backgroundTokenizer.lastLexerOutput !== null) {
            for (const token of backgroundTokenizer.lastLexerOutput.tokens) {
                const name = token.value + '';
                // 同じ行のトークンの場合、自分自身にマッチしている可能性が高いため除外する。
                // すでに定義されている場合も、定義ではなく参照の可能性が高いため除外する。
                if (token.line === row || values.has(name)) {
                    continue;
                }
                if (token.type === 'word') {
                    addItem(name, name, '変数');
                }
                else if (token.type === 'func') {
                    const f = nako3.funclist[name];
                    const josi = (f && f.type === 'func') ? createParameterDeclaration(f.josi) : '';
                    addItem(josi + name, name, '関数');
                }
            }
        }
        return Array.from(result.entries()).map(([caption, data]) => ({ caption, ...data, meta: Array.from(data.meta).join(', ') }));
    }
    /**
       * スニペット
       */
    /** @param {string} text */
    static getSnippets(text) {
        // インデント構文が有効化されているなら「ここまで」を消す
        const indentSyntax = isIndentSyntaxEnabled(text);
        /** @param {string} en @param {string} jp @param {string} snippet */
        const item = (en, jp, snippet) => indentSyntax
            ? { caption: en, meta: `\u21E5 ${jp}`, score: 1, snippet: snippet.replace(/\t*ここまで(\n|$)/g, '').replace(/\t/g, '    ') }
            : { caption: en, meta: `\u21E5 ${jp}`, score: 1, snippet: snippet.replace(/\t/g, '    ') };
        return [
            item('if', 'もし〜ならば', 'もし${1:1=1}ならば\n\t${2:1を表示}\n違えば\n\t${3:2を表示}\nここまで\n'),
            item('times', '〜回', '${1:3}回\n\t${2:1を表示}\nここまで\n'),
            item('for', '繰り返す', '${1:N}で${2:1}から${3:3}まで繰り返す\n\t${4:Nを表示}\nここまで\n'),
            item('while', '〜の間', '${1:N<2の間}\n\tN=N+1\nここまで\n'),
            item('foreach', '〜を反復', '${1:[1,2,3]}を反復\n\t${2:対象を表示}\nここまで\n'),
            item('switch', '〜で条件分岐', '${1:N}で条件分岐\n\t${2:1}ならば\n\t\t${3:1を表示}\n\tここまで\n\t${4:2}ならば\n\t\t${5:2を表示}\n\tここまで\n\t違えば\n\t\t${6:3を表示}\n\tここまで\nここまで\n'),
            item('function', '●〜とは', '●（${1:AとBを}）${2:足す}とは\n\t${3:A+Bを戻す}\nここまで\n'),
            item('test', '●テスト:〜とは', '●テスト:${2:足す}とは\n\t1と2を足す\n\tそれと3がASSERT等しい\nここまで\n'),
            item('try', 'エラー監視', 'エラー監視\n\t${1:1のエラー発生}\nエラーならば\n\t${2:2を表示}\nここまで\n')
        ];
    }
    /**
       * @param {string} line
       * @param {NakoCompiler} nako3
       */
    static getCompletionPrefix(line, nako3) {
        /** @type {ReturnType<NakoCompiler['lex']>["tokens"] | null} */
        let tokens = null;
        // ひらがなとアルファベットとカタカナと漢字のみオートコンプリートする。
        if (line.length === 0 || !/[ぁ-んa-zA-Zァ-ヶー\u3005\u4E00-\u9FCF]/.test(line[line.length - 1])) {
            return '';
        }
        // 現在の行のカーソルより前の部分をlexerにかける。速度を優先して1行だけ処理する。
        try {
            nako3.reset();
            tokens = withoutLogger(nako3, () => nako3.lex(line, 'completion.nako3', undefined, true)).tokens
                .filter((t) => t.type !== 'eol' && t.type !== 'eof');
        }
        catch (e) {
            if (!(e instanceof NakoError)) {
                console.error(e);
            }
        }
        if (tokens === null || tokens.length === 0 || !tokens[tokens.length - 1].value) {
            return '';
        }
        const prefix = tokens[tokens.length - 1].value + '';
        // 単語の先頭がひらがなではなく末尾がひらがなのとき、助詞を打っている可能性が高いためオートコンプリートしない。
        if (/[ぁ-ん]/.test(prefix[prefix.length - 1]) && !/[ぁ-ん]/.test(prefix[0])) {
            return '';
        }
        // 最後のトークンの値を、オートコンプリートで既に入力した部分とする。
        return prefix;
    }
    /**
       * 文字を打つたびに各行についてこの関数が呼ばれる。'start'を返した行はfold可能な範囲の先頭の行になる。
       * @param {Session} session
       * @param {string} foldStyle
       * @param {number} row
       * @returns {'start' | ''}
       */
    getFoldWidget({ doc }, foldStyle, row) {
        // 速度が重要なため正規表現でマッチする。
        return LanguageFeatures.isBlockStart(doc.getLine(row)) ? 'start' : '';
    }
    /**
       * getFoldWidgetが'start'を返した行に設置されるfold用のボタンが押されたときに呼ばれる。
       * @param {Session} session
       * @param {string} foldStyle
       * @param {number} row
       * @returns {AceRange | null} foldする範囲
       */
    getFoldWidgetRange({ doc }, foldStyle, row) {
        const pair = this.getBlockStructure(doc.getAllLines().join('\n')).pairs.find((v) => v[0] === row);
        if (pair !== undefined) {
            return new this.AceRange(pair[0], doc.getLine(pair[0]).length, pair[1] - 1, doc.getLine(pair[1] - 1).length);
        }
        return null;
    }
    /**
       * @param {AceDocument} doc
       * @returns {CodeLens[]}
       */
    static getCodeLens(doc) {
        const results = [];
        for (const [row, line] of Array.from(doc.getAllLines().entries())) {
            // eslint-disable-next-line no-irregular-whitespace
            const matches = /^[ 　・\t]*●テスト:(.+?)(?:とは|$)/.exec(line);
            if (matches !== null) {
                results.push({
                    start: { row },
                    command: { title: 'テストを実行', id: 'runTest', arguments: [matches[1]] }
                });
            }
        }
        return results;
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
            this.blockStructure = { code, data: getBlockStructure(code) };
        }
        return this.blockStructure.data;
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
        this.editor = editor;
        this.AceRange = AceRange;
        this.UndoManager = UndoManager;
    }
    /** @param {string} content @returns {EditorTabState} */
    newTab(content) {
        return {
            content,
            cursor: { range: new this.AceRange(0, 0, 0, 0), reversed: false },
            scroll: { left: 0, top: 0 },
            undoManger: new this.UndoManager()
        };
    }
    /** @returns {EditorTabState} */
    getTab() {
        return {
            content: this.editor.getValue(),
            cursor: { range: this.editor.session.selection.getRange(), reversed: this.editor.session.selection.isBackwards() },
            scroll: { left: this.editor.session.getScrollLeft(), top: this.editor.session.getScrollTop() },
            undoManger: this.editor.session.getUndoManager()
        };
    }
    /** @param {EditorTabState} state */
    setTab(state) {
        this.editor.setValue(state.content);
        this.editor.session.selection.setRange(state.cursor.range, state.cursor.reversed);
        this.editor.session.setScrollLeft(state.scroll.left);
        this.editor.session.setScrollTop(state.scroll.top);
        this.editor.session.setUndoManager(state.undoManger);
    }
}
class Options {
    /** @param {AceEditor} editor */
    static save(editor) {
        try {
            /** @type {any} */
            const obj = {};
            for (const key of ['syntaxHighlighting', 'keyboardHandler', 'theme', 'fontSize', 'wrap', 'useSoftTabs', 'tabSize', 'showInvisibles', 'enableLiveAutocompletion', 'indentedSoftWrap', 'underlineJosi']) {
                obj[key] = editor.getOption(key);
            }
            localStorage.setItem('nako3EditorOptions', JSON.stringify(obj));
        }
        catch (e) {
            // JSON.stringify のエラー、localStorageのエラーなど
            console.error(e);
            return null;
        }
    }
    /** @param {AceEditor} editor */
    static load(editor) {
        try {
            if (!window.localStorage) {
                return null;
            }
            const text = window.localStorage.getItem('nako3EditorOptions');
            if (text === null) {
                return null;
            }
            const json = JSON.parse(text);
            if (['ace/keyboard/vscode', 'ace/keyboard/emacs', 'ace/keyboard/sublime', 'ace/keyboard/vim'].includes(json.keyboardHandler)) {
                editor.setOption('keyboardHandler', json.keyboardHandler);
            }
            if (['ace/theme/xcode', 'ace/theme/monokai'].includes(json.theme)) {
                editor.setOption('theme', json.theme);
            }
            if (typeof json.fontSize === 'number') {
                editor.setOption('fontSize', Math.min(48, Math.max(6, json.fontSize)));
            }
            for (const key of ['syntaxHighlighting', 'wrap', 'useSoftTabs', 'showInvisibles', 'enableLiveAutocompletion', 'indentedSoftWrap', 'underlineJosi']) {
                if (typeof json[key] === 'boolean') {
                    editor.setOption(key, json[key]);
                }
            }
            if (typeof json.tabSize === 'number') {
                editor.setOption('tabSize', Math.min(16, Math.max(0, json.tabSize)));
            }
        }
        catch (e) {
            // JSONのパースエラー、localStorageのエラーなど
            console.error(e);
            return null;
        }
    }
    /**
       * OptionPanelクラスをなでしこ用に書き換える。
       * @param {any} OptionPanel
       * @param {AceEditor} editor
       */
    static initPanel(OptionPanel, editor) {
        const panel = new OptionPanel(editor); // editorはエラーが飛ばなければ何でも良い
        // ページ内で一度だけ呼ぶ
        if (this.done) {
            return;
        }
        this.done = true;
        // renderメソッドを呼ぶとrenderOptionGroupにoptionGroups.Main、optionGroups.More が順に渡されることを利用して、optionGroupsを書き換える。
        let isMain = true;
        panel.renderOptionGroup = (group) => {
            if (isMain) { // Main
                for (const key of Object.keys(group)) {
                    delete group[key];
                }
                // スマートフォンでも見れるように、文字数は最小限にする
                group['シンタックスハイライト'] = {
                    path: 'syntaxHighlighting'
                };
                group['キーバインド'] = {
                    path: 'keyboardHandler',
                    type: 'select',
                    items: [
                        { caption: 'VSCode', value: 'ace/keyboard/vscode' },
                        { caption: 'Emacs', value: 'ace/keyboard/emacs' },
                        { caption: 'Sublime', value: 'ace/keyboard/sublime' },
                        { caption: 'Vim', value: 'ace/keyboard/vim' }
                    ]
                };
                group['カラーテーマ'] = {
                    path: 'theme',
                    type: 'select',
                    items: [
                        { caption: 'ライト', value: 'ace/theme/xcode' },
                        { caption: 'ダーク', value: 'ace/theme/monokai' }
                    ]
                };
                group['文字サイズ'] = {
                    path: 'fontSize',
                    type: 'number',
                    defaultValue: 16
                };
                group['行の折り返し'] = {
                    path: 'wrap',
                    type: 'select',
                    items: [
                        { caption: 'なし', value: 'off' },
                        { caption: 'あり', value: 'free' }
                    ]
                };
                group['ソフトタブ'] = [{
                        path: 'useSoftTabs'
                    }, {
                        ariaLabel: 'Tab Size',
                        path: 'tabSize',
                        type: 'number',
                        values: [2, 3, 4, 8, 16]
                    }];
                group['空白文字を表示'] = {
                    path: 'showInvisibles'
                };
                group['常に自動補完'] = {
                    path: 'enableLiveAutocompletion'
                };
                group['折り返した行をインデント'] = {
                    path: 'indentedSoftWrap'
                };
                group['助詞に下線を引く'] = {
                    path: 'underlineJosi'
                };
                isMain = false;
            }
            else { // More
                for (const key of Object.keys(group)) {
                    delete group[key];
                }
            }
        };
        panel.render();
        // 設定メニューは ace/ext/settings_menu.js の showSettingsMenu 関数によって開かれる。
        // showSettingsMenu 関数は new OptionPanel(editor).render() で新しい設定パネルのインスタンスを生成するため、
        // renderメソッドを上書きすることで、生成されたインスタンスにアクセスできる。
        const render = OptionPanel.prototype.render;
        const self = globalThis;
        OptionPanel.prototype.render = function (...args) {
            render.apply(this, ...args); // 元の処理
            // OptionPanel.setOption() で発火される setOption イベントをキャッチする
            this.on('setOption', () => {
                console.log('設定を保存しました。');
                self.save(this.editor);
            });
        };
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
const completers = [];
let editorIdCounter = 0;
/**
 * 指定したidのHTML要素をなでしこ言語のエディタにする。
 *
 * - ace editor がグローバルに読み込まれている必要がある。
 * - wnako3_editor.css を読み込む必要がある。
 * - readonly にするには data-nako3-readonly="true" を設定する。
 * - エラー位置の表示を無効化するには data-nako3-disable-marker="true" を設定する。
 * - 縦方向にリサイズ可能にするには nako3-resizable="true" を設定する。
 * - デバイスが遅いときにシンタックスハイライトを無効化する機能を切るには nako3-force-syntax-highlighting="true" を設定する。
 *
 * @param {string | Element} idOrElement HTML要素
 * @param {import('./wnako3')} nako3
 * @param {any} ace
 */
export function setupEditor(idOrElement, nako3, ace) {
    /** @type {AceEditor} */
    const editor = ace.edit(idOrElement);
    const element = typeof idOrElement === 'string' ? document.getElementById(idOrElement) : idOrElement;
    if (element === null) {
        throw new Error(`idが ${idOrElement} のHTML要素は存在しません。`);
    }
    /** @type {TypeofAceRange} */
    const AceRange = ace.require('ace/range').Range;
    const editorMarkers = new EditorMarkers(editor.session, editor.session.bgTokenizer.doc, AceRange, !!element.dataset.nako3DisableMarker);
    if (element.classList.contains('nako3_ace_mounted')) {
        // 同じエディタを誤って複数回初期化すると、ace editor の挙動を書き換えているせいで
        // 意図しない動作をしたため、すでにエディタとして使われていないことを確認する。
        throw new Error('なでしこ言語のエディタの初期化処理を同一のHTML要素に対して複数回適用しました。');
    }
    // lang="ja" があると表示がずれる問題の修正 #839
    element.setAttribute('lang', 'en');
    // 以前のバージョンではnako3_editorをhtmlに直接付けていたため、互換性のためnako3_editorとは別のクラス名を使用する。
    element.classList.add('nako3_ace_mounted');
    element.classList.add('nako3_editor'); // CSSのため
    const readonly = element.dataset.nako3Readonly;
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!readonly) {
        element.classList.add('readonly');
        editor.setReadOnly(true);
    }
    editor.setFontSize(16);
    /** @param {Session} session */
    const resetEditorTokens = (session) => {
        // 一旦テキスト全体を消してから、元に戻す
        /** @type {AceDocument} */
        const doc = session.doc;
        const lines = doc.getAllLines();
        const range = session.selection.getRange();
        doc.removeFullLines(0, doc.getLength());
        doc.insert({ row: 0, column: 0 }, lines.join('\n'));
        session.selection.setRange(range, false);
    };
    ace.require('ace/config').defineOptions(editor.constructor.prototype, 'editor', {
        syntaxHighlighting: {
            /** @type {(this: AceEditor, value: boolean) => void} */
            set: function (value) {
                this.session.bgTokenizer.enabled = value;
                resetEditorTokens(this.session);
            },
            initialValue: true
        },
        underlineJosi: {
            /** @type {(this: AceEditor, value: boolean) => void} */
            set: function (value) {
                this.session.bgTokenizer.underlineJosi = value;
                resetEditorTokens(this.session);
            },
            initialValue: true
        }
    });
    editor.setOptions({
        wrap: 'free',
        indentedSoftWrap: false,
        showPrintMargin: false
    });
    ace.require('ace/keybindings/vscode');
    editor.setKeyboardHandler('ace/keyboard/vscode');
    // ドキュメントのホバー
    const Tooltip = ace.require('ace/tooltip').Tooltip;
    const tooltip = new Tooltip(editor.container);
    const event = ace.require('ace/lib/event');
    event.addListener(editor.renderer.content, 'mouseout', () => {
        // マウスカーソルがエディタの外に出たら、tooltipを隠す
        tooltip.hide();
    });
    editor.on('mousemove', (e) => {
        // マウスカーソルがトークンに重なったときにtooltipを表示する。モバイル端末の場合はトークンにカーソルが当たったときに表示される。
        const pos = e.getDocumentPosition();
        // getTokenAtはcolumnが行末より大きいとき行末のトークンを返してしまう。
        if (pos.column >= e.editor.session.getLine(pos.row).length) {
            tooltip.hide();
            return;
        }
        // getTokenAtは実際よりも1文字右のトークンを取得してしまうため、columnに1を足している。
        /** @type {EditorToken} */
        const token = e.editor.session.getTokenAt(pos.row, pos.column + 1);
        if (token === null || !token.docHTML) {
            // ドキュメントが存在しないトークンならtooltipを表示しない
            tooltip.hide();
            return;
        }
        tooltip.setHtml(token.docHTML);
        tooltip.show(null, e.clientX, e.clientY);
    });
    editor.session.on('change', () => {
        // モバイル端末でドキュメントが存在するトークンを編集するときにツールチップが消えない問題を解消するために、文字を打ったらtooltipを隠す。
        tooltip.hide();
        // 文字入力したらマーカーを消す
        editorMarkers.clear();
    });
    const forceSyntaxHighlighting = !!element.dataset.nako3ForceSyntaxHighlighting;
    let isFirstTime = true;
    const oldBgTokenizer = editor.session.bgTokenizer;
    const backgroundTokenizer = new BackgroundTokenizer(editor.session.bgTokenizer.doc, nako3, (firstRow, lastRow, ms) => {
        oldBgTokenizer._signal('update', { data: { first: firstRow, last: lastRow } });
        // 処理が遅い場合シンタックスハイライトを無効化する。
        if (ms > 220 && editor.getOption('syntaxHighlighting') && !readonly && !forceSyntaxHighlighting && isFirstTime) {
            isFirstTime = false;
            slowSpeedMessage.classList.add('visible');
            editor.setOption('syntaxHighlighting', false);
            setTimeout(() => {
                slowSpeedMessage.classList.remove('visible');
            }, 13000);
        }
    }, (code, err) => { editorMarkers.addByError(code, err, 'error'); }, 
    /** @type {boolean} */ (editor.getOption('underlineJosi')));
    // オートコンプリートを有効化する
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
    });
    const editorId = editorIdCounter++;
    editor.wnako3EditorId = editorId;
    // オートコンプリートのcompleterを設定する
    completers.push({
        getCompletions(editor, session, pos, prefix, callback) {
            if (editor.wnako3EditorId !== editorId) {
                callback(null, []);
            }
            else {
                const items = LanguageFeatures.getCompletionItems(pos.row, prefix, nako3, backgroundTokenizer);
                // 完全に一致する候補があればオートコンプリートしない。（Aceエディタでの挙動が微妙なため。）
                if (items.some((v) => v.value === prefix)) {
                    callback(null, []);
                    return;
                }
                callback(null, items);
            }
        }
    }, { getCompletions(editor, session, pos, prefix, callback) { callback(null, (editor.wnako3EditorId !== editorId) ? [] : LanguageFeatures.getSnippets(editor.session.doc.getAllLines().join('\n'))); } });
    ace.require('ace/ext/language_tools').setCompleters(completers);
    // オートコンプリートの単語の区切りが日本語に対応していないため、メソッドを上書きして対応させる。
    // 文字を入力するたびに呼ばれ、''以外を返すとその文字列をもとにしてautocompletionが始まる。
    ace.require('ace/autocomplete/util').getCompletionPrefix = (/** @type {AceEditor} */ editor) => {
        const pos = editor.getCursorPosition();
        return LanguageFeatures.getCompletionPrefix(editor.session.doc.getLine(pos.row).slice(0, pos.column), nako3);
    };
    // エディタの挙動の設定
    const languageFeatures = new LanguageFeatures(AceRange, nako3);
    const oop = ace.require('ace/lib/oop');
    const TextMode = ace.require('ace/mode/text').Mode;
    const Mode = function () {
        this.HighlightRules = new TextMode().HighlightRules;
        this.foldingRules = {
            getFoldWidget: languageFeatures.getFoldWidget.bind(languageFeatures),
            getFoldWidgetRange: languageFeatures.getFoldWidgetRange.bind(languageFeatures)
        };
    };
    oop.inherits(Mode, TextMode);
    Mode.prototype.toggleCommentLines = LanguageFeatures.toggleCommentLines.bind(LanguageFeatures);
    Mode.prototype.getNextLineIndent = LanguageFeatures.getNextLineIndent.bind(LanguageFeatures);
    Mode.prototype.checkOutdent = LanguageFeatures.checkOutdent.bind(LanguageFeatures);
    Mode.prototype.autoOutdent = languageFeatures.autoOutdent.bind(languageFeatures);
    editor.session.setMode(new Mode());
    // tokenizer （シンタックスハイライト）の上書き
    editor.session.bgTokenizer.stop();
    editor.session.bgTokenizer = backgroundTokenizer;
    editor.setTheme('ace/theme/xcode');
    // 設定メニューの上書き
    // なでしこ用に上書きした設定の削除やテキストの和訳をする。
    Options.load(editor);
    const OptionPanel = ace.require('ace/ext/options').OptionPanel;
    Options.initPanel(OptionPanel, editor);
    // 右下のボタン全体を囲むdiv
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    editor.container.appendChild(buttonContainer);
    // 遅い端末へのメッセージのボタン
    const slowSpeedMessage = document.createElement('span');
    slowSpeedMessage.classList.add('slow-speed-message');
    slowSpeedMessage.innerHTML = '<span>エディタの|応答速度が|低下したため|シンタックス|ハイライトを|無効化|しました。</span>'.replace(/\|/g, '</span><span>');
    buttonContainer.appendChild(slowSpeedMessage);
    // テストの定義の上に「テストを実行」ボタンを表示する
    /** @type {{ name: 'test', callback: (testName: string | undefined) => void }[]} */
    const codeLensListeners = [];
    try {
        const CodeLens = ace.require('ace/ext/code_lens');
        editor.setOption('enableCodeLens', true);
        editor.commands.addCommand({
            name: 'runTest',
            exec: (/** @type {AceEditor} */ editor, /** @type {any[]} */ args) => {
                codeLensListeners
                    .filter((v) => v.name === 'test')
                    .forEach((f) => f.callback(args[0]));
            }
        });
        CodeLens.registerCodeLensProvider(editor, {
            provideCodeLenses: (/** @type {Session} */ session, /** @type {(_: null, arr: CodeLens[]) => void} */ callback) => {
                callback(null, codeLensListeners.some((v) => v.name === 'test') ? LanguageFeatures.getCodeLens(session.doc) : []);
            }
        });
    }
    catch (e) {
        console.error(e); // ext/code_lens のscriptタグが読み込まれていない場合など。
    }
    // 「全画面表示」ボタン
    const exitFullscreen = () => {
        editor.container.classList.remove('fullscreen');
        editor.renderer.setScrollMargin(0, 0, 0, 0); // marginを元に戻す
    };
    const fullscreenButton = document.createElement('span');
    fullscreenButton.classList.add('editor-button');
    fullscreenButton.innerText = '全画面表示';
    fullscreenButton.addEventListener('click', (e) => {
        if (editor.container.classList.contains('fullscreen')) {
            exitFullscreen();
        }
        else {
            editor.container.classList.add('fullscreen');
            editor.renderer.setScrollMargin(20, 20, 0, 0); // 上下に少し隙間を開ける
        }
        e.preventDefault();
    });
    buttonContainer.appendChild(fullscreenButton);
    // 「設定を開く」ボタン
    const settingsButton = document.createElement('span');
    settingsButton.classList.add('editor-button');
    settingsButton.innerText = '設定を開く';
    settingsButton.addEventListener('click', (e) => {
        exitFullscreen();
        editor.execCommand('showSettingsMenu');
        e.preventDefault();
    });
    buttonContainer.appendChild(settingsButton);
    // 複数ファイルの切り替え
    const UndoManager = ace.require('ace/undomanager').UndoManager;
    const editorTabs = new EditorTabs(editor, AceRange, UndoManager);
    // リサイズ可能にする
    const resizable = element.dataset.nako3Resizable;
    if (resizable) {
        new MutationObserver(() => { editor.resize(); }).observe(editor.container, { attributes: true });
        editor.renderer.setScrollMargin(4, 0, 4, 0);
        editor.container.classList.add('resizable');
    }
    const retokenize = () => { backgroundTokenizer.dirty = true; };
    /**
       * プログラムを実行して、エラーがあればエディタ上に波線を表示する。出力はoutputContainerに表示する。
       * methodが'test'のとき、testNameを指定すると1つのテストだけ実行できる。
       * @param {{
       *     outputContainer?: HTMLElement
       *     file?: string
       *     preCode?: string
       *     localFiles?: Record<string, string>
       *     method?: 'run' | 'test' | 'compile'
       *     testName?: string
       * }} opts
       */
    const run = (opts) => {
        const code = editor.getValue();
        const preCode = opts.preCode || ''; // プログラムの前に自動的に挿入されるコード
        // loggerを新しいインスタンスに置き換える。そうしないとどのエディタで起きたエラー（や警告や出力）なのかが分からない。
        const logger = nako3.replaceLogger();
        if (opts.outputContainer) {
            const c = opts.outputContainer;
            logger.addListener('info', ({ html }) => {
                if (!c) {
                    console.log(html);
                }
                c.style.display = 'block';
                c.innerHTML += html;
            });
            opts.outputContainer.classList.add('nako3-output-container');
        }
        let filename = opts.file || 'main.nako3';
        // 警告とエラーをエディタ上に表示する。
        logger.addListener('info', ({ position, noColor, level }) => {
            if (position && (position.file === filename && (level === 'warn' || level === 'error'))) {
                editorMarkers.addByError(code, { ...position, message: noColor }, level);
            }
        });
        // 依存ファイルを読み込む。
        const promise = nako3.loadDependencies(preCode + code, filename, preCode, opts.localFiles || {})
            .then(() => {
            // プログラムを実行する。
            if (!filename) {
                filename = 'main.nako3';
            }
            if (opts.method === 'test') {
                return nako3.test(preCode + code, filename, preCode, opts.testName);
            }
            else if (opts.method === 'compile') {
                return nako3.compile(preCode + code, filename, false, preCode);
            }
            else {
                const opt = { resetEnv: true, resetAll: true };
                return nako3.runEx(preCode + code, filename, opt, preCode);
            }
        })
            .catch((err) => {
            // エラーはloggerに送られるため何もしなくて良い
            // しかし念のため console.error で出力
            console.error('[wnako3_editor]', err);
        })
            .then(async (res) => {
            // 読み込んだ依存ファイルの情報を使って再度シンタックスハイライトする。
            retokenize();
            // シンタックスハイライトが終わるのを待つ
            while (backgroundTokenizer.dirty) {
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
            return res;
        })
            .catch((err) => {
            console.error('[wnako3_editor::run::promise::catch]', err);
        });
        return { promise, logger, code };
    };
    return { editor, editorMarkers, editorTabs, retokenize, run, codeLensListeners };
}
export default {
    tokenize,
    setupEditor,
    LanguageFeatures,
    EditorMarkers,
    BackgroundTokenizer
};
