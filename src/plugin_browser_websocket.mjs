// @ts-nocheck
export default {
    // @WebSocket
    'WS接続完了時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (callback, sys) {
            sys.__setSysVar('WS:ONOPEN', callback);
        },
        return_none: true
    },
    'WS受信時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (callback, sys) {
            sys.__setSysVar('WS:ONMESSAGE', callback);
        },
        return_none: true
    },
    'WSエラー発生時': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (callback, sys) {
            sys.__setSysVar('WS:ONERROR', callback);
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
                const cbOpen = sys.__getSysVar('WS:ONOPEN');
                if (cbOpen) {
                    cbOpen(sys);
                }
            };
            ws.onerror = (err) => {
                const cbError = sys.__getSysVar('WS:ONERROR');
                if (cbError) {
                    cbError(err, sys);
                }
                console.log('WSエラー', err);
            };
            ws.onmessage = (e) => {
                sys.__setSysVar('対象', e.data);
                const cbMsg = sys.__getSysVar('WS:ONMESSAGE');
                if (cbMsg) {
                    cbMsg(sys);
                }
            };
            sys.__setSysVar('WS:SOCKET', ws);
            return ws;
        }
    },
    'WS送信': {
        type: 'func',
        josi: [['を', 'と']],
        pure: true,
        fn: function (s, sys) {
            const ws = sys.__getSysVar('WS:SOCKET');
            ws.send(s);
        }
    },
    'WS切断': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            const ws = sys.__getSysVar('WS:SOCKET');
            ws.close();
        }
    }
};
