/**
 * インデント構文指定があればコードを変換する
 * @param {String} code 
 * @return String of convert
 */
function convert(code) {
    // プログラム冒頭に「##インデント構文」があれば変換
    const keywords = ['##インデント構文\n', '＃＃インデント構文\n', '##ここまでだるい\n', '＃＃ここまでだるい\n']
    const s10 = code.substr(0, 10)
    if (keywords.indexOf(s10) >= 0) {
        return convertGo(code.substr(10)+'\n')
    }
    return code
}

function convertGo(code) {
    const lines = code.split('\n')
    const lines2 = []
    const indentStack = []
    let lastIndent = 0
    lines.forEach((line) => {
        // check indent
        const indent = countIndent(line)
        if (lastIndent == indent) {
            lines2.push(line)
            return
        }
        // indent
        if (lastIndent < indent) {
            indentStack.push(lastIndent)
            lastIndent = indent
            lines2.push(line)
            return
        }
        // unindent
        if (lastIndent > indent) {
            if (line != '') {
                lines2.push(line)
            }
            lastIndent = indent
            while(indentStack.length > 0) {
                topIndent = indentStack[indentStack.length - 1]
                if (topIndent <= indent) {
                    lines2.push(makeIndent(indent) + 'ここまで')
                    indentStack.pop()
                    continue
                }
                if (topIndent > indent) {
                    throw new Exception('インデントが壊れています')
                }
            }
        }
    })
    return lines2.join('\n')
}

function makeIndent(count) {
    let s = ''
    for (let i = 0; i < count; i++) {
        s += ' '
    }
    return s
}

function countIndent(line) {
    let cnt = 0
    for (let i = 0; i < line.length; i++) {
        const ch = line.charAt(i)
        if (ch == ' ') {
            cnt++
            conttinue
        }
        if (ch == '　') {
            cnt += 2
            continue
        }
        if (ch == '・') {
            cnt += 2
            continue
        }
        if (ch == '\t') {
            cnt += 4
            continue
        }
        break
    }
    return cnt
}


module.exports = {
    'convert': convert
}

