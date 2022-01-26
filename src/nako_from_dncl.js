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
    console.log("=====\n" + result)
    //process.exit()
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
 * DNCLからなでしこに変換する(判定なし)
 * @param {string} src
 * @param {string} filename
 * @returns {string} converted source
 */
function dncl2nako(src, filename) {
    // 全角半角を統一
    src = conv2half(src)
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
        '改行なしで表示': '継続表示',
        'のすべての値を0にする': '=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
        'ずつ増やしながら':'ずつ増やし繰り返す',
        'ずつ減らしながら':'ずつ減らし繰り返す',
    }

    // 変数名を取り出す
    let read_var_name = () => {
        // アルファベット漢字カタカナ
        const r = src.match(/^[a-zA-Z_\u3040-\u30FF\u3400-\uFAFF][0-9a-zA-Z_\u3040-\u30FF\u3400-\uFAFF]*/)
        if (!r) return ''
        // 変数名部分を得る
        let var_name = r[0]
        src = src.substring(var_name.length)
        return var_name
    }

    let result = ''
    while (src !='') {
        // 代入記号を変更
        const ch = src.charAt(0)
        // 空白を飛ばす
        if (ch === ' ' || ch === '　' || ch == '\t') {
            result += ch
            src = src.substring(1)
            continue
        }
        // 1行先読み
        let line = ''
        const i = src.indexOf('\n')
        if (i >= 0) {
            line = src.substring(0, i)
        } else {
            line = src
        }
        //「var を n 増やす」を「var = var + 1」と置き換える
        const r = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*を\s*([0-9a-zA-Z_]+)\s*(増やす|減らす)/)
        if (r) {
            const var_name = r[1]
            const inc_val = r[2]
            const inc_dec = r[3]
            if (inc_dec == '増やす') {
                result += `${var_name} = ${var_name} + ${inc_val};`
            } else {
                result += `${var_name} = ${var_name} - ${inc_val};`
            }
            src = src.substring(r[0].length)
            continue
        }
        //「S1とS2とS3を表示する」を「(S1)&(S2)&S3)を表示」と置き換える
        // あまりスマートではないが手抜きで
        if (line.indexOf('表示') >= 0) {
            const r5 = line.match(/^(.+?)と(.+?)と(.+?)と(.+?)と(.+?)を表示/)
            if (r5) {
                const s1 = r5[1]
                const s2 = r5[2]
                const s3 = r5[3]
                const s4 = r5[4]
                const s5 = r5[4]
                result += `(${s1})&(${s2})&(${s3})&(${s4})&(${s5})を表示`
                src = src.substring(r5[0].length)
                continue
            }
            const r4 = line.match(/^(.+?)と(.+?)と(.+?)と(.+?)を表示/)
            if (r4) {
                const s1 = r4[1]
                const s2 = r4[2]
                const s3 = r4[3]
                const s4 = r4[4]
                result += `(${s1})&(${s2})&(${s3})&(${s4})を表示`
                src = src.substring(r4[0].length)
                continue
            }
            const r3 = line.match(/^(.+?)と(.+?)と(.+?)を表示/)
            if (r3) {
                const s1 = r3[1]
                const s2 = r3[2]
                const s3 = r3[3]
                result += `(${s1})&(${s2})&(${s3})を表示`
                src = src.substring(r3[0].length)
                continue
            }
            const r2 = line.match(/^(.+?)と(.+?)を表示/)
            if (r2) {
                const s1 = r2[1]
                const s2 = r2[2]
                result += `(${s1})&(${s2})を表示`
                src = src.substring(r2[0].length)
                continue
            }
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
        src = src.substring(1)
        result += ch
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
