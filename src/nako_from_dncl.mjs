/**
 * DNCLに対応する構文
 */
// import { NakoIndentError } from './nako_errors.mjs'
import { NakoPrepare, checkNakoMode } from './nako_prepare.mjs';
// DNCLモードのキーワード
const DNCL_KEYWORDS = ['!DNCLモード'];
/**
 * DNCLのソースコードをなでしこに変換する
 * @param {String} src
 * @param {String} filename
 * @returns {String} converted soruce
 */
export function convertDNCL(src, filename) {
    // 改行を合わせる
    src = src.replace(/(\r\n|\r)/g, '\n');
    // 「!DNCLモード」を使うかチェック
    if (!checkNakoMode(src, DNCL_KEYWORDS)) {
        return src;
    }
    const result = dncl2nako(src, filename);
    // console.log("=====\n" + result)
    // process.exit()
    return result;
}
function isIndentSyntaxEnabled(src) {
    // プログラム冒頭に「!DNCLモード」があればDNCL構文が有効
    const keywords = DNCL_KEYWORDS;
    const lines = src.split('\n', 30);
    for (const line of lines) {
        const line2 = line.replace(/(！|💡)/, '!');
        if (keywords.indexOf(line2) >= 0) {
            return true;
        }
    }
    return false;
}
/**
 * make space string
 * @param {number} n
 */
function makeSpaces(n) {
    let s = '';
    for (let i = 0; i < n; i++) {
        s += ' ';
    }
    return s;
}
/**
 * DNCLからなでしこに変換する(判定なし)
 * @param {string} src
 * @param {string} filename
 * @returns {string} converted source
 */
function dncl2nako(src, filename) {
    // 全角半角を統一
    src = conv2half(src);
    // 行頭の「|」はインデントを表す記号なので無視する
    // 後判定の「繰り返し,」を「後判定で繰り返す」に置換する
    const a = src.split('\n');
    for (let i = 0; i < a.length; i++) {
        // インデントを消す
        let line = a[i];
        a[i] = line.replace(/^(\s*[|\s]+)(.*$)/, (m0, m1, m2) => {
            return makeSpaces(m1.length) + m2;
        });
        line = a[i];
        // 後判定の繰り返しの実装のため
        const line2 = line.replace(/^\s+/, '').replace(/\s+$/, '');
        if (line2 === '繰り返し,' || line2 === '繰り返し') {
            a[i] = '後判定で繰り返し';
        }
        const r = line.match(/^\s*を,?(.+)になるまで(繰り返す|実行する)/);
        if (r) {
            a[i] = `ここまで、(${r[1]})になるまでの間`;
            continue;
        }
        // 『もしj>hakosuならばhakosu←jを実行する』のような単文のもし文
        const rif = line.match(/^もし(.+)を実行する(。|．)*/);
        if (rif) {
            const sent = dncl2nako(rif[1], filename);
            a[i] = `もし、${sent};`;
            continue;
        }
        // 'のすべての値を0にする'
        // 'のすべての要素を0にする'
        // 'のすべての要素に0を代入する'
        const rall = line.match(/^(.+?)のすべての(要素|値)(を|に)(.+?)(にする|を代入)/);
        if (rall) {
            const varname = rall[1];
            const v = rall[4];
            a[i] = `${varname} = [${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v},${v}]`;
            continue;
        }
    }
    src = a.join('\n');
    // ---------------------------------
    // 置換開始
    // ---------------------------------
    // 単純置換リスト
    const simpleConvList = {
        'を実行する': 'ここまで',
        'を実行し,そうでなくもし': '違えば、もし',
        'を実行し，そうでなくもし': '違えば、もし',
        'を実行し、そうでなくもし': '違えば、もし',
        'を実行し,そうでなければ': '違えば',
        'を実行し，そうでなければ': '違えば',
        'を実行し、そうでなければ': '違えば',
        'を繰り返す': 'ここまで',
        '改行なしで表示': '連続無改行表示',
        'ずつ増やしながら': 'ずつ増やし繰り返す',
        'ずつ減らしながら': 'ずつ減らし繰り返す',
        '二進で表示': '二進表示',
        'でないならば': 'でなければ'
    };
    const peekChar = () => src.charAt(0);
    const nextChar = () => {
        const ch = src.charAt(0);
        src = src.substring(1);
        return ch;
    };
    // 文字列を判定するフラグ
    let flagStr = false;
    let poolStr = '';
    let endStr = '';
    // 結果
    let result = '';
    while (src !== '') {
        // 代入記号を変更
        const ch = src.charAt(0);
        if (flagStr) {
            if (ch === endStr) {
                result += poolStr + endStr;
                poolStr = '';
                flagStr = false;
                nextChar();
                continue;
            }
            poolStr += nextChar();
            continue;
        }
        // 文字列？
        if (ch === '"') {
            flagStr = true;
            endStr = '"';
            poolStr = nextChar();
            continue;
        }
        if (ch === '「') {
            flagStr = true;
            endStr = '」';
            poolStr = nextChar();
            continue;
        }
        if (ch === '『') {
            flagStr = true;
            endStr = '』';
            poolStr = nextChar();
            continue;
        }
        // 空白を飛ばす
        if (ch === ' ' || ch === '　' || ch === '\t') {
            result += nextChar();
            continue;
        }
        // 表示を連続表示に置き換える
        const ch3 = src.substring(0, 3);
        if (ch3 === 'を表示') {
            result += 'を連続表示';
            src = src.substring(3);
            continue;
        }
        if (src.substring(0, 4) === 'を 表示') {
            result += 'を連続表示';
            src = src.substring(4);
            continue;
        }
        // 乱数を乱数範囲に置き換える
        if (src.substring(0, 2) === '乱数' && src.substring(0, 4) !== '乱数範囲') {
            result += '乱数範囲';
            src = src.substring(2);
            continue;
        }
        // 増やす・減らすの前に「だけ」を追加する #1149
        if (ch3 === '増やす' || ch3 === '減らす') {
            if (result.substring(result.length - 2) !== 'だけ') {
                result += 'だけ';
            }
            result += ch3;
            src = src.substring(3);
        }
        // 一覧から単純な変換
        let flag = false;
        for (const key in simpleConvList) {
            const srcKey = src.substring(0, key.length);
            if (srcKey === key) {
                result += simpleConvList[key];
                src = src.substring(key.length);
                flag = true;
                break;
            }
        }
        if (flag) {
            continue;
        }
        // 1文字削る
        result += nextChar();
    }
    return result;
}
/**
 * 半角に変換
 * @param {String} src
 * @returns {string} converted source
 */
function conv2half(src) {
    const prepare = NakoPrepare.getInstance(); // `※`, `／/`, `／＊` といったパターン全てに対応するために必要
    // 全角半角の統一
    let result = '';
    let flagStr = false;
    let flagStrClose = '';
    for (let i = 0; i < src.length; i++) {
        const c = src.charAt(i);
        let cHalf = prepare.convert1ch(c);
        if (flagStr) {
            if (cHalf === flagStrClose) {
                flagStr = false;
                flagStrClose = '';
                result += cHalf;
                continue;
            }
            result += c;
            continue;
        }
        if (cHalf === '「') {
            flagStr = true;
            flagStrClose = '」';
            result += cHalf;
            continue;
        }
        if (cHalf === '"') {
            flagStr = true;
            flagStrClose = '"';
            result += cHalf;
            continue;
        }
        // 単純な置き換えはここでやってしまう
        // 配列記号の { ... } を [ ... ] に置換
        if (cHalf === '{') {
            cHalf = '[';
        }
        if (cHalf === '}') {
            cHalf = ']';
        }
        if (cHalf === '←') {
            cHalf = '=';
        }
        if (cHalf === '÷') {
            cHalf = '÷÷';
        } // #1152
        result += cHalf;
    }
    return result;
}
/** @type {Object} */
export const NakoDncl = {
    convert: convertDNCL
};
