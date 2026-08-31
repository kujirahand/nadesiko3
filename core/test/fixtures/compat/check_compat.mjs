/* eslint-disable no-undef */
/**
 * 別実装の実行結果を期待値(oracle)と突き合わせ、通過率を表示する (#2448)
 *
 * Go版など、なでしこ3の別実装が `cases/*.json` を実行して
 * 同じ形式のJSONを書き出せば、このスクリプトで進捗を数値で追える。
 *
 *   node core/test/fixtures/compat/check_compat.mjs <結果のディレクトリ or JSONファイル>
 *
 * オプション:
 *   --impl=go   非対応(unsupported)・意図的差異(intentionalDiff)として除外する実装名。既定は go
 *   --json      結果をJSONで出力する
 *   --strict    1件でも不一致があれば終了コード1を返す
 *
 * 結果JSONの形式は SPEC.md を参照。
 *
 * このディレクトリは `core/test/*.mjs` のテストグロブに含まれないので、
 * テスト実行時にこのファイルが走ることはない。
 */
import fs from 'node:fs'
import path from 'node:path'
import { loadCaseGroups, expectedPathOf } from './compat_case.mjs'

const args = process.argv.slice(2)
const target = args.find((a) => !a.startsWith('--'))
const implName = (args.find((a) => a.startsWith('--impl=')) || '--impl=go').slice('--impl='.length)
const asJson = args.includes('--json')
const strict = args.includes('--strict')

if (!target) {
  console.error('使い方: node core/test/fixtures/compat/check_compat.mjs <結果のディレクトリ or JSONファイル> [--impl=go] [--json] [--strict]')
  process.exit(2)
}

/** 実装側の結果を { グループ名: { ケース名: 結果 } } の形で読み込む */
function loadActual (target) {
  const stat = fs.statSync(target)
  const actual = {}
  if (stat.isDirectory()) {
    for (const file of fs.readdirSync(target).filter((f) => f.endsWith('.json'))) {
      const json = JSON.parse(fs.readFileSync(path.join(target, file), 'utf8'))
      const group = json.group || path.basename(file, '.json')
      actual[group] = json.results || json
    }
    return actual
  }
  const json = JSON.parse(fs.readFileSync(target, 'utf8'))
  // 1ファイルにまとめた形式にも対応する
  for (const [group, value] of Object.entries(json)) {
    actual[group] = value && value.results ? value.results : value
  }
  return actual
}

/** 比較する項目だけを取り出す(name は比較しない) */
function comparable (result) {
  if (!result) { return null }
  return {
    status: result.status,
    log: result.log,
    vars: result.vars,
    error: result.error
  }
}

const actual = loadActual(target)
const groups = loadCaseGroups()
const report = { impl: implName, groups: [], total: 0, passed: 0, failed: 0, missing: 0, skipped: 0, diffs: 0 }

for (const group of groups) {
  const expected = JSON.parse(fs.readFileSync(expectedPathOf(group.group), 'utf8')).results
  const got = actual[group.group] || {}
  const g = { group: group.group, total: 0, passed: 0, failed: 0, missing: 0, skipped: 0, diffs: 0, failures: [] }
  for (const testCase of group.cases) {
    const name = testCase.name
    if (testCase.unsupported && testCase.unsupported[implName]) {
      g.skipped++
      continue
    }
    if (testCase.intentionalDiff && testCase.intentionalDiff[implName]) {
      // 仕様として結果が異なるケース。一致を求めない
      g.diffs++
      continue
    }
    g.total++
    if (!(name in got)) {
      g.missing++
      g.failures.push({ name, reason: '結果がありません' })
      continue
    }
    const a = JSON.stringify(comparable(got[name]))
    const e = JSON.stringify(comparable(expected[name]))
    if (a === e) {
      g.passed++
    } else {
      g.failed++
      g.failures.push({ name, expected: comparable(expected[name]), actual: comparable(got[name]) })
    }
  }
  report.groups.push(g)
  report.total += g.total
  report.passed += g.passed
  report.failed += g.failed
  report.missing += g.missing
  report.skipped += g.skipped
  report.diffs += g.diffs
}

report.rate = report.total === 0 ? 0 : Math.round((report.passed / report.total) * 1000) / 10

if (asJson) {
  console.log(JSON.stringify(report, null, 1))
} else {
  for (const g of report.groups) {
    const mark = g.passed === g.total ? '○' : '×'
    console.log(`${mark} ${g.group}: ${g.passed}/${g.total} 通過` +
      (g.skipped ? ` (非対応 ${g.skipped}件)` : '') +
      (g.diffs ? ` (意図的差異 ${g.diffs}件)` : ''))
    for (const f of g.failures.slice(0, 5)) {
      console.log(`    - ${f.name}${f.reason ? ': ' + f.reason : ''}`)
      if (!f.reason) {
        console.log(`        期待: ${JSON.stringify(f.expected)}`)
        console.log(`        実際: ${JSON.stringify(f.actual)}`)
      }
    }
    if (g.failures.length > 5) { console.log(`    ... 他 ${g.failures.length - 5} 件`) }
  }
  console.log('')
  console.log(`合計: ${report.passed}/${report.total} 通過 (${report.rate}%)` +
    `  不一致 ${report.failed}件 / 未実行 ${report.missing}件 / 非対応 ${report.skipped}件 / 意図的差異 ${report.diffs}件`)
}

process.exit(strict && (report.failed > 0 || report.missing > 0) ? 1 : 0)
