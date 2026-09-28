/* eslint-disable no-undef */
// なでしこで書いたDocTest本体 batch/doctest.nako3 の検証 (#2570)
import assert from 'node:assert'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const testRoot = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testRoot, '../..')
const cnako3Path = path.join(projectRoot, 'src/cnako3.mjs')
const scriptPath = path.join(projectRoot, 'batch/doctest.nako3')
const fixtureDir = path.join(testRoot, 'fixtures/doctest_nako3')
const okFile = path.join(fixtureDir, 'ok.txt')
const ngFile = path.join(fixtureDir, 'ng.txt')

/** batch/doctest.nako3 を実行する */
function runDocTest (args, options = {}) {
  return spawnSync(process.execPath, [cnako3Path, scriptPath, ...args], {
    cwd: projectRoot,
    encoding: 'utf-8',
    timeout: 60000,
    ...options
  })
}

describe('batch/doctest.nako3 (なでしこで書いたDocTest #2570)', () => {
  it('成功するサンプルだけなら正常終了する', () => {
    const result = runDocTest([okFile])
    assert.strictEqual(result.status, 0, `stderr: ${result.stderr}`)
    // WEB表示結果のサンプルは既定では対象にならない
    assert.match(result.stdout, /\[DocTest\] 2件のサンプルコードを実行します。/)
    assert.match(result.stdout, /\[DocTest\] 2件成功・0件省略・失敗なし。/)
    assert.doesNotMatch(result.stdout, /\[DocTest失敗\]/)
  })

  it('表示結果が違うサンプルを失敗として報告する', () => {
    const result = runDocTest(['--max', '0', ngFile])
    assert.strictEqual(result.status, 1)
    assert.match(result.stdout, /\[DocTest\] 3件のサンプルコードを実行します。/)
    assert.match(result.stdout, /\[DocTest失敗\] .*ng\.txt:3 の表示結果が期待と異なります。/)
    assert.match(result.stdout, /--- 違いのある行 ---/)
    assert.match(result.stdout, /\[DocTest\] 1\/3件成功・2件失敗・0件省略。/)
  })

  it('--label でブラウザ用サンプルだけを対象にできる', () => {
    const result = runDocTest(['--max', '0', '--label', 'WEB表示結果', okFile])
    assert.match(result.stdout, /\[DocTest\] 1件のサンプルコードを実行します。/)
  })

  it('--json で失敗した結果をJSONに出力できる', () => {
    const result = runDocTest(['--max', '0', '--json', ngFile])
    assert.strictEqual(result.status, 1)
    const jsonStart = result.stdout.indexOf('{')
    const jsonEnd = result.stdout.lastIndexOf('}')
    assert.ok(jsonStart >= 0 && jsonEnd > jsonStart, `JSONが出力されていません: ${result.stdout}`)
    const data = JSON.parse(result.stdout.slice(jsonStart, jsonEnd + 1))
    assert.strictEqual(data.ツール, 'nadesiko3-doctest')
    assert.strictEqual(data.件数, 3)
    assert.strictEqual(data.成功数, 1)
    assert.strictEqual(data.失敗数, 2)
    assert.strictEqual(data.結果.length, 2)
    assert.strictEqual(path.basename(data.結果[0].ファイル), 'ng.txt')
    assert.strictEqual(data.結果[0].行, 3)
    assert.strictEqual(data.結果[0].期待, 'さようなら')
    assert.strictEqual(data.結果[0].実際, 'こんにちは')
  })

  it('--json=ファイル名 で結果をファイルに書き出す', () => {
    const outFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'doctest-nako3-')), 'result.json')
    const result = runDocTest(['--max', '0', `--json=${outFile}`, ngFile])
    assert.strictEqual(result.status, 1, `stderr: ${result.stderr}`)
    assert.doesNotMatch(result.stdout, /"ツール": "nadesiko3-doctest"/)
    const data = JSON.parse(fs.readFileSync(outFile, 'utf-8'))
    assert.strictEqual(data.失敗数, 2)
    assert.ok(Array.isArray(data.結果))
    fs.rmSync(path.dirname(outFile), { recursive: true, force: true })
  })

  it('--runtime で外部ランタイムを指定して実行できる', () => {
    // 「--runtime "node src/cnako3.mjs"」のようにコマンドと引数をまとめて指定する
    const result = runDocTest(['--max', '0', '--runtime', `${process.execPath} ${cnako3Path}`, okFile])
    assert.strictEqual(result.status, 0, `stderr: ${result.stderr}`)
    assert.match(result.stdout, /\[DocTest\] 2件成功・0件省略・失敗なし。/)
  })

  it('--internal でも同じ結果になる', () => {
    const result = runDocTest(['--max', '0', '--internal', okFile])
    assert.strictEqual(result.status, 0, `stderr: ${result.stderr}`)
    assert.match(result.stdout, /\[DocTest\] 2件成功・0件省略・失敗なし。/)
  })

  it('存在しないファイルを指定すると異常終了する', () => {
    const result = runDocTest([path.join(fixtureDir, 'notfound.txt')])
    assert.strictEqual(result.status, 2)
    assert.match(result.stdout, /対象が見つかりません/)
  })

  it('未対応の引数は異常終了する', () => {
    const result = runDocTest(['--unknown-option'])
    assert.strictEqual(result.status, 2)
    assert.match(result.stdout, /未対応の引数: --unknown-option/)
  })

  it('--usage で使い方を表示する', () => {
    const result = runDocTest(['--usage'])
    assert.strictEqual(result.status, 0, `stderr: ${result.stderr}`)
    assert.match(result.stdout, /使い方: node src\/cnako3\.mjs batch\/doctest\.nako3/)
    assert.match(result.stdout, /--json/)
  })
})
