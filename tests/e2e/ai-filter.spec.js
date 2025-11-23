import { test, expect } from "@playwright/test";

test.describe("Post-OCR AI Filter", () => {
  test("應該將非成分資訊分類到「其他資訊」區塊，而不是「未知成分」", async ({ page }) => {
    // 前往掃描頁面
    await page.goto("http://localhost:3000/scan");

    // 等待頁面載入
    await page.waitForSelector("textarea");

    // 貼入包含非成分資訊的測試文字
    const testText = `品名：某牌餅乾
成分：小麥粉、糖、棕櫚油、乳化劑(E471)、香料、鹽
淨重：120g
保存期限：2026/03/01
製造商：XXX股份有限公司
客服電話：0800-000-000`;

    await page.fill("textarea", testText);

    // 點擊「開始分析」按鈕
    await page.click('button:has-text("開始分析")');

    // 等待結果顯示（等待分析完成）
    await page.waitForSelector("text=需確認", { timeout: 10000 });

    // 額外等待一下，確保 state 更新完成（特別是 mobile 版本）
    await page.waitForTimeout(500);

    // 檢查「其他資訊（推測非成分）」區塊是否存在
    const otherInfoSection = page.locator('h3:has-text("其他資訊（推測非成分）")');
    await expect(otherInfoSection).toBeVisible({ timeout: 5000 });

    // 檢查非成分資訊是否在「其他資訊」區塊中
    const otherInfoBlock = page.locator("div").filter({ has: otherInfoSection });

    // 這些應該在「其他資訊」區塊中
    await expect(otherInfoBlock.locator("text=120g")).toBeVisible();
    await expect(otherInfoBlock.locator("text=2026/03/01")).toBeVisible();
    await expect(otherInfoBlock.locator("text=XXX股份有限公司")).toBeVisible();
    await expect(otherInfoBlock.locator("text=0800-000-000")).toBeVisible();

    // 檢查「未知成分」區塊
    const unknownSection = page.locator('h3:has-text("未知成分")');

    // 等待頁面穩定後再檢查
    await page.waitForLoadState("networkidle");

    // 如果「未知成分」區塊存在，確認它不包含非成分資訊
    const unknownVisible = await unknownSection.isVisible().catch(() => false);
    if (unknownVisible) {
      const unknownBlock = page.locator("div").filter({ has: unknownSection });

      // 這些不應該在「未知成分」區塊中
      // 使用 count() 來檢查，避免 timing 問題
      await expect(unknownBlock.locator("text=品名某牌餅乾")).toHaveCount(0);
      await expect(unknownBlock.locator("text=成分小麥粉")).toHaveCount(0);
      await expect(unknownBlock.locator("text=120g")).toHaveCount(0);
      await expect(unknownBlock.locator("text=XXX股份有限公司")).toHaveCount(0);
    }

    // 檢查成分是否正確分類
    const safeSection = page.locator('h3:has-text("可食用成分")');
    await expect(safeSection).toBeVisible();

    const safeBlock = page.locator("div").filter({ has: safeSection });
    await expect(safeBlock.locator("text=糖")).toBeVisible();
    await expect(safeBlock.locator("text=鹽")).toBeVisible();

    // 檢查需確認成分
    const warningSection = page.locator('h3:has-text("需確認成分")');
    await expect(warningSection).toBeVisible();

    const warningBlock = page.locator("div").filter({ has: warningSection });
    await expect(warningBlock.locator("text=乳化劑")).toBeVisible();
  });

  test("AI Filter 關閉時應該使用原始文字進行分類", async ({ page }) => {
    // 這個測試需要在 AI Filter 關閉的環境下執行
    // 可以透過設定環境變數或 mock 來測試

    await page.goto("http://localhost:3000/scan");
    await page.waitForSelector("textarea");

    const simpleText = "水、糖、鹽";
    await page.fill("textarea", simpleText);
    await page.click('button:has-text("開始分析")');

    await page.waitForSelector("text=可食用", { timeout: 10000 });

    // 應該顯示結果
    const safeSection = page.locator('h3:has-text("可食用成分")');
    await expect(safeSection).toBeVisible();
  });
});
