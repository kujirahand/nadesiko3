// @ts-nocheck
import hotkeys from 'hotkeys-js';
export default {
    // @ホットキー
    'ホットキー登録': {
        type: 'func',
        josi: [['に', 'で'], ['を']],
        pure: true,
        fn: function (key, fname, sys) {
            hotkeys(key, function (event, handler) {
                event.preventDefault();
                const f = sys.__findFunc(fname);
                f(sys);
            });
        }
    },
    'ホットキー解除': {
        type: 'func',
        josi: [['を', 'の']],
        pure: true,
        fn: function (key) {
            hotkeys.unbind(key);
        }
    }
};
