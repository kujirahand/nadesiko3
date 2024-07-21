/**
 * file: plugin_snako.js
 * 簡単なファイル読み書きのプラグイン
 */
import path from 'node:path'
import { exec, OutputMode } from "https://deno.land/x/exec/mod.ts"

export default {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_snako_deno', // プラグインの名前
      description: '最小の機能を提供するプラグイン', // プラグインの説明
      pluginVersion: '3.6.3', // プラグインのバージョン
      nakoRuntime: ['cnako'], // 対象ランタイム
      nakoVersion: '3.6.3' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
      // command line
      const args = [...Deno.args]
      args.unshift(Deno.execPath())
      // set path
      sys.__getBokanPath = () => {
        let nakofile
        const cmd = path.basename(args[1])
        if (cmd.indexOf('snako') < 0) { nakofile = args[1] } else { nakofile = args[2] }
        return path.dirname(path.resolve(nakofile))
      }
      sys.__setSysVar('コマンドライン', args)
      sys.__setSysVar('ナデシコランタイムパス', args[0])
      sys.__setSysVar('ナデシコランタイム', path.basename(args[0]))
      sys.__setSysVar('母艦パス', sys.__getBokanPath())
    }
  },
  // @SNAKO
  'コマンドライン': { type: 'const', value: '' },
  'ナデシコランタイムパス': { type: 'const', value: '' },
  'ナデシコランタイム': { type: 'const', value: '' },
  '母艦パス': { type: 'const', value: '' },
  '読': { // @ ファイルFの内容を読む // @よむ
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    asyncFn: true,
    fn: async function (f: string): Promise<string> {
      const text = await Deno.readTextFile(f)
      return text
    }
  },
  '開': { // @ ファイルFの内容を読む // @ひらく
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    asynfFn: true,
    fn: async function (f: string): Promise<string> {
      const text = await Deno.readTextFile(f)
      return text
    }
  },
  '保存': { // @ 文字列SをファイルFに保存 // @ほぞん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    pure: true,
    asyncFn: true,
    fn: async function (s: string, f: string): Promise<void> {
      await Deno.writeTextFile(f, s)
    },
    return_none: true
  },
  '起動待機': { // @シェルコマンドSを起動し実行終了まで待機する // @きどうたいき
    type: 'func',
    josi: [['を']],
    pure: true,
    asyncFn: true,
    fn: async function (s: string): Promise<string> {
      const options = { output: OutputMode.Capture, verbose: false }
      const exeRes = await exec(s, options)
      const result = exeRes.output
      return result
    }
  },
  'ファイル名抽出': { // @フルパスのファイル名Sからファイル名部分を抽出して返す // @ふぁいるめいちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    pure: true,
    fn: function (s: string) {
      return path.basename(s)
    }
  },
  'パス抽出': { // @ファイル名Sからパス部分を抽出して返す // @ぱすちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    pure: true,
    fn: function (s: string) {
      return path.dirname(s)
    }
  },
  '絶対パス変換': { // @相対パスから絶対パスに変換して返す // @ぜったいぱすへんかん
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (a: string) {
      return path.resolve(a)
    }
  },
  '相対パス展開': { // @ファイル名AからパスBを展開して返す // @そうたいぱすてんかい
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a: string, b: string) {
      return path.resolve(path.join(a, b))
    }
  }
}
