 
import { CSVOptions, options, parse, stringify } from './nako_csv.mjs'

const PluginCSV = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_csv', // プラグインの名前
      description: 'CSV関連の命令を提供するプラグイン', // プラグインの説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako', 'cnako', 'phpnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function(): void {
      // 基本的に初期化不要
    }
  },
  // @CSV操作
  'CSV取得': { // @CSV形式のデータstrを強制的に二次元配列に変換して返す // @CSVしゅとく
    type: 'func',
    josi: [['を', 'の', 'で']],
    pure: true,
    fn: function(str: string): (string | number)[][] {
      options.delimiter = ','
      return parse(str)
    }
  },
  'TSV取得': { // @TSV形式のデータstrを強制的に二次元配列に変換して返す // @TSVしゅとく
    type: 'func',
    josi: [['を', 'の', 'で']],
    pure: true,
    fn: function(str: string): (string|number)[][] {
      options.delimiter = '\t'
      return parse(str)
    }
  },
  '表CSV変換': { // @二次元配列AをCSV形式に変換して返す // @ひょうCSVへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(a: string[][]): string {
      options.delimiter = ','
      return stringify(a)
    }
  },
  '表TSV変換': { // @二次元配列AをTSV形式に変換して返す // @ひょうTSVへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(a: string[][]): string {
      options.delimiter = '\t'
      return stringify(a)
    }
  },
  'CSVオプション設定': { // @「CSV取得」「表CSV変換」命令のオプションOBJ{delimiter,eol,auto_convert_number}をオブジェクトで指定 // @CSVおぷしょんせってい
    type: 'func',
    josi: [['を', 'で']],
    pure: true,
    fn: function(obj: { [key: string]: unknown }): void {
      for (const key in obj) {
        const value: unknown = obj[key]
        if (key === 'delimiter' || key === '区切文字') {
          options.delimiter = value as string
        } else if (key === 'eol') {
          options.eol = value as string
        } else if (key === 'auto_convert_number') {
          options.auto_convert_number = value as boolean
        }
      }
    },
    return_none: true
  }
}
export default PluginCSV
