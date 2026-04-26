import { model } from './gemini'

const OCR_PROMPT = `You are an OCR text extraction tool. Extract ALL text from this food packaging ingredient label image.

Rules:
- Extract the raw text exactly as it appears on the packaging
- Preserve the original language (Chinese, English, Japanese)
- Preserve special characters like （）、/ etc.
- Include ALL text visible in the ingredient/composition section
- Do NOT translate, interpret, or reorganize the text
- Do NOT add any commentary or explanation
- If you cannot read certain characters clearly, include your best guess
- Output ONLY the extracted text, nothing else`

export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/)
  let mimeType = 'image/jpeg'
  let base64Data = imageBase64

  if (mimeMatch) {
    mimeType = mimeMatch[1]
    base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  }

  const result = await model.generateContent([
    OCR_PROMPT,
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
  ])

  const response = result.response
  const text = response.text()

  if (!text.trim()) {
    throw new Error('OCR extraction returned empty text')
  }

  return text.trim()
}
