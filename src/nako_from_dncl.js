/**
 * DNCLに対応する構文
 */
const { NakoIndentError } = require('./nako_errors')
const NakoPrepare = require('./nako_prepare')

const DNCL_KEYWORDS = ['!DNCLモード']
/**
 * DNCLのソースコードをなでしこに変換する
 * @param {String} src 
 * @param {String} filename 
 * @returns {String} converted soruce
 */
function convert(src, filename) {
    // 改行を合わせる
    src = src.replace(/(\r\n|\r)/g, '\n')
    // 「!DNCLモード」を使うかチェック
    if (!isIndentSyntaxEnabled(src)) { return src }
    let result = dncl2nako(src, filename)
    // console.log("=====\n" + result)
    // process.exit()
    return result
}

function isIndentSyntaxEnabled(src) {
  // プログラム冒頭に「!DNCLモード」があればDNCL構文が有効
  const keywords = DNCL_KEYWORDS
  const lines = src.split('\n', 30)
  for (const line of lines) {
    const line2 = line.replace('！', '!')
    if (keywords.indexOf(line2) >= 0) {
      return true
    }
  }
  return false
}

/**
 * make space string
 * @param {number} n 
 */
function make_spaces(n) {
    let s = ''
    for (let i = 0; i < n; i++) {
        s += ' '
    }
    return s
}

/**
 * DNCLからなでしこに変換する(判定なし)
 * @param {string} src
 * @param {string} filename
 * @returns {string} converted source
 */
function dncl2nako(src, filename) {
    // 全角半角を統一
    src = conv2half(src)
    // 行頭の「|」はインデントを表す記号
    const a = src.split('\n')
    for (let i = 0; i < a.length; i++) {
        a[i] = a[i].replace(/^(\s*[|\s]+)(.*$)/, (m0, m1, m2) => {
            return make_spaces(m1.length) + m2
        })
    }
    src = a.join('\n')
    // ---------------------------------
    // 置換開始
    // ---------------------------------
    // 単純置換リスト
    const simple_conv_list = {
        'を実行する': 'ここまで',
        'を実行し,そうでなくもし': '違えば、もし',
        'を実行し，そうでなくもし': '違えば、もし',
        'を実行し、そうでなくもし': '違えば、もし',
        'を実行し,そうでなければ': '違えば',
        'を実行し，そうでなければ': '違えば',
        'を実行し、そうでなければ': '違えば',
        'を繰り返す': 'ここまで',
        '改行なしで表示': '連続無改行表示',
        'のすべての値を0にする': '=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
        'のすべての要素を0にする': '=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
        'ずつ増やしながら':'ずつ増やし繰り返す',
        'ずつ減らしながら':'ずつ減らし繰り返す',
        '二進で表示': '二進表示',
    }
    let peekChar = () => src.charAt(0)
    let nextChar = () => {
        let ch = src.charAt(0)
        src = src.substring(1)
        return ch
    }
    // 文字列を判定するフラグ
    let flagStr = false
    let poolStr = ''
    let endStr = ''
    // 結果
    let result = ''
    while (src !='') {
        // 代入記号を変更
        const ch = src.charAt(0)
        if (flagStr) {
            if (ch === endStr) {
                result += poolStr + endStr
                poolStr = ''
                flagStr = false
                nextChar()
                continue
            }
            poolStr += nextChar()
            continue
        }
        // 文字列？
        if (ch == '"') {
            flagStr = true
            endStr = '"'
            poolStr = nextChar()
            continue
        }
        if (ch == '「') {
            flagStr = true
            endStr = '」'
            poolStr = nextChar()
            continue
        }
        if (ch == '『') {
            flagStr = true
            endStr = '』'
            poolStr = nextChar()
            continue
        }
        // 空白を飛ばす
        if (ch === ' ' || ch === '　' || ch == '\t') {
            result += nextChar()
            continue
        }
        // 表示を連続表示に置き換える
        const ch3 = src.substring(0, 3)
        if (ch3 === 'を表示') {
            result += 'を連続表示'
            src = src.substring(3)
            continue
        }
        if (src.substring(0, 4) === 'を 表示') {
            result += 'を連続表示'
            src = src.substring(4)
            continue
        }
        // 乱数を乱数範囲に置き換える
        if (src.substring(0, 2) === '乱数' && src.substring(0, 4) !== '乱数範囲') {
            result += '乱数範囲'
            src = src.substring(2)
            continue
        }
        // 増やす・減らすの前に「だけ」を追加する #1149
        if (ch3 === '増やす' || ch3 === '減らす') {
            result += 'だけ' + ch3
            src = src.substring(3)
        }
        // 1行先読み
        let line = ''
        const i = src.indexOf('\n')
        if (i >= 0) {
            line = src.substring(0, i)
        } else {
            line = src
        }
        // 『もしj>hakosuならばhakosu←jを実行する』のような単文のもし文
        const rif = line.match(/^もし(.+)を実行する(。|．)*/)
        if (rif) {
            const sent = dncl2nako(rif[1], filename)
            result += `もし、${sent};`
            src = src.substring(rif[0].length)
            continue
        }        
        // 一覧から単純な変換
        {
            let flag = false
            for (let key in simple_conv_list) {
                const src_key = src.substring(0, key.length)
                if (src_key === key) {
                    result += simple_conv_list[key]
                    src = src.substring(key.length)
                    flag = true
                    break
                }
            }
            if (flag) { continue }
        }

        // 1文字削る
        result += nextChar()
    }
    return result
}

/**
 * 半角に変換
 * @param {String} src
 * @returns {string} converted source
 */
function conv2half(src) {
    const prepare = new NakoPrepare() // `※`, `／/`, `／＊` といったパターン全てに対応するために必要
    // 全角半角の統一
    let result = ''
    let flagStr = false
    let flagStrClose = ''
    for (let i = 0; i < src.length; i++) {
        let c = src.charAt(i)
        let cHalf = prepare.convert1ch(c)
        if (flagStr) {
            if (cHalf === flagStrClose) {
                flagStr = false
                flagStrClose = ''
                result += cHalf
                continue
            }
            result += c
            continue
        }
        if (cHalf === '「') {
            flagStr = true
            flagStrClose = '」'
            result += cHalf
            continue
        }
        if (cHalf === '"') {
            flagStr = true
            flagStrClose = '"'
            result += cHalf
            continue
        }
        // 単純な置き換えはここでやってしまう
        // 配列記号の { ... } を [ ... ] に置換
        if (cHalf === '{') { cHalf = '[' }
        if (cHalf === '}') { cHalf = ']' }
        if (cHalf === '←') { cHalf = '=' }
        result += cHalf
    }
    return result
}


module.exports = {
    convert,
}
