/**
 * AI 成分判斷結果暫存模組
 * 將 AI 判斷過的成分結果暫存，避免重複呼叫 API
 */

import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_FILE = path.join(CACHE_DIR, "ai-ingredient-judge.json");

/**
 * 確保 cache 目錄存在
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * 讀取暫存檔案
 * @returns {object} 暫存的判斷結果 { [ingredientName]: judgeResult }
 */
export function loadCache() {
  try {
    ensureCacheDir();
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("[AI Judge Cache] Failed to load cache:", err.message);
  }
  return {};
}

/**
 * 儲存暫存檔案
 * @param {object} cache - 暫存資料
 */
export function saveCache(cache) {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (err) {
    console.error("[AI Judge Cache] Failed to save cache:", err.message);
  }
}

/**
 * 從暫存中取得成分判斷結果
 * @param {string} ingredientName - 成分名稱
 * @returns {object|null} 判斷結果或 null
 */
export function getCachedJudge(ingredientName) {
  const cache = loadCache();
  const normalized = ingredientName.trim().toLowerCase();
  return cache[normalized] || null;
}

/**
 * 將成分判斷結果存入暫存
 * @param {string} ingredientName - 成分名稱
 * @param {object} judgeResult - 判斷結果
 */
export function setCachedJudge(ingredientName, judgeResult) {
  const cache = loadCache();
  const normalized = ingredientName.trim().toLowerCase();

  cache[normalized] = {
    ...judgeResult,
    cachedAt: new Date().toISOString(),
  };

  saveCache(cache);
}

/**
 * 清除暫存
 */
export function clearCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
  } catch (err) {
    console.error("[AI Judge Cache] Failed to clear cache:", err.message);
  }
}

export default {
  loadCache,
  saveCache,
  getCachedJudge,
  setCachedJudge,
  clearCache,
};
