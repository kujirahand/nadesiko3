import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const testBrowserDir = resolve(currentDir, '..')
const rootDir = resolve(testBrowserDir, '..')

test('Playwright設定ファイルが存在する', () => {
  // playwright.config.mjs と vite.config.mjs が必要
  assert.equal(existsSync(join(testBrowserDir, 'playwright.config.mjs')), true)
  assert.equal(existsSync(join(testBrowserDir, 'vite.config.mjs')), true)
})

test('HTMLテストランナーが存在する', () => {
  // 各テストスイート用のHTMLランナーが必要
  const requiredHtmlRunners = [
    'test/html/browser-smoke-runner.html',
    'test/html/browser-full-runner.html',
    'test/html/bundled-runner.html',
    'test/html/ace-editor-runner.html'
  ]
  for (const runner of requiredHtmlRunners) {
    assert.equal(existsSync(join(testBrowserDir, runner)), true, `${runner}が見つかりません`)
  }
})

test('Playwright specファイルが存在する', () => {
  // 各テストスイートのPlaywright specが必要
  const requiredSpecs = [
    'test/browser.spec.mjs',
    'test/bundled.spec.mjs',
    'test/ace_editor.spec.mjs'
  ]
  for (const spec of requiredSpecs) {
    assert.equal(existsSync(join(testBrowserDir, spec)), true, `${spec}が見つかりません`)
  }
})

test('ルートpackage.jsonにブラウザ系テストスクリプトを残さない', () => {
  const rootPackagePath = join(rootDir, 'package.json')
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'))
  const scripts = rootPackage.scripts || {}

  // ブラウザテスト関連のスクリプトはルートに残さない
  const forbiddenScripts = [
    'test:browser',
    'test:browser:full',
    'test:browser:config',
    'test:browser:legacy',
    'test:browser:legacy:full',
    'test:ace-editor',
    'test:ace-editor:full',
    'test:bundled',
    'test:bundled:watch',
    'test:bundled:win',
    'test:selenium',
    'test:selenium:full'
  ]

  for (const scriptName of forbiddenScripts) {
    assert.equal(scriptName in scripts, false, `ルートpackage.jsonに${scriptName}が残っています`)
  }
})

test('test-browser package.jsonにブラウザ系テストスクリプトを集約する', () => {
  const testBrowserPackagePath = join(testBrowserDir, 'package.json')
  const testBrowserPackage = JSON.parse(readFileSync(testBrowserPackagePath, 'utf8'))
  const scripts = testBrowserPackage.scripts || {}

  // ブラウザテスト関連のスクリプトがすべて存在することを確認する
  const requiredScripts = [
    'test:browser',
    'test:browser:smoke',
    'test:browser:full',
    'test:ace-editor',
    'test:ace-editor:smoke',
    'test:ace-editor:full',
    'test:bundled',
    'test:selenium'
  ]

  for (const scriptName of requiredScripts) {
    assert.equal(typeof scripts[scriptName], 'string', `${scriptName}がtest-browser/package.jsonに存在しません`)
    assert.ok(scripts[scriptName].length > 0, `${scriptName}スクリプトが空です`)
  }
})

test('Playwright設定がheadless Chromium実行になっている', () => {
  const testBrowserPackagePath = join(testBrowserDir, 'package.json')
  const testBrowserPackage = JSON.parse(readFileSync(testBrowserPackagePath, 'utf8'))
  const scripts = testBrowserPackage.scripts || {}

  const playwrightScriptMap = {
    'test:browser:smoke': 'test/browser.spec.mjs',
    'test:browser:full': 'test/browser.spec.mjs',
    'test:ace-editor': 'test/ace_editor.spec.mjs',
    'test:ace-editor:smoke': 'test/ace_editor.spec.mjs',
    'test:ace-editor:full': 'test/ace_editor.spec.mjs',
    'test:bundled': 'test/bundled.spec.mjs'
  }
  for (const [scriptName, specPath] of Object.entries(playwrightScriptMap)) {
    const script = scripts[scriptName] || ''
    assert.ok(script.includes('--project chromium'), `${scriptName}で--project chromiumが指定されていません`)
    assert.ok(script.includes(specPath), `${scriptName}で対象specファイルが指定されていません`)

    // --project の可変長解釈で spec パスが吸い込まれないように、spec は --project より前に置く
    const specPos = script.indexOf(specPath)
    const projectPos = script.indexOf('--project chromium')
    assert.ok(specPos >= 0 && projectPos >= 0 && specPos < projectPos, `${scriptName}の引数順序が不正です`)
  }

  const playwrightConfigPath = join(testBrowserDir, 'playwright.config.mjs')
  const playwrightConfigText = readFileSync(playwrightConfigPath, 'utf8')
  assert.ok(playwrightConfigText.includes('headless: true'), 'playwright.config.mjsでheadless: trueが指定されていません')
})
