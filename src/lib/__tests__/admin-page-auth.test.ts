// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ identity: vi.fn(), locale: 'en', headers: new Headers() }));
vi.mock('@/lib/admin-auth', () => ({ getAdminIdentity: state.identity }));
vi.mock('next/headers', () => ({ headers: async () => state.headers, cookies: async () => ({ get: () => ({ value: state.locale }) }) }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
import { requireAdminIdentity } from '@/lib/admin-page-auth';
beforeEach(() => { state.locale='en'; state.identity.mockReset(); });
describe('administrator page boundary', () => {
  it.each(['en','zh'])('rejects unauthenticated page access with %s navigation', async lang => {
    state.locale=lang; state.identity.mockResolvedValue({ authenticated:false,email:'',provider:null });
    await expect(requireAdminIdentity()).rejects.toThrow(`REDIRECT:/${lang}/nav?admin=1`);
  });
  it('returns only the verified identity', async () => {
    const value={authenticated:true,email:'admin@example.com',provider:'cloudflare_access'};
    state.identity.mockResolvedValue(value);
    expect(await requireAdminIdentity()).toEqual(value);
    expect(state.identity).toHaveBeenCalledWith(state.headers);
  });
});
