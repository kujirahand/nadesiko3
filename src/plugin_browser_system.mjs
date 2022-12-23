export default {
    // @システム
    'WNAKOバージョン': { type: 'const', value: '' },
    '終': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            // v3.3.74以降 plguin_system.mjsと挙動が同じになった
            // デバッグモードでなければ例外を投げることでプログラムを終了させる
            if (sys && sys.__v0) {
                sys.__v0.forceClose = true;
                if (!sys.__v0.useDebug) {
                    throw new Error('__終わる__');
                }
            }
            else {
                throw new Error('__終わる__');
            }
        },
        return_none: true
    },
    'OS取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            const ua = window.navigator.userAgent.toLowerCase();
            if (ua.indexOf('windows') !== -1) {
                return 'windows';
            }
            if (ua.indexOf('android') !== -1) {
                return 'android';
            }
            if (ua.indexOf('iphone') !== -1) {
                return 'iphone';
            }
            if (ua.indexOf('ipad') !== -1) {
                return 'ipad';
            }
            if (ua.indexOf('mac os x') !== -1) {
                return 'darwin';
            }
            if (ua.indexOf('macintosh') !== -1) {
                return 'darwin';
            }
            if (ua.indexOf('cros') !== -1) {
                return 'chromeos';
            }
            if (ua.indexOf('ubuntu') !== -1) {
                return 'ubuntu';
            }
            if (ua.indexOf('linux') !== -1) {
                return 'linux';
            }
            return 'unknown';
        }
    }
};
