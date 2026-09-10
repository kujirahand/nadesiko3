/**
 * @fileOverview クエリ文字列の解析を提供する共通ユーティリティ
 *
 * 標準命令(plugin_system_url)と簡易HTTPサーバ(plugin_httpserver)で
 * 同じクエリ解析ロジックを使うための共通モジュール。(#2493)
 */

/** クエリ文字列を解析して辞書を返す。
 * URLSearchParams により、`&`区切り・最初の`=`で分割し、`+`は空白に変換する。
 * 非16進のpercentエンコーディングは生の文字列のまま保持する。
 * 無効なUTF-8シーケンスは環境によりU+FFFD(置換文字)に置換される場合がある。
 * 重複するキーは最後の値で上書きする。
 * `__proto__`はsetter経由でprototypeが変更されるのを防ぎ、他のキーは通常通り格納する。
 */
export function parseQueryString(query: string): { [key: string]: string } {
  // Object.create(null)ではなく通常のObjectを使う理由:
  // なでしこ3の反復構文(各〜で)はObject.prototype.hasOwnPropertyを呼ぶため、nullプロトタイプでは動かない。
  const res: { [key: string]: string } = {}
  const sp = new URLSearchParams(query)
  for (const [key, val] of sp.entries()) {
    if (key === '__proto__') {
      // __proto__はsetterが働くためdefinePropertyで安全に設定する
      Object.defineProperty(res, key, {
        value: val,
        enumerable: true,
        writable: true,
        configurable: true
      })
    } else {
      res[key] = val
    }
  }
  return res
}