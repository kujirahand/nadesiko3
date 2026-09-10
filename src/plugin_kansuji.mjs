// @ts-nocheck
const PluginKansuji = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_kansuji', // プラグインの名前
      description: '漢数字を使うためのプラグイン', // 説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },

  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
    }
  },

  // @漢数字関連
  '漢数字': { // @引数を数字と解釈して漢数字の文字列を返す // @かんすうじ
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (input) {
      function preprocesser (input) {
        // eslint-disable-next-line camelcase
        function if_number_is_exponent (input) {
          // 符号・仮数・指数を分離して、仮数部を文字列操作で桁移動する
          const match = input.match(/^([-+]?)([0-9]+\.?[0-9]*|\.[0-9]+)[eE]([-+]?[0-9]+)$/)
          if (!match) { return input }
          const sign = match[1]
          const mantissa = match[2]
          const exponent = parseInt(match[3], 10)
          return sign + moveDecimalPoint(mantissa, exponent)
        }
        function asciify (input) { // 全角数字を半角数字に
          return input.replace(/[０-９]/g, s => {
            return String.fromCharCode(s.charCodeAt(0) - 65248)
          })
        }
        input = asciify(input)
        if (Number.isNaN(Number(input))) { throw new Error('『漢数字』命令の中に無効な文字が含まれています。') }
        const output = if_number_is_exponent(input)
        // 符号を除いた整数部で大きさを判定する
        const intDigits = output.replace(/^[-+]/, '').match(/^[0-9]+/)
        if (intDigits && BigInt(intDigits[0]) > 漢数字最大値) { throw new Error('『漢数字』命令の中に含められる数の大きさを超えています。') }
        return output
      }
      input = preprocesser(String(input))
      function separater (str) {
        let isminus = str.includes('.')
        return str.split('').reverse().reduce((acc, cur) => {
          if (cur === '.') {
            isminus = false
            acc.splice(1, 0, '.')
            return acc
          } else if (isminus) {
            acc.splice(1, 0, cur)
            return acc
          }
          if (acc[0].length === 軸数字.length) {
            acc.unshift([])
          }
          acc[0].unshift(cur)
          return acc
        }, [[]])
      }
      function converter (arr) {
        function replacer (str) {
          return 基本漢数字[基本算用数字.indexOf(str)]
        }
        let adjuster = 0
        const result = arr.reverse().reduce((acc, cur, idx) => {
          if (typeof cur === 'string') {
            if (cur === '.') {
              acc = '・' + acc
              adjuster = idx + 1
            } else {
              acc = replacer(cur) + acc
            }
          } else {
            const unit = cur.reduce((acc, cur, idx, src) => {
              if (cur === '0') {
                return acc
              } else if (cur === '1' && 軸数字[src.length - 1 - idx] !== '') {
                return acc + 軸数字[src.length - 1 - idx]
              } else {
                return acc + replacer(cur) + 軸数字[src.length - 1 - idx]
              }
            }, '')
            acc = (unit ? unit + 単位数字[idx - adjuster] : '') + acc
          }
          return acc
        }, '')
        return result[0] === '・' ? '零' + result : result
      }
      // フラグを覚えておく #874
      let flag = ''
      if (input.charAt(0) === '+' || input.charAt(0) === '-') {
        flag = input.charAt(0)
        input = input.slice(1)
      }
      let res = converter(separater(input))
      if (res === '') { res = '零' }
      // 値が0のときは符号を付けない (-0 や +0.0 も 零 とする)
      if (input.replace(/[.0]/g, '') === '') { return '零' }
      return flag + res
    }
  },
  '算用数字': { // @引数を漢数字と解釈して数値を返す // @さんようすうじ
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (input) {
      function converter (src) {
        const multibytes = 単位数字.filter(a => a.length > 1)
        const result = []
        for (let idx = 0; idx < src.length; idx++) {
          const cur = src.slice(idx, idx + 1)
          const 指数 = 単位数字.includes(cur) ? cur : multibytes.find(v => v === src.slice(idx, idx + v.length))
          const 位 = 軸数字.includes(cur) ? cur : null
          const 底 = 基本漢数字.includes(cur) ? cur : null
          if (指数) {
            if (指数.length > 1) {
              idx += 指数.length - 1
            }
            result.push(BigInt('1' + '0'.repeat(4 * 単位数字.indexOf(指数))))
          } else if (位) {
            result.push(10 ** (軸数字.indexOf(位)))
          } else if (底) {
            result.push(基本漢数字.indexOf(底))
          } else if (cur === '・') {
            result.push('.')
          } else if (cur === '零') {
            result.push('0')
          } else {
            throw new Error('『算用数字』命令の中に無効な文字が含まれています。')
          }
        }
        return result
      }
      function separater (arr) {
        let base = []
        let unit = []
        let isminus = false
        return arr.reduce((acc, cur, idx) => {
          if (cur === '.') {
            if (base.length === 0) { base.push(0, 1) }
            if (base.length === 1) { base.push(1) }
            unit.push(base)
            base = []
            acc.push(unit)
            acc.push('.')
            unit = []
            isminus = true
          } else if (isminus) {
            acc.push(String(cur))
          } else if (cur > 1000) {
            if (base.length === 0) { base.push(0, 1) }
            if (base.length === 1) { base.push(1) }
            unit.push(base)
            base = []
            unit.push(cur)
            acc.push(unit)
            unit = []
          } else if (cur >= 10 && cur <= 1000) {
            if (base.length === 0) { base.push(1) }
            base.push(cur)
            unit.push(base)
            base = []
          } else if (cur < 10) {
            base.push(cur)
          }
          if (idx + 1 === arr.length && isminus === false) {
            if (base.length === 1) {
              base.push(1)
              unit.push(base)
            }
            acc.push(unit)
          }
          return acc
        }, [])
      }
      function calculator (arr) {
        return arr.reduce((acc, cur, idx) => {
          return typeof cur === 'string'
            ? acc + cur
            : acc + cur.reduce((acc, cur, idx) => {
              return cur > 1000 ? acc * cur : acc + BigInt(cur[0] * cur[1])
            }, BigInt(0))
        }, BigInt(0))
      }
      const tmp = calculator(separater(converter(input.toString())))
      return tmp > Number.MAX_SAFE_INTEGER ? tmp : Number(tmp)
    }
  }
}

const 単位数字 = [
  '', '万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正',
  '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数'
]
const 軸数字 = [
  '', '十', '百', '千'
]
const 基本算用数字 = '0123456789'.split('')
const 基本漢数字 = '〇一二三四五六七八九'.split('')

// 漢数字で扱える整数の最大桁数と最大値 (単位数字 × 軸数字 = 72桁)
const 漢数字最大桁数 = 単位数字.length * 軸数字.length
const 漢数字最大値 = BigInt('9'.repeat(漢数字最大桁数))

// 指数表記の仮数部を、文字列操作で桁移動する(巨大整数をNumberへ丸めない)
function moveDecimalPoint (base, exponent) {
  const dotIdx = base.indexOf('.')
  const intPart = dotIdx >= 0 ? base.slice(0, dotIdx) : base
  const fracPart = dotIdx >= 0 ? base.slice(dotIdx + 1) : ''
  let digits = intPart + fracPart
  // 小数点の位置を、先頭の0を除去した個数で補正する
  let pointPos = intPart.length + exponent
  let lead = 0
  while (lead < digits.length - 1 && digits[lead] === '0') { lead++ }
  digits = digits.slice(lead)
  pointPos -= lead
  if (digits === '0') { return '0' }
  // 末尾の0は結果では省略されるので、桁数カウントから除外する
  // (位取りの0は pointPos が保持しているので repeat で復元される)
  digits = digits.replace(/0+$/, '')
  // 生成後の整数部・小数部が、それぞれ扱える桁数を超えていないか確認する
  // (repeatで巨大な文字列を組み立てる前に弾く)
  const intDigitsCount = pointPos > 0 ? pointPos : 0
  const fracDigitsCount = pointPos < digits.length ? digits.length - pointPos : 0
  if (intDigitsCount > 漢数字最大桁数 || fracDigitsCount > 漢数字最大桁数) {
    throw new Error('『漢数字』命令の中に含められる数の大きさを超えています。')
  }
  if (pointPos <= 0) {
    return '0.' + '0'.repeat(-pointPos) + digits
  }
  if (pointPos >= digits.length) {
    return digits + '0'.repeat(pointPos - digits.length)
  }
  return digits.slice(0, pointPos) + '.' + digits.slice(pointPos)
}

export default PluginKansuji

// scriptタグで取り込んだ時、自動で登録する
if (typeof (navigator) === 'object' && typeof (navigator.nako3) === 'object') { navigator.nako3.addPluginObject('PluginKansuji', PluginKansuji) }
