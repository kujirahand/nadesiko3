// TOMLを読むためのプラグイン
import TOML from 'smol-toml'

const PluginTOML = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_toml', // プラグインの名前
      description: 'TOML形式のデータ読み書きするプラグイン', // プラグインの説明
      pluginVersion: '3.7.6', // プラグインのバージョン
      nakoRuntime: ['wnako', 'cnako'], // 対象ランタイム
      nakoVersion: '3.7.6' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
    }
  },
  // @TOML
  'TOML取得': { // @TOML文字列をオブジェクトにデコードして返す // @TOMLしゅとく
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function (s: string, sys: any) {
      return TOML.parse(s)
    }
  },
  'TOML変換': { // @オブジェクトをTOML文字列にエンコードする // @TOMLへんかん
    type: 'func',
    josi: [['を', 'から', 'の']],
    pure: true,
    fn: function (s: any, sys: any) {
      return TOML.stringify(s)
    }
  },
}

export default PluginTOML
