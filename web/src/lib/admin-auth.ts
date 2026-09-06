import { NextRequest, NextResponse } from "next/server";

const SESSION_TTL_SECONDS = 60 * 60 * 12;
const TOKEN_PREFIX = "atlas.v1.";

export function getAdminCredentials(): { user: string; pass: string } | null {
  const user = process.env.ADMIN_USER || process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASS || process.env.ADMIN_PASSWORD;

  if (user && pass) return { user, pass };

  return null;
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const creds = getAdminCredentials();
  if (!creds) return false;
  const enc = new TextEncoder();
  const userHash = await crypto.subtle.digest("SHA-256", enc.encode(username));
  const passHash = await crypto.subtle.digest("SHA-256", enc.encode(password));
  const expUser = await crypto.subtle.digest("SHA-256", enc.encode(creds.user));
  const expPass = await crypto.subtle.digest("SHA-256", enc.encode(creds.pass));
  return (
    bytesSafeEqual(new Uint8Array(userHash), new Uint8Array(expUser)) &&
    bytesSafeEqual(new Uint8Array(passHash), new Uint8Array(expPass))
  );
}

function signingKey(): string {
  return process.env.AUTH_SECRET || "";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(input: string): Uint8Array {
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

export async function generateSessionToken(username: string): Promise<string> {
  if (!signingKey()) {
    throw new Error("AUTH_SECRET not configured; cannot issue session tokens");
  }
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ sub: username, exp: expiresAt })));
  const signature = await hmacBase64Url(payload, signingKey());
  return `${TOKEN_PREFIX}${payload}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<{ sub: string } | null> {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  if (!signingKey()) return null;
  const [payload, signature] = token.slice(TOKEN_PREFIX.length).split(".");
  if (!payload || !signature) return null;

  const expected = await hmacBase64Url(payload, signingKey());
  const signatureBuf = base64UrlToBytes(signature);
  const expectedBuf = base64UrlToBytes(expected);
  if (signatureBuf.length !== expectedBuf.length || !bytesSafeEqual(signatureBuf, expectedBuf)) {
    return null;
  }

  let decoded: { sub?: string; exp?: number };
  try {
    decoded = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));
  } catch {
    return null;
  }
  if (!decoded.sub || !decoded.exp) return null;
  if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

  return { sub: decoded.sub };
}

function bytesSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireAuth(
  request: NextRequest
): Promise<{ ok: true; user: string } | { ok: false }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false };
  }
  const result = await verifySessionToken(authHeader.slice("Bearer ".length).trim());
  if (!result) return { ok: false };
  return { ok: true, user: result.sub };
}
