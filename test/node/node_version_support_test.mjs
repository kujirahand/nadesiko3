// Node.js v20 はEOLのためサポート対象外であることを確認するテスト (#2389)
import fs from 'node:fs'
import assert from 'node:assert'
import { test } from 'node:test'

const readText = (relPath) => fs.readFileSync(new URL(relPath, import.meta.url), 'utf-8')
const readJson = (relPath) => JSON.parse(readText(relPath))

test('package.json の engines が Node.js v22 以上を要求している', () => {
  const pkg = readJson('../../package.json')
  assert.equal(pkg.engines?.node, '>=22.0.0')
})

test('core/package.json の engines が Node.js v22 以上を要求している', () => {
  const pkg = readJson('../../core/package.json')
  assert.equal(pkg.engines?.node, '>=22.0.0')
})

test('browserslistの設定でNode.js v22未満を除外している', () => {
  const pkg = readJson('../../package.json')
  assert.ok(Array.isArray(pkg.browserslist), 'browserslistの設定がありません')
  assert.ok(pkg.browserslist.includes('not node < 22'), 'browserslistに「not node < 22」がありません')
})

test('対応ブラウザ表にNode.js v20が含まれていない', () => {
  const browsers = readText('../../src/browsers.mjs')
  const matched = /"node":\[(.*?)\]/.exec(browsers)
  assert.ok(matched, 'src/browsers.mjs にNode.jsの記載がありません')
  const versions = matched[1].split(',').map((v) => parseInt(v.replace(/"/g, ''), 10))
  assert.ok(versions.length > 0, 'Node.jsの対応バージョンが空です')
  for (const ver of versions) {
    assert.ok(ver >= 22, `EOLのNode.js v${ver} が対応表に含まれています`)
  }
})

test('GitHub ActionsのCI対象にNode.js v20が含まれていない', () => {
  const workflow = readText('../../.github/workflows/nodejs.yml')
  const matched = /node-version:\s*\[(.*?)\]/.exec(workflow)
  assert.ok(matched, 'node-versionの指定が見つかりません')
  const versions = matched[1].split(',').map((v) => parseInt(v.trim(), 10))
  assert.ok(versions.length > 0, 'node-versionの指定が空です')
  for (const ver of versions) {
    assert.ok(ver >= 22, `EOLのNode.js v${ver} がCI対象に含まれています`)
  }
})
