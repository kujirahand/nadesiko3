import fs from 'node:fs'
import assert from 'node:assert'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
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

test('npm配布物にcoreの実行用mjsファイルが含まれる', (t) => {
  const rootDir = new URL('../..', import.meta.url)
  const coreSrcDir = new URL('../../core/src/', import.meta.url)
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nadesiko3-npm-pack-'))
  t.after(() => fs.rmSync(cacheDir, { recursive: true, force: true }))

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(npmCommand, ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: rootDir,
    encoding: 'utf-8',
    env: {
      ...process.env,
      npm_config_cache: cacheDir
    }
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)

  const packResult = JSON.parse(result.stdout)
  const packedFiles = new Set(packResult[0].files.map((file) => file.path))
  const runtimeFiles = fs.readdirSync(coreSrcDir)
    .filter((file) => file.endsWith('.mts'))
    .map((file) => `core/src/${file.replace(/\.mts$/, '.mjs')}`)

  for (const runtimeFile of runtimeFiles) {
    assert.ok(packedFiles.has(runtimeFile), `${runtimeFile} がnpm配布物に含まれていません`)
  }
})
