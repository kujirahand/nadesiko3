import { test, expect } from '@playwright/test'

/**
 * mochaを使ったHTMLページを開いて実行結果を取得するヘルパー関数
 * @param {import('@playwright/test').Page} page
 * @param {string} url - テストランナーHTMLのURL
 * @param {number} timeout - mochaテスト完了待機タイムアウト（ms）
 */
async function runMochaPage (page, url, timeout = 60000) {
  await page.goto(url)
  // mochaが完了するまで待つ（window.__playwright_done__が設定されるまで）
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

test('ace editor smoke test', async ({ page }) => {
  test.setTimeout(180000)
  // ace editorのシンタックスハイライト・コードレンズなどUIテストを実行する
  // window.okが設定されるまで待つ必要があるためタイムアウトを長めに設定する
  const result = await runMochaPage(page, '/test-browser/test/html/ace-editor-runner.html', 170000)
  assertNoFailures(result)
})
