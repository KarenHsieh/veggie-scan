import { NextResponse } from 'next/server'

/**
 * Health Check API
 * 用於檢查服務是否正常運行
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VeggieScan API',
    version: '1.0.0'
  })
}
