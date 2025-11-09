import { test, expect } from '@playwright/test'

/**
 * E2E 測試：Happy Path
 * 測試完整的使用者流程：貼上文字 → 分析 → 查看結果 → 歷史記錄
 */

test.describe('VeggieScan Happy Path', () => {
  test('完整流程：貼上文字 → 分析 → 查看結果 → 歷史記錄', async ({ page }) => {
    // 1. 前往掃描頁面
    await page.goto('http://localhost:3000/scan')
    await expect(page).toHaveTitle(/VeggieScan/)

    // 2. 確認頁面載入完成
    await expect(page.getByText('掃描食品成分')).toBeVisible()

    // 3. 輸入測試成分文字
    const testIngredients = '水、糖、小麥粉、植物油、食鹽、乳化劑(E471)、卵磷脂'
    await page.fill('textarea', testIngredients)

    // 4. 點擊「開始分析」按鈕
    await page.click('button:has-text("開始分析")')

    // 5. 等待分析完成（應該會顯示結果）
    // 等待結果卡片出現
    await page.waitForSelector('text=需確認', { timeout: 10000 })

    // 6. 確認結果中有成分列表
    await expect(page.getByText('E471')).toBeVisible()
    await expect(page.getByText('卵磷脂')).toBeVisible()

    // 7. 點擊「再掃一次」按鈕
    await page.click('button:has-text("再掃一次")')

    // 8. 確認回到輸入狀態
    await expect(page.locator('textarea')).toBeVisible()

    // 9. 前往歷史記錄頁面
    await page.goto('http://localhost:3000/history')

    // 10. 確認歷史記錄中有剛才的查詢
    await expect(page.getByText('查詢歷史')).toBeVisible()
    // 歷史記錄中顯示的是 summary，包含「需要確認」文字
    await expect(page.locator('text=需要確認').first()).toBeVisible()

    // 11. 點擊「重新分析」
    const reanalyzeButton = page.locator('button:has-text("重新分析")').first()
    await reanalyzeButton.waitFor({ state: 'visible' })
    await reanalyzeButton.click()

    // 12. 確認回到掃描頁面且文字已填入
    await page.waitForURL(/\/scan/, { timeout: 5000 })
    await page.waitForTimeout(1000)
    const textareaValue = await page.locator('textarea').inputValue()
    expect(textareaValue).toContain('水')
  })

  test('測試複製文字功能', async ({ page, context }) => {
    // 授予剪貼簿權限
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // 1. 前往掃描頁面並輸入文字
    await page.goto('http://localhost:3000/scan')
    const testIngredients = '水、糖、鹽'
    await page.fill('textarea', testIngredients)

    // 2. 開始分析
    await page.click('button:has-text("開始分析")')
    await page.waitForSelector('text=可食用', { timeout: 10000 })

    // 3. 點擊「複製文字」按鈕
    await page.click('button:has-text("複製文字")')

    // 4. 確認顯示「已複製」提示
    await expect(page.getByText('已複製')).toBeVisible({ timeout: 3000 })
  })

  test('測試錯誤處理：空白輸入', async ({ page }) => {
    // 1. 前往掃描頁面
    await page.goto('http://localhost:3000/scan')

    // 2. 不輸入任何文字，直接點擊分析
    // 按鈕應該是 disabled 狀態
    const analyzeButton = page.locator('button:has-text("開始分析")')
    await expect(analyzeButton).toBeDisabled()
  })

  test('測試歷史記錄刪除功能', async ({ page }) => {
    // 1. 前往掃描頁面並建立兩筆記錄
    await page.goto('http://localhost:3000/scan')
    await page.fill('textarea', '測試刪除1')
    await page.click('button:has-text("開始分析")')
    await page.waitForTimeout(1000)
    await page.click('button:has-text("再掃一次")')
    await page.fill('textarea', '測試刪除2')
    await page.click('button:has-text("開始分析")')
    await page.waitForTimeout(1000)

    // 2. 前往歷史記錄
    await page.goto('http://localhost:3000/history')

    // 3. 確認有記錄存在
    await expect(page.getByText('查詢歷史')).toBeVisible()
    
    // 4. 驗證有刪除按鈕
    const deleteButton = page.locator('button:has-text("刪除")').first()
    await expect(deleteButton).toBeVisible()
  })
})

test.describe('VeggieScan 分類測試', () => {
  test('測試安全成分判定', async ({ page }) => {
    await page.goto('http://localhost:3000/scan')
    await page.fill('textarea', '水、糖、鹽')
    await page.click('button:has-text("開始分析")')
    
    // 應該顯示可食用
    await page.waitForSelector('text=可食用', { timeout: 10000 })
  })

  test('測試警告成分判定', async ({ page }) => {
    await page.goto('http://localhost:3000/scan')
    await page.fill('textarea', '水、E471、卵磷脂')
    await page.click('button:has-text("開始分析")')
    
    // 應該顯示需確認
    await page.waitForSelector('text=需確認', { timeout: 10000 })
  })
})
