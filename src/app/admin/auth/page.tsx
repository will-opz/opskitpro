import { redirect } from 'next/navigation'

function normalizeNextPath(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value

  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/admin'
  if (next.startsWith('/api') || next.startsWith('/_next')) return '/admin'

  return next
}

export default function AdminAuthPage({
  searchParams,
}: {
  searchParams?: { next?: string | string[] }
}) {
  redirect(normalizeNextPath(searchParams?.next))
}
