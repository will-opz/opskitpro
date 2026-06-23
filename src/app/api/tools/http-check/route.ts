import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-response'
import { checkRateLimit, isValidUrl } from '@/lib/validators'
import { performHttpCheck } from '@/lib/tools/http'
import { getClientIp } from '@/lib/runtime-context'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const ip = getClientIp(request)
  
  if (!checkRateLimit(ip)) {
    return errorResponse({
      tool: 'http-check',
      input: {},
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      status: 429,
      startTime
    })
  }

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return errorResponse({
      tool: 'http-check',
      input: { url: null },
      code: 'MISSING_PARAM',
      message: 'The "url" parameter is required.',
      status: 400,
      startTime
    })
  }

  if (!isValidUrl(url)) {
    return errorResponse({
      tool: 'http-check',
      input: { url },
      code: 'INVALID_URL',
      message: 'Invalid URL format. Must start with http:// or https://',
      status: 400,
      startTime
    })
  }

  try {
    const result = await performHttpCheck(url)
    return successResponse({
      tool: 'http-check',
      input: { url },
      result,
      startTime
    })
  } catch (error: any) {
    // Determine if it was an SSRF security block or a normal fetch failure
    const isSecurityError = error.message.includes('Security Exception')
    return errorResponse({
      tool: 'http-check',
      input: { url },
      code: isSecurityError ? 'SECURITY_BLOCKED' : 'FETCH_FAILED',
      message: error.message || 'HTTP request failed.',
      status: isSecurityError ? 403 : 500,
      startTime
    })
  }
}
