/** Bound even non-cancellable local storage and mocked/late network promises. */
export function withinBudget<T>(work: Promise<T>, milliseconds: number, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const aborted = () => finish(() => reject(signal?.reason ?? new DOMException("Cancelled", "AbortError")));
    const timer = setTimeout(() => finish(() => reject(new DOMException("Request timed out", "TimeoutError"))), milliseconds);
    const finish = (callback: () => void) => { clearTimeout(timer); signal?.removeEventListener("abort", aborted); callback(); };
    // Attach rejection handling even when cancellation happened before entry.
    work.then(value => finish(() => resolve(value)), error => finish(() => reject(error)));
    if (signal?.aborted) { aborted(); return; }
    signal?.addEventListener("abort", aborted, { once: true });
  });
}
