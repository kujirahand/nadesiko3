/* eslint-disable no-undef */
// マニュアル(manual)のサンプルコードを実行して検証するDocTest (#2409)
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

import {
  collectDocTests,
  extractDocTests,
  formatFailure,
  manualDir,
  rootDir,
  runDocTest
} from '../../batch/doctest.mjs'

describe('DocTest(マニュアルのサンプルコード)', () => {
  // --- 抽出処理のテスト ---
  it('「### 表示結果:」のあるブロックだけを抽出する', () => {
    const text = [
      '●説明',
      '',
      '{{{#nako3',
      '「こんにちは」と表示。',
      '### 表示結果: こんにちは',
      '}}}',
      '',
      '{{{#nako3',
      '1と2を足して表示 # 表示結果の記述がないので対象外',
      '}}}'
    ].join('\n')
    const tests = extractDocTests(text, 'test.txt')
    assert.strictEqual(tests.length, 1)
    assert.strictEqual(tests[0].line, 3)
    assert.strictEqual(tests[0].code, '「こんにちは」と表示。')
    assert.strictEqual(tests[0].expect, 'こんにちは')
  })

  it('複数行の表示結果を抽出する', () => {
    const text = ['{{{#nako3', '「あ{改行}い」と表示。', '### 表示結果: あ', '### い', '}}}'].join('\n')
    const tests = extractDocTests(text)
    assert.strictEqual(tests.length, 1)
    assert.strictEqual(tests[0].expect, 'あ\nい')
  })

  it('抽出したサンプルコードを実行して表示結果と比較できる', async () => {
    const [test] = extractDocTests(['{{{#nako3', '10+5を表示。', '### 表示結果: 15', '}}}'].join('\n'))
    const ok = await runDocTest(test)
    assert.strictEqual(ok.ok, true)
    const ng = await runDocTest({ ...test, expect: '16' })
    assert.strictEqual(ng.ok, false)
    assert.ok(formatFailure({ ...test, expect: '16' }, ng).includes('表示結果が期待と異なります'))
  })

  it('実行エラーになるサンプルコードは失敗として報告する', async () => {
    const [test] = extractDocTests(['{{{#nako3', '存在しない命令。', '### 表示結果: 1', '}}}'].join('\n'))
    const result = await runDocTest(test)
    assert.strictEqual(result.ok, false)
    assert.ok(result.error !== null)
    assert.ok(formatFailure(test, result).includes('実行エラー'))
  })
})

// --- manualディレクトリのサンプルコードを実際に実行する ---
// manualは別リポジトリ(nadesiko3doc)へのシンボリックリンクなので、無い場合はスキップする
if (!fs.existsSync(manualDir)) {
  describe('DocTest(manualディレクトリ)', () => {
    it('manualディレクトリが無いのでスキップします', function () {
      this.skip('manualディレクトリがありません。AGENTS.mdの手順でリンクを作成してください。')
    })
  })
} else {
  const tests = collectDocTests()
  // ファイルごとにまとめてテストする
  const files = [...new Set(tests.map((t) => t.file))]
  describe('DocTest(manualディレクトリ)', () => {
    for (const file of files) {
      const name = path.relative(rootDir, file)
      for (const test of tests.filter((t) => t.file === file)) {
        it(`${name}(${test.line}行目)のサンプルコード`, async () => {
          const result = await runDocTest(test)
          assert.ok(result.ok, '\n' + formatFailure(test, result))
        })
      }
    }
  })
}
