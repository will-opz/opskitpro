"use client";

import { useReducer } from "react";

type Snapshot<T> = { value: T; revision: number };
type State<T> = { input: string; revision: number; snapshot: Snapshot<T> | null };
type Action<T> =
  | { type: "input"; input: string }
  | { type: "result"; value: T; revision: number }
  | { type: "clear-result" }
  | { type: "invalidate" }
  | { type: "reset" };

function reduce<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case "input":
      return action.input === state.input ? state : { ...state, input: action.input, revision: state.revision + 1 };
    case "result":
      // Async tools must pass the revision captured when their run began.
      return action.revision === state.revision
        ? { ...state, snapshot: { value: action.value, revision: action.revision } }
        : state;
    case "invalidate": return { ...state, revision: state.revision + 1 };
    case "clear-result": return { ...state, snapshot: null };
    case "reset": return { input: "", revision: state.revision + 1, snapshot: null };
  }
}

/** Input and result provenance stay in memory; never persisted or sent anywhere.
 * Tools with configurable transforms must call invalidate() when options change.
 */
export function useLocalToolResult<T>() {
  const [state, dispatch] = useReducer(reduce<T>, { input: "", revision: 0, snapshot: null });
  const status = !state.snapshot ? "idle" : state.snapshot.revision === state.revision ? "fresh" : "stale";
  return {
    input: state.input,
    revision: state.revision,
    result: state.snapshot?.value ?? null,
    status,
    canUseResult: status === "fresh",
    setInput: (input: string) => dispatch({ type: "input", input }),
    publish: (value: T, revision = state.revision) => dispatch({ type: "result", value, revision }),
    invalidate: () => dispatch({ type: "invalidate" }),
    clearResult: () => dispatch({ type: "clear-result" }),
    reset: () => dispatch({ type: "reset" }),
  };
}
