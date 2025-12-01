/* eslint-disable quote-props */
export default {
    // @オーディオ
    'オーディオ開': {
        type: 'func',
        josi: [['を', 'の']],
        pure: true,
        fn: function (url, sys) {
            const a = new Audio();
            a.src = url;
            return a;
        },
        return_none: false
    },
    'オーディオ再生': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (obj, sys) {
            if (!obj) {
                throw new Error('オーディオ再生する前に、オーディオ開くで音声ファイルを読み込んでください');
            }
            obj.loop = false;
            obj.play();
        },
        return_none: true
    },
    'オーディオループ再生': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (obj, sys) {
            if (!obj) {
                throw new Error('オーディオ再生する前に、オーディオ開くで音声ファイルを読み込んでください');
            }
            obj.loop = true;
            obj.play();
        },
        return_none: true
    },
    'オーディオ停止': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (obj, sys) {
            if (!obj) {
                throw new Error('オーディオ停止する前に、オーディオ開くで音声ファイルを読み込んでください');
            }
            obj.pause();
            obj.currentTime = 0; // 暫定
            // オーディオ停止で再生位置が0に戻らない問題(#715)
            setTimeout(() => {
                obj.currentTime = 0; // しっかりと設定
            }, 10);
        },
        return_none: true
    },
    'オーディオ一時停止': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (obj, sys) {
            if (!obj) {
                throw new Error('オーディオ一時停止する前に、オーディオ開くで音声ファイルを読み込んでください');
            }
            obj.pause();
        },
        return_none: true
    },
    'オーディオ音量取得': {
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (obj, sys) {
            if (!obj) {
                throw new Error('オーディオ長取得する前に、オーディオ開くで音声ファイルを読み込んでください');
            }
            return obj.volume;
        }
    },
    'オーディオ音量設定': {
        type: 'func',
        josi: [['を'], ['に', 'へ']],
        pure: true,
        fn: function (obj, v, sys) {
            if (!obj) {
                throw new Error('オーディオ長取得する前に、オーディオ開くで音声ファイルを読み込んでください');
            }
            obj.volume = v;
        },
        return_none: true
    },
    'オーディオ長取得': {
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (obj, sys) {
            if (!obj) {
                throw new Error('オーディオ長取得する前に、オーディオ開くで音声ファイルを読み込んでください');
            }
            return obj.duration;
        }
    },
    'オーディオ再生位置取得': {
        type: 'func',
        josi: [['の', 'から']],
        pure: true,
        fn: function (obj, sys) {
            if (!obj) {
                throw new Error('オーディオ再生位置取得する前に、オーディオ開くで音声ファイルを読み込んでください');
            }
            return obj.currentTime;
        }
    },
    'オーディオ再生位置設定': {
        type: 'func',
        josi: [['を'], ['に', 'へ']],
        pure: true,
        fn: function (obj, v, sys) {
            if (!obj) {
                throw new Error('オーディオ停止する前に、オーディオ開くで音声ファイルを読み込んでください');
            }
            obj.currentTime = v;
        },
        return_none: true
    }
};
