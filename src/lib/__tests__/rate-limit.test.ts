import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, createRateLimitHeaders } from '../rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within limit', () => {
    const ip = '1.2.3.4';
    const route = '/api/test';
    
    // First request
    const r1 = checkRateLimit({ ip, route, costClass: 'LOW', limit: 2, windowSeconds: 60 });
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(1);
    
    // Second request
    const r2 = checkRateLimit({ ip, route, costClass: 'LOW', limit: 2, windowSeconds: 60 });
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(0);
  });

  it('blocks requests over limit', () => {
    const ip = '1.2.3.5';
    const route = '/api/test';
    
    checkRateLimit({ ip, route, costClass: 'LOW', limit: 1, windowSeconds: 60 });
    const r2 = checkRateLimit({ ip, route, costClass: 'LOW', limit: 1, windowSeconds: 60 });
    
    expect(r2.success).toBe(false);
    expect(r2.remaining).toBe(0);
    expect(r2.retryAfterSeconds).toBeGreaterThan(0);
    expect(r2.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('resets quota after window expires', () => {
    const ip = '1.2.3.6';
    const route = '/api/test';
    
    checkRateLimit({ ip, route, costClass: 'LOW', limit: 1, windowSeconds: 60 });
    
    // Move time forward past the window
    vi.advanceTimersByTime(60 * 1000 + 1);
    
    const r2 = checkRateLimit({ ip, route, costClass: 'LOW', limit: 1, windowSeconds: 60 });
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(0);
  });

  it('separates quotas by costClass and route', () => {
    const ip = '1.2.3.7';
    
    checkRateLimit({ ip, route: '/api/a', costClass: 'LOW', limit: 1, windowSeconds: 60 });
    
    // Different route, same class should be independent
    const rb = checkRateLimit({ ip, route: '/api/b', costClass: 'LOW', limit: 1, windowSeconds: 60 });
    expect(rb.success).toBe(true);
    
    // Same route, different class should be independent (though usually route uniquely maps to class)
    const rc = checkRateLimit({ ip, route: '/api/a', costClass: 'HIGH', limit: 1, windowSeconds: 60 });
    expect(rc.success).toBe(true);
  });

  it('separates quotas by IP', () => {
    const route = '/api/test';
    
    checkRateLimit({ ip: '1.2.3.8', route, costClass: 'LOW', limit: 1, windowSeconds: 60 });
    const r2 = checkRateLimit({ ip: '1.2.3.9', route, costClass: 'LOW', limit: 1, windowSeconds: 60 });
    expect(r2.success).toBe(true);
  });

  it('creates correct headers', () => {
    const ip = '1.2.3.10';
    const route = '/api/test';
    
    const r1 = checkRateLimit({ ip, route, costClass: 'LOW', limit: 2, windowSeconds: 60 });
    const h1 = createRateLimitHeaders(r1) as Record<string, string>;
    expect(h1['X-RateLimit-Limit']).toBe('2');
    expect(h1['X-RateLimit-Remaining']).toBe('1');
    expect(h1['Retry-After']).toBeUndefined();
    
    checkRateLimit({ ip, route, costClass: 'LOW', limit: 2, windowSeconds: 60 });
    const r3 = checkRateLimit({ ip, route, costClass: 'LOW', limit: 2, windowSeconds: 60 });
    const h3 = createRateLimitHeaders(r3) as Record<string, string>;
    expect(h3['X-RateLimit-Remaining']).toBe('0');
    expect(Number(h3['Retry-After'])).toBeGreaterThan(0);
  });
});
