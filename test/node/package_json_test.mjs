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

test('core/.npmignoreが実行用mjs以外の除外設定を引き継ぐ', () => {
  const gitignoreUrl = new URL('../../core/.gitignore', import.meta.url)
  const npmignoreUrl = new URL('../../core/.npmignore', import.meta.url)
  const readRules = (fileUrl) => fs.readFileSync(fileUrl, 'utf-8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
  const runtimeRules = new Set([
    'command/plugin_snako.mjs',
    'command/snako.mjs',
    'src/*.mjs'
  ])
  const expectedRules = readRules(gitignoreUrl).filter((rule) => !runtimeRules.has(rule))

  assert.deepEqual(readRules(npmignoreUrl), expectedRules)
})

test('npm配布物にcoreの実行用mjsファイルが含まれる', { timeout: 60000 }, (t) => {
  const rootDir = new URL('../..', import.meta.url)
  const coreSrcDir = new URL('../../core/src/', import.meta.url)
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nadesiko3-npm-pack-'))
  t.after(() => fs.rmSync(cacheDir, { recursive: true, force: true }))

  const runtimeFiles = [
    ...fs.readdirSync(coreSrcDir)
      .filter((file) => file.endsWith('.mts'))
      .map((file) => `core/src/${file.replace(/\.mts$/, '.mjs')}`),
    'core/command/snako.mjs',
    'core/command/plugin_snako.mjs'
  ]
  const missingRuntimeFiles = runtimeFiles.filter((file) => {
    return !fs.existsSync(new URL(`../../${file}`, import.meta.url))
  })
  assert.deepEqual(
    missingRuntimeFiles,
    [],
    `実行用mjsが未ビルドです。先にnpm run buildを実行してください: ${missingRuntimeFiles.join(', ')}`
  )

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

  for (const runtimeFile of runtimeFiles) {
    assert.ok(packedFiles.has(runtimeFile), `${runtimeFile} がnpm配布物に含まれていません`)
  }
})
