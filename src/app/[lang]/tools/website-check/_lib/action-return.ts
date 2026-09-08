import type { RequestFailure } from "./result-experience";

export type DiagnosticReturn = {
  domain: string;
  result: any;
  error: string | null;
  failure: RequestFailure | null;
  localResolvers: Record<string, any>;
  openDetails: number[];
  actionId: string;
  scrollY: number;
};
const stateKey = "opskitWebsiteActionReturn";
// Tab-memory only. No response data in history, URLs, storage or the server.
const entries = new Map<string, { url: string; snapshot: DiagnosticReturn }>();
let sequence = 0;

export function saveDiagnosticReturn(snapshot: DiagnosticReturn) {
  const id = `website-return-${++sequence}`;
  entries.set(id, { url: window.location.href, snapshot });
  if (entries.size > 8) entries.delete(entries.keys().next().value!);
  window.history.replaceState({ ...window.history.state, [stateKey]: id }, "");
}

export function readDiagnosticReturn(): DiagnosticReturn | null {
  const entry = entries.get(window.history.state?.[stateKey]);
  return entry?.url === window.location.href ? entry.snapshot : null;
}

export function clearDiagnosticReturn() {
  const id = window.history.state?.[stateKey];
  if (!id) return;
  entries.delete(id);
  const state = { ...window.history.state };
  delete state[stateKey];
  window.history.replaceState(state, "");
}
