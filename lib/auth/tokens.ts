import { createHash, randomBytes } from "crypto";

export function generateToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function publicApplicationCode() {
  return `TS-${randomBytes(4).toString("hex").toUpperCase()}`;
}
