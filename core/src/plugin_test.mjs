/**
 * file: plugin_test.js
 * テスト実行用プラグイン
 */
export default {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_test', // プラグインの名前
            description: 'テストを提供するプラグイン', // プラグインの説明
            pluginVersion: '3.6.0', // プラグインのバージョン
            nakoRuntime: ['wnako', 'cnako', 'phpnako'], // 対象ランタイム
            nakoVersion: '^3.6.0' // 要求なでしこバージョン
        }
    },
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            // 初期化不要
        }
    },
    // @テスト
    'ASSERT等': {
        type: 'func',
        josi: [['と'], ['が']],
        pure: true,
        fn: function (a, b) {
            if (a !== b) {
                throw new Error(`不一致 [実際]${JSON.stringify(a)} [期待]${JSON.stringify(b)}`);
            }
            return true;
        }
    },
    'テスト実行': {
        type: 'func',
        josi: [['と'], ['で']],
        pure: false,
        fn: function (a, b, sys) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            sys.__exec('ASSERT等', [a, b, sys]);
        }
    },
    'テスト等': {
        type: 'func',
        josi: [['と'], ['が']],
        pure: false,
        fn: function (a, b, sys) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            sys.__exec('ASSERT等', [a, b, sys]);
        }
    }
};
