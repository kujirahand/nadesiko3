// csv-lite.js --- for Browser
export interface CSVOptions {
  delimiter: string;
  eol: string;
  auto_convert_number: boolean;
}

export const options: CSVOptions = {
  delimiter: ',',
  eol: '\r\n',
  auto_convert_number: true
}

export function resetEnv(): void {
  options.delimiter = ','
  options.eol = '\r\n'
  options.auto_convert_number = true
}

/** 文字列が数値かどうか判定する関数
 * @param str 判定する文字列
 * @returns 数値なら true
 */
function is_numeric(str: string): boolean {
  return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(str)
}

export function parse(txt: string, delimiter: string|undefined = undefined): (string|number)[][] {
  // delimiter
  if (delimiter === undefined) {
    delimiter = options.delimiter
  }
  // check txt
  txt = '' + txt + '\n'
  // convert CRLF to LF, and CR to LF
  txt = txt.replace(/(\r\n|\r)/g, '\n')
  // trim right
  txt = txt.replace(/\s+$/, '') + '\n'
  // set pattern
  const patToDelim = '^(.*?)([\\' + delimiter + '\\n])'
  const reToDelim = new RegExp(patToDelim)
  const reSpace = /\s/
  // if value is number then convert to float
  const convType = function(v: string) {
    let result: string|number = v
    if (typeof (v) === 'string') {
      if (options.auto_convert_number && is_numeric(v)) {
        result = parseFloat(v) // convert number
      }
    }
    return result
  }
  // parse txt
  const res: (string|number)[][] = []
  let cells: (string|number)[] = []
  let c = ''
  while (txt !== '') {
    // first check delimiter (because /^\s+/ skip delimiter'\t') (#3)
    c = txt.charAt(0)
    if (c === delimiter) {
      txt = txt.substring(1)
      cells.push('')
      continue
    }
    // second check LF (#7)
    if (c === '\n') {
      cells.push('')
      res.push(cells)
      cells = []
      txt = txt.substring(1)
      continue
    }

    // trim white space
    txt = txt.replace(/^\s+/, '')
    c = txt.charAt(0)

    // no data
    if (c === delimiter) {
      cells.push('')
      txt = txt.substring(delimiter.length)
      continue
    }

    // written using the dialect of Excel
    if (c === '=' && txt.charAt(1) === '"') {
      txt = txt.substring(1)
      continue
    }

    // number or simple string
    if (c !== '"') { // number or simple str
      const m = reToDelim.exec(txt)
      if (!m) {
        cells.push(convType(txt))
        res.push(cells)
        cells = []
        break
      }
      if (m[2] === '\n') {
        cells.push(convType(m[1]))
        res.push(cells)
        cells = []
      } else if (m[2] === delimiter) {
        cells.push(convType(m[1]))
      }
      txt = txt.substring(m[0].length)
      continue
    }
    // "" ... 空引用符フィールドか、Excel方言の空セルかを判定する (#2476)
    // """" のように隣接する引用符エスケープは、通常の引用フィールド解析に任せる
    if (txt.length >= 3 && txt.charAt(1) === '"' && txt.charAt(2) !== '"') {
      // 区切り文字・改行に達するまで、空白文字(全角空白など \s が空白とみなす文字)をスキップして判定する
      let idx = 2
      while (idx < txt.length) {
        const ch = txt.charAt(idx)
        if (ch === delimiter || ch === '\n') break
        if (!reSpace.test(ch)) break
        idx++
      }
      const next = txt.charAt(idx)
      if (next === delimiter || next === '\n') {
        // 空引用符フィールドとして扱い、""と後続の空白を捨てて区切り/改行の処理に委ねる
        txt = txt.substring(idx)
        continue
      }
      // Excel方言の空セルとして扱い、続きを通常のセルとして解析する
      cells.push('')
      txt = txt.substring(2)
      continue
    }
    // "..."
    let i = 1; let s = ''
    while (i < txt.length) {
      const c1 = txt.charAt(i)
      const c2 = txt.charAt(i + 1)
      // 2quote => 1quote char
      if (c1 === '"' && c2 === '"') {
        i += 2
        s += '"'
        continue
      }
      if (c1 === '"') {
        i++
        if (c2 === delimiter) {
          i++
          cells.push(convType(s))
          s = ''
          break
        }
        if (c2 === '\n') {
          i++
          cells.push(convType(s))
          res.push(cells)
          cells = []
          break
        }
        i++
        continue
      }
      s += c1
      i++
    }
    txt = txt.substring(i)
  }
  if (cells.length > 0) res.push(cells)
  return res
}

// convert 2D array to CSV string
export function stringify(ary: string[][], delimiter: string|undefined = undefined, eol: string|undefined = undefined): string {
  // check arguments
  if (delimiter === undefined) {
    delimiter = options.delimiter
  }
  if (eol === undefined) {
    eol = options.eol
  }
  const valueConv = genValueConverter(delimiter)
  if (ary === undefined) return ''
  let r = ''
  for (let i = 0; i < ary.length; i++) {
    const cells = ary[i]
    if (cells === undefined) {
      r += eol; continue
    }
    for (let j = 0; j < cells.length; j++) {
      cells[j] = valueConv(cells[j])
    }
    r += cells.join(delimiter) + eol
  }
  // replace return code
  r = r.replace(/(\r\n|\r|\n)/g, eol)
  return r
}

export function replaceEolMark(eol: string): string {
  eol = eol.replace(/\n\r/g, '[CRLF]')
  eol = eol.replace(/\r/g, '[CR]')
  eol = eol.replace(/\n/g, '[LF]')
  return eol
}

function genValueConverter(delimiter: string) {
  return function(s: string) {
    s = '' + s
    let fQuot = false
    if (s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0) { fQuot = true }
    if (s.indexOf(delimiter) >= 0) { fQuot = true }
    if (s.indexOf('"') >= 0) {
      fQuot = true
      s = s.replace(/"/g, '""')
    }
    if (fQuot) s = '"' + s + '"'
    return s
  }
}
