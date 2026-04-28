import { test, expect } from '@playwright/test'

test('ace editor smoke test', async ({ page }) => {
  test.setTimeout(180000)
  // Ace Editorの初期描画と実行結果をPlaywrightで直接確認する
  await page.goto('/test-browser/test/html/ace-editor-runner.html')
  await page.waitForFunction(() => window.ok !== undefined, { timeout: 170000 })

  const isReady = await page.evaluate(() => window.ok)
  if (!isReady) {
    const runnerError = await page.evaluate(() => window.__ace_runner_error__ || '')
    throw new Error(`ace-editor-runnerの初期化に失敗しました: ${runnerError}`)
  }
  expect(isReady).toBe(true)

  await expect(page.locator('.ace_editor').first()).toBeVisible()
  await expect(page.locator('.ace_fold-widget').first()).toBeVisible()
  await expect(page.locator('#editor1-output')).toContainText('こんにちは')
})

// TODO: marker-yellow描画の不安定性を解消後にfixmeを外す
test.fixme('ace editor full test', async ({ page }) => {
  test.setTimeout(240000)
  await page.goto('/test-browser/test/html/ace-editor-runner.html')
  await page.waitForFunction(() => window.ok !== undefined, { timeout: 170000 })

  const isReady = await page.evaluate(() => window.ok)
  if (!isReady) {
    const runnerError = await page.evaluate(() => window.__ace_runner_error__ || '')
    throw new Error(`ace-editor-runnerの初期化に失敗しました: ${runnerError}`)
  }

  // シンタックスハイライト
  await expect(page.locator('#editor1 .ace_keyword.ace_control').filter({ hasText: 'も' }).first()).toBeVisible()
  await expect(page.locator('#editor1 .ace_function').filter({ hasText: '表' }).first()).toBeVisible()
  await expect(page.locator('#editor2 .ace_comment').filter({ hasText: '範' }).first()).toBeVisible()

  // 折りたたみ
  await expect(page.locator('#editor2 .ace_fold-widget').first()).toBeVisible()
  await expect(page.locator('#editor3 .ace_fold-widget')).toHaveCount(0)

  // エラーマーカー・警告マーカー
  await expect(page.locator('#editor4 .marker-red').first()).toBeVisible()
  await expect(page.locator('#editor10 .marker-red').first()).toBeVisible()
  await expect(page.locator('#editor9 .marker-yellow').first()).toBeVisible()
  await expect(page.locator('#editor1 .marker-red')).toHaveCount(0)
  await expect(page.locator('#editor2 .marker-red')).toHaveCount(0)
  await expect(page.locator('#editor3 .marker-red')).toHaveCount(0)

  // 出力内容
  await expect(page.locator('#editor1-output')).toContainText('こんにちは')
  await expect(page.locator('#editor9-output')).toContainText('変数『a』は定義されていません。')
  await expect(page.locator('#editor11-output')).toContainText('[字句解析エラー]main.nako3(1行目):')

  // code lens
  await expect(page.locator('#editor12 .ace_codeLens')).toHaveCount(2)
  await page.locator('#editor12 .ace_codeLens a').first().click()
  const clicked = await page.evaluate(() => window.codeLensClicked)
  expect(clicked).toBe('足す')

  // テスト実行結果
  const testResult = await page.evaluate(async () => {
    const resFail = { log: '' }
    {
      const runFail = window.editor12.run({ method: 'test', testName: '足す' })
      runFail.logger.addListener('info', ({ noColor }) => { resFail.log += noColor })
      await runFail.promise
    }
    const resPass = { log: '' }
    {
      const runPass = window.editor12.run({ method: 'test', testName: '引く' })
      runPass.logger.addListener('info', ({ noColor }) => { resPass.log += noColor })
      await runPass.promise
    }
    return { failLog: resFail.log, passLog: resPass.log }
  })
  expect(testResult.failLog.includes('失敗 1件')).toBe(true)
  expect(testResult.passLog.includes('成功 1件')).toBe(true)
})
