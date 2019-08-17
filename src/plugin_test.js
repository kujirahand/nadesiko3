/**
 * file: plugin_test.js
 * テスト実行用プラグイン
 */
const PluginTest = {
  // @テスト
  'ASSERT等': { // @ mochaによるテストで、ASSERTでAとBが正しいことを報告する // @ASSERTひとしい
    type: 'func',
    josi: [['と'], ['が']],
    fn: function (a, b, sys) {
      const assert = require('assert')
      assert.strictEqual(a, b)
    }
  }
}

module.exports = PluginTest
