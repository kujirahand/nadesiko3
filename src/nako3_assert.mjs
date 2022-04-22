/* eslint-disable quote-props */
/**
 * Assert対応のなでしこ
 */

import assert from 'assert'
import { NakoCompiler } from './nako3.mjs'


const PluginAssert = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
    }
  },
  // @Assert
  'NAKO3ASSERTバージョン': { type: 'const', value: 0.01 },
  'テスト': { // AとBが等しいかテスト // @てすと
    type: 'func',
    josi: [['と'], ['で']],
    fn: function (a, b, sys) {
      assert.strictEqual(a, b)
    },
    return_none: true
  }
}

export class Nako3Assert extends NakoCompiler {
  constructor () {
    super()
    this.silent = true
    this.addPluginFile('PluginAssert',  'nako3_assert.js', PluginAssert)
    this.__varslist[0]['ナデシコ種類'] = 'nako3_assert'
  }
}


