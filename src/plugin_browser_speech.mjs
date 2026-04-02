// @ts-nocheck
export default {
    // @音声合成
    '話': {
        type: 'func',
        josi: [['と', 'を', 'の']],
        pure: true,
        fn: function (s, sys) {
            const msg = sys.__exec('音声合成発話オブジェクト取得', [s, sys]);
            window.speechSynthesis.speak(msg);
            console.log('#話す:', s);
            return s;
        }
    },
    '話終': {
        type: 'func',
        josi: [['と', 'を', 'の']],
        pure: true,
        asyncFn: true,
        fn: function (s, sys) {
            return new Promise((resolve, reject) => {
                try {
                    const msg = sys.__exec('音声合成発話オブジェクト取得', [s, sys]);
                    msg.onend = () => { resolve(); };
                    window.speechSynthesis.speak(msg);
                    console.log('#話す:', s);
                }
                catch (err) {
                    reject(err instanceof Error ? err : new Error(String(err)));
                }
            });
        }
    },
    '話終時': {
        type: 'func',
        josi: [['で'], ['と', 'を', 'の']],
        pure: true,
        fn: function (callback, s, sys) {
            const msg = sys.__exec('音声合成発話オブジェクト取得', [s, sys]);
            msg.onend = (e) => {
                console.log('#話終時');
                sys.__setSysVar('対象イベント', e);
                callback(sys);
            };
            window.speechSynthesis.speak(msg);
            console.log('#話す:', s);
            return s;
        }
    },
    '音声合成発話オブジェクト取得': {
        type: 'func',
        josi: [['の', 'で']],
        pure: true,
        fn: function (s, sys) {
            // 話者の特定
            let voice = sys.__getSysVar('話:話者');
            if (!voice) {
                voice = sys.__exec('話者設定', ['ja', sys]);
            }
            // インスタンス作成
            const msg = new SpeechSynthesisUtterance(s);
            msg.voice = voice;
            if (voice) {
                msg.lang = voice.lang;
            } // 必ず話者の特定に成功している訳ではない
            msg.rate = sys.__getSysVar('話者速度');
            msg.pitch = sys.__getSysVar('話者声高');
            msg.volume = sys.__getSysVar('話者音量');
            return msg;
        }
    },
    '話者一覧取得': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            // 対応している？
            if (!('SpeechSynthesisUtterance' in window)) {
                throw new Error('音声合成APIに対応していません');
            }
            return window.speechSynthesis.getVoices();
        }
    },
    '話者設定': {
        type: 'func',
        josi: [['に', 'へ']],
        pure: true,
        fn: function (v, sys) {
            // 対応している？
            if (!('SpeechSynthesisUtterance' in window)) {
                throw new Error('音声合成APIに対応していません');
            }
            // 文字列で値を指定
            if (typeof v === 'string') {
                // 話者を特定する
                const voices = window.speechSynthesis.getVoices();
                for (const i of voices) {
                    if (i.lang.indexOf(v) >= 0 || i.name === v) {
                        const msg = new SpeechSynthesisUtterance();
                        msg.voice = i;
                        msg.lang = i.lang;
                        sys.__setSysVar('話:話者', i);
                        console.log('#話者:', i.name);
                        return i;
                    }
                }
            }
            // 話者一覧取得で得たオブジェクトを直接指定した場合
            if (typeof v === 'object') {
                sys.__setSysVar('話:話者', v);
                return v;
            }
            return undefined;
        }
    },
    '話者速度': { type: 'const', value: 1.0 }, // @わしゃそくど
    '話者声高': { type: 'const', value: 1.0 }, // @わしゃこわだか
    '話者音量': { type: 'const', value: 1.0 }, // @わしゃこおんりょう
    '話者詳細設定': {
        type: 'func',
        josi: [['で', 'に', 'へ']],
        pure: true,
        fn: function (obj, sys) {
            const changeFunc = (key, v) => {
                if (key === '速度') {
                    sys.__setSysVar('話者速度', v);
                }
                if (key === '声高' || key === 'ピッチ') {
                    sys.__setSysVar('話者声高', v);
                }
                if (key === '音量') {
                    sys.__setSysVar('話者音量', v);
                }
            };
            // 一括変更
            for (const key in obj) {
                const v = obj[key];
                changeFunc(key, v);
            }
        }
    }
};
