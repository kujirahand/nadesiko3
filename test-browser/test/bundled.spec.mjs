import { test, expect } from '@playwright/test'

test('bundled test', async ({ page }) => {
  // バンドル版エディタの最小動作をPlaywrightで直接確認する
  await page.goto('/demo/index.html')

  await expect(page).toHaveTitle('なでしこ3 - Webエディタ')
  await expect(page.locator('.version-component')).toContainText('日本語プログラミング言語「なでしこ3」')
  await expect(page.locator('#title')).toContainText('なでしこ3 - Webエディタ')
  await expect(page.locator('.about-group .pure-button').first()).toBeVisible()
})
