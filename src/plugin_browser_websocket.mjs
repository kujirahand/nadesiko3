// @ts-nocheck
export default {
    // @WebSocket
    'WS接続完了時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (callback, sys) {
            sys.__v0['WS:ONOPEN'] = callback;
        },
        return_none: true
    },
    'WS受信時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (callback, sys) {
            sys.__v0['WS:ONMESSAGE'] = callback;
        },
        return_none: true
    },
    'WSエラー発生時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (callback, sys) {
            sys.__v0['WS:ONERROR'] = callback;
        },
        return_none: true
    },
    'WS接続': {
        type: 'func',
        josi: [['に', 'へ', 'の']],
        pure: true,
        fn: function (s, sys) {
            const ws = new WebSocket(s);
            ws.onopen = () => {
                const cbOpen = sys.__v0['WS:ONOPEN'];
                if (cbOpen) {
                    cbOpen(sys);
                }
            };
            ws.onerror = (err) => {
                const cbError = sys.__v0['WS:ONERROR'];
                if (cbError) {
                    cbError(err, sys);
                }
                console.log('WSエラー', err);
            };
            ws.onmessage = (e) => {
                sys.__v0['対象'] = e.data;
                const cbMsg = sys.__v0['WS:ONMESSAGE'];
                if (cbMsg) {
                    cbMsg(sys);
                }
            };
            sys.__v0['WS:SOCKET'] = ws;
            return ws;
        }
    },
    'WS送信': {
        type: 'func',
        josi: [['を', 'と']],
        pure: true,
        fn: function (s, sys) {
            const ws = sys.__v0['WS:SOCKET'];
            ws.send(s);
        }
    },
    'WS切断': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const ws = sys.__v0['WS:SOCKET'];
            ws.close();
        }
    }
};
