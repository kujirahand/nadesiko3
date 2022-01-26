/**
 * DNCLに対応する構文
 */
const { EXIT_CODE } = require('karma/lib/constants')
const { question } = require('readline-sync')
const { NakoIndentError } = require('./nako_errors')
const DNCL_KEYWORDS = ['!センター試験モード', '!DNCLモード', '!DNCL']
/**
 * DNCLのソースコードをなでしこに変換する
 * @param {String} src 
 * @param {String} filename 
 * @returns {String} converted soruce
 */
function convert(src, filename) {
    // 「!DNCLモード」を使うかチェック
    if (!isIndentSyntaxEnabled(src)) { return src }
    // 改行を合わせる
    src = src.replace(/(\r\n|\r)/g, '\n')
    // 単純置換リスト
    const simple_conv_list = {
        'を実行する': 'ここまで',
        'を実行し,そうでなくもし': '違えば、もし',
        'を実行し，そうでなくもし': '違えば、もし',
        'を実行し、そうでなくもし': '違えば、もし',
        'を実行し,そうでなければ': '違えば',
        'を実行し，そうでなければ': '違えば',
        'を実行し、そうでなければ': '違えば',
        'を繰り返す': 'ここまで'
    }

    let result = ''
    while (src !='') {
        // 代入記号を変更
        const ch = src.charAt(0)
        // !DNCLモードを空に置換
        if (ch === '!') {
            let flag = false
            for (let k of DNCL_KEYWORDS) {
                const ss = src.substring(0, k.length).replace('！','!')
                if (ss == k) {
                    src = src.substring(k.length)
                    flag = true
                    break
                }
            }
            if (flag) { continue }
            result += ch
            src = src.substring(1)
            continue
        }
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
        // 代入記号とカンマ「,」があれば「;」に置き換える
        const rl = line.match(/^\,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*←/)
        if (rl) {
            const var_name = rl[1]
            const ma = rl[0]
            result += `; ${var_name}=`
            src = src.substring(ma.length)
            continue
        }
        // その他の代入記号を変更
        if (ch === '←') {
            result += '='
            src = src.substring(1)
            continue
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
        //「varをn1からn2までn3ずつ増やしながら」を「(...)の間」と置き換える
        const rf = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*を([0-9a-zA-Z_]+?)\s*から\s*([0-9a-zA-Z_]+?)\s*まで\s*([0-9a-zA-Z_]+?)\s*ずつ増やしながら/)
        if (rf) {
            const var_name = rf[1]
            const n1 = rf[2]
            const n2 = rf[3]
            const n3 = rf[4]
            result += `${var_name}を、${n1}から${n2}まで${n3}ずつ増やし繰り返す\n`
            src = src.substring(rf[0].length)
            continue
        }
        //「varをn1からn2までn3ずつ減らしながら」を「(...)の間」と置き換える
        const rf2 = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*を([0-9a-zA-Z_]+?)\s*から\s*([0-9a-zA-Z_]+?)\s*まで\s*([0-9a-zA-Z_]+?)\s*ずつ減らしながら/)
        if (rf2) {
            const var_name = rf2[1]
            const n1 = rf2[2]
            const n2 = rf2[3]
            const n3 = rf2[4] // TODO: 対応準備
            result += `${var_name}を、${n1}から${n2}まで${n3}ずつ減らし繰り返す\n`
            src = src.substring(rf2[0].length)
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

module.exports = {
    convert,
}
