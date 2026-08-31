/* eslint-disable no-undef */
/**
 * 差分fixtureの回帰テスト (#2448)
 *
 * `core/test/fixtures/compat/cases/*.json` を現行のTypeScript版で実行し、
 * `core/test/fixtures/compat/expected/*.json`(期待値)と一致することを確認する。
 *
 * このfixtureはGo版など別実装の「正解(oracle)」なので、
 * 期待値が知らないうちに変わってしまうと基準が揺れる。
 * このテストは、その変化を必ず検出するための番人である。
 *
 * 意図的に挙動を変えた場合は、次のコマンドで期待値を作り直すこと。
 *
 *   npm run build:tsc && npm run compat:golden
 */
import { describe, it } from 'node:test'
import assert from 'assert'
import fs from 'node:fs'
import { loadCaseGroups, runCase, expectedPathOf } from './fixtures/compat/compat_case.mjs'

const groups = loadCaseGroups()

describe('compat_fixture', () => {
  it('ケース定義と期待値の件数が一致する', () => {
    for (const group of groups) {
      const expected = JSON.parse(fs.readFileSync(expectedPathOf(group.group), 'utf8'))
      assert.strictEqual(
        Object.keys(expected.results).length,
        group.cases.length,
        `${group.group}: ケース数と期待値の件数が違います。npm run compat:golden で作り直してください`
      )
      for (const c of group.cases) {
        assert.ok(expected.results[c.name], `${group.group}: 期待値がありません: ${c.name}`)
      }
    }
  })

  for (const group of groups) {
    describe(group.group, () => {
      const expected = JSON.parse(fs.readFileSync(expectedPathOf(group.group), 'utf8')).results
      for (const testCase of group.cases) {
        it(testCase.name, async () => {
          const actual = await runCase(testCase)
          assert.deepStrictEqual(actual, expected[testCase.name])
        })
      }
    })
  }
})
