/**
 * DNCL ver2 に対応する構文
 */
// import { NakoIndentError } from './nako_errors.mjs'
import { NewEmptyToken } from './nako_types.mjs';
import { joinTokenLines, splitTokens } from './nako_indent_inline.mjs';
import { newToken, debugTokens } from './nako_tools.mjs';
const IS_DEBUG = false;
const DNCL_ARRAY_INIT_COUNT = 30;
// DNCL2モードのキーワード
const DNCL2_KEYWORDS = ['!DNCL2モード', '💡DNCL2モード', '!DNCL2', '💡DNCL2'];
// 単純な置換チェック
const DNCL_SIMPLES = {
    '←:←': ['eq', '='],
    '÷:÷': ['÷÷', '÷÷'],
    '{:{': ['[', '['],
    '}:}': [']', ']'],
    // 'word:and': ['and', 'かつ'],
    // 'word:or': ['or', 'または'],
    'word:not': ['not', '!'],
    'word:乱数': ['word', '乱数範囲'],
    'word:表示': ['word', '連続表示'],
    'word:と定義': ['ここまで', 'ここまで'] // 「と定義」→「ここまで」
};
/**
 * DNCLのソースコードをなでしこに変換する
 */
export function convertDNCL2(tokens) {
    if (!useDNCL2mode(tokens)) {
        return tokens;
    }
    // 一行ずつに分ける
    const lines = splitTokens(tokens, 'eol');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.length <= 1) {
            continue;
        } // 空行は飛ばす
        // --- 制御構文の変換 ---
        // もし(条件)でないならば → もし(条件)でなければ
        const nai = findTokens(line, ['word:ない']);
        if (nai >= 1) {
            const tt = line[nai];
            if (tt.josi === 'ならば') {
                line[nai - 1].josi = 'でなければ';
                line.splice(nai, 1);
            }
        }
        // そうでなければ(そう|でなければ) or そうでなく → 違えば
        for (let ni = 0; ni < line.length; ni++) {
            const t = line[ni];
            if ((t.value === 'そう' || t.value === 'それ') && (t.josi === 'でなければ' || t.josi === 'でなく')) {
                t.type = '違えば';
                t.value = '違えば';
                t.josi = '';
            }
        }
        // 'を実行し,そうでなければ': '違えば',
        for (;;) {
            const ni = findTokens(line, ['word:を実行', 'comma:,', 'word:そう']);
            if (ni < 0) {
                break;
            }
            const sou = line[ni + 2];
            if (sou.josi === 'でなければ') {
                sou.type = '違えば';
                sou.value = '違えば';
                sou.josi = '';
                line.splice(ni, 3, sou);
                continue;
            }
            else if (sou.josi === 'で') {
                const nakumosi = line[ni + 3];
                if (nakumosi.value.substring(0, 4) === 'なくもし') {
                    sou.type = '違えば';
                    sou.value = '違えば';
                    sou.josi = '';
                    line.splice(ni, 3, sou);
                    if (nakumosi.value.length > 4) {
                        const nakumosiTudukiStr = nakumosi.value.substring(4);
                        const nakumosiToken = NewEmptyToken('word', nakumosiTudukiStr, nakumosi.indent, nakumosi.line, nakumosi.file);
                        if (nakumosiTudukiStr.match(/^\d/)) {
                            nakumosiToken.type = 'number';
                        }
                        line.splice(ni + 2, 0, nakumosiToken);
                        nakumosi.value = nakumosi.value.substring(0, 4);
                    }
                    nakumosi.type = 'もし';
                    nakumosi.value = 'もし';
                    nakumosi.josi = '';
                    continue;
                }
            }
            break;
        }
        // 'そうでなく': '違えば',
        for (;;) {
            const ni = findTokens(line, ['word:そう', 'word:なく']);
            if (ni < 0) {
                break;
            }
            const sou = line[ni];
            if (sou.josi === 'で') {
                sou.type = '違えば';
                sou.value = '違えば';
                sou.josi = '';
                line.splice(ni + 1, 1);
                // console.log('@@@', line.map(v => v.value).join('|'))
                continue;
            }
            break;
        }
        // 'そうでなくもし': '違えば,もし'
        for (;;) {
            const ni = findTokens(line, ['word:そう', 'word:なくもし']);
            if (ni < 0) {
                break;
            }
            const sou = line[ni];
            const nakumosi = line[ni + 1];
            sou.type = '違えば';
            sou.value = '違えば';
            sou.josi = '';
            nakumosi.type = 'もし';
            nakumosi.value = 'もし';
            nakumosi.josi = '';
        }
        // Iを1から100まで1(ずつ)|増やしな(が)|ら
        for (;;) {
            const ni = findTokens(line, ['word:増', 'word:ら']);
            if (ni < 0) {
                break;
            }
            const fu = line[ni];
            fu.type = 'word';
            fu.value = '増繰返';
            fu.josi = '';
            line.splice(ni, 2, fu);
        }
        // Iを1から100まで1(ずつ)|増やしな(が)|ら
        for (;;) {
            const ni = findTokens(line, ['word:減', 'word:ら']);
            if (ni < 0) {
                break;
            }
            const fu = line[ni];
            fu.type = 'word';
            fu.value = '減繰返';
            fu.josi = '';
            line.splice(ni, 2, fu);
        }
        // Iを1から100まで1(ずつ)|増やしな(が)|ら繰り返(す)
        for (;;) {
            const ni = findTokens(line, ['word:増', 'word:ら繰り返']);
            if (ni < 0) {
                break;
            }
            const fu = line[ni];
            fu.type = 'word';
            fu.value = '増繰返';
            fu.josi = '';
            line.splice(ni, 2, fu);
        }
        // Iを1から100まで1(ずつ)|増やしな(が)|ら繰り返す
        for (;;) {
            const ni = findTokens(line, ['word:減', 'word:ら繰り返']);
            if (ni < 0) {
                break;
            }
            const fu = line[ni];
            fu.type = 'word';
            fu.value = '減繰返';
            fu.josi = '';
            line.splice(ni, 2, fu);
        }
        // --- 配列変数周りの変換 ---
        for (let i = 0; i < line.length; i++) {
            // 配列|Hindoの|すべての|(要素に|値に)|10を|代入する
            if (tokenEq([['word:配列', 'word:配列変数'], 'word', 'word:すべて', ['word:要素', 'word:値'], '*', 'word:代入'], line, i)) {
                const varToken = line[i + 1];
                varToken.josi = '';
                const valToken = line[i + 4];
                valToken.josi = '';
                line.splice(i, 6, varToken, newToken('eq', '=', varToken), newToken('word', '掛'), newToken('(', '('), newToken('[', '['), valToken, newToken(']', ']'), newToken('comma', ','), newToken('number', DNCL_ARRAY_INIT_COUNT), newToken(')', ')'));
                i += 6; // skip
            }
            // Hensuの|すべての|(要素を|値を)|0に|する
            if (tokenEq(['word', 'word:すべて', ['word:要素', 'word:値'], ['number', 'string', 'word'], 'word:する'], line, i)) {
                const varToken = line[i];
                varToken.josi = '';
                const valToken = line[i + 3];
                valToken.josi = '';
                line.splice(i, 5, varToken, newToken('eq', '=', varToken), newToken('word', '掛'), newToken('(', '('), newToken('[', '['), valToken, newToken(']', ']'), newToken('comma', ','), newToken('number', DNCL_ARRAY_INIT_COUNT), newToken(')', ')'));
            }
            // 配列変数 | xxを | 初期化する
            if (tokenEq([['word:配列変数', 'word:配列'], 'word', 'word:初期化'], line, i)) {
                const varToken = line[i + 1];
                varToken.josi = '';
                line.splice(i, 3, varToken, newToken('eq', '=', varToken), newToken('word', '掛'), newToken('(', '('), newToken('[', '['), newToken('number', 0), newToken(']', ']'), newToken('comma', ','), newToken('number', DNCL_ARRAY_INIT_COUNT), newToken(')', ')'));
            }
        }
        // --- その他の変換 ---
        // 二進で表示 (255) → 二進表示(255)
        for (;;) {
            const ni = findTokens(line, ['word:二進', 'word:表示']);
            if (ni < 0) {
                break;
            }
            line[ni].value = '二進表示';
            line[ni].josi = '';
            line.splice(ni + 1, 1);
        }
        // '改行なしで表示' → '連続無改行表示'
        for (;;) {
            const ni = findTokens(line, ['word:改行', 'word:表示']);
            if (ni < 0) {
                break;
            }
            // ここ「改行なしで表示」でも「改行ありで表示」でも同じになってしまう
            // なでしこの制限のため仕方なし
            // 「改行ありで表示」は今のところDNCLに存在しないので無視する
            // もし将来的に区別が必要なら、プリプロセス処理でマクロ的に置換処理を行うことで対応できると思う
            const t = line[ni];
            t.value = '連続無改行表示';
            t.josi = '';
            line.splice(ni + 1, 1);
        }
        // 一つずつチェック
        let j = 0;
        while (j < line.length) {
            const t = line[j];
            // 減と増の分割
            if (t.type === 'word' && t.value.length >= 2) {
                const c = t.value.charAt(t.value.length - 1);
                if (c === '減' || c === '増') {
                    t.value = t.value.substring(0, t.value.length - 1);
                    t.josi = 'だけ';
                    line.splice(j + 1, 0, NewEmptyToken('word', c, t.indent, t.line, t.file));
                }
                j++;
                continue;
            }
            j++;
        }
    }
    // 最後に単純な置換を行う
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const a = DNCL_SIMPLES[String(t.type) + ':' + String(t.value)];
        if (a !== undefined) {
            t.type = a[0];
            t.value = a[1];
        }
    }
    tokens = joinTokenLines(lines);
    if (IS_DEBUG) {
        console.log('// DEBUG---DNCL:tokens---BEGIN');
        console.log(debugTokens(tokens));
        console.log('// DEBUG---DNCL:tokens---END');
    }
    return tokens;
}
/**
 * トークンが合致するかを確認する
 * @param typeValues ['word:それ']のようなタイプ名と値の配列/'*'でワイルドカードが使える/":"がなればタイプだけ確認/配列で選択
 * @param lines 差し替え
 * @param fromIndex 検索場所
 * @returns 合致したかどうか
 */
function tokenEq(typeValues, lines, fromIndex) {
    const check = (pattern, t) => {
        if (pattern instanceof Array) {
            for (let i = 0; i < pattern.length; i++) {
                if (check(pattern[i], t)) {
                    return true;
                }
            }
            return false;
        }
        if (pattern === '*') {
            return true;
        }
        if (pattern.indexOf(':') < 0) {
            if (pattern === t.type) {
                return true;
            }
            else {
                return false;
            }
        }
        const tv = `${t.type}:${t.value}`;
        if (pattern === tv) {
            return true;
        }
        return false;
    };
    for (let i = 0; i < typeValues.length; i++) {
        const idx = i + fromIndex;
        if (idx >= lines.length) {
            return false;
        }
        const pat = typeValues[i];
        const t = lines[idx];
        if (!check(pat, t)) {
            return false;
        }
    }
    return true;
}
function findTokens(tokens, findTypeValue) {
    const findA = findTypeValue.map(s => s.split(':'));
    for (let i = 0; i < tokens.length; i++) {
        let flag = true;
        for (let j = 0; j < findA.length; j++) {
            const f = findA[j];
            const idx = i + j;
            if (idx >= tokens.length) {
                return -1;
            }
            if (tokens[idx].type === f[0] && tokens[idx].value === f[1]) {
                continue;
            }
            else {
                flag = false;
                break;
            }
        }
        if (flag) {
            return i;
        }
    }
    return -1;
}
function useDNCL2mode(tokens) {
    // 先頭の100語調べる
    for (let i = 0; i < tokens.length; i++) {
        if (i > 100) {
            break;
        }
        const t = tokens[i];
        if (t.type === 'line_comment' && DNCL2_KEYWORDS.indexOf(t.value) >= 0) {
            t.type = 'DNCL2モード';
            return true;
        }
    }
    return false;
}
