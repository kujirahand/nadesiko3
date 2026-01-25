/**
 * ブラウザとNode.jsでテキストへの色付けを共通化するためのコード
 */

/**
 * ANSI escape code の一部
 */
const color = { reset: '\x1b[0m', bold: '\x1b[1m', black: '\x1b[30m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m' }

// 30 ~ 37
const colorNames = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']

/** @param {string} t */
const escapeHTML = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')

/**
 * ANSI escape code で色付けしたテキストを、HTMLやブラウザのconsole.log用のフォーマットに変換する。
 * たとえば `convertColorTextFormat(`foo${color.red}bar`).html` で `"foobar"` の `"bar"` の部分が赤く表示されるHTMLを取得できる。
 * @param {string} text
 * @returns {{ nodeConsole: string, noColor: string, html: string, browserConsole: string[] }}
 */
const convertColorTextFormat = (text: string) => {
  // textから [ANSI escape code](https://en.wikipedia.org/wiki/ANSI_escape_code) を削除して、色の無いテキストを作る。
  // eslint-disable-next-line no-control-regex
  const noColor = text.replace(/\x1b\[\d+m/g, '')

  // nodeConsoleからbrowserConsoleを作る
  /** @type {string[]} */
  const browserConsoleStyles: string[] = []
  let consoleColor = 'inherit' // 文字色
  let consoleFontWeight = 'inherit' // 文字の太さ
  // /\x1b\[(\d+)m/ で正規表現マッチし、それぞれを %c で置換すると同時に browserConsoleStyles にCSSでの表現をpushする。
  // console.log(browserConsoleText, ...browserConsoleStyles) で表示することを想定。
  const browserConsoleText = text === noColor
    ? noColor
    // eslint-disable-next-line no-control-regex
    : text.replace(/\x1b\[(\d+)m/g, (_, m1str) => {
      const m1 = +m1str
      if (m1 === 0) {
        consoleColor = 'inherit'
        consoleFontWeight = 'inherit'
      }
      if (m1 === 1) {
        consoleFontWeight = 'bold'
      }
      if (m1 >= 30 && m1 <= 37) {
        consoleColor = colorNames[m1 - 30]
      }
      browserConsoleStyles.push(`color: ${consoleColor}; font-weight: ${consoleFontWeight};`)
      return '%c'
    })

  // nodeConsoleからhtmlを作る
  let htmlColor = 'inherit' // 文字色
  let htmlFontWeight = 'inherit' // 文字の太さ
  // textが色情報を含まないならそれをそのまま使い、含むなら全体を <span>で囲んで、更に、ANSI escape code で囲まれた部分を対応する style を付けた <span> で囲む。
   
  const html = text === noColor ? noColor : ('<span>' + escapeHTML(text)
    // eslint-disable-next-line no-control-regex
    .replace(/\x1b\[(\d+)m/g, (_, m1str) => { // ANSI escape code（の一部）にマッチして置換
      const m1 = +m1str
      if (m1 === 0) { // リセット
        htmlColor = 'inherit'
        htmlFontWeight = 'inherit'
      }
      if (m1 === 1) { // 太字化
        htmlFontWeight = 'bold'
      }
      if (m1 >= 30 && m1 <= 37) { // 文字色の変更
        htmlColor = colorNames[m1 - 30]
      }
      return `</span><span style="color: ${htmlColor}; font-weight: ${htmlFontWeight};">`
    }) + '</span>')

  // 各表現を返す。
  return {
    noColor,
    nodeConsole: text === noColor
      ? noColor // textが色の情報を含まないならnoColorを返す。
      : text + '\x1b[0m', // そうでなければtextの末尾に色をリセットするコードを付けて返す。
    html,
    browserConsole: [browserConsoleText, ...browserConsoleStyles]
  }
}

export const NakoColors = { convertColorTextFormat, colorNames, color }
