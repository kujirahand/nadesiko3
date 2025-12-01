export default {
    // @カメラ
    'カメラオプション': { type: 'const', value: { video: true, audio: false } }, // @かめらおぷしょん
    'カメラ起動': {
        type: 'func',
        josi: [['の', 'に', 'へ', 'で']],
        pure: true,
        asyncFn: true,
        fn: async function (v, sys) {
            sys.tags.usingCamera = true;
            sys.tags.cameraElement = v;
            const options = sys.__getSysVar('カメラオプション');
            const stream = await navigator.mediaDevices.getUserMedia(options);
            v.srcObject = stream;
            const settings = sys.__exec('カメラ設定取得', [v, sys]);
            if (settings.width && settings.height) {
                v.width = settings.width;
                v.height = settings.height;
            }
            v.onloadedmetadata = function () {
                v.play();
            };
        },
        return_none: true
    },
    'カメラ終了': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v, sys) {
            if (v) {
                sys.__exec('メディアストリーム停止', [v, sys]);
                v.srcObject = null;
            }
            sys.tags.usingCamera = false;
        },
        return_none: true
    },
    'カメラ映像再生': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v, sys) {
            if (v && v.play) {
                v.play();
            }
        },
        return_none: true
    },
    'カメラ映像一時停止': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v, sys) {
            if (v && v.pause) {
                v.pause();
            }
        },
        return_none: true
    },
    'カメラ設定取得': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v, sys) {
            if (v && v.srcObject && v.srcObject.getVideoTracks) {
                const tracks = v.srcObject.getVideoTracks();
                if (tracks.length > 0) {
                    const settings = tracks[0].getSettings();
                    return settings;
                }
                return {};
            }
            return {};
        },
        return_none: false
    },
    'メディアストリーム取得': {
        type: 'func',
        josi: [],
        pure: true,
        asyncFn: true,
        fn: async function (sys) {
            const options = sys.__getSysVar('カメラオプション');
            return await navigator.mediaDevices.getUserMedia(options);
        },
        return_none: false
    },
    'メディアストリーム停止': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v, sys) {
            if (v && v.srcObject && v.srcObject.getVideoTracks) {
                const tracks = v.srcObject.getVideoTracks();
                for (const track of tracks) {
                    track.stop();
                }
            }
        },
        return_none: false
    }
};
