import { test, expect } from '@playwright/test'

test('ace editor smoke test', async ({ page }) => {
  test.setTimeout(180000)
  // Ace Editorの初期描画と実行結果をPlaywrightで直接確認する
  await page.goto('/test-browser/test/html/ace-editor-runner.html')
  await page.waitForFunction(() => window.ok !== undefined, { timeout: 170000 })

  const isReady = await page.evaluate(() => window.ok)
  expect(isReady).toBe(true)

  await expect(page.locator('.ace_editor').first()).toBeVisible()
  await expect(page.locator('.ace_fold-widget').first()).toBeVisible()
  await expect(page.locator('#editor1-output')).toContainText('こんにちは')
})
