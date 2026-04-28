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
  expect(result.failures).toBe(0)
}

test('browser smoke test', async ({ page }) => {
  const result = await runRunnerPage(page, '/test-browser/test/html/browser-smoke-runner.html')
  assertNoFailures(result)
})

test('browser full test', async ({ page }) => {
  test.setTimeout(300000)
  // フルテストはより長いタイムアウトを使用する
  const result = await runRunnerPage(page, '/test-browser/test/html/browser-full-runner.html', 240000)
  assertNoFailures(result)
})
