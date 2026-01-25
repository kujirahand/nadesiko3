// 敬語を使いたい人のためのプラグイン (お遊び機能)
import { NakoSystem } from '../core/src/plugin_api.mjs'

const PluginKeigo = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_keigo', // プラグインの名前
      description: '敬語でプログラムを記述するための命令を提供するプラグイン', // プラグインの説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako', 'cnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
    }
  },
  // @丁寧語
  'お世話': { type: 'const', value: 1 }, // @おせわ
  'な': { // @Aになる // @なる
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function(a: any, sys: NakoSystem) {
      return a
    }
  },
  'おります': { // @ソースコードを読む人を気持ちよくする // @おります
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  'どうぞ': { // @ソースコードを読む人を気持ちよくする // @どうぞ
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  'よろしくお願': { // @ソースコードを読む人を気持ちよくする // @よろしくおねがいします
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  }

}

export default PluginKeigo
