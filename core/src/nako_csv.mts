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

/** 文字列が数値かどうか判定する関数 */

function is_numeric(str: string): boolean {
  return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(str)
}

export function parse(txt: string, delimiter: string|undefined = undefined): (string|number)[][] {
  // delimiter
  if (delimiter === undefined) {
    delimiter = options.delimiter
  }
  // 区切り文字は単一文字（, や \t など）を想定する
  // check txt
  txt = '' + txt + '\n'
  // convert CRLF to LF, and CR to LF
  txt = txt.replace(/(\r\n|\r)/g, '\n')
  // trim right (末尾の空白は除去する。ただし区切り文字は空セルを表すため残す #2477)
  // [^\S<区切り文字>] は「\s（空白文字）から区切り文字を除いた集合」。末尾の区切り文字は残し、それ以外の空白を除去する
  const escDelim = delimiter.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&')
  txt = txt.replace(new RegExp('[^\\S' + escDelim + ']+$'), '') + '\n'
  // set pattern
  const patToDelim = '^(.*?)([' + escDelim + '\\n])'
  const reToDelim = new RegExp(patToDelim)
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
  const res = []; let cells = []; let c = ''
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
    // "" ... blank data
    if (txt.substring(0, 2) === '""') {
      cells.push('')
      txt = txt.substring(2)
      continue
    }
    // "..."
    let i = 1; let s = ''
    while (i < txt.length) {
      const c1 = txt.charAt(i)
      const c2 = txt.charAt(i + 1)
      // console.log("@" + c1 + c2);
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
        // if (c2 === " " || c2 === "\t") {
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
export function stringify(ary: (string|number)[][]|undefined, delimiter: string|undefined = undefined, eol: string|undefined = undefined): string {
  if (ary === undefined) return ''
  // check arguments
  if (delimiter === undefined) {
    delimiter = options.delimiter
  }
  if (eol === undefined) {
    eol = options.eol
  }
  const valueConv = genValueConverter(delimiter)
  let r = ''
  for (let i = 0; i < ary.length; i++) {
    const cells = ary[i]
    if (cells === undefined) {
      r += eol; continue
    }
    // map では疎配列の穴がスキップされるため Array.from を使用する（元配列は書き換えない）
    const converted = Array.from(cells, valueConv)
    r += converted.join(delimiter) + eol
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

function genValueConverter(delimiter: string): (s: string|number|undefined) => string {
  return function(s: string|number|undefined) {
    let v = '' + s
    let needsQuote = false
    if (v.indexOf('\n') >= 0 || v.indexOf('\r') >= 0) { needsQuote = true }
    if (v.indexOf(delimiter) >= 0) { needsQuote = true }
    if (v.indexOf('"') >= 0) {
      needsQuote = true
      v = v.replace(/"/g, '""')
    }
    if (needsQuote) v = '"' + v + '"'
    return v
  }
}
