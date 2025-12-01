import { describe, it, expect } from "vitest";
import { normalizeIngredients } from "../../lib/text/normalize.js";
import { tokenizeWithECodes } from "../../lib/text/tokenize.js";
import { classify } from "../../lib/rules/classify.js";

describe("五辛成分判斷測試", () => {
  it("應該將大蒜標記為 warning", () => {
    const input = "水、糖、大蒜、鹽";
    const normalized = normalizeIngredients(input);
    const tokenData = tokenizeWithECodes(normalized);
    const result = classify(tokenData);

    // 大蒜應該在 warning 清單中
    const garlicItem = result.warning.find((item) => item.input === "大蒜");
    expect(garlicItem).toBeDefined();
    expect(garlicItem.item.category).toBe("五辛");
    expect(garlicItem.item.risk).toBe("medium");
  });

  it("應該將洋蔥標記為 warning", () => {
    const input = "水、糖、洋蔥、鹽";
    const normalized = normalizeIngredients(input);
    const tokenData = tokenizeWithECodes(normalized);
    const result = classify(tokenData);

    const onionItem = result.warning.find((item) => item.input === "洋蔥");
    expect(onionItem).toBeDefined();
    expect(onionItem.item.category).toBe("五辛");
    expect(onionItem.item.risk).toBe("medium");
  });

  it("應該將韭菜標記為 warning", () => {
    const input = "水、糖、韭菜、鹽";
    const normalized = normalizeIngredients(input);
    const tokenData = tokenizeWithECodes(normalized);
    const result = classify(tokenData);

    const chiveItem = result.warning.find((item) => item.input === "韭菜");
    expect(chiveItem).toBeDefined();
    expect(chiveItem.item.category).toBe("五辛");
    expect(chiveItem.item.risk).toBe("medium");
  });

  it("應該將蔥標記為 warning", () => {
    const input = "水、糖、蔥、鹽";
    const normalized = normalizeIngredients(input);
    const tokenData = tokenizeWithECodes(normalized);
    const result = classify(tokenData);

    const scallionItem = result.warning.find((item) => item.input === "蔥");
    expect(scallionItem).toBeDefined();
    expect(scallionItem.item.category).toBe("五辛");
    expect(scallionItem.item.risk).toBe("medium");
  });

  it("應該將蒜粉標記為 warning", () => {
    const input = "水、糖、蒜粉、鹽";
    const normalized = normalizeIngredients(input);
    const tokenData = tokenizeWithECodes(normalized);
    const result = classify(tokenData);

    const garlicPowderItem = result.warning.find((item) => item.input === "蒜粉");
    expect(garlicPowderItem).toBeDefined();
    expect(garlicPowderItem.item.category).toBe("五辛");
  });

  it("應該將洋蔥粉標記為 warning", () => {
    const input = "水、糖、洋蔥粉、鹽";
    const normalized = normalizeIngredients(input);
    const tokenData = tokenizeWithECodes(normalized);
    const result = classify(tokenData);

    const onionPowderItem = result.warning.find((item) => item.input === "洋蔥粉");
    expect(onionPowderItem).toBeDefined();
    expect(onionPowderItem.item.category).toBe("五辛");
  });

  it("應該識別五辛的別名", () => {
    const testCases = [
      { input: "蒜頭", expected: "大蒜" },
      { input: "青蔥", expected: "蔥" },
      { input: "蔥花", expected: "蔥" },
      { input: "韭黃", expected: "韭菜" },
    ];

    testCases.forEach(({ input, expected }) => {
      const normalized = normalizeIngredients(input);
      const tokenData = tokenizeWithECodes(normalized);
      const result = classify(tokenData);

      const item = result.warning.find((item) => item.item.name === expected);
      expect(item).toBeDefined();
      expect(item.item.category).toBe("五辛");
    });
  });

  it("應該在含有五辛成分時給予 warning 判斷", () => {
    const input = "水、糖、大蒜、洋蔥、韭菜、蔥、鹽";
    const normalized = normalizeIngredients(input);
    const tokenData = tokenizeWithECodes(normalized);
    const result = classify(tokenData);

    // 應該有 4 個五辛成分在 warning 清單中
    const fivePungentItems = result.warning.filter((item) => item.item.category === "五辛");
    expect(fivePungentItems.length).toBe(4);
  });
});
