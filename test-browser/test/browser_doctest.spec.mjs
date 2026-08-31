import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

import {
  collectDocTests,
  doctestDir,
  formatFailure,
  manualDir,
  rootDir
} from '../../batch/doctest.mjs'

async function runOnBrowser (page, docTest) {
  await page.goto('/test-browser/test/html/browser-doctest-runner.html')
  const result = await page.evaluate(async (target) => {
    const runner = await import('/test-browser/test/html/browser-doctest-runner-main.mjs')
    return runner.runBrowserDocTest(target)
  }, docTest)
  const formattedResult = {
    ...result,
    error: result.error ? new Error(result.error) : null
  }
  expect(result.ok, '\n' + formatFailure(docTest, formattedResult)).toBe(true)
}

function registerDocTests (suiteName, tests) {
  test.describe(suiteName, () => {
    for (const docTest of tests) {
      const name = `${path.relative(rootDir, docTest.file)}(${docTest.line}行目)`
      test(name, async ({ page }) => {
        await runOnBrowser(page, docTest)
      })
    }
  })
}

const fixtureTests = collectDocTests([doctestDir], 'wnako')
test('test/doctestにwnako用の固定サンプルが存在する', () => {
  expect(fixtureTests.length).toBeGreaterThan(0)
})
registerDocTests('ブラウザDocTest(test/doctestディレクトリ)', fixtureTests)

if (!fs.existsSync(manualDir)) {
  test.skip('manualディレクトリがないためブラウザDocTestをスキップする', () => {})
} else {
  const manualTests = collectDocTests([manualDir], 'wnako')
  if (manualTests.length === 0) {
    test.skip('manualにWEB表示結果のDocTestがないためスキップする', () => {})
  } else {
    registerDocTests('ブラウザDocTest(manualディレクトリ)', manualTests)
  }
}
