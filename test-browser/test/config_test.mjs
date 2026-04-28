import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

test('Playwright設定がheadless Chromium実行になっている', async () => {
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
  const playwrightConfigModule = await import(pathToFileURL(playwrightConfigPath).href)
  const playwrightConfig = playwrightConfigModule.default

  assert.equal(typeof playwrightConfig, 'object', 'playwright.config.mjsのdefault exportがオブジェクトではありません')
  assert.equal(playwrightConfig?.use?.headless, true, 'playwright.config.mjsでuse.headless=trueが指定されていません')
})

test('browser fullランナーが旧ブラウザテスト群を実行する', () => {
  const runnerPath = join(testBrowserDir, 'test/html/browser-full-runner-main.mjs')
  assert.equal(existsSync(runnerPath), true, 'browser-full-runner-main.mjsが見つかりません')

  const runnerText = readFileSync(runnerPath, 'utf8')
  const requiredImports = [
    "plugin_browser_test.js",
    "plugin_turtle_test.js",
    "plugin_webworker_test.js"
  ]
  for (const importPath of requiredImports) {
    assert.ok(runnerText.includes(importPath), `${importPath}がfullランナーから実行されていません`)
  }
})

test('browser smokeランナーが移植済みテストモジュールを実行する', () => {
  const smokeRunnerPath = join(testBrowserDir, 'test/html/browser-smoke-runner.html')
  const smokeRunnerText = readFileSync(smokeRunnerPath, 'utf8')
  assert.ok(smokeRunnerText.includes('plugin_browser_smoke_test.js'), 'browser-smoke-runner.htmlが移植済みテストモジュールを参照していません')

  const smokeModulePath = join(testBrowserDir, 'test/browser/test/plugin_browser_smoke_test.js')
  assert.equal(existsSync(smokeModulePath), true, 'plugin_browser_smoke_test.jsが見つかりません')
  const smokeModuleText = readFileSync(smokeModulePath, 'utf8')
  assert.ok(smokeModuleText.includes('runBrowserSmokeCases'), 'plugin_browser_smoke_test.jsがPlaywright向け実行関数をexportしていません')
})

test('bundledテストはMochaランナー資産に依存しない', () => {
  const bundledSpecPath = join(testBrowserDir, 'test/bundled.spec.mjs')
  const bundledSpecText = readFileSync(bundledSpecPath, 'utf8')
  assert.ok(bundledSpecText.includes('/demo/index.html'), 'bundled.spec.mjsが/demo/index.htmlを検証していません')

  const legacyFiles = [
    'test/html/bundled-runner.html',
    'test/bundled/test/bundled_test.js'
  ]
  for (const filePath of legacyFiles) {
    assert.equal(existsSync(join(testBrowserDir, filePath)), false, `${filePath}が残っています`)
  }
})

test('ace editorテストはMocha資産に依存しない', () => {
  const aceSpecPath = join(testBrowserDir, 'test/ace_editor.spec.mjs')
  const aceSpecText = readFileSync(aceSpecPath, 'utf8')
  assert.ok(aceSpecText.includes('ace editor full test'), 'ace_editor.spec.mjsにfull検証がありません')

  const legacyFiles = [
    'test/ace_editor/test/ace_editor_smoke_test.js',
    'test/ace_editor/test/ace_editor_test.js'
  ]
  for (const filePath of legacyFiles) {
    assert.equal(existsSync(join(testBrowserDir, filePath)), false, `${filePath}が残っています`)
  }
})
