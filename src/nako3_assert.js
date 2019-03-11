/**
 * Assert対応のなでしこ
 */
const assert = require('assert')
const path = require('path')
const NakoCompiler = require(path.join(__dirname, 'nako3'))

const PluginAssert = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
    }
  },
  // @Assert
  'NAKO3ASSERTバージョン': {type: 'const', value: 0.01},
  'テスト': { // AとBが等しいかテスト // @てすと
    type: 'func',
    josi: [['と'], ['で', 'が']],
    fn: function (a, b, sys) {
      assert.equal(a, b)
    },
    return_none: true
  }
}

class Nako3Assert extends NakoCompiler {
  constructor () {
    super()
    this.silent = true
    this.addPluginFile('PluginAssert', path.join(__dirname, 'nako3_assert.js'), PluginAssert)
    this.__varslist[0]['ナデシコ種類'] = 'nako3_assert'
  }
}

module.exports = Nako3Assert
