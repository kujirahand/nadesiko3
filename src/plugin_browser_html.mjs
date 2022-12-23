// @ts-nocheck
export default {
    // @HTML操作
    'HTML変換': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (text) {
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/>/g, '&gt;')
                .replace(/</g, '&lt;');
        }
    },
    // @クリップボード
    'クリップボード設定': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (text) {
            // Clipboard APIをサポートしているか
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text);
            }
            else {
                const tmp = document.createElement('div');
                const pre = document.createElement('pre');
                pre.style.webkitUserSelect = 'auto';
                pre.style.userSelect = 'auto';
                tmp.appendChild(pre).textContent = text;
                // 画面外へ表示する
                tmp.style.position = 'fixed';
                tmp.right = '200%';
                document.body.appendChild(tmp);
                document.getSelection().selectAllChildren(tmp);
                document.execCommand('copy');
                document.body.removeChild(tmp);
            }
        },
        return_none: true
    },
    'クリップボード取得時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (f, sys) {
            // Clipboard APIをサポートしているか
            if (navigator.clipboard) {
                if (typeof (f) === 'string') {
                    f = sys.__findFunc(f, 'クリップボード取得時');
                }
                const pm = navigator.clipboard.readText();
                pm.then(text => {
                    sys.__v0['対象'] = text;
                    f(sys);
                });
            }
            else {
                throw new Error('Clipbard APIが利用できません。');
            }
        }
    }
};
