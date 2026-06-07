'use client'

import Link from 'next/link'
import { ComponentProps } from 'react'

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  eventName: string
  pageName?: string
  targetName?: string
}

export function TrackedLink({ eventName, pageName, targetName, onClick, ...props }: TrackedLinkProps) {
  const trackEvent = () => {
    try {
      const payload = JSON.stringify({
        event: eventName,
        page: pageName || window.location.pathname,
        target: targetName
      })

      // Prefer sendBeacon for navigation tracking reliability
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/event', blob)
      } else {
        // Fallback to fetch with keepalive
        fetch('/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => null)
      }
    } catch {
      // Best effort, ignore errors
    }
  }

  return (
    <Link 
      {...props} 
      onClick={(e) => {
        trackEvent()
        if (onClick) onClick(e)
      }}
    />
  )
}
