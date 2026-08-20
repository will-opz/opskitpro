type UuidVersion = "v1" | "v3" | "v4" | "v5";

export type UuidValidation = {
  isValid: boolean;
  version: string;
  normalized: string;
  normalizedMatchesInput?: boolean;
};

const UUID_V1_EPOCH_MS = 12_219_292_800_000;
const UINT32_SIZE = 0x1_0000_0000;
const UINT16_SIZE = 0x1_0000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const UUID_LIMIT = 200;

export const UUID_VERSIONS: UuidVersion[] = ["v1", "v3", "v4", "v5"];

type UuidV1State = {
  lastUnixMs: number;
  tickWithinMs: number;
  clockSeq: number;
  nodeId: Uint8Array;
};

let uuidV1State: UuidV1State | null = null;

function getRandomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function initUuidV1State(): UuidV1State {
  const nodeId = getRandomBytes(6);
  nodeId[0] |= 0x01;
  const clockSeqBytes = getRandomBytes(2);
  return {
    lastUnixMs: -1,
    tickWithinMs: 0,
    clockSeq: ((clockSeqBytes[0] << 8) | clockSeqBytes[1]) & 0x3fff,
    nodeId,
  };
}

function getUuidV1State() {
  if (!uuidV1State) {
    uuidV1State = initUuidV1State();
  }
  return uuidV1State;
}

function buildUuidFromBytes(bytes: Uint8Array) {
  const h = Array.from(bytes, (value) => toHex(value));
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
}

export function generateUuidV1(): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure random source is unavailable");
  }

  const state = getUuidV1State();
  const nowMs = Date.now();
  if (state.lastUnixMs === nowMs) {
    state.tickWithinMs = (state.tickWithinMs + 1) % 10_000;
    if (state.tickWithinMs === 0) state.clockSeq = (state.clockSeq + 1) & 0x3fff;
  } else {
    if (nowMs < state.lastUnixMs) state.clockSeq = (state.clockSeq + 1) & 0x3fff;
    state.lastUnixMs = nowMs;
    state.tickWithinMs = 0;
  }

  const gregorianMs = nowMs + UUID_V1_EPOCH_MS;
  const lowMilliseconds = gregorianMs % UINT32_SIZE;
  const highMilliseconds = Math.floor(gregorianMs / UINT32_SIZE);
  const lowTicks = (lowMilliseconds * 10_000) + state.tickWithinMs;
  const timeLow = lowTicks % UINT32_SIZE;
  const highTicks = (highMilliseconds * 10_000) + Math.floor(lowTicks / UINT32_SIZE);
  const timeMid = highTicks % UINT16_SIZE;
  const timeHi = Math.floor(highTicks / UINT16_SIZE) & 0x0fff;

  const bytes = new Uint8Array(16);
  bytes[0] = (timeLow >>> 24) & 0xff;
  bytes[1] = (timeLow >>> 16) & 0xff;
  bytes[2] = (timeLow >>> 8) & 0xff;
  bytes[3] = timeLow & 0xff;
  bytes[4] = (timeMid >>> 8) & 0xff;
  bytes[5] = timeMid & 0xff;
  bytes[6] = ((timeHi >>> 8) & 0x0f) | 0x10;
  bytes[7] = timeHi & 0xff;
  bytes[8] = ((state.clockSeq >>> 8) & 0x3f) | 0x80;
  bytes[9] = state.clockSeq & 0xff;
  state.nodeId = state.nodeId || getRandomBytes(6);
  bytes.set(state.nodeId, 10);

  return buildUuidFromBytes(bytes);
}

export function normalizeUuid(input: string) {
  return input.trim().toLowerCase();
}

export function isValidUuid(input: string): UuidValidation {
  const normalized = normalizeUuid(input);
  const match = UUID_PATTERN.test(normalized);
  if (!match) {
    return { isValid: false, version: "", normalized };
  }
  const version = normalized[14];
  return { isValid: true, version, normalized, normalizedMatchesInput: normalized === input.trim().toLowerCase() };
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

export function generateUuidV4(): string {
  if (typeof crypto === "undefined" || !crypto.randomUUID) {
    return generateUuidV4Fallback();
  }
  return crypto.randomUUID();
}

function generateUuidV4Fallback() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const h = Array.from(bytes, (value) => toHex(value));
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
}

function uuidToBytes(normalized: string) {
  const clean = normalized.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let index = 0; index < 16; index += 1) {
    bytes[index] = Number.parseInt(clean.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function bytesToUuid(bytes: Uint8Array) {
  return buildUuidFromBytes(bytes);
}

export async function generateUuidV5(namespaceUuid: string, name: string): Promise<string> {
  const ns = normalizeUuid(namespaceUuid);
  if (!UUID_PATTERN.test(ns)) {
    throw new Error("Invalid namespace UUID");
  }

  if (!name.trim()) {
    throw new Error("Name is required for v5");
  }

  const nsBytes = uuidToBytes(ns);
  const nameBytes = new TextEncoder().encode(name);
  const input = new Uint8Array(nsBytes.length + nameBytes.length);
  input.set(nsBytes);
  input.set(nameBytes, nsBytes.length);

  const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", input));
  const bytes = hash.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

export async function generateUuid(version: UuidVersion, namespaceUuid?: string, name?: string) {
  if (version === "v4") {
    return generateUuidV4();
  }

  if (version === "v1") {
    return generateUuidV1();
  }

  if (version === "v5") {
    if (!namespaceUuid || !name) {
      throw new Error("v5 requires namespace and name");
    }
    return generateUuidV5(namespaceUuid, name);
  }

  throw new Error(`${version} generation is not available in this MVP`);
}
