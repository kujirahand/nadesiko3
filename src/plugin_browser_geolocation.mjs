// @ts-nocheck
export default {
    // @位置情報
    '位置情報取得時': {
        type: 'func',
        josi: [['の', 'に', 'へ']],
        pure: true,
        fn: function (func, sys) {
            let cb = func;
            if (typeof cb === 'string') {
                cb = sys.__findVar(cb);
            }
            if (!('geolocation' in navigator)) {
                throw new Error('関数『位置情報取得時』は使えません。');
            }
            navigator.geolocation.getCurrentPosition((position) => {
                sys.__setSysVar('対象', [
                    position.coords.latitude,
                    position.coords.longitude
                ]);
                cb(position);
            });
        },
        return_none: true
    },
    '位置情報監視時': {
        type: 'func',
        josi: [['の', 'に', 'へ']],
        pure: true,
        fn: function (func, sys) {
            let cb = func;
            if (typeof cb === 'string') {
                cb = sys.__findVar(cb);
            }
            if (!('geolocation' in navigator)) {
                throw new Error('関数『位置情報監視時』は使えません。');
            }
            return navigator.geolocation.watchPosition((position) => {
                sys.__setSysVar('対象', [
                    position.coords.latitude,
                    position.coords.longitude
                ]);
                cb(position);
            });
        },
        return_none: false
    },
    '位置情報監視停止': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (wid, sys) {
            navigator.geolocation.clearWatch(wid);
        },
        return_none: true
    }
};
