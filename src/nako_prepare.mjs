/**
 * nako_prepare.js
 * 字句解析の前の前処理。全角文字を半角文字に変換するのが主な処理。
 * ただし、コメントや文字列の中は変換しないように考慮して変換する。
 */
class ReplaceHistory {
    constructor(from, to, index) {
        this.from = from;
        this.to = to;
        this.index = index;
    }
}
class ConvertResult {
    constructor(text, sourcePosition) {
        this.text = text;
        this.sourcePosition = sourcePosition;
    }
}
/**
 * 置換後の位置から置換前の位置へマッピングできる文字列
 */
export class Replace {
    constructor(code) {
        this.history = [];
        this.code = code;
    }
    getText() {
        return this.code;
    }
    replaceAll(from, to) {
        while (true) {
            const index = this.getText().indexOf(from);
            if (index === -1) {
                break;
            }
            if (from.length !== to.length) {
                this.history.unshift(new ReplaceHistory(from.length, to.length, index));
            }
            this.code = this.code.replace(from, to);
        }
    }
    getSourcePosition(i) {
        // 少し遅い。パース時間1.4秒に対して0.15秒かかる。iが単調増加することを利用して高速化できるはず。
        for (const item of this.history) {
            if (i >= item.index + item.to) { // 置換範囲より後ろ
                i += item.from - item.to;
            }
            else if (item.index <= i && i < item.index + item.to) { // 置換範囲
                // 置換文字列が2文字以上のとき、最後の文字は最後の文字へマップする。それ以外は最初の文字へマップする。
                if (item.to >= 2 && i === item.index + item.to - 1) {
                    i = item.index + item.from - 1;
                }
                else {
                    i = item.index;
                }
            }
        }
        return i;
    }
}
/**
 * 字句解析を行う前に全角文字を半角に揃える
 *    [memo]
 *    ただし、文字列部分だけは、そのまま全角で出力するようにする
 *    for https://github.com/kujirahand/nadesiko3/issues/94
 */
export class NakoPrepare {
    constructor() {
        // 単純な変換テーブル
        this.convertTable = new Map([
            // ハイフンへの変換
            // 参考) https://hydrocul.github.io/wiki/blog/2014/1101-hyphen-minus-wave-tilde
            // 0x2d: true, // ASCIIのハイフン
            [0x2010, '-'],
            [0x2011, '-'],
            [0x2013, '-'],
            [0x2014, '-'],
            [0x2015, '-'],
            [0x2212, '-'],
            // チルダの変換
            // 0x7e: true,
            [0x02dc, '~'],
            [0x02F7, '~'],
            [0x2053, '~'],
            [0x223c, '~'],
            [0x301c, '~'],
            [0xFF5E, '~'],
            // スペースの変換
            // 参考) http://anti.rosx.net/etc/memo/002_space.html
            // 0x20: true,
            [0x2000, ' '],
            [0x2002, ' '],
            [0x2003, ' '],
            [0x2004, ' '],
            [0x2005, ' '],
            [0x2006, ' '],
            [0x2007, ' '],
            [0x2009, ' '],
            [0x200A, ' '],
            [0x200B, ' '],
            [0x202F, ' '],
            [0x205F, ' '],
            [0x3000, ' '],
            [0x3164, ' '],
            // その他の変換
            [0x09, ' '],
            [0x203B, '#'],
            [0x3002, ';'],
            [0x3010, '['],
            [0x3011, ']'],
            // 読点は「,」に変換する (#877)
            [0x3001, ','],
            [0xFF0C, ','],
            [0x2716, '*'],
            [0x2795, '+'],
            [0x2796, '-'],
            [0x2797, '÷'] // ÷の絵文字 (#1183)
        ]);
    }
    /** 唯一のインスタンスを返す */
    static getInstance() {
        if (!NakoPrepare._instance) {
            NakoPrepare._instance = new NakoPrepare();
        }
        return NakoPrepare._instance;
    }
    // 一文字だけ変換
    /**
     * @param {string} ch
     */
    convert1ch(ch) {
        if (!ch) {
            return '';
        }
        const c = ch.codePointAt(0) || 0;
        // テーブルによる変換
        const c2 = this.convertTable.get(c) || '';
        if (c2) {
            return c2;
        }
        // ASCIIエリア
        if (c < 0x7F) {
            return ch;
        }
        // 全角半角単純変換可能 --- '！' - '～'
        if (c >= 0xFF01 && c <= 0xFF5E) {
            const c2 = c - 0xFEE0;
            return String.fromCodePoint(c2);
        }
        return ch;
    }
    /** convert code */
    convert(code) {
        if (!code) {
            return [];
        }
        const src = new Replace(code);
        // 改行コードを統一
        src.replaceAll('\r\n', '\n');
        src.replaceAll('\r', '\n');
        let flagStr = false; // 文字列リテラル内かどうか
        let flagStr2 = false; // 絵文字による文字列リテラル内かどうか
        let endOfStr = ''; // 文字列リテラルを終了させる記号
        const res = [];
        let left = 0; // 現在処理中の部分文字列の左端の位置
        let str = ''; // 文字列リテラルの値
        // 一文字ずつ全角を半角に置換する
        let i = 0;
        while (i < src.getText().length) {
            const c = src.getText().charAt(i);
            const ch2 = src.getText().substr(i, 2);
            // 文字列のとき
            if (flagStr) {
                if (c === endOfStr) {
                    flagStr = false;
                    res.push(new ConvertResult(str + endOfStr, src.getSourcePosition(left)));
                    i++;
                    left = i;
                    continue;
                }
                str += c;
                i++;
                continue;
            }
            // 絵文字制御による文字列のとき
            if (flagStr2) {
                if (ch2 === endOfStr) {
                    flagStr2 = false;
                    res.push(new ConvertResult(str + endOfStr, src.getSourcePosition(left)));
                    i += 2;
                    left = i;
                    continue;
                }
                str += c;
                i++;
                continue;
            }
            // 文字列判定
            if (c === '「') {
                res.push(new ConvertResult(c, src.getSourcePosition(left)));
                i++;
                left = i;
                flagStr = true;
                endOfStr = '」';
                str = '';
                continue;
            }
            if (c === '『') {
                res.push(new ConvertResult(c, src.getSourcePosition(left)));
                i++;
                left = i;
                flagStr = true;
                endOfStr = '』';
                str = '';
                continue;
            }
            if (c === '“') {
                res.push(new ConvertResult(c, src.getSourcePosition(left)));
                i++;
                left = i;
                flagStr = true;
                endOfStr = '”';
                str = '';
                continue;
            }
            // JavaScriptの内部的には文字列はUTF-16で扱われてるので charAt を使う場合 絵文字が2文字扱いになる --- #726
            if (ch2 === '🌴' || ch2 === '🌿') {
                res.push(new ConvertResult(ch2, src.getSourcePosition(left)));
                i += 2;
                left = i;
                flagStr2 = true;
                endOfStr = ch2;
                str = '';
                continue;
            }
            const c1 = this.convert1ch(c);
            if (c1 === '"' || c1 === '\'') {
                res.push(new ConvertResult(c1, src.getSourcePosition(left)));
                i++;
                left = i;
                flagStr = true;
                endOfStr = c;
                str = '';
                continue;
            }
            // ラインコメントを飛ばす (#725)
            if (c1 === '#') {
                res.push(new ConvertResult(c1, src.getSourcePosition(left)));
                i++;
                left = i;
                flagStr = true; // 本当はコメントだけど便宜上
                endOfStr = '\n';
                str = '';
                continue;
            }
            // ラインコメントを飛ばす
            if (ch2 === '//' || ch2 === '／／') {
                res.push(new ConvertResult('//', src.getSourcePosition(left))); // 強制的に'//'とする
                i += 2;
                left = i;
                flagStr = true;
                endOfStr = '\n';
                str = '';
                continue;
            }
            // 複数行コメント内を飛ばす (#731)
            if (ch2 === '/*') {
                res.push(new ConvertResult(ch2, src.getSourcePosition(left)));
                i += 2;
                left = i;
                flagStr2 = true;
                endOfStr = '*/';
                str = '';
                continue;
            }
            // 変換したものを追加
            res.push(new ConvertResult(c1, src.getSourcePosition(left)));
            i++;
            left = i;
        }
        if (flagStr || flagStr2) {
            res.push(new ConvertResult(str + endOfStr, src.getSourcePosition(left)));
        }
        return res;
    }
}
/** なでしこのソースコードのモード(!インデント構文など)が設定されているか調べる */
export function checkNakoMode(code, modeNames) {
    // 先頭の256文字について調べる
    code = code.substring(0, 256);
    // 全角半角の揺れを吸収
    code = code.replace(/(！|💡)/, '!');
    // 範囲コメントを削除
    code = code.replace(/\/\*.*?\*\//g, '');
    // 毎文調べる
    const lines = code.split(/[;。\n]/, 30);
    for (let line of lines) {
        line = line.replace(/^\s+/, '').replace(/\s+$/, ''); // trim
        if (modeNames.indexOf(line) >= 0) {
            return true;
        }
    }
    return false;
}
