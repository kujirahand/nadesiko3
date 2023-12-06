// @ts-nocheck
export default {
    // @ダイアログ
    '言': {
        type: 'func',
        josi: [['と', 'を']],
        pure: true,
        fn: function (s) {
            window.alert(s);
        },
        return_none: true
    },
    'ダイアログキャンセル値': { type: 'var', value: '' },
    '尋': {
        type: 'func',
        josi: [['と', 'を']],
        pure: true,
        fn: function (s, sys) {
            const r = window.prompt(s);
            if (r === null) {
                return sys.__v0['ダイアログキャンセル値'];
            }
            if (/^[-+]?[0-9]+(\.[0-9]+)?$/.test(r)) {
                return parseFloat(r);
            }
            if (/^[-+－＋]?[0-9０-９]+([.．][0-9０-９]+)?$/.test(r)) {
                return parseFloat(r.replace(/[－＋０-９．]/g, c => {
                    return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
                }));
            }
            return r;
        }
    },
    '文字尋': {
        type: 'func',
        josi: [['と', 'を']],
        pure: true,
        fn: function (s, sys) {
            const r = window.prompt(s);
            if (r === null) {
                return sys.__v0['ダイアログキャンセル値'];
            }
            return r;
        }
    },
    '二択': {
        type: 'func',
        josi: [['で', 'の', 'と', 'を']],
        pure: true,
        fn: function (s) {
            return window.confirm(s);
        }
    }
};
