/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * JSON処理の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
export default {
  // @JSON
  'JSON変換': { // @オブジェクトVをJSON形式の文字列に変換して返す // @JSONへんかん
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v)
    }
  },
  'JSON取得': { // @JSON文字列をパースして、なでしこのオブジェクトとして返す // @JSONしゅとく
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(v: any) {
      return JSON.parse(v)
    }
  },
  'JSONエンコード': { // @オブジェクトVをJSON形式に変換して返す(『JSON変換』と同じ) // @JSONえんこーど
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v)
    }
  },
  'JSONエンコード整形': { // @オブジェクトVをJSON形式の文字列(整形済み)に変換して整形して返す // @JSONえんこーどせいけい
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v, null, 2)
    }
  },
  'JSONデコード': { // @JSON文字列Sをオブジェクトにして返す(『JSON取得』と同じ) // @JSONでこーど
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(s: string): string {
      return JSON.parse(s)
    }
  },
  'JSON_E': { // @オブジェクトVをJSON形式の文字列に変換して返す(『JSON変換』と同じ) // @JSON_E
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v)
    }
  },
  'JSON_ES': { // @オブジェクトVをJSON形式の文字列(整形済み)に変換して返す(『JSONエンコード整形』と同じ) // @JSON_ES
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v, null, 2)
    }
  },
  'JSON_D': { // @JSON文字列Sをオブジェクトにして返す(『JSON取得』と同じ) // @JSON_D
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(s: string): string {
      return JSON.parse(s)
    }
  },
}
