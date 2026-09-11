import { NakoValue } from './plugin_api.mjs'

/**
 * 『増やす』『減らす』の加算/減算 (#2488)
 * 言語コアの増減文が依存するため、基本プラグインなし(useBasicPlugin: false)でも
 * 動作するようコア実行環境(NakoGlobal)と単体JavaScript(standalone)の両方に置く。
 * 増減対象(左辺)がbigintなら精度を保ったままBigInt演算し、それ以外は従来どおりNumber演算する。
 */
export function incValue (a: NakoValue, b: NakoValue, isDec: boolean): number | bigint {
  if (typeof a === 'bigint') {
    // null は従来どおり 0 として扱い、bigint のまま返す。undefined は従来どおり NaN として扱う (#2488)
    if (b === null) { return a }
    if (b === undefined) { return NaN }
    // 非数/無限大は従来どおり NaN / ±Infinity を Number として返す (#2488)
    if (typeof b === 'number' && !Number.isFinite(b)) { return isDec ? -b : b }
    // 文字列は末尾の n を取り除いてから BigInt 化する(『"5n"』のような書き方に対応)。
    // ただし "n" や " n" のように数値部分が無いものは無効のまま扱う(BigInt('')/BigInt(' ') が 0n になるのを防ぐ) (#2488)
    // なお Number リテラルは 2^53 を超えると JS の段階で丸められるため、大きな増減量には n 付きリテラルか文字列を使う
    const bTrim = String(b).trim()
    const bBig = (typeof b === 'string' && bTrim.length > 1 && bTrim.endsWith('n') && bTrim.slice(0, -1).trim().length > 0)
      ? BigInt(bTrim.slice(0, -1))
      : BigInt(b as string | number | bigint | boolean)
    return isDec ? a - bBig : a + bBig
  }
  return isDec ? Number(a) - Number(b) : Number(a) + Number(b)
}
