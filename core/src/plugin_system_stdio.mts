/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * 標準出力の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
import { NakoSystem } from './plugin_api.mjs'

export default {
  // @標準出力
  '表示': { // @Sを表示 // @ひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function(s: string, sys: any) {
      // 継続表示の一時プールを出力
      s = String(sys.__printPool) + s
      sys.__printPool = ''
      //
      sys.__setSysVar('表示ログ', String(sys.__getSysVar('表示ログ')) + s + '\n')
      sys.logger.send('stdout', s + '')
    },
    return_none: true
  },
  '継続表示': { // @Sを改行なしで表示(ただし「表示」命令を使うことで画面出力される) // @けいぞくひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function(s: string, sys: any) {
      sys.__printPool += s
    },
    return_none: true
  },
  '連続表示': { // @引数に指定した引数を全て表示する // @れんぞくひょうじ
    type: 'func',
    josi: [['と', 'を']],
    isVariableJosi: true,
    pure: true,
    fn: function(...a: any) {
      const sys = a.pop()
      const v = a.join('')
      sys.__exec('表示', [v, sys])
    },
    return_none: true
  },
  '連続無改行表示': { // @引数に指定した引数を全て表示する（改行しない) // @れんぞくむかいぎょうひょうじ
    type: 'func',
    josi: [['と', 'を']],
    isVariableJosi: true,
    pure: true,
    fn: function(...a: any) {
      const sys = a.pop()
      const v = a.join('')
      sys.__exec('継続表示', [v, sys])
    },
    return_none: true
  },
  '表示ログ': { type: 'const', value: '' }, // @ひょうじろぐ
  '表示ログクリア': { // @表示ログを空にする // @ひょうじろぐくりあ
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      sys.__setSysVar('表示ログ', '')
    },
    return_none: true
  },
  '言': { // @Sを表示 // @いう
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function(s: string, sys: any) {
      sys.logger.send('stdout', s + '')
    },
    return_none: true
  },
  'コンソール表示': { // @Sをコンソール表示する(console.log) // @こんそーるひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function(s: string) {
      console.log(s)
    },
    return_none: true
  },
}
