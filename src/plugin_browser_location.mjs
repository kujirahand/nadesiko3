// @ts-nocheck
export default {
    // @ブラウザ操作
    'ブラウザ移動': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (url, sys) {
            window.location.href = url;
        }
    },
    'ブラウザ戻': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            window.history.back(-1);
        }
    },
    'ブラウザURL': { type: 'const', value: '' } // @NぶらうざURL
};
