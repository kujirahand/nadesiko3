import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testDir, '../..')
const cnako3Path = path.join(projectRoot, 'src/cnako3.mjs')

function runCnako (code) {
  const result = spawnSync(process.execPath, [cnako3Path, '-e', code], {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 3000
  })
  assert.notStrictEqual(result.error?.code, 'ETIMEDOUT', `構文解析がタイムアウトしました: ${code}`)
  assert.ifError(result.error)
  return result
}

describe('構文解析の停止防止 (#2436)', () => {
  it('カンマを省略したネスト配列を解析できる', () => {
    const result = runCnako('A=[[0,0,0,0][0,0,0,0]];AをJSONエンコードして表示')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[[0,0,0,0],[0,0,0,0]]')
  })

  it('後置添字として解析できない角括弧で停止しない', () => {
    const result = runCnako('A=[][0,0,0,0]')
    assert.strictEqual(result.signal, null)
  })

  it('不完全なプロパティ指定で停止しない', () => {
    const result = runCnako('A=[]$')
    assert.strictEqual(result.signal, null)
  })
})
