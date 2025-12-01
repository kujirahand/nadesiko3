const PluginKeigo = {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_keigo', // プラグインの名前
            description: '敬語でプログラムを記述するための命令を提供するプラグイン', // プラグインの説明
            pluginVersion: '3.6.0', // プラグインのバージョン
            nakoRuntime: ['wnako', 'cnako'], // 対象ランタイム
            nakoVersion: '3.6.0' // 要求なでしこバージョン
        }
    },
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
        }
    },
    // @丁寧語
    'お世話': { type: 'const', value: 1 }, // @おせわ
    'な': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (a, sys) {
            return a;
        }
    },
    'おります': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            if (!sys.__reisetu) {
                sys.__reisetu = 0;
            }
            sys.__reisetu++;
        },
        return_none: true
    },
    'どうぞ': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            if (!sys.__reisetu) {
                sys.__reisetu = 0;
            }
            sys.__reisetu++;
        },
        return_none: true
    },
    'よろしくお願': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            if (!sys.__reisetu) {
                sys.__reisetu = 0;
            }
            sys.__reisetu++;
        },
        return_none: true
    }
};
export default PluginKeigo;
