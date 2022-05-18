/**
 * file: plugin_test.js
 * テスト実行用プラグイン
 */
export default {
  // @テスト
  'ASSERT等': { // @ テストで、ASSERTでAとBが正しいことを報告する // @ASSERTひとしい
    type: 'func',
    josi: [['と'], ['が']],
    pure: true,
    fn: function (a: any, b: any) {
      if (a !== b) {
        throw new Error(`不一致 [実際]${a} [期待]${b}`)
      }
      return true
    }
  },
  'テスト実行': { // @ テストで、ASSERTでAとBでテスト実行してAとBが等しいことを報告する // @てすとじっこう
    type: 'func',
    josi: [['と'], ['で']],
    pure: false,
    fn: function (a: any, b: any, sys: any) {
      sys.__exec('ASSERT等', [a, b, sys])
    }
  },
  'テスト等': { // @ テストで、ASSERTでAとBが正しいことを報告する // @テストひとしい
    type: 'func',
    josi: [['と'], ['が']],
    pure: false,
    fn: function (a: any, b: any, sys: any) {
      sys.__exec('ASSERT等', [a, b, sys])
    }
  }
}
