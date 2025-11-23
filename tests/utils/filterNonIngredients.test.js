import { describe, it, expect } from "vitest";
import { hasNonIngredientPrefix, filterExtractedIngredients } from "../../lib/utils/filterNonIngredients";

describe("hasNonIngredientPrefix", () => {
  it("應該識別「品名：」前綴", () => {
    expect(hasNonIngredientPrefix("品名：某牌餅乾")).toBe(true);
    expect(hasNonIngredientPrefix("品名:某牌餅乾")).toBe(true);
  });

  it("應該識別「成分：」前綴", () => {
    expect(hasNonIngredientPrefix("成分：小麥粉")).toBe(true);
    expect(hasNonIngredientPrefix("成分:小麥粉")).toBe(true);
  });

  it("應該識別「淨重：」前綴", () => {
    expect(hasNonIngredientPrefix("淨重：120g")).toBe(true);
    expect(hasNonIngredientPrefix("淨重:120g")).toBe(true);
  });

  it("應該識別「保存期限：」前綴", () => {
    expect(hasNonIngredientPrefix("保存期限：2026/03/01")).toBe(true);
  });

  it("應該識別「製造商：」前綴", () => {
    expect(hasNonIngredientPrefix("製造商：XXX股份有限公司")).toBe(true);
  });

  it("應該識別「客服：」前綴", () => {
    expect(hasNonIngredientPrefix("客服：0800-000-000")).toBe(true);
    expect(hasNonIngredientPrefix("客服電話：0800-000-000")).toBe(true);
  });

  it("應該識別以前綴開頭的文字（無冒號）", () => {
    expect(hasNonIngredientPrefix("品名某牌餅乾")).toBe(true);
    expect(hasNonIngredientPrefix("公司名稱")).toBe(true);
  });

  it("純成分名稱不應該被識別為非成分", () => {
    expect(hasNonIngredientPrefix("小麥粉")).toBe(false);
    expect(hasNonIngredientPrefix("糖")).toBe(false);
    expect(hasNonIngredientPrefix("鹽")).toBe(false);
    expect(hasNonIngredientPrefix("水")).toBe(false);
    expect(hasNonIngredientPrefix("乳化劑(E471)")).toBe(false);
  });

  it("應該處理空值和無效輸入", () => {
    expect(hasNonIngredientPrefix("")).toBe(false);
    expect(hasNonIngredientPrefix(null)).toBe(false);
    expect(hasNonIngredientPrefix(undefined)).toBe(false);
  });

  it("包含前綴關鍵字但不在開頭的成分名稱不應該被誤判", () => {
    // 「品」字在成分名稱中但不是「品名」前綴
    expect(hasNonIngredientPrefix("調味品")).toBe(false);
    expect(hasNonIngredientPrefix("食品添加物")).toBe(false);
  });
});

describe("filterExtractedIngredients", () => {
  it("應該正確分離成分和非成分", () => {
    const extracted = [
      "品名：某牌餅乾",
      "小麥粉",
      "糖",
      "淨重：120g",
      "棕櫚油",
      "保存期限：2026/03/01",
      "乳化劑(E471)",
      "製造商：XXX股份有限公司",
      "香料",
      "鹽",
    ];

    const result = filterExtractedIngredients(extracted);

    expect(result.ingredients).toEqual(["小麥粉", "糖", "棕櫚油", "乳化劑(E471)", "香料", "鹽"]);

    expect(result.nonIngredients).toEqual([
      "品名：某牌餅乾",
      "淨重：120g",
      "保存期限：2026/03/01",
      "製造商：XXX股份有限公司",
    ]);
  });

  it("當所有項目都是成分時應該回傳空的 nonIngredients", () => {
    const extracted = ["水", "糖", "鹽"];
    const result = filterExtractedIngredients(extracted);

    expect(result.ingredients).toEqual(["水", "糖", "鹽"]);
    expect(result.nonIngredients).toEqual([]);
  });

  it("當所有項目都是非成分時應該回傳空的 ingredients", () => {
    const extracted = ["品名：測試產品", "淨重：100g", "製造商：測試公司"];
    const result = filterExtractedIngredients(extracted);

    expect(result.ingredients).toEqual([]);
    expect(result.nonIngredients).toEqual(["品名：測試產品", "淨重：100g", "製造商：測試公司"]);
  });

  it("應該過濾掉空字串和空白項目", () => {
    const extracted = ["水", "", "  ", "糖", null, undefined, "鹽"];
    const result = filterExtractedIngredients(extracted);

    expect(result.ingredients).toEqual(["水", "糖", "鹽"]);
    expect(result.nonIngredients).toEqual([]);
  });

  it("應該處理空陣列", () => {
    const result = filterExtractedIngredients([]);

    expect(result.ingredients).toEqual([]);
    expect(result.nonIngredients).toEqual([]);
  });

  it("應該處理無效輸入", () => {
    expect(filterExtractedIngredients(null)).toEqual({
      ingredients: [],
      nonIngredients: [],
    });

    expect(filterExtractedIngredients(undefined)).toEqual({
      ingredients: [],
      nonIngredients: [],
    });

    expect(filterExtractedIngredients("not an array")).toEqual({
      ingredients: [],
      nonIngredients: [],
    });
  });

  it("應該處理混合中英文的前綴", () => {
    const extracted = ["成分:小麥粉", "Ingredients: Wheat flour", "糖", "客服電話：0800-000-000"];
    const result = filterExtractedIngredients(extracted);

    // 中文前綴應該被識別
    expect(result.nonIngredients).toContain("成分:小麥粉");
    expect(result.nonIngredients).toContain("客服電話：0800-000-000");

    // 純成分應該保留
    expect(result.ingredients).toContain("糖");

    // 英文前綴目前不在清單中，會被當成成分（可以之後擴充）
    expect(result.ingredients).toContain("Ingredients: Wheat flour");
  });
});

describe("filterExtractedIngredients - 實際案例", () => {
  it("應該正確處理完整的產品標籤文字", () => {
    const extracted = [
      "品名：某牌餅乾",
      "成分：小麥粉、糖、棕櫚油、乳化劑(E471)、香料、鹽",
      "淨重：120g",
      "保存期限：2026/03/01",
      "製造商：XXX股份有限公司",
      "客服電話：0800-000-000",
    ];

    const result = filterExtractedIngredients(extracted);

    // 所有包裝資訊都應該被識別為非成分
    expect(result.nonIngredients).toHaveLength(6);

    // 注意：「成分：小麥粉、糖...」這整行也會被識別為非成分
    // 因為它有「成分：」前綴，這是預期行為
    // AI 應該要把成分拆開，而不是整行回傳
    expect(result.nonIngredients).toContain("成分：小麥粉、糖、棕櫚油、乳化劑(E471)、香料、鹽");
  });

  it("應該處理 AI 正確拆分的成分清單", () => {
    const extracted = [
      "品名：某牌餅乾",
      "小麥粉",
      "糖",
      "棕櫚油",
      "乳化劑(E471)",
      "香料",
      "鹽",
      "淨重：120g",
      "保存期限：2026/03/01",
      "製造商：XXX股份有限公司",
      "客服電話：0800-000-000",
    ];

    const result = filterExtractedIngredients(extracted);

    expect(result.ingredients).toEqual(["小麥粉", "糖", "棕櫚油", "乳化劑(E471)", "香料", "鹽"]);

    expect(result.nonIngredients).toEqual([
      "品名：某牌餅乾",
      "淨重：120g",
      "保存期限：2026/03/01",
      "製造商：XXX股份有限公司",
      "客服電話：0800-000-000",
    ]);
  });
});
