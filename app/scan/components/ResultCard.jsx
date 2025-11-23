"use client";

import { useState } from "react";

export default function ResultCard({ result, inputText, onReset, nonIngredients = [] }) {
  const [copied, setCopied] = useState(false);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(inputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("複製失敗:", err);
      alert("複製失敗，請手動複製");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* 主要結果 */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{result.explanation.icon}</div>
        <h2 className="text-2xl font-bold mb-2">{result.explanation.title}</h2>
        <p className="text-gray-600">{result.summary}</p>
      </div>

      {/* 詳細成分列表 */}
      <div className="space-y-4 mb-6">
        {/* 不可食用成分 */}
        {result.explanation.details.danger.length > 0 && (
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-red-700 mb-2">❌ 不可食用成分</h3>
            <ul className="space-y-2">
              {result.explanation.details.danger.map((item, idx) => (
                <li key={idx} className="text-sm">
                  <span className="font-medium">{item.displayName}</span>
                  <span className="text-gray-600"> - {item.reason}</span>
                  {item.notes && <div className="text-xs text-gray-500 mt-1">備註：{item.notes}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 需確認成分 */}
        {result.explanation.details.warning.length > 0 && (
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-yellow-700 mb-2">⚠️ 需確認成分</h3>
            <ul className="space-y-2">
              {result.explanation.details.warning.map((item, idx) => (
                <li key={idx} className="text-sm">
                  <span className="font-medium">{item.displayName}</span>
                  <span className="text-gray-600"> - {item.reason}</span>
                  {item.notes && <div className="text-xs text-gray-500 mt-1">備註：{item.notes}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 未知成分 */}
        {result.explanation.details.unknown.length > 0 && (
          <div className="border-l-4 border-gray-500 pl-4">
            <h3 className="font-semibold text-gray-700 mb-2">❓ 未知成分</h3>
            <ul className="space-y-2">
              {result.explanation.details.unknown.map((item, idx) => (
                <li key={idx} className="text-sm">
                  <span className="font-medium">{item.displayName}</span>
                  <span className="text-gray-600"> - {item.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 可食用成分 */}
        {result.explanation.details.safe.length > 0 && (
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-green-700 mb-2">✅ 可食用成分</h3>
            <ul className="space-y-2">
              {result.explanation.details.safe.map((item, idx) => (
                <li key={idx} className="text-sm">
                  <span className="font-medium">{item.displayName}</span>
                  <span className="text-gray-600"> - {item.reason}</span>
                  {item.notes && <div className="text-xs text-gray-500 mt-1">備註：{item.notes}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* 其他資訊（推測非成分） */}
        {nonIngredients && nonIngredients.length > 0 && (
          <div className="border-l-4 border-blue-400 pl-4">
            <h3 className="font-semibold text-blue-700 mb-2">📄 其他資訊（推測非成分）</h3>
            <ul className="space-y-1">
              {nonIngredients.map((text, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          再掃一次
        </button>
        <button
          onClick={handleCopyText}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
        >
          {copied ? "✓ 已複製" : "複製文字"}
        </button>
      </div>
    </div>
  );
}
