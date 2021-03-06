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
const escapeHTML = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')

/**
 * ANSI escape code で色付けしたテキストを、HTMLやブラウザのconsole.log用のフォーマットに変換する。
 * @param {string} text
 * @returns {{ nodeConsole: string, noColor: string, html: string, browserConsole: string[] }}
 */
const convertColorTextFormat = (text) => {
    // nodeConsoleからnocolorを作る
    const noColor = text.replace(/\x1b\[\d+m/g, '')

    // nodeConsoleからbrowserConsoleを作る
    /** @type {string[]} */
    const browserConsoleStyles = []
    let consoleColor = 'inherit'
    let consoleFontWeight = 'inherit'
    const browserConsoleText = text === noColor ? noColor : text.replace(/\x1b\[(\d+)m/g, (_, m1str) => {
        const m1 = +m1str
        if (m1 === 0) {
            consoleColor = 'inherit'
            consoleFontWeight = 'inherit'
        }
        if (m1 === 1) {
            consoleFontWeight = 'bold'
        }
        if (30 <= m1 && m1 <= 37) {
            consoleColor = colorNames[m1 - 30]
        }
        browserConsoleStyles.push(`color: ${consoleColor}; font-weight: ${consoleFontWeight};`)
        return '%c'
    })

    // nodeConsoleからhtmlを作る
    let htmlColor = 'inherit'
    let htmlFontWeight = 'inherit'
    const html = text === noColor ? noColor : ('<span>' + escapeHTML(text)
        .replace(/\x1b\[(\d+)m/g, (_, m1str) => {
            const m1 = +m1str
            if (m1 === 0) {
                htmlColor = 'inherit'
                htmlFontWeight = 'inherit'
            }
            if (m1 === 1) {
                htmlFontWeight = 'bold'
            }
            if (30 <= m1 && m1 <= 37) {
                htmlColor = colorNames[m1 - 30]
            }
            return `</span><span style="color: ${htmlColor}; font-weight: ${htmlFontWeight};">`
        }) + '</span>')

    return {
        noColor,
        nodeConsole: text === noColor ? noColor : text + '\x1b[0m',
        html,
        browserConsole: [browserConsoleText, ...browserConsoleStyles],
    }
}

module.exports = { convertColorTextFormat, colorNames, color }
