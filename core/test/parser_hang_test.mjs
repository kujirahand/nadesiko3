/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 構文解析が無限ループすると同期処理でイベントループが止まり、
// node --test のタイムアウトでは検出できずテスト全体が固まってしまう。
// そのため、子プロセスで実行してタイムアウトを監視する。(#2436)

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
    timeout: 10000
  })
  assert.notStrictEqual(result.error?.code, 'ETIMEDOUT', `構文解析がタイムアウトしました: ${code}`)
  assert.ifError(result.error)
  return result
}

describe('構文解析の停止防止 (#2436)', () => {
  it('カンマを省略したネスト配列は構文エラーになる', () => {
    const result = runNako('A=[[0,0,0,0][0,0,0,0]];AをJSONエンコードして表示')
    assert.strictEqual(result.status, 1, `エラーになりませんでした: ${result.stdout}`)
    assert.match(result.stderr, /『,』\(カンマ\)を忘れていませんか/)
    assert.strictEqual(result.stdout, '')
  })

  it('後置添字として解析できない角括弧で停止しない', () => {
    const result = runNako('A=[][0,0,0,0]')
    assert.strictEqual(result.status, 1, `エラーになりませんでした: ${result.stdout}`)
    assert.match(result.stderr, /配列アクセスとして解析できません/)
  })

  it('不完全なプロパティ指定で停止しない', () => {
    const result = runNako('A=[]$')
    assert.strictEqual(result.status, 1, `エラーになりませんでした: ${result.stdout}`)
    assert.match(result.stderr, /『\$プロパティ』の指定が不正です/)
  })

  it('正しく書いた配列は従来どおり解析できる', () => {
    const result = runNako('A=[[1,2,3],[4,5,6]];A[1][2]を表示')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '6')
  })
})
