/**
 * Session management for FlareUp
 *
 * The CF API token is encrypted with APP_SECRET and stored in an HttpOnly cookie.
 * It never touches localStorage, sessionStorage, or any database.
 * JS running on the page cannot read it — XSS gets nothing.
 */

const COOKIE_NAME = "flareup_session";
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret.padEnd(32, "0").slice(0, 32)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("flareup-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptSession(
  data: SessionData,
  secret: string
): Promise<string> {
  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(JSON.stringify(data))
  );

  // Combine iv + ciphertext, encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptSession(
  token: string,
  secret: string
): Promise<SessionData | null> {
  try {
    const combined = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const key = await getKey(secret);
    const dec = new TextDecoder();

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return JSON.parse(dec.decode(decrypted)) as SessionData;
  } catch {
    return null;
  }
}

export type SessionData = {
  token: string;
  accountId: string;
  tokenId: string;
  expiresAt: number; // unix ms
};

export function makeSessionCookie(encrypted: string, maxAgeSeconds = 28800): string {
  return [
    `${COOKIE_NAME}=${encrypted}`,
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`,
    "Path=/",
  ].join("; ");
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/`;
}

export function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}