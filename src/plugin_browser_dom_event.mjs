export default {
    // @DOM操作とイベント
    '対象イベント': { type: 'const', value: '' }, // @たいしょういべんと
    'DOMイベント追加': {
        type: 'func',
        josi: [['の'], ['に', 'へ'], ['を']],
        pure: true,
        fn: function (dom, event, funcStr, sys) {
            sys.__addEvent(dom, event, funcStr, null);
        },
        return_none: true
    },
    'DOMイベント削除': {
        type: 'func',
        josi: [['の'], ['から'], ['を']],
        pure: true,
        fn: function (dom, event, funcStr, sys) {
            sys.__removeEvent(dom, event, funcStr);
        },
        return_none: true
    },
    'DOMイベント発火時': {
        type: 'func',
        josi: [['で'], ['の'], ['が']],
        pure: true,
        fn: function (callback, dom, event, sys) {
            sys.__addEvent(dom, event, callback, null);
        },
        return_none: true
    },
    'DOMイベント処理停止': {
        type: 'func',
        josi: [['を', 'の']],
        pure: true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fn: function (event, sys) {
            if (event !== null && typeof event === 'object' && 'preventDefault' in event) {
                const objWithFn = event;
                if (typeof objWithFn.preventDefault === 'function') {
                    objWithFn.preventDefault();
                }
            }
        },
        return_none: true
    },
    'クリック時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'click', func, sys.__mouseHandler);
        },
        return_none: true
    },
    'ダブルクリック時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'dblclick', func, sys.__mouseHandler);
        },
        return_none: true
    },
    '右クリック時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'contextmenu', func, sys.__mouseHandler);
        },
        return_none: true
    },
    '変更時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'change', func, null);
        },
        return_none: true
    },
    '読込時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'load', func, null);
        },
        return_none: true
    },
    'フォーム送信時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'submit', func, null);
        },
        return_none: true
    },
    '押キー': { type: 'const', value: '' }, // @おされたきー
    'キー押時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'keydown', func, sys.__keyHandler);
        },
        return_none: true
    },
    'キー離時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'keyup', func, sys.__keyHandler);
        },
        return_none: true
    },
    'キータイピング時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'keypress', func, sys.__keyHandler);
        },
        return_none: true
    },
    'マウスX': { type: 'const', value: 0 }, // @まうすX
    'マウスY': { type: 'const', value: 0 }, // @まうすY
    '押ボタン': { type: 'const', value: 0 }, // @おされたぼたん
    'マウス押時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'mousedown', func, sys.__mouseHandler);
        },
        return_none: true
    },
    'マウス移動時': {
        type: 'func',
        josi: [['で'], ['を', 'の', 'へ', 'に']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'mousemove', func, sys.__mouseHandler);
        },
        return_none: true
    },
    'マウス離時': {
        type: 'func',
        josi: [['で'], ['を', 'の', 'から']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'mouseup', func, sys.__mouseHandler);
        },
        return_none: true
    },
    'マウス入時': {
        type: 'func',
        josi: [['で'], ['を', 'の', 'に', 'へ']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'mouseover', func, sys.__mouseHandler);
        },
        return_none: true
    },
    'マウス出時': {
        type: 'func',
        josi: [['で'], ['を', 'の', 'から']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'mouseout', func, sys.__mouseHandler);
        },
        return_none: true
    },
    'マウスホイール値': { type: 'const', value: 0 }, // @まうすほいーるち
    'マウスホイール時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'wheel', func, ((e) => {
                const objWithDeltaY = e;
                if (typeof objWithDeltaY.deltaY === 'number') {
                    sys.__setSysVar('マウスホイール値', objWithDeltaY.deltaY);
                }
            }));
        },
        return_none: true
    },
    'タッチX': { type: 'const', value: 0 }, // @たっちX
    'タッチY': { type: 'const', value: 0 }, // @たっちY
    'タッチ配列': { type: 'const', value: [] }, // @たっちはいれつ
    'タッチイベント計算': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (e, sys) {
            return sys.__touchHandler(e, sys);
        }
    },
    'タッチ開始時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'touchstart', func, sys.__touchHandler);
        },
        return_none: true
    },
    'タッチ時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'touchmove', func, sys.__touchHandler);
        },
        return_none: true
    },
    'タッチ終了時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'touchend', func, sys.__touchHandler);
        },
        return_none: true
    },
    'タッチキャンセル時': {
        type: 'func',
        josi: [['で'], ['を', 'の']],
        pure: true,
        fn: function (func, dom, sys) {
            sys.__addEvent(dom, 'touchcancel', func, sys.__touchHandler);
        },
        return_none: true
    },
    '画面更新時実行': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (func, sys) {
            func = sys.__findVar(func, null); // 文字列指定なら関数に変換
            if (!func) {
                throw new Error('『画面更新時実行』で関数の取得に失敗しました。');
            }
            sys.__requestAnimationFrameLastId = window.requestAnimationFrame(func);
            return sys.__requestAnimationFrameLastId;
        }
    },
    '画面更新処理取消': {
        type: 'func',
        josi: [['の', 'を']],
        pure: true,
        fn: function (id, sys) {
            window.cancelAnimationFrame(id);
            if (sys.__requestAnimationFrameLastId === id) {
                sys.__requestAnimationFrameLastId = 0;
            }
        },
        return_none: true
    }
};
