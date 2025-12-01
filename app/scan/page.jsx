"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import UploadArea from "./components/UploadArea";
import ResultCard from "./components/ResultCard";
import { extractTextFromImage, validateImageFile, fileToDataURL } from "../../lib/ocr/tesseract";
import { addHistory } from "../../lib/storage/history";
import { filterExtractedIngredients } from "../../lib/utils/filterNonIngredients";

const AI_FILTER_ENABLED = process.env.NEXT_PUBLIC_AI_FILTER_ENABLED === "true";

function ScanPageContent() {
  const searchParams = useSearchParams();
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [nonIngredients, setNonIngredients] = useState([]);

  // 從 URL 參數載入文字（從歷史記錄重新分析）
  useEffect(() => {
    const text = searchParams.get("text");
    if (text) {
      setInputText(decodeURIComponent(text));
    }
  }, [searchParams]);

  const handleImageSelect = async (file) => {
    // 驗證圖片
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);
    setIsOCRProcessing(true);
    setOcrProgress(0);

    try {
      // 轉換為 Data URL 用於預覽
      const dataURL = await fileToDataURL(file);
      setUploadedImage(dataURL);

      // 執行 OCR
      const ocrResult = await extractTextFromImage(file, {
        onProgress: (progress) => {
          setOcrProgress(progress);
        },
      });

      if (ocrResult.success) {
        setInputText(ocrResult.text);
        setError(null);
      } else {
        setError(ocrResult.error || "OCR 辨識失敗，請嘗試手動輸入");
      }
    } catch (err) {
      setError("圖片處理失敗，請稍後再試");
      console.error("OCR error:", err);
    } finally {
      setIsOCRProcessing(false);
      setOcrProgress(0);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setInputText("");
    setUploadedImage(null);
    setNonIngredients([]);
  };

  const handleTextAnalysis = async () => {
    if (!inputText.trim()) {
      alert("請輸入或貼上成分文字");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setNonIngredients([]);

    try {
      let textToClassify = inputText;

      // Post-OCR Filter（可由環境變數關閉）
      if (AI_FILTER_ENABLED) {
        try {
          const filterResponse = await fetch("/api/filter-ingredients", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ocrText: inputText,
              locale: "zh",
            }),
          });

          if (filterResponse.ok) {
            const filterData = await filterResponse.json();

            // 使用工具函數進行防禦性過濾：移除明顯的非成分前綴
            const { ingredients, nonIngredients: filteredNonIngredients } = filterExtractedIngredients(
              filterData.extracted || []
            );

            if (ingredients.length > 0) {
              // 由 AI 明確標記的成分清單，作為唯一的分類輸入
              textToClassify = ingredients.join("、");
            } else if (filterData.ingredientsText && filterData.ingredientsText.trim()) {
              // 若沒有 extracted，但仍有 ingredientsText，則退回使用整段成分文字
              textToClassify = filterData.ingredientsText;
            }

            // 合併 AI 回傳的非成分示例和前端過濾出的非成分項目
            setNonIngredients([...(filterData.nonIngredientsExamples || []), ...filteredNonIngredients]);
          }
        } catch (err) {
          console.error("AI filter error:", err);
          // 發生錯誤時直接使用原始文字，並清空非成分資訊
          setNonIngredients([]);
        }
      }

      const response = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textToClassify }),
      });

      const data = await response.json();

      if (data.status === "ok") {
        setResult(data);
        // 儲存到歷史記錄
        addHistory({
          text: textToClassify,
          result: data,
        });
      } else {
        setError(data.message || "分析失敗");
      }
    } catch (err) {
      setError("網路錯誤，請稍後再試");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            🥬 VeggieScan
          </Link>
          <Link href="/history" className="text-gray-600 hover:text-primary-600 transition-colors">
            查看歷史
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">掃描食品成分</h1>
            <p className="text-gray-600">上傳照片或直接貼上成分文字</p>
          </div>

          {/* Upload Area */}
          {!result && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="space-y-6">
                {/* Image Upload */}
                <UploadArea onImageSelect={handleImageSelect} isProcessing={isOCRProcessing} />

                {/* OCR Progress */}
                {isOCRProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">辨識中...</span>
                      <span className="text-primary-600 font-semibold">{Math.round(ocrProgress * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${ocrProgress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Uploaded Image Preview */}
                {uploadedImage && !isOCRProcessing && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">已上傳圖片：</p>
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="max-h-48 mx-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">或</span>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">直接貼上成分文字</label>

                {/* OCR 完成後的檢查提示 */}
                {uploadedImage && inputText && !isOCRProcessing && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-900 mb-2">✏️ 請檢查辨識結果：</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• 檢查是否有因換行導致的斷字（如：「玉米」被斷成「玉」「米」）</li>
                      <li>• 移除多餘的符號（如：*、#、-）以提高辨識準確度</li>
                      <li>• 確認所有成分都已正確辨識，可手動補充遺漏的成分</li>
                    </ul>
                  </div>
                )}

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="例如：水、糖、小麥粉、植物油、食鹽、乳化劑(E471)..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={handleTextAnalysis}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? "分析中..." : "開始分析"}
                </button>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <ResultCard result={result} inputText={inputText} onReset={handleReset} nonIngredients={nonIngredients} />
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Info Card */}
          {!result && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">💡</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">使用提示</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 請確保照片清晰，成分表文字可辨識</li>
                    <li>• 支援中文與英文成分辨識</li>
                    <li>• 若 OCR 辨識失敗，可直接貼上文字</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      }
    >
      <ScanPageContent />
    </Suspense>
  );
}
