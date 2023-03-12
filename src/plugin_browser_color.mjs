// @ts-nocheck
export default {
    // @色定数
    '水色': { type: 'const', value: 'aqua' },
    '紫色': { type: 'const', value: 'fuchsia' },
    '緑色': { type: 'const', value: 'lime' },
    '青色': { type: 'const', value: 'blue' },
    '赤色': { type: 'const', value: 'red' },
    '黄色': { type: 'const', value: 'yellow' },
    '黒色': { type: 'const', value: 'black' },
    '白色': { type: 'const', value: 'white' },
    '茶色': { type: 'const', value: 'maroon' },
    '灰色': { type: 'const', value: 'gray' },
    '金色': { type: 'const', value: 'gold' },
    '黄金色': { type: 'const', value: 'gold' },
    '銀色': { type: 'const', value: 'silver' },
    '白金色': { type: 'const', value: 'silver' },
    'オリーブ色': { type: 'const', value: 'olive' },
    'ベージュ色': { type: 'const', value: 'beige' },
    'アリスブルー色': { type: 'const', value: 'aliceblue' },
    'RGB': {
        type: 'func',
        josi: [['と'], ['と'], ['で', 'の']],
        pure: true,
        fn: function (r, g, b) {
            const z2 = (v) => {
                const v2 = '00' + v.toString(16);
                return v2.substr(v2.length - 2, 2);
            };
            return '#' + z2(r) + z2(g) + z2(b);
        },
        return_none: false
    },
    '色混': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (a) {
            const z2 = (v) => {
                const v2 = '00' + v.toString(16);
                return v2.substr(v2.length - 2, 2);
            };
            if (!a) {
                throw new Error('『色混ぜる』の引数には配列を指定します');
            }
            if (a.length < 3) {
                throw new Error('『色混ぜる』の引数には[RR,GG,BB]形式の配列を指定します');
            }
            return '#' + z2(a[0]) + z2(a[1]) + z2(a[2]);
        },
        return_none: false
    }
};
