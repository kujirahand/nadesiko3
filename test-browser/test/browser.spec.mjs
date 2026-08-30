import { test, expect } from '@playwright/test'

/**
 * テストランナーHTMLページを開いて実行結果を取得するヘルパー関数
 * @param {import('@playwright/test').Page} page
 * @param {string} url - テストランナーHTMLのURL
 * @param {number} timeout - テスト完了待機タイムアウト（ms）
 */
async function runRunnerPage (page, url, timeout = 60000) {
  await page.goto(url)
  // ランナーが完了するまで待つ（window.__playwright_done__が設定されるまで）
  await page.waitForFunction(() => window.__playwright_done__ !== undefined, { timeout })
  return page.evaluate(() => window.__playwright_done__)
}

/**
 * テスト結果を検証してplaywrightのexpectに報告する
 * @param {object} result - runMochaPageの戻り値
 */
function assertNoFailures (result) {
  if (result.failures > 0) {
    const details = result.failures_detail
      .map((f) => `  - ${f.title}: ${f.error}`)
      .join('\n')
    throw new Error(`${result.failures}件のテストが失敗しました:\n${details}`)
  }
  expect(result.total, 'ブラウザ内のテストが1件も実行されていません').toBeGreaterThan(0)
  expect(result.passes + result.failures, 'ブラウザ内のテスト件数が一致しません').toBe(result.total)
  expect(result.failures).toBe(0)
}

test('browser smoke test', async ({ page }) => {
  const result = await runRunnerPage(page, '/test-browser/test/html/browser-smoke-runner.html')
  assertNoFailures(result)
})

test('browser smoke rejects zero completed tests', () => {
  expect(() => assertNoFailures({ failures: 0, passes: 0, total: 0, failures_detail: [] }))
    .toThrow('ブラウザ内のテストが1件も実行されていません')
})

test('browser smoke case counting follows the executed cases', async ({ page }) => {
  await page.goto('/test-browser/test/html/browser-smoke-runner.html')
  const result = await page.evaluate(async () => {
    const { runBrowserSmokeCases } = await import('/test-browser/test/browser/test/plugin_browser_smoke_test.js')
    return runBrowserSmokeCases([
      { title: '成功', fn: () => {} },
      { title: '失敗', fn: () => { throw new Error('expected failure') } }
    ])
  })
  expect(result.total).toBe(2)
  expect(result.passes).toBe(1)
  expect(result.failures).toHaveLength(1)
})

test('browser full test', async ({ page }) => {
  test.setTimeout(300000)
  // フルテストはより長いタイムアウトを使用する
  const result = await runRunnerPage(page, '/test-browser/test/html/browser-full-runner.html', 240000)
  assertNoFailures(result)
})
