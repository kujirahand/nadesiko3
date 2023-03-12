export default {
    // @ハッシュ関数
    'ハッシュ値計算時': {
        type: 'func',
        josi: [['へ'], ['を'], ['で']],
        pure: true,
        fn: function (func, s, alg, sys) {
            func = sys.__findVar(func, null); // 文字列指定なら関数に変換
            // convert
            const buffer = new TextEncoder().encode(s);
            crypto.subtle.digest(alg, buffer).then(function (hash) {
                const codes = [];
                const view = new DataView(hash);
                for (let i = 0; i < view.byteLength; i += 4) {
                    const v = view.getUint32(i);
                    const h = v.toString(16);
                    const pad = '00' + h;
                    codes.push(pad.substr(pad.length - 2, 2));
                }
                const res = sys.__v0['対象'] = codes.join('');
                func(res);
            });
        },
        return_none: true
    }
};
