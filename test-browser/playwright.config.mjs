import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // テストファイルのディレクトリ
  testDir: './test',
  // Playwright spec ファイルのパターン
  testMatch: '**/*.spec.mjs',
  // タイムアウト設定
  timeout: 90000,
  expect: {
    timeout: 60000
  },
  // テスト失敗時のリトライ設定（CIでは1回リトライ）
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    // テスト失敗時のスクリーンショット
    screenshot: 'only-on-failure',
    // テスト失敗時の動画録画
    video: 'retain-on-failure'
  },
  // Viteをdev serverとして使用する
  webServer: {
    // test-browser/ ディレクトリで vite を起動する
    command: 'node_modules/.bin/vite --config vite.config.mjs',
    // Viteルート("/")は404のため、必ず200を返すランナーHTMLで待機する
    url: 'http://localhost:5173/test-browser/test/html/browser-smoke-runner.html',
    // CIでは既存サーバーを再利用しない
    reuseExistingServer: !process.env.CI,
    // テスト用ディレクトリをカレントディレクトリとして起動する
    cwd: __dirname,
    timeout: 30000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
