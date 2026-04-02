/**
 * なでしこ3 の TypeScript のための型定義
 */
export function NewEmptyToken(type = '?', value = '', indent = -1, line = 0, file = 'main.nako3') {
    return {
        type,
        value,
        indent,
        line,
        column: 0,
        file,
        josi: ''
    };
}
