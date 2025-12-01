/**
 * OCR API Route
 * 處理圖片上傳並執行 OCR（僅支援 Cloud Vision API）
 */

import { NextResponse } from "next/server";
import * as cloudVisionOCR from "../../../lib/ocr/cloudVision";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return NextResponse.json({ success: false, error: "未提供圖片" }, { status: 400 });
    }

    // 將圖片轉換為 Buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 執行 OCR
    const result = await cloudVisionOCR.extractTextFromImage(buffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error("OCR API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "OCR 處理失敗",
        text: "",
        rawText: "",
        confidence: 0,
      },
      { status: 500 }
    );
  }
}
