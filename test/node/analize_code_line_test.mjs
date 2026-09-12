import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const testRoot = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testRoot, '../..')
const cnako3Path = path.join(projectRoot, 'src/cnako3.mjs')
const scriptPath = path.join(projectRoot, 'batch/analize-code-line.nako3')
const packageJsonPath = path.join(projectRoot, 'package.json')

describe('analize-code-line (#2523)', () => {
  it('package.json に analize-code-line スクリプトが定義されている', () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    assert.strictEqual(pkg.scripts['analize-code-line'], 'node src/cnako3.mjs batch/analize-code-line.nako3')
  })

  it('batch/analize-code-line.nako3 が正常に実行され、行数と文字数を集計する', () => {
    const result = spawnSync(process.execPath, [cnako3Path, scriptPath], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 30000
    })
    assert.strictEqual(result.status, 0, `stderr: ${result.stderr}`)

    const stdout = result.stdout
    assert.match(stdout, /対象ファイル数: \d+/)
    assert.match(stdout, /総行数: \d+ 行/)
    assert.match(stdout, /総文字数: \d+ 文字/)

    const fileCountMatch = stdout.match(/対象ファイル数: (\d+)/)
    assert.ok(fileCountMatch, '対象ファイル数が出力されている')
    const fileCount = parseInt(fileCountMatch[1], 10)
    assert.ok(fileCount > 0, `対象ファイル数が0より大きい (実際: ${fileCount})`)

    const linesMatch = stdout.match(/総行数: (\d+) 行/)
    assert.ok(linesMatch, '総行数が出力されている')
    const totalLines = parseInt(linesMatch[1], 10)
    assert.ok(totalLines > 0, `総行数が0より大きい (実際: ${totalLines})`)

    const charsMatch = stdout.match(/総文字数: (\d+) 文字/)
    assert.ok(charsMatch, '総文字数が出力されている')
    const totalChars = parseInt(charsMatch[1], 10)
    assert.ok(totalChars > 0, `総文字数が0より大きい (実際: ${totalChars})`)
  })
})
