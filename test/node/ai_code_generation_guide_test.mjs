import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const testRoot = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testRoot, '../..')
const guidePath = path.join(projectRoot, 'doc/ai-code-generation.md')
const cnako3Path = path.join(projectRoot, 'src/cnako3.mjs')

describe('AIコード生成チュートリアル', () => {
  it('掲載しているサンプルをcnako3で実行できる', () => {
    const guide = fs.readFileSync(guidePath, 'utf8')
    const match = guide.match(
      /<!-- ai-code-generation-example:start -->\s*```nako3\n([\s\S]*?)\n```\s*<!-- ai-code-generation-example:end -->/
    )

    assert.ok(match, 'チュートリアルの実行サンプルが見つかりません')

    const result = spawnSync(process.execPath, [cnako3Path, '-e', match[1]], {
      encoding: 'utf8'
    })

    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '合計は55です')
  })
})
