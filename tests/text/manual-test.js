#!/usr/bin/env node

/**
 * 手動測試腳本
 * 用於快速驗證 tokenize 功能
 */

import { normalizeIngredients } from "../../lib/text/normalize.js";
import { tokenizeWithECodes } from "../../lib/text/tokenize.js";

function test(name, input, expectedTokens) {
  console.log(`\n🧪 Test: ${name}`);
  console.log(`Input: ${input}`);

  const normalized = normalizeIngredients(input);
  const result = tokenizeWithECodes(normalized);

  console.log(`Tokens: [${result.tokens.join(", ")}]`);

  let pass = true;
  for (const expected of expectedTokens) {
    if (!result.tokens.includes(expected)) {
      console.log(`❌ Missing: ${expected}`);
      pass = false;
    }
  }

  if (pass) {
    console.log("✅ PASS");
  } else {
    console.log("❌ FAIL");
  }

  return pass;
}

console.log("=".repeat(60));
console.log("Tokenize Separator Tests");
console.log("=".repeat(60));

let allPass = true;

allPass &= test("句號分隔", "扇貝唇.砂糖.食鹽.還原水飴.醬油.釀造醋", [
  "扇貝唇",
  "砂糖",
  "食鹽",
  "還原水飴",
  "醬油",
  "釀造醋",
]);

allPass &= test("化學名稱連字號", "D-山梨醇液.L-麩酸鈉.DL-蘋果酸", ["d-山梨醇液", "l-麩酸鈉", "dl-蘋果酸"]);

allPass &= test("逗號分隔", "水,糖,鹽,油", ["水", "糖", "鹽", "油"]);

allPass &= test("頓號分隔", "水、糖、鹽、油", ["水", "糖", "鹽", "油"]);

allPass &= test("混合分隔符號", "水.糖,鹽、油;醋", ["水", "糖", "鹽", "油", "醋"]);

console.log("\n" + "=".repeat(60));
if (allPass) {
  console.log("✅ All tests passed!");
} else {
  console.log("❌ Some tests failed");
  process.exit(1);
}
