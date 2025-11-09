import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 設定檔
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* 平行執行測試 */
  fullyParallel: true,
  
  /* CI 環境下失敗時不重試 */
  forbidOnly: !!process.env.CI,
  
  /* 本地開發時重試一次 */
  retries: process.env.CI ? 2 : 0,
  
  /* 平行執行的 worker 數量 */
  workers: process.env.CI ? 1 : undefined,
  
  /* 測試報告 */
  reporter: 'html',
  
  /* 共用設定 */
  use: {
    /* 基礎 URL */
    baseURL: 'http://localhost:3000',
    
    /* 截圖設定 */
    screenshot: 'only-on-failure',
    
    /* 錄影設定 */
    video: 'retain-on-failure',
    
    /* 追蹤設定 */
    trace: 'on-first-retry',
  },

  /* 測試專案設定 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* 行動裝置測試 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 開發伺服器設定 */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
