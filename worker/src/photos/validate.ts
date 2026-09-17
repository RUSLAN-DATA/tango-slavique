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
