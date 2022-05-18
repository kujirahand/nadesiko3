/**
 * file: plugin_test.js
 * テスト実行用プラグイン
 */
export default {
    // @テスト
    'ASSERT等': {
        type: 'func',
        josi: [['と'], ['が']],
        pure: true,
        fn: function (a, b) {
            if (a !== b) {
                throw new Error(`不一致 [実際]${a} [期待]${b}`);
            }
            return true;
        }
    },
    'テスト実行': {
        type: 'func',
        josi: [['と'], ['で']],
        pure: false,
        fn: function (a, b, sys) {
            sys.__exec('ASSERT等', [a, b, sys]);
        }
    },
    'テスト等': {
        type: 'func',
        josi: [['と'], ['が']],
        pure: false,
        fn: function (a, b, sys) {
            sys.__exec('ASSERT等', [a, b, sys]);
        }
    }
};
