const PluginKansuji = {

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
    josi: [['を','の']],
    pure: true,
    fn: function (input) {
      function preprocesser (input) {
        function if_number_is_exponent (input) {
          const match = input.match(/[0-9]*\.?[0-9]+[eE][-+]?[0-9]+/)
          if(match && match[0] === input){
            const base = input.match(/[0-9]*\.?[0-9]+[eE]/)[0].slice(0,-1)
            const exponent = input.match(/[eE][-+]?[0-9]+/)[0].slice(1)
            function movepoint (base, exponent) {
              const sign = exponent[0]
              const curpointidx = base.includes(".") ? base.indexOf(".") : base.length
              const idx = sign === "-" ? curpointidx - parseInt(exponent.slice(1)) : curpointidx + parseInt(exponent.match(/[0-9]+$/)[0])
              function strIns(str, idx, val){
                return str.slice(0, idx) + val + str.slice(idx);
              };
              if (idx > 0) {
                if (base.length - curpointidx > idx) {
                  return strIns(base.replace(".", ""), idx, ".")
                } else {
                  if (base.includes(".")) {
                    return base.replace(".", "") + "0".repeat(idx - base.length + curpointidx)
                  } else {
                    return base + "0".repeat(idx - base.length + curpointidx - 1)
                  }
                }
              } else {
                return "0." + "0".repeat(-idx) + base.replace(".", "")
              }
            }
            input = movepoint (base, exponent)
          }
          return input
        }
        function asciify (input) {
          return input.replace(/[０-９]/g, s => {
            return String.fromCharCode(s.charCodeAt(0) - 65248);
          });
        }
        input = asciify(input)
        if (Number.isNaN(Number(input))) {throw new Error('『漢数字』命令の中に無効な文字が含まれています。')}
        let output = if_number_is_exponent(input.toString())
        if (output > BigInt(999999999999999999999999999999999999999999999999999999999999999999999999)) {throw new Error('『漢数字』命令の中に含められる数の大きさを超えています。')}
        return output
      }
      input = preprocesser (String(input))
      function separater (str) {
        let isminus = str.includes(".")
        return str.split("").reverse().reduce(( acc, cur ) => {
          if (cur === ".") {
            isminus = false
            acc.splice(1, 0, ".")
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
        const result = arr.reverse().reduce(( acc, cur, idx ) => {
          if (typeof cur === "string") {
            if (cur === ".") {
              acc =  "・" + acc
              adjuster = idx + 1
            } else {
              acc = replacer(cur) + acc
            }
          } else {
            const unit = cur.reduce(( acc, cur, idx, src ) => {
              if (cur === "0") {
                return acc
              } else if (cur === "1" && 軸数字[ src.length -1 - idx ] !== "") {
                return acc + 軸数字[ src.length -1 - idx ]
              } else {
                return acc + replacer(cur) + 軸数字[ src.length -1 - idx ]
              }
            }, "")
            acc = (unit ? unit + 単位数字[idx - adjuster] : "")  + acc
          }
          return acc
        }, "")
        return result[0] === '・' ? '零' + result : result
      }
      return converter(separater(input))
    }
  },
  '算用数字': { // @U引数を漢数字と解釈して数値を返す // @さんようすうじ
    type: 'func',
    josi: [['を','の']],
    pure: true,
    fn: function (input) {
      function converter (src) {
        const multibytes = 単位数字.filter( a => a.length > 1 )
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
            result.push(BigInt("1" + "0".repeat(4 * 単位数字.indexOf(指数))))
          } else if (位) {
            result.push(10 ** (軸数字.indexOf(位)))
          } else if (底) {
            result.push(基本漢数字.indexOf(底))
          } else if (cur === "・") {
            result.push(".")
          } else if (cur === "零") {
            result.push("0")
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
        return arr.reduce(( acc, cur, idx ) => {
          if (cur === ".") {
            if(base.length === 0) base.push(0,1)
            if(base.length === 1) base.push(1)
            unit.push(base)
            base = []
            acc.push(unit)
            acc.push(".")
            unit = []
            isminus = true
          } else if (isminus) {
            acc.push(String(cur))
          } else if (cur > 1000) {
            if(base.length === 0) base.push(0,1)
            if(base.length === 1) base.push(1)
            unit.push(base)
            base = []
            unit.push(cur)
            acc.push(unit)
            unit = []
          } else if (10 <= cur && cur <= 1000) {
            if(base.length === 0) base.push(1)
            base.push(cur)
            unit.push(base)
            base = []
          } else if (cur < 10) {
            base.push(cur)
          }
          if (idx + 1 === arr.length && isminus === false) {
            if(base.length === 1) {
              base.push(1)
              unit.push(base)
            }
            acc.push(unit)
          }
          return acc
        }, [])
      }
      function calculator (arr) {
        return arr.reduce(( acc, cur, idx ) => {
          return typeof cur === "string" ? acc + cur :acc + cur.reduce((acc, cur, idx) => {
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
  "", "万", "億", "兆", "京", "垓", "𥝱", "穣", "溝", "澗", "正",
  "載", "極", "恒河沙", "阿僧祇", "那由他", "不可思議", "無量大数"
]
const 軸数字 = [
  "", "十", "百", "千"
]
const 基本算用数字 = "0123456789".split("")
const 基本漢数字 = "〇一二三四五六七八九".split("")


module.exports = PluginKansuji

// scriptタグで取り込んだ時、自動で登録する
if (typeof (navigator) === 'object')
  {navigator.nako3.addPluginObject('PluginKansuji', PluginKansuji)}
