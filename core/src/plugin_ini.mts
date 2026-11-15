// INIを読み書きするプラグイン
// (gonako の inilib.go と同じ仕様の自前実装)

/** 辞書(プレーンオブジェクト)かどうか */
function isDict (v: any): boolean {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) { return false }
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

/** 辞書に値を設定する(__proto__ などのキーでも安全に書き込む) */
function setKey (d: any, key: string, val: any): void {
  Object.defineProperty(d, key, { value: val, writable: true, enumerable: true, configurable: true })
}

/** 自身のキーを持つか */
function hasKey (d: any, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(d, key)
}

/**
 * 前後の空白を除去する (Goの strings.TrimSpace と同じ文字集合を使う)
 * ※ JSの String.prototype.trim() とは対象文字が異なる (U+0085 を除去し、U+FEFF は除去しない)
 */
const TRIM_SPACE_RE = /^[\t\n\v\f\r \u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+|[\t\n\v\f\r \u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+$/g
function trimSpace (s: string): string {
  return s.replace(TRIM_SPACE_RE, '')
}

/** INI文字列を辞書にする */
function parseINI (src: string): any {
  let s = String(src)
  if (s.charCodeAt(0) === 0xFEFF) { s = s.substring(1) } // BOM除去
  const root: any = {}
  let cur: any = root // キーの書き込み先 (最初は最上位、[sec] の後はそのセクション)
  const lines = s.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1
    let raw = lines[i]
    if (raw.endsWith('\r')) { raw = raw.substring(0, raw.length - 1) }
    const line = trimSpace(raw)
    if (line === '' || line[0] === ';' || line[0] === '#') { continue }
    if (line[0] === '[') {
      if (!line.endsWith(']')) {
        throw new Error(`INI取得に失敗しました。${lineNo}行目: セクションの括弧が閉じていません。`)
      }
      const name = trimSpace(line.substring(1, line.length - 1))
      if (name === '') {
        throw new Error(`INI取得に失敗しました。${lineNo}行目: セクション名が空です。`)
      }
      if (name.includes(']')) {
        throw new Error(`INI取得に失敗しました。${lineNo}行目: セクション名に「]」は使えません。`)
      }
      if (hasKey(root, name)) {
        const existing = root[name]
        if (!isDict(existing)) {
          throw new Error(`INI取得に失敗しました。${lineNo}行目: セクション「${name}」が同名のキーと重複しています。`)
        }
        cur = existing
      } else {
        cur = {}
        setKey(root, name, cur)
      }
      continue
    }
    const eq = line.indexOf('=')
    if (eq < 0) {
      throw new Error(`INI取得に失敗しました。${lineNo}行目: 「=」がありません。`)
    }
    const key = trimSpace(line.substring(0, eq))
    if (key === '') {
      throw new Error(`INI取得に失敗しました。${lineNo}行目: キーが空です。`)
    }
    let val = trimSpace(line.substring(eq + 1))
    if (val.length >= 2 && val[0] === '"' && val[val.length - 1] === '"') {
      val = val.substring(1, val.length - 1)
    }
    if (cur === root && hasKey(root, key) && isDict(root[key])) {
      throw new Error(`INI取得に失敗しました。${lineNo}行目: キー「${key}」が同名のセクションと重複しています。`)
    }
    setKey(cur, key, val)
  }
  return root
}

/** セクション名がINIで表せるか検証する */
function checkSectionName (name: string): void {
  if (trimSpace(name) === '' || name !== trimSpace(name) || /[\r\n\]]/.test(name)) {
    throw new Error(`INI変換に失敗しました。セクション名「${name}」はINIで表せません。`)
  }
}

/** key=value の1行を作る (pathはエラー文面用の位置表記) */
function encodeEntry (path: string, key: string, v: any): string {
  if (key === '' || key !== trimSpace(key) || /[=\r\n]/.test(key) ||
    key[0] === '[' || key[0] === ';' || key[0] === '#') {
    throw new Error(`INI変換に失敗しました。キー「${key}」はINIで表せません。`)
  }
  let s: string
  if (typeof v === 'string') {
    s = v
  } else if (typeof v === 'number') {
    s = String(v)
  } else if (typeof v === 'boolean') {
    s = v ? 'true' : 'false'
  } else if (v === null || v === undefined) {
    throw new Error(`INI変換に失敗しました。「${path}」の値が空(null/undefined)です。`)
  } else if (Array.isArray(v)) {
    throw new Error(`INI変換に失敗しました。「${path}」は配列でINIでは表せません。`)
  } else if (isDict(v)) {
    throw new Error(`INI変換に失敗しました。「${path}」は2段より深い入れ子です。`)
  } else {
    throw new Error(`INI変換に失敗しました。「${path}」の値の種類はINIで表せません。`)
  }
  if (/[\r\n]/.test(s)) {
    throw new Error(`INI変換に失敗しました。「${path}」の値に改行が含まれています。`)
  }
  // 前後に空白がある値や、全体が " で囲まれた値は、取得時に壊れないよう引用符で囲む
  if (s !== trimSpace(s) || (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"')) {
    s = '"' + s + '"'
  }
  return key + '=' + s + '\n'
}

/**
 * 辞書をINI文字列にする (最上位スカラーを先に、セクションを後に出力する)
 * ※ JSのオブジェクトでは整数風のキー ("2" や "10" など) が数値順に列挙されるため、
 *   そのようなキーの並びは gonako (Go版) の挿入順とは一致しないことがある (言語基盤の仕様差)
 */
function encodeINI (v: any): string {
  if (!isDict(v)) {
    throw new Error('INI変換に失敗しました。変換できるのは辞書のみです。')
  }
  let scalars = ''
  let sections = ''
  for (const k of Object.keys(v)) {
    const item = v[k]
    if (isDict(item)) {
      checkSectionName(k)
      sections += '[' + k + ']\n'
      for (const sk of Object.keys(item)) {
        sections += encodeEntry(k + '.' + sk, sk, item[sk])
      }
      sections += '\n'
      continue
    }
    scalars += encodeEntry(k, k, item)
  }
  let out = scalars
  if (out !== '' && sections.length > 0) { out += '\n' }
  out += sections
  out = out.replace(/\n+$/, '')
  if (out === '') { return '' }
  return out + '\n'
}

const PluginINI = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_ini', // プラグインの名前
      description: 'INI形式のデータ読み書きするプラグイン', // プラグインの説明
      pluginVersion: '3.8.10', // プラグインのバージョン
      nakoRuntime: ['wnako', 'cnako'], // 対象ランタイム
      nakoVersion: '3.8.10' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function(_sys: any) {
    }
  },
  // @INI
  'INI取得': { // @INI文字列を辞書に変換して返す // @INIしゅとく
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(s: any, _sys: any) {
      return parseINI(s)
    }
  },
  'INI変換': { // @辞書をINI文字列に変換して返す // @INIへんかん
    type: 'func',
    josi: [['を', 'から', 'の']],
    pure: true,
    fn: function(v: any, _sys: any) {
      return encodeINI(v)
    }
  }
}

export default PluginINI
