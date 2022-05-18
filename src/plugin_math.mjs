// @ts-nocheck
export default {
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (_sys) {
            // 初期化不要
        }
    },
    // @三角関数
    'SIN': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v) {
            return Math.sin(v);
        }
    },
    'COS': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v) {
            return Math.cos(v);
        }
    },
    'TAN': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v) {
            return Math.tan(v);
        }
    },
    'ARCSIN': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v) {
            return Math.asin(v);
        }
    },
    'ARCCOS': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v) {
            return Math.acos(v);
        }
    },
    'ARCTAN': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v) {
            return Math.atan(v);
        }
    },
    'ATAN2': {
        type: 'func',
        josi: [['と'], ['の']],
        pure: true,
        fn: function (y, x) {
            return Math.atan2(y, x);
        }
    },
    '座標角度計算': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (XY) {
            return Math.atan2(XY[1], XY[0]) * 180 / Math.PI;
        }
    },
    'RAD2DEG': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (v) {
            return v / Math.PI * 180;
        }
    },
    'DEG2RAD': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (v) {
            return (v / 180) * Math.PI;
        }
    },
    '度変換': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (v) {
            return v / Math.PI * 180;
        }
    },
    'ラジアン変換': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (v) {
            return (v / 180) * Math.PI;
        }
    },
    // @算術関数
    'SIGN': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (v) {
            return (parseFloat(v) === 0) ? 0 : (v > 0) ? 1 : -1;
        }
    },
    '符号': {
        type: 'func',
        josi: [['の']],
        pure: false,
        fn: function (v, sys) {
            return sys.__exec('SIGN', [v]);
        }
    },
    'ABS': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return Math.abs(a);
        }
    },
    '絶対値': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return Math.abs(a);
        }
    },
    'EXP': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return Math.exp(a);
        }
    },
    'HYPOT': {
        type: 'func',
        josi: [['と'], ['の']],
        pure: true,
        fn: function (a, b) {
            return Math.hypot(a, b);
        }
    },
    '斜辺': {
        type: 'func',
        josi: [['と'], ['の']],
        pure: true,
        fn: function (a, b) {
            return Math.hypot(a, b);
        }
    },
    'LN': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return Math.log(a);
        }
    },
    'LOG': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return Math.log(a);
        }
    },
    'LOGN': {
        type: 'func',
        josi: [['で'], ['の']],
        pure: true,
        fn: function (a, b) {
            if (a === 2) {
                return Math.LOG2E * Math.log(b);
            }
            if (a === 10) {
                return Math.LOG10E * Math.log(b);
            }
            return Math.log(b) / Math.log(a);
        }
    },
    'FRAC': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return a % 1;
        }
    },
    '小数部分': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return a % 1;
        }
    },
    '整数部分': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return Math.trunc(a);
        }
    },
    '乱数': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return Math.floor(Math.random() * a);
        }
    },
    '乱数範囲': {
        type: 'func',
        josi: [['から'], ['までの', 'の']],
        pure: true,
        fn: function (a, b) {
            return (Math.floor(Math.random() * (b - a + 1)) + a);
        }
    },
    'SQRT': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return Math.sqrt(a);
        }
    },
    '平方根': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            return Math.sqrt(a);
        }
    },
    // @数値切上切捨丸め
    'ROUND': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (v) {
            return Math.round(v);
        }
    },
    '四捨五入': {
        type: 'func',
        josi: [['を', 'の']],
        pure: true,
        fn: function (v) {
            return Math.round(v);
        }
    },
    '小数点切上': {
        type: 'func',
        josi: [['を'], ['で']],
        pure: true,
        fn: function (a, b) {
            const base = Math.pow(10, b);
            return Math.ceil(a * base) / base;
        }
    },
    '小数点切下': {
        type: 'func',
        josi: [['を'], ['で']],
        pure: true,
        fn: function (a, b) {
            const base = Math.pow(10, b);
            return Math.floor(a * base) / base;
        }
    },
    '小数点四捨五入': {
        type: 'func',
        josi: [['を'], ['で']],
        pure: true,
        fn: function (a, b) {
            const base = Math.pow(10, b);
            return Math.round(a * base) / base;
        }
    },
    'CEIL': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (v) {
            return Math.ceil(v);
        }
    },
    '切上': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (v) {
            return Math.ceil(v);
        }
    },
    'FLOOR': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (v) {
            return Math.floor(v);
        }
    },
    '切捨': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (v) {
            return Math.floor(v);
        }
    }
};
