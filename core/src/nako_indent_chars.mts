/**
 * なでしこ3で行頭インデントに使える文字とインデントカウント数
 */
export function isIndentChars (ch: string): number {
  const code = ch.charCodeAt(0)
  // 特別なコード
  if (ch === '\t') { return 4 }
  if (ch === ' ' || ch === '|') { return 1 }
  if (ch === '・' || ch === '　') { return 2 }
  if (ch === '⏋' || ch === '⏌') { return 2 } // 0x23CB, 0x23CC
  // 罫線から --- https://github.com/kujirahand/unicode-sheets/blob/main/box-drawing.md
  if (code >= 0x2500 && code <= 0x257F) {
    return 2
  }
  // 記号から --- https://github.com/kujirahand/unicode-sheets/blob/main/misc-technical.md
  if (
    (code >= 0x23A0 && code <= 0x23AF) ||
    (code >= 0x23B8 && code <= 0x23BF)) {
    return 2
  }
  return 0
}
