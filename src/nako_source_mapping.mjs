/** prepareとtokenizeのソースマッピング */
export class SourceMappingOfTokenization {
    /**
       * @param {number} sourceCodeLength
       * @param {PreprocessItem[]} preprocessed
       */
    constructor(sourceCodeLength, preprocessed) {
        /** @private @readonly */
        this.sourceCodeLength = sourceCodeLength;
        /** @private @readonly */
        this.preprocessed = preprocessed;
        let i = 0;
        /** @private @readonly @type {number[]} */
        this.cumulativeSum = [];
        for (const el of preprocessed) {
            this.cumulativeSum.push(i);
            i += el.text.length;
        }
        /** @private */
        this.lastIndex = 0;
        /** @private */
        this.lastPreprocessedCodePosition = 0;
    }
    /**
       * preprocess後の文字列上のoffsetからソースコード上のoffsetへ変換
       * @param {number} preprocessedCodePosition
       * @returns {number}
       */
    map(preprocessedCodePosition) {
        const i = this.findIndex(preprocessedCodePosition);
        return Math.min(this.preprocessed[i].sourcePosition + (preprocessedCodePosition - this.cumulativeSum[i]), i === this.preprocessed.length - 1 ? this.sourceCodeLength : this.preprocessed[i + 1].sourcePosition - 1);
    }
    /**
       * @param {number} preprocessedCodePosition
       * @returns {number}
       */
    findIndex(preprocessedCodePosition) {
        // 連続アクセスに対する高速化
        if (preprocessedCodePosition < this.lastPreprocessedCodePosition) {
            this.lastIndex = 0;
        }
        this.lastPreprocessedCodePosition = preprocessedCodePosition;
        for (let i = this.lastIndex; i < this.preprocessed.length - 1; i++) {
            if (preprocessedCodePosition < this.cumulativeSum[i + 1]) {
                this.lastIndex = i;
                return i;
            }
        }
        this.lastIndex = this.preprocessed.length - 1;
        return this.preprocessed.length - 1;
    }
}
export class SourceMappingOfIndentSyntax {
    /**
       * @param {string} codeAfterProcessingIndentationSyntax
       * @param {readonly number[]} linesInsertedByIndentationSyntax
       * @param {readonly { lineNumber: number, len: number }[]} linesDeletedByIndentationSyntax
       */
    constructor(codeAfterProcessingIndentationSyntax, linesInsertedByIndentationSyntax, linesDeletedByIndentationSyntax) {
        /** @private @type {{ offset: number, len: number }[]} */
        this.lines = [];
        /** @private @readonly */
        this.linesInsertedByIndentationSyntax = linesInsertedByIndentationSyntax;
        /** @private @readonly */
        this.linesDeletedByIndentationSyntax = linesDeletedByIndentationSyntax;
        let offset = 0;
        for (const line of codeAfterProcessingIndentationSyntax.split('\n')) {
            this.lines.push({ offset, len: line.length });
            offset += line.length + 1;
        }
        /** @private */
        this.lastLineNumber = 0;
        /** @private */
        this.lastOffset = 0;
    }
    /**
       * @param {number | null} startOffset
       * @param {number | null} endOffset
       * @returns {{ startOffset: number | null, endOffset: number | null }}
       */
    map(startOffset, endOffset) {
        if (startOffset === null) {
            return { startOffset, endOffset };
        }
        // 何行目かを判定
        const tokenLine = this.getLineNumber(startOffset);
        for (const insertedLine of this.linesInsertedByIndentationSyntax) {
            // インデント構文の処理後のソースコードの `insertedLine` 行目にあるトークンのソースマップ情報を削除する。
            if (tokenLine === insertedLine) {
                startOffset = null;
                endOffset = null;
                break;
            }
            // インデント構文の処理後のソースコードの `insertedLine` 行目以降にあるトークンのoffsetから
            // `linesInsertedByIndentationSyntax[i]` 行目の文字数（\rを含む） を引く。
            if (tokenLine > insertedLine) {
                // "\n"の分1足す
                startOffset -= this.lines[insertedLine].len + 1;
                if (endOffset !== null) {
                    endOffset -= this.lines[insertedLine].len + 1;
                }
            }
        }
        for (const deletedLine of this.linesDeletedByIndentationSyntax) {
            if (tokenLine >= deletedLine.lineNumber) {
                // "\n"の分1足す
                if (startOffset !== null) {
                    startOffset += deletedLine.len + 1;
                }
                if (endOffset !== null) {
                    endOffset += deletedLine.len + 1;
                }
            }
        }
        return { startOffset, endOffset };
    }
    /**
       * @param {number} offset
       * @returns {number}
       * @private
       */
    getLineNumber(offset) {
        // 連続アクセスに対する高速化
        if (offset < this.lastOffset) {
            this.lastLineNumber = 0;
        }
        this.lastOffset = offset;
        for (let i = this.lastLineNumber; i < this.lines.length - 1; i++) {
            if (offset < this.lines[i + 1].offset) {
                this.lastLineNumber = i;
                return i;
            }
        }
        this.lastLineNumber = this.lines.length - 1;
        return this.lines.length - 1;
    }
}
/** offsetから (line, column) へ変換する。 */
export class OffsetToLineColumn {
    /**
       * @param {string} code
       */
    constructor(code) {
        /** @private @type {number[]} */
        this.lineOffsets = [];
        // 各行の先頭位置を先に計算しておく
        let offset = 0;
        for (const line of code.split('\n')) {
            this.lineOffsets.push(offset);
            offset += line.length + 1;
        }
        /** @private */
        this.lastLineNumber = 0;
        /** @private */
        this.lastOffset = 0;
    }
    /**
       * @param {number} offset
       * @param {boolean} oneBasedLineNumber trueのときlineを1から始める
       * @returns {{ line: number, column: number }}
       */
    map(offset, oneBasedLineNumber) {
        // 連続アクセスに対する高速化
        if (offset < this.lastOffset) {
            this.lastLineNumber = 0;
        }
        this.lastOffset = offset;
        for (let i = this.lastLineNumber; i < this.lineOffsets.length - 1; i++) {
            if (offset < this.lineOffsets[i + 1]) {
                this.lastLineNumber = i;
                return {
                    line: i + (oneBasedLineNumber ? 1 : 0),
                    column: offset - this.lineOffsets[i]
                };
            }
        }
        this.lastLineNumber = this.lineOffsets.length - 1;
        return {
            line: this.lineOffsets.length - 1 + (oneBasedLineNumber ? 1 : 0),
            column: offset - this.lineOffsets[this.lineOffsets.length - 1]
        };
    }
}
/**
 * preCodeの分、ソースマップのoffset、行数、列数を減らす。
 * @type {<T extends {line?: number, column?: number, startOffset: number | null, endOffset: number | null }>(sourceMap: T, preCode: string) => T}
 */
export function subtractSourceMapByPreCodeLength(sourceMap, preCode) {
    // offsetは単純に引くだけでよい
    if (typeof sourceMap.startOffset === 'number') {
        sourceMap.startOffset -= preCode.length;
    }
    if (typeof sourceMap.endOffset === 'number') {
        sourceMap.endOffset -= preCode.length;
    }
    // たとえば preCode = 'abc\ndef\nghi' のとき、line -= 2 して、先頭行なら column -= 3 もする。
    if (preCode !== '') {
        const lines = preCode.split('\n');
        if (typeof sourceMap.line === 'number') {
            sourceMap.line -= lines.length - 1;
        }
        if (sourceMap.line === 0 && typeof sourceMap.column === 'number') {
            sourceMap.column -= lines[lines.length - 1].length;
        }
    }
    return sourceMap;
}
