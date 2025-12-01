import { describe, it, expect } from "vitest";
import { normalizeIngredients } from "../../lib/text/normalize.js";
import { tokenizeWithECodes } from "../../lib/text/tokenize.js";

describe("成分分隔符號測試", () => {
  it("應該正確處理句號分隔的成分", () => {
    const input = "扇貝唇.砂糖.食鹽.還原水飴.醬油.釀造醋";
    const normalized = normalizeIngredients(input);
    const result = tokenizeWithECodes(normalized);

    expect(result.tokens).toContain("扇貝唇");
    expect(result.tokens).toContain("砂糖");
    expect(result.tokens).toContain("食鹽");
    expect(result.tokens).toContain("還原水飴");
    expect(result.tokens).toContain("醬油");
    expect(result.tokens).toContain("釀造醋");
  });

  it("應該保留化學名稱中的連字號", () => {
    const input = "D-山梨醇液.L-麩酸鈉.DL-蘋果酸";
    const normalized = normalizeIngredients(input);
    const result = tokenizeWithECodes(normalized);

    expect(result.tokens).toContain("d-山梨醇液");
    expect(result.tokens).toContain("l-麩酸鈉");
    expect(result.tokens).toContain("dl-蘋果酸");
  });

  it("應該處理複雜的成分列表（你的範例）", () => {
    const input = `日本干貝唇
內容物:扇貝唇.砂糖.食鹽.還原水飴.醬油.釀造醋
發酵調味料(米麴.食鹽).麥芽糊精.D-山梨醇液
70%(甜味劑).醋酸鈉.檸檬酸.DL-蘋果酸.調味劑
(L-麩酸鈉、DL-胺基丙酸.DL-蘋果酸鈉.琥珀酸二
鈉.5'-次黃嘌呤核苷磷酸二鈉+5'-鳥嘌呤核苷磷
酸二鈉).磷酸鈉.甜菊醣苷(甜味劑).己二烯酸鉀(防
腐劑)`;

    const normalized = normalizeIngredients(input);
    const result = tokenizeWithECodes(normalized);

    // 檢查關鍵成分是否被正確分割
    expect(result.tokens).toContain("扇貝唇");
    expect(result.tokens).toContain("砂糖");
    expect(result.tokens).toContain("d-山梨醇液");
    expect(result.tokens).toContain("l-麩酸鈉");
    expect(result.tokens).toContain("dl-蘋果酸");
    expect(result.tokens).toContain("醋酸鈉");
    expect(result.tokens).toContain("檸檬酸");
    expect(result.tokens).toContain("磷酸鈉");

    // 確保不會有被錯誤合併的成分
    expect(result.tokens).not.toContain("d-山梨醇液70%");
    expect(result.tokens).not.toContain("醋酸鈉檸檬酸");
  });

  it("應該處理逗號分隔的成分", () => {
    const input = "水,糖,鹽,油";
    const normalized = normalizeIngredients(input);
    const result = tokenizeWithECodes(normalized);

    expect(result.tokens).toContain("水");
    expect(result.tokens).toContain("糖");
    expect(result.tokens).toContain("鹽");
    expect(result.tokens).toContain("油");
  });

  it("應該處理頓號分隔的成分", () => {
    const input = "水、糖、鹽、油";
    const normalized = normalizeIngredients(input);
    const result = tokenizeWithECodes(normalized);

    expect(result.tokens).toContain("水");
    expect(result.tokens).toContain("糖");
    expect(result.tokens).toContain("鹽");
    expect(result.tokens).toContain("油");
  });

  it("應該處理混合分隔符號", () => {
    const input = "水.糖,鹽、油;醋";
    const normalized = normalizeIngredients(input);
    const result = tokenizeWithECodes(normalized);

    expect(result.tokens).toContain("水");
    expect(result.tokens).toContain("糖");
    expect(result.tokens).toContain("鹽");
    expect(result.tokens).toContain("油");
    expect(result.tokens).toContain("醋");
  });

  it("應該處理加號連接的成分", () => {
    const input = "5'-次黃嘌呤核苷磷酸二鈉+5'-鳥嘌呤核苷磷酸二鈉";
    const normalized = normalizeIngredients(input);
    const result = tokenizeWithECodes(normalized);

    // 加號應該被保留在成分名稱中
    expect(result.tokens.some((t) => t.includes("+"))).toBe(true);
  });
});
