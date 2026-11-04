import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "atlas_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;
const TOKEN_PREFIX = "atlas.v2.";

type SessionPayload = {
  v: 2;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  credentialVersion: string;
};

export function getAdminCredentials(): { user: string; pass: string } | null {
  const user = process.env.ADMIN_USER || process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASS || process.env.ADMIN_PASSWORD;

  if (typeof user === "string" && user.trim() && typeof pass === "string" && pass.length) {
    return { user: user.trim(), pass };
  }

  return null;
}

function signingKey(): string {
  const key = process.env.AUTH_SECRET || "";
  if (new TextEncoder().encode(key).length < 32) return "";
  return key;
}

export function isAuthConfigured(): boolean {
  return getAdminCredentials() !== null && signingKey().length >= 32;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

function bytesSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(input: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(input)) throw new Error("Invalid base64url input");
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacBase64Url(data: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const keyBuf = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", keyBuf, enc.encode(data));
  return bytesToBase64Url(new Uint8Array(sigBuf));
}

async function getCredentialVersion(): Promise<string> {
  const credentials = getAdminCredentials();
  if (!credentials) return "";
  const value = `${credentials.user}\0${credentials.pass}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const credentials = getAdminCredentials();
  if (!credentials || !signingKey()) return false;

  const enc = new TextEncoder();
  const [userHash, passHash, expectedUserHash, expectedPassHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(username)),
    crypto.subtle.digest("SHA-256", enc.encode(password)),
    crypto.subtle.digest("SHA-256", enc.encode(credentials.user)),
    crypto.subtle.digest("SHA-256", enc.encode(credentials.pass)),
  ]);

  return (
    bytesSafeEqual(new Uint8Array(userHash), new Uint8Array(expectedUserHash)) &&
    bytesSafeEqual(new Uint8Array(passHash), new Uint8Array(expectedPassHash))
  );
}

export async function generateSessionToken(username: string): Promise<string> {
  const key = signingKey();
  if (!key || !getAdminCredentials()) {
    throw new Error("Admin authentication is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    v: 2,
    sub: username,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    jti: crypto.randomUUID(),
    credentialVersion: await getCredentialVersion(),
  };
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacBase64Url(encodedPayload, key);
  return `${TOKEN_PREFIX}${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<{ sub: string; exp: number } | null> {
  const key = signingKey();
  if (!key || typeof token !== "string" || token.length > 4096 || !token.startsWith(TOKEN_PREFIX)) {
    return null;
  }

  const parts = token.slice(TOKEN_PREFIX.length).split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  try {
    const expected = await hmacBase64Url(parts[0], key);
    const providedSignature = base64UrlToBytes(parts[1]);
    const expectedSignature = base64UrlToBytes(expected);
    if (!bytesSafeEqual(providedSignature, expectedSignature)) return null;

    const payload = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(base64UrlToBytes(parts[0]))
    ) as Partial<SessionPayload>;

    const now = Math.floor(Date.now() / 1000);
    const credentials = getAdminCredentials();
    if (
      payload.v !== 2 ||
      typeof payload.sub !== "string" ||
      !payload.sub ||
      !credentials ||
      payload.sub !== credentials.user ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number" ||
      typeof payload.jti !== "string" ||
      typeof payload.credentialVersion !== "string" ||
      payload.iat > now + 60 ||
      payload.exp <= now ||
      payload.exp <= payload.iat ||
      payload.exp - payload.iat > SESSION_TTL_SECONDS ||
      payload.credentialVersion !== (await getCredentialVersion())
    ) {
      return null;
    }

    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

export async function requireAuth(
  request: NextRequest
): Promise<{ ok: true; user: string } | { ok: false }> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { ok: false };

  // Cookie-authenticated writes must originate from this exact origin.
  // GET/HEAD/OPTIONS requests are read-only and do not require an Origin header.
  const method = request.method.toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !isSameOriginRequest(request)) {
    return { ok: false };
  }

  const session = await verifySessionToken(token);
  if (!session) return { ok: false };
  return { ok: true, user: session.sub };
}
