/* eslint-disable no-undef */
/**
 * 差分fixtureの期待値(oracle)を生成するスクリプト (#2448)
 *
 * `cases/*.json` を現行のTypeScript版で実行し、その結果を
 * `expected/*.json` に書き出す。ここで書き出したものが、
 * Go版など別実装が目指す「正解」になる。
 *
 * 実行前に必ずビルドすること(core/src/*.mjs はビルド生成物のため)。
 *
 *   npm run build:tsc
 *   npm run compat:golden
 *
 * このディレクトリは `core/test/*.mjs` のテストグロブに含まれないので、
 * テスト実行時にこのファイルが走ることはない。
 */
import fs from 'node:fs'
import { loadCaseGroups, runGroup, expectedPathOf, expectedDir } from './compat_case.mjs'

if (!fs.existsSync(expectedDir)) { fs.mkdirSync(expectedDir, { recursive: true }) }

const groups = loadCaseGroups()
let total = 0
for (const group of groups) {
  const results = await runGroup(group)
  const out = {
    group: group.group,
    description: group.description,
    // 期待値は現行TypeScript版で生成したもの、という出自を残しておく
    generatedBy: 'nadesiko3 (TypeScript)',
    results
  }
  fs.writeFileSync(expectedPathOf(group.group), JSON.stringify(out, null, 1) + '\n', 'utf8')
  total += Object.keys(results).length
  console.log(`${group.group}: ${Object.keys(results).length} 件`)
}
console.log(`合計 ${total} 件の期待値を書き出しました`)
// タイマーが残っていても終了する
process.exit(0)
