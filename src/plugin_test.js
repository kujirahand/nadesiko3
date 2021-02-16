/**
 * file: plugin_test.js
 * テスト実行用プラグイン
 */
const PluginTest = {
  // @テスト
  'ASSERT等': { // @ mochaによるテストで、ASSERTでAとBが正しいことを報告する // @ASSERTひとしい
    type: 'func',
    josi: [['と'], ['が']],
    pure: true,
    fn: function (a, b, sys) {
      const assert = require('assert')
      assert.strictEqual(a, b)
    }
  },
  'テスト実行': { // @ mochaによるテストで、ASSERTでAとBでテスト実行してAとBが等しいことを報告する // @てすとじっこう
    type: 'func',
    josi: [['と'], ['で']],
    pure: true,
    fn: function (a, b, sys) {
      const assert = require('assert')
      assert.strictEqual(a, b)
    }
  },
  'テスト等しい': { // @ mochaによるテストで、ASSERTでAとBが正しいことを報告する // @テストひとしい
    type: 'func',
    josi: [['と'], ['が']],
    pure: true,
    fn: function (a, b, sys) {
      const assert = require('assert')
      assert.strictEqual(a, b)
    }
  },
  
}

module.exports = PluginTest
