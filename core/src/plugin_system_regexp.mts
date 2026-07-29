/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * 正規表現の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
export default {
  // @正規表現
  '正規表現マッチ': { // @文字列Aを正規表現パターンBでマッチして結果を返す(パターンBは「/pat/opt」の形式で指定。optにgの指定がなければ部分マッチが『抽出文字列』に入る) // @せいきひょうげんまっち
    type: 'func',
    josi: [['を', 'が'], ['で', 'に']],
    pure: true,
    fn: function(a: string, b: string, sys: any): string {
      let re
      const f = ('' + b).match(/^\/(.+)\/([a-zA-Z]*)$/)
      // パターンがない場合
      if (f === null) { re = new RegExp(b, 'g') } else { re = new RegExp(f[1], f[2]) }
      const sa: any[] = sys.__getSysVar('抽出文字列')
      sa.splice(0, sa.length) // clear
      const m = String(a).match(re)
      let result: any = m
      if (re.global) {
        // no groups
      } else if (m) {
        // has group?
        if (m.length > 0) {
          result = m[0]
          for (let i = 1; i < m.length; i++) { sa[i - 1] = m[i] }
        }
      }
      return result
    }
  },
  '正規表現抽出': { // @文字列Sを正規表現パターンREで正規表現マッチし、すべてのキャプチャグループ( )を一次元配列として返す。抽出文字列には二次元配列を返す// @せいきひょうげんちゅうしゅつ
    type: 'func',
    josi: [['から','を'], ['で']],
    pure: true,
    fn: function(a: string, b: string, sys: any): any[] {
      let pattern = '' + b
      let flags = 'g'
      const f = pattern.match(/^\/(.+)\/([a-zA-Z]*)$/)
      if (f) {
        pattern = f[1]
        flags = f[2] || ''
      }
      if (!flags.includes('g')) flags += 'g'

      const re = new RegExp(pattern, flags)

      const sa: any[] = sys.__getSysVar('抽出文字列')
      sa.splice(0, sa.length) // clear

      const result: any[] = []   // 一次元配列
      const caps2d: any[] = []   // 二次元配列（sa に入れる）

      for (const m of String(a).matchAll(re)) {

        // ★ 名前付きキャプチャがある場合
        if (m.groups && Object.keys(m.groups).length > 0) {
          const row: Record<string, string> = {}

          for (const [key, val] of Object.entries(m.groups)) {
            row[key] = val
            result.push(val) // result は平坦化
          }

          caps2d.push(row)
          continue
        }

        // ★ 通常キャプチャ（従来どおり）
        let caps = [...m].slice(1)

        if (caps.length === 0) {
          caps = [m[0]] //キャプチャがない場合
        }

        caps2d.push(caps)
        result.push(...caps)
      }

      // マッチなし → 両方空のまま
      if (caps2d.length === 0) {
        return result
      }

      // sa に二次元配列をコピー
      for (const row of caps2d) {
        sa.push(row)
      }

      return result
    }
  },
  '抽出文字列': { type: 'const', value: [] }, // @ちゅうしゅつもじれつ
  '正規表現置換': { // @文字列Sの正規表現パターンAをBに置換して結果を返す(パターンAは/pat/optで指定) // @せいきひょうげんちかん
    type: 'func',
    josi: [['の'], ['を', 'から'], ['で', 'に', 'へ']],
    pure: true,
    fn: function(s: string, a: string, b: string): string {
      let re
      const f = a.match(/^\/(.+)\/([a-zA-Z]*)/)
      if (f === null) { re = new RegExp(a, 'g') } else { re = new RegExp(f[1], f[2]) }

      return String(s).replace(re, b)
    }
  },
  '正規表現区切': { // @文字列Sを正規表現パターンAで区切って配列で返す(パターンAは/pat/optで指定) // @せいきひょうげんくぎる
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(s: any, a: any) {
      let re
      const f = a.match(/^\/(.+)\/([a-zA-Z]*)/)
      if (f === null) { re = new RegExp(a, 'g') } else { re = new RegExp(f[1], f[2]) }

      return String(s).split(re)
    }
  },
}
