/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * URLエンコード・パラメータ処理・BASE64・パス操作の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
import { NakoSystem } from './plugin_api.mjs'

export default {
  // @URLエンコードとパラメータ
  'URLエンコード': { // @URLエンコードして返す // @URLえんこーど
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function(text: any) {
      return encodeURIComponent(text)
    }
  },
  'URLデコード': { // @URLデコードして返す // @URLでこーど
    type: 'func',
    josi: [['を', 'へ', 'に']],
    pure: true,
    fn: function(text: any) {
      return decodeURIComponent(text)
    }
  },
  'URLパラメータ解析': { // @URLパラメータを解析してハッシュで返す // @URLぱらめーたかいせき
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(url: string, sys: any) {
      const res: any = {}
      if (typeof url !== 'string') {
        return res
      }
      const p = url.split('?')
      if (p.length <= 1) {
        return res
      }
      const params = p[1].split('&')
      for (const line of params) {
        if (line === '') { continue }
        const eqIdx = line.indexOf('=')
        let k: string
        let v: string
        if (eqIdx < 0) {
          k = line
          v = ''
        } else {
          k = line.substring(0, eqIdx)
          v = line.substring(eqIdx + 1)
        }
        const decodedKey = sys.__exec('URLデコード', [k])
        const decodedVal = sys.__exec('URLデコード', [v])
        res[decodedKey] = decodedVal
      }
      return res
    }
  },

  // @BASE64
  'BASE64エンコード': { // @BASE64エンコードして返す // @BASE64えんこーど
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function(text: any) {
      // browser?
      if (typeof (window) !== 'undefined' && (window as any).btoa) {
        const u8a: any = new TextEncoder().encode(text)
        const utf8str = String.fromCharCode.apply(null, u8a)
        return btoa(utf8str)
      }
      // Node?
      if (typeof (Buffer) !== 'undefined') {
        return Buffer.from(text).toString('base64')
      }
      throw new Error('『BASE64エンコード』は利用できません。')
    }
  },
  'BASE64デコード': { // @BASE64デコードして返す // @BASE64でこーど
    type: 'func',
    josi: [['を', 'へ', 'に']],
    pure: true,
    fn: function(text: any) {
      if (typeof (window) !== 'undefined' && (window as any).atob) {
        const decodedUtf8str = atob(text)
        const dec: any = Array.prototype.map.call(decodedUtf8str, c => c.charCodeAt())
        const decodedArray = new Uint8Array(dec)
        return new TextDecoder('UTF-8').decode(decodedArray)
      }
      // Node?
      if (typeof (Buffer) !== 'undefined') {
        return Buffer.from(text, 'base64').toString()
      }
      throw new Error('『BASE64デコード』は利用できません。')
    }
  },

  // @パス操作
  '拡張子抽出': { // @ファイル名Sから拡張子を抽出する // @かくちょうしちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    pure: true,
    fn: function(fname: string, sys: NakoSystem) {
      if (fname === null || fname === undefined) { return '' }
      const sep = sys.pathSeparator || '/'
      if (fname.indexOf(sep) >= 0) { // パス記号があればファイル名を抽出
        const parts = fname.split(sep)
        fname = parts[parts.length - 1]
      }
      const m = fname.match(/(\.[a-zA-Z0-9_\-+]+)$/)
      if (m) { return m[1] }
      return ''
    }
  },
  '拡張子変更': { // @ファイル名Aの拡張子をBに変更して返す // @かくちょうしへんこう
    type: 'func',
    josi: [['の', 'を', 'から'], ['に', 'へ']],
    pure: true,
    fn: function(fname: string, ext: string, sys: NakoSystem) {
      if (fname === null || fname === undefined) { return ext }
      const sep = sys.pathSeparator || '/'
      const pathList = fname.split(sep)
      const filename = pathList[pathList.length - 1]
      const pathStr = pathList.slice(0, -1).join(sep)
      const rawExt = (ext ?? '').trim()
      let extWithDot = rawExt
      if (rawExt !== '' ) {
        extWithDot = rawExt.startsWith('.') ? rawExt : '.' + rawExt
      }
      const newFilename = filename.replace(/(\.[a-zA-Z0-9_\-+]+)?$/, extWithDot)
      return sys.__exec('終端パス追加', [pathStr, sys]) + newFilename
    }
  },
  '終端パス追加': { // @パスSの終端にパス区切り文字を追加して返す // @しゅうたんぱすついか
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function(path: string, sys: NakoSystem) {
      const sep = sys.pathSeparator || '/'
      if (path === undefined || path === null || path === '') {
        return ''
      }
      if (path.endsWith(sep)) {
        return path
      }
      return path + sep
    }
  },
  '終端パス除去': { // @フォルダ名DIRの末尾にあるパス記号を削除する // @しゅうたんぱすじょきょ
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function(dir: string, sys: NakoSystem) {
      const sep = sys.pathSeparator || '/'
      if (!dir) { return '' }
      if (dir.endsWith(sep)) {
        return dir.substring(0, dir.length - 1)
      } else {
        return dir
      }
    }
  },
  '終端パス削除': { // @フォルダ名DIRの末尾にあるパス記号を削除する // @しゅうたんぱすさくじょ
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function(dir: string, sys: NakoSystem) {
      return sys.__exec('終端パス除去', [dir, sys])
    }
  },
  'ファイル名抽出': { // @パスPATHからファイル名を抽出して返す // @ふぁいるめいちゅうしゅつ
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function(dir: string, sys: NakoSystem) {
      const sep = sys.pathSeparator || '/'
      const parts = dir.split(sep)
      return parts[parts.length - 1]
    }
  },
  'パス抽出': { // @パスPATHからディレクトリ部分を抽出して返す // @ぱすちゅうしゅつ
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function(dir: string, sys: NakoSystem) {
      const sep = sys.pathSeparator || '/'
      const parts = dir.split(sep)
      parts.pop()
      return parts.join(sep)
    }
  }
}
