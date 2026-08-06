export const VAULT_FORMAT = "opskitpro.vault.v1";
export const VAULT_ITERATIONS = 310_000;
export const VAULT_MAX_IMPORT_BYTES = 2_000_000;
export const VAULT_MAX_ENTRIES = 500;

export type VaultEntry = {
  id: string;
  site: string;
  username: string;
  password: string;
  note: string;
  updatedAt: string;
};

export type VaultDocument = { entries: VaultEntry[] };

export type VaultEnvelope = {
  format: typeof VAULT_FORMAT;
  createdAt: string;
  updatedAt: string;
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: number; salt: string };
  cipher: { name: "AES-GCM"; iv: string };
  ciphertext: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string, expectedLength?: number): Uint8Array {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length > 4_000_000) {
    throw new Error("Invalid encrypted vault");
  }
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (expectedLength && bytes.length !== expectedLength) throw new Error("Invalid encrypted vault");
  return bytes;
}

function metadata(envelope: Omit<VaultEnvelope, "ciphertext">): Uint8Array {
  return encoder.encode(JSON.stringify(envelope));
}

function validateEnvelope(value: unknown): VaultEnvelope {
  if (!value || typeof value !== "object") throw new Error("Invalid encrypted vault");
  const envelope = value as VaultEnvelope;
  if (
    envelope.format !== VAULT_FORMAT ||
    envelope.kdf?.name !== "PBKDF2" ||
    envelope.kdf?.hash !== "SHA-256" ||
    !Number.isInteger(envelope.kdf?.iterations) ||
    envelope.kdf.iterations < 100_000 ||
    envelope.kdf.iterations > 2_000_000 ||
    envelope.cipher?.name !== "AES-GCM" ||
    typeof envelope.createdAt !== "string" ||
    typeof envelope.updatedAt !== "string" ||
    typeof envelope.ciphertext !== "string"
  ) {
    throw new Error("Invalid encrypted vault");
  }
  base64ToBytes(envelope.kdf.salt, 16);
  base64ToBytes(envelope.cipher.iv, 12);
  base64ToBytes(envelope.ciphertext);
  return envelope;
}

function validateDocument(value: unknown): VaultDocument {
  if (!value || typeof value !== "object" || !Array.isArray((value as VaultDocument).entries)) {
    throw new Error("Invalid encrypted vault");
  }
  const entries = (value as VaultDocument).entries;
  if (entries.length > VAULT_MAX_ENTRIES) throw new Error("Vault has too many entries");
  for (const entry of entries) {
    if (
      !entry ||
      typeof entry.id !== "string" || entry.id.length > 100 ||
      typeof entry.site !== "string" || entry.site.length > 300 ||
      typeof entry.username !== "string" || entry.username.length > 500 ||
      typeof entry.password !== "string" || entry.password.length > 2_000 ||
      typeof entry.note !== "string" || entry.note.length > 4_000 ||
      typeof entry.updatedAt !== "string"
    ) throw new Error("Invalid encrypted vault");
  }
  return { entries };
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function createVault(password: string): Promise<{ envelope: VaultEnvelope; key: CryptoKey; document: VaultDocument }> {
  if (password.length < 12) throw new Error("Master password must be at least 12 characters");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, VAULT_ITERATIONS);
  const now = new Date().toISOString();
  const base = {
    format: VAULT_FORMAT as typeof VAULT_FORMAT,
    createdAt: now,
    updatedAt: now,
    kdf: { name: "PBKDF2" as const, hash: "SHA-256" as const, iterations: VAULT_ITERATIONS, salt: bytesToBase64(salt) },
  };
  const document = { entries: [] } satisfies VaultDocument;
  const envelope = await encryptVault(document, key, base);
  return { envelope, key, document };
}

export async function encryptVault(
  document: VaultDocument,
  key: CryptoKey,
  previous: Pick<VaultEnvelope, "format" | "createdAt" | "kdf">,
): Promise<VaultEnvelope> {
  validateDocument(document);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base: Omit<VaultEnvelope, "ciphertext"> = {
    format: previous.format,
    createdAt: previous.createdAt,
    kdf: previous.kdf,
    updatedAt: new Date().toISOString(),
    cipher: { name: "AES-GCM", iv: bytesToBase64(iv) },
  };
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: metadata(base) },
    key,
    encoder.encode(JSON.stringify(document)),
  );
  return { ...base, ciphertext: bytesToBase64(new Uint8Array(encrypted)) };
}

export async function unlockVault(envelopeValue: unknown, password: string): Promise<{ envelope: VaultEnvelope; key: CryptoKey; document: VaultDocument }> {
  const envelope = validateEnvelope(envelopeValue);
  const key = await deriveKey(password, base64ToBytes(envelope.kdf.salt, 16), envelope.kdf.iterations);
  const { ciphertext, ...base } = envelope;
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(envelope.cipher.iv, 12), additionalData: metadata(base) },
    key,
    base64ToBytes(ciphertext),
  );
  const document = validateDocument(JSON.parse(decoder.decode(plaintext)));
  return { envelope, key, document };
}

export function parseVaultBackup(text: string): VaultEnvelope {
  if (new Blob([text]).size > VAULT_MAX_IMPORT_BYTES) throw new Error("Backup is too large");
  return validateEnvelope(JSON.parse(text));
}

const DB_NAME = "opskitpro-password-vault";
const STORE_NAME = "vault";
const RECORD_KEY = "primary";

function openVaultDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadStoredVault(): Promise<VaultEnvelope | null> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME);
    const request = transaction.objectStore(STORE_NAME).get(RECORD_KEY);
    request.onsuccess = () => resolve(request.result ? validateEnvelope(request.result) : null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

export async function storeVault(envelope: VaultEnvelope): Promise<void> {
  validateEnvelope(envelope);
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(envelope, RECORD_KEY);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export async function deleteStoredVault(): Promise<void> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(RECORD_KEY);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}
