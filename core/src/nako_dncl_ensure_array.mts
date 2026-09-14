/**
 * DNCLモードの配列自動初期化 (#1140)
 * 言語コアのDNCL配列初期化が依存するため、基本プラグインなし(useBasicPlugin: false)でも
 * 動作するようコア実行環境(NakoGlobal)と単体JavaScript(standalone)の両方に置く。
 * 生成コードから `__self.__dncl_ensure_array(base, idx)` として呼ばれる。
 *
 * 多次元配列の中間要素 base[idx] が未定義かオブジェクトでない場合に既定配列で
 * 初期化する。既定配列は0埋めのため数値0は初期化対象に含め、既存のオブジェクトは
 * 上書きしない。baseが文字列等のオブジェクトでない場合は添字への代入が
 * できないため初期化しない。
 *
 * 代入には Reflect.set を使う。ESモジュールは常に厳格モードのため素の代入だと
 * 凍結要素等への書き込みで例外を投げるが、従来の非厳格コードでは代入が黙って
 * 失敗しつつ代入式は右辺(既定配列)を返していた。Reflect.set なら例外を投げず、
 * 失敗時も既定配列を返すことで従来挙動を維持する。
 * @param base 親となる配列・オブジェクト
 * @param idx 添字
 * @returns base[idx]。初期化した場合は既定配列 (代入失敗時は一時的な既定配列)
 */
export function dnclEnsureArray (base: any, idx: any): any {
  if (typeof base === 'object' && base !== null &&
      (base[idx] == null || typeof base[idx] !== 'object')) {
    // DNCL_ARRAY_DEF_CODE(nako_gen)と同じ30要素の既定配列を生成する
    const def = Array(30).fill(0)
    Reflect.set(base, idx, def)
    return def
  }
  return base[idx]
}
