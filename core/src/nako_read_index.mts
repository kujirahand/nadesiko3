/**
 * 添字による読み取り (#2590, #2599)。文字列はUnicodeコードポイント単位で扱い、
 * 文字列・配列の範囲の末尾は含めない。通常の配列・辞書・プロパティはJavaScriptの参照を使う。
 * 単体JavaScriptにも埋め込むため、外部の関数には依存しない。
 */
export function readIndex (base: any, index: any): any {
  const isRange = index !== null && typeof index === 'object' &&
    typeof index['先頭'] === 'number' && typeof index['末尾'] === 'number'
  if (Array.isArray(base) && isRange) {
    return base.slice(index['先頭'], index['末尾'])
  }
  if (typeof base === 'string') {
    if (isRange) {
      return Array.from(base).slice(index['先頭'], index['末尾']).join('')
    }
    // 数字の文字列による添字も受け付ける。lengthなどのプロパティは通常の参照に戻す。
    const numberIndex = typeof index === 'string' && /^-?(0|[1-9]\d*)$/.test(index)
      ? Number(index) : index
    if (typeof numberIndex === 'number' && Number.isInteger(numberIndex)) {
      const chars = Array.from(base)
      return chars[numberIndex < 0 ? chars.length + numberIndex : numberIndex]
    }
  }
  return base[index]
}
