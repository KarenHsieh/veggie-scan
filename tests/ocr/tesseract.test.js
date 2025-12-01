import { describe, it, expect } from "vitest";
import { validateImageFile, cleanOCRText } from "../../lib/ocr/index.js";

describe("validateImageFile", () => {
  it("應該接受有效的圖片格式", () => {
    const validFile = new File([""], "test.jpg", { type: "image/jpeg" });
    const result = validateImageFile(validFile);
    expect(result.valid).toBe(true);
  });

  it("應該接受 PNG 格式", () => {
    const validFile = new File([""], "test.png", { type: "image/png" });
    const result = validateImageFile(validFile);
    expect(result.valid).toBe(true);
  });

  it("應該接受 WebP 格式", () => {
    const validFile = new File([""], "test.webp", { type: "image/webp" });
    const result = validateImageFile(validFile);
    expect(result.valid).toBe(true);
  });

  it("應該拒絕不支援的格式", () => {
    const invalidFile = new File([""], "test.gif", { type: "image/gif" });
    const result = validateImageFile(invalidFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("不支援的圖片格式");
  });

  it("應該拒絕過大的檔案", () => {
    // 建立一個 11MB 的模擬檔案
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });
    const result = validateImageFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("圖片檔案過大");
  });

  it("應該接受小於 10MB 的檔案", () => {
    // 建立一個 5MB 的模擬檔案
    const validFile = new File([new ArrayBuffer(5 * 1024 * 1024)], "valid.jpg", {
      type: "image/jpeg",
    });
    const result = validateImageFile(validFile);
    expect(result.valid).toBe(true);
  });
});

describe("cleanOCRText", () => {
  it("應該移除中文字之間的空白", () => {
    const input = "品 名 : 濕 尾 漁家";
    const expected = "品名:濕尾漁家";
    expect(cleanOCRText(input)).toBe(expected);
  });

  it("應該處理你的範例文字", () => {
    const input = "品 名 : 濕 尾 漁家 - 烤 玉米";
    const expected = "品名:濕尾漁家-烤玉米";
    expect(cleanOCRText(input)).toBe(expected);
  });

  it("應該移除成分列表中的空白", () => {
    const input = "成 分 : 玉 米 ( 非 基 因 改 造 )、 榨 欄 油";
    const expected = "成分:玉米(非基因改造)、榨欄油";
    expect(cleanOCRText(input)).toBe(expected);
  });

  it("應該處理複雜的成分文字", () => {
    const input = "L- 麩 酸 鈉 、 醬 油 、 糊 精 、 食 鹽";
    const expected = "L-麩酸鈉、醬油、糊精、食鹽";
    expect(cleanOCRText(input)).toBe(expected);
  });

  it("應該保留英文單字之間的空白", () => {
    const input = "Mono  and  Diglycerides";
    const expected = "Mono and Diglycerides";
    expect(cleanOCRText(input)).toBe(expected);
  });

  it("應該移除多餘的連續空白", () => {
    const input = "水    糖    鹽";
    const expected = "水糖鹽";
    expect(cleanOCRText(input)).toBe(expected);
  });

  it("應該移除行首行尾空白", () => {
    const input = "  水、糖、鹽  ";
    const expected = "水、糖、鹽";
    expect(cleanOCRText(input)).toBe(expected);
  });

  it("應該處理多行文字", () => {
    const input = "品 名 : 測試\n成 分 : 水 、 糖";
    const expected = "品名:測試\n成分:水、糖";
    expect(cleanOCRText(input)).toBe(expected);
  });

  it("應該處理空字串", () => {
    expect(cleanOCRText("")).toBe("");
    expect(cleanOCRText(null)).toBe("");
    expect(cleanOCRText(undefined)).toBe("");
  });
});
