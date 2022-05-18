/**
 * なでしこ3 の TypeScript のための型定義
 */
export function NewEmptyToken(type = '?', value = {}, line = 0, file = 'main.nako3') {
    return {
        type,
        value,
        line,
        column: 0,
        file,
        josi: ''
    };
}
