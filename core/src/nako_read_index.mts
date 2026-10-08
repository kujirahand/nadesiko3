/**
 * 添字による読み取り (#2590, #2599)。文字列はUnicodeコードポイント単位で扱い、
 * 文字列・配列の範囲の末尾は含めない。通常の配列・辞書・プロパティはJavaScriptの参照を使う。
 * 単体JavaScriptにも埋め込むため、外部の関数には依存しない。
 */
export function createReadIndex (): (base: any, index: any) => any {
  // 実行環境ごとに直前の文字列だけを保持する。繰り返しの添字アクセスで
  // 全文の走査・配列化を繰り返さず、異なる文字列を無制限に蓄積しない。
  let lastString: string | undefined
  let lastChars: string[] | null = null
  return function readIndex (base: any, index: any): any {
    const isRange = index !== null && typeof index === 'object' &&
      typeof index['先頭'] === 'number' && typeof index['末尾'] === 'number'
    if (Array.isArray(base) && isRange) {
      return base.slice(index['先頭'], index['末尾'])
    }
    if (typeof base === 'string') {
      // 数字の文字列による添字も受け付ける。lengthなどのプロパティは通常の参照に戻す。
      const numberIndex = typeof index === 'string' && /^-?(0|[1-9]\d*)$/.test(index)
        ? Number(index) : index
      if (isRange || (typeof numberIndex === 'number' && Number.isInteger(numberIndex))) {
        if (base !== lastString) {
          // サロゲートを含まなければ文字列を直接読む。判定も同じ文字列では一度だけ。
          lastChars = /[\uD800-\uDFFF]/.test(base) ? Array.from(base) : null
          lastString = base
        }
        const chars = lastChars ?? base
        if (isRange) {
          return lastChars === null
            ? base.slice(index['先頭'], index['末尾'])
            : lastChars.slice(index['先頭'], index['末尾']).join('')
        }
        return chars[numberIndex < 0 ? chars.length + numberIndex : numberIndex]
      }
    }
    return base[index]
  }
}
