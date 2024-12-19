// csv-lite.js --- for Browser
export interface CSVOptions {
  delimiter: string;
  eol: string;
}

export const options: CSVOptions = {
  delimiter: ',',
  eol: '\r\n'
}

export function resetEnv (): void {
  options.delimiter = ','
  options.eol = '\r\n'
}

export function parse (txt: string, delimiter: string|undefined = undefined): string[][] {
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
  // if value is number then convert to float
  const convType = function (v: any) {
    if (typeof (v) === 'string') {
      if (v.search(/^[0-9.]+$/) >= 0) {
        v = parseFloat(v) // convert number
      }
    }
    return v
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
      console.log('delimiter')
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
    txt = txt.substr(i)
  }
  if (cells.length > 0) res.push(cells)
  return res
}

// convert 2D array to CSV string
export function stringify (ary: string[][], delimiter: string|undefined = undefined, eol: string|undefined = undefined): string {
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

export function replaceEolMark (eol: string): string {
  eol = eol.replace(/\n\r/g, '[CRLF]')
  eol = eol.replace(/\r/g, '[CR]')
  eol = eol.replace(/\n/g, '[LF]')
  return eol
}

function genValueConverter (delimiter: string) {
  return function (s: string) {
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
