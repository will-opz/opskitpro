import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionProvider, useAdminSession } from './AdminSessionProvider';
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
const anonymous = { authenticated: false, configured: true, passwordConfigured: false, accessConfigured: true };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
function Trigger() {
  const session = useAdminSession();
  return <><button onClick={() => session.openLogin('/en/nav?admin=1')}>Open</button><output>{session.authenticated ? 'authenticated' : 'anonymous'}</output></>;
}
function mount() { render(<AdminSessionProvider lang="en"><Trigger /></AdminSessionProvider>); fireEvent.click(screen.getByText('Open')); }
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('administrator session recovery', () => {
  it.each(['network', 'html', '503', 'malformed', 'missing-identity'])('offers retry without treating %s as authentication', async failure => {
    const fetch = vi.fn().mockImplementationOnce(() => failure === 'network' ? Promise.reject(new TypeError('offline')) : Promise.resolve(failure === 'html' ? new Response('<h1>Challenge</h1>', { status: 403 }) : failure === '503' ? json({}, 503) : json(failure === 'missing-identity' ? { authenticated: true, configured: true } : { authenticated: 'yes' }))).mockResolvedValueOnce(json({ ...anonymous, configured: false, accessConfigured: false }));
    vi.stubGlobal('fetch', fetch); mount();
    await screen.findByRole('alert');
    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Cloudflare/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    await screen.findByText('Admin sign-in is not configured.');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('ignores a late response from a dismissed request after reopening', async () => {
    let resolve!: (r: Response) => void;
    const fetch = vi.fn().mockReturnValueOnce(new Promise<Response>(r => { resolve = r; })).mockResolvedValueOnce(json(anonymous));
    vi.stubGlobal('fetch', fetch); mount();
    expect(screen.getByRole('dialog')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    fireEvent.click(screen.getByText('Open'));
    await screen.findByRole('button', { name: /Continue with Cloudflare/ });
    await act(async () => resolve(json({ ...anonymous, authenticated: true, email: 'stale@example.com' })));
    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(router.push).not.toHaveBeenCalled();
  });
  it('times out a stalled check and makes retry available', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))));
    mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to check');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });
});

describe('legacy password UI only when explicitly configured by a server', () => {
  async function setup(post: () => Promise<Response>) {
    const fetch = vi.fn().mockResolvedValueOnce(json({ ...anonymous, passwordConfigured: true, accessConfigured: false })).mockImplementation(post);
    vi.stubGlobal('fetch', fetch); mount();
    fireEvent.change(await screen.findByLabelText('Admin email'), { target: { value: 'fixture@example.com' } });
    fireEvent.change(screen.getByLabelText('Admin password'), { target: { value: 'synthetic-password' } });
    return fetch;
  }
  it.each(['network', 'invalid-json', '503', 'denied'])('recovers from %s without changing identity', async failure => {
    const fetch = await setup(() => failure === 'network' ? Promise.reject(new TypeError('offline')) : Promise.resolve(failure === 'invalid-json' ? json({}) : json({}, failure === '503' ? 503 : 403)));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('prevents duplicate submits and ignores late success after cancel', async () => {
    let resolve!: (r: Response) => void;
    const fetch = await setup(() => new Promise(r => { resolve = r; }));
    const form = screen.getByLabelText('Admin email').closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(fetch).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await act(async () => resolve(json({ authenticated: true, email: 'fixture@example.com', provider: 'password' })));
    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
