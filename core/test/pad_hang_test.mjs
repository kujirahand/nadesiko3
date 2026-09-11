/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Infinity 桁のゼロ埋/空白埋は同期ループでイベントループを止めるため、
// node --test のタイムアウトでは検出できない。子プロセスで隔離する。(#2480)

const testDir = path.dirname(fileURLToPath(import.meta.url))
const nako3Url = pathToFileURL(path.join(testDir, '../src/nako3.mjs')).href

const runnerScript = `
import { NakoCompiler } from ${JSON.stringify(nako3Url)}
const nako = new NakoCompiler()
try {
  const res = await nako.runAsync(process.argv[1], 'main.nako3')
  process.stdout.write(String(res.log))
} catch (err) {
  process.stderr.write(String(err.msg || err.message))
  process.exitCode = 1
}
`

/** 子プロセスでなでしこのコードを実行する */
function runNako (code) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', runnerScript, code], {
    cwd: testDir,
    encoding: 'utf8',
    timeout: 3000
  })
  assert.notStrictEqual(result.error?.code, 'ETIMEDOUT', `ゼロ埋/空白埋がタイムアウトしました: ${code}`)
  assert.ifError(result.error)
  return result
}

describe('ゼロ埋/空白埋の停止防止 (#2480)', () => {
  it('ゼロ埋にInfinityを渡すとエラーになり停止する', () => {
    const result = runNako('「5」を(1/0)でゼロ埋して表示。')
    assert.strictEqual(result.status, 1, `エラーになりませんでした: ${result.stdout}`)
    assert.match(result.stderr, /有限の整数/)
    assert.strictEqual(result.stdout, '')
  })

  it('空白埋にInfinityを渡すとエラーになり停止する', () => {
    const result = runNako('「5」を(1/0)で空白埋して表示。')
    assert.strictEqual(result.status, 1, `エラーになりませんでした: ${result.stdout}`)
    assert.match(result.stderr, /有限の整数/)
    assert.strictEqual(result.stdout, '')
  })

  it('ゼロ埋の通常入力は従来どおり動作する', () => {
    const result = runNako('「5」を3でゼロ埋して表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '005')
  })
})
