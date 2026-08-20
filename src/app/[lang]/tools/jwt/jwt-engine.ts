export type JwtLang = "en" | "zh";

export type JwtPart = {
  raw: string;
  decoded: string;
  json: unknown;
  parseError: string | null;
};

export type JwtVerificationState = "unchecked" | "unsigned" | "unsupported" | "no-secret" | "ok" | "mismatch" | "error";

export type JwtAnalysis = {
  isJwt: boolean;
  raw: string;
  parts: {
    header: JwtPart;
    payload: JwtPart;
    signature: string;
  };
  metadata: {
    alg: string;
    typ?: string;
    kid?: string;
    iss?: string;
    sub?: string;
    aud?: string;
    exp?: number | null;
    nbf?: number | null;
    iat?: number | null;
  };
  risks: {
    hasAlgNone: boolean;
    expired: boolean;
    notBefore: boolean;
    malformed: boolean;
    malformedMessage?: string;
  };
  verification: {
    state: JwtVerificationState;
    algorithm?: string;
    message?: string;
  };
};

const ALLOWED_ALGORITHMS = new Set(["HS256", "HS384", "HS512", "NONE"]);

function base64UrlDecodeToUtf8(input: string): string {
  if (!/^[A-Za-z0-9_-]*$/.test(input)) {
    throw new Error("Invalid base64url characters");
  }

  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const withPadding = normalized + "=".repeat(paddingLength);
  const bytes = Uint8Array.from(atob(withPadding), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function parseJwtPart(raw: string): JwtPart {
  if (!raw) {
    return { raw, decoded: "", json: null, parseError: "Empty part" };
  }

  try {
    const decoded = base64UrlDecodeToUtf8(raw);
    const parsed = JSON.parse(decoded);
    return { raw, decoded, json: parsed, parseError: null };
  } catch (error) {
    return {
      raw,
      decoded: "",
      json: null,
      parseError: error instanceof Error ? error.message : "Invalid JWT part",
    };
  }
}

function toNumericClaim(input: unknown): number | null {
  if (typeof input !== "number") return null;
  if (!Number.isFinite(input) || input < 0) return null;
  return Math.trunc(input);
}

function constantTimeEquals(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

function toBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function readObjectField(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

export function isJwtObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function analyzeJwt(token: string, secret: string): JwtAnalysis {
  const raw = token.trim();

  const segments = raw.split(".");
  if (segments.length !== 3) {
    return {
      isJwt: false,
      raw,
      parts: {
        header: { raw: "", decoded: "", json: null, parseError: "JWT must have exactly 3 parts" },
        payload: { raw: "", decoded: "", json: null, parseError: "JWT must have exactly 3 parts" },
        signature: "",
      },
      metadata: { alg: "" },
      risks: {
        hasAlgNone: false,
        expired: false,
        notBefore: false,
        malformed: true,
        malformedMessage: "Malformed token segments",
      },
      verification: {
        state: "error",
        message: "Malformed JWT format",
      },
    };
  }

  const [headerRaw, payloadRaw, signature] = segments;

  const header = parseJwtPart(headerRaw);
  const payload = parseJwtPart(payloadRaw);

  const malformed = Boolean(header.parseError || payload.parseError);
  const headerObj = header.json;
  const payloadObj = payload.json;

  const alg = isJwtObject(headerObj) && "alg" in headerObj
    ? String(headerObj.alg || "").trim().toUpperCase()
    : "";

  const typ = isJwtObject(headerObj) && "typ" in headerObj
    ? String(headerObj.typ || "")
    : undefined;
  const kid = isJwtObject(headerObj) && "kid" in headerObj
    ? String(headerObj.kid || "")
    : undefined;

  const claims = isJwtObject(payloadObj) ? payloadObj : null;
  const iss = claims ? readObjectField(claims, "iss") : undefined;
  const sub = claims ? readObjectField(claims, "sub") : undefined;
  const aud = claims ? readObjectField(claims, "aud") : undefined;
  const exp = claims ? toNumericClaim(claims.exp) : null;
  const nbf = claims ? toNumericClaim(claims.nbf) : null;
  const iat = claims ? toNumericClaim(claims.iat) : null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const hasAlgNone = alg === "NONE";
  const expired = typeof exp === "number" ? exp < nowSeconds : false;
  const notBefore = typeof nbf === "number" ? nbf > nowSeconds : false;

  const verification: JwtAnalysis["verification"] = { state: "unchecked" };
  if (!ALLOWED_ALGORITHMS.has(alg)) {
    verification.state = "unsupported";
    verification.algorithm = alg || "unknown";
    verification.message = "Unsupported or missing algorithm";
  } else if (alg === "NONE") {
    verification.state = "unsigned";
    verification.algorithm = alg;
    verification.message = "Unsigned token. Do not trust it for authentication.";
  } else if (!secret && alg.startsWith("HS")) {
    verification.state = "no-secret";
    verification.algorithm = alg;
    verification.message = "Set secret to verify HMAC signature.";
  } else if (!isJwtObject(headerObj) || !isJwtObject(payloadObj)) {
    verification.state = "error";
    verification.message = "Header or payload is not valid JSON.";
  } else {
    verification.state = "unchecked";
    verification.algorithm = alg;
    verification.message = "Ready to verify";
  }

  return {
    isJwt: true,
    raw,
    parts: { header, payload, signature },
    metadata: {
      alg,
      typ,
      kid,
      iss,
      sub,
      aud,
      exp,
      nbf,
      iat,
    },
    risks: {
      hasAlgNone,
      expired,
      notBefore,
      malformed,
      malformedMessage: malformed ? (header.parseError || payload.parseError || undefined) : undefined,
    },
    verification,
  };
}

export async function verifyJwtSignature(token: string, secret: string, expectedAlgorithm: string): Promise<{ ok: boolean; message?: string }>
{
  const segments = token.trim().split(".");
  if (segments.length !== 3) return { ok: false, message: "Malformed JWT format" };
  const [headerSegment, payloadSegment, signatureSegment] = segments;

  const signingInput = `${headerSegment}.${payloadSegment}`;
  if (expectedAlgorithm === "none") {
    return { ok: signatureSegment.length === 0, message: signatureSegment.length === 0 ? "No signature as expected" : "Signature segment should be empty for alg=none" };
  }

  if (!secret) return { ok: false, message: "Secret required" };

  const algorithm = expectedAlgorithm || "HS256";
  let hash: AlgorithmIdentifier = "SHA-256";
  if (algorithm === "HS384") hash = "SHA-384";
  else if (algorithm === "HS512") hash = "SHA-512";
  else if (algorithm === "HS256") hash = "SHA-256";
  else return { ok: false, message: "Unsupported algorithm" };

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash },
      false,
      ["sign"],
    );
    const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
    const expected = toBase64Url(signed);
    if (expected.length !== signatureSegment.length) {
      return { ok: false, message: "Signature length mismatch" };
    }
    if (!constantTimeEquals(expected, signatureSegment)) {
      return { ok: false, message: "Signature mismatch" };
    }
    return { ok: true, message: "Signature valid" };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Signature check failed" };
  }
}

export function formatNumericDate(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  try {
    return new Date(value * 1000).toISOString();
  } catch {
    return "";
  }
}

export const JWT_TEXT_LIMIT = 30000;
