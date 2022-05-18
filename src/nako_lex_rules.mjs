/**
 * なでしこ3字句解析のためのルール
 */
import { josiRE, removeJosiMap } from './nako_josi_list.mjs';
const kanakanji = /^[\u3005\u4E00-\u9FCF_a-zA-Z0-9ァ-ヶー\u2460-\u24FF\u2776-\u277F\u3251-\u32BF]+/;
const hira = /^[ぁ-ん]/;
const allHiragana = /^[ぁ-ん]+$/;
const wordHasIjoIka = /^.+(以上|以下|超|未満)$/;
const errorRead = (ch) => {
    return function () { throw new Error('突然の『' + ch + '』があります。'); };
};
export const unitRE = /^(円|ドル|元|歩|㎡|坪|度|℃|°|個|つ|本|冊|才|歳|匹|枚|皿|セット|羽|人|件|行|列|機|品|m|mm|cm|km|g|kg|t|px|dot|pt|em|b|mb|kb|gb)/;
export const rules = [
    // 上から順にマッチさせていく
    { name: 'ここまで', pattern: /^;;;/ },
    { name: 'eol', pattern: /^\n/ },
    { name: 'eol', pattern: /^;/ },
    // eslint-disable-next-line no-control-regex
    { name: 'space', pattern: /^(\x20|\x09|・)+/ },
    { name: 'comma', pattern: /^,/ },
    { name: 'line_comment', pattern: /^#[^\n]*/ },
    { name: 'line_comment', pattern: /^\/\/[^\n]*/ },
    { name: 'range_comment', pattern: /^\/\*/, cbParser: cbRangeComment },
    { name: 'def_test', pattern: /^●テスト:/ },
    { name: 'def_func', pattern: /^●/ },
    // 数値の判定 --- この後nako_lexerにて単位を読む処理が入る(#994)
    { name: 'number', pattern: /^0[xX][0-9a-fA-F]+(_[0-9a-fA-F]+)*/, readJosi: true, cb: parseNumber },
    { name: 'number', pattern: /^0[oO][0-7]+(_[0-7]+)*/, readJosi: true, cb: parseNumber },
    { name: 'number', pattern: /^0[bB][0-1]+(_[0-1]+)*/, readJosi: true, cb: parseNumber },
    // 下の三つは小数点が挟まっている場合、小数点から始まっている場合、小数点がない場合の十進法の数値にマッチします
    { name: 'number', pattern: /^\d+(_\d+)*\.(\d+(_\d+)*)?([eE][+|-]?\d+(_\d+)*)?/, readJosi: true, cb: parseNumber },
    { name: 'number', pattern: /^\.\d+(_\d+)*([eE][+|-]?\d+(_\d+)*)?/, readJosi: true, cb: parseNumber },
    { name: 'number', pattern: /^\d+(_\d+)*([eE][+|-]?\d+(_\d+)*)?/, readJosi: true, cb: parseNumber },
    { name: 'ここから', pattern: /^(ここから),?/ },
    { name: 'ここまで', pattern: /^(ここまで|💧)/ },
    { name: 'もし', pattern: /^もしも?/ },
    // 「ならば」は助詞として定義している
    { name: '違えば', pattern: /^違(えば)?/ },
    // 「回」「間」「繰返」「反復」「抜」「続」「戻」「代入」「条件分岐」などは NakoLexer._replaceWord で word から変換
    // @see nako_reserved_words.js
    { name: 'shift_r0', pattern: /^>>>/ },
    { name: 'shift_r', pattern: /^>>/ },
    { name: 'shift_l', pattern: /^<</ },
    { name: '===', pattern: /^===/ },
    { name: '!==', pattern: /^!==/ },
    { name: 'gteq', pattern: /^(≧|>=|=>)/ },
    { name: 'lteq', pattern: /^(≦|<=|=<)/ },
    { name: 'noteq', pattern: /^(≠|<>|!=)/ },
    { name: '←', pattern: /^(←|<--)/ },
    { name: 'eq', pattern: /^(=|🟰)/ },
    { name: 'line_comment', pattern: /^(!|💡)(インデント構文|ここまでだるい)[^\n]*/ },
    { name: 'not', pattern: /^(!|💡)/ },
    { name: 'gt', pattern: /^>/ },
    { name: 'lt', pattern: /^</ },
    { name: 'and', pattern: /^(かつ|&&)/ },
    { name: 'or', pattern: /^(または|或いは|あるいは|\|\|)/ },
    { name: '@', pattern: /^@/ },
    { name: '+', pattern: /^\+/ },
    { name: '-', pattern: /^-/ },
    { name: '*', pattern: /^(×|\*)/ },
    { name: '÷÷', pattern: /^÷÷/ },
    { name: '÷', pattern: /^(÷|\/)/ },
    { name: '%', pattern: /^%/ },
    { name: '^', pattern: /^\^/ },
    { name: '&', pattern: /^&/ },
    { name: '[', pattern: /^\[/ },
    { name: ']', pattern: /^]/, readJosi: true },
    { name: '(', pattern: /^\(/ },
    { name: ')', pattern: /^\)/, readJosi: true },
    { name: '|', pattern: /^\|/ },
    { name: 'string', pattern: /^🌿/, cbParser: src => cbString('🌿', '🌿', src) },
    { name: 'string_ex', pattern: /^🌴/, cbParser: src => cbString('🌴', '🌴', src) },
    { name: 'string_ex', pattern: /^「/, cbParser: src => cbString('「', '」', src) },
    { name: 'string', pattern: /^『/, cbParser: src => cbString('『', '』', src) },
    { name: 'string_ex', pattern: /^“/, cbParser: src => cbString('“', '”', src) },
    { name: 'string_ex', pattern: /^"/, cbParser: src => cbString('"', '"', src) },
    { name: 'string', pattern: /^'/, cbParser: src => cbString('\'', '\'', src) },
    { name: '」', pattern: /^」/, cbParser: errorRead('」') },
    { name: '』', pattern: /^』/, cbParser: errorRead('』') },
    { name: 'func', pattern: /^\{関数\},?/ },
    { name: '{', pattern: /^\{/ },
    { name: '}', pattern: /^\}/, readJosi: true },
    { name: ':', pattern: /^:/ },
    { name: '_eol', pattern: /^_\s*\n/ },
    { name: 'dec_lineno', pattern: /^‰/ },
    // 絵文字変数 = (絵文字)英数字*
    { name: 'word', pattern: /^[\uD800-\uDBFF][\uDC00-\uDFFF][_a-zA-Z0-9]*/, readJosi: true },
    { name: 'word', pattern: /^[\u1F60-\u1F6F][_a-zA-Z0-9]*/, readJosi: true },
    { name: 'word', pattern: /^《.+?》/, readJosi: true },
    // 単語句
    {
        name: 'word',
        pattern: /^[_a-zA-Z\u3005\u4E00-\u9FCFぁ-んァ-ヶ\u2460-\u24FF\u2776-\u277F\u3251-\u32BF]/,
        cbParser: cbWordParser
    }
];
export function trimOkurigana(s) {
    // ひらがなから始まらない場合、送り仮名を削除。(例)置換する
    if (!hira.test(s)) {
        return s.replace(/[ぁ-ん]+/g, '');
    }
    // 全てひらがな？ (例) どうぞ
    if (allHiragana.test(s)) {
        return s;
    }
    // 末尾のひらがなのみ (例)お願いします →お願
    return s.replace(/[ぁ-ん]+$/g, '');
}
// Utility for Rule
function cbRangeComment(src) {
    let res = '';
    const josi = '';
    let numEOL = 0;
    src = src.substring(2); // skip /*
    const i = src.indexOf('*/');
    if (i < 0) { // not found
        res = src;
        src = '';
    }
    else {
        res = src.substring(0, i);
        src = src.substring(i + 2);
    }
    // 改行を数える
    for (let i = 0; i < res.length; i++) {
        if (res.charAt(i) === '\n') {
            numEOL++;
        }
    }
    res = res.replace(/(^\s+|\s+$)/, ''); // trim
    return { src: src, res: res, josi: josi, numEOL: numEOL };
}
/**
 * @param {string} src
 */
function cbWordParser(src, isTrimOkurigana = true) {
    /*
      kanji    = [\u3005\u4E00-\u9FCF]
      hiragana = [ぁ-ん]
      katakana = [ァ-ヶー]
      emoji    = [\u1F60-\u1F6F]
      uni_extra = [\uD800-\uDBFF] [\uDC00-\uDFFF]
      alphabet = [_a-zA-Z]
      numchars = [0-9]
    */
    let res = '';
    let josi = '';
    while (src !== '') {
        if (res.length > 0) {
            // 助詞の判定
            const j = josiRE.exec(src);
            if (j) {
                josi = j[0].replace(/^\s+/, '');
                src = src.substr(j[0].length);
                // 助詞の直後にある「,」を飛ばす #877
                if (src.charAt(0) === ',') {
                    src = src.substr(1);
                }
                break;
            }
        }
        // カタカナ漢字英数字か？
        const m = kanakanji.exec(src);
        if (m) {
            res += m[0];
            src = src.substr(m[0].length);
            continue;
        }
        // ひらがな？
        const h = hira.test(src);
        if (h) {
            res += src.charAt(0);
            src = src.substr(1);
            continue;
        }
        break; // other chars
    }
    // 「間」の特殊ルール (#831)
    // 「等しい間」や「一致する間」なら「間」をsrcに戻す。ただし「システム時間」はそのままにする。
    if (/[ぁ-ん]間$/.test(res)) {
        src = res.charAt(res.length - 1) + src;
        res = res.slice(0, -1);
    }
    // 「以上」「以下」「超」「未満」 #918
    const ii = wordHasIjoIka.exec(res);
    if (ii) {
        src = ii[1] + josi + src;
        josi = '';
        res = res.substr(0, res.length - ii[1].length);
    }
    // 助詞「こと」「である」「です」などは「＊＊すること」のように使うので削除 #936 #939 #974
    if (removeJosiMap[josi]) {
        josi = '';
    }
    // 漢字カタカナ英語から始まる語句 --- 送り仮名を省略
    if (isTrimOkurigana) {
        res = trimOkurigana(res);
    }
    // 助詞だけの語句の場合
    if (res === '' && josi !== '') {
        res = josi;
        josi = '';
    }
    return { src: src, res: res, josi: josi, numEOL: 0 };
}
function cbString(beginTag, closeTag, src) {
    let res = '';
    let josi = '';
    let numEOL = 0;
    src = src.substr(beginTag.length); // skip beginTag
    const i = src.indexOf(closeTag);
    if (i < 0) { // not found
        res = src;
        src = '';
    }
    else {
        res = src.substr(0, i);
        src = src.substr(i + closeTag.length);
        // res の中に beginTag があればエラーにする #953
        if (res.indexOf(beginTag) >= 0) {
            if (beginTag === '『') {
                throw new Error('「『」で始めた文字列の中に「『」を含めることはできません。');
            }
            else {
                throw new Error(`『${beginTag}』で始めた文字列の中に『${beginTag}』を含めることはできません。`);
            }
        }
    }
    // 文字列直後の助詞を取得
    const j = josiRE.exec(src);
    if (j) {
        josi = j[0].replace(/^\s+/, '');
        src = src.substr(j[0].length);
        // 助詞の後のカンマ #877
        if (src.charAt(0) === ',') {
            src = src.substr(1);
        }
    }
    // 助詞「こと」「である」「です」などは「＊＊すること」のように使うので削除 #936 #939 #974
    if (removeJosiMap[josi]) {
        josi = '';
    }
    // 改行を数える
    for (let i = 0; i < res.length; i++) {
        if (res.charAt(i) === '\n') {
            numEOL++;
        }
    }
    return { src: src, res: res, josi: josi, numEOL: numEOL };
}
function parseNumber(n) {
    return Number(n.replace(/_/g, ''));
}
