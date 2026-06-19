import fs from 'node:fs'
import assert from 'node:assert'
import { test } from 'node:test'

test('package.json に node-fetch の依存がない', () => {
  const pkgUrl = new URL('../../package.json', import.meta.url)
  const pkg = JSON.parse(fs.readFileSync(pkgUrl, 'utf-8'))
  const dependencySections = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies'
  ]
  for (const section of dependencySections) {
    assert.equal(pkg[section]?.['node-fetch'], undefined, `${section} に node-fetch が含まれています`)
  }
})
