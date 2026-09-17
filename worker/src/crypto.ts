const encoder = new TextEncoder();

export function timingSafeEqual(a: string, b: string): boolean {
  if (!b) {
    return false;
  }
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const length = Math.max(left.byteLength, right.byteLength);
  let diff = left.byteLength ^ right.byteLength;
  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export async function hmacSha256(
  keyBytes: BufferSource,
  data: string
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(data));
}

export async function hmacSha256Hex(
  keyBytes: BufferSource,
  data: string
): Promise<string> {
  return bytesToHex(new Uint8Array(await hmacSha256(keyBytes, data)));
}

export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function newId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 16);
}

export function nowIso(): string {
  return new Date().toISOString();
}
