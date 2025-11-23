/**
 * 防禦性過濾：移除明顯的非成分前綴
 * 用於在前端額外過濾 AI 可能誤判的非成分項目
 */

const NON_INGREDIENT_PREFIXES = [
  "品名",
  "產品",
  "商品",
  "名稱",
  "成分",
  "原料",
  "配料",
  "淨重",
  "重量",
  "容量",
  "內容量",
  "保存期限",
  "有效日期",
  "製造日期",
  "製造商",
  "公司",
  "廠商",
  "出品",
  "客服",
  "電話",
  "地址",
  "條碼",
];

/**
 * 檢查文字是否包含非成分前綴
 * @param {string} text - 要檢查的文字
 * @returns {boolean} 是否包含非成分前綴
 */
export function hasNonIngredientPrefix(text) {
  if (!text || typeof text !== "string") return false;

  return NON_INGREDIENT_PREFIXES.some(
    (prefix) => text.includes(prefix + "：") || text.includes(prefix + ":") || text.startsWith(prefix)
  );
}

/**
 * 過濾 extracted 陣列，移除包含非成分前綴的項目
 * @param {string[]} extracted - AI 回傳的成分陣列
 * @returns {{ ingredients: string[], nonIngredients: string[] }}
 */
export function filterExtractedIngredients(extracted) {
  if (!Array.isArray(extracted)) {
    return { ingredients: [], nonIngredients: [] };
  }

  const ingredients = [];
  const nonIngredients = [];

  for (const item of extracted) {
    if (!item || !item.trim()) continue;

    if (hasNonIngredientPrefix(item)) {
      nonIngredients.push(item);
    } else {
      ingredients.push(item);
    }
  }

  return { ingredients, nonIngredients };
}
