// @ts-nocheck
export default {
    // @ローカルストレージ
    '保存': {
        type: 'func',
        josi: [['を'], ['に', 'へ']],
        pure: true,
        fn: function (v, key, sys) {
            sys.__exec('ローカルストレージ保存', [v, key, sys]);
        },
        return_none: true
    },
    '開': {
        type: 'func',
        josi: [['を', 'から', 'の']],
        pure: true,
        fn: function (key, sys) {
            return sys.__exec('ローカルストレージ読', [key, sys]);
        },
        return_none: false
    },
    '読': {
        type: 'func',
        josi: [['を', 'から', 'の']],
        pure: true,
        fn: function (key, sys) {
            return sys.__exec('ローカルストレージ読', [key, sys]);
        },
        return_none: false
    },
    '存在': {
        type: 'func',
        josi: [['が']],
        pure: true,
        fn: function (key) {
            const s = window.localStorage.getItem(key);
            return (s !== null);
        },
        return_none: false
    },
    'ローカルストレージ保存': {
        type: 'func',
        josi: [['を'], ['に', 'へ']],
        pure: true,
        fn: function (v, key, sys) {
            let body = v;
            if (sys.__v0['保存オプション']) {
                if ((sys.__v0['保存オプション'].indexOf('json') >= 0)) {
                    body = JSON.stringify(body);
                }
                else if (sys.__v0['保存オプション'] === 'raw') {
                    // なにもしない
                }
            }
            window.localStorage[key] = body;
        },
        return_none: true
    },
    'ローカルストレージ読': {
        type: 'func',
        josi: [['を', 'から', 'の']],
        pure: true,
        fn: function (key, sys) {
            const v = window.localStorage[key];
            if (sys.__v0['保存オプション'] && (sys.__v0['保存オプション'].indexOf('json') >= 0)) {
                try {
                    return JSON.parse(v);
                }
                catch (e) {
                    console.log('ローカルストレージ『' + key + '』の読み込みに失敗');
                }
            }
            return v;
        },
        return_none: false
    },
    'ローカルストレージキー列挙': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const keys = [];
            for (const key in window.localStorage) {
                keys.push(key);
            }
            return keys;
        },
        return_none: false
    },
    'ローカルストレージキー削除': {
        type: 'func',
        josi: [['を', 'の']],
        pure: true,
        fn: function (key) {
            window.localStorage.removeItem(key);
        },
        return_none: true
    },
    'ローカルストレージ全削除': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            window.localStorage.clear();
        },
        return_none: true
    },
    'ローカルストレージ有効確認': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            return (typeof window.localStorage !== 'undefined');
        },
        return_none: false
    },
    '保存オプション': { type: 'const', value: 'json' },
    '保存オプション設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v, sys) {
            v = v.toUpperCase(v);
            sys.__v0['保存オプション'] = v;
        },
        return_none: true
    }
};
