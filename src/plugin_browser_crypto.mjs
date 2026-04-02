export default {
    // @ハッシュ関数
    'ハッシュ値計算時': {
        type: 'func',
        josi: [['へ'], ['を'], ['で']],
        pure: true,
        fn: function (func, s, alg, sys) {
            func = sys.__findVar(func, null); // 文字列指定なら関数に変換(コールバック関数)
            // (ref) https://developer.mozilla.org/ja/docs/Web/API/SubtleCrypto/digest
            const msgUint8 = new TextEncoder().encode(s); // (utf-8 の) Uint8Array にエンコードする
            // メッセージをハッシュする
            crypto.subtle.digest(alg, msgUint8).then(function (hashBuffer) {
                const hashArray = Array.from(new Uint8Array(hashBuffer)); // バッファーをバイト列に変換する
                const hashHex = hashArray
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join(''); // バイト列を 16 進文字列に変換する
                const res = sys.__setSysVar('対象', hashHex);
                func(res);
            });
        },
        return_none: true
    },
    'ハッシュ値計算': {
        type: 'func',
        josi: [['を'], ['で']],
        pure: true,
        asyncFn: true,
        fn: async function (s, alg, sys) {
            const msgUint8 = new TextEncoder().encode(s); // (utf-8 の) Uint8Array にエンコードする
            const hashBuffer = await crypto.subtle.digest(alg, msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer)); // バッファーをバイト列に変換する
            const hashHex = hashArray
                .map((b) => b.toString(16).padStart(2, '0'))
                .join(''); // バイト列を 16 進文字列に変換する
            return hashHex;
        }
    },
    'ランダムUUID生成': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
            return window.crypto.randomUUID();
        }
    },
    'ランダム配列生成': {
        type: 'func',
        josi: [['の']],
        pure: true,
        fn: function (cnt, sys) {
            const array = new Uint8Array(cnt);
            window.crypto.getRandomValues(array);
            return array;
        }
    }
};
