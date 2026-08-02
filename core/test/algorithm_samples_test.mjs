import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runAlgorithmTest } from './algorithms/helper.mjs'

const testRoot = path.dirname(fileURLToPath(import.meta.url))
const casesRoot = path.join(testRoot, 'algorithms')
const sampleRoot = path.resolve(testRoot, '../sample/algorithms')

async function findFiles (dir, suffix) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await findFiles(entryPath, suffix))
    } else if (entry.name.endsWith(suffix)) {
      files.push(entryPath)
    }
  }
  return files.sort()
}

function relativePath (base, target) {
  return path.relative(base, target).split(path.sep).join('/')
}

const testFiles = await findFiles(casesRoot, '_test.nako3')
const tests = testFiles.map(testPath => {
  const relativeTest = relativePath(casesRoot, testPath)
  return {
    id: relativeTest.replace(/_test\.nako3$/, ''),
    source: relativeTest.replace(/_test\.nako3$/, '.nako3'),
    testPath
  }
})

describe('アルゴリズムサンプル', () => {
  it('全ての実装とテスト定義が1対1で対応している', async () => {
    const sampleFiles = await findFiles(sampleRoot, '.nako3')
    const sampleSources = sampleFiles.map(file => relativePath(sampleRoot, file))
    const registeredSources = tests.map(test => test.source).sort()
    const ids = tests.map(test => test.id)

    assert.strictEqual(new Set(ids).size, ids.length, 'アルゴリズムIDが重複しています')
    assert.strictEqual(new Set(registeredSources).size, registeredSources.length, '実装ファイルが重複登録されています')
    assert.deepStrictEqual(registeredSources, sampleSources)
  })

  for (const test of tests) {
    it(test.id, async () => {
      const log = await runAlgorithmTest(sampleRoot, test.source, test.testPath)
      assert.strictEqual(log, '')
    })
  }
})
