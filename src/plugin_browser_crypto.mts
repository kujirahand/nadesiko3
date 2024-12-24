export default {
  // @ハッシュ関数
  'ハッシュ値計算時': { // @データSをアルゴリズムALG(sha-256/sha-384/sha-512)のエンコーディングでハッシュ値を計算して変数「対象」に代入する。 // @ はっしゅちけいさんしたとき
    type: 'func',
    josi: [['へ'], ['を'], ['で']],
    pure: true,
    fn: function (func: any, s: string, alg: string, sys: any) {
      func = sys.__findVar(func, null) // 文字列指定なら関数に変換(コールバック関数)
      // (ref) https://developer.mozilla.org/ja/docs/Web/API/SubtleCrypto/digest
      const msgUint8 = new TextEncoder().encode(s) // (utf-8 の) Uint8Array にエンコードする
      // メッセージをハッシュする
      crypto.subtle.digest(alg, msgUint8).then(function (hashBuffer: ArrayBuffer) {
        const hashArray = Array.from(new Uint8Array(hashBuffer)); // バッファーをバイト列に変換する
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""); // バイト列を 16 進文字列に変換する
        const res = sys.__setSysVar('対象', hashHex)
        func(res)
      })
    },
    return_none: true
  },
  'ハッシュ値計算': { // @データSをアルゴリズムALG(sha-256/sha-384/sha-512)のエンコーディングでハッシュ値を計算して返す // @ はっしゅちけいさん
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    asyncFn: true,
    fn: async function (s: string, alg: string, sys: any) {
      const msgUint8 = new TextEncoder().encode(s) // (utf-8 の) Uint8Array にエンコードする
      const hashBuffer = await crypto.subtle.digest(alg, msgUint8)
      const hashArray = Array.from(new Uint8Array(hashBuffer)); // バッファーをバイト列に変換する
      const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""); // バイト列を 16 進文字列に変換する
      return hashHex
    },
  },
  'ランダムUUID生成': { // @ランダムに生成された36文字のv4 UUID(文字列)を返す // @ らんだむUUIDせいせい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
      return window.crypto.randomUUID()
    },
  },
  'ランダム配列生成': { // @暗号強度の強い乱数のバイト配列(Uint8Array)を指定個数返す // @ らんだむはいれつせいせい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (cnt: number, sys: any) {
      const array = new Uint8Array(cnt);
      window.crypto.getRandomValues(array);
      return array
    },
  },
}
