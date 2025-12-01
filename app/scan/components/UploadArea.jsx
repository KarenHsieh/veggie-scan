"use client";

import { useState, useRef } from "react";

export default function UploadArea({ onImageSelect, isProcessing }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onImageSelect(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      onImageSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragging ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400"}
        ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={isProcessing ? undefined : handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      <div className="space-y-4">
        <div className="text-6xl">📷</div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{isProcessing ? "處理中..." : "上傳成分表照片"}</h3>
          <p className="text-sm text-gray-500">點擊選擇檔案或拖曳圖片到此處</p>
          <p className="text-xs text-gray-400 mt-2">支援 JPG、PNG、WebP 格式，檔案大小限制 10MB</p>

          {/* 拍照建議 */}
          {!isProcessing && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <p className="text-xs font-semibold text-amber-900 mb-2">📸 拍照建議：</p>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• 確保文字清晰，避免模糊或反光</li>
                <li>• 文字太小可能導致辨識錯誤，建議放大拍攝</li>
                <li>• 在光線充足的環境下拍攝</li>
              </ul>
            </div>
          )}
        </div>

        {!isProcessing && (
          <button
            type="button"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            選擇圖片
          </button>
        )}
      </div>
    </div>
  );
}
