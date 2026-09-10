import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { PHOTO_MAX_BYTES, PHOTO_MIME } from "@/lib/constants";

const ROOT = path.join(process.cwd(), "storage", "private", "photos");

export function isAllowedPhoto(mimeType: string, byteSize: number) {
  return (PHOTO_MIME as readonly string[]).includes(mimeType) && byteSize <= PHOTO_MAX_BYTES;
}

export async function savePrivatePhoto(buffer: Buffer, mimeType: string) {
  await mkdir(ROOT, { recursive: true });
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const storageKey = `${randomBytes(16).toString("hex")}.${extension}`;
  await writeFile(path.join(ROOT, storageKey), buffer);
  return storageKey;
}

export async function readPrivatePhoto(storageKey: string) {
  if (!/^[a-f0-9]+\.(jpg|png|webp)$/.test(storageKey)) {
    throw new Error("Invalid storage key");
  }
  return readFile(path.join(ROOT, storageKey));
}
