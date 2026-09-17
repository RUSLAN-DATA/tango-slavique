export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function photoExtension(mimeType: string): string | null {
  return EXTENSIONS[mimeType] || null;
}

export function validatePhoto(file: {
  type: string;
  size: number;
}): { ok: true; mime: string; ext: string } | { ok: false; message: string } {
  const mime = file.type.toLowerCase();
  const ext = photoExtension(mime);
  if (!ext || !ALLOWED_PHOTO_TYPES.includes(mime as (typeof ALLOWED_PHOTO_TYPES)[number])) {
    return { ok: false, message: "Only JPEG, PNG and WEBP images are allowed." };
  }
  if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
    return { ok: false, message: "Image must be between 1 byte and 10 MB." };
  }
  return { ok: true, mime, ext };
}

export function detectImageType(
  bytes: ArrayBuffer
): { mime: string; ext: string } | null {
  const data = new Uint8Array(bytes);
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (
    data.length >= 12 &&
    data[0] === 0x52 &&
    data[1] === 0x49 &&
    data[2] === 0x46 &&
    data[3] === 0x46 &&
    data[8] === 0x57 &&
    data[9] === 0x45 &&
    data[10] === 0x42 &&
    data[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}
