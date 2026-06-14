import type { NextRequest } from 'next/server'

type CloudflareRuntimeContext = {
  cf?: Record<string, any>
  env?: Record<string, any>
}

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    (request as any).ip ||
    '127.0.0.1'
  )
}

export function getRequestCloudflareMetadata(request: NextRequest) {
  const cf = (request as any).cf
  return cf && Object.keys(cf).length > 0 ? cf : null
}

export async function getCloudflareRuntimeContext(): Promise<CloudflareRuntimeContext> {
  if (process.env.OPSKITPRO_RUNTIME === 'node') return {}

  try {
    const cloudflare = await import('@opennextjs/cloudflare')
    return await cloudflare.getCloudflareContext()
  } catch {
    return {}
  }
}
